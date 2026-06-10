# Notification Matrix

# Facility Inspection & Incident Management Platform

Version: 1.0

Architecture:

* Event Driven Notifications
* Socket.IO Real-time Delivery
* Redis Queue Support
* Future Email Integration Ready

---

# Notification System Overview

Notification sistemi bütün platformada baş verən hadisələri real-time şəkildə istifadəçilərə çatdırır.

## Notification Channels

* Web (Socket.IO)
* In-App Notifications
* Email (Future)
* Push Notification (Future Mobile App)

---

# Notification Types

## 1. Checklist Notifications

| Event               | Description                        |
| ------------------- | ---------------------------------- |
| checklist.assigned  | İşçiyə yeni checklist təyin edilib |
| checklist.reminder  | Checklist vaxtı yaxınlaşır         |
| checklist.overdue   | Checklist gecikib                  |
| checklist.submitted | Checklist göndərilib               |
| checklist.approved  | Checklist təsdiqlənib              |
| checklist.rejected  | Checklist rədd edilib              |

---

## 2. Incident Notifications

| Event             | Description                 |
| ----------------- | --------------------------- |
| incident.created  | Yeni problem yaradılıb      |
| incident.assigned | Problem işçiyə təyin edilib |
| incident.updated  | Problem yenilənib           |
| incident.critical | Kritik problem aşkar edilib |
| incident.resolved | Problem həll edilib         |
| incident.closed   | Problem bağlanıb            |

---

## 3. User & System Notifications

| Event              | Description                    |
| ------------------ | ------------------------------ |
| user.created       | Yeni istifadəçi yaradılıb      |
| user.assigned      | İstifadəçi sahəyə təyin edilib |
| user.login         | İstifadəçi login olub          |
| user.inactive      | Uzun müddət login olmayıb      |
| system.maintenance | Sistem xəbərdarlığı            |

---

## 4. QR & Access Notifications

| Event               | Description                   |
| ------------------- | ----------------------------- |
| qr.scanned          | QR scan edilib                |
| location.entered    | İstifadəçi obyektə daxil olub |
| unauthorized.access | Yanlış/ icazəsiz giriş cəhdi  |

---

## 5. Approval Notifications

| Event             | Description        |
| ----------------- | ------------------ |
| approval.pending  | Təsdiq gözləyir    |
| approval.approved | Təsdiq edildi      |
| approval.rejected | Təsdiq rədd edildi |

---

## 6. Incident Management (Critical Alerts)

| Event                      | Priority |
| -------------------------- | -------- |
| incident.critical          | HIGH     |
| incident.fire_risk         | CRITICAL |
| incident.security_breach   | CRITICAL |
| incident.equipment_failure | HIGH     |

---

# Notification Recipients Matrix

| Event               | Employee | Supervisor | Admin | Auditor |
| ------------------- | -------- | ---------- | ----- | ------- |
| checklist.assigned  | ✅        | ❌          | ❌     | ❌       |
| checklist.submitted | ❌        | ✅          | ✅     | ❌       |
| checklist.approved  | ❌        | ❌          | ✅     | ❌       |
| incident.created    | ❌        | ✅          | ✅     | ❌       |
| incident.critical   | ❌        | ✅          | ✅     | ❌       |
| qr.scanned          | ❌        | ❌          | ✅     | ❌       |

---

# Delivery Channels

## Real-time (Mandatory)

* Socket.IO

Used for:

* Notifications bell
* Live dashboard updates
* Incident alerts

---

## Database Storage

All notifications must be persisted:

```text id="db1"
notifications table
```

Fields:

* id
* user_id
* type
* title
* message
* is_read
* created_at

---

## Email (Future Extension)

Planned integration:

* SendGrid
* AWS SES

Trigger rules:

* Critical incidents
* Overdue checklists
* Security alerts

---

# Notification Priority Levels

```text id="priority"
low
medium
high
critical
```

---

# Notification Rules Engine

## Rule Format

```text id="rule1"
IF event = checklist.overdue
AND user.role = employee
THEN notify admin + supervisor
```

---

## Example Rules

### Checklist Reminder

```text id="rule2"
IF checklist.due_time - now <= 30min
THEN send reminder to assigned user
```

---

### Critical Incident

```text id="rule3"
IF incident.priority = critical
THEN notify admin + supervisor + security role immediately
```

---

### Realtime Assignment

```text id="rule4"
IF checklist.assigned
THEN notify employee instantly
```

---

# Socket Events

## Client → Server

```text id="sock1"
notification.subscribe
notification.mark_as_read
```

---

## Server → Client

```text id="sock2"
notification.created
notification.updated
incident.alert
checklist.reminder
```

---

# Socket Rooms Strategy

```text id="rooms"
user:{userId}
role:{role}
location:{locationId}
```

---

# Notification Flow Architecture

```text id="flow"
Event Trigger (Backend)
        ↓
Domain Event
        ↓
Event Handler
        ↓
Queue (BullMQ)
        ↓
Notification Service
        ↓
Save to DB
        ↓
Emit via Socket.IO
        ↓
Frontend UI Update
```

---

# Queue Integration (BullMQ)

## Queue Name

```text id="queue"
notifications
```

## Jobs

* create_notification
* send_socket_event
* send_email (future)

---

# Retry Strategy

* 3 retries default
* exponential backoff
* dead-letter queue support

---

# Notification Expiry Rules

| Type     | Expiry       |
| -------- | ------------ |
| critical | never expire |
| normal   | 30 days      |
| system   | 7 days       |

---

# UI Notification Behavior

## Bell Component

* unread count badge
* dropdown list
* mark as read

---

## Notification Drawer

* full list
* filters:

  * unread
  * type
  * date

---

## Real-time Behavior

* instant push without refresh
* toast popup for critical alerts
* sound alert (optional setting)

---

# Filtering Rules

All notification queries must support:

```http
?type=
&is_read=
&page=
&pageSize=
```

---

# Security Rules

* Users can only see their own notifications
* Admin can view all notifications
* No cross-role leakage allowed

---

# Future Extensions

## Planned Features

* Email notifications
* Push notifications (mobile app)
* WhatsApp integration
* AI-based alert prioritization
* Notification grouping (batching)

---

# Performance Rules

* Use Redis caching for unread counts
* Pagination mandatory
* Virtualized rendering for large lists

---

# Summary

Notification system is:

* Event-driven
* Real-time (Socket.IO)
* Queue-based (BullMQ)
* Persisted (PostgreSQL)
* Future-ready (Email + Mobile Push)

# End of Notification Matrix
