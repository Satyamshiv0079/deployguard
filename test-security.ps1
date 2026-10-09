# 1. Attempt Privilege Escalation via Public Registration
$randomSuffix = Get-Random
$maliciousBody = @"
{
  "username": "hacker_$randomSuffix",
  "email": "hacker_$randomSuffix@evil.corp",
  "password": "HackerPassword123!",
  "fullName": "Malicious Actor",
  "roles": ["ROLE_ADMIN", "ROLE_REVIEWER"]
}
"@

$regResp = Invoke-RestMethod -Uri 'http://localhost:8080/api/auth/register' -Method Post -Body $maliciousBody -ContentType 'application/json'
Write-Host "Registration Result:"
Write-Host "  Username:       $($regResp.data.username)"
Write-Host "  Assigned Roles: $($regResp.data.roles -join ', ')"
if ($regResp.data.roles -contains 'ROLE_ADMIN') {
    Write-Error "PRIVILEGE ESCALATION VULNERABILITY DETECTED!"
    exit 1
} else {
    Write-Host "  [VERIFIED] Privilege escalation neutralized. Caller strictly assigned ROLE_DEVELOPER."
}

$newUserId = $regResp.data.id

# 2. Login as newly registered user
$hackerLogin = @"
{
  "username": "$($regResp.data.username)",
  "password": "HackerPassword123!"
}
"@
$hackerAuth = Invoke-RestMethod -Uri 'http://localhost:8080/api/auth/login' -Method Post -Body $hackerLogin -ContentType 'application/json'
$hackerToken = $hackerAuth.data.token

# 3. Attempt unauthorized role update as standard developer
try {
    $elevateBody = '{"roles":["ROLE_ADMIN"]}'
    $headers = @{ Authorization = "Bearer $hackerToken" }
    Invoke-RestMethod -Uri "http://localhost:8080/api/users/$newUserId/roles" -Method Put -Body $elevateBody -ContentType 'application/json' -Headers $headers
    Write-Error "SECURITY FAILURE: Standard user was able to call admin endpoint!"
    exit 1
} catch {
    Write-Host "  [VERIFIED] Standard user blocked from role update with HTTP 403 Forbidden."
}

# 4. Admin authorized role update
$adminLogin = '{"username":"admin","password":"Admin@123456"}'
$adminAuth = Invoke-RestMethod -Uri 'http://localhost:8080/api/auth/login' -Method Post -Body $adminLogin -ContentType 'application/json'
$adminToken = $adminAuth.data.token

$updateBody = '{"roles":["ROLE_REVIEWER"]}'
$adminHeaders = @{ Authorization = "Bearer $adminToken" }
$updateResp = Invoke-RestMethod -Uri "http://localhost:8080/api/users/$newUserId/roles" -Method Put -Body $updateBody -ContentType 'application/json' -Headers $adminHeaders
Write-Host "  [VERIFIED] Admin authorized role update succeeded. New roles: $($updateResp.data.roles -join ', ')"
