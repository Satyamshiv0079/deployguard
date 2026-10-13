package com.deployguard.audit;

import com.deployguard.entity.AuditLog;
import com.deployguard.entity.enums.AuditAction;
import com.deployguard.mapper.AuditLogMapper;
import com.deployguard.repository.AuditLogRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AuditServiceSecurityTest {

    @Mock
    private AuditLogRepository auditLogRepository;

    @Mock
    private AuditLogMapper auditLogMapper;

    @InjectMocks
    private AuditServiceImpl auditService;

    @BeforeEach
    void setUp() {
        ReflectionTestUtils.setField(auditService, "trustedProxiesConfig", "127.0.0.1,::1,10.0.0.1");
        RequestContextHolder.resetRequestAttributes();
    }

    @Test
    @DisplayName("Should maintain valid cryptographic SHA-256 hash chain across sequential audit events")
    void shouldMaintainValidCryptographicHashChain() {
        List<AuditLog> logChain = new ArrayList<>();

        when(auditLogRepository.findTopByOrderByTimestampDesc()).thenAnswer(inv ->
                logChain.isEmpty() ? Optional.empty() : Optional.of(logChain.get(logChain.size() - 1))
        );

        when(auditLogRepository.save(any(AuditLog.class))).thenAnswer(inv -> {
            AuditLog entry = inv.getArgument(0);
            entry.setId(UUID.randomUUID());
            logChain.add(entry);
            return entry;
        });

        when(auditLogRepository.findAllByOrderByTimestampAsc()).thenReturn(logChain);

        // Create sequential audit events
        auditService.log("alice", AuditAction.LOGIN, "AUTH", "user-1", "10.0.0.5", "User logged in");
        auditService.log("alice", AuditAction.DEPLOYMENT_REQUESTED, "DEPLOYMENT", "dep-1", "10.0.0.5", "Requested v1.0.0 release");
        auditService.log("bob", AuditAction.DEPLOYMENT_APPROVED, "DEPLOYMENT", "dep-1", "10.0.0.6", "Approved v1.0.0 release");

        assertEquals(3, logChain.size());
        assertEquals(AuditServiceImpl.GENESIS_HASH, logChain.get(0).getPrevHash());
        assertEquals(logChain.get(0).getRecordHash(), logChain.get(1).getPrevHash());
        assertEquals(logChain.get(1).getRecordHash(), logChain.get(2).getPrevHash());

        assertTrue(auditService.verifyIntegrity(), "Audit trail integrity check should pass for valid chain");
    }

    @Test
    @DisplayName("Should detect tampering when an audit record's content is modified post-creation")
    void shouldDetectTamperingWhenRecordModified() {
        List<AuditLog> logChain = new ArrayList<>();

        when(auditLogRepository.findTopByOrderByTimestampDesc()).thenAnswer(inv ->
                logChain.isEmpty() ? Optional.empty() : Optional.of(logChain.get(logChain.size() - 1))
        );

        when(auditLogRepository.save(any(AuditLog.class))).thenAnswer(inv -> {
            AuditLog entry = inv.getArgument(0);
            entry.setId(UUID.randomUUID());
            logChain.add(entry);
            return entry;
        });

        when(auditLogRepository.findAllByOrderByTimestampAsc()).thenReturn(logChain);

        auditService.log("alice", AuditAction.LOGIN, "AUTH", "user-1", "10.0.0.5", "User logged in");
        auditService.log("alice", AuditAction.DEPLOYMENT_REQUESTED, "DEPLOYMENT", "dep-1", "10.0.0.5", "Requested release");

        assertTrue(auditService.verifyIntegrity());

        // Attacker modifies log content directly in database (tampering)
        logChain.get(0).setDescription("Tampered description without updating hash");

        assertFalse(auditService.verifyIntegrity(), "Audit trail integrity check must detect modified record content");
    }

    @Test
    @DisplayName("Should detect tampering when a hash link in the chain is broken")
    void shouldDetectTamperingWhenHashLinkBroken() {
        List<AuditLog> logChain = new ArrayList<>();

        when(auditLogRepository.findTopByOrderByTimestampDesc()).thenAnswer(inv ->
                logChain.isEmpty() ? Optional.empty() : Optional.of(logChain.get(logChain.size() - 1))
        );

        when(auditLogRepository.save(any(AuditLog.class))).thenAnswer(inv -> {
            AuditLog entry = inv.getArgument(0);
            entry.setId(UUID.randomUUID());
            logChain.add(entry);
            return entry;
        });

        when(auditLogRepository.findAllByOrderByTimestampAsc()).thenReturn(logChain);

        auditService.log("alice", AuditAction.LOGIN, "AUTH", "user-1", "10.0.0.5", "User logged in");
        auditService.log("alice", AuditAction.DEPLOYMENT_REQUESTED, "DEPLOYMENT", "dep-1", "10.0.0.5", "Requested release");

        // Attacker points prevHash to arbitrary value
        logChain.get(1).setPrevHash("badhash0000000000000000000000000000000000000000000000000000000000");

        assertFalse(auditService.verifyIntegrity(), "Audit trail integrity check must detect broken chain linkage");
    }

    @Test
    @DisplayName("Should attribute client IP from X-Forwarded-For when request comes from a trusted proxy")
    void shouldTrustXForwardedForFromTrustedProxy() {
        MockHttpServletRequest request = new MockHttpServletRequest();
        request.setRemoteAddr("10.0.0.1"); // Trusted proxy
        request.addHeader("X-Forwarded-For", "198.51.100.77, 10.0.0.1");
        RequestContextHolder.setRequestAttributes(new ServletRequestAttributes(request));

        when(auditLogRepository.findTopByOrderByTimestampDesc()).thenReturn(Optional.empty());
        when(auditLogRepository.save(any(AuditLog.class))).thenAnswer(inv -> inv.getArgument(0));

        auditService.log("developer", AuditAction.LOGIN, "AUTH", "1", "Login event");

        verify(auditLogRepository).save(argThat(log -> "198.51.100.77".equals(log.getIpAddress())));
    }

    @Test
    @DisplayName("Should reject spoofed X-Forwarded-For header when request comes from untrusted remote address")
    void shouldRejectXForwardedForFromUntrustedSource() {
        MockHttpServletRequest request = new MockHttpServletRequest();
        request.setRemoteAddr("192.0.2.45"); // Untrusted direct client
        request.addHeader("X-Forwarded-For", "10.0.0.99"); // Spoofed header
        RequestContextHolder.setRequestAttributes(new ServletRequestAttributes(request));

        when(auditLogRepository.findTopByOrderByTimestampDesc()).thenReturn(Optional.empty());
        when(auditLogRepository.save(any(AuditLog.class))).thenAnswer(inv -> inv.getArgument(0));

        auditService.log("developer", AuditAction.LOGIN, "AUTH", "1", "Login event");

        verify(auditLogRepository).save(argThat(log -> "192.0.2.45".equals(log.getIpAddress())));
    }

    @Test
    @DisplayName("Should throw IllegalStateException when mandatory security audit event fails to persist")
    void shouldThrowExceptionWhenSecurityAuditFails() {
        when(auditLogRepository.findTopByOrderByTimestampDesc()).thenReturn(Optional.empty());
        when(auditLogRepository.save(any(AuditLog.class))).thenThrow(new RuntimeException("Database connection failure"));

        IllegalStateException ex = assertThrows(IllegalStateException.class, () ->
                auditService.logSecurityEvent("admin", AuditAction.USER_CREATED, "USER", "99", "Failed user create")
        );

        assertTrue(ex.getMessage().contains("Mandatory security audit event could not be persisted"));
    }
}
