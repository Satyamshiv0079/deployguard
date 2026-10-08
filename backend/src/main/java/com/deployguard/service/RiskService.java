package com.deployguard.service;

import com.deployguard.dto.request.RiskCreateRequest;
import com.deployguard.dto.request.RiskMitigationRequest;
import com.deployguard.dto.request.RiskUpdateRequest;
import com.deployguard.dto.response.PagedResponse;
import com.deployguard.dto.response.RiskMitigationResponse;
import com.deployguard.dto.response.RiskResponse;
import com.deployguard.entity.enums.RiskSeverity;
import com.deployguard.entity.enums.RiskStatus;
import org.springframework.data.domain.Pageable;

import java.util.List;
import java.util.UUID;

public interface RiskService {
    RiskResponse createRisk(RiskCreateRequest request);
    RiskResponse updateRisk(UUID id, RiskUpdateRequest request);
    RiskResponse getRiskById(UUID id);
    PagedResponse<RiskResponse> getRisks(UUID projectId, RiskSeverity severity, RiskStatus status, Pageable pageable);
    List<RiskResponse> getUnresolvedRisks();
    RiskMitigationResponse addMitigation(UUID riskId, RiskMitigationRequest request);
    void deleteRisk(UUID id);
}
