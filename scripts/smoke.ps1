$uri = "http://localhost:3000/health/ready"

try {
  $res = Invoke-RestMethod -Uri $uri -Method Get -TimeoutSec 5
  if ($res.status -eq "ok") {
    Write-Host "Smoke check passed." -ForegroundColor Green
    exit 0
  }
  Write-Error "Unexpected response payload"
  exit 1
} catch {
  Write-Error "Smoke check failed: $($_.Exception.Message)"
  exit 1
}
