package com.deployguard.dto.response;

import com.deployguard.entity.enums.DeploymentEnvironment;
import com.deployguard.entity.enums.DeploymentStatus;
import com.deployguard.entity.enums.Priority;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DeploymentResponse {
    private UUID id;
    private UUID projectId;
    private String projectName;
    private String projectKey;
    private String version;
    private DeploymentEnvironment environment;
    private UUID requestedById;
    private String requestedByUsername;
    private String requestedByFullName;
    private String reason;
    private String changeDescription;
    private Priority riskLevel;
    private DeploymentStatus status;
    private String pipelineRunId;
    private boolean requiresApproval;
    private boolean eligibleForExecution;
    private Instant executedAt;
    private Instant rolledBackAt;
    private String rollbackReason;
    private List<DeploymentApprovalResponse> approvals;
    private Instant createdAt;
    private Instant updatedAt;
}
