package com.deployguard.dto.response;

import com.deployguard.entity.enums.Priority;
import com.deployguard.entity.enums.ProjectStatus;
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
public class ProjectResponse {
    private UUID id;
    private String name;
    private String key;
    private String description;
    private ProjectStatus status;
    private Priority priority;
    private LocalDate startDate;
    private LocalDate targetEndDate;
    private LocalDate actualEndDate;
    private boolean archived;
    private UUID createdById;
    private String createdByUsername;
    private String createdByFullName;
    private List<UserProfileResponse> members;
    private long totalTasks;
    private long openRisks;
    private long pendingDeployments;
    private Instant createdAt;
    private Instant updatedAt;
}
