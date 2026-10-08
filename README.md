# DeployGuard — Enterprise Software Deployment, Risk & Governance Platform

DeployGuard is a production-grade software deployment, risk assessment, and release governance platform designed specifically for highly regulated enterprise and banking environments (such as Core Banking, High-Throughput Clearing, Payment Gateways, and Open Banking APIs).

It bridges the critical governance gap between agile engineering velocity and stringent regulatory compliance (SOC2 Type II, ISO 27001, PCI-DSS, and BCBS 239) by enforcing mandatory **Four-Eyes principle deployment approvals**, **automated risk scoring**, **circular-dependency-safe agile task tracking**, and an **append-only immutable audit trail**.

---

## Architecture Diagram

```mermaid
flowchart TD
    subgraph ClientLayer ["Client & Governance Console"]
        FE["React + Vite + TypeScript (Tailwind CSS)"]
        CLI["CI/CD Automated Deployment Agents"]
    end

    subgraph SecurityGateway ["Security & Access Layer"]
        Nginx["Reverse Proxy / Nginx Gateway"]
        AuthFilter["OncePerRequestFilter (JWT Bearer Auth)"]
        RBAC["Spring Security RBAC Engine (@EnableMethodSecurity)"]
    end

    subgraph CoreEngine ["DeployGuard Modular Monolith (Spring Boot 3.3.x)"]
        AuthCtrl["Auth & User Controller"]
        ProjCtrl["Project Governance Controller"]
        TaskCtrl["Agile Task & Blockers Controller"]
        DepCtrl["Deployment & Release Controller"]
        RiskCtrl["Risk & Controls Controller"]
        AuditCtrl["Audit Log Inspector Controller"]
        DashCtrl["Executive Metrics Aggregator"]
        
        subgraph BusinessServices ["Domain Services (Transactional Business Logic)"]
            AuthSvc["AuthService & BCrypt"]
            ProjSvc["ProjectService"]
            TaskSvc["TaskService (Cycle Detector)"]
            DepSvc["DeploymentService (4-Eyes Gate)"]
            RiskSvc["RiskService (P × I Engine)"]
            AuditSvc["AuditService (Propagation.REQUIRES_NEW)"]
            DashSvc["DashboardAggregatorService"]
        end
    end

    subgraph PersistenceLayer ["Enterprise Datastore"]
        PG[(PostgreSQL 16 Enterprise DB)]
        H2[(In-Memory H2 DB for Unit/Integration Tests)]
    end

    FE -->|HTTPS / REST| Nginx
    CLI -->|HTTPS / API Token| Nginx
    Nginx --> AuthFilter
    AuthFilter --> RBAC
    RBAC --> CoreEngine
    
    AuthCtrl --> AuthSvc
    ProjCtrl --> ProjSvc
    TaskCtrl --> TaskSvc
    DepCtrl --> DepSvc
    RiskCtrl --> RiskSvc
    AuditCtrl --> AuditSvc
    DashCtrl --> DashSvc

    BusinessServices -->|Spring Data JPA / Hibernate| PG
    BusinessServices -.->|Test Harness| H2
```

---

## Problem Statement

In institutional banking and tier-1 enterprise IT environments, rogue or unreviewed code changes cause severe regulatory fines, financial outages, and security breaches:
1. **Unregulated Deployments:** Engineers pushing release packages directly into production without verified reviewer sign-off.
2. **Conflict of Interest:** Lack of strict segregation of duties (engineers approving their own production releases).
3. **Hidden Systemic Risk:** Deployment velocity accelerating without quantified risk scoring (probability × impact evaluation).
4. **Audit Trail Tampering:** Incident post-mortems compromised by volatile, fragmented, or modifiable log files.

DeployGuard solves these systemic governance challenges by acting as a hardened gatekeeper for all software releases.

---

## Key Features

- **Four-Eyes Principle Governance:** Production releases strictly prohibit self-approval. A release created by a developer must be reviewed and digitally signed off by an authorized Reviewer or Administrator before execution eligibility is unlocked.
- **Automated Rollback Orchestration:** Instant single-click rollback for production releases with mandatory recorded business and technical justifications.
- **Dynamic Risk Matrix & Scoring Engine:** Automatically calculates Risk Score ($Score = Probability \times Impact$) on a scale of 1 to 25. High ($Score \ge 10$) and Critical ($Score \ge 16$) risks are prominently escalated on the executive dashboard.
- **Agile Task Execution & Dependency Cycle Detection:** Enforces topological safety by preventing self-dependencies and detecting circular blocker relationships.
- **Immutable Append-Only Compliance Audit Trail:** Records all logins, entity creations, status transitions, reviewer sign-offs, and rollbacks with principal user, timestamp, client IP, and contextual metadata.
- **Role-Based Access Control (RBAC):** Granular permission isolation across `ADMIN`, `PROJECT_MANAGER`, `DEVELOPER`, and `REVIEWER`.
- **Live Executive Dashboard:** Real-time metrics, interactive charts (Recharts), and health probes. Zero mock or hardcoded statistics.

