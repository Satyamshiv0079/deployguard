package com.deployguard.dto.response;

import com.deployguard.entity.enums.AuditAction;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AuditLogResponse {
    private UUID id;
    private String username;
    private AuditAction action;
    private String entityType;
    private String entityId;
    private String ipAddress;
    private String description;
    private Instant timestamp;
}
