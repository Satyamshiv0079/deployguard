package com.deployguard.service.impl;

import com.deployguard.audit.AuditService;
import com.deployguard.dto.request.TaskCreateRequest;
import com.deployguard.dto.request.TaskUpdateRequest;
import com.deployguard.dto.response.PagedResponse;
import com.deployguard.dto.response.TaskResponse;
import com.deployguard.entity.Project;
import com.deployguard.entity.Task;
import com.deployguard.entity.User;
import com.deployguard.entity.enums.AuditAction;
import com.deployguard.entity.enums.TaskStatus;
import com.deployguard.exception.BadRequestException;
import com.deployguard.exception.ResourceNotFoundException;
import com.deployguard.mapper.TaskMapper;
import com.deployguard.repository.ProjectRepository;
import com.deployguard.repository.TaskRepository;
import com.deployguard.repository.UserRepository;
import com.deployguard.service.TaskService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class TaskServiceImpl implements TaskService {

    private final TaskRepository taskRepository;
    private final ProjectRepository projectRepository;
    private final UserRepository userRepository;
    private final TaskMapper taskMapper;
    private final AuditService auditService;

    @Override
    @Transactional
    public TaskResponse createTask(TaskCreateRequest request) {
        Project project = projectRepository.findById(request.getProjectId())
                .orElseThrow(() -> new ResourceNotFoundException("Project", "id", request.getProjectId()));

        String username = SecurityContextHolder.getContext().getAuthentication().getName();
        User reporter = userRepository.findByUsername(username)
                .orElseThrow(() -> new ResourceNotFoundException("Current user not found."));

        User assignee = null;
        if (request.getAssigneeId() != null) {
            assignee = userRepository.findById(request.getAssigneeId())
                    .orElseThrow(() -> new ResourceNotFoundException("Assignee", "id", request.getAssigneeId()));
        }

        Set<Task> dependencies = new HashSet<>();
        if (request.getDependencyTaskIds() != null && !request.getDependencyTaskIds().isEmpty()) {
            List<Task> foundDeps = taskRepository.findAllById(request.getDependencyTaskIds());
            for (Task dep : foundDeps) {
                if (!dep.getProject().getId().equals(project.getId())) {
                    throw new BadRequestException("Dependency task '" + dep.getTitle() + "' must belong to the same project.");
                }
                dependencies.add(dep);
            }
        }

        Task task = Task.builder()
                .title(request.getTitle().trim())
                .description(request.getDescription())
                .status(request.getStatus() != null ? request.getStatus() : TaskStatus.TODO)
                .priority(request.getPriority())
                .dueDate(request.getDueDate())
                .blockedReason(request.getBlockedReason())
                .project(project)
                .reporter(reporter)
                .assignee(assignee)
                .dependencies(dependencies)
                .build();

        Task savedTask = taskRepository.save(task);

        auditService.logCurrent(AuditAction.TASK_CREATED, "TASK", savedTask.getId().toString(),
                "Created task '" + savedTask.getTitle() + "' under project " + project.getKey());

        return taskMapper.toResponse(savedTask);
    }

    @Override
    @Transactional
    public TaskResponse updateTask(UUID id, TaskUpdateRequest request) {
        Task task = taskRepository.findWithDetailsById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Task", "id", id));

        if (request.getTitle() != null && !request.getTitle().isBlank()) {
            task.setTitle(request.getTitle().trim());
        }
        if (request.getDescription() != null) {
            task.setDescription(request.getDescription());
        }
        if (request.getStatus() != null) {
            task.setStatus(request.getStatus());
            // If moved out of BLOCKED, clear blockedReason unless explicitly passed
            if (request.getStatus() != TaskStatus.BLOCKED && request.getBlockedReason() == null) {
                task.setBlockedReason(null);
            }
        }
        if (request.getPriority() != null) {
            task.setPriority(request.getPriority());
        }
        if (request.getDueDate() != null) {
            task.setDueDate(request.getDueDate());
        }
        if (request.getBlockedReason() != null) {
            task.setBlockedReason(request.getBlockedReason());
        }
        if (request.getAssigneeId() != null) {
            User assignee = userRepository.findById(request.getAssigneeId())
                    .orElseThrow(() -> new ResourceNotFoundException("Assignee", "id", request.getAssigneeId()));
            task.setAssignee(assignee);
        }

        if (request.getDependencyTaskIds() != null) {
            if (request.getDependencyTaskIds().contains(task.getId())) {
                throw new BadRequestException("Task cannot depend on itself.");
            }

            Set<Task> newDeps = new HashSet<>();
            for (UUID depId : request.getDependencyTaskIds()) {
                Task depTask = taskRepository.findById(depId)
                        .orElseThrow(() -> new ResourceNotFoundException("Dependency Task", "id", depId));
                if (!depTask.getProject().getId().equals(task.getProject().getId())) {
                    throw new BadRequestException("Dependency task must belong to the same project.");
                }
                // Check direct circular dependency
                if (depTask.getDependencies().stream().anyMatch(d -> d.getId().equals(task.getId()))) {
                    throw new BadRequestException("Circular dependency detected with task: " + depTask.getTitle());
                }
                newDeps.add(depTask);
            }
            task.setDependencies(newDeps);
        }

        Task updated = taskRepository.save(task);

        auditService.logCurrent(AuditAction.TASK_UPDATED, "TASK", updated.getId().toString(),
                "Updated task '" + updated.getTitle() + "' [Status: " + updated.getStatus() + "]");

        return taskMapper.toResponse(updated);
    }

    @Override
    @Transactional(readOnly = true)
    public TaskResponse getTaskById(UUID id) {
        Task task = taskRepository.findWithDetailsById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Task", "id", id));
        return taskMapper.toResponse(task);
    }

    @Override
    @Transactional(readOnly = true)
    public PagedResponse<TaskResponse> getTasks(UUID projectId, UUID assigneeId, TaskStatus status, Boolean overdue, Pageable pageable) {
        Specification<Task> spec = (root, query, cb) -> {
            var predicates = cb.conjunction();
            if (projectId != null) {
                predicates = cb.and(predicates, cb.equal(root.get("project").get("id"), projectId));
            }
            if (assigneeId != null) {
                predicates = cb.and(predicates, cb.equal(root.get("assignee").get("id"), assigneeId));
            }
            if (status != null) {
                predicates = cb.and(predicates, cb.equal(root.get("status"), status));
            }
            if (Boolean.TRUE.equals(overdue)) {
                predicates = cb.and(
                        predicates,
                        cb.lessThan(root.get("dueDate"), LocalDate.now()),
                        cb.notEqual(root.get("status"), TaskStatus.DONE)
                );
            }
            return predicates;
        };

        Page<Task> page = taskRepository.findAll(spec, pageable);
        return PagedResponse.of(page.map(taskMapper::toResponse));
    }

    @Override
    @Transactional(readOnly = true)
    public List<TaskResponse> getTasksByProject(UUID projectId) {
        return taskRepository.findByProjectId(projectId).stream()
                .map(taskMapper::toResponse)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional
    public void deleteTask(UUID id) {
        Task task = taskRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Task", "id", id));
        taskRepository.delete(task);

        auditService.logCurrent(AuditAction.TASK_DELETED, "TASK", id.toString(),
                "Deleted task: " + task.getTitle());
    }
}
