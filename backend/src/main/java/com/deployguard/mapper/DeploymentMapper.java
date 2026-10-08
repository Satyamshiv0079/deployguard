package com.deployguard.mapper;

import com.deployguard.dto.response.DeploymentApprovalResponse;
import com.deployguard.dto.response.DeploymentResponse;
import com.deployguard.entity.Deployment;
import com.deployguard.entity.DeploymentApproval;
import com.deployguard.entity.enums.DeploymentEnvironment;
import com.deployguard.entity.enums.DeploymentStatus;
import org.springframework.stereotype.Component;

import java.util.Collections;
import java.util.stream.Collectors;

@Component
public class DeploymentMapper {

    public DeploymentResponse toResponse(Deployment deployment) {
        if (deployment == null) return null;

        boolean requiresApproval = deployment.getEnvironment() == DeploymentEnvironment.PRODUCTION ||
                deployment.getEnvironment() == DeploymentEnvironment.STAGING;

        boolean eligibleForExecution = (deployment.getStatus() == DeploymentStatus.APPROVED) ||
                (!requiresApproval && (deployment.getStatus() == DeploymentStatus.REQUESTED || deployment.getStatus() == DeploymentStatus.APPROVED));

        return DeploymentResponse.builder()
                .id(deployment.getId())
                .projectId(deployment.getProject() != null ? deployment.getProject().getId() : null)
                .projectName(deployment.getProject() != null ? deployment.getProject().getName() : null)
                .projectKey(deployment.getProject() != null ? deployment.getProject().getKey() : null)
                .version(deployment.getVersion())
                .environment(deployment.getEnvironment())
                .requestedById(deployment.getRequestedBy() != null ? deployment.getRequestedBy().getId() : null)
                .requestedByUsername(deployment.getRequestedBy() != null ? deployment.getRequestedBy().getUsername() : null)
                .requestedByFullName(deployment.getRequestedBy() != null ? deployment.getRequestedBy().getFullName() : null)
                .reason(deployment.getReason())
                .changeDescription(deployment.getChangeDescription())
                .riskLevel(deployment.getRiskLevel())
                .status(deployment.getStatus())
                .pipelineRunId(deployment.getPipelineRunId())
                .requiresApproval(requiresApproval)
                .eligibleForExecution(eligibleForExecution)
                .executedAt(deployment.getExecutedAt())
                .rolledBackAt(deployment.getRolledBackAt())
                .rollbackReason(deployment.getRollbackReason())
                .approvals(deployment.getApprovals() != null ?
                        deployment.getApprovals().stream().map(this::toApprovalResponse).collect(Collectors.toList()) :
                        Collections.emptyList())
                .createdAt(deployment.getCreatedAt())
                .updatedAt(deployment.getUpdatedAt())
                .build();
    }

    public DeploymentApprovalResponse toApprovalResponse(DeploymentApproval approval) {
        if (approval == null) return null;
        return DeploymentApprovalResponse.builder()
                .id(approval.getId())
                .reviewerId(approval.getReviewer() != null ? approval.getReviewer().getId() : null)
                .reviewerUsername(approval.getReviewer() != null ? approval.getReviewer().getUsername() : null)
                .reviewerFullName(approval.getReviewer() != null ? approval.getReviewer().getFullName() : null)
                .status(approval.getStatus())
                .comments(approval.getComments())
                .reviewedAt(approval.getReviewedAt())
                .createdAt(approval.getCreatedAt())
                .build();
    }
}
