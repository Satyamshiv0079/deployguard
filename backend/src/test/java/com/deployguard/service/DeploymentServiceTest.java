package com.deployguard.service;

import com.deployguard.audit.AuditService;
import com.deployguard.dto.request.DeploymentApprovalRequest;
import com.deployguard.dto.request.DeploymentCreateRequest;
import com.deployguard.dto.request.DeploymentRollbackRequest;
import com.deployguard.dto.response.DeploymentResponse;
import com.deployguard.entity.Deployment;
import com.deployguard.entity.Project;
import com.deployguard.entity.Role;
import com.deployguard.entity.User;
import com.deployguard.entity.enums.ApprovalStatus;
import com.deployguard.entity.enums.DeploymentEnvironment;
import com.deployguard.entity.enums.DeploymentStatus;
import com.deployguard.entity.enums.Priority;
import com.deployguard.entity.enums.RoleType;
import com.deployguard.exception.BadRequestException;
import com.deployguard.exception.ForbiddenException;
import com.deployguard.mapper.DeploymentMapper;
import com.deployguard.repository.DeploymentApprovalRepository;
import com.deployguard.repository.DeploymentRepository;
import com.deployguard.repository.ProjectRepository;
import com.deployguard.repository.UserRepository;
import com.deployguard.service.impl.DeploymentServiceImpl;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContext;
import org.springframework.security.core.context.SecurityContextHolder;

