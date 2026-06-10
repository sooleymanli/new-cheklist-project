# Facility Inspection & Incident Management Platform

## Project Overview

Facility Inspection & Incident Management Platform is a web-based enterprise application designed to digitize and manage administrative inspections, facility checks, incident reporting, approval workflows, employee performance tracking, and real-time monitoring across company buildings and locations.

The platform enables administrative employees to perform inspections through dynamic checklists, QR code scanning, photo uploads, digital signatures, approval workflows, incident reporting, and performance measurement.

The system is intended to replace manual Excel files, paper-based inspection forms, and email-based reporting processes.

---

# Business Goals

The platform must provide:

* Centralized facility inspection management
* Dynamic checklist builder
* QR-based inspection process
* Incident and issue reporting
* Employee performance tracking
* Approval workflows
* Real-time notifications
* Auditability and traceability
* Multi-language support
* Enterprise-grade reporting

---

# Main Modules

## 1. Authentication & Authorization

### Features

* Login
* Logout
* Forgot Password
* Reset Password
* Change Password

### Security Requirements

* JWT Authentication
* Refresh Token Support
* Password Complexity Rules
* Login Attempt Limiting
* Temporary Account Locking
* Session Management

---

## 2. Role & Permission Management

Admin can:

* Create Role
* Update Role
* Delete Role
* Activate/Deactivate Role

### Examples

* Super Admin
* Admin
* Supervisor
* Inspector
* Auditor

### Authorization Model

RBAC + Permission Based Access Control

Each role can have multiple permissions.

---

## 3. Building Management

Admin can:

* Create Building
* Edit Building
* Activate Building
* Deactivate Building
* Delete Building

### Fields

* Name
* Description

---

## 4. Floor Management

Admin can:

* Create Floor
* Edit Floor
* Activate Floor
* Deactivate Floor
* Delete Floor

### Fields

* Name
* Description
* Building

---

## 5. Location Management

Location can belong to:

### Option 1

Building → Location

Examples:

* Parking
* Generator Area
* Yard

### Option 2

Building → Floor → Location

Examples:

* Room 301
* Room 302
* Server Room
* Meeting Room

### Fields

* Name / Number
* Description
* Building
* Optional Floor

---

## 6. User Management

Admin can:

* Create User
* Edit User
* Delete User
* Activate User
* Deactivate User

### Fields

* First Name
* Last Name
* Position
* Email
* Mobile Number
* Password
* Role

### Assignment Rules

Users are NOT required to be assigned to:

* Building
* Floor
* Location

Users may receive only checklists.

### User Profile

Must display:

* Completed Checklists
* Delayed Checklists
* Rating Score
* Assigned Checklists
* Activity History

---

# Dynamic Checklist System

## Checklist Templates

Admin can create dynamic checklist templates.

### Fields

* Name
* Description
* Status
* Start Date
* End Date

---

## Checklist Builder

Supported field types:

* Text
* Number
* Checkbox
* Yes / No
* Select
* Multi Select
* Date
* File Upload

Each field supports:

* Required
* Optional
* Default Value
* Placeholder
* Help Text
* Photo Required
* File Required

---

## Checklist Scheduling

Supported frequencies:

* One Time
* Daily
* Weekly
* Monthly
* Quarterly

---

## Checklist Assignment

Checklist can be assigned to:

* Single User
* Multiple Users
* Role

Admin must be able to select executors.

---

## QR Only Checklist

Admin can enable:

### Visible Assignment

Checklist appears in user dashboard.

### QR Only Assignment

Checklist does NOT appear in user dashboard.

Checklist can only be opened after scanning the related QR code.

Purpose:

Ensure employee physically visits the location before completing the inspection.

---

# Checklist Workflow

## Statuses

* Draft
* Pending
* In Progress
* Submitted
* Approved
* Rejected
* Late
* Overdue

---

## Employee Workflow

1. Open Checklist
2. Fill Form
3. Upload Photos
4. Upload Files
5. Add Notes
6. Draw Signature
7. Submit

---

## Restrictions

Employee cannot submit inspections for past dates.

---

# Approval Workflow

Admin can configure approval processes.

---

## No Approval

Employee
→ Completed

---

## Single Level Approval

Employee
→ Supervisor
→ Approved

---

## Multi Level Approval

Employee
→ Supervisor
→ Manager
→ Approved

---

## Parallel Approval

Checklist can be sent to multiple approvers.

Options:

* All approvers must approve
* Any approver can approve

---

## Rejection

Rejection reason is mandatory.

---

# QR Code Management

QR Codes can be generated for:

* Building
* Floor
* Location
* Checklist

Admin can:

* Generate QR
* Download QR
* Print QR

---

## QR Workflow

Employee scans QR.

System automatically identifies location.

Checklist is opened automatically.

Employee does not manually select location.

---

## QR Audit

System stores:

* QR ID
* User
* Scan Time
* Location
* Device Information

---

# Incident Management Module

Employees can report issues independently from checklists.

Examples:

* Broken Table
* Broken Door
* Air Conditioner Failure
* Water Leakage
* Electrical Issue

---

## Incident Categories

Admin can manage categories.

Examples:

* Electricity
* Lighting
* HVAC
* Cleaning
* Furniture
* Door
* Window
* Security
* Other

---

## Incident Priorities

* Low
* Medium
* High
* Critical

---

## Incident Statuses

