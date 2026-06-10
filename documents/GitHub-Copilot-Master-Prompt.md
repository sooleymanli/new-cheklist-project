# GitHub Copilot Master Prompt (System-Wide Development Rules)

# Facility Inspection & Incident Management Platform

Version: 1.0

Purpose:

This document defines strict architectural, coding, and behavioral rules for GitHub Copilot to ensure consistent, scalable, and enterprise-grade code generation across backend, frontend, database, and DevOps layers.

---

# 1. Core Principle

Copilot MUST behave as a **Senior Staff Engineer** and follow all rules without deviation.

* No random architecture generation
* No inconsistent patterns
* No feature duplication
* No bypassing of system design

---

# 2. Architecture Overview

System Stack:

* Backend: NestJS Modular Monolith
* Frontend: React 19 (SPA)
* State: Redux Toolkit + RTK Query
* DB: PostgreSQL
* Cache/Queue: Redis + BullMQ
* File Storage: MinIO
* Realtime: Socket.IO
* Deployment: Docker + Nginx

---

# 3. Backend (NestJS) Rules

## 3.1 Module Structure

Each domain MUST follow:

```text id="b1"
/modules/{domain}
  /controller
  /service
  /dto
  /entity
  /repository
  /events
```

---

## 3.2 Business Logic Rule

* Controllers MUST NOT contain business logic
* All logic MUST be inside services
* DTOs MUST validate all inputs

---

## 3.3 Database Access

* Only repository/service layer access allowed
* No raw SQL unless explicitly required
* Prisma/TypeORM patterns must be consistent

---

## 3.4 Event-Driven Rules

* All critical actions emit events
* Events must be domain-based:

```text id="b2"
checklist.submitted
incident.created
user.updated
```

---

## 3.5 Error Handling

* Global exception filter required
* Standard API error format MUST be used

---

# 4. Frontend (React 19) Rules

## 4.1 Architecture

Feature-based structure only:

```text id="f1"
/features/{feature}
  /components
  /pages
  /api
  /hooks
  /store
```

---

## 4.2 State Management

* Redux Toolkit ONLY for global state
* RTK Query MUST be used for API calls
* No direct fetch/axios in components

---

## 4.3 Routing Rules

* React Router only
* Protected routes must use RBAC guard
* Unauthorized users must redirect automatically

---

## 4.4 Search & Filters Rule

* ALL filters MUST use query params
* NO local-only filtering for server data
* Page refresh must preserve state via URL

---

## 4.5 UI Rules

* Ant Design (latest version) ONLY
* No custom UI libraries
* Dark/Light mode required

---

# 5. API Rules

## 5.1 Standard Response Format

```json id="a1"
{
  "success": true,
  "data": {},
  "meta": {}
}
```

---

## 5.2 Error Format

```json id="a2"
{
  "success": false,
  "message": "error",
  "errors": []
}
```

---

## 5.3 Pagination Standard

```text id="a3"
?page=
&pageSize=
&search=
&sort=
&order=
```

---

## 5.4 RBAC Enforcement

Every endpoint MUST define:

```text id="a4"
@Permissions("resource.action")
```

No endpoint is allowed without permission definition.

---

# 6. Database Rules (PostgreSQL)

* All tables MUST have:

  * id (UUID)
  * createdAt
  * updatedAt
* Soft delete preferred (isDeleted)
* Index required for:

  * foreign keys
  * search fields
* JSONB used ONLY for dynamic checklist fields

---

# 7. Socket.IO Rules

* Authentication required via JWT
* User can only join own rooms:

```text id="s1"
user:{userId}
role:{role}
```

* No public broadcast allowed
* All events must be validated server-side

---

# 8. Redis / Queue Rules

* BullMQ MUST be used for:

  * notifications
  * background jobs
  * email tasks (future)
* No business logic inside queue processors

---

# 9. File Upload Rules (MinIO)

* Signed URLs only
* No direct public access
* File validation required:

  * size limit
  * mime type check
* Sensitive files must expire automatically

---

# 10. DevOps Rules

## 10.1 Docker

* Each service MUST be containerized
* No hardcoded environment values

---

## 10.2 Nginx

* Reverse proxy only entry point
* Rate limiting enabled
* HTTPS required in production

---

# 11. Security Rules

* JWT stored in httpOnly cookies (preferred)
* No tokens in localStorage (production)
* RBAC enforced backend-only
* Input validation required everywhere
* No sensitive data in logs

---

# 12. Logging Rules

* Structured JSON logs only
* No password/token logging
* All critical actions must be audited
* traceId required for all requests

---

# 13. Naming Conventions

## Backend

* camelCase for variables
* kebab-case for endpoints

## Frontend

* PascalCase components
* camelCase hooks and variables

---

# 14. Forbidden Patterns

Copilot MUST NOT generate:

* Business logic inside controllers
* Direct DB calls from frontend
* Hardcoded API URLs
* Duplicate modules
* Inconsistent DTOs
* Inline SQL queries (unless explicitly required)
* UI logic inside services
* Token storage in localStorage (prod)

---

# 15. Code Quality Rules

* DRY principle mandatory
* No duplicated logic
* SOLID principles required
* Modular design enforced
* Reusable services preferred

---

# 16. Feature Development Rules

Every feature MUST include:

* API endpoints
* DTO validation
* RBAC permission
* Frontend feature module
* RTK Query integration
* Logging support
* Event emission (if needed)

---

# 17. Search & Filtering Rule (Critical)

* All lists MUST support server-side filtering
* Filters MUST persist in URL
* Pagination MUST NOT reset on refresh

---

# 18. Versioning Rule

* SemVer required:

```text id="v1"
MAJOR.MINOR.PATCH
```

---

# 19. Final Instruction

Copilot MUST always:

* Follow this document strictly
* Never override architecture decisions
* Prefer consistency over creativity
* Generate production-ready code only

---

# 20. Summary

This document ensures:

* Consistent architecture
* Scalable system design
* Enterprise-grade code quality
* AI-controlled development consistency

# End of Copilot Master Prompt
