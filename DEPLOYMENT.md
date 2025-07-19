# SatWatcher - Azure Deployment Guide

## Option 1: Azure Static Web Apps (Recommended)

### Prerequisites
- Azure account
- GitHub repository
- Azure CLI (optional)

### Steps:

1. **Push your code to GitHub**
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git branch -M main
   git remote add origin https://github.com/YOUR_USERNAME/satwatcher.git
   git push -u origin main
   ```

2. **Create Azure Static Web App**
   - Go to Azure Portal → Create Resource → Static Web Apps
   - Choose GitHub as source
   - Select your repository and branch (main)
   - Build preset: Next.js
   - App location: `/`
   - API location: `api`
   - Output location: `out`

3. **Configure Environment Variables**
   In Azure Portal → Your Static Web App → Configuration:
   ```
   NEXTAUTH_URL=https://your-app-name.azurestaticapps.net
   NEXTAUTH_SECRET=your-secure-secret-here
   AZURE_STORAGE_ACCOUNT_NAME=your-storage-account
   AZURE_STORAGE_ACCOUNT_KEY=your-storage-key
   AZURE_STORAGE_CONTAINER_NAME=images
   AZURE_CUSTOM_VISION_PREDICTION_KEY=your-prediction-key
   AZURE_CUSTOM_VISION_ENDPOINT=your-endpoint
   AZURE_CUSTOM_VISION_PROJECT_ID=your-project-id
   AZURE_CUSTOM_VISION_ITERATION_NAME=your-iteration-name
   ```

## Option 2: Azure App Service

### Steps:

1. **Create App Service**
   ```bash
   az webapp create \
     --resource-group myResourceGroup \
     --plan myAppServicePlan \
     --name satwatcher \
     --runtime "NODE|18-lts"
   ```

2. **Deploy via GitHub Actions**
   - Enable GitHub Actions in App Service → Deployment Center
   - Configure the workflow file

3. **Configure Environment Variables**
   In App Service → Configuration → Application Settings

## Option 3: Azure Container Instances

### Steps:

1. **Create Dockerfile**
2. **Build and push to Azure Container Registry**
3. **Deploy to Container Instances**

## Important Notes:

1. **File Storage**: The current user registration system uses local file storage. For production, consider:
   - Azure Cosmos DB
   - Azure SQL Database
   - Azure Storage Tables

2. **Security**: 
   - Use Azure Key Vault for secrets
   - Enable HTTPS only
   - Configure CORS properly

3. **Monitoring**:
   - Enable Application Insights
   - Set up alerts and monitoring

## Cost Considerations:

- **Static Web Apps**: Free tier available
- **App Service**: Basic plan ~$13/month
- **Storage**: Pay per usage
- **Custom Vision**: Pay per transaction

Choose Static Web Apps for the most cost-effective solution!
