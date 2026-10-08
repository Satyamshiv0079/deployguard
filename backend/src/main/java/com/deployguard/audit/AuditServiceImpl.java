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
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;

import java.time.Instant;

@Service
@RequiredArgsConstructor
public class AuditServiceImpl implements AuditService {

    private static final Logger log = LoggerFactory.getLogger(AuditServiceImpl.class);

    private final AuditLogRepository auditLogRepository;
    private final AuditLogMapper auditLogMapper;

    @Override
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void log(String username, AuditAction action, String entityType, String entityId, String description) {
        String ip = extractClientIp();
        log(username, action, entityType, entityId, ip, description);
    }

    @Override
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void log(String username, AuditAction action, String entityType, String entityId, String ipAddress, String description) {
        try {
            AuditLog auditLog = AuditLog.builder()
                    .username(username != null ? username : "ANONYMOUS")
                    .action(action)
                    .entityType(entityType)
                    .entityId(entityId)
                    .ipAddress(ipAddress != null ? ipAddress : "0.0.0.0")
                    .description(description)
                    .timestamp(Instant.now())
                    .build();

            auditLogRepository.save(auditLog);
            log.info("AUDIT: User='{}' Action='{}' Entity='{}:{}' Desc='{}'", username, action, entityType, entityId, description);
        } catch (Exception e) {
            log.error("Failed to write audit log entry: {}", e.getMessage(), e);
        }
    }

    @Override
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void logCurrent(AuditAction action, String entityType, String entityId, String description) {
        String username = "ANONYMOUS";
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth != null && auth.isAuthenticated() && !"anonymousUser".equals(auth.getPrincipal())) {
            username = auth.getName();
        }
        log(username, action, entityType, entityId, extractClientIp(), description);
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

    private String extractClientIp() {
        try {
            ServletRequestAttributes attributes = (ServletRequestAttributes) RequestContextHolder.getRequestAttributes();
            if (attributes != null) {
                HttpServletRequest request = attributes.getRequest();
                String xfHeader = request.getHeader("X-Forwarded-For");
                if (xfHeader == null || xfHeader.isEmpty() || "unknown".equalsIgnoreCase(xfHeader)) {
                    return request.getRemoteAddr();
                }
                return xfHeader.split(",")[0].trim();
            }
        } catch (Exception ignored) {
        }
        return "127.0.0.1";
    }
}
