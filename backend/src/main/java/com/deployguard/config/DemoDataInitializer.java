package com.deployguard.config;

import com.deployguard.audit.AuditService;
import com.deployguard.entity.*;
import com.deployguard.entity.enums.*;
import com.deployguard.repository.*;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.CommandLineRunner;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.context.annotation.Profile;
import org.springframework.core.annotation.Order;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.LocalDate;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

@Component
@Order(2)
@Profile({"demo", "dev", "test"})
@ConditionalOnProperty(name = "app.demo.seed-data", havingValue = "true", matchIfMissing = false)
@RequiredArgsConstructor
public class DemoDataInitializer implements CommandLineRunner {

    private static final Logger log = LoggerFactory.getLogger(DemoDataInitializer.class);

    private final RoleRepository roleRepository;
    private final UserRepository userRepository;
    private final ProjectRepository projectRepository;
    private final TaskRepository taskRepository;
    private final DeploymentRepository deploymentRepository;
    private final DeploymentApprovalRepository approvalRepository;
    private final RiskRepository riskRepository;
    private final RiskMitigationRepository mitigationRepository;
    private final PasswordEncoder passwordEncoder;
    private final AuditService auditService;

    @Override
    @Transactional
    public void run(String... args) {
        if (userRepository.findByUsername("pm_sarah").isPresent()) {
            log.info("Demo dataset already present. Skipping demo data seeding.");
            return;
        }

        log.info("Explicit demo profile active: seeding local evaluation data...");

        Role pmRole = roleRepository.findByName(RoleType.ROLE_PROJECT_MANAGER)
                .orElseGet(() -> roleRepository.save(new Role(RoleType.ROLE_PROJECT_MANAGER)));
        Role devRole = roleRepository.findByName(RoleType.ROLE_DEVELOPER)
                .orElseGet(() -> roleRepository.save(new Role(RoleType.ROLE_DEVELOPER)));
        Role reviewerRole = roleRepository.findByName(RoleType.ROLE_REVIEWER)
                .orElseGet(() -> roleRepository.save(new Role(RoleType.ROLE_REVIEWER)));

        User admin = userRepository.findByUsername("admin").orElse(null);

        // Demo Users for local testing & interactive evaluation
        User pmSarah = userRepository.save(User.builder()
                .username("pm_sarah")
                .email("sarah.jenkins@deployguard.internal")
                .password(passwordEncoder.encode("Password@123"))
                .fullName("Sarah Jenkins")
                .department("Payment Platforms Delivery")
                .active(true)
                .roles(Set.of(pmRole))
                .build());

        User devAlex = userRepository.save(User.builder()
                .username("dev_alex")
                .email("alex.rivera@deployguard.internal")
                .password(passwordEncoder.encode("Password@123"))
                .fullName("Alex Rivera")
                .department("Core Banking Engineering")
                .active(true)
                .roles(Set.of(devRole))
                .build());

        User revMarcus = userRepository.save(User.builder()
                .username("rev_marcus")
                .email("marcus.vance@deployguard.internal")
                .password(passwordEncoder.encode("Password@123"))
                .fullName("Marcus Vance")
                .department("Release Governance & Risk Controls")
                .active(true)
                .roles(Set.of(reviewerRole))
                .build());

        // Demo Projects
        Project csg = projectRepository.save(Project.builder()
                .name("Core Settlement Gateway")
                .key("CSG-01")
                .description("High-throughput SWIFT ISO-20022 message processor and real-time interbank settlement orchestration service.")
                .status(ProjectStatus.IN_PROGRESS)
                .priority(Priority.CRITICAL)
                .startDate(LocalDate.now().minusMonths(3))
                .targetEndDate(LocalDate.now().plusMonths(3))
                .createdBy(pmSarah)
                .members(new HashSet<>(List.of(pmSarah, devAlex, revMarcus)))
                .build());

        Project rtf = projectRepository.save(Project.builder()
                .name("Real-Time Fraud Detection Engine")
                .key("RTF-02")
                .description("Sub-10ms transactional fraud scoring cluster utilizing machine learning inference across card transactions.")
                .status(ProjectStatus.AT_RISK)
                .priority(Priority.HIGH)
                .startDate(LocalDate.now().minusMonths(2))
                .targetEndDate(LocalDate.now().plusMonths(4))
                .createdBy(pmSarah)
                .members(new HashSet<>(List.of(pmSarah, devAlex)))
                .build());

        Project obr = projectRepository.save(Project.builder()
                .name("Open Banking Regulatory API")
                .key("OBR-03")
                .description("PSD2 compliant developer open banking platform exposing accounts and payment initiation endpoints.")
                .status(ProjectStatus.COMPLETED)
                .priority(Priority.MEDIUM)
                .startDate(LocalDate.now().minusMonths(6))
                .targetEndDate(LocalDate.now().minusMonths(1))
                .actualEndDate(LocalDate.now().minusMonths(1))
                .createdBy(admin != null ? admin : pmSarah)
                .members(new HashSet<>(List.of(pmSarah, devAlex)))
                .build());

        // Demo Tasks
        Task taskMtls = taskRepository.save(Task.builder()
                .title("Implement mutual TLS certificate automated rotation")
                .description("Configure Vault agent sidecar to automatically refresh mTLS certs before 72h expiration.")
                .status(TaskStatus.DONE)
                .priority(Priority.CRITICAL)
                .dueDate(LocalDate.now().minusDays(5))
                .project(csg)
                .reporter(pmSarah)
                .assignee(devAlex)
                .build());

        Task taskIsoParser = taskRepository.save(Task.builder()
                .title("Migrate ISO 20022 XML parser to streaming pipeline")
                .description("Refactor XML DOM parser to StAX streaming parser to prevent heap spikes during bulk settlement windows.")
                .status(TaskStatus.IN_PROGRESS)
                .priority(Priority.HIGH)
                .dueDate(LocalDate.now().plusDays(8))
                .project(csg)
                .reporter(pmSarah)
                .assignee(devAlex)
                .build());

        Task taskStressTest = taskRepository.save(Task.builder()
                .title("Conduct stress test under 15,000 TPS")
                .description("Run Gatling performance test suite against staging environment to benchmark latency p99.9.")
                .status(TaskStatus.TODO)
                .priority(Priority.MEDIUM)
                .dueDate(LocalDate.now().plusDays(20))
                .project(csg)
                .reporter(pmSarah)
                .assignee(devAlex)
                .dependencies(Set.of(taskIsoParser))
                .build());

        Task taskFraudBlock = taskRepository.save(Task.builder()
                .title("Fine-tune ML inference threshold for card fraud")
                .description("Recalibrate ensemble model parameters to minimize false positive rate below 0.02%.")
                .status(TaskStatus.BLOCKED)
                .priority(Priority.CRITICAL)
                .dueDate(LocalDate.now().minusDays(2))
                .blockedReason("Waiting on sanitized card transaction dump approval from Data Protection Office.")
                .project(rtf)
                .reporter(pmSarah)
                .assignee(devAlex)
                .build());

        // Demo Deployments & Approvals
        Deployment depDev = deploymentRepository.save(Deployment.builder()
                .project(csg)
                .version("v2.3.9")
                .environment(DeploymentEnvironment.DEVELOPMENT)
                .requestedBy(devAlex)
                .reason("Sprint 14 feature verification")
                .changeDescription("Added StAX streaming parser preliminary prototype.")
                .riskLevel(Priority.LOW)
                .status(DeploymentStatus.SUCCESSFUL)
                .pipelineRunId("PIPE-DEV-9801A")
                .executedAt(Instant.now().minusSeconds(86400 * 4))
                .build());

        Deployment depStaging = deploymentRepository.save(Deployment.builder()
                .project(csg)
                .version("v2.4.0-rc1")
                .environment(DeploymentEnvironment.STAGING)
                .requestedBy(devAlex)
                .reason("Pre-release integration testing")
                .changeDescription("Bundled mTLS rotation module with XML parser optimization.")
                .riskLevel(Priority.MEDIUM)
                .status(DeploymentStatus.SUCCESSFUL)
                .pipelineRunId("PIPE-STG-4122B")
                .executedAt(Instant.now().minusSeconds(86400 * 2))
                .build());

        Deployment depProdReview = deploymentRepository.save(Deployment.builder()
                .project(csg)
                .version("v2.4.0")
                .environment(DeploymentEnvironment.PRODUCTION)
                .requestedBy(devAlex)
                .reason("Scheduled quarterly settlement gateway release")
                .changeDescription("Includes high-throughput streaming and automated cert rotation.")
                .riskLevel(Priority.HIGH)
                .status(DeploymentStatus.UNDER_REVIEW)
                .pipelineRunId("PIPE-PROD-7711C")
                .build());

        Deployment depRtfApproved = deploymentRepository.save(Deployment.builder()
                .project(rtf)
                .version("v1.8.2")
                .environment(DeploymentEnvironment.PRODUCTION)
                .requestedBy(devAlex)
                .reason("Critical CVE patch in fraud scoring runtime")
                .changeDescription("Upgraded Jackson library to 2.17.2 and enabled strict deserialization validation.")
                .riskLevel(Priority.CRITICAL)
                .status(DeploymentStatus.APPROVED)
                .pipelineRunId("PIPE-PROD-9944D")
                .build());

        DeploymentApproval appRtf = approvalRepository.save(DeploymentApproval.builder()
                .deployment(depRtfApproved)
                .reviewer(revMarcus)
                .status(ApprovalStatus.APPROVED)
                .comments("Verified vulnerability scan report. Zero regressions detected in staging.")
                .reviewedAt(Instant.now().minusSeconds(3600 * 4))
                .build());
        depRtfApproved.getApprovals().add(appRtf);

        Deployment depRolledBack = deploymentRepository.save(Deployment.builder()
                .project(obr)
                .version("v1.0.5")
                .environment(DeploymentEnvironment.PRODUCTION)
                .requestedBy(devAlex)
                .reason("Emergency database connection pool adjustment")
                .changeDescription("Increased Hikari max-lifetime to 1800s.")
                .riskLevel(Priority.HIGH)
                .status(DeploymentStatus.ROLLED_BACK)
                .pipelineRunId("PIPE-PROD-2201F")
                .executedAt(Instant.now().minusSeconds(86400 * 10))
                .rolledBackAt(Instant.now().minusSeconds(86400 * 9))
                .rollbackReason("Detected connection exhaustion on standby database replica. Immediate reversion executed.")
                .build());

        // Demo Risks & Mitigations
        Risk riskLatency = Risk.builder()
                .title("Third-Party Liquidity Provider API Latency Degradation")
                .description("Under market volatility, clearing house webhooks may experience latency spikes exceeding 4500ms.")
                .project(csg)
                .owner(devAlex)
                .probability(4)
                .impact(4)
                .mitigationPlan("Implement resilient circuit breaker (Resilience4j) with exponential backoff and localized queue caching.")
                .status(RiskStatus.MITIGATING)
                .dueDate(LocalDate.now().plusDays(15))
                .build();
        riskLatency.calculateScore();
        Risk savedRiskLatency = riskRepository.save(riskLatency);

        mitigationRepository.save(RiskMitigation.builder()
                .risk(savedRiskLatency)
                .actionTitle("Configure Resilience4j circuit breaker with 5s threshold")
                .actionDescription("Set sliding window size to 100 calls and minimum failure rate to 50%.")
                .owner(devAlex)
                .completed(true)
                .completedAt(Instant.now().minusSeconds(86400))
                .build());

        mitigationRepository.save(RiskMitigation.builder()
                .risk(savedRiskLatency)
                .actionTitle("Implement asynchronous Redis dead-letter buffer for retries")
                .actionDescription("Route failed webhook notifications to partitioned Redis streams.")
                .owner(devAlex)
                .completed(false)
                .build());

        Risk riskKafka = Risk.builder()
                .title("Kafka Cluster Rebalance Outage During Peak Trading Hours")
                .description("Dynamic group rebalance in broker cluster may freeze settlement pipeline consumer lag beyond acceptable RTO.")
                .project(rtf)
                .owner(devAlex)
                .probability(4)
                .impact(5)
                .mitigationPlan("Switch consumer groups to cooperative sticky assignor and increase max.poll.interval.ms.")
                .status(RiskStatus.OPEN)
                .dueDate(LocalDate.now().plusDays(7))
                .build();
        riskKafka.calculateScore();
        riskRepository.save(riskKafka);

        Risk riskCompliance = Risk.builder()
                .title("UK Open Banking Specification Revision v3.1.10 Gap")
                .description("Potential divergence in consent authorization header validation rules.")
                .project(obr)
                .owner(pmSarah)
                .probability(2)
                .impact(3)
                .mitigationPlan("Audit schema validator against open banking conformance test suite.")
                .status(RiskStatus.RESOLVED)
                .dueDate(LocalDate.now().minusDays(10))
                .build();
        riskCompliance.calculateScore();
        riskRepository.save(riskCompliance);

        // Seed audit logs for demo actions
        auditService.log("pm_sarah", AuditAction.PROJECT_CREATED, "PROJECT", csg.getId().toString(), "Initialized project 'Core Settlement Gateway'");
        auditService.log("dev_alex", AuditAction.DEPLOYMENT_REQUESTED, "DEPLOYMENT", depProdReview.getId().toString(), "Requested production release for v2.4.0");
        auditService.log("rev_marcus", AuditAction.DEPLOYMENT_APPROVED, "DEPLOYMENT", depRtfApproved.getId().toString(), "Approved production release for v1.8.2");
        auditService.log("dev_alex", AuditAction.DEPLOYMENT_ROLLED_BACK, "DEPLOYMENT", depRolledBack.getId().toString(), "Rolled back v1.0.5 due to replica exhaustion");
        auditService.log("dev_alex", AuditAction.RISK_CREATED, "RISK", savedRiskLatency.getId().toString(), "Identified third-party liquidity latency vulnerability");

        log.info("Demo data seeding completed successfully.");
    }
}
