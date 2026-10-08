package com.deployguard.service.impl;

import com.deployguard.dto.response.ChartDataPoint;
import com.deployguard.dto.response.DashboardSummaryResponse;
import com.deployguard.dto.response.DeploymentResponse;
import com.deployguard.dto.response.RiskResponse;
import com.deployguard.entity.enums.DeploymentStatus;
import com.deployguard.entity.enums.ProjectStatus;
import com.deployguard.entity.enums.RiskSeverity;
import com.deployguard.entity.enums.TaskStatus;
import com.deployguard.mapper.AuditLogMapper;
import com.deployguard.mapper.DeploymentMapper;
import com.deployguard.mapper.RiskMapper;
import com.deployguard.repository.AuditLogRepository;
import com.deployguard.repository.DeploymentRepository;
import com.deployguard.repository.ProjectRepository;
import com.deployguard.repository.RiskRepository;
import com.deployguard.repository.TaskRepository;
import com.deployguard.service.DashboardService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class DashboardServiceImpl implements DashboardService {

    private final ProjectRepository projectRepository;
    private final TaskRepository taskRepository;
    private final DeploymentRepository deploymentRepository;
    private final RiskRepository riskRepository;
    private final AuditLogRepository auditLogRepository;
    private final DeploymentMapper deploymentMapper;
    private final RiskMapper riskMapper;
    private final AuditLogMapper auditLogMapper;

    @Override
    @Transactional(readOnly = true)
    public DashboardSummaryResponse getDashboardSummary() {
        // Project metrics
        long totalProjects = projectRepository.countByArchivedFalse();
        long activeProjects = projectRepository.countActiveProjects();
        long completedProjects = projectRepository.countByStatus(ProjectStatus.COMPLETED);
        long blockedProjects = projectRepository.countByStatus(ProjectStatus.BLOCKED);

        // Risk metrics
        long totalRisks = riskRepository.count();
        long openRisks = riskRepository.countOpenRisks();
        long criticalRisks = riskRepository.countCriticalAndHighRisks();

        // Deployment metrics
        long totalDeployments = deploymentRepository.count();
        long pendingDeployments = deploymentRepository.countPendingDeployments();
        long successfulDeployments = deploymentRepository.countByStatus(DeploymentStatus.SUCCESSFUL);
        long failedDeployments = deploymentRepository.countByStatus(DeploymentStatus.FAILED);
        long rollbacks = deploymentRepository.countByStatus(DeploymentStatus.ROLLED_BACK);

        // Task metrics
        long totalTasks = taskRepository.count();
        long overdueTasks = taskRepository.countOverdueTasks(LocalDate.now());
        long blockedTasks = taskRepository.countByStatus(TaskStatus.BLOCKED);

        // Charts: Deployments
        List<ChartDataPoint> deploymentsByStatus = new ArrayList<>();
        deploymentsByStatus.add(new ChartDataPoint("Successful", successfulDeployments, "#10b981"));
        deploymentsByStatus.add(new ChartDataPoint("Under Review", deploymentRepository.countByStatus(DeploymentStatus.UNDER_REVIEW), "#f59e0b"));
        deploymentsByStatus.add(new ChartDataPoint("Approved", deploymentRepository.countByStatus(DeploymentStatus.APPROVED), "#3b82f6"));
        deploymentsByStatus.add(new ChartDataPoint("Failed", failedDeployments, "#ef4444"));
        deploymentsByStatus.add(new ChartDataPoint("Rolled Back", rollbacks, "#8b5cf6"));

        // Charts: Projects
        List<ChartDataPoint> projectsByStatus = new ArrayList<>();
        projectsByStatus.add(new ChartDataPoint("Planned", projectRepository.countByStatus(ProjectStatus.PLANNED), "#94a3b8"));
        projectsByStatus.add(new ChartDataPoint("In Progress", projectRepository.countByStatus(ProjectStatus.IN_PROGRESS), "#3b82f6"));
        projectsByStatus.add(new ChartDataPoint("At Risk", projectRepository.countByStatus(ProjectStatus.AT_RISK), "#f59e0b"));
        projectsByStatus.add(new ChartDataPoint("Blocked", blockedProjects, "#ef4444"));
        projectsByStatus.add(new ChartDataPoint("Completed", completedProjects, "#10b981"));

        // Charts: Risks
        List<ChartDataPoint> risksBySeverity = new ArrayList<>();
        risksBySeverity.add(new ChartDataPoint("Low", riskRepository.findBySeverity(RiskSeverity.LOW, PageRequest.of(0, 1)).getTotalElements(), "#10b981"));
        risksBySeverity.add(new ChartDataPoint("Medium", riskRepository.findBySeverity(RiskSeverity.MEDIUM, PageRequest.of(0, 1)).getTotalElements(), "#3b82f6"));
        risksBySeverity.add(new ChartDataPoint("High", riskRepository.findBySeverity(RiskSeverity.HIGH, PageRequest.of(0, 1)).getTotalElements(), "#f59e0b"));
        risksBySeverity.add(new ChartDataPoint("Critical", riskRepository.findBySeverity(RiskSeverity.CRITICAL, PageRequest.of(0, 1)).getTotalElements(), "#ef4444"));

        // Charts: Tasks
        List<ChartDataPoint> tasksByStatus = new ArrayList<>();
        tasksByStatus.add(new ChartDataPoint("To Do", taskRepository.countByStatus(TaskStatus.TODO), "#94a3b8"));
        tasksByStatus.add(new ChartDataPoint("In Progress", taskRepository.countByStatus(TaskStatus.IN_PROGRESS), "#3b82f6"));
        tasksByStatus.add(new ChartDataPoint("In Review", taskRepository.countByStatus(TaskStatus.IN_REVIEW), "#8b5cf6"));
        tasksByStatus.add(new ChartDataPoint("Blocked", blockedTasks, "#ef4444"));
        tasksByStatus.add(new ChartDataPoint("Done", taskRepository.countByStatus(TaskStatus.DONE), "#10b981"));

        // Recent items
        List<DeploymentResponse> recentDeployments = deploymentRepository
                .findAllByOrderByCreatedAtDesc(PageRequest.of(0, 5))
                .getContent()
                .stream()
                .map(deploymentMapper::toResponse)
                .collect(Collectors.toList());

        List<RiskResponse> criticalRiskList = riskRepository
                .findUnresolvedRisks()
                .stream()
                .filter(r -> r.getSeverity() == RiskSeverity.CRITICAL || r.getSeverity() == RiskSeverity.HIGH)
                .limit(5)
                .map(riskMapper::toResponse)
                .collect(Collectors.toList());

        var recentAuditLogs = auditLogRepository
                .findAllByOrderByTimestampDesc(PageRequest.of(0, 5))
                .getContent()
                .stream()
                .map(auditLogMapper::toResponse)
                .collect(Collectors.toList());

        return DashboardSummaryResponse.builder()
                .totalProjects(totalProjects)
                .activeProjects(activeProjects)
                .completedProjects(completedProjects)
                .blockedProjects(blockedProjects)
                .totalRisks(totalRisks)
                .openRisks(openRisks)
                .criticalRisks(criticalRisks)
                .totalDeployments(totalDeployments)
                .pendingDeployments(pendingDeployments)
                .successfulDeployments(successfulDeployments)
                .failedDeployments(failedDeployments)
                .rollbacks(rollbacks)
                .totalTasks(totalTasks)
                .overdueTasks(overdueTasks)
                .blockedTasks(blockedTasks)
                .deploymentsByStatus(deploymentsByStatus)
                .projectsByStatus(projectsByStatus)
                .risksBySeverity(risksBySeverity)
                .tasksByStatus(tasksByStatus)
                .recentDeployments(recentDeployments)
                .criticalRiskList(criticalRiskList)
                .recentAuditLogs(recentAuditLogs)
                .build();
    }
}
