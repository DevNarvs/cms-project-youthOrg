# Security Policy

## Security Best Practices

This document outlines the security measures implemented in the Youth Organization CMS and guidelines for maintaining security.

## Implemented Security Measures

### 1. Authentication & Authorization
- ✅ Supabase Auth for secure user authentication
- ✅ Row Level Security (RLS) on all database tables
- ✅ Role-based access control (Admin, Organization, Public)
- ✅ Protected routes with authentication checks
- ✅ Session management with automatic timeout
- ✅ Secure password requirements

### 2. Database Security
- ✅ Row Level Security enabled on all tables
- ✅ Policies prevent unauthorized data access
- ✅ SQL injection prevention through parameterized queries
- ✅ Encrypted connections to database
- ✅ Audit trails for sensitive operations

### 3. API Security
- ✅ CORS properly configured
- ✅ Rate limiting (via Supabase)
- ✅ API key rotation capability
- ✅ Input validation on all endpoints
- ✅ Output encoding to prevent XSS

### 4. Frontend Security
- ✅ Content Security Policy (CSP) headers
- ✅ XSS protection headers
- ✅ CSRF protection
- ✅ Secure cookie handling
- ✅ Input sanitization with DOMPurify (when needed)
- ✅ No sensitive data in localStorage
- ✅ Error messages don't expose system details

### 5. File Upload Security
- ✅ File type validation
- ✅ File size limits
- ✅ Secure storage in Supabase Storage
- ✅ Access control on uploaded files
- ✅ Virus scanning (via Supabase Storage)

### 6. Deployment Security
- ✅ HTTPS enforced
- ✅ Security headers configured
- ✅ Environment variables properly secured
- ✅ No secrets in client-side code
- ✅ Dependency vulnerability scanning

## Security Headers

The following security headers are configured in `vercel.json` and `netlify.toml`:

```
X-Frame-Options: DENY
X-Content-Type-Options: nosniff
X-XSS-Protection: 1; mode=block
Referrer-Policy: strict-origin-when-cross-origin
Permissions-Policy: camera=(), microphone=(), geolocation=()
Content-Security-Policy: [See index.html]
```

## Environment Variables

### Required Variables
```
VITE_SUPABASE_URL
VITE_SUPABASE_ANON_KEY
```

### Important Security Notes
1. **Never** commit `.env` files to git
2. **Never** use `service_role` key in frontend
3. **Always** use `anon` key for client-side
4. Rotate keys regularly (every 90 days recommended)
5. Use different keys for staging and production

## Row Level Security Policies

All tables have RLS enabled with policies:

### Users Table
```sql
-- Users can only read their own data
CREATE POLICY "Users can read own data"
  ON users FOR SELECT
  TO authenticated
  USING (auth.uid() = auth_uid);
```

### Organizations Table
```sql
-- Organization users can read own organization
CREATE POLICY "Organization users can read own org"
  ON organizations FOR SELECT
  TO authenticated
  USING (
    id IN (
      SELECT organization_id FROM users
      WHERE auth_uid = auth.uid()
    )
  );
```

### Programs Table
```sql
-- Public can read approved programs
CREATE POLICY "Public can read approved programs"
  ON programs FOR SELECT
  TO anon
  USING (approved = true AND archived = false);
```

See [DATABASE_SCHEMA.md](./DATABASE_SCHEMA.md) for complete RLS policies.

## Input Validation

### Client-Side Validation
```typescript
// Email validation
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
if (!emailRegex.test(email)) {
  throw new Error('Invalid email format')
}

// Hex color validation
const hexRegex = /^#[0-9A-Fa-f]{6}$/
if (!hexRegex.test(color)) {
  throw new Error('Invalid color format')
}
```

### Server-Side Validation
All inputs are validated in Supabase functions and database constraints.

## Authentication Flow Security

### Registration
1. Email validation
2. Password strength check
3. Duplicate email check
4. Secure password hashing (handled by Supabase)

### Login
1. Rate limiting on failed attempts
2. Account lockout after N failures
3. Secure session token generation
4. Session timeout after inactivity

### Password Reset
1. Secure token generation
2. Time-limited reset links
3. Token invalidation after use
4. Email verification required

