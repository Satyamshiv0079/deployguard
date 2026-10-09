package com.deployguard.repository;

import com.deployguard.entity.Deployment;
import com.deployguard.entity.enums.DeploymentEnvironment;
import com.deployguard.entity.enums.DeploymentStatus;
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
public interface DeploymentRepository extends JpaRepository<Deployment, UUID>, JpaSpecificationExecutor<Deployment> {

    @EntityGraph(attributePaths = {"project", "requestedBy", "approvals", "approvals.reviewer"})
    Optional<Deployment> findWithDetailsById(UUID id);

    @Override
    @EntityGraph(attributePaths = {"project", "requestedBy"})
    Page<Deployment> findAll(org.springframework.data.jpa.domain.Specification<Deployment> spec, Pageable pageable);

    @EntityGraph(attributePaths = {"project", "requestedBy"})
    Page<Deployment> findAllByOrderByCreatedAtDesc(Pageable pageable);

    @EntityGraph(attributePaths = {"project", "requestedBy"})
    Page<Deployment> findByProjectId(UUID projectId, Pageable pageable);

    @EntityGraph(attributePaths = {"project", "requestedBy"})
    Page<Deployment> findByEnvironment(DeploymentEnvironment environment, Pageable pageable);

    @EntityGraph(attributePaths = {"project", "requestedBy"})
    Page<Deployment> findByStatus(DeploymentStatus status, Pageable pageable);

    long countByStatus(DeploymentStatus status);

    @Query("SELECT COUNT(d) FROM Deployment d WHERE d.status IN ('REQUESTED', 'UNDER_REVIEW')")
    long countPendingDeployments();

    @Query("SELECT d.status, COUNT(d) FROM Deployment d GROUP BY d.status")
    List<Object[]> countGroupedByStatus();
}
