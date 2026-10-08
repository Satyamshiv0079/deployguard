package com.deployguard.service;

import com.deployguard.dto.request.DeploymentApprovalRequest;
import com.deployguard.dto.request.DeploymentCreateRequest;
import com.deployguard.dto.request.DeploymentRollbackRequest;
import com.deployguard.dto.response.DeploymentResponse;
import com.deployguard.dto.response.PagedResponse;
import com.deployguard.entity.enums.DeploymentEnvironment;
import com.deployguard.entity.enums.DeploymentStatus;
import org.springframework.data.domain.Pageable;

import java.util.UUID;

public interface DeploymentService {
    DeploymentResponse requestDeployment(DeploymentCreateRequest request);
    DeploymentResponse getDeploymentById(UUID id);
    PagedResponse<DeploymentResponse> getDeployments(UUID projectId, DeploymentEnvironment environment, DeploymentStatus status, Pageable pageable);
    DeploymentResponse approveDeployment(UUID id, DeploymentApprovalRequest request);
    DeploymentResponse rejectDeployment(UUID id, DeploymentApprovalRequest request);
    DeploymentResponse executeDeployment(UUID id);
    DeploymentResponse rollbackDeployment(UUID id, DeploymentRollbackRequest request);
}