---

## Tech Stack

### Backend
- **Java 17 / 21 LTS**
- **Spring Boot 3.3.4**
- **Spring Security 6.x** (Stateless Bearer JWT Authentication)
- **Spring Data JPA & Hibernate 6**
- **PostgreSQL 16** (with H2 in PostgreSQL compatibility mode for isolated tests)
- **Jakarta Bean Validation** (`@NotBlank`, `@Size`, `@Pattern`, `@Min`, `@Max`)
- **JJWT 0.12.6** (HMAC-SHA256 token generation & validation)
- **Spring Boot Actuator** (Observability & Health Monitoring)
- **SpringDoc OpenAPI 2.6.0 / Swagger UI**
- **Apache Maven 3.9.6**

### Frontend
- **React 19 & TypeScript**
- **Tailwind CSS v4** (Enterprise navy/slate high-contrast design system)
- **Vite 8**
- **React Router 7**
- **Axios** (Configured with request/response interceptors)
- **Recharts 3** (Interactive pipeline and risk visualizations)
- **Lucide React** (Consistent iconography)

### DevOps & Containerization
- **Docker & Docker Compose** (Multi-stage non-root container builds)
- **Nginx Alpine** (Production client reverse proxy)
- **GitHub Actions** (Automated CI/CD pipeline running linting, tests, JAR compilation, and container builds)

---

## Database Design & Entity Relationships

```mermaid
erDiagram
    USERS ||--o{ USER_ROLES : has
    ROLES ||--o{ USER_ROLES : contains
    USERS ||--o{ PROJECTS : creates
    PROJECTS ||--o{ PROJECT_MEMBERS : includes
    USERS ||--o{ PROJECT_MEMBERS : member_of
    PROJECTS ||--o{ TASKS : contains
    USERS ||--o{ TASKS : assigned_to
    PROJECTS ||--o{ DEPLOYMENTS : targets
    USERS ||--o{ DEPLOYMENTS : requested_by
    DEPLOYMENTS ||--o{ DEPLOYMENT_APPROVALS : requires
    USERS ||--o{ DEPLOYMENT_APPROVALS : reviewed_by
    PROJECTS ||--o{ RISKS : identifies
    USERS ||--o{ RISKS : owns
    RISKS ||--o{ RISK_MITIGATIONS : remediated_by
    AUDIT_LOGS {
        uuid id PK
        string username
        string action
        string entity_type
        string entity_id
        string ip_address
        text description
        timestamp timestamp
    }
```

### Table Definitions & Constraints
- `users`: UUID primary key, unique constraints on `username` and `email`, BCrypt hashed passwords.
- `roles`: Seeded with `ROLE_ADMIN`, `ROLE_PROJECT_MANAGER`, `ROLE_DEVELOPER`, `ROLE_REVIEWER`.
- `projects`: Unique alphanumeric project key (`CSG-01`, `RTF-02`), foreign key to creator.
- `tasks`: Foreign key to project, assignee, and reporter. Self-referencing many-to-many table `task_dependencies` for blocker tracking.
- `deployments`: Foreign key to project and requester. Tracks `environment` (`DEVELOPMENT`, `TEST`, `STAGING`, `PRODUCTION`), `status`, `pipeline_run_id`, `executed_at`, `rolled_back_at`.
- `deployment_approvals`: Links deployment to reviewer with review decision (`APPROVED`, `REJECTED`), comments, and timestamp.
- `risks`: Evaluates `probability` (1-5) and `impact` (1-5), storing calculated `risk_score` (1-25) and `severity`.
- `risk_mitigations`: Granular control actions tracked to completion with owner and timestamp.
- `audit_logs`: Append-only, indexed on `timestamp`, `action`, `username`, and `entity_type`.

---

## Authentication & Authorization Matrix

