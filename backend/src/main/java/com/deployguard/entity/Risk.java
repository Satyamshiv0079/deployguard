package com.deployguard.entity;

import com.deployguard.entity.enums.RiskSeverity;
import com.deployguard.entity.enums.RiskStatus;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.Instant;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Entity
@Table(name = "risks", indexes = {
    @Index(name = "idx_risks_project_id", columnList = "project_id"),
    @Index(name = "idx_risks_severity", columnList = "severity"),
    @Index(name = "idx_risks_status", columnList = "status"),
    @Index(name = "idx_risks_score", columnList = "risk_score")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Risk {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(nullable = false, length = 200)
    private String title;

    @Column(columnDefinition = "TEXT")
    private String description;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "project_id", nullable = false)
    private Project project;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "owner_id")
    private User owner;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    @Builder.Default
    private RiskSeverity severity = RiskSeverity.MEDIUM;

    @Column(nullable = false)
    @Builder.Default
    private int probability = 3; // 1 - 5

    @Column(nullable = false)
    @Builder.Default
    private int impact = 3; // 1 - 5

    @Column(name = "risk_score", nullable = false)
    private int riskScore; // probability * impact

    @Column(name = "mitigation_plan", columnDefinition = "TEXT")
    private String mitigationPlan;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    @Builder.Default
    private RiskStatus status = RiskStatus.OPEN;

    @Column(name = "due_date")
    private LocalDate dueDate;

    @OneToMany(mappedBy = "risk", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<RiskMitigation> mitigations = new ArrayList<>();

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    @PrePersist
    @PreUpdate
    public void calculateScore() {
        if (this.probability <= 0) this.probability = 1;
        if (this.probability > 5) this.probability = 5;
        if (this.impact <= 0) this.impact = 1;
        if (this.impact > 5) this.impact = 5;
        this.riskScore = this.probability * this.impact;

        // Auto align severity if score changes or allow manual severity
        if (this.riskScore >= 16) {
            this.severity = RiskSeverity.CRITICAL;
        } else if (this.riskScore >= 10) {
            this.severity = RiskSeverity.HIGH;
        } else if (this.riskScore >= 5) {
            this.severity = RiskSeverity.MEDIUM;
        } else {
            this.severity = RiskSeverity.LOW;
        }
    }
}
