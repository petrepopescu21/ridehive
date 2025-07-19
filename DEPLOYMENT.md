# RideHive Deployment Guide

## Heroku Deployment Status

### ✅ Completed Setup
- **Heroku App**: `ridehive-app` 
- **URL**: https://ridehive-app-d5258a8e7e80.herokuapp.com
- **Database**: PostgreSQL Essential-0
- **GitHub Repository**: https://github.com/petrepopescu21/ridehive

### Environment Variables
```
NODE_ENV=production
SESSION_SECRET=[Auto-generated secure key]
ORGANIZER_PASSWORD=admin123
DATABASE_URL=[Auto-configured by Heroku PostgreSQL]
```

### GitHub Actions
- **Linting**: Runs on push/PR to main/develop branches
- **Deployment**: Runs on push to main branch
- **Secrets Configured**: 
  - `HEROKU_API_KEY`: [Configured in GitHub Secrets]
  - `HEROKU_EMAIL`: [Configured in GitHub Secrets]

## Deployment Workflow

### Automatic Deployment
1. Push code to `main` branch
2. GitHub Actions runs tests and linting
3. If tests pass, deploys to Heroku
4. Runs database setup automatically

### Manual Deployment
```bash
# Using Heroku CLI
git push heroku main

# Or trigger GitHub Action manually
gh workflow run deploy.yml
```

### Database Operations
```bash
# Run database setup
heroku run npm run db:setup --app ridehive-app

# Access database
heroku pg:psql --app ridehive-app

# View logs
heroku logs --tail --app ridehive-app
```

## API Endpoints (Production)

### Base URL
```
https://ridehive-app-d5258a8e7e80.herokuapp.com
```

### Key Endpoints
- **API Docs**: https://ridehive-app-d5258a8e7e80.herokuapp.com/api-docs
- **Health Check**: https://ridehive-app-d5258a8e7e80.herokuapp.com/health
- **Auth**: https://ridehive-app-d5258a8e7e80.herokuapp.com/api/auth/organizer

### Socket.io Connection
```javascript
const socket = io('https://ridehive-app-d5258a8e7e80.herokuapp.com');
```

## Frontend Deployment

### Web Client (Recommended: Netlify)
```bash
cd web-client
npm run build
# Deploy dist/ folder to Netlify
```

**Update `shared/constants.ts`**:
```typescript
export const API_BASE_URL = 'https://ridehive-app-d5258a8e7e80.herokuapp.com';
```

### Mobile Client
```bash
cd mobile-client
# iOS
npx react-native run-ios --configuration Release
# Android  
cd android && ./gradlew assembleRelease
```

## CORS Configuration
Production origins already configured:
- `https://ridehive-app.netlify.app` (web client)
- `https://ridehive-app-d5258a8e7e80.herokuapp.com` (server)

## Monitoring & Maintenance

### View Logs
```bash
heroku logs --tail --app ridehive-app
```

### Database Monitoring
```bash
heroku pg:info --app ridehive-app
heroku pg:stats --app ridehive-app
```

### Scale Dynos
```bash
heroku ps:scale web=1 --app ridehive-app
```

## Security Notes
- Session secret is randomly generated
- Database connection uses SSL in production
- CORS properly configured
- Environment variables secured
- GitHub secrets properly configured

## Next Steps
1. Deploy web client to Netlify
2. Build and test mobile apps
3. Update frontend API URLs
4. Test end-to-end functionality