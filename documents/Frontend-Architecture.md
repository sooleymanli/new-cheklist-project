# Frontend Architecture

# Facility Inspection & Incident Management Platform

Version: 1.0

Framework: React 19

Language: TypeScript

Architecture: Feature Based Modular Architecture

---

# Technology Stack

## Core

* React 19
* TypeScript
* React Compiler
* Vite

---

## UI

* Ant Design (Latest)
* Ant Design Pro Components
* React Window
* React Signature Canvas

---

## State Management

* Redux Toolkit
* RTK Query

---

## Forms

* React Hook Form
* Zod

---

## Routing

* React Router v7

---

## Internationalization

* i18next
* react-i18next

Languages:

* Azerbaijani
* English
* Russian

---

## Realtime

* Socket.IO Client

---

## Utilities

* Dayjs
* Lodash
* Query String
* Class Variance Authority

---

# Architecture Principles

## Feature Based Architecture

Code must be organized by business modules.

Bad:

```text
components/
pages/
services/
```

Good:

```text
modules/

users/
checklists/
incidents/
buildings/
```

---

# Project Structure

```text
src
│
├── app
│
├── modules
│
├── shared
│
├── layouts
│
├── routes
│
├── store
│
├── providers
│
├── hooks
│
├── assets
│
├── locales
│
├── types
│
└── main.tsx
```

---

# App Folder

```text
app
│
├── App.tsx
├── AppProviders.tsx
├── ErrorBoundary.tsx
└── AppRouter.tsx
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
├── checklist-instances
├── approvals
├── incidents
├── notifications
├── qr
├── reports
├── dashboard
├── settings
└── profile
```

---

# Module Structure

Example:

```text
users
│
├── api
├── components
├── forms
├── hooks
├── pages
├── routes
├── store
├── types
├── validations
└── utils
```

---

# API Layer

Every module owns its API.

Example:

```text
users
│
└── api
    ├── users.api.ts
    └── users.types.ts
```

---

# RTK Query Architecture

Single API Instance

```text
store/api
```

```text
api.ts
```

Inject endpoints per module.

Example:

```typescript
usersApi.injectEndpoints(...)
```

Never create multiple API roots.

---

# Redux Store Structure

```text
store
│
├── api
│
├── auth
│
├── ui
│
├── notifications
│
└── index.ts
```

---

# Global Store Rules

Redux only for:

* Auth
* Notifications
* Theme
* Language
* Global UI State

Do NOT store:

* Forms
* Page Filters
* Search State

---

# Search Params Driven Architecture

All filtering must be URL based.

Example:

```http
/users?page=1&pageSize=20

/users?page=2&status=active

/incidents?page=1&priority=critical
```

---

# Benefits

* Refresh Safe
* Bookmarkable
* Shareable URLs
* Browser Back Support

---

# Search Param Rules

Never use:

```typescript
useState()
```

for:

* page
* pageSize
* search
* sort
* filters

Always use:

```typescript
useSearchParams()
```

---

# Layout Architecture

## Public Layout

```text
/login

/forgot-password
```

---

## Admin Layout

```text
/dashboard

/users

/buildings

/incidents
```

---

## Employee Layout

```text
/my-checklists

/my-incidents

/profile
```

---

# Route Structure

```text
/
├── login
│
├── dashboard
│
├── users
│
├── buildings
│
├── floors
│
├── locations
│
├── checklist-templates
│
├── checklist-instances
│
├── incidents
│
├── reports
│
└── settings
```

---

# RBAC UI Architecture

Routes must support permission checks.

Example:

```typescript
<UserPermissionGuard
 permission="user.create"
/>
```

---

# Protected Routes

Example:

```typescript
permission:

user.view
user.create
incident.manage
```

---

# Forms Architecture

Library:

```text
React Hook Form
```

Validation:

```text
Zod
```

---

# Form Structure

```text
forms
│
├── CreateUserForm.tsx
├── UpdateUserForm.tsx
└── schemas.ts
```

---

# Validation Rules

Validation must exist:

Frontend

AND

Backend

Never trust frontend only.

---

# Dynamic Checklist Builder

Module:

```text
checklist-templates
```

---

# Supported Field Types

```text
Text

Number

Checkbox

Select

Multi Select

Date

File Upload
```

---

# Checklist Rendering Engine

Dynamic renderer:

```typescript
<FieldRenderer />
```

