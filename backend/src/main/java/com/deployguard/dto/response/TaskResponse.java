package com.deployguard.dto.response;

import com.deployguard.entity.enums.Priority;
import com.deployguard.entity.enums.TaskStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TaskResponse {
    private UUID id;
    private String title;
    private String description;
    private TaskStatus status;
    private Priority priority;
    private LocalDate dueDate;
    private boolean overdue;
    private String blockedReason;
    private UUID projectId;
    private String projectName;
    private String projectKey;
    private UUID assigneeId;
    private String assigneeUsername;
    private String assigneeFullName;
    private UUID reporterId;
    private String reporterUsername;
    private String reporterFullName;
    private List<TaskSummaryResponse> dependencies;
    private Instant createdAt;
    private Instant updatedAt;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class TaskSummaryResponse {
        private UUID id;
        private String title;
        private TaskStatus status;
        private Priority priority;
    }
}
