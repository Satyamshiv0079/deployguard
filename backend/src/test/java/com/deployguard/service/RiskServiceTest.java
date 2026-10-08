package com.deployguard.service;

import com.deployguard.audit.AuditService;
import com.deployguard.dto.request.RiskCreateRequest;
import com.deployguard.dto.response.RiskResponse;
import com.deployguard.entity.Project;
import com.deployguard.entity.Risk;
import com.deployguard.entity.User;
import com.deployguard.entity.enums.RiskSeverity;
import com.deployguard.entity.enums.RiskStatus;
import com.deployguard.mapper.RiskMapper;
import com.deployguard.repository.ProjectRepository;
import com.deployguard.repository.RiskMitigationRepository;
import com.deployguard.repository.RiskRepository;
import com.deployguard.repository.UserRepository;
import com.deployguard.service.impl.RiskServiceImpl;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class RiskServiceTest {

    @Mock
    private RiskRepository riskRepository;

    @Mock
    private RiskMitigationRepository mitigationRepository;

    @Mock
    private ProjectRepository projectRepository;

    @Mock
    private UserRepository userRepository;

    @Mock
    private RiskMapper riskMapper;

    @Mock
    private AuditService auditService;

    @InjectMocks
    private RiskServiceImpl riskService;

    private Project mockProject;
    private User mockOwner;

    @BeforeEach
    void setUp() {
        mockProject = Project.builder()
                .id(UUID.randomUUID())
                .name("Test Core Banking")
                .key("TCB-01")
                .build();

        mockOwner = User.builder()
                .id(UUID.randomUUID())
                .username("test_analyst")
                .build();
    }

    @Test
    @DisplayName("Should correctly calculate risk score (probability x impact) and assign CRITICAL severity for score >= 16")
    void shouldCalculateCriticalRiskScore() {
        UUID projectId = mockProject.getId();
        UUID ownerId = mockOwner.getId();

        RiskCreateRequest request = RiskCreateRequest.builder()
                .title("Database Replica Latency Desync")
                .projectId(projectId)
                .ownerId(ownerId)
                .probability(5)
                .impact(4) // 5 * 4 = 20 (CRITICAL)
                .build();

        when(projectRepository.findById(projectId)).thenReturn(Optional.of(mockProject));
        when(userRepository.findById(ownerId)).thenReturn(Optional.of(mockOwner));
        when(riskRepository.save(any(Risk.class))).thenAnswer(invocation -> {
            Risk saved = invocation.getArgument(0);
            saved.setId(UUID.randomUUID());
            return saved;
        });
        when(riskMapper.toResponse(any(Risk.class))).thenAnswer(invocation -> {
            Risk r = invocation.getArgument(0);
            return RiskResponse.builder()
                    .id(r.getId())
                    .title(r.getTitle())
                    .riskScore(r.getRiskScore())
                    .severity(r.getSeverity())
                    .status(r.getStatus())
                    .build();
        });

        RiskResponse response = riskService.createRisk(request);

        assertNotNull(response);
        assertEquals(20, response.getRiskScore());
        assertEquals(RiskSeverity.CRITICAL, response.getSeverity());
        assertEquals(RiskStatus.OPEN, response.getStatus());

        verify(riskRepository, times(1)).save(any(Risk.class));
        verify(auditService, times(1)).logCurrent(any(), any(), any(), any());
    }

    @Test
    @DisplayName("Should auto-align LOW severity when risk score is below 5")
    void shouldAssignLowSeverityForLowScore() {
        Risk risk = Risk.builder()
                .title("Minor UI Glitch in Report Export")
                .probability(2)
                .impact(2) // 4 -> LOW
                .build();
        risk.calculateScore();

        assertEquals(4, risk.getRiskScore());
        assertEquals(RiskSeverity.LOW, risk.getSeverity());
    }
}
