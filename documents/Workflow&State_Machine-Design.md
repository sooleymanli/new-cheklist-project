# Workflow & State Machine Design

# Facility Inspection & Incident Management Platform

Version: 1.0

Purpose:

This document defines all lifecycle states and transitions for core business entities to ensure consistency across backend, frontend, and real-time systems.

---

# 1. Checklist State Machine

## Overview

Checklist lifecycle defines how inspection tasks move from creation to final approval.

---

## States

```text id="c1"
DRAFT
SCHEDULED
PENDING
IN_PROGRESS
SUBMITTED
APPROVED
REJECTED
OVERDUE
```

---

## State Flow

```text id="c2"
DRAFT
  ↓
SCHEDULED
  ↓
PENDING
  ↓
IN_PROGRESS
  ↓
SUBMITTED
  ↓
APPROVED
```

Alternative path:

```text id="c3"
SUBMITTED
  ↓
REJECTED
  ↓
IN_PROGRESS
```

System path:

```text id="c4"
PENDING → OVERDUE
```

---

## Transition Rules

| From        | To          | Condition                  |
| ----------- | ----------- | -------------------------- |
| DRAFT       | SCHEDULED   | Admin assigns schedule     |
| SCHEDULED   | PENDING     | Start time reached         |
| PENDING     | IN_PROGRESS | QR scan or manual start    |
| IN_PROGRESS | SUBMITTED   | User submits form          |
| SUBMITTED   | APPROVED    | Supervisor/Admin approval  |
| SUBMITTED   | REJECTED    | Supervisor/Admin rejection |
| PENDING     | OVERDUE     | Due time exceeded          |

---

## Business Rules

* QR scan automatically triggers IN_PROGRESS
* Past date execution is not allowed
* Rejected checklist returns to IN_PROGRESS with comments
* Approved checklist becomes immutable

---

# 2. Incident State Machine

## Overview

Incident lifecycle tracks problems reported in facilities.

---

## States

```text id="i1"
OPEN
ASSIGNED
IN_PROGRESS
RESOLVED
CLOSED
REJECTED
```

---

## State Flow

```text id="i2"
OPEN
  ↓
ASSIGNED
  ↓
IN_PROGRESS
  ↓
RESOLVED
  ↓
CLOSED
```

Alternative flows:

```text id="i3"
OPEN → REJECTED
```

```text id="i4"
RESOLVED → REOPENED → IN_PROGRESS
```

---

## Transition Rules

| From        | To          | Condition                |
| ----------- | ----------- | ------------------------ |
| OPEN        | ASSIGNED    | Admin/Supervisor assigns |
| ASSIGNED    | IN_PROGRESS | Worker starts fixing     |
| IN_PROGRESS | RESOLVED    | Issue fixed              |
| RESOLVED    | CLOSED      | Supervisor approval      |
| OPEN        | REJECTED    | Invalid report           |
| RESOLVED    | REOPENED    | Issue persists           |

---

## Priority Impact

| Priority | Behavior                       |
| -------- | ------------------------------ |
| LOW      | Normal flow                    |
| MEDIUM   | Standard SLA                   |
| HIGH     | Fast escalation                |
| CRITICAL | Immediate notification + alert |

---

# 3. Approval State Machine

## Overview

Used for checklist approval workflows.

---

## States

```text id="a1"
PENDING
APPROVED
REJECTED
```

---

## Flow

```text id="a2"
PENDING
  ↓
APPROVED
```

or

```text id="a3"
PENDING
  ↓
REJECTED
  ↓
PENDING
```

---

## Rules

* Multiple approvers supported (multi-step approval)
* Each step stored separately
* Final approval only when all steps approved

---

# 4. User Assignment State Flow

## Overview

Defines assignment lifecycle for checklists and incidents.

---

## States

```text id="u1"
UNASSIGNED
ASSIGNED
ACCEPTED
DECLINED
REASSIGNED
```

---

## Flow

```text id="u2"
UNASSIGNED
  ↓
ASSIGNED
  ↓
ACCEPTED
```

Alternative:

```text id="u3"
ASSIGNED
  ↓
DECLINED
  ↓
REASSIGNED
```

---

## Rules

* Employee must accept assignment before execution
* Declined tasks return to pool
* Reassignment triggers notification

---

# 5. QR Execution Flow State Machine

## Overview

Defines QR-based checklist execution lifecycle.

---

## States

```text id="q1"
NOT_SCANNED
SCANNED
VALIDATED
IN_PROGRESS
SUBMITTED
```

---

## Flow

```text id="q2"
NOT_SCANNED
  ↓
SCANNED
  ↓
VALIDATED
  ↓
IN_PROGRESS
  ↓
SUBMITTED
```

---

## Rules

* QR scan required to start checklist
* Invalid QR → blocked state
* Location mismatch → rejection

---

# 6. Notification State Machine

## States

```text id="n1"
PENDING
SENT
DELIVERED
READ
FAILED
```

---

## Flow

```text id="n2"
PENDING
  ↓
SENT
  ↓
DELIVERED
  ↓
READ
```

---

## Rules

* Socket delivery = SENT
* DB insert = PENDING
* User open = READ
* Retry mechanism for FAILED

---

# 7. File Upload State Machine

## States

```text id="f1"
INITIATED
UPLOADING
UPLOADED
FAILED
DELETED
```

---

## Flow

```text id="f2"
INITIATED
  ↓
UPLOADING
  ↓
UPLOADED
```

---

## Rules

* MinIO upload required
* DB metadata stored after success
* Failed uploads retried via queue

---

# 8. General Transition Engine Rules

## Core Principles

* No invalid state transitions allowed
* All transitions must be validated in backend
* State changes must emit domain events
* State changes must be logged in audit table

---

## Transition Format

```text id="t1"
ENTITY: Checklist
FROM: IN_PROGRESS
TO: SUBMITTED
TRIGGER: user.submit()
```

---

## Enforcement Layer

* Backend (Primary enforcement)
* Frontend (UX restriction only)
* Database (final integrity via constraints where possible)

---

# 9. Event Mapping (State → Event)

| State Change            | Event               |
| ----------------------- | ------------------- |
| IN_PROGRESS → SUBMITTED | checklist.submitted |
| SUBMITTED → APPROVED    | checklist.approved  |
| OPEN → ASSIGNED         | incident.assigned   |
| RESOLVED → CLOSED       | incident.closed     |

---

# 10. Business Constraints

* No backdating allowed
* Approved data is immutable
* Deleted entities remain in audit logs
* Every state change must create audit record
* Every critical transition triggers notification

---

# 11. Summary

This state machine design ensures:

* Predictable workflows
* Strong consistency
* Auditability
* Real-time updates
* Scalable business logic

# End of Workflow & State Machine Design
