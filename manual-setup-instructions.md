# Manual Setup Instructions for New Repository

## Step 1: Create a New Repository Folder
1. Create a new folder at: `C:\Users\john-PC\Desktop\Important tokeep\New folder\BaguioPetBoarding\NewRepo`
2. Copy all files from your frontend folder to this new folder

## Step 2: Update Package.json
1. Make sure your package.json in the new folder has:
   - `"homepage": "/"`
   - Scripts section includes:
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

## Step 3: Create CNAME File
1. Create a file named `CNAME` in the `public` folder
2. Add only this text to the file (no extra spaces or newlines):
```
baguio-pet-boarding.com
```

## Step 4: Create .gitignore File
Create a .gitignore file in the root with:
```
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
```

## Step 5: Initialize Git Repository
Open Command Prompt (not PowerShell) and run:
```
cd C:\Users\john-PC\Desktop\Important tokeep\New folder\BaguioPetBoarding\NewRepo
git init
git add .
git commit -m "Initial commit"
```

## Step 6: Connect to GitHub
After creating a new empty repository on GitHub, run:
```
git remote add origin https://github.com/YOUR-USERNAME/YOUR-REPO-NAME.git
git push -u origin main
```

## Step 7: Install gh-pages and Deploy
```
npm install --save-dev gh-pages
npm run deploy
```

## Step 8: Configure GitHub Pages
As described in the deployment guide.
