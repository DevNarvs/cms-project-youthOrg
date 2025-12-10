# Production Deployment Guide

Complete guide for deploying the Youth Organization CMS to production using Vercel or Netlify with Supabase backend.

## Table of Contents
1. [Overview](#overview)
2. [Pre-Deployment Checklist](#pre-deployment-checklist)
3. [Supabase Production Setup](#supabase-production-setup)
4. [Environment Variables](#environment-variables)
5. [Vercel Deployment](#vercel-deployment)
6. [Netlify Deployment](#netlify-deployment)
7. [Domain Configuration](#domain-configuration)
8. [SSL/HTTPS Setup](#sslhttps-setup)
9. [Performance Optimization](#performance-optimization)
10. [Security Configuration](#security-configuration)
11. [Monitoring and Analytics](#monitoring-and-analytics)
12. [Post-Deployment Testing](#post-deployment-testing)
13. [Troubleshooting](#troubleshooting)

---

## Overview

### Tech Stack
- **Frontend**: React 18 + Vite + TypeScript
- **Styling**: Tailwind CSS + ShadCN UI
- **Backend**: Supabase (Auth, Database, Storage)
- **Hosting**: Vercel or Netlify (frontend) + Supabase (backend)

### Architecture
```
User Browser
    ↓
CDN (Vercel/Netlify)
    ↓
React SPA
    ↓
Supabase API
    ↓
PostgreSQL Database
```

---

## Pre-Deployment Checklist

### Code Quality
- [ ] All TypeScript errors resolved
- [ ] ESLint warnings addressed
- [ ] No console.log statements in production code
- [ ] All tests passing
- [ ] Code reviewed and approved

### Security
- [ ] Environment variables properly configured
- [ ] API keys not exposed in client code
- [ ] Row Level Security (RLS) enabled on all tables
- [ ] Authentication flows tested
- [ ] CORS properly configured

### Performance
- [ ] Images optimized
- [ ] Code splitting implemented
- [ ] Bundle size analyzed
- [ ] Lazy loading configured
- [ ] API calls optimized

### Content
- [ ] Default color palette configured
- [ ] Initial admin user created
- [ ] Sample content removed
- [ ] Error messages user-friendly
- [ ] Loading states implemented

### Database
- [ ] All migrations applied
- [ ] Database indexes created
- [ ] RLS policies tested
- [ ] Backup strategy configured
- [ ] Connection pooling enabled

---

## Supabase Production Setup

### 1. Create Production Project

```bash
# Go to https://supabase.com
# Click "New Project"
# Choose organization
# Enter project details:
#   - Name: youth-org-cms-prod
#   - Database Password: [Strong password]
#   - Region: [Closest to your users]
```

### 2. Configure Project Settings

```sql
-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
```

### 3. Apply Migrations

```bash
# Install Supabase CLI
npm install -g supabase

# Link to your project
supabase link --project-ref your-project-ref

# Apply all migrations
supabase db push

# Or manually copy and run migration SQL in SQL Editor
```

### 4. Configure Storage

```bash
# Create storage bucket for public assets
# Go to Storage in Supabase Dashboard
# Create bucket: "public-assets"
# Settings:
#   - Public: Yes
#   - File size limit: 10MB
#   - Allowed MIME types: image/*, application/json
```

### 5. Upload Default Palette

```bash
# Create default palette file
cat > color-palette.json << 'EOF'
{
  "version": "1.0.0",
  "name": "Default Theme",
  "colors": {
    "primary": {
      "50": "#eff6ff",
      "100": "#dbeafe",
      "200": "#bfdbfe",
      "300": "#93c5fd",
      "400": "#60a5fa",
      "500": "#3b82f6",
      "600": "#2563eb",
      "700": "#1d4ed8",
      "800": "#1e40af",
      "900": "#1e3a8a",
      "950": "#172554"
    }
  }
}
EOF

# Upload to Storage at: public-assets/config/color-palette.json
```

### 6. Configure Authentication

```yaml
# Go to Authentication > Settings
# Configure Email Settings:
Site URL: https://yourdomain.com
Redirect URLs:
  - https://yourdomain.com
  - https://yourdomain.com/auth/callback

# Email Templates:
Confirm signup: Customize with your branding
Reset password: Customize with your branding
```

### 7. Set Up Database Backups

```yaml
# Go to Database > Backups
# Enable automated backups:
Frequency: Daily
Retention: 7 days
Point-in-time recovery: Enable (for paid plans)
```

---

## Environment Variables

### Required Variables

Create `.env.production` file:

```bash
# Supabase Configuration
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key

# Application Configuration
VITE_APP_NAME=Youth Organization CMS
VITE_APP_URL=https://yourdomain.com

# Optional: Analytics
VITE_GA_TRACKING_ID=G-XXXXXXXXXX
```

### Security Notes

**IMPORTANT**:
- Never commit `.env` files to git
- Use platform environment variables (Vercel/Netlify dashboard)
- Rotate keys regularly
- Use different keys for staging/production

### Getting Supabase Keys

```bash
# Go to Supabase Dashboard
# Settings > API
# Copy:
#   - Project URL → VITE_SUPABASE_URL
#   - anon/public key → VITE_SUPABASE_ANON_KEY

# NEVER use the service_role key in frontend!
```

---

## Vercel Deployment

### Method 1: Vercel CLI

```bash
# Install Vercel CLI
npm install -g vercel

# Login
vercel login

# Deploy
vercel --prod

# Follow prompts:
#   - Project name: youth-org-cms
#   - Framework preset: Vite
#   - Build command: npm run build
#   - Output directory: dist
```

### Method 2: GitHub Integration

```bash
# 1. Push code to GitHub
git add .
git commit -m "Prepare for production"
git push origin main

# 2. Go to vercel.com
# 3. Click "Import Project"
# 4. Select GitHub repository
# 5. Configure project:

Project Name: youth-org-cms
Framework: Vite
Build Command: npm run build
Output Directory: dist
Install Command: npm install

# 6. Add Environment Variables:
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
VITE_APP_NAME=Youth Organization CMS
VITE_APP_URL=https://yourdomain.com

# 7. Click "Deploy"
```

### Vercel Configuration File

Create `vercel.json`:

```json
{
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "devCommand": "npm run dev",
  "installCommand": "npm install",
  "framework": "vite",
  "rewrites": [
    {
      "source": "/(.*)",
      "destination": "/index.html"
    }
  ],
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        {
          "key": "X-Content-Type-Options",
          "value": "nosniff"
        },
        {
          "key": "X-Frame-Options",
          "value": "DENY"
        },
        {
          "key": "X-XSS-Protection",
          "value": "1; mode=block"
        },
        {
          "key": "Referrer-Policy",
          "value": "strict-origin-when-cross-origin"
        },
        {
          "key": "Permissions-Policy",
          "value": "camera=(), microphone=(), geolocation=()"
        }
      ]
    }
  ]
}
```

### Post-Deployment

```bash
# Check deployment
vercel ls

# View logs
vercel logs

# Set custom domain
vercel domains add yourdomain.com
```

---

## Netlify Deployment

### Method 1: Netlify CLI

```bash
# Install Netlify CLI
npm install -g netlify-cli

# Login
netlify login

# Initialize site
netlify init

# Deploy
netlify deploy --prod
```

### Method 2: Drag and Drop

```bash
# Build locally
npm run build

# Go to netlify.com
# Drag dist folder to "Deploy manually" area
```

### Method 3: GitHub Integration

```bash
# 1. Push to GitHub
git push origin main

# 2. Go to app.netlify.com
# 3. Click "New site from Git"
# 4. Select GitHub repository
# 5. Configure build settings:

Build command: npm run build
Publish directory: dist

# 6. Add Environment Variables
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
VITE_APP_NAME=Youth Organization CMS
VITE_APP_URL=https://yourdomain.netlify.app

# 7. Click "Deploy site"
```

### Netlify Configuration File

Create `netlify.toml`:

```toml
[build]
  command = "npm run build"
  publish = "dist"

[build.environment]
  NODE_VERSION = "18"

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200

[[headers]]
  for = "/*"
  [headers.values]
    X-Frame-Options = "DENY"
    X-Content-Type-Options = "nosniff"
    X-XSS-Protection = "1; mode=block"
    Referrer-Policy = "strict-origin-when-cross-origin"
    Permissions-Policy = "camera=(), microphone=(), geolocation=()"

[[headers]]
  for = "/*.js"
  [headers.values]
    Cache-Control = "public, max-age=31536000, immutable"

[[headers]]
  for = "/*.css"
  [headers.values]
    Cache-Control = "public, max-age=31536000, immutable"

[[headers]]
  for = "/assets/*"
  [headers.values]
    Cache-Control = "public, max-age=31536000, immutable"
```

---

## Domain Configuration

### Custom Domain Setup

#### Vercel

```bash
# Via CLI
vercel domains add yourdomain.com
vercel domains add www.yourdomain.com

# Via Dashboard
# 1. Go to project settings
# 2. Click "Domains"
# 3. Add domain
# 4. Follow DNS configuration instructions
```

#### Netlify

```bash
# Via CLI
netlify domains:add yourdomain.com

# Via Dashboard
# 1. Go to Domain settings
# 2. Click "Add custom domain"
# 3. Enter domain name
# 4. Verify ownership
```

### DNS Configuration

#### Option 1: Nameserver Method (Recommended)

```bash
# Change nameservers at your domain registrar to:

# Vercel:
ns1.vercel-dns.com
ns2.vercel-dns.com

# Netlify:
dns1.p01.nsone.net
dns2.p01.nsone.net
dns3.p01.nsone.net
dns4.p01.nsone.net
```

#### Option 2: CNAME Method

```bash
# Add CNAME records at your domain registrar:

# For www.yourdomain.com:
Type: CNAME
Name: www
Value: cname.vercel-dns.com (Vercel)
       apex-loadbalancer.netlify.com (Netlify)

# For apex domain (yourdomain.com):
Type: A
Name: @
Value: 76.76.21.21 (Vercel)
       75.2.60.5 (Netlify)
```

### Subdomain Configuration

```bash
# For admin.yourdomain.com or app.yourdomain.com:
Type: CNAME
Name: admin (or app)
Value: cname.vercel-dns.com
```

---

## SSL/HTTPS Setup

### Automatic SSL (Recommended)

**Vercel**:
- Automatic SSL via Let's Encrypt
- Enabled by default
- Auto-renewal
- No configuration needed

**Netlify**:
- Automatic SSL via Let's Encrypt
- Go to Domain settings
- Click "Verify DNS configuration"
- SSL certificate issued automatically

### Force HTTPS

Both platforms automatically redirect HTTP to HTTPS.

Manual configuration (if needed):

```javascript
// vite.config.ts
export default {
  server: {
    https: true
  }
}
```

### Certificate Verification

```bash
# Check SSL certificate
openssl s_client -connect yourdomain.com:443 -servername yourdomain.com

# Online tools:
# https://www.ssllabs.com/ssltest/
```

---

## Performance Optimization

### 1. Build Optimization

```javascript
// vite.config.ts
import { defineConfig } from 'vite'

export default defineConfig({
  build: {
    target: 'es2015',
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true
      }
    },
    rollupOptions: {
      output: {
        manualChunks: {
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          'supabase-vendor': ['@supabase/supabase-js'],
          'ui-vendor': ['@radix-ui/react-dialog', '@radix-ui/react-dropdown-menu']
        }
      }
    },
    chunkSizeWarningLimit: 1000
  }
})
```

### 2. Image Optimization

```bash
# Compress images before upload
npm install -g imagemin-cli

# Optimize all images
imagemin public/images/* --out-dir=public/images/optimized
```

### 3. Code Splitting

```typescript
// Lazy load routes
import { lazy, Suspense } from 'react'

const AdminDashboard = lazy(() => import('@/pages/admin/AdminDashboard'))
const OrgDashboard = lazy(() => import('@/pages/organization/OrgDashboard'))

function App() {
  return (
    <Suspense fallback={<LoadingSpinner />}>
      <Routes>
        <Route path="/admin" element={<AdminDashboard />} />
        <Route path="/org" element={<OrgDashboard />} />
      </Routes>
    </Suspense>
  )
}
```

### 4. Bundle Analysis

```bash
# Install analyzer
npm install -D rollup-plugin-visualizer

# Add to vite.config.ts
import { visualizer } from 'rollup-plugin-visualizer'

export default defineConfig({
  plugins: [
    visualizer({
      open: true,
      gzipSize: true,
      brotliSize: true
    })
  ]
})

# Run build and view report
npm run build
```

### 5. Caching Strategy

```typescript
// Service Worker for caching (optional)
// public/sw.js
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then((response) => {
      return response || fetch(event.request)
    })
  )
})
```

---

## Security Configuration

### 1. Content Security Policy

```html
<!-- index.html -->
<meta http-equiv="Content-Security-Policy" content="
  default-src 'self';
  script-src 'self' 'unsafe-inline' 'unsafe-eval';
  style-src 'self' 'unsafe-inline';
  img-src 'self' data: https:;
  font-src 'self' data:;
  connect-src 'self' https://*.supabase.co;
  frame-ancestors 'none';
  base-uri 'self';
  form-action 'self';
">
```

### 2. Security Headers

Already configured in `vercel.json` and `netlify.toml` above.

### 3. Rate Limiting

Configure in Supabase:

```sql
-- Create function to track API calls
CREATE OR REPLACE FUNCTION check_rate_limit(
  user_id UUID,
  max_requests INTEGER DEFAULT 100,
  time_window INTERVAL DEFAULT '1 hour'
)
RETURNS BOOLEAN AS $$
DECLARE
  request_count INTEGER;
BEGIN
  SELECT COUNT(*)
  INTO request_count
  FROM api_logs
  WHERE user_id = check_rate_limit.user_id
    AND created_at > NOW() - time_window;

  RETURN request_count < max_requests;
END;
$$ LANGUAGE plpgsql;
```

### 4. Input Validation

```typescript
// Always validate and sanitize user input
import DOMPurify from 'dompurify'

function sanitizeInput(input: string): string {
  return DOMPurify.sanitize(input, {
    ALLOWED_TAGS: [],
    ALLOWED_ATTR: []
  })
}

// Validate email
function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}
```

### 5. Authentication Security

```typescript
// Implement session timeout
const SESSION_TIMEOUT = 3600000 // 1 hour

function checkSessionTimeout() {
  const lastActivity = localStorage.getItem('lastActivity')
  if (lastActivity) {
    const elapsed = Date.now() - parseInt(lastActivity)
    if (elapsed > SESSION_TIMEOUT) {
      supabase.auth.signOut()
      window.location.href = '/login'
    }
  }
  localStorage.setItem('lastActivity', Date.now().toString())
}

// Run on user activity
window.addEventListener('click', checkSessionTimeout)
```

---

## Monitoring and Analytics

### 1. Error Tracking

**Sentry Integration**:

```bash
npm install @sentry/react @sentry/tracing
```

```typescript
// src/main.tsx
import * as Sentry from '@sentry/react'

Sentry.init({
  dsn: 'your-sentry-dsn',
  environment: import.meta.env.MODE,
  tracesSampleRate: 1.0
})
```

### 2. Analytics

**Google Analytics**:

```html
<!-- index.html -->
<script async src="https://www.googletagmanager.com/gtag/js?id=G-XXXXXXXXXX"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
  gtag('config', 'G-XXXXXXXXXX');
</script>
```

### 3. Performance Monitoring

```typescript
// src/lib/monitoring.ts
export function trackPerformance() {
  if ('performance' in window) {
    window.addEventListener('load', () => {
      const perfData = window.performance.timing
      const pageLoadTime = perfData.loadEventEnd - perfData.navigationStart

      console.log('Page load time:', pageLoadTime)

      // Send to analytics
      gtag('event', 'timing_complete', {
        name: 'page_load',
        value: pageLoadTime
      })
    })
  }
}
```

### 4. Supabase Monitoring

```bash
# Go to Supabase Dashboard
# Reports > Overview
# Monitor:
#   - API requests
#   - Database size
#   - Active connections
#   - Query performance
```

---

## Post-Deployment Testing

### 1. Functionality Testing

```bash
# Test all authentication flows
✓ User registration
✓ User login
✓ Password reset
✓ Session persistence
✓ Logout

# Test role-based access
✓ Admin access to admin pages
✓ Organization access to org pages
✓ Public access to public pages
✓ Unauthorized access blocked

# Test data operations
✓ Create records
✓ Read records
✓ Update records
✓ Delete records
✓ File uploads
```

### 2. Performance Testing

```bash
# Use Lighthouse
# Chrome DevTools > Lighthouse > Generate report

Target scores:
- Performance: > 90
- Accessibility: > 90
- Best Practices: > 90
- SEO: > 90
```

### 3. Security Testing

```bash
# OWASP ZAP scan
# https://www.zaproxy.org/

# Check for:
✓ XSS vulnerabilities
✓ SQL injection
✓ CSRF protection
✓ Secure headers
✓ HTTPS enforcement
```

### 4. Cross-Browser Testing

```bash
# Test on:
✓ Chrome (latest)
✓ Firefox (latest)
✓ Safari (latest)
✓ Edge (latest)
✓ Mobile browsers (iOS Safari, Chrome Mobile)
```

### 5. Load Testing

```bash
# Use Apache Bench
ab -n 1000 -c 10 https://yourdomain.com/

# Or Artillery
npm install -g artillery
artillery quick --count 100 --num 10 https://yourdomain.com/
```

---

## Troubleshooting

### Build Failures

```bash
# Clear cache
rm -rf node_modules
rm package-lock.json
npm install

# Check Node version
node --version  # Should be 18+

# Verbose build
npm run build -- --debug
```

### Environment Variables Not Working

```bash
# Verify variable names start with VITE_
# ✓ VITE_SUPABASE_URL
# ✗ SUPABASE_URL

# Rebuild after changing variables
vercel --prod --force
netlify deploy --prod --force
```

### CORS Errors

```typescript
// Verify Supabase URL is correct
// Check allowed origins in Supabase dashboard
// Authentication > URL Configuration
```

### 404 on Refresh

```bash
# Ensure SPA redirect is configured
# vercel.json or netlify.toml should have:
# Rewrite all routes to /index.html
```

### Database Connection Issues

```sql
-- Check connection pooling
-- Supabase Dashboard > Database > Connection pooling
-- Use connection pooling URL for high traffic
```

### Slow Performance

```bash
# Check bundle size
npm run build -- --stats

# Enable compression
# Already handled by Vercel/Netlify

# Optimize images
# Use WebP format
# Implement lazy loading
```

---

## Production Checklist

### Pre-Launch
- [ ] All environment variables set
- [ ] Database migrations applied
- [ ] RLS policies enabled and tested
- [ ] Default admin user created
- [ ] Color palette configured
- [ ] Test data removed
- [ ] Error pages styled
- [ ] Loading states implemented
- [ ] SEO metadata added
- [ ] Favicon added
- [ ] robots.txt configured
- [ ] sitemap.xml generated

### Launch
- [ ] Deploy to production
- [ ] Custom domain configured
- [ ] SSL certificate active
- [ ] DNS propagated
- [ ] Authentication working
- [ ] All pages accessible
- [ ] Forms submitting correctly
- [ ] File uploads working
- [ ] Email notifications sent

### Post-Launch
- [ ] Monitor error logs
- [ ] Check performance metrics
- [ ] Verify analytics tracking
- [ ] Test backup restore
- [ ] Document known issues
- [ ] Set up monitoring alerts
- [ ] Create runbook for incidents
- [ ] Schedule regular backups
- [ ] Plan for scaling

---

## Summary

Your Youth Organization CMS is now production-ready with:

✅ Secure authentication and authorization
✅ Scalable Supabase backend
✅ Fast CDN delivery via Vercel/Netlify
✅ Automatic SSL/HTTPS
✅ Security headers configured
✅ Performance optimized
✅ Monitoring and analytics
✅ Error tracking
✅ Backup strategy

For ongoing maintenance, regularly:
- Monitor performance and errors
- Update dependencies
- Review security advisories
- Backup database
- Test disaster recovery
- Optimize based on usage patterns