Example:

```typescript
switch(field.type)
```

Render appropriate component.

---

# File Upload Architecture

Provider:

```text
MinIO
```

Flow:

```text
Frontend

↓

Backend

↓

MinIO

↓

Return File Metadata
```

---

# Upload Components

```text
ImageUpload

DocumentUpload

SignatureUpload
```

---

# Signature Architecture

Library:

```text
react-signature-canvas
```

Used in:

```text
Checklist Submission
```

---

# Notification Architecture

Socket.IO Client

---

# Socket Connection

Created once.

```text
providers/socket
```

Example:

```typescript
SocketProvider
```

---

# Notification Flow

```text
Backend Event

↓

Socket

↓

Notification Store

↓

Notification Bell
```

---

# Notification Components

```text
NotificationBell

NotificationDrawer

NotificationList
```

---

# Realtime Events

```text
notification.created

incident.created

incident.updated

checklist.assigned

checklist.approved

checklist.rejected
```

---

# Dashboard Architecture

Widgets must be independent.

```text
widgets
│
├── ChecklistStats
├── IncidentStats
├── EmployeeRatings
├── ActivityFeed
└── BuildingHealth
```

---

# Data Fetching Rules

Each widget loads independently.

Never create giant dashboard requests.

Bad:

```http
/dashboard
```

Good:

```http
/dashboard/checklist-stats

/dashboard/incident-stats

/dashboard/activity-feed
```

---

# Virtualization Strategy

Library:

```text
React Window
```

Use:

```typescript
FixedSizeList
```

For:

* Notifications
* Audit Logs
* Activity Feed
* Large Tables

---

# Table Architecture

Reusable table wrapper.

```text
shared/components/DataTable
```

Features:

* Pagination
* Sorting
* Filters
* Search
* URL Sync

---

# Modal Architecture

Reusable:

```text
CreateModal

UpdateModal

DeleteModal

ConfirmationModal
```

---

# Theme Architecture

Supported:

* Light
* Dark

---

# Theme Storage

```text
localStorage
```

Key:

```text
theme
```

---

# Internationalization Architecture

Folder:

```text
locales
│
├── az
├── en
└── ru
```

---

# Translation Files

```text
common.json

users.json

checklists.json

incidents.json
```

---

# Language Storage

```text
localStorage
```

Key:

```text
language
```

---

# Error Handling

Global Error Boundary

```text
AppErrorBoundary
```

---

# API Error Handling

Single interceptor.

Responsibilities:

* Toast Messages
* Session Expired Handling
* Validation Errors

---

# Loading Strategy

Use:

```text
Suspense
```

and

```text
React Lazy
```

---

# Code Splitting

Every module lazy loaded.

Example:

```typescript
lazy(() =>
 import("./UsersPage")
)
```

---

# Performance Rules

React Compiler enabled.

Avoid:

```typescript
useMemo
useCallback
```

unless profiling proves necessity.

---

# Accessibility

Requirements:

* Keyboard Navigation
* Screen Reader Labels
* Focus Management
* Color Contrast Compliance

---

# Testing Strategy

## Unit Tests

Library:

```text
Vitest
```

---

## Component Tests

Library:

```text
React Testing Library
```

---

## E2E Tests

Library:

```text
Playwright
```

---

# Naming Conventions

Components:

```text
PascalCase
```

Example:

```text
UserTable.tsx
```

---

Hooks:

```text
camelCase
```

Example:

```text
useUsers.ts
```

---

Types:

```text
PascalCase
```

Example:

```text
UserDto
```

---

Files:

```text
kebab-case
```

Example:

```text
create-user-form.tsx
```

---

# Security

Never store:

* JWT Payload Data
* Sensitive User Information

in localStorage.

Store only:

* Access Token
* Refresh Token Strategy Metadata (if required)

Prefer HttpOnly Cookie architecture when available.

---

# Frontend Quality Rules

Mandatory:

* TypeScript Strict Mode
* ESLint
* Prettier
* Husky
* lint-staged

---

# Architecture Summary

* React 19
* React Compiler
* Vite
* Feature Based Structure
* RTK Query
* Redux Toolkit
* React Hook Form
* Zod
* Ant Design
* Search Params Driven UI
* Socket.IO
* i18n
* Dark Mode
* Virtualized Lists
* Lazy Loading
* Enterprise Scale Ready

# End of Frontend Architecture
