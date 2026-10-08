package com.deployguard.service;

import com.deployguard.audit.AuditService;
import com.deployguard.dto.request.DeploymentApprovalRequest;
import com.deployguard.dto.response.DeploymentResponse;
import com.deployguard.entity.Deployment;
import com.deployguard.entity.Project;
import com.deployguard.entity.User;
import com.deployguard.entity.enums.DeploymentEnvironment;
import com.deployguard.entity.enums.DeploymentStatus;
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
import java.util.Optional;
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
    private Project project;
    private Deployment deployment;

    @BeforeEach
    void setUp() {
        requester = User.builder()
                .id(UUID.randomUUID())
                .username("dev_alex")
                .fullName("Alex Rivera")
                .build();

        reviewer = User.builder()
                .id(UUID.randomUUID())
                .username("rev_marcus")
                .fullName("Marcus Vance")
                .build();

        project = Project.builder()
                .id(UUID.randomUUID())
                .name("Core Settlement Gateway")
                .key("CSG-01")
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
    @DisplayName("Should prohibit requester from approving their own deployment request (Four-Eyes Principle)")
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
    @DisplayName("Should allow independent reviewer to approve production deployment request")
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
    @DisplayName("Should reject execution if deployment has not been approved")
    void shouldRejectExecutionIfNotApproved() {
        deployment.setStatus(DeploymentStatus.UNDER_REVIEW);
        when(deploymentRepository.findWithDetailsById(deployment.getId())).thenReturn(Optional.of(deployment));

        BadRequestException ex = assertThrows(BadRequestException.class, () ->
                deploymentService.executeDeployment(deployment.getId()));

        assertTrue(ex.getMessage().contains("Deployment must be APPROVED before execution"));
    }
}
