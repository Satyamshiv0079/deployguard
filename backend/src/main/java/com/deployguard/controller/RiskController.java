package com.deployguard.controller;

import com.deployguard.dto.request.RiskCreateRequest;
import com.deployguard.dto.request.RiskMitigationRequest;
import com.deployguard.dto.request.RiskUpdateRequest;
import com.deployguard.dto.response.ApiResponse;
import com.deployguard.dto.response.PagedResponse;
import com.deployguard.dto.response.RiskMitigationResponse;
import com.deployguard.dto.response.RiskResponse;
import com.deployguard.entity.enums.RiskSeverity;
import com.deployguard.entity.enums.RiskStatus;
import com.deployguard.service.RiskService;
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

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/risks")
@RequiredArgsConstructor
@Tag(name = "Risk & Controls", description = "Endpoints for enterprise risk identification, scoring, mitigation, and governance")
public class RiskController {

    private final RiskService riskService;

    @GetMapping
    @Operation(summary = "Get paginated risks filtered by project, severity or status")
    public ResponseEntity<ApiResponse<PagedResponse<RiskResponse>>> getRisks(
            @RequestParam(required = false) UUID projectId,
            @RequestParam(required = false) RiskSeverity severity,
            @RequestParam(required = false) RiskStatus status,
            @PageableDefault(size = 10, sort = "riskScore", direction = Sort.Direction.DESC) Pageable pageable) {
        PagedResponse<RiskResponse> response = riskService.getRisks(projectId, severity, status, pageable);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    @GetMapping("/unresolved")
    @Operation(summary = "Get all unresolved risks sorted by risk score descending")
    public ResponseEntity<ApiResponse<List<RiskResponse>>> getUnresolvedRisks() {
        List<RiskResponse> risks = riskService.getUnresolvedRisks();
        return ResponseEntity.ok(ApiResponse.ok(risks));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get risk details by ID")
    public ResponseEntity<ApiResponse<RiskResponse>> getRiskById(@PathVariable UUID id) {
        RiskResponse response = riskService.getRiskById(id);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'PROJECT_MANAGER')")
    @Operation(summary = "Create a new risk assessment")
    public ResponseEntity<ApiResponse<RiskResponse>> createRisk(@Valid @RequestBody RiskCreateRequest request) {
        RiskResponse response = riskService.createRisk(request);
        return new ResponseEntity<>(ApiResponse.created(response, "Risk created successfully"), HttpStatus.CREATED);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'PROJECT_MANAGER')")
    @Operation(summary = "Update an existing risk assessment and recalculate score")
    public ResponseEntity<ApiResponse<RiskResponse>> updateRisk(
            @PathVariable UUID id,
            @Valid @RequestBody RiskUpdateRequest request) {
        RiskResponse response = riskService.updateRisk(id, request);
        return ResponseEntity.ok(ApiResponse.ok(response, "Risk updated successfully"));
    }

    @PostMapping("/{id}/mitigations")
    @PreAuthorize("hasAnyRole('ADMIN', 'PROJECT_MANAGER', 'DEVELOPER')")
    @Operation(summary = "Add a mitigation action to a risk")
    public ResponseEntity<ApiResponse<RiskMitigationResponse>> addMitigation(
            @PathVariable UUID id,
            @Valid @RequestBody RiskMitigationRequest request) {
        RiskMitigationResponse response = riskService.addMitigation(id, request);
        return new ResponseEntity<>(ApiResponse.created(response, "Mitigation action added"), HttpStatus.CREATED);
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Delete a risk (Admin only)")
    public ResponseEntity<ApiResponse<Void>> deleteRisk(@PathVariable UUID id) {
        riskService.deleteRisk(id);
        return ResponseEntity.ok(ApiResponse.ok(null, "Risk deleted successfully"));
    }
}
