package com.deployguard.repository;

import com.deployguard.entity.RiskMitigation;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface RiskMitigationRepository extends JpaRepository<RiskMitigation, UUID> {
    List<RiskMitigation> findByRiskId(UUID riskId);
}
