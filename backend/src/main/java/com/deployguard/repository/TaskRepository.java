package com.deployguard.repository;

import com.deployguard.entity.Task;
import com.deployguard.entity.enums.TaskStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface TaskRepository extends JpaRepository<Task, UUID>, JpaSpecificationExecutor<Task> {

    @EntityGraph(attributePaths = {"project", "assignee", "reporter", "dependencies"})
    Optional<Task> findWithDetailsById(UUID id);

    @EntityGraph(attributePaths = {"assignee", "reporter", "dependencies"})
    List<Task> findByProjectId(UUID projectId);

    Page<Task> findByProjectId(UUID projectId, Pageable pageable);

    Page<Task> findByAssigneeId(UUID assigneeId, Pageable pageable);

    @Query("SELECT t FROM Task t WHERE t.status != 'DONE' AND t.dueDate < :today")
    List<Task> findOverdueTasks(@Param("today") LocalDate today);

    @Query("SELECT COUNT(t) FROM Task t WHERE t.status != 'DONE' AND t.dueDate < :today")
    long countOverdueTasks(@Param("today") LocalDate today);

    long countByStatus(TaskStatus status);
}
