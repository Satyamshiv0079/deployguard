package com.deployguard.audit;

import com.deployguard.dto.response.AuditLogResponse;
import com.deployguard.dto.response.PagedResponse;
import com.deployguard.entity.AuditLog;
import com.deployguard.entity.enums.AuditAction;
import com.deployguard.mapper.AuditLogMapper;
import com.deployguard.repository.AuditLogRepository;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.time.Instant;
import java.util.Arrays;
import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class AuditServiceImpl implements AuditService {

    private static final Logger log = LoggerFactory.getLogger(AuditServiceImpl.class);
    public static final String GENESIS_HASH = "0000000000000000000000000000000000000000000000000000000000000000";

    private final AuditLogRepository auditLogRepository;
    private final AuditLogMapper auditLogMapper;

    @Value("${app.security.trusted-proxies:127.0.0.1,::1,0:0:0:0:0:0:0:1}")
    private String trustedProxiesConfig;

    @Override
    @Transactional(propagation = Propagation.REQUIRED)
    public void log(String username, AuditAction action, String entityType, String entityId, String description) {
        String ip = extractClientIp();
        log(username, action, entityType, entityId, ip, description);
    }

    @Override
    @Transactional(propagation = Propagation.REQUIRED)
    public void log(String username, AuditAction action, String entityType, String entityId, String ipAddress, String description) {
        try {
            createAndSaveAuditLog(username, action, entityType, entityId, ipAddress, description);
            log.info("AUDIT: User='{}' Action='{}' Entity='{}:{}' Desc='{}'", username, action, entityType, entityId, description);
        } catch (Exception e) {
            log.error("Failed to write audit log entry: {}", e.getMessage(), e);
        }
    }

    @Override
    @Transactional(propagation = Propagation.REQUIRED)
    public void logCurrent(AuditAction action, String entityType, String entityId, String description) {
        String username = "ANONYMOUS";
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth != null && auth.isAuthenticated() && !"anonymousUser".equals(auth.getPrincipal())) {
            username = auth.getName();
        }
        log(username, action, entityType, entityId, extractClientIp(), description);
    }

    @Override
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void logSecurityEvent(String username, AuditAction action, String entityType, String entityId, String description) {
        String ip = extractClientIp();
        try {
            createAndSaveAuditLog(username, action, entityType, entityId, ip, description);
            log.info("SECURITY AUDIT: User='{}' Action='{}' Entity='{}:{}' Desc='{}'", username, action, entityType, entityId, description);
        } catch (Exception e) {
            log.error("CRITICAL SECURITY ERROR: Failed to write mandatory security audit event: {}", e.getMessage(), e);
            throw new IllegalStateException("Mandatory security audit event could not be persisted: " + e.getMessage(), e);
        }
    }

    private synchronized AuditLog createAndSaveAuditLog(String username, AuditAction action, String entityType, String entityId, String ipAddress, String description) {
        Optional<AuditLog> latest = auditLogRepository.findTopByOrderByTimestampDesc();
        String prevHash = latest.map(AuditLog::getRecordHash).orElse(GENESIS_HASH);
        if (prevHash == null || prevHash.isBlank()) {
            prevHash = GENESIS_HASH;
        }

        Instant now = Instant.now();
        String recordHash = calculateRecordHash(prevHash, now, username, action, entityType, entityId, ipAddress, description);

        AuditLog auditLog = AuditLog.builder()
                .username(username != null ? username : "ANONYMOUS")
                .action(action)
                .entityType(entityType)
                .entityId(entityId)
                .ipAddress(ipAddress != null ? ipAddress : "0.0.0.0")
                .description(description)
                .prevHash(prevHash)
                .recordHash(recordHash)
                .timestamp(now)
                .build();

        return auditLogRepository.save(auditLog);
    }

    public String calculateRecordHash(String prevHash, Instant timestamp, String username, AuditAction action,
                                      String entityType, String entityId, String ipAddress, String description) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            String data = (prevHash != null ? prevHash : GENESIS_HASH) + "|" +
                    (timestamp != null ? timestamp.toString() : "") + "|" +
                    (username != null ? username : "") + "|" +
                    (action != null ? action.name() : "") + "|" +
                    (entityType != null ? entityType : "") + "|" +
                    (entityId != null ? entityId : "") + "|" +
                    (ipAddress != null ? ipAddress : "") + "|" +
                    (description != null ? description : "");
            byte[] hashBytes = digest.digest(data.getBytes(StandardCharsets.UTF_8));
            StringBuilder sb = new StringBuilder();
            for (byte b : hashBytes) {
                sb.append(String.format("%02x", b));
            }
            return sb.toString();
        } catch (NoSuchAlgorithmException e) {
            throw new RuntimeException("SHA-256 algorithm not available in runtime environment", e);
        }
    }

    @Override
    @Transactional(readOnly = true)
    public boolean verifyIntegrity() {
        List<AuditLog> logs = auditLogRepository.findAllByOrderByTimestampAsc();
        if (logs.isEmpty()) {
            return true;
        }

        String expectedPrevHash = GENESIS_HASH;
        for (AuditLog entry : logs) {
            if (entry.getPrevHash() == null || !entry.getPrevHash().equals(expectedPrevHash)) {
                log.error("AUDIT INTEGRITY VIOLATION: Broken previous hash link at record id={}, expected={}, actual={}",
                        entry.getId(), expectedPrevHash, entry.getPrevHash());
                return false;
            }

            String recomputed = calculateRecordHash(
                    entry.getPrevHash(),
                    entry.getTimestamp(),
                    entry.getUsername(),
                    entry.getAction(),
                    entry.getEntityType(),
                    entry.getEntityId(),
                    entry.getIpAddress(),
                    entry.getDescription()
            );

            if (!recomputed.equals(entry.getRecordHash())) {
                log.error("AUDIT INTEGRITY VIOLATION: Record data tampering detected at record id={}, expectedHash={}, actualHash={}",
                        entry.getId(), recomputed, entry.getRecordHash());
                return false;
            }

            expectedPrevHash = entry.getRecordHash();
        }
        return true;
    }

    @Override
    @Transactional(readOnly = true)
    public PagedResponse<AuditLogResponse> getAuditLogs(String username, String action, String entityType, Pageable pageable) {
        Page<AuditLog> page;
        if (username != null && !username.isBlank()) {
            page = auditLogRepository.findByUsernameOrderByTimestampDesc(username.trim(), pageable);
        } else if (action != null && !action.isBlank()) {
            AuditAction auditAction = AuditAction.valueOf(action.trim().toUpperCase());
            page = auditLogRepository.findByActionOrderByTimestampDesc(auditAction, pageable);
        } else if (entityType != null && !entityType.isBlank()) {
            page = auditLogRepository.findByEntityTypeOrderByTimestampDesc(entityType.trim().toUpperCase(), pageable);
        } else {
            page = auditLogRepository.findAllByOrderByTimestampDesc(pageable);
        }
        return PagedResponse.of(page.map(auditLogMapper::toResponse));
    }

    private boolean isTrustedProxy(String ip) {
        if (ip == null || ip.isBlank()) return false;
        String trimmed = ip.trim();
        List<String> trusted = Arrays.stream(trustedProxiesConfig.split(","))
                .map(String::trim)
                .filter(s -> !s.isEmpty())
                .toList();

        for (String t : trusted) {
            if (t.equalsIgnoreCase(trimmed) || "127.0.0.1".equals(trimmed) || "0:0:0:0:0:0:0:1".equals(trimmed) || "::1".equals(trimmed)) {
                return true;
            }
        }
        return false;
    }

    private String extractClientIp() {
        try {
            ServletRequestAttributes attributes = (ServletRequestAttributes) RequestContextHolder.getRequestAttributes();
            if (attributes != null) {
                HttpServletRequest request = attributes.getRequest();
                String remoteAddr = request.getRemoteAddr();
                if (isTrustedProxy(remoteAddr)) {
                    String xfHeader = request.getHeader("X-Forwarded-For");
                    if (xfHeader != null && !xfHeader.isEmpty() && !"unknown".equalsIgnoreCase(xfHeader)) {
                        return xfHeader.split(",")[0].trim();
                    }
                }
                return remoteAddr != null ? remoteAddr : "127.0.0.1";
            }
        } catch (Exception ignored) {
        }
        return "127.0.0.1";
    }
}
