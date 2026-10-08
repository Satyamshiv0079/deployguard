package com.deployguard.service.impl;

import com.deployguard.audit.AuditService;
import com.deployguard.dto.request.DeploymentApprovalRequest;
import com.deployguard.dto.request.DeploymentCreateRequest;
import com.deployguard.dto.request.DeploymentRollbackRequest;
import com.deployguard.dto.response.DeploymentResponse;
import com.deployguard.dto.response.PagedResponse;
import com.deployguard.entity.Deployment;
import com.deployguard.entity.DeploymentApproval;
import com.deployguard.entity.Project;
import com.deployguard.entity.User;
import com.deployguard.entity.enums.ApprovalStatus;
import com.deployguard.entity.enums.AuditAction;
import com.deployguard.entity.enums.DeploymentEnvironment;
import com.deployguard.entity.enums.DeploymentStatus;
import com.deployguard.exception.BadRequestException;
import com.deployguard.exception.ForbiddenException;
import com.deployguard.exception.ResourceNotFoundException;
import com.deployguard.mapper.DeploymentMapper;
import com.deployguard.repository.DeploymentApprovalRepository;
import com.deployguard.repository.DeploymentRepository;
import com.deployguard.repository.ProjectRepository;
import com.deployguard.repository.UserRepository;
import com.deployguard.service.DeploymentService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class DeploymentServiceImpl implements DeploymentService {

    private final DeploymentRepository deploymentRepository;
    private final DeploymentApprovalRepository approvalRepository;
    private final ProjectRepository projectRepository;
    private final UserRepository userRepository;
    private final DeploymentMapper deploymentMapper;
    private final AuditService auditService;

    @Override
    @Transactional
    public DeploymentResponse requestDeployment(DeploymentCreateRequest request) {
        Project project = projectRepository.findById(request.getProjectId())
                .orElseThrow(() -> new ResourceNotFoundException("Project", "id", request.getProjectId()));

        String username = SecurityContextHolder.getContext().getAuthentication().getName();
        User requester = userRepository.findByUsername(username)
                .orElseThrow(() -> new ResourceNotFoundException("Authenticated user not found."));

        boolean requiresReview = (request.getEnvironment() == DeploymentEnvironment.PRODUCTION ||
                request.getEnvironment() == DeploymentEnvironment.STAGING);

        DeploymentStatus initialStatus = requiresReview ? DeploymentStatus.UNDER_REVIEW : DeploymentStatus.APPROVED;
        String pipelineId = "PIPE-" + request.getEnvironment().name().substring(0, 3) + "-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase();

        Deployment deployment = Deployment.builder()
                .project(project)
                .version(request.getVersion().trim())
                .environment(request.getEnvironment())
                .requestedBy(requester)
                .reason(request.getReason().trim())
                .changeDescription(request.getChangeDescription())
                .riskLevel(request.getRiskLevel())
                .status(initialStatus)
                .pipelineRunId(pipelineId)
                .build();

        Deployment saved = deploymentRepository.save(deployment);

        auditService.logCurrent(AuditAction.DEPLOYMENT_REQUESTED, "DEPLOYMENT", saved.getId().toString(),
                "Deployment requested: " + saved.getVersion() + " to " + saved.getEnvironment() + " for project " + project.getKey());

        return deploymentMapper.toResponse(saved);
    }

    @Override
    @Transactional(readOnly = true)
    public DeploymentResponse getDeploymentById(UUID id) {
        Deployment deployment = deploymentRepository.findWithDetailsById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Deployment", "id", id));
        return deploymentMapper.toResponse(deployment);
    }

    @Override
    @Transactional(readOnly = true)
    public PagedResponse<DeploymentResponse> getDeployments(UUID projectId, DeploymentEnvironment environment, DeploymentStatus status, Pageable pageable) {
        Specification<Deployment> spec = (root, query, cb) -> {
            var predicates = cb.conjunction();
            if (projectId != null) {
                predicates = cb.and(predicates, cb.equal(root.get("project").get("id"), projectId));
            }
            if (environment != null) {
                predicates = cb.and(predicates, cb.equal(root.get("environment"), environment));
            }
            if (status != null) {
                predicates = cb.and(predicates, cb.equal(root.get("status"), status));
            }
            return predicates;
        };

        Page<Deployment> page = deploymentRepository.findAll(spec, pageable);
        return PagedResponse.of(page.map(deploymentMapper::toResponse));
    }

    @Override
    @Transactional
    public DeploymentResponse approveDeployment(UUID id, DeploymentApprovalRequest request) {
        Deployment deployment = deploymentRepository.findWithDetailsById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Deployment", "id", id));

        String username = SecurityContextHolder.getContext().getAuthentication().getName();
        User reviewer = userRepository.findByUsername(username)
                .orElseThrow(() -> new ResourceNotFoundException("Authenticated user not found."));

        // Enterprise Segregation of Duties: Creator cannot approve own deployment request
        if (deployment.getRequestedBy().getId().equals(reviewer.getId())) {
            throw new ForbiddenException("Segregation of duties violation: You cannot approve your own deployment request.");
        }

        if (deployment.getStatus() != DeploymentStatus.UNDER_REVIEW && deployment.getStatus() != DeploymentStatus.REQUESTED) {
            throw new BadRequestException("Deployment cannot be approved in current status: " + deployment.getStatus());
        }

        DeploymentApproval approval = DeploymentApproval.builder()
                .deployment(deployment)
                .reviewer(reviewer)
                .status(ApprovalStatus.APPROVED)
                .comments(request != null ? request.getComments() : "Approved for production rollout.")
                .reviewedAt(Instant.now())
                .build();

        approvalRepository.save(approval);
        deployment.getApprovals().add(approval);
        deployment.setStatus(DeploymentStatus.APPROVED);

        Deployment updated = deploymentRepository.save(deployment);

        auditService.logCurrent(AuditAction.DEPLOYMENT_APPROVED, "DEPLOYMENT", updated.getId().toString(),
                "Approved deployment " + updated.getVersion() + " to " + updated.getEnvironment() + " by reviewer " + reviewer.getUsername());

        return deploymentMapper.toResponse(updated);
    }

    @Override
    @Transactional
    public DeploymentResponse rejectDeployment(UUID id, DeploymentApprovalRequest request) {
        Deployment deployment = deploymentRepository.findWithDetailsById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Deployment", "id", id));

        String username = SecurityContextHolder.getContext().getAuthentication().getName();
        User reviewer = userRepository.findByUsername(username)
                .orElseThrow(() -> new ResourceNotFoundException("Authenticated user not found."));

        if (deployment.getRequestedBy().getId().equals(reviewer.getId())) {
            throw new ForbiddenException("Segregation of duties violation: You cannot review your own deployment request.");
        }

        if (deployment.getStatus() != DeploymentStatus.UNDER_REVIEW && deployment.getStatus() != DeploymentStatus.REQUESTED) {
            throw new BadRequestException("Deployment cannot be rejected in current status: " + deployment.getStatus());
        }

        DeploymentApproval approval = DeploymentApproval.builder()
                .deployment(deployment)
                .reviewer(reviewer)
                .status(ApprovalStatus.REJECTED)
                .comments(request != null ? request.getComments() : "Rejected due to governance criteria.")
                .reviewedAt(Instant.now())
                .build();

        approvalRepository.save(approval);
        deployment.getApprovals().add(approval);
        deployment.setStatus(DeploymentStatus.REJECTED);

        Deployment updated = deploymentRepository.save(deployment);

        auditService.logCurrent(AuditAction.DEPLOYMENT_REJECTED, "DEPLOYMENT", updated.getId().toString(),
                "Rejected deployment " + updated.getVersion() + " to " + updated.getEnvironment() + " by reviewer " + reviewer.getUsername());

        return deploymentMapper.toResponse(updated);
    }

    @Override
    @Transactional
    public DeploymentResponse executeDeployment(UUID id) {
        Deployment deployment = deploymentRepository.findWithDetailsById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Deployment", "id", id));

        if (deployment.getStatus() != DeploymentStatus.APPROVED) {
            throw new BadRequestException("Deployment must be APPROVED before execution. Current status: " + deployment.getStatus());
        }

        deployment.setStatus(DeploymentStatus.SUCCESSFUL);
        deployment.setExecutedAt(Instant.now());

        Deployment updated = deploymentRepository.save(deployment);

        auditService.logCurrent(AuditAction.DEPLOYMENT_EXECUTED, "DEPLOYMENT", updated.getId().toString(),
                "Executed deployment " + updated.getVersion() + " to " + updated.getEnvironment() + " successfully.");

        return deploymentMapper.toResponse(updated);
    }

    @Override
    @Transactional
    public DeploymentResponse rollbackDeployment(UUID id, DeploymentRollbackRequest request) {
        Deployment deployment = deploymentRepository.findWithDetailsById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Deployment", "id", id));

        if (deployment.getStatus() != DeploymentStatus.SUCCESSFUL) {
            throw new BadRequestException("Only SUCCESSFUL deployments can be rolled back. Current status: " + deployment.getStatus());
        }

        deployment.setStatus(DeploymentStatus.ROLLED_BACK);
        deployment.setRolledBackAt(Instant.now());
        deployment.setRollbackReason(request.getReason().trim());

        Deployment updated = deploymentRepository.save(deployment);

        auditService.logCurrent(AuditAction.DEPLOYMENT_ROLLED_BACK, "DEPLOYMENT", updated.getId().toString(),
                "Rolled back deployment " + updated.getVersion() + " in " + updated.getEnvironment() + ". Reason: " + request.getReason());

        return deploymentMapper.toResponse(updated);
    }
}
