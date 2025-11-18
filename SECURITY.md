# Security

## Security Improvements

This document outlines the security measures implemented in BookAThing.

### Recent Security Fixes

#### 1. Dependency Vulnerabilities (Fixed)
- **Server**: Updated `firebase-admin` from v11.11.1 to v13.6.0 to fix critical `protobufjs` vulnerability
- **Client**: Added npm overrides for vulnerable dependencies (`nth-check`, `postcss`, `webpack-dev-server`, `svgo`)
- All npm audit vulnerabilities have been resolved

#### 2. CORS Configuration (Fixed)
- **Before**: Allowed all origins (`*`) - security risk
- **After**: Restricted to whitelisted origins in production
- Configure allowed origins via `ALLOWED_ORIGINS` environment variable
- Development mode allows all origins for convenience

#### 3. Rate Limiting (Added)
- **API Routes**: 100 requests per 15 minutes per IP
- **Booking Creation**: 10 bookings per hour per IP (prevents abuse)
- Helps prevent DoS attacks and booking spam

#### 4. Input Validation & Sanitization (Added)
- All user inputs are validated and sanitized using the `validator` library
- **Name**: 2-100 characters, HTML-escaped
- **Email**: Validated format, normalized
- **Phone**: 7-20 characters for international formats
- **Notes**: Max 500 characters, HTML-escaped
- **Date/Time**: Validated using moment.js
- Prevents XSS and injection attacks

#### 5. Authentication for Admin Endpoints (Added)
Protected endpoints now require API key authentication via `X-API-Key` header:
- `GET /api/bookings` - View all bookings
- `DELETE /api/bookings/:id` - Cancel bookings
- `PUT /api/bookings/:id/status` - Update booking status
- `PUT /api/resources/:id/status` - Update resource status

#### 6. Security Headers (Added)
- Implemented `helmet` middleware for security headers
- Protects against common web vulnerabilities

#### 7. Request Size Limits (Added)
- JSON payload limited to 10MB to prevent memory exhaustion attacks

## Configuration

### Setting Up Admin API Key

1. Generate a secure random API key:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

2. Add to your `.env` file:
```bash
ADMIN_API_KEY=your-generated-key-here
```

3. Use the API key when making requests to protected endpoints:
```bash
curl -H "X-API-Key: your-generated-key-here" http://localhost:5000/api/bookings
```

### Configuring CORS

Set allowed origins in production:
```bash
ALLOWED_ORIGINS=https://yourdomain.com,https://app.yourdomain.com
```

### Environment Variables

Copy `.env.example` to `.env` and configure:
```bash
cd server
cp .env.example .env
# Edit .env with your values
```

## Security Best Practices

1. **Never commit `.env` files** - They contain sensitive credentials
2. **Use strong API keys** - At least 32 random bytes
3. **Enable HTTPS in production** - Use SSL/TLS certificates
4. **Keep dependencies updated** - Run `npm audit` regularly
5. **Monitor rate limits** - Adjust based on your traffic patterns
6. **Backup your data** - If using Firebase, enable automated backups
7. **Review logs** - Monitor for suspicious activity

## Reporting Security Issues

If you discover a security vulnerability, please email the maintainer directly rather than opening a public issue.

## Security Checklist for Deployment

- [ ] Set `NODE_ENV=production`
- [ ] Configure `ADMIN_API_KEY` with a strong random value
- [ ] Set `ALLOWED_ORIGINS` to your production domain(s)
- [ ] Enable HTTPS/SSL
- [ ] Set up Firebase (if using persistent storage)
- [ ] Configure firewall rules
- [ ] Enable logging and monitoring
- [ ] Set up automated backups
- [ ] Review and adjust rate limits if needed
- [ ] Remove any test/development accounts
