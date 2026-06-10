# Backend Architecture

# Facility Inspection & Incident Management Platform

## Technology Stack

### Core

* Node.js 22+
* NestJS 11+
* TypeScript 5+
* PostgreSQL 16+
* Redis 7+
* BullMQ
* MinIO
* Socket.IO
* Docker Compose

---

# Architecture Style

## Modular Monolith

The system will initially be developed as a Modular Monolith.

Advantages:

* Faster development
* Easier deployment
* Easier debugging
* Easier transaction management
* Lower infrastructure costs

The architecture must be designed so that each module can be extracted into a microservice in the future without major refactoring.

---

# Architectural Principles

## Domain Driven Design (DDD)

Each business domain must be isolated.

Examples:

* User Domain
* Building Domain
* Checklist Domain
* Incident Domain
* Notification Domain

---

## Clean Architecture

Dependency Flow

```text
Controller
    ↓
Application Layer
    ↓
Domain Layer
    ↓
Infrastructure Layer
```

Outer layers may depend on inner layers.

Inner layers must never depend on outer layers.

---

## SOLID Principles

Every module must follow:

* Single Responsibility Principle
* Open Closed Principle
* Liskov Substitution Principle
* Interface Segregation Principle
* Dependency Inversion Principle

---

## Repository Pattern

Business logic must never access database directly.

Bad:

```typescript
await prisma.user.findMany()
```

Good:

```typescript
await userRepository.findMany()
```

---

# High Level Module Structure

```text
src/

├── modules
│
├── shared
│
├── infrastructure
│
├── config
│
├── common
│
└── main.ts
```

---

# Root Folder Structure

```text
src
│
├── modules
│
├── shared
│
├── infrastructure
│
├── config
│
├── common
│
├── app.module.ts
│
└── main.ts
```

---

# Modules Folder

```text
modules
│
├── auth
├── users
├── roles
├── permissions
├── buildings
├── floors
├── locations
├── checklist-templates
├── checklist-schedules
├── checklist-assignments
├── checklist-instances
├── approvals
├── incidents
├── notifications
├── qr
├── files
├── dashboard
├── reports
├── settings
├── audit
└── activity-log
```

---

# Module Internal Structure

Example:

```text
users
│
├── controllers
│
├── services
│
├── repositories
│
├── entities
│
├── dto
│
├── mappers
│
├── events
│
├── listeners
│
├── queries
│
├── commands
│
├── handlers
│
├── policies
│
├── constants
│
└── users.module.ts
```

---

# Layered Structure

## Controller Layer

Responsibilities:

* Receive requests
* Validate DTO
* Call Application Services

Must not contain business logic.

Example:

```typescript
@Post()
create(@Body() dto: CreateUserDto) {
  return this.userService.create(dto);
}
```

---

# Application Layer

Responsibilities:

* Use Cases
* Business Workflows
* Transactions

Examples:

```text
CreateChecklist

ApproveChecklist

AssignChecklist

CreateIncident
```

---

# Domain Layer

Contains:

* Entities
* Value Objects
* Domain Events
* Business Rules

Example:

```typescript
ChecklistEntity
```

Contains:

```text
CanApprove()

CanReject()

CanSubmit()
```

---

# Infrastructure Layer

Contains:

* Database
* Redis
* MinIO
* BullMQ
* Socket

---

# Shared Folder

Contains reusable code.

```text
shared
│
├── dto
├── enums
├── interfaces
├── types
├── constants
├── decorators
├── guards
├── interceptors
├── filters
├── validators
└── utils
```

---

# Common Folder

Framework-wide functionality.

```text
common
│
├── exception-filters
├── pipes
├── middleware
├── logger
└── health
```

---

# Config Folder

```text
config
│
├── database.config.ts
├── redis.config.ts
├── jwt.config.ts
├── minio.config.ts
├── socket.config.ts
└── app.config.ts
```

No hardcoded values allowed.

Everything must come from:

```env
.env
```

---

# CQRS Architecture

NestJS CQRS package must be used.

---

## Commands

Write Operations

Examples:

```text
CreateUserCommand

UpdateUserCommand

DeleteUserCommand

CreateIncidentCommand

ApproveChecklistCommand
```

---

## Command Handlers

```text
CreateUserHandler

ApproveChecklistHandler
```

---

## Queries

Read Operations

Examples:

```text
GetUsersQuery

GetUserByIdQuery

GetChecklistDetailsQuery

GetDashboardQuery
```

---

## Query Handlers

```text
GetUsersHandler

GetDashboardHandler
```

---

# Domain Events

Every important action emits an event.

Examples:

```text
UserCreatedEvent

ChecklistSubmittedEvent

ChecklistApprovedEvent

IncidentCreatedEvent

IncidentResolvedEvent
```

---

# Event Handlers

Examples:

```text
Create Notification

Create Audit Log

Update Activity Feed

Send Email

Update Metrics
```

---

# Notification Architecture

Notification module must be fully event driven.

---

