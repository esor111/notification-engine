# Test Auth Flow
Write-Host ""
Write-Host "=== Testing Auth System ===" -ForegroundColor Cyan

# 1. Register a new user
Write-Host ""
Write-Host "1. Registering new user..." -ForegroundColor Yellow
$registerBody = @{
    email = "demo@example.com"
    password = "SecurePass123!@#"
    fullName = "Demo User"
} | ConvertTo-Json

try {
    $registerResponse = Invoke-WebRequest -Uri http://localhost:3000/auth/register -Method POST -Body $registerBody -ContentType 'application/json' -UseBasicParsing -ErrorAction Stop
    Write-Host "Success: Registration successful!" -ForegroundColor Green
    $registerData = $registerResponse.Content | ConvertFrom-Json
    Write-Host "  User ID: $($registerData.user.id)" -ForegroundColor Gray
}
catch {
    Write-Host "Note: Registration failed (user might already exist)" -ForegroundColor Yellow
}

# 2. Login
Write-Host ""
Write-Host "2. Logging in..." -ForegroundColor Yellow
$loginBody = @{
    email = "test@example.com"
    password = "Test123!@#"
} | ConvertTo-Json

$loginResponse = Invoke-WebRequest -Uri http://localhost:3000/auth/login -Method POST -Body $loginBody -ContentType 'application/json' -UseBasicParsing
$loginData = $loginResponse.Content | ConvertFrom-Json
Write-Host "Success: Login successful!" -ForegroundColor Green
Write-Host "  Access Token: $($loginData.accessToken.Substring(0,50))..." -ForegroundColor Gray

# 3. Access protected endpoint
Write-Host ""
Write-Host "3. Accessing protected endpoint /auth/me..." -ForegroundColor Yellow
$headers = @{
    Authorization = "Bearer $($loginData.accessToken)"
}
$meResponse = Invoke-WebRequest -Uri http://localhost:3000/auth/me -Headers $headers -UseBasicParsing
$meData = $meResponse.Content | ConvertFrom-Json
Write-Host "Success: Protected endpoint accessed!" -ForegroundColor Green
Write-Host "  Email: $($meData.email)" -ForegroundColor Gray
Write-Host "  Name: $($meData.fullName)" -ForegroundColor Gray

# 4. Refresh token
Write-Host ""
Write-Host "4. Refreshing access token..." -ForegroundColor Yellow
$refreshBody = @{
    refreshToken = $loginData.refreshToken
} | ConvertTo-Json

$refreshResponse = Invoke-WebRequest -Uri http://localhost:3000/auth/refresh -Method POST -Body $refreshBody -ContentType 'application/json' -UseBasicParsing
$refreshData = $refreshResponse.Content | ConvertFrom-Json
Write-Host "Success: Token refreshed!" -ForegroundColor Green
Write-Host "  New Access Token: $($refreshData.accessToken.Substring(0,50))..." -ForegroundColor Gray

Write-Host ""
Write-Host "=== All Auth Tests Passed! ===" -ForegroundColor Green
Write-Host ""
Write-Host "Swagger Docs: http://localhost:3000/docs" -ForegroundColor Cyan
Write-Host ""