| Endpoint | Method | Permitted Roles | Business & Security Controls |
| :--- | :---: | :--- | :--- |
| `/api/auth/register` | `POST` | Public | Validates email format, unique username, BCrypt password hashing. |
| `/api/auth/login` | `POST` | Public | Verifies credentials, issues signed HMAC-SHA256 JWT, logs `LOGIN`. |
| `/api/auth/me` | `GET` | Authenticated | Returns current profile, granted roles, and department. |
| `/api/projects` | `GET` | Authenticated | Paginated query with status/archived filters. |
| `/api/projects` | `POST` | `ADMIN`, `PROJECT_MANAGER` | Enforces uppercase unique key, assigns members, logs `PROJECT_CREATED`. |
| `/api/tasks` | `POST` | `ADMIN`, `PM`, `DEVELOPER` | Validates project matching, checks for circular dependencies. |
| `/api/deployments` | `POST` | `ADMIN`, `PM`, `DEVELOPER` | Production/staging environments automatically enter `UNDER_REVIEW`. |
| `/api/deployments/{id}/approve` | `POST` | `ADMIN`, `REVIEWER` | **Four-Eyes Gate:** Rejects if reviewer == requester. Unlocks execution. |
| `/api/deployments/{id}/reject` | `POST` | `ADMIN`, `REVIEWER` | Requires governance review reason, marks deployment `REJECTED`. |
| `/api/deployments/{id}/execute` | `POST` | `ADMIN`, `PM`, `DEVELOPER` | Rejects unless deployment status is `APPROVED`. |
| `/api/deployments/{id}/rollback`| `POST` | `ADMIN`, `PM`, `DEV`, `REV` | Only applicable to `SUCCESSFUL` releases; mandatory rollback reason. |
| `/api/risks` | `POST` | `ADMIN`, `PROJECT_MANAGER` | Auto-calculates risk score and severity thresholds. |
| `/api/risks/{id}/mitigations` | `POST` | `ADMIN`, `PM`, `DEVELOPER` | Records remediation actions; auto-moves risk to `MITIGATING`. |
| `/api/audit-logs` | `GET` | `ADMIN`, `REVIEWER`, `PM` | Filterable immutable audit inspection for SOC2/ISO compliance. |
| `/api/dashboard/summary` | `GET` | Authenticated | Live aggregated KPIs, charts, and activity streams. |

---

## Security Implementation

1. **Password Hashing:** Passwords hashed with BCrypt (strength 10) with salt generation. Plaintext passwords never stored or logged.
2. **Stateless JWT Tokens:** JJWT 0.12 API using HMAC-SHA256 keys, validated per request by `AuthTokenFilter`.
3. **No Sensitive Information Leaks:** Stack traces are caught by `GlobalExceptionHandler`. Consistent JSON error responses return safe HTTP statuses (`400`, `401`, `403`, `404`, `409`, `500`).
4. **Segregation of Duties (Four-Eyes Principle):** Enforced in service layer (`DeploymentServiceImpl` checks `deployment.getRequestedBy().getId().equals(reviewer.getId())`).
5. **SQL Injection Defense:** Strict use of Spring Data JPA repositories with parameterized queries and criteria specifications.
6. **CORS Hardening:** Explicitly declared origins (`localhost:5173`, `localhost:3000`, `localhost:80`). Wildcard `*` disabled.

---

## Pre-Seeded Enterprise Demo Credentials

DeployGuard automatically seeds realistic institutional demo data on startup:

| Username | Password | Role | Department | Description |
| :--- | :--- | :--- | :--- | :--- |
| `admin` | `Admin@123456` | `ROLE_ADMIN` | Enterprise IT Architecture | Complete platform authority |
| `rev_marcus` | `Password@123` | `ROLE_REVIEWER` | Release Governance & Risk Controls | Approves/rejects production deployments |
| `pm_sarah` | `Password@123` | `ROLE_PROJECT_MANAGER` | Payment Platforms Delivery | Leads projects, registers risks and tasks |
| `dev_alex` | `Password@123` | `ROLE_DEVELOPER` | Core Banking Engineering | Submits deployments, executes tasks |

*Tip: The login UI features 1-click quick prefill buttons for each profile.*

---

## Local Development Setup

### Prerequisites
- Java 17 or Java 21 LTS
- Node.js 18+ and npm
- Docker (optional for containerized runtime)

### 1. Running the Spring Boot Backend

Using the included Maven wrapper / Apache Maven:
```powershell
cd backend
mvn clean spring-boot:run
```
The backend initializes the embedded H2/PostgreSQL database, executes the `DataInitializer`, and listens on `http://localhost:8080`.

- Health Endpoint: `http://localhost:8080/actuator/health`
- Swagger OpenAPI Documentation: `http://localhost:8080/swagger-ui.html`

### 2. Running the React Frontend

```powershell
cd frontend
npm install
npm run dev
```
The frontend starts on `http://localhost:5173` with Vite's proxy automatically forwarding `/api` and `/actuator` requests to port `8080`.

---

## Running with Docker Compose

To run the complete production stack (PostgreSQL 16, Spring Boot backend, and Nginx frontend):

```bash
# 1. Create environment configuration
cp .env.example .env

# 2. Build and launch all services
docker compose up --build
```

