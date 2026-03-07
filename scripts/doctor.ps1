param(
  [switch]$VerboseOutput
)

$checks = @(
  @{ Name = "node"; Command = "node --version" },
  @{ Name = "npm"; Command = "npm --version" },
  @{ Name = "docker"; Command = "docker --version" }
)

$failed = $false

foreach ($check in $checks) {
  try {
    $output = Invoke-Expression $check.Command
    Write-Host "[OK] $($check.Name): $output"
  } catch {
    Write-Host "[FAIL] $($check.Name) is not available" -ForegroundColor Red
    $failed = $true
  }
}

if ($failed) {
  Write-Error "Doctor checks failed"
  exit 1
}

Write-Host "Environment looks ready." -ForegroundColor Green
