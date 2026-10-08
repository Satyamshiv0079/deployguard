package com.deployguard.dto.response;

import com.deployguard.entity.enums.ApprovalStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DeploymentApprovalResponse {
    private UUID id;
    private UUID reviewerId;
    private String reviewerUsername;
    private String reviewerFullName;
    private ApprovalStatus status;
    private String comments;
    private Instant reviewedAt;
    private Instant createdAt;
}
