export type RoleType = 'ROLE_ADMIN' | 'ROLE_PROJECT_MANAGER' | 'ROLE_DEVELOPER' | 'ROLE_REVIEWER';

export type ProjectStatus = 'PLANNED' | 'IN_PROGRESS' | 'AT_RISK' | 'BLOCKED' | 'COMPLETED' | 'CANCELLED';

export type Priority = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export type TaskStatus = 'TODO' | 'IN_PROGRESS' | 'BLOCKED' | 'IN_REVIEW' | 'DONE';

export type DeploymentEnvironment = 'DEVELOPMENT' | 'TEST' | 'STAGING' | 'PRODUCTION';

export type DeploymentStatus = 'REQUESTED' | 'UNDER_REVIEW' | 'APPROVED' | 'REJECTED' | 'IN_PROGRESS' | 'SUCCESSFUL' | 'FAILED' | 'ROLLED_BACK';

export type ApprovalStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

export type RiskSeverity = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export type RiskStatus = 'OPEN' | 'MITIGATING' | 'ACCEPTED' | 'RESOLVED' | 'CLOSED';

export type AuditAction = 
  | 'LOGIN' 
  | 'LOGOUT' 
  | 'USER_CREATED' 
  | 'PROJECT_CREATED' 
  | 'PROJECT_UPDATED' 
  | 'PROJECT_ARCHIVED' 
  | 'TASK_CREATED' 
  | 'TASK_UPDATED' 
  | 'TASK_DELETED' 
  | 'DEPLOYMENT_REQUESTED' 
  | 'DEPLOYMENT_APPROVED' 
  | 'DEPLOYMENT_REJECTED' 
  | 'DEPLOYMENT_EXECUTED' 
  | 'DEPLOYMENT_ROLLED_BACK' 
  | 'RISK_CREATED' 
  | 'RISK_UPDATED' 
  | 'RISK_MITIGATION_ADDED';

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
  timestamp: string;
}

export interface PagedResponse<T> {
  content: T[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
  last: boolean;
}

export interface UserProfile {
  id: string;
  username: string;
  email: string;
  fullName: string;
  department: string | null;
  active: boolean;
  roles: RoleType[];
  createdAt: string;
}

export interface AuthResponse {
  token: string;
  type: string;
  id: string;
  username: string;
  email: string;
  fullName: string;
  department: string | null;
  roles: RoleType[];
  expiresInMs: number;
}

export interface Project {
  id: string;
  name: string;
  key: string;
  description: string;
  status: ProjectStatus;
  priority: Priority;
  startDate: string | null;
  targetEndDate: string | null;
  actualEndDate: string | null;
  archived: boolean;
  createdById: string;
  createdByUsername: string;
  createdByFullName: string;
  members: UserProfile[];
  totalTasks: number;
  openRisks: number;
  pendingDeployments: number;
  createdAt: string;
  updatedAt: string;
}

export interface TaskSummary {
  id: string;
  title: string;
  status: TaskStatus;
  priority: Priority;
}

export interface TaskItem {
  id: string;
  title: string;
  description: string | null;
  status: TaskStatus;
  priority: Priority;
  dueDate: string | null;
  overdue: boolean;
  blockedReason: string | null;
  projectId: string;
  projectName: string;
  projectKey: string;
  assigneeId: string | null;
  assigneeUsername: string | null;
  assigneeFullName: string | null;
  reporterId: string;
  reporterUsername: string;
  reporterFullName: string;
  dependencies: TaskSummary[];
  createdAt: string;
  updatedAt: string;
}

export interface DeploymentApproval {
  id: string;
  reviewerId: string;
  reviewerUsername: string;
  reviewerFullName: string;
  status: ApprovalStatus;
  comments: string | null;
  reviewedAt: string | null;
  createdAt: string;
}

export interface DeploymentItem {
  id: string;
  projectId: string;
  projectName: string;
  projectKey: string;
  version: string;
  environment: DeploymentEnvironment;
  requestedById: string;
  requestedByUsername: string;
  requestedByFullName: string;
  reason: string;
  changeDescription: string | null;
  riskLevel: Priority;
  status: DeploymentStatus;
  pipelineRunId: string | null;
  requiresApproval: boolean;
  eligibleForExecution: boolean;
  executedAt: string | null;
  rolledBackAt: string | null;
  rollbackReason: string | null;
  approvals: DeploymentApproval[];
  createdAt: string;
  updatedAt: string;
}

export interface RiskMitigation {
  id: string;
  actionTitle: string;
  actionDescription: string | null;
  ownerId: string | null;
  ownerUsername: string | null;
  ownerFullName: string | null;
  completed: boolean;
  completedAt: string | null;
  createdAt: string;
}

export interface RiskItem {
  id: string;
  title: string;
  description: string | null;
  projectId: string;
  projectName: string;
  projectKey: string;
  ownerId: string | null;
  ownerUsername: string | null;
  ownerFullName: string | null;
  severity: RiskSeverity;
  probability: number;
  impact: number;
  riskScore: number;
  mitigationPlan: string | null;
  status: RiskStatus;
  dueDate: string | null;
  mitigations: RiskMitigation[];
  createdAt: string;
  updatedAt: string;
}

export interface AuditLogItem {
  id: string;
  username: string;
  action: AuditAction;
  entityType: string;
  entityId: string;
  ipAddress: string;
  description: string;
  timestamp: string;
}

export interface ChartDataPoint {
  name: string;
  value: number;
  color?: string;
}

export interface DashboardSummary {
  totalProjects: number;
  activeProjects: number;
  completedProjects: number;
  blockedProjects: number;
  totalRisks: number;
  openRisks: number;
  criticalRisks: number;
  totalDeployments: number;
  pendingDeployments: number;
  successfulDeployments: number;
  failedDeployments: number;
  rollbacks: number;
  totalTasks: number;
  overdueTasks: number;
  blockedTasks: number;
  deploymentsByStatus: ChartDataPoint[];
  projectsByStatus: ChartDataPoint[];
  risksBySeverity: ChartDataPoint[];
  tasksByStatus: ChartDataPoint[];
  recentDeployments: DeploymentItem[];
  criticalRiskList: RiskItem[];
  recentAuditLogs: AuditLogItem[];
}
