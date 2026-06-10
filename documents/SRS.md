# Software Requirements Specification (SRS)

# Facility Inspection & Incident Management Platform

Version: 1.0

Status: Draft

Document Type: Software Requirements Specification (SRS)

---

# 1. Introduction

## 1.1 Purpose

This document defines the functional and non-functional requirements for the Facility Inspection & Incident Management Platform.

The purpose of the system is to digitize and automate:

* Facility inspections
* Administrative checklists
* QR-based inspections
* Incident reporting
* Approval workflows
* Employee performance tracking
* Reporting and analytics
* Real-time notifications

---

## 1.2 Scope

The system will be used by:

* Administrative Employees
* Supervisors
* Managers
* Auditors
* System Administrators

The platform will support:

* Multi-building structures
* Multi-floor structures
* Location-based inspections
* Dynamic checklist generation
* QR-based execution
* Incident management
* Approval workflows
* Performance measurement
* Enterprise reporting

---

## 1.3 Definitions

| Term          | Description                       |
| ------------- | --------------------------------- |
| Building      | Physical building                 |
| Floor         | Building floor                    |
| Location      | Room, area or inspection point    |
| Checklist     | Inspection form                   |
| Incident      | Problem or issue report           |
| Approval      | Validation process                |
| SLA           | Service Level Agreement           |
| QR Inspection | Inspection initiated by QR code   |
| Audit Log     | Immutable system activity records |

---

# 2. System Overview

The platform consists of the following modules:

1. Authentication
2. Authorization
3. User Management
4. Building Management
5. Floor Management
6. Location Management
7. Checklist Management
8. Dynamic Form Builder
9. Checklist Execution
10. Approval Workflow
11. Incident Management
12. Notification Center
13. Dashboard
14. Reporting
15. Audit Logging
16. Settings
17. QR Management

---

# 3. Functional Requirements

# FR-001 Authentication Module

## Description

The system shall authenticate users securely.

### Requirements

* Login
* Logout
* Forgot Password
* Reset Password
* Change Password

### Validation

Email and password are mandatory.

---

# FR-002 Authorization Module

## Description

System shall provide RBAC authorization.

### Requirements

* Create Role
* Edit Role
* Delete Role
* Assign Permissions

### Permissions

Example:

* User.Create
* User.Edit
* User.Delete
* Checklist.Approve
* Incident.Manage

---

# FR-003 User Management

## Description

Admin shall manage users.

### Fields

Required:

* First Name
* Last Name
* Email
* Mobile Number
* Role

Optional:

* Position

### Operations

* Create
* Edit
* Activate
* Deactivate
* Delete

### Business Rules

Users may exist without:

* Building Assignment
* Floor Assignment
* Location Assignment

Users can receive only checklist assignments.

---

# FR-004 Building Management

## Operations

* Create
* Edit
* Activate
* Deactivate
* Delete

## Fields

* Name
* Description

---

# FR-005 Floor Management

## Operations

* Create
* Edit
* Activate
* Deactivate
* Delete

## Fields

* Building
* Name
* Description

---

# FR-006 Location Management

## Operations

* Create
* Edit
* Activate
* Deactivate
* Delete

## Relationships

Location may belong to:

### Type A

Building

### Type B

Building + Floor

## Fields

* Name
* Description
* Building
* Optional Floor

---

# FR-007 Checklist Template Management

## Description

Admin can create reusable checklist templates.

## Operations

* Create
* Edit
* Activate
* Deactivate
* Delete

## Fields

* Name
* Description
* Status

---

# FR-008 Dynamic Form Builder

Admin shall build checklist fields dynamically.

Supported Types:

* Text
* Number
* Checkbox
* YesNo
* Select
* MultiSelect
* Date
* FileUpload

Each field shall support:

* Required
* Optional
* Default Value
* Placeholder
* Help Text
* Photo Required
* File Required

---

# FR-009 Checklist Scheduling

Supported Frequencies:

* OneTime
* Daily
* Weekly
* Monthly
* Quarterly

Admin shall configure:

* Start Date
* End Date
* Due Time

---

# FR-010 Checklist Assignment

Checklist shall support assignment to:

* User
* Multiple Users
* Role

---

# FR-011 QR Only Checklist

Admin shall choose:

### Visible Assignment

Checklist visible in dashboard.

### QR Assignment

Checklist hidden from dashboard.

Accessible only after QR scanning.

---

# FR-012 Checklist Execution

User shall:

* Open Checklist
* Fill Fields
* Upload Photos
* Upload Files
* Add Notes
* Draw Signature
* Submit

---

# FR-013 Checklist Statuses

System shall support:

* Draft
* Pending
* In Progress
* Submitted
* Approved
* Rejected
* Late
* Overdue

