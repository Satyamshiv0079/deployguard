package com.deployguard.dto.response;

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
public class RiskMitigationResponse {
    private UUID id;
    private String actionTitle;
    private String actionDescription;
    private UUID ownerId;
    private String ownerUsername;
    private String ownerFullName;
    private boolean completed;
    private Instant completedAt;
    private Instant createdAt;
}
