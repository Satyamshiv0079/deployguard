package com.deployguard.service.impl;

import com.deployguard.audit.AuditService;
import com.deployguard.dto.request.RiskCreateRequest;
import com.deployguard.dto.request.RiskMitigationRequest;
import com.deployguard.dto.request.RiskUpdateRequest;
import com.deployguard.dto.response.PagedResponse;
import com.deployguard.dto.response.RiskMitigationResponse;
import com.deployguard.dto.response.RiskResponse;
import com.deployguard.entity.Project;
import com.deployguard.entity.Risk;
import com.deployguard.entity.RiskMitigation;
import com.deployguard.entity.User;
import com.deployguard.entity.enums.AuditAction;
import com.deployguard.entity.enums.RiskSeverity;
import com.deployguard.entity.enums.RiskStatus;
import com.deployguard.exception.ResourceNotFoundException;
import com.deployguard.mapper.RiskMapper;
import com.deployguard.repository.ProjectRepository;
import com.deployguard.repository.RiskMitigationRepository;
import com.deployguard.repository.RiskRepository;
import com.deployguard.repository.UserRepository;
import com.deployguard.service.RiskService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class RiskServiceImpl implements RiskService {

    private final RiskRepository riskRepository;
    private final RiskMitigationRepository mitigationRepository;
    private final ProjectRepository projectRepository;
    private final UserRepository userRepository;
    private final RiskMapper riskMapper;
    private final AuditService auditService;

    @Override
    @Transactional
    public RiskResponse createRisk(RiskCreateRequest request) {
        Project project = projectRepository.findById(request.getProjectId())
                .orElseThrow(() -> new ResourceNotFoundException("Project", "id", request.getProjectId()));

        User owner = null;
        if (request.getOwnerId() != null) {
            owner = userRepository.findById(request.getOwnerId())
                    .orElseThrow(() -> new ResourceNotFoundException("User", "id", request.getOwnerId()));
        }

        Risk risk = Risk.builder()
                .title(request.getTitle().trim())
                .description(request.getDescription())
                .project(project)
                .owner(owner)
                .probability(request.getProbability())
                .impact(request.getImpact())
                .mitigationPlan(request.getMitigationPlan())
                .status(RiskStatus.OPEN)
                .dueDate(request.getDueDate())
                .build();

        // Calculate score & severity
        risk.calculateScore();
        if (request.getSeverity() != null) {
            risk.setSeverity(request.getSeverity());
        }

        Risk saved = riskRepository.save(risk);

        auditService.logCurrent(AuditAction.RISK_CREATED, "RISK", saved.getId().toString(),
                "Identified new risk '" + saved.getTitle() + "' [Score: " + saved.getRiskScore() + ", Severity: " + saved.getSeverity() + "]");

        return riskMapper.toResponse(saved);
    }

    @Override
    @Transactional
    public RiskResponse updateRisk(UUID id, RiskUpdateRequest request) {
        Risk risk = riskRepository.findWithDetailsById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Risk", "id", id));

        if (request.getTitle() != null && !request.getTitle().isBlank()) {
            risk.setTitle(request.getTitle().trim());
        }
        if (request.getDescription() != null) {
            risk.setDescription(request.getDescription());
        }
        if (request.getOwnerId() != null) {
            User owner = userRepository.findById(request.getOwnerId())
                    .orElseThrow(() -> new ResourceNotFoundException("User", "id", request.getOwnerId()));
            risk.setOwner(owner);
        }
        if (request.getProbability() != null) {
            risk.setProbability(request.getProbability());
        }
        if (request.getImpact() != null) {
            risk.setImpact(request.getImpact());
        }
        if (request.getMitigationPlan() != null) {
            risk.setMitigationPlan(request.getMitigationPlan());
        }
        if (request.getStatus() != null) {
            risk.setStatus(request.getStatus());
        }
        if (request.getDueDate() != null) {
            risk.setDueDate(request.getDueDate());
        }

        risk.calculateScore();
        if (request.getSeverity() != null) {
            risk.setSeverity(request.getSeverity());
        }

        Risk updated = riskRepository.save(risk);

        auditService.logCurrent(AuditAction.RISK_UPDATED, "RISK", updated.getId().toString(),
                "Updated risk '" + updated.getTitle() + "' [Score: " + updated.getRiskScore() + ", Status: " + updated.getStatus() + "]");

        return riskMapper.toResponse(updated);
    }

    @Override
    @Transactional(readOnly = true)
    public RiskResponse getRiskById(UUID id) {
        Risk risk = riskRepository.findWithDetailsById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Risk", "id", id));
        return riskMapper.toResponse(risk);
    }

    @Override
    @Transactional(readOnly = true)
    public PagedResponse<RiskResponse> getRisks(UUID projectId, RiskSeverity severity, RiskStatus status, Pageable pageable) {
        Specification<Risk> spec = (root, query, cb) -> {
            var predicates = cb.conjunction();
            if (projectId != null) {
                predicates = cb.and(predicates, cb.equal(root.get("project").get("id"), projectId));
            }
            if (severity != null) {
                predicates = cb.and(predicates, cb.equal(root.get("severity"), severity));
            }
            if (status != null) {
                predicates = cb.and(predicates, cb.equal(root.get("status"), status));
            }
            return predicates;
        };

        Page<Risk> page = riskRepository.findAll(spec, pageable);
        return PagedResponse.of(page.map(riskMapper::toResponse));
    }

    @Override
    @Transactional(readOnly = true)
    public List<RiskResponse> getUnresolvedRisks() {
        return riskRepository.findUnresolvedRisks().stream()
                .map(riskMapper::toResponse)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional
    public RiskMitigationResponse addMitigation(UUID riskId, RiskMitigationRequest request) {
        Risk risk = riskRepository.findById(riskId)
                .orElseThrow(() -> new ResourceNotFoundException("Risk", "id", riskId));

        User owner = null;
        if (request.getOwnerId() != null) {
            owner = userRepository.findById(request.getOwnerId())
                    .orElseThrow(() -> new ResourceNotFoundException("User", "id", request.getOwnerId()));
        }

        boolean completed = Boolean.TRUE.equals(request.getCompleted());

        RiskMitigation mitigation = RiskMitigation.builder()
                .risk(risk)
                .actionTitle(request.getActionTitle().trim())
                .actionDescription(request.getActionDescription())
                .owner(owner)
                .completed(completed)
                .completedAt(completed ? Instant.now() : null)
                .build();

        RiskMitigation saved = mitigationRepository.save(mitigation);

        if (risk.getStatus() == RiskStatus.OPEN) {
            risk.setStatus(RiskStatus.MITIGATING);
            riskRepository.save(risk);
        }

        auditService.logCurrent(AuditAction.RISK_MITIGATION_ADDED, "RISK", riskId.toString(),
                "Added mitigation action: " + saved.getActionTitle());

        return riskMapper.toMitigationResponse(saved);
    }

    @Override
    @Transactional
    public void deleteRisk(UUID id) {
        Risk risk = riskRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Risk", "id", id));
        riskRepository.delete(risk);

        auditService.logCurrent(AuditAction.RISK_UPDATED, "RISK", id.toString(),
                "Deleted risk: " + risk.getTitle());
    }
}
