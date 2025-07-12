# Build and deployment script
param(
    [string]$Environment = "production"
)

Write-Host "Starting deployment process for $Environment environment..."

# Check if Docker is running
if (-not (Get-Process -Name "Docker*" -ErrorAction SilentlyContinue)) {
    Write-Error "Docker is not running. Please start Docker and try again."
    exit 1
}

# Build frontend
Write-Host "Building frontend..."
Set-Location -Path "frontend"
npm ci
npm run build
if ($LASTEXITCODE -ne 0) {
    Write-Error "Frontend build failed"
    exit 1
}
Set-Location -Path ".."

# Build backend
Write-Host "Building backend..."
Set-Location -Path "backend"
npm ci
if ($LASTEXITCODE -ne 0) {
    Write-Error "Backend dependencies installation failed"
    exit 1
}
Set-Location -Path ".."

# Build Docker images
Write-Host "Building Docker images..."
docker-compose build
if ($LASTEXITCODE -ne 0) {
    Write-Error "Docker build failed"
    exit 1
}

# Deploy containers
Write-Host "Deploying containers..."
docker-compose -f docker-compose.yml -f docker-compose.$Environment.yml up -d
if ($LASTEXITCODE -ne 0) {
    Write-Error "Docker deployment failed"
    exit 1
}

Write-Host "Deployment completed successfully!"
Write-Host "Application is now running at http://localhost"
Write-Host "API documentation is available at http://localhost/api-docs"
Write-Host "Health status is available at http://localhost/actuator/health"
