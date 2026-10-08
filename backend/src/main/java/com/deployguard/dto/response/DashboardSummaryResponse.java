package com.deployguard.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DashboardSummaryResponse {
    // Project metrics
    private long totalProjects;
    private long activeProjects;
    private long completedProjects;
    private long blockedProjects;

    // Risk metrics
    private long totalRisks;
    private long openRisks;
    private long criticalRisks;

    // Deployment metrics
    private long totalDeployments;
    private long pendingDeployments;
    private long successfulDeployments;
    private long failedDeployments;
    private long rollbacks;

    // Task metrics
    private long totalTasks;
    private long overdueTasks;
    private long blockedTasks;

    // Visual Charts data
    private List<ChartDataPoint> deploymentsByStatus;
    private List<ChartDataPoint> projectsByStatus;
    private List<ChartDataPoint> risksBySeverity;
    private List<ChartDataPoint> tasksByStatus;

    // Recent items
    private List<DeploymentResponse> recentDeployments;
    private List<RiskResponse> criticalRiskList;
    private List<AuditLogResponse> recentAuditLogs;
}
