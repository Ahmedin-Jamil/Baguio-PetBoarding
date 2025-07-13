# Fresh Deployment Guide for Baguio Pet Boarding React App

## Step 1: Create a New GitHub Repository
1. Go to [GitHub](https://github.com)
2. Click the "+" icon in the top-right corner and select "New repository"
3. Name: `baguio-pet-boarding-site` (or any name you prefer)
4. Description: "Baguio Pet Boarding website"
5. Set it to Public
6. DO NOT initialize with README, .gitignore, or license
7. Click "Create repository"

## Step 2: Set up Your Local Repository
1. Open PowerShell as Administrator
2. Run the setup script we created:
   ```
   cd "C:\Users\john-PC\Desktop\Important tokeep\New folder\BaguioPetBoarding\BaguioPetBoarding"
   .\setup-new-repo.ps1
   ```
3. Navigate to the new repository folder:
   ```
   cd "C:\Users\john-PC\Desktop\Important tokeep\New folder\BaguioPetBoarding\NewRepo"
   ```

## Step 3: Connect to GitHub and Push Your Code
1. Add your GitHub repository as the remote origin (replace YOUR-USERNAME with your GitHub username and YOUR-REPO-NAME with the repository name you created):
   ```
   git remote add origin https://github.com/YOUR-USERNAME/YOUR-REPO-NAME.git
   ```
2. Push your code to GitHub:
   ```
   git push -u origin main
   ```

## Step 4: Install gh-pages and Deploy
1. Install the gh-pages package:
   ```
   npm install --save-dev gh-pages
   ```
2. Make sure your package.json has the correct scripts:
   ```json
   "scripts": {
     "start": "react-scripts start",
     "build": "react-scripts build",
     "test": "react-scripts test",
     "eject": "react-scripts eject",
     "predeploy": "npm run build",
     "deploy": "gh-pages -d build"
   }
   ```
3. Deploy to GitHub Pages:
   ```
   npm run deploy
   ```

## Step 5: Configure GitHub Pages Settings
1. Go to your GitHub repository
2. Click on "Settings"
3. In the left sidebar, click on "Pages"
4. Under "Source," select "Deploy from a branch"
5. For "Branch," select "gh-pages" and "/ (root)"
6. In the "Custom domain" field, enter: `baguio-pet-boarding.com`
7. Check "Enforce HTTPS"
8. Click "Save"

## Step 6: Wait for DNS Propagation
1. Wait 15-30 minutes for GitHub Pages to build your site
2. Wait for DNS changes to propagate (can take up to 24-48 hours)

## Step 7: Test Your Website
1. Clear your browser cache (Ctrl+Shift+Delete)
2. Visit `https://baguio-pet-boarding.com`

## Troubleshooting
- If your site doesn't load after 30 minutes, check the GitHub repository's "Actions" tab for any build errors
- Ensure your DNS settings point to the GitHub Pages IP addresses
- Check that your CNAME file in the public folder contains exactly: `baguio-pet-boarding.com`