import java.util.ArrayList;
import java.util.HashSet;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class DeploymentServiceTest {

    @Mock
    private DeploymentRepository deploymentRepository;

    @Mock
    private DeploymentApprovalRepository approvalRepository;

    @Mock
    private ProjectRepository projectRepository;

    @Mock
    private UserRepository userRepository;

    @Mock
    private DeploymentMapper deploymentMapper;

    @Mock
    private AuditService auditService;

    @InjectMocks
    private DeploymentServiceImpl deploymentService;

    private User requester;
    private User reviewer;
    private User nonMember;
    private Project project;
    private Deployment deployment;

    @BeforeEach
    void setUp() {
        Role devRole = new Role(RoleType.ROLE_DEVELOPER);
        Role revRole = new Role(RoleType.ROLE_REVIEWER);

        requester = User.builder()
                .id(UUID.randomUUID())
                .username("dev_alex")
                .fullName("Alex Rivera")
                .roles(Set.of(devRole))
                .build();

        reviewer = User.builder()
                .id(UUID.randomUUID())
                .username("rev_marcus")
                .fullName("Marcus Vance")
                .roles(Set.of(revRole))
                .build();

        nonMember = User.builder()
                .id(UUID.randomUUID())
                .username("dev_stranger")
                .fullName("Stranger User")
                .roles(Set.of(devRole))
                .build();

        project = Project.builder()
                .id(UUID.randomUUID())
                .name("Core Settlement Gateway")
                .key("CSG-01")
                .archived(false)
                .createdBy(requester)
                .members(new HashSet<>(Set.of(requester)))
                .build();

        deployment = Deployment.builder()
                .id(UUID.randomUUID())
                .project(project)
                .version("v2.4.0")
                .environment(DeploymentEnvironment.PRODUCTION)
                .requestedBy(requester)
                .reason("Quarterly production rollout")
                .status(DeploymentStatus.UNDER_REVIEW)
                .approvals(new ArrayList<>())
                .build();
    }

    private void mockSecurityContext(String username) {
        Authentication auth = mock(Authentication.class);
        when(auth.getName()).thenReturn(username);
        SecurityContext securityContext = mock(SecurityContext.class);
        when(securityContext.getAuthentication()).thenReturn(auth);
        SecurityContextHolder.setContext(securityContext);
    }

    @Test
    @DisplayName("Scenario 1: Developer requests a production deployment -> status becomes UNDER_REVIEW")
    void shouldAllowDeveloperToRequestProductionDeployment() {
        mockSecurityContext(requester.getUsername());
        when(projectRepository.findById(project.getId())).thenReturn(Optional.of(project));
        when(userRepository.findByUsername(requester.getUsername())).thenReturn(Optional.of(requester));
        when(deploymentRepository.save(any(Deployment.class))).thenAnswer(invocation -> {
            Deployment d = invocation.getArgument(0);
            d.setId(UUID.randomUUID());
            return d;
        });
        when(deploymentMapper.toResponse(any(Deployment.class))).thenAnswer(invocation -> {
            Deployment d = invocation.getArgument(0);
            return DeploymentResponse.builder()
                    .id(d.getId())
                    .version(d.getVersion())
                    .environment(d.getEnvironment())
                    .status(d.getStatus())
                    .build();
        });

        DeploymentCreateRequest request = DeploymentCreateRequest.builder()
                .projectId(project.getId())
                .version("v2.4.0")
                .environment(DeploymentEnvironment.PRODUCTION)
                .reason("Scheduled production release")
                .changeDescription("Upgrade settlement batch processing")
                .riskLevel(Priority.HIGH)
                .build();

        DeploymentResponse response = deploymentService.requestDeployment(request);

        assertNotNull(response);
        assertEquals(DeploymentStatus.UNDER_REVIEW, response.getStatus());
        assertEquals("v2.4.0", response.getVersion());
        verify(deploymentRepository).save(any(Deployment.class));
        verify(auditService).logCurrent(any(), any(), any(), any());
    }

    @Test
    @DisplayName("Scenario 2: Requester cannot approve their own deployment request (Four-Eyes Principle)")
    void shouldProhibitSelfApproval() {
        mockSecurityContext(requester.getUsername());
        when(deploymentRepository.findWithDetailsById(deployment.getId())).thenReturn(Optional.of(deployment));
        when(userRepository.findByUsername(requester.getUsername())).thenReturn(Optional.of(requester));

        DeploymentApprovalRequest request = DeploymentApprovalRequest.builder()
                .comments("Self approval attempt")
                .build();

        ForbiddenException ex = assertThrows(ForbiddenException.class, () ->
                deploymentService.approveDeployment(deployment.getId(), request));

        assertTrue(ex.getMessage().contains("Segregation of duties violation"));
        verify(approvalRepository, never()).save(any());
    }

    @Test
    @DisplayName("Scenario 3a: Authorized reviewer can approve production deployment request")
    void shouldAllowIndependentReviewerApproval() {
        mockSecurityContext(reviewer.getUsername());
        when(deploymentRepository.findWithDetailsById(deployment.getId())).thenReturn(Optional.of(deployment));
        when(userRepository.findByUsername(reviewer.getUsername())).thenReturn(Optional.of(reviewer));
        when(deploymentRepository.save(any(Deployment.class))).thenAnswer(invocation -> invocation.getArgument(0));
        when(deploymentMapper.toResponse(any(Deployment.class))).thenReturn(DeploymentResponse.builder()
                .id(deployment.getId())
                .status(DeploymentStatus.APPROVED)
                .build());

        DeploymentApprovalRequest request = DeploymentApprovalRequest.builder()
                .comments("Security and regression tests verified. Approved.")
                .build();

        DeploymentResponse response = deploymentService.approveDeployment(deployment.getId(), request);

        assertNotNull(response);
        assertEquals(DeploymentStatus.APPROVED, response.getStatus());
        verify(approvalRepository, times(1)).save(any());
        verify(auditService, times(1)).logCurrent(any(), any(), any(), any());
    }

    @Test
    @DisplayName("Scenario 3b: Authorized reviewer can reject deployment request with governance reason")
    void shouldAllowIndependentReviewerRejection() {
        mockSecurityContext(reviewer.getUsername());
        when(deploymentRepository.findWithDetailsById(deployment.getId())).thenReturn(Optional.of(deployment));
        when(userRepository.findByUsername(reviewer.getUsername())).thenReturn(Optional.of(reviewer));
        when(deploymentRepository.save(any(Deployment.class))).thenAnswer(invocation -> invocation.getArgument(0));
        when(deploymentMapper.toResponse(any(Deployment.class))).thenReturn(DeploymentResponse.builder()
                .id(deployment.getId())
                .status(DeploymentStatus.REJECTED)
                .build());

        DeploymentApprovalRequest request = DeploymentApprovalRequest.builder()
                .comments("Missing vulnerability scan sign-off.")
                .build();

        DeploymentResponse response = deploymentService.rejectDeployment(deployment.getId(), request);

        assertNotNull(response);
        assertEquals(DeploymentStatus.REJECTED, response.getStatus());
        verify(approvalRepository, times(1)).save(any());
    }

    @Test
    @DisplayName("Scenario 4: Reject execution if deployment has not been approved")
    void shouldRejectExecutionIfNotApproved() {
        deployment.setStatus(DeploymentStatus.UNDER_REVIEW);
        when(deploymentRepository.findWithDetailsById(deployment.getId())).thenReturn(Optional.of(deployment));

        BadRequestException ex = assertThrows(BadRequestException.class, () ->
                deploymentService.executeDeployment(deployment.getId()));

        assertTrue(ex.getMessage().contains("Deployment must be APPROVED before execution"));
    }

    @Test
    @DisplayName("Scenario 5: Invalid state transitions are rejected")
    void shouldProhibitInvalidStateTransitions() {
        // Cannot approve an already approved deployment
        deployment.setStatus(DeploymentStatus.APPROVED);
        mockSecurityContext(reviewer.getUsername());
        when(deploymentRepository.findWithDetailsById(deployment.getId())).thenReturn(Optional.of(deployment));
        when(userRepository.findByUsername(reviewer.getUsername())).thenReturn(Optional.of(reviewer));

        BadRequestException exApprove = assertThrows(BadRequestException.class, () ->
                deploymentService.approveDeployment(deployment.getId(), null));
        assertTrue(exApprove.getMessage().contains("Deployment cannot be approved in current status"));

        // Cannot rollback a non-successful deployment
        deployment.setStatus(DeploymentStatus.UNDER_REVIEW);
        DeploymentRollbackRequest rollbackRequest = DeploymentRollbackRequest.builder()
                .reason("Premature rollback attempt")
                .build();

        BadRequestException exRollback = assertThrows(BadRequestException.class, () ->
                deploymentService.rollbackDeployment(deployment.getId(), rollbackRequest));
        assertTrue(exRollback.getMessage().contains("Only SUCCESSFUL deployments can be rolled back"));
    }

    @Test
    @DisplayName("Scenario 6: Rollback requires a valid successful deployment and a nonblank reason")
    void shouldValidateRollbackRequirements() {
        // Blank reason rejected
        DeploymentRollbackRequest blankReason = DeploymentRollbackRequest.builder()
                .reason("   ")
                .build();
        BadRequestException exBlank = assertThrows(BadRequestException.class, () ->
                deploymentService.rollbackDeployment(deployment.getId(), blankReason));
        assertTrue(exBlank.getMessage().contains("Rollback reason cannot be blank"));

        // Successful deployment with valid reason succeeds
        deployment.setStatus(DeploymentStatus.SUCCESSFUL);
        mockSecurityContext(requester.getUsername());
        when(deploymentRepository.findWithDetailsById(deployment.getId())).thenReturn(Optional.of(deployment));
        when(userRepository.findByUsername(requester.getUsername())).thenReturn(Optional.of(requester));
        when(deploymentRepository.save(any(Deployment.class))).thenAnswer(invocation -> invocation.getArgument(0));
        when(deploymentMapper.toResponse(any(Deployment.class))).thenReturn(DeploymentResponse.builder()
                .id(deployment.getId())
                .status(DeploymentStatus.ROLLED_BACK)
                .build());

        DeploymentRollbackRequest validRollback = DeploymentRollbackRequest.builder()
                .reason("High latency detected on upstream settlement provider")
                .build();

        DeploymentResponse response = deploymentService.rollbackDeployment(deployment.getId(), validRollback);
        assertNotNull(response);
        assertEquals(DeploymentStatus.ROLLED_BACK, response.getStatus());
        verify(auditService).logCurrent(any(), any(), any(), any());
    }

    @Test
    @DisplayName("Scenario 7a: Cannot request deployment for an archived project")
    void shouldRejectDeploymentForArchivedProject() {
        project.setArchived(true);
        when(projectRepository.findById(project.getId())).thenReturn(Optional.of(project));

        DeploymentCreateRequest request = DeploymentCreateRequest.builder()
                .projectId(project.getId())
                .version("v1.0.0")
                .environment(DeploymentEnvironment.TEST)
                .reason("Test on archived")
                .build();

        BadRequestException ex = assertThrows(BadRequestException.class, () ->
                deploymentService.requestDeployment(request));
        assertTrue(ex.getMessage().contains("Cannot request deployment for an archived project"));
    }

    @Test
    @DisplayName("Scenario 7b: Unauthorized non-member cannot request deployment for project")
    void shouldRejectDeploymentRequestFromNonMember() {
        mockSecurityContext(nonMember.getUsername());
        when(projectRepository.findById(project.getId())).thenReturn(Optional.of(project));
        when(userRepository.findByUsername(nonMember.getUsername())).thenReturn(Optional.of(nonMember));

        DeploymentCreateRequest request = DeploymentCreateRequest.builder()
                .projectId(project.getId())
                .version("v1.0.0")
                .environment(DeploymentEnvironment.TEST)
                .reason("Unauthorized request")
                .build();

        ForbiddenException ex = assertThrows(ForbiddenException.class, () ->
                deploymentService.requestDeployment(request));
        assertTrue(ex.getMessage().contains("You are not an assigned member of project"));
    }

    @Test
    @DisplayName("Scenario 7c: Unauthorized non-member cannot execute deployment")
    void shouldRejectExecutionFromNonMember() {
        deployment.setStatus(DeploymentStatus.APPROVED);
        mockSecurityContext(nonMember.getUsername());
        when(deploymentRepository.findWithDetailsById(deployment.getId())).thenReturn(Optional.of(deployment));
        when(userRepository.findByUsername(nonMember.getUsername())).thenReturn(Optional.of(nonMember));

        ForbiddenException ex = assertThrows(ForbiddenException.class, () ->
                deploymentService.executeDeployment(deployment.getId()));
        assertTrue(ex.getMessage().contains("You are not authorized to execute deployments"));
    }
}
