package com.deployguard.service.impl;

import com.deployguard.audit.AuditService;
import com.deployguard.dto.request.ProjectCreateRequest;
import com.deployguard.dto.request.ProjectUpdateRequest;
import com.deployguard.dto.response.PagedResponse;
import com.deployguard.dto.response.ProjectResponse;
import com.deployguard.entity.Project;
import com.deployguard.entity.User;
import com.deployguard.entity.enums.AuditAction;
import com.deployguard.entity.enums.ProjectStatus;
import com.deployguard.exception.ConflictException;
import com.deployguard.exception.ResourceNotFoundException;
import com.deployguard.mapper.ProjectMapper;
import com.deployguard.repository.DeploymentRepository;
import com.deployguard.repository.ProjectRepository;
import com.deployguard.repository.RiskRepository;
import com.deployguard.repository.TaskRepository;
import com.deployguard.repository.UserRepository;
import com.deployguard.service.ProjectService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashSet;
import java.util.Set;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class ProjectServiceImpl implements ProjectService {

    private final ProjectRepository projectRepository;
    private final UserRepository userRepository;
    private final TaskRepository taskRepository;
    private final RiskRepository riskRepository;
    private final DeploymentRepository deploymentRepository;
    private final ProjectMapper projectMapper;
    private final AuditService auditService;

    @Override
    @Transactional
    public ProjectResponse createProject(ProjectCreateRequest request) {
        String cleanKey = request.getKey().trim().toUpperCase();
        if (projectRepository.existsByKey(cleanKey)) {
            throw new ConflictException("Project key already exists: " + cleanKey);
        }

        String username = SecurityContextHolder.getContext().getAuthentication().getName();
        User currentUser = userRepository.findByUsername(username)
                .orElseThrow(() -> new ResourceNotFoundException("Authenticated user not found."));

        Set<User> members = new HashSet<>();
        members.add(currentUser);

        if (request.getMemberIds() != null && !request.getMemberIds().isEmpty()) {
            members.addAll(userRepository.findAllById(request.getMemberIds()));
        }

        Project project = Project.builder()
                .name(request.getName().trim())
                .key(cleanKey)
                .description(request.getDescription())
                .status(request.getStatus() != null ? request.getStatus() : ProjectStatus.PLANNED)
                .priority(request.getPriority())
                .startDate(request.getStartDate())
                .targetEndDate(request.getTargetEndDate())
                .archived(false)
                .createdBy(currentUser)
                .members(members)
                .build();

        Project savedProject = projectRepository.save(project);

        auditService.logCurrent(AuditAction.PROJECT_CREATED, "PROJECT", savedProject.getId().toString(),
                "Created project '" + savedProject.getName() + "' [" + savedProject.getKey() + "]");

        return projectMapper.toResponse(savedProject, 0, 0, 0);
    }

    @Override
    @Transactional
    public ProjectResponse updateProject(UUID id, ProjectUpdateRequest request) {
        Project project = projectRepository.findWithDetailsById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Project", "id", id));

        if (request.getName() != null && !request.getName().isBlank()) {
            project.setName(request.getName().trim());
        }
        if (request.getDescription() != null) {
            project.setDescription(request.getDescription());
        }
        if (request.getStatus() != null) {
            project.setStatus(request.getStatus());
        }
        if (request.getPriority() != null) {
            project.setPriority(request.getPriority());
        }
        if (request.getStartDate() != null) {
            project.setStartDate(request.getStartDate());
        }
        if (request.getTargetEndDate() != null) {
            project.setTargetEndDate(request.getTargetEndDate());
        }
        if (request.getActualEndDate() != null) {
            project.setActualEndDate(request.getActualEndDate());
        }
        if (request.getArchived() != null) {
            project.setArchived(request.getArchived());
        }
        if (request.getMemberIds() != null) {
            Set<User> newMembers = new HashSet<>(userRepository.findAllById(request.getMemberIds()));
            if (project.getCreatedBy() != null) {
                newMembers.add(project.getCreatedBy());
            }
            project.setMembers(newMembers);
        }

        Project updated = projectRepository.save(project);

        auditService.logCurrent(AuditAction.PROJECT_UPDATED, "PROJECT", updated.getId().toString(),
                "Updated project '" + updated.getName() + "' [" + updated.getKey() + "]");

        long taskCount = taskRepository.findByProjectId(id).size();
        return projectMapper.toResponse(updated, taskCount, 0, 0);
    }

    @Override
    @Transactional(readOnly = true)
    public ProjectResponse getProjectById(UUID id) {
        Project project = projectRepository.findWithDetailsById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Project", "id", id));

        long taskCount = taskRepository.findByProjectId(id).size();
        return projectMapper.toResponse(project, taskCount, 0, 0);
    }

    @Override
    @Transactional(readOnly = true)
    public PagedResponse<ProjectResponse> getProjects(ProjectStatus status, Boolean archived, Pageable pageable) {
        Specification<Project> spec = (root, query, cb) -> {
            var predicates = cb.conjunction();
            if (status != null) {
                predicates = cb.and(predicates, cb.equal(root.get("status"), status));
            }
            if (archived != null) {
                predicates = cb.and(predicates, cb.equal(root.get("archived"), archived));
            } else {
                predicates = cb.and(predicates, cb.equal(root.get("archived"), false));
            }
            return predicates;
        };

        Page<Project> page = projectRepository.findAll(spec, pageable);
        return PagedResponse.of(page.map(project -> {
            long taskCount = taskRepository.findByProjectId(project.getId()).size();
            return projectMapper.toResponse(project, taskCount, 0, 0);
        }));
    }

    @Override
    @Transactional
    public void archiveProject(UUID id) {
        Project project = projectRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Project", "id", id));
        project.setArchived(true);
        projectRepository.save(project);

        auditService.logCurrent(AuditAction.PROJECT_ARCHIVED, "PROJECT", id.toString(),
                "Archived project: " + project.getName());
    }

    @Override
    @Transactional
    public void deleteProject(UUID id) {
        Project project = projectRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Project", "id", id));
        projectRepository.delete(project);

        auditService.logCurrent(AuditAction.PROJECT_ARCHIVED, "PROJECT", id.toString(),
                "Deleted project: " + project.getName());
    }
}
