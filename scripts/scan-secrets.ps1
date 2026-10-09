# DeployGuard Local Secret Scanner
# Scans tracked and staged files for accidental credential leakage without transmitting data externally.

Write-Host "=== DeployGuard Secret Scanner ===" -ForegroundColor Cyan

$patterns = @{
    "AWS Access Key ID"       = 'AKIA[0-9A-Z]{16}'
    "GitHub Personal Token"   = 'ghp_[0-9a-zA-Z]{36}|github_pat_[0-9a-zA-Z_]{82}'
    "Private Key Block"       = '-----BEGIN (RSA|EC|DSA|OPENSSH|PGP) PRIVATE KEY-----'
    "Raw Production Bearer"   = 'Bearer\s+eyJ[A-Za-z0-9_-]+\.eyJ[A-Za-z0-9_-]+'
    "Slack Webhook URL"       = 'https://hooks\.slack\.com/services/T[0-9A-Z]+/B[0-9A-Z]+/[0-9a-zA-Z]+'
}

$filesToScan = git ls-files
$findingsCount = 0

foreach ($file in $filesToScan) {
    if (-not (Test-Path $file)) { continue }
    # Skip binary files or lock files
    if ($file -match '\.(png|jpg|ico|jar|lock|pdf)$') { continue }

    $lines = Get-Content $file -ErrorAction SilentlyContinue
    $lineNum = 1
    foreach ($line in $lines) {
        foreach ($key in $patterns.Keys) {
            $regex = $patterns[$key]
            if ($line -match $regex) {
                Write-Host "[ALERT] Potential $key detected!" -ForegroundColor Red
                Write-Host "  File: $file"
                Write-Host "  Line: $lineNum"
                Write-Host "  Severity: CRITICAL"
                Write-Host "  Match: [REDACTED]"
                $findingsCount++
            }
        }
        $lineNum++
    }
}

if ($findingsCount -eq 0) {
    Write-Host "[PASSED] Zero leaked credentials detected across all tracked files." -ForegroundColor Green
    exit 0
} else {
    Write-Host "[FAILED] Found $findingsCount potential secret exposure(s). Commit blocked." -ForegroundColor Red
    exit 1
}