* Open
* In Progress
* Resolved
* Closed
* Rejected

---

## Incident Fields

* Title
* Category
* Priority
* Description
* Photos
* Files
* Location

---

## Incident Timeline

Every action must be tracked.

Example:

09:00 Issue Created

09:10 Assigned

09:20 In Progress

11:00 Resolved

11:15 Closed

---

## Automatic Critical Incident

Checklist answers can automatically create incidents.

Example:

Question:

Are lights working?

Answer:

NO

Result:

Create Critical Incident automatically.

---

# Notification System

Real-time notification system must be implemented using Socket technology.

Future notification providers:

* Email
* SMS
* WhatsApp
* Push Notification

---

## Employee Notifications

* New Checklist Assigned
* Checklist Due Soon
* Checklist Delayed
* Checklist Approved
* Checklist Rejected
* Incident Assigned

---

## Supervisor Notifications

* Approval Required
* Checklist Submitted
* Employee Delayed
* Critical Incident Created

---

## Admin Notifications

* Delayed Checklist
* Missed Checklist
* Critical Incident Created
* Long Open Incident
* Inactive Employee

---

## Notification Center

Must support:

* Read
* Unread
* Mark All Read
* Delete

---

# Dashboard

## General Statistics

* Active Buildings
* Active Floors
* Active Locations
* Active Users
* Active Checklists

---

## Checklist Statistics

* Completed Today
* Delayed Today
* Pending
* Waiting Approval
* Rejected

---

## Incident Statistics

* Open Incidents
* Resolved Incidents
* Critical Incidents

---

## KPI Widgets

### Facility Health Status

* Green
* Yellow
* Red

### Daily Completion Rate

Progress bar showing completed inspections.

### SLA Compliance

Percentage of inspections completed on time.

### Most Problematic Areas

Pie charts and statistics.

---

## Activity Feed

Example:

Ali Aliyev completed inspection for Room 402 10 minutes ago.

---

# Employee Rating System

Initial Score:

100

Scoring Rules:

Completed On Time:
+1

Delayed:
-3

Rejected:
-5

Missed:
-10

Critical Issue Reported:
+2

---

## Rating Levels

* A+
* A
* B
* C
* D

---

## Leaderboard

Display:

* Best Employees
* Most Active Employees
* Most Punctual Employees

---

# Reporting

## Filters

* Date Range
* User
* Role
* Building
* Floor
* Location
* Status

---

## Report Types

* Completed Checklists
* Delayed Checklists
* Missed Checklists
* Incident Reports
* Performance Reports
* Rating Reports

---

## Export Formats

* Excel
* PDF

Large exports should be processed asynchronously using queue jobs.

---

# Audit System

All actions must be logged.

Examples:

* User Created
* User Updated
* Checklist Modified
* Checklist Deleted
* Role Updated

Audit Log Fields:

* User
* Action
* Entity
* Timestamp

Audit logs must never be physically deleted.

---

# Global Settings Module

Admin can manage:

* Company Name
* Logo
* Default Language
* Timezone
* Notification Settings
* Rating Configuration
* File Upload Limits
* Allowed File Types

---

# Multi Language Support

Supported Languages:

* Azerbaijani
* English
* Russian

Localization Scope:

* UI Texts
* Validation Messages
* Backend Error Messages
* Notifications
* Audit Logs
* Emails

---

# Theme Support

The application must support:

* Light Mode
* Dark Mode

User preference must be persisted.

---

# Search, Filter & Pagination

Every list page must support:

* Search
* Filters
* Pagination
* Sorting

All state must be stored in URL query parameters.

Example:

/users?page=2&pageSize=20&status=active

/checklists?page=1&buildingId=3&status=pending

Benefits:

* Refresh Safe
* Shareable URLs
* Browser Navigation Support
* Deep Linking

---

# Technical Requirements

## Backend

Framework:

NestJS

Architecture:

* Modular Monolith
* Domain Driven Structure
* Repository Pattern
* Event Driven Architecture
* CQRS Ready
* Swagger Documentation
* Validation Pipes
* Global Exception Handling
* Rate Limiting

---

## Frontend

Framework:

React 19

Requirements:

* React Compiler
* Redux Toolkit
* RTK Query
* React Hook Form
* Ant Design Latest Version
* React Window (FixedSizeList)
* Zod Validation
* Lazy Loading
* Route Based Code Splitting
* Error Boundaries
* Suspense
* Feature Based Structure

---

## Database

PostgreSQL

Requirements:

* Foreign Keys
* Soft Delete
* JSONB Support
* Index Optimization

---

## Storage

MinIO

Store:

* Images
* Documents
* Reports
* Attachments

Database should store only metadata and object keys.

---

## Caching & Queue

Redis

BullMQ

Usage:

* Notifications
* Emails
* Scheduled Jobs
* Report Generation
* Checklist Scheduling

---

## Infrastructure

Docker Compose

Services:

* Frontend
* Backend
* PostgreSQL
* Redis
* MinIO
* Nginx

---

## Environment Variables

All configuration must be stored in .env files.

Examples:

* Database
* Redis
* JWT
* SMTP
* MinIO
* URLs

No hardcoded values allowed.

---

# Future Ready Requirements

The architecture should be designed to support:

* Multi-Tenant Deployment
* Email Notifications
* SMS Notifications
* Push Notifications
* Mobile Applications
* External Integrations

Without major architectural changes.
