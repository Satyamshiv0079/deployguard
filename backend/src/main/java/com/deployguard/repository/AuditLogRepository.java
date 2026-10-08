package com.deployguard.repository;

import com.deployguard.entity.AuditLog;
import com.deployguard.entity.enums.AuditAction;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.Instant;
import java.util.UUID;

@Repository
public interface AuditLogRepository extends JpaRepository<AuditLog, UUID> {
    Page<AuditLog> findAllByOrderByTimestampDesc(Pageable pageable);
    Page<AuditLog> findByUsernameOrderByTimestampDesc(String username, Pageable pageable);
    Page<AuditLog> findByActionOrderByTimestampDesc(AuditAction action, Pageable pageable);
    Page<AuditLog> findByEntityTypeOrderByTimestampDesc(String entityType, Pageable pageable);
    Page<AuditLog> findByTimestampBetweenOrderByTimestampDesc(Instant start, Instant end, Pageable pageable);
}
