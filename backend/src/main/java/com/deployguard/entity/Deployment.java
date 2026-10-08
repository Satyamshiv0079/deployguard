package com.deployguard.entity;

import com.deployguard.entity.enums.DeploymentEnvironment;
import com.deployguard.entity.enums.DeploymentStatus;
import com.deployguard.entity.enums.Priority;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Entity
@Table(name = "deployments", indexes = {
    @Index(name = "idx_deployments_project_id", columnList = "project_id"),
    @Index(name = "idx_deployments_status", columnList = "status"),
    @Index(name = "idx_deployments_env", columnList = "environment"),
    @Index(name = "idx_deployments_requested_by", columnList = "requested_by_id")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Deployment {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "project_id", nullable = false)
    private Project project;

    @Column(nullable = false, length = 50)
    private String version;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    private DeploymentEnvironment environment;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "requested_by_id", nullable = false)
    private User requestedBy;

    @Column(nullable = false, length = 500)
    private String reason;

    @Column(name = "change_description", columnDefinition = "TEXT")
    private String changeDescription;

    @Enumerated(EnumType.STRING)
    @Column(name = "risk_level", nullable = false, length = 30)
    @Builder.Default
    private Priority riskLevel = Priority.MEDIUM;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    @Builder.Default
    private DeploymentStatus status = DeploymentStatus.REQUESTED;

    @Column(name = "pipeline_run_id", length = 100)
    private String pipelineRunId;

    @Column(name = "executed_at")
    private Instant executedAt;

    @Column(name = "rolled_back_at")
    private Instant rolledBackAt;

    @Column(name = "rollback_reason", length = 1000)
    private String rollbackReason;

    @OneToMany(mappedBy = "deployment", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<DeploymentApproval> approvals = new ArrayList<>();

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;
}