## Flow

```text
Checklist Submitted

↓ Event

ChecklistSubmittedEvent

↓ Listener

NotificationService

↓ Socket

Frontend
```

---

# Redis Architecture

Redis will be used for:

```text
Caching

Socket Adapter

Queue Backend

Rate Limiting

Session Management
```

---

# BullMQ Architecture

BullMQ handles heavy background tasks.

---

## Queues

```text
notifications

emails

reports

audit

activity

scheduler
```

---

# Notification Queue

Jobs:

```text
Create Notification

Send Email

Push Notification

SMS
```

---

# Report Queue

Jobs:

```text
Generate PDF

Generate Excel

Export Large Data
```

---

# Scheduler Queue

Jobs:

```text
Generate Daily Checklists

Generate Weekly Checklists

Generate Monthly Checklists

Check Overdue Tasks
```

---

# Redis Cache Strategy

## Cache Keys

```text
dashboard

settings

permissions

roles
```

Example:

```text
dashboard:admin

settings:global
```

---

## TTL

```text
Dashboard -> 60 seconds

Settings -> 24 hours

Roles -> 24 hours
```

---

# Socket Architecture

Technology:

```text
Socket.IO
```

---

# Gateway Structure

```text
notifications.gateway.ts

incidents.gateway.ts

checklists.gateway.ts
```

---

# Notification Gateway

Events:

```text
notification.created

notification.read

notification.deleted
```

---

# Incident Gateway

Events:

```text
incident.created

incident.assigned

incident.updated

incident.resolved
```

---

# Checklist Gateway

Events:

```text
checklist.assigned

checklist.submitted

checklist.approved

checklist.rejected
```

---

# Socket Rooms

Each user joins:

```text
user:{userId}
```

Role rooms:

```text
role:admin

role:supervisor
```

Location rooms:

```text
location:{locationId}
```

---

# File Storage Architecture

Provider:

```text
MinIO
```

---

## Buckets

```text
attachments

checklists

incidents

signatures

reports

avatars
```

---

# File Upload Flow

```text
Frontend

↓

Backend

↓

MinIO

↓

Store Metadata In Database
```

Database stores:

```text
file_id

bucket

object_key

url
```

---

# Authentication Architecture

## JWT

Access Token:

```text
15 minutes
```

Refresh Token:

```text
30 days
```

---

# Session Storage

Table:

```text
user_sessions
```

Store:

```text
refresh_token_hash

ip_address

user_agent
```

---

# Authorization Architecture

RBAC

```text
Role

↓

Permissions

↓

Endpoints
```

---

# Guards

Examples:

```typescript
@Permissions("user.create")
```

```typescript
@Permissions("incident.manage")
```

---

# Validation

Library:

```text
class-validator
```

```text
class-transformer
```

Global Validation Pipe:

```typescript
whitelist: true

forbidNonWhitelisted: true

transform: true
```

---

# Exception Handling

Global Exception Filter

Response Format:

```json
{
  "success": false,
  "message": "Validation Error",
  "errors": []
}
```

---

# API Response Format

Success:

```json
{
  "success": true,
  "data": {},
  "meta": {}
}
```

Error:

```json
{
  "success": false,
  "message": "Something went wrong"
}
```

---

# Pagination Standard

Request:

```http
GET /users?page=1&pageSize=20
```

Response:

```json
{
  "data": [],
  "meta": {
    "page": 1,
    "pageSize": 20,
    "total": 100
  }
}
```

---

# Search Parameter Convention

Every endpoint must support:

```http
?page=
&pageSize=
&search=
&sort=
&order=
```

Example:

```http
/users?page=1&pageSize=20&search=Ali
```

---

# Logging

Library:

```text
Pino
```

---

# Log Levels

```text
trace

debug

info

warn

error

fatal
```

---

# Health Checks

NestJS Terminus

Endpoints:

```http
/health

/health/database

/health/redis

/health/minio
```

---

# API Documentation

Swagger

Endpoint:

```http
/api/docs
```

Every endpoint must have:

* Request Example
* Response Example
* Error Example

---

# Security

## Helmet

Enabled

---

## CORS

Whitelist Based

---

## Rate Limiting

Examples:

```text
Login → 5 requests/minute

Forgot Password → 3 requests/minute

API → 100 requests/minute
```

---

# Docker Services

```text
frontend

backend

postgres

redis

minio

nginx
```

---

# Future Extraction Ready

The following modules must be independently extractable into microservices:

```text
notifications

reports

incidents

checklists

auth
```

No cross-module direct database access allowed.

Communication must happen through:

* Application Services
* Domain Events
* Repositories

---

# Architecture Decision Summary

* Modular Monolith
* DDD
* Clean Architecture
* CQRS
* Event Driven Design
* PostgreSQL
* Redis
* BullMQ
* Socket.IO
* MinIO
* JWT Authentication
* RBAC Authorization
* Swagger
* Docker Compose
* Microservice Ready

# End of Backend Architecture Document
