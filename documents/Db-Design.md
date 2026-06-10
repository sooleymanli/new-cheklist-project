# Database Design

## Facility Inspection & Incident Management Platform

**Version:** 1.0

**Database:** PostgreSQL 16+

**Architecture Style:**

* Relational Core
* JSONB for Dynamic Forms
* Soft Delete
* Audit Ready
* Multi-Tenant Ready (Future)
* UUID Primary Keys

---

# Design Principles

## Primary Keys

All tables use:

```sql
uuid
```

---

## Soft Delete

All business tables contain:

```sql
deleted_at TIMESTAMP NULL
```

Physical delete is prohibited.

---

## Audit Fields

All business tables contain:

```sql
created_at
created_by

updated_at
updated_by

deleted_at
deleted_by
```

---

# ERD Overview

```text
Company
 ├── Buildings
 │
 ├── Floors
 │
 ├── Locations
 │
 ├── ChecklistTemplates
 │      ├── ChecklistTemplateFields
 │      ├── ChecklistAssignments
 │      └── ChecklistSchedules
 │
 ├── ChecklistInstances
 │      ├── ChecklistResponses
 │      ├── ChecklistApprovals
 │      └── Attachments
 │
 ├── Incidents
 │      ├── IncidentComments
 │      ├── IncidentAttachments
 │      └── IncidentTimeline
 │
 ├── Users
 │      ├── Roles
 │      ├── Permissions
 │      └── Notifications
 │
 ├── QR Codes
 │
 ├── Audit Logs
 │
 └── Activity Logs
```

---

# 1. companies

Future Multi-Tenant Ready

| Column   | Type    |
| -------- | ------- |
| id       | uuid    |
| name     | varchar |
| logo_url | varchar |
| status   | boolean |

---

# 2. roles

| Column      | Type    |
| ----------- | ------- |
| id          | uuid    |
| name        | varchar |
| description | text    |

---

# 3. permissions

Examples:

```text
user.create
user.edit
user.delete

checklist.create
checklist.approve

incident.manage
```

| Column      | Type    |
| ----------- | ------- |
| id          | uuid    |
| name        | varchar |
| description | text    |

---

# 4. role_permissions

Many-To-Many

| Column        | Type |
| ------------- | ---- |
| role_id       | uuid |
| permission_id | uuid |

### Unique Index

```sql
(role_id, permission_id)
```

---

# 5. users

| Column        | Type      |
| ------------- | --------- |
| id            | uuid      |
| role_id       | uuid      |
| first_name    | varchar   |
| last_name     | varchar   |
| position      | varchar   |
| email         | varchar   |
| mobile        | varchar   |
| password_hash | text      |
| status        | boolean   |
| last_login_at | timestamp |

### Indexes

```sql
email UNIQUE

role_id

status
```

---

# 6. buildings

| Column      | Type    |
| ----------- | ------- |
| id          | uuid    |
| name        | varchar |
| description | text    |
| is_active   | boolean |

### Index

```sql
name
```

---

# 7. floors

| Column      | Type    |
| ----------- | ------- |
| id          | uuid    |
| building_id | uuid    |
| name        | varchar |
| description | text    |

### Index

```sql
building_id
```

---

# 8. locations

Location can belong directly to a building or a floor.

| Column      | Type      |
| ----------- | --------- |
| id          | uuid      |
| building_id | uuid      |
| floor_id    | uuid NULL |
| name        | varchar   |
| description | text      |

### Examples

```text
Parking
Generator Area
Room 301
Room 302
```

### Indexes

```sql
building_id

floor_id

name
```

---

# 9. checklist_templates

| Column      | Type    |
| ----------- | ------- |
| id          | uuid    |
| name        | varchar |
| description | text    |
| version     | integer |
| status      | varchar |

### Status

```text
draft
active
inactive
```

---

# 10. checklist_template_fields

Dynamic Form Builder

| Column       | Type    |
| ------------ | ------- |
| id           | uuid    |
| template_id  | uuid    |
| order_no     | integer |
| field_key    | varchar |
| field_label  | varchar |
| field_type   | varchar |
| field_config | jsonb   |

### field_config JSONB Example

```json
{
  "required": true,
  "placeholder": "Enter temperature",
  "defaultValue": null,
  "min": 0,
  "max": 100,
  "options": ["Good", "Bad"],
  "photoRequired": true,
  "fileRequired": false
}
```

### GIN Index

```sql
field_config
```

---

# 11. checklist_template_locations

Many-To-Many

| Column      | Type |
| ----------- | ---- |
| template_id | uuid |
| location_id | uuid |

### Unique Index

```sql
(template_id, location_id)
```

---

# 12. checklist_schedules

| Column      | Type      |
| ----------- | --------- |
| id          | uuid      |
| template_id | uuid      |
| frequency   | varchar   |
| start_date  | timestamp |
| end_date    | timestamp |
| due_time    | time      |

### Frequency

```text
one_time
daily
weekly
monthly
quarterly
```

---

# 13. checklist_assignments

| Column      | Type |
| ----------- | ---- |
| id          | uuid |
| template_id | uuid |
| user_id     | uuid |

Supports:

* Single User
* Multiple Users

---

# 14. checklist_instances

Generated Checklist

| Column           | Type      |
| ---------------- | --------- |
| id               | uuid      |
| template_id      | uuid      |
| location_id      | uuid      |
| assigned_user_id | uuid      |
| schedule_id      | uuid      |
| status           | varchar   |
| due_at           | timestamp |

### Status

```text
draft
pending
in_progress
submitted
approved
rejected
late
overdue
```

### Indexes

