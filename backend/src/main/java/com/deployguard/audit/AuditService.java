package com.deployguard.audit;

import com.deployguard.dto.response.AuditLogResponse;
import com.deployguard.dto.response.PagedResponse;
import com.deployguard.entity.enums.AuditAction;
import org.springframework.data.domain.Pageable;

public interface AuditService {
    void log(String username, AuditAction action, String entityType, String entityId, String description);
    void log(String username, AuditAction action, String entityType, String entityId, String ipAddress, String description);
    void logCurrent(AuditAction action, String entityType, String entityId, String description);
    void logSecurityEvent(String username, AuditAction action, String entityType, String entityId, String description);
    PagedResponse<AuditLogResponse> getAuditLogs(String username, String action, String entityType, Pageable pageable);
    boolean verifyIntegrity();
}
