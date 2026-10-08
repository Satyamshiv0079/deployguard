package com.deployguard.repository;

import com.deployguard.entity.Project;
import com.deployguard.entity.enums.ProjectStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface ProjectRepository extends JpaRepository<Project, UUID>, JpaSpecificationExecutor<Project> {

    @EntityGraph(attributePaths = {"createdBy", "members"})
    Optional<Project> findWithDetailsById(UUID id);

    boolean existsByKey(String key);

    Page<Project> findByArchivedFalse(Pageable pageable);

    Page<Project> findByStatusAndArchivedFalse(ProjectStatus status, Pageable pageable);

    long countByStatus(ProjectStatus status);

    long countByArchivedFalse();

    @Query("SELECT COUNT(p) FROM Project p WHERE p.archived = false AND p.status IN ('PLANNED', 'IN_PROGRESS', 'AT_RISK')")
    long countActiveProjects();
}
