# RideHive Deployment Guide

This guide covers deploying RideHive to Heroku with automatic CI/CD via GitHub Actions.

## Prerequisites

1. **Heroku Account** - Create at [heroku.com](https://heroku.com)
2. **Heroku CLI** - Install from [devcenter.heroku.com/articles/heroku-cli](https://devcenter.heroku.com/articles/heroku-cli)
3. **GitHub Repository** - Code must be in a GitHub repository

## Initial Heroku Setup

### 1. Create Heroku App

```bash
# Create new app (replace 'your-app-name' with your desired name)
heroku create your-app-name

# Or use the Heroku dashboard to create the app
```

### 2. Add Required Add-ons

```bash
# Add PostgreSQL database
heroku addons:create heroku-postgresql:essential-0 --app your-app-name

# Add Redis (optional, for caching/sessions)
heroku addons:create heroku-redis:mini --app your-app-name
```

### 3. Set Environment Variables

```bash
# Required environment variables
heroku config:set NODE_ENV=production --app your-app-name
heroku config:set ORGANIZER_PASSWORD=your-secure-password --app your-app-name
heroku config:set SESSION_SECRET=$(openssl rand -base64 32) --app your-app-name
heroku config:set BASE_URL=https://your-app-name.herokuapp.com --app your-app-name

# DATABASE_URL and REDIS_URL are automatically set by the add-ons
```

## GitHub Actions CI/CD Setup

### 1. Required GitHub Secrets

In your GitHub repository, go to **Settings > Secrets and variables > Actions** and add:

| Secret Name | Description | Example Value |
|-------------|-------------|---------------|
| `HEROKU_API_KEY` | Your Heroku API key | `12345678-1234-1234-1234-123456789abc` |
| `HEROKU_APP_NAME` | Your Heroku app name | `your-app-name` |
| `HEROKU_EMAIL` | Your Heroku account email | `you@example.com` |

#### Getting Your Heroku API Key:
```bash
heroku auth:token
```

### 2. GitHub Actions Workflow

The workflow file is already configured at `.github/workflows/deploy-heroku.yml` and will:

1. **Trigger** on every push to `main` branch
2. **Build** the React web client
3. **Run** linting and tests
4. **Deploy** to Heroku
5. **Run** database migrations (if needed)
6. **Perform** health checks

## Manual Deployment

If you need to deploy manually:

```bash
# Login to Heroku
heroku login

# Add Heroku remote (if not already added)
heroku git:remote -a your-app-name

# Deploy current branch
git push heroku main

# Run database setup (first time only)
heroku run node server/db/setup.js --app your-app-name

# View logs
heroku logs --tail --app your-app-name
```

## Database Migrations

Database migrations run automatically during deployment. To run them manually:

```bash
# Connect to your Heroku app
heroku run bash --app your-app-name

# Run migration
cd server && node -e "
const { query } = require('./db/database');
const fs = require('fs');
const sql = fs.readFileSync('./db/migrations/001_add_dual_pins.sql', 'utf8');
query(sql).then(() => console.log('Migration complete')).catch(console.error);
"
```

## Verification

After deployment, verify your app is working:

1. **Web Interface**: Visit `https://your-app-name.herokuapp.com`
2. **API Health**: Check `https://your-app-name.herokuapp.com/health`
3. **API Docs**: Visit `https://your-app-name.herokuapp.com/api-docs`

## Production Configuration

### Environment Variables

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `NODE_ENV` | Environment mode | `production` | ✅ |
| `PORT` | Server port | Auto-assigned by Heroku | ❌ |
| `DATABASE_URL` | PostgreSQL connection | Auto-set by add-on | ✅ |
| `REDIS_URL` | Redis connection | Auto-set by add-on | ❌ |
| `SESSION_SECRET` | Express session secret | Random generated | ✅ |
| `ORGANIZER_PASSWORD` | Web dashboard password | `admin123` | ✅ |
| `BASE_URL` | App base URL | Auto-detected | ❌ |

### Scaling

```bash
# Scale web dynos
heroku ps:scale web=1 --app your-app-name

# Check current scaling
heroku ps --app your-app-name
```

## Mobile App Configuration

The mobile app needs to be configured to point to your production server:

1. Update `shared/constants.ts` for production builds
2. Set the API base URL to your Heroku app URL
3. Build and distribute the mobile app

## Troubleshooting

### Common Issues

1. **Build Failures**
   ```bash
   # Check build logs
   heroku logs --tail --app your-app-name
   ```

2. **Database Connection Issues**
   ```bash
   # Check database connection
   heroku pg:info --app your-app-name
   
   # Connect to database
   heroku pg:psql --app your-app-name
   ```

3. **Memory Issues**
   ```bash
   # Monitor memory usage
   heroku logs --ps web --app your-app-name
   
   # Upgrade dyno type if needed
   heroku ps:type web=standard-1x --app your-app-name
   ```

### Debug Commands

```bash
# View recent logs
heroku logs --tail --app your-app-name

# Open remote shell
heroku run bash --app your-app-name

# Check app info
heroku info --app your-app-name

# Restart app
heroku restart --app your-app-name
```

## Performance Optimization

1. **Enable Gzip Compression** (already configured in Express)
2. **Use CDN** for static assets (consider CloudFlare)
3. **Monitor Performance** with Heroku metrics
4. **Database Indexing** (already configured)

## Security Considerations

1. **Environment Variables** - Never commit secrets to code
2. **HTTPS** - Enforced automatically by Heroku
3. **Session Security** - Secure cookies in production
4. **CORS** - Configured for same-origin in production
5. **SQL Injection** - Using parameterized queries

## Cost Optimization

- **Hobby Dyno**: Free tier (sleeps after 30min inactivity)
- **Basic/Standard Dyno**: Always-on production apps
- **Essential-0 Postgres**: 10K rows, good for development/small scale
- **Mini Redis**: 25MB, sufficient for sessions/caching

## Support

For deployment issues:
1. Check Heroku logs: `heroku logs --tail --app your-app-name`
2. Review GitHub Actions build logs
3. Verify environment variables are set correctly
4. Check database connectivity and migrations