```sql
assigned_user_id

status

due_at

location_id
```

---

# 15. checklist_responses

| Column                | Type  |
| --------------------- | ----- |
| id                    | uuid  |
| checklist_instance_id | uuid  |
| response_data         | jsonb |
| notes                 | text  |
| signature_file_id     | uuid  |

### response_data JSONB Example

```json
{
  "lights_working": true,
  "temperature": 23,
  "cleaning_status": "good",
  "photo_1": "file-id"
}
```

### GIN Index

```sql
response_data
```

---

# 16. checklist_approvals

| Column                | Type    |
| --------------------- | ------- |
| id                    | uuid    |
| checklist_instance_id | uuid    |
| approver_user_id      | uuid    |
| step_no               | integer |
| status                | varchar |
| comment               | text    |

---

# 17. qr_codes

| Column    | Type    |
| --------- | ------- |
| id        | uuid    |
| qr_type   | varchar |
| entity_id | uuid    |
| qr_token  | varchar |

### Types

```text
building
floor
location
checklist
```

### Unique Index

```sql
qr_token
```

---

# 18. qr_scan_logs

| Column      | Type      |
| ----------- | --------- |
| id          | uuid      |
| qr_id       | uuid      |
| user_id     | uuid      |
| scanned_at  | timestamp |
| device_info | text      |

### Indexes

```sql
user_id

scanned_at
```

---

# 19. incident_categories

Examples:

```text
Electricity
Furniture
Cleaning
HVAC
Security
```

| Column      | Type    |
| ----------- | ------- |
| id          | uuid    |
| name        | varchar |
| description | text    |

---

# 20. incidents

| Column           | Type      |
| ---------------- | --------- |
| id               | uuid      |
| location_id      | uuid      |
| category_id      | uuid      |
| reporter_user_id | uuid      |
| assigned_user_id | uuid NULL |
| priority         | varchar   |
| status           | varchar   |
| title            | varchar   |
| description      | text      |

### Priorities

```text
low
medium
high
critical
```

### Statuses

```text
open
in_progress
resolved
closed
rejected
```

### Indexes

```sql
priority

status

location_id

assigned_user_id
```

---

# 21. incident_comments

| Column      | Type |
| ----------- | ---- |
| id          | uuid |
| incident_id | uuid |
| user_id     | uuid |
| comment     | text |

---

# 22. incident_timeline

| Column      | Type    |
| ----------- | ------- |
| id          | uuid    |
| incident_id | uuid    |
| action_type | varchar |
| payload     | jsonb   |

### Actions

```text
created
assigned
status_changed
resolved
closed
```

---

# 23. files

Central File Manager

| Column        | Type    |
| ------------- | ------- |
| id            | uuid    |
| bucket_name   | varchar |
| object_key    | varchar |
| original_name | varchar |
| mime_type     | varchar |
| file_size     | bigint  |

### Unique Index

```sql
object_key
```

---

# 24. notifications

| Column  | Type    |
| ------- | ------- |
| id      | uuid    |
| user_id | uuid    |
| type    | varchar |
| title   | varchar |
| message | text    |
| is_read | boolean |

### Indexes

```sql
user_id

is_read
```

---

# 25. settings

Global Settings

| Column | Type    |
| ------ | ------- |
| key    | varchar |
| value  | jsonb   |

### Example

```json
{
  "defaultLanguage": "az",
  "theme": "light"
}
```

---

# 26. audit_logs

Immutable Table

| Column      | Type    |
| ----------- | ------- |
| id          | uuid    |
| user_id     | uuid    |
| entity_type | varchar |
| entity_id   | uuid    |
| action      | varchar |
| old_data    | jsonb   |
| new_data    | jsonb   |

### Indexes

```sql
entity_type

entity_id

created_at
```

### Recommendation

Partition by month.

---

# 27. activity_logs

Dashboard Feed Source

| Column   | Type    |
| -------- | ------- |
| id       | uuid    |
| user_id  | uuid    |
| action   | varchar |
| metadata | jsonb   |

---

# 28. user_sessions

| Column             | Type      |
| ------------------ | --------- |
| id                 | uuid      |
| user_id            | uuid      |
| refresh_token_hash | text      |
| ip_address         | varchar   |
| user_agent         | text      |
| expires_at         | timestamp |

---

# PostgreSQL Index Strategy

## BTree

Use for:

```sql
status

created_at

updated_at

foreign_keys
```

---

## GIN

Use for:

```sql
response_data

field_config

payload
```

---

## Trigram Search

Enable Extension:

```sql
CREATE EXTENSION pg_trgm;
```

Use for:

```text
Building Names

Location Names

Incident Titles

Checklist Names
```

---

# Recommended PostgreSQL Extensions

```sql
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE EXTENSION IF NOT EXISTS "pg_trgm";
```

---

# Partitioned Tables

Recommended monthly partitioning:

* audit_logs
* activity_logs
* notifications
* qr_scan_logs

---

# Data Storage Strategy

## Relational Tables

```text
Users
Roles
Permissions
Buildings
Floors
Locations
Assignments
Incidents
```

---

## JSONB Based Tables

```text
Checklist Fields

Checklist Responses

Settings

Audit Payloads

Incident Timeline Payloads
```

---

# Estimated Database Size

### Initial Version

```text
Core Tables: 28

Junction Tables: 4+

Audit Tables: 2

System Tables: 3

Total: ~35-40 Tables
```

### Scalability Target

* 10,000+ Users
* 100,000+ Checklist Instances
* 1,000,000+ Audit Records
* 1,000,000+ Notifications

without database redesign.
