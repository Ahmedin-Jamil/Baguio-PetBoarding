# This script will help set up your React app in a new repository
# You'll need to run this from a PowerShell prompt

# Step 1: Create a temporary directory for the new repository
$tempDir = "C:\Users\john-PC\Desktop\Important tokeep\New folder\BaguioPetBoarding\NewRepo"
New-Item -Path $tempDir -ItemType Directory -Force

# Step 2: Copy only the frontend directory to the new location
Copy-Item -Path "C:\Users\john-PC\Desktop\Important tokeep\New folder\BaguioPetBoarding\BaguioPetBoarding\frontend\*" -Destination $tempDir -Recurse -Force

# Step 3: Navigate to the new directory
cd $tempDir

# Step 4: Initialize a new git repository
git init

# Step 5: Create a .gitignore file
@"
# See https://help.github.com/articles/ignoring-files/ for more about ignoring files.

# dependencies
/node_modules
/.pnp
.pnp.js

# testing
/coverage

# production
/build

# misc
.DS_Store
.env.local
.env.development.local
.env.test.local
.env.production.local

npm-debug.log*
yarn-debug.log*
yarn-error.log*
"@ | Out-File -FilePath ".gitignore" -Encoding utf8

# Step 6: Ensure package.json has the correct homepage setting
(Get-Content -Path "package.json") -replace '"homepage": ".*"', '"homepage": "/"' | Set-Content -Path "package.json"

# Step 7: Create a CNAME file in the public folder
"baguio-pet-boarding.com" | Out-File -FilePath "public\CNAME" -Encoding utf8 -NoNewline

# Step 8: Add files to git
git add .

# Step 9: Commit files
git commit -m "Initial commit for new repository"

Write-Host "`nSetup complete!`n"
Write-Host "Next steps:"
Write-Host "1. Go to the new repository directory: cd $tempDir"
Write-Host "2. Add your GitHub repository as remote: git remote add origin https://github.com/YOUR-USERNAME/YOUR-REPO-NAME.git"
Write-Host "3. Push to GitHub: git push -u origin main"
Write-Host "4. Install gh-pages: npm install --save-dev gh-pages"
Write-Host "5. Deploy: npm run deploy"
