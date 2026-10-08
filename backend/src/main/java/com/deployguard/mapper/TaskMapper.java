package com.deployguard.mapper;

import com.deployguard.dto.response.TaskResponse;
import com.deployguard.entity.Task;
import com.deployguard.entity.enums.TaskStatus;
import org.springframework.stereotype.Component;

import java.time.LocalDate;
import java.util.Collections;
import java.util.stream.Collectors;

@Component
public class TaskMapper {

    public TaskResponse toResponse(Task task) {
        if (task == null) return null;

        boolean isOverdue = task.getDueDate() != null &&
                task.getDueDate().isBefore(LocalDate.now()) &&
                task.getStatus() != TaskStatus.DONE;

        return TaskResponse.builder()
                .id(task.getId())
                .title(task.getTitle())
                .description(task.getDescription())
                .status(task.getStatus())
                .priority(task.getPriority())
                .dueDate(task.getDueDate())
                .overdue(isOverdue)
                .blockedReason(task.getBlockedReason())
                .projectId(task.getProject() != null ? task.getProject().getId() : null)
                .projectName(task.getProject() != null ? task.getProject().getName() : null)
                .projectKey(task.getProject() != null ? task.getProject().getKey() : null)
                .assigneeId(task.getAssignee() != null ? task.getAssignee().getId() : null)
                .assigneeUsername(task.getAssignee() != null ? task.getAssignee().getUsername() : null)
                .assigneeFullName(task.getAssignee() != null ? task.getAssignee().getFullName() : null)
                .reporterId(task.getReporter() != null ? task.getReporter().getId() : null)
                .reporterUsername(task.getReporter() != null ? task.getReporter().getUsername() : null)
                .reporterFullName(task.getReporter() != null ? task.getReporter().getFullName() : null)
                .dependencies(task.getDependencies() != null ?
                        task.getDependencies().stream()
                                .map(d -> TaskResponse.TaskSummaryResponse.builder()
                                        .id(d.getId())
                                        .title(d.getTitle())
                                        .status(d.getStatus())
                                        .priority(d.getPriority())
                                        .build())
                                .collect(Collectors.toList()) :
                        Collections.emptyList())
                .createdAt(task.getCreatedAt())
                .updatedAt(task.getUpdatedAt())
                .build();
    }
}
