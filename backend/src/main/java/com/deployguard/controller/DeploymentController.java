package com.deployguard.controller;

import com.deployguard.dto.request.DeploymentApprovalRequest;
import com.deployguard.dto.request.DeploymentCreateRequest;
import com.deployguard.dto.request.DeploymentRollbackRequest;
import com.deployguard.dto.response.ApiResponse;
import com.deployguard.dto.response.DeploymentResponse;
import com.deployguard.dto.response.PagedResponse;
import com.deployguard.entity.enums.DeploymentEnvironment;
import com.deployguard.entity.enums.DeploymentStatus;
import com.deployguard.service.DeploymentService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/deployments")
@RequiredArgsConstructor
@Tag(name = "Deployments", description = "Endpoints for deployment requests, approval workflows, execution and rollback")
public class DeploymentController {

    private final DeploymentService deploymentService;

    @GetMapping
    @Operation(summary = "Get paginated deployments with environment and status filters")
    public ResponseEntity<ApiResponse<PagedResponse<DeploymentResponse>>> getDeployments(
            @RequestParam(required = false) UUID projectId,
            @RequestParam(required = false) DeploymentEnvironment environment,
            @RequestParam(required = false) DeploymentStatus status,
            @PageableDefault(size = 10, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable) {
        PagedResponse<DeploymentResponse> response = deploymentService.getDeployments(projectId, environment, status, pageable);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get deployment details with complete approval history")
    public ResponseEntity<ApiResponse<DeploymentResponse>> getDeploymentById(@PathVariable UUID id) {
        DeploymentResponse response = deploymentService.getDeploymentById(id);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'PROJECT_MANAGER', 'DEVELOPER')")
    @Operation(summary = "Create a new deployment request")
    public ResponseEntity<ApiResponse<DeploymentResponse>> requestDeployment(@Valid @RequestBody DeploymentCreateRequest request) {
        DeploymentResponse response = deploymentService.requestDeployment(request);
        return new ResponseEntity<>(ApiResponse.created(response, "Deployment requested successfully"), HttpStatus.CREATED);
    }

    @PostMapping("/{id}/approve")
    @PreAuthorize("hasAnyRole('ADMIN', 'REVIEWER')")
    @Operation(summary = "Approve a deployment request (Reviewer / Admin, 4-Eyes policy enforced)")
    public ResponseEntity<ApiResponse<DeploymentResponse>> approveDeployment(
            @PathVariable UUID id,
            @Valid @RequestBody(required = false) DeploymentApprovalRequest request) {
        DeploymentResponse response = deploymentService.approveDeployment(id, request);
        return ResponseEntity.ok(ApiResponse.ok(response, "Deployment approved successfully"));
    }

    @PostMapping("/{id}/reject")
    @PreAuthorize("hasAnyRole('ADMIN', 'REVIEWER')")
    @Operation(summary = "Reject a deployment request with governance reason")
    public ResponseEntity<ApiResponse<DeploymentResponse>> rejectDeployment(
            @PathVariable UUID id,
            @Valid @RequestBody(required = false) DeploymentApprovalRequest request) {
        DeploymentResponse response = deploymentService.rejectDeployment(id, request);
        return ResponseEntity.ok(ApiResponse.ok(response, "Deployment rejected"));
    }

    @PostMapping("/{id}/execute")
    @PreAuthorize("hasAnyRole('ADMIN', 'PROJECT_MANAGER', 'DEVELOPER')")
    @Operation(summary = "Execute an approved deployment")
    public ResponseEntity<ApiResponse<DeploymentResponse>> executeDeployment(@PathVariable UUID id) {
        DeploymentResponse response = deploymentService.executeDeployment(id);
        return ResponseEntity.ok(ApiResponse.ok(response, "Deployment executed successfully"));
    }

    @PostMapping("/{id}/rollback")
    @PreAuthorize("hasAnyRole('ADMIN', 'PROJECT_MANAGER', 'DEVELOPER', 'REVIEWER')")
    @Operation(summary = "Roll back a successful deployment")
    public ResponseEntity<ApiResponse<DeploymentResponse>> rollbackDeployment(
            @PathVariable UUID id,
            @Valid @RequestBody DeploymentRollbackRequest request) {
        DeploymentResponse response = deploymentService.rollbackDeployment(id, request);
        return ResponseEntity.ok(ApiResponse.ok(response, "Deployment rolled back successfully"));
    }
}
