# Security Design Document

# Facility Inspection & Incident Management Platform

Version: 1.0

Security Model:

* Zero Trust Principles (lightweight implementation)
* RBAC + Permission-based Authorization
* JWT-based Authentication
* Event-driven secure communication (Socket.IO + Redis)
* Secure file storage (MinIO signed URLs)

---

# 1. Security Architecture Overview

System security is enforced at 4 layers:

1. Client (Frontend)
2. API Gateway (Nginx)
3. Application Layer (NestJS Backend)
4. Data Layer (PostgreSQL + Redis + MinIO)

---

# 2. Authentication Security

## 2.1 JWT Strategy

* Access Token (short-lived: 15m)
* Refresh Token (long-lived: 7–30 days)
* Token rotation enabled

---

## Token Storage Rules

| Storage         | Allowed                                  |
| --------------- | ---------------------------------------- |
| localStorage    | ❌ (not recommended for sensitive tokens) |
| httpOnly Cookie | ✅ (preferred)                            |
| Memory (SPA)    | ⚠️ optional                              |

---

## 2.2 Login Protection

* Rate limiting (5 attempts/min)
* IP-based throttling
* Account lock after failed attempts
* Optional CAPTCHA (future)

---

# 3. Authorization Security (RBAC)

## Enforcement Layers

1. Backend (PRIMARY – mandatory)
2. Guard Layer (NestJS Guards)
3. Frontend UI restriction (secondary only)

---

## Permission Format

```text id="perm1"
resource.action
```

Example:

```text id="perm2"
incident.create
user.delete
checklist.approve
```

---

## Backend Guard Example

```ts id="guard1"
@Permissions("incident.create")
```

---

## Security Rule

> Frontend restrictions are NOT security. Only backend validation is authoritative.

---

# 4. API Security

## 4.1 Rate Limiting

| Endpoint      | Limit   |
| ------------- | ------- |
| /auth/login   | 5/min   |
| /auth/refresh | 10/min  |
| /api/*        | 100/min |

---

## 4.2 Request Validation

* DTO validation (class-validator)
* Zod (frontend consistency optional)
* Payload sanitization enabled

---

## 4.3 CORS Policy

```text id="cors1"
Allowed Origins:
- https://app.domain.com
- http://localhost:3000 (dev only)
```

---

## 4.4 Security Headers (via Nginx)

* X-Frame-Options: DENY
* X-Content-Type-Options: nosniff
* Strict-Transport-Security (HSTS)
* Content-Security-Policy (CSP)

---

# 5. Password Security

## Hashing

* bcrypt (cost factor ≥ 12)

---

## Rules

* Passwords never stored in plain text
* Password reset tokens are time-limited (15–30 min)
* Password reuse prevention (optional future feature)

---

# 6. Socket.IO Security

## Authentication

* JWT required during handshake

---

## Socket Rules

* User can only join:

```text id="socket1"
user:{userId}
role:{role}
```

* No cross-room access allowed

---

## Event Validation

All socket events must be:

* authenticated
* permission-checked
* rate-limited

---

# 7. File Upload Security (MinIO)

## Rules

* No direct public bucket access
* Signed URLs only
* Expiry-based access (5–15 min)

---

## Allowed File Types

* images (jpg, png, webp)
* pdf
* documents (docx)

---

## Restrictions

* File size limit (e.g. 10–20MB)
* MIME type validation
* Malware scan hook (future enhancement)

---

# 8. SQL Injection Protection

* ORM-based queries only (Prisma / TypeORM)
* No raw queries unless strictly necessary
* Parameterized queries enforced

---

# 9. XSS Protection

* Output escaping
* CSP headers enabled
* No dangerouslySetInnerHTML (frontend rule)

---

# 10. CSRF Protection

If cookies are used:

* CSRF tokens enabled
* SameSite=strict or lax
* Origin validation

---

# 11. Data Security

## Sensitive Data Rules

Never store:

* plain passwords
* full JWT payloads in DB
* secrets in frontend

---

## Encryption

Optional:

* AES encryption for sensitive fields (future enhancement)

---

# 12. Audit Logging Security

Every critical action must be logged:

* user.create
* incident.update
* checklist.approve
* role.change

---

## Audit Log Fields

* userId
* action
* entity
* timestamp
* IP address
* metadata

---

# 13. Role Escalation Protection

* Users cannot self-assign roles
* Role changes require Admin/Super Admin permission
* All role changes logged

---

# 14. Session Security

* Single session per device (optional)
* Refresh token rotation
* Logout invalidates all tokens

---

# 15. Infrastructure Security (DevOps Layer)

## Docker Security

* Non-root containers
* Minimal base images
* No secrets in images

---

## Network Security

* Internal Docker network isolation
* Only Nginx exposed to public

---

## Environment Security

* All secrets in .env
* No hardcoded credentials

---

# 16. Nginx Security Layer

* Rate limiting at gateway level
* Request size limits
* DDoS protection basic rules
* SSL termination (HTTPS only)

---

# 17. Logging & Monitoring Security

* No sensitive data in logs
* Masked PII fields
* Centralized error tracking (future)

---

# 18. Incident Security Handling

Critical incidents trigger:

* instant socket alert
* admin escalation
* audit log creation
* optional email notification (future)

---

# 19. Threat Model Summary

## Mitigated Risks

* Unauthorized access → RBAC + JWT
* Data leakage → MinIO signed URLs
* API abuse → Rate limiting
* Injection attacks → ORM + validation
* Session hijacking → token rotation

---

# 20. Security Principles

* Defense in Depth
* Least Privilege Access
* Zero Trust for API calls
* Fail-safe defaults
* Audit everything critical

---

# 21. Summary

This security architecture ensures:

* Enterprise-level access control
* Secure API ecosystem
* Protected file storage
* Safe real-time communication
* Scalable threat mitigation strategy

# End of Security Design Document
