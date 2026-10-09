$loginPayload = '{"username":"admin","password":"Admin@123456"}'
$loginResp = Invoke-RestMethod -Uri "http://localhost:8080/api/auth/login" -Method Post -Body $loginPayload -ContentType "application/json"

$auth = $loginResp.data

Write-Host "=== 1. AUTHENTICATION SUCCESS ==="
Write-Host "Status:        $($loginResp.message)"
Write-Host "Logged in as:  $($auth.username) ($($auth.fullName))"
Write-Host "Department:    $($auth.department)"
Write-Host "Roles:         $($auth.roles -join ', ')"
Write-Host "JWT Token:     $($auth.token.Substring(0, 32))..."

$headers = @{
    Authorization = "Bearer $($auth.token)"
}

Write-Host "`n=== 2. DASHBOARD GOVERNANCE METRICS ==="
$summaryResp = Invoke-RestMethod -Uri "http://localhost:8080/api/dashboard/summary" -Method Get -Headers $headers
$summary = $summaryResp.data
Write-Host "Total Projects:        $($summary.totalProjects)"
Write-Host "Active Projects:       $($summary.activeProjects)"
Write-Host "Pending Deployments:   $($summary.pendingDeployments)"
Write-Host "Successful Deploys:    $($summary.successfulDeployments)"
Write-Host "Failed Deployments:    $($summary.failedDeployments)"
Write-Host "Rollbacks:             $($summary.rolledBackDeployments)"
Write-Host "Critical Risks:        $($summary.criticalRisks)"
Write-Host "Open Risks:            $($summary.openRisks)"
Write-Host "Overdue Tasks:         $($summary.overdueTasks)"

Write-Host "`n=== 3. DEPLOYMENTS IN PIPELINE ==="
$deploymentsResp = Invoke-RestMethod -Uri "http://localhost:8080/api/deployments" -Method Get -Headers $headers
$deployments = $deploymentsResp.data
foreach ($dep in $deployments.content) {
    Write-Host "- [$($dep.status.PadRight(12))] $($dep.projectName.PadRight(28)) v$($dep.version.PadRight(8)) -> $($dep.environment.PadRight(12)) (Risk: $($dep.riskLevel.PadRight(8))) Requested by: $($dep.requestedByUsername)"
}

Write-Host "`n=== 4. RISK & CONTROLS REGISTRY ==="
$risksResp = Invoke-RestMethod -Uri "http://localhost:8080/api/risks" -Method Get -Headers $headers
$risks = $risksResp.data
foreach ($r in $risks.content) {
    Write-Host "- [$($r.severity.PadRight(8))] Score=$($r.riskScore.ToString().PadLeft(2)) ($($r.status.PadRight(10))) - $($r.title) [Project: $($r.projectName)]"
}

Write-Host "`n=== 5. IMMUTABLE AUDIT TRAIL ==="
$auditResp = Invoke-RestMethod -Uri "http://localhost:8080/api/audit-logs" -Method Get -Headers $headers
$auditLogs = $auditResp.data
foreach ($log in $auditLogs.content) {
    Write-Host "- [$($log.timestamp)] User=$($log.username.PadRight(12)) Action=$($log.action.PadRight(22)) Entity=$($log.entityType):$($log.entityId)"
}

Write-Host "`n=== 6. FRONTEND WEB APPLICATION ==="
$fe = Invoke-WebRequest -Uri "http://localhost:5173" -UseBasicParsing
Write-Host "Frontend Status: $($fe.StatusCode) OK - Vite React 19 SPA running on http://localhost:5173"