Access Points:
- Web Application Console: `http://localhost`
- Backend API Direct: `http://localhost:8080`
- Swagger UI Documentation: `http://localhost:8080/swagger-ui.html`
- PostgreSQL Database: `localhost:5432` (user: `postgres`, password: `postgres`)

---

## Automated Testing Suite

DeployGuard includes a test harness verifying business rules:
- **Unit Tests:** Risk score matrix calculation, circular dependency prevention, and segregation of duties.
- **Integration Tests:** MockMvc testing authentication, JWT generation, invalid credentials rejection, and input validation.

To run the automated tests:
```powershell
cd backend
mvn test
```

### Test Results
```
[INFO] Running com.deployguard.controller.AuthControllerIntegrationTest
[INFO] Tests run: 5, Failures: 0, Errors: 0, Skipped: 0
[INFO] Running com.deployguard.service.DeploymentServiceTest
[INFO] Tests run: 3, Failures: 0, Errors: 0, Skipped: 0
[INFO] Running com.deployguard.service.RiskServiceTest
[INFO] Tests run: 2, Failures: 0, Errors: 0, Skipped: 0
[INFO] Running com.deployguard.service.TaskServiceTest
[INFO] Tests run: 2, Failures: 0, Errors: 0, Skipped: 0
[INFO] -------------------------------------------------------
[INFO] Results: Tests run: 12, Failures: 0, Errors: 0, Skipped: 0
[INFO] BUILD SUCCESS
```

---

## Engineering Decisions & Architecture Rationale

1. **Why Modular Monolith over Microservices?**  
   In regulated release governance, atomic transactions across deployments, approvals, and audit logs are paramount. Distributed transactions (2PC or Saga) add operational complexity without delivering added resilience for internal governance platforms. A modular monolith provides strict domain boundary separation while ensuring immediate consistency.

2. **Why Separate Transaction for Audit Logs (`Propagation.REQUIRES_NEW`)?**  
   Audit logging must record failure attempts and authentication anomalies even if the surrounding business transaction fails or rolls back. Using `REQUIRES_NEW` guarantees the audit entry commits independently of business transaction boundaries.

3. **Why Prevent Self-Approval in Code instead of UI Only?**  
   UI validation is trivial to bypass via direct REST calls (e.g., Postman or cURL). The four-eyes constraint is strictly enforced in the service layer (`DeploymentServiceImpl`), ensuring that API clients and automated CI agents cannot approve their own release packages.

4. **Why DTOs and No Direct JPA Entity Exposure?**  
   Exposing JPA entities directly invites JSON serialization recursion (infinite loops in bidirectional relationships), leaks sensitive database columns (such as password hashes), and tightly couples the REST contract to the database schema.

---

## Project Structure

```
DeployGuard/
├── .github/
│   └── workflows/
│       └── ci.yml                     # Automated GitHub Actions Pipeline
├── backend/
│   ├── Dockerfile                     # Multi-stage Java Dockerfile
│   ├── pom.xml                        # Maven dependencies & build plugins
│   └── src/
│       ├── main/
│       │   ├── java/com/deployguard/
│       │   │   ├── audit/             # Immutable audit logging engine
│       │   │   ├── config/            # Security, OpenAPI & Data Initializer
│       │   │   ├── controller/        # REST Controllers
│       │   │   ├── dto/               # Request & Response DTOs
│       │   │   ├── entity/            # JPA Entities & Enums
│       │   │   ├── exception/         # Centralized GlobalExceptionHandler
│       │   │   ├── mapper/            # Type-safe Entity-to-DTO Mappers
│       │   │   ├── repository/        # Spring Data JPA Repositories
│       │   │   ├── security/          # JWT Utils, Filter & UserDetails
│       │   │   └── service/           # Domain Services & Implementations
│       │   └── resources/
│       │       └── application.yml    # PostgreSQL & JWT Configuration
│       └── test/
│           ├── java/com/deployguard/  # Controller & Service Test Suites
│           └── resources/
│               └── application-test.yml # In-memory H2 Test Profile
├── frontend/
│   ├── Dockerfile                     # Multi-stage React/Nginx Dockerfile
│   ├── nginx.conf                     # Nginx routing & API proxy configuration
│   ├── package.json                   # React, Tailwind, Recharts dependencies
│   ├── vite.config.ts                 # Vite bundler & backend proxy config
│   └── src/
│       ├── components/                # Badges, Modals, Navbar, Sidebar
│       ├── context/                   # AuthContext & RBAC state
│       ├── pages/                     # Dashboard, Projects, Tasks, Deployments, Risks, Audits
│       ├── services/                  # Axios API client modules
│       └── types/                     # TypeScript domain interfaces
├── docker-compose.yml                 # Orchestration (Postgres + Backend + Frontend)
├── .env.example                       # Environment configuration template
└── README.md                          # Platform documentation
```