---

# FR-014 Checklist Approval Workflow

Supported Modes:

### No Approval

Employee → Completed

### Single Approval

Employee → Supervisor → Approved

### Multi Approval

Employee → Supervisor → Manager → Approved

### Parallel Approval

Employee → Multiple Approvers

Modes:

* Any Approver
* All Approvers

---

# FR-015 Checklist Rejection

Approver shall provide rejection reason.

Reason is mandatory.

---

# FR-016 Digital Signature

User shall sign inspection.

Signature shall be immutable.

Stored information:

* Signature Image
* User
* Timestamp

---

# FR-017 QR Management

Admin shall:

* Generate QR
* Download QR
* Print QR

QR types:

* Building
* Floor
* Location
* Checklist

---

# FR-018 QR Audit

System shall store:

* User
* QR Code
* Scan Time
* Device
* Location

---

# FR-019 Incident Management

Users shall report incidents.

---

## Incident Fields

* Title
* Description
* Category
* Priority
* Location
* Photos
* Attachments

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

# FR-020 Incident Categories

Admin shall manage categories.

Examples:

* Electricity
* Furniture
* HVAC
* Cleaning
* Security

---

# FR-021 Automatic Incident Creation

System shall create incidents automatically when checklist answers match configured conditions.

Example:

Question:

Lights Working?

Answer:

No

Result:

Create Critical Incident

---

# FR-022 Incident Timeline

System shall track:

* Created
* Assigned
* Updated
* Resolved
* Closed

---

# FR-023 Notification System

System shall support real-time notifications.

Events:

* Assignment
* Approval
* Rejection
* Delay
* Incident Creation
* Incident Assignment

---

# FR-024 Notification Center

Features:

* Read
* Unread
* Mark All Read
* Delete

---

# FR-025 Dashboard

Dashboard shall display:

* Buildings
* Floors
* Locations
* Users
* Checklists
* Incidents

KPIs:

* Completion Rate
* Delays
* SLA Compliance
* Top Employees

---

# FR-026 Reporting

Reports:

* Checklist Reports
* Incident Reports
* Employee Reports
* Performance Reports

Export:

* PDF
* Excel

---

# FR-027 Employee Rating

Score starts from:

100

Rules:

Completed:
+1

Delayed:
-3

Rejected:
-5

Missed:
-10

Critical Finding:
+2

---

# FR-028 Global Settings

Admin shall manage:

* Company Name
* Logo
* Timezone
* Default Language
* Upload Limits

---

# FR-029 Audit Logging

System shall log:

* Create
* Update
* Delete
* Approve
* Reject

Audit records shall never be physically deleted.

---

# FR-030 Search & Filtering

Every module shall support:

* Search
* Filter
* Pagination
* Sorting

All filters shall be stored in URL query parameters.

Example:

```text
/users?page=1&pageSize=20

/checklists?page=2&status=pending
```

---

# 4. Non Functional Requirements

# NFR-001 Performance

API response time:

Target:

< 300ms

Maximum:

< 1000ms

---

# NFR-002 Scalability

System shall support:

* Multiple Buildings
* Thousands of Checklists
* Thousands of Incidents

without architectural redesign.

---

# NFR-003 Availability

Target Availability:

99.9%

---

# NFR-004 Security

Requirements:

* JWT Authentication
* Refresh Tokens
* HTTPS
* Password Hashing
* RBAC
* Rate Limiting

---

# NFR-005 Localization

Supported Languages:

* Azerbaijani
* English
* Russian

Includes:

* UI
* Validation
* Errors
* Notifications

---

# NFR-006 Responsive Design

Supported Devices:

* Desktop
* Tablet
* Mobile

---

# NFR-007 Theme Support

Supported Themes:

* Light
* Dark

---

# NFR-008 Auditability

All critical actions shall be traceable.

---

# NFR-009 Reliability

Soft Delete shall be used.

Critical business data shall never be physically deleted.

---

# NFR-010 Observability

System shall provide:

* Structured Logging
* Error Tracking
* Health Checks
* Monitoring

---

# 5. External Integrations

Current:

* MinIO
* PostgreSQL
* Redis

Future:

* Email Provider
* SMS Provider
* WhatsApp Provider
* Push Notifications

---

# 6. Assumptions

* Single Company Deployment initially.
* Multi-Tenant ready architecture.
* Mobile application may be added later.
* Notification providers may be added later.

---

# 7. Constraints

Backend:

* NestJS

Frontend:

* React 19

Database:

* PostgreSQL

Storage:

* MinIO

Cache:

* Redis

Queue:

* BullMQ

Containerization:

* Docker Compose

---

# End of SRS v1.0