## File Upload Security

### Validation Rules
```typescript
// Allowed file types
const ALLOWED_TYPES = [
  'image/jpeg',
  'image/png',
  'image/gif',
  'application/pdf',
  'application/json'
]

// Max file size: 10MB
const MAX_SIZE = 10 * 1024 * 1024

// Validation
if (!ALLOWED_TYPES.includes(file.type)) {
  throw new Error('File type not allowed')
}

if (file.size > MAX_SIZE) {
  throw new Error('File too large')
}
```

## Common Vulnerabilities & Mitigations

### SQL Injection
- ✅ **Mitigated**: Using Supabase client library with parameterized queries
- ✅ All database operations use prepared statements

### Cross-Site Scripting (XSS)
- ✅ **Mitigated**: Output encoding, CSP headers
- ✅ React automatically escapes output
- ✅ DOMPurify for user-generated HTML (if needed)

### Cross-Site Request Forgery (CSRF)
- ✅ **Mitigated**: SameSite cookies, CORS configuration
- ✅ Supabase handles CSRF tokens

### Clickjacking
- ✅ **Mitigated**: X-Frame-Options: DENY header
- ✅ Frame-ancestors CSP directive

### Information Disclosure
- ✅ **Mitigated**: Generic error messages in production
- ✅ Detailed errors only in development mode
- ✅ No stack traces exposed to users

## Security Monitoring

### Error Tracking
```typescript
// Production error logging
if (import.meta.env.PROD) {
  console.error('Error:', {
    message: error.message,
    timestamp: new Date().toISOString(),
    user: userId
  })
  // Send to monitoring service (Sentry, etc.)
}
```

### Audit Logging
All sensitive operations are logged:
- User authentication
- Role changes
- Data modifications
- File uploads
- Permission changes

## Incident Response

### If Security Breach Detected

1. **Immediate Actions**
   - Isolate affected systems
   - Change all credentials
   - Enable maintenance mode if needed

2. **Investigation**
   - Review access logs
   - Identify scope of breach
   - Document timeline

3. **Remediation**
   - Patch vulnerabilities
   - Reset compromised credentials
   - Notify affected users

4. **Post-Incident**
   - Update security policies
   - Implement additional controls
   - Train team on findings

## Security Checklist

### Before Deployment
- [ ] All environment variables secured
- [ ] RLS enabled on all tables
- [ ] RLS policies tested
- [ ] Security headers configured
- [ ] HTTPS enforced
- [ ] Error messages sanitized
- [ ] Input validation implemented
- [ ] File upload restrictions in place
- [ ] Authentication flows tested
- [ ] Authorization checks verified

### Regular Maintenance
- [ ] Update dependencies monthly
- [ ] Rotate API keys quarterly
- [ ] Review access logs weekly
- [ ] Security audit quarterly
- [ ] Penetration testing annually
- [ ] Backup verification weekly
- [ ] Disaster recovery drill quarterly

## Reporting Security Issues

If you discover a security vulnerability:

1. **DO NOT** create a public GitHub issue
2. Email security concerns to: [security@yourdomain.com]
3. Include:
   - Description of the vulnerability
   - Steps to reproduce
   - Potential impact
   - Suggested fix (if any)

We will respond within 48 hours and work with you to resolve the issue.

## Security Resources

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [Supabase Security](https://supabase.com/docs/guides/security)
- [React Security Best Practices](https://reactjs.org/docs/dom-elements.html#dangerouslysetinnerhtml)
- [MDN Web Security](https://developer.mozilla.org/en-US/docs/Web/Security)

## Compliance

### Data Protection
- Data encrypted at rest and in transit
- GDPR-compliant data handling (if applicable)
- User data deletion capability
- Privacy policy implemented

### Access Control
- Role-based access control (RBAC)
- Principle of least privilege
- Regular access reviews
- Audit trails for compliance

## Security Updates

This document is regularly reviewed and updated. Last updated: December 2024

For the latest security information, check:
- GitHub Security Advisories
- Supabase Status Page
- npm audit reports

---

**Security is everyone's responsibility. If you see something, say something.**
