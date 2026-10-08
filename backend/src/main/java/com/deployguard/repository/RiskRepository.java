package com.deployguard.repository;

import com.deployguard.entity.Risk;
import com.deployguard.entity.enums.RiskSeverity;
import com.deployguard.entity.enums.RiskStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface RiskRepository extends JpaRepository<Risk, UUID>, JpaSpecificationExecutor<Risk> {

    @EntityGraph(attributePaths = {"project", "owner", "mitigations", "mitigations.owner"})
    Optional<Risk> findWithDetailsById(UUID id);

    @EntityGraph(attributePaths = {"project", "owner"})
    Page<Risk> findByProjectId(UUID projectId, Pageable pageable);

    @EntityGraph(attributePaths = {"project", "owner"})
    Page<Risk> findBySeverity(RiskSeverity severity, Pageable pageable);

    @EntityGraph(attributePaths = {"project", "owner"})
    Page<Risk> findByStatus(RiskStatus status, Pageable pageable);

    @Query("SELECT r FROM Risk r WHERE r.status NOT IN ('RESOLVED', 'CLOSED') ORDER BY r.riskScore DESC")
    List<Risk> findUnresolvedRisks();

    @Query("SELECT COUNT(r) FROM Risk r WHERE r.status NOT IN ('RESOLVED', 'CLOSED')")
    long countOpenRisks();

    @Query("SELECT COUNT(r) FROM Risk r WHERE r.status NOT IN ('RESOLVED', 'CLOSED') AND r.severity IN ('CRITICAL', 'HIGH')")
    long countCriticalAndHighRisks();

    @Query("SELECT r.severity, COUNT(r) FROM Risk r GROUP BY r.severity")
    List<Object[]> countGroupedBySeverity();
}
