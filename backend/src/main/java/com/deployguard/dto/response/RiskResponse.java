package com.deployguard.dto.response;

import com.deployguard.entity.enums.RiskSeverity;
import com.deployguard.entity.enums.RiskStatus;
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
public class RiskResponse {
    private UUID id;
    private String title;
    private String description;
    private UUID projectId;
    private String projectName;
    private String projectKey;
    private UUID ownerId;
    private String ownerUsername;
    private String ownerFullName;
    private RiskSeverity severity;
    private int probability;
    private int impact;
    private int riskScore;
    private String mitigationPlan;
    private RiskStatus status;
    private LocalDate dueDate;
    private List<RiskMitigationResponse> mitigations;
    private Instant createdAt;
    private Instant updatedAt;
}
