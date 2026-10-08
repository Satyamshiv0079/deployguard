package com.deployguard.mapper;

import com.deployguard.dto.response.RiskMitigationResponse;
import com.deployguard.dto.response.RiskResponse;
import com.deployguard.entity.Risk;
import com.deployguard.entity.RiskMitigation;
import org.springframework.stereotype.Component;

import java.util.Collections;
import java.util.stream.Collectors;

@Component
public class RiskMapper {

    public RiskResponse toResponse(Risk risk) {
        if (risk == null) return null;
        return RiskResponse.builder()
                .id(risk.getId())
                .title(risk.getTitle())
                .description(risk.getDescription())
                .projectId(risk.getProject() != null ? risk.getProject().getId() : null)
                .projectName(risk.getProject() != null ? risk.getProject().getName() : null)
                .projectKey(risk.getProject() != null ? risk.getProject().getKey() : null)
                .ownerId(risk.getOwner() != null ? risk.getOwner().getId() : null)
                .ownerUsername(risk.getOwner() != null ? risk.getOwner().getUsername() : null)
                .ownerFullName(risk.getOwner() != null ? risk.getOwner().getFullName() : null)
                .severity(risk.getSeverity())
                .probability(risk.getProbability())
                .impact(risk.getImpact())
                .riskScore(risk.getRiskScore())
                .mitigationPlan(risk.getMitigationPlan())
                .status(risk.getStatus())
                .dueDate(risk.getDueDate())
                .mitigations(risk.getMitigations() != null ?
                        risk.getMitigations().stream().map(this::toMitigationResponse).collect(Collectors.toList()) :
                        Collections.emptyList())
                .createdAt(risk.getCreatedAt())
                .updatedAt(risk.getUpdatedAt())
                .build();
    }

    public RiskMitigationResponse toMitigationResponse(RiskMitigation mitigation) {
        if (mitigation == null) return null;
        return RiskMitigationResponse.builder()
                .id(mitigation.getId())
                .actionTitle(mitigation.getActionTitle())
                .actionDescription(mitigation.getActionDescription())
                .ownerId(mitigation.getOwner() != null ? mitigation.getOwner().getId() : null)
                .ownerUsername(mitigation.getOwner() != null ? mitigation.getOwner().getUsername() : null)
                .ownerFullName(mitigation.getOwner() != null ? mitigation.getOwner().getFullName() : null)
                .completed(mitigation.isCompleted())
                .completedAt(mitigation.getCompletedAt())
                .createdAt(mitigation.getCreatedAt())
                .build();
    }
}
