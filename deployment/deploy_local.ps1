# GeoSurePath Local Deployment Script for Windows
# This script prepares the local environment for development and deployment.

Write-Host "--- GeoSurePath Platinum Local Deployer ---" -ForegroundColor Cyan

# 1. Check Prerequisites
$Prereqs = @("node", "npm", "git")
foreach ($tool in $Prereqs) {
    if (!(Get-Command $tool -ErrorAction SilentlyContinue)) {
        Write-Error "Missing prerequisite: $tool"
        exit 1
    }
}

# 2. Configure Environment for Local Run
if (Test-Path ".env") {
    $envContent = Get-Content ".env"
    $envContent = $envContent -replace "db:5432", "localhost:5432"
    $envContent = $envContent -replace "redis:6379", "localhost:6379"
    Set-Content ".env.local" $envContent
    Write-Host "Created .env.local for local execution." -ForegroundColor Green
} else {
    Write-Warning "No .env file found. Please create one based on .env.example."
}

# 3. Build Services
Write-Host "Step 1: Installing Backend Dependencies..."
Set-Location "geosurepath-admin-api"
npm install
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

Write-Host "Step 2: Installing Frontend Dependencies..."
Set-Location "../GeoSurePath"
npm install
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

Write-Host "--- Setup Complete ---" -ForegroundColor Cyan
Write-Host "To run the platform locally:" -ForegroundColor Yellow
Write-Host "1. Ensure Docker Desktop is running."
Write-Host "2. Run 'docker-compose up -d --build' in the root directory."
Write-Host "   OR manually start each service and use .env.local."
