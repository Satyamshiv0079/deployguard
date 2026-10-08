package com.deployguard.repository;

import com.deployguard.entity.DeploymentApproval;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface DeploymentApprovalRepository extends JpaRepository<DeploymentApproval, UUID> {
    List<DeploymentApproval> findByDeploymentId(UUID deploymentId);
}
