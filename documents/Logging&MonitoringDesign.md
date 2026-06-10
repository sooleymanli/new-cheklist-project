# Logging & Monitoring Design

# Facility Inspection & Incident Management Platform

Version: 1.0

Purpose:

This document defines the observability strategy of the system including logging, monitoring, auditing, health checks, and future scalability for production-grade infrastructure.

---

# 1. Observability Overview

The system follows a three-layer observability model:

1. Logs (What happened?)
2. Metrics (How system performs?)
3. Traces (Where did it fail?)

---

# 2. Logging Architecture

## 2.1 Logging Stack

* Pino Logger (Backend primary logger)
* Console logs (development only)
* File-based logs (production optional)
* Future: ELK Stack (Elasticsearch + Logstash + Kibana)

---

## 2.2 Log Types

### Application Logs

* API requests
* Business logic events
* User actions

---

### Error Logs

* Unhandled exceptions
* Database errors
* External service failures

---

### Audit Logs (Critical)

* User role changes
* Checklist approvals
* Incident updates
* Deletions

---

### Security Logs

* Failed login attempts
* Unauthorized access attempts
* Token validation failures

---

### Socket Logs

* Connection established
* Disconnection events
* Event emissions

---

# 3. Log Structure Standard

All logs must follow a unified structure:

```json id="log1"
{
  "timestamp": "2026-06-10T12:00:00Z",
  "level": "info",
  "service": "backend",
  "module": "checklist",
  "message": "Checklist submitted",
  "userId": "uuid",
  "traceId": "uuid",
  "metadata": {}
}
```

---

# 4. Log Levels

| Level | Description             |
| ----- | ----------------------- |
| trace | Very detailed debugging |
| debug | Development debugging   |
| info  | Normal operations       |
| warn  | Potential issues        |
| error | Failures                |
| fatal | System breaking issues  |

---

# 5. Audit Logging System

## 5.1 Purpose

Audit logs ensure full traceability of all critical system actions.

---

## 5.2 Audit Events

| Event              | Description        |
| ------------------ | ------------------ |
| user.created       | New user created   |
| user.updated       | User updated       |
| user.role.changed  | Role modification  |
| checklist.approved | Checklist approved |
| checklist.rejected | Checklist rejected |
| incident.created   | Incident created   |
| incident.resolved  | Incident resolved  |
| file.uploaded      | File uploaded      |

---

## 5.3 Audit Log Schema

```json id="audit1"
{
  "id": "uuid",
  "actorId": "user-uuid",
  "action": "checklist.approved",
  "entityType": "checklist",
  "entityId": "uuid",
  "timestamp": "2026-06-10T12:00:00Z",
  "ipAddress": "192.168.1.1",
  "userAgent": "Mozilla...",
  "before": {},
  "after": {}
}
```

---

# 6. Application Monitoring

## 6.1 Health Checks

Mandatory endpoints:

```http id="health1"
GET /health
GET /health/live
GET /health/ready
```

---

## 6.2 Health Check Response

```json id="health2"
{
  "status": "ok",
  "uptime": 123456,
  "services": {
    "database": "ok",
    "redis": "ok",
    "minio": "ok"
  }
}
```

---

# 7. Metrics Monitoring

## 7.1 Key Metrics

### System Metrics

* CPU usage
* Memory usage
* Disk usage
* Network I/O

---

### Application Metrics

* Request count
* Response time (latency)
* Error rate
* Active users

---

### Business Metrics

* Completed checklists
* Open incidents
* Overdue tasks
* Approval rate

---

# 8. Performance Monitoring Strategy

## 8.1 API Performance Tracking

Each request must log:

* response time
* status code
* endpoint
* userId (if authenticated)

---

## 8.2 Slow Request Threshold

| Threshold | Action         |
| --------- | -------------- |
| > 500ms   | warn log       |
| > 1000ms  | error log      |
| > 3000ms  | critical alert |

---

# 9. Error Tracking Strategy

## 9.1 Error Handling Flow

```text id="err1"
Exception 발생
    ↓
Global Exception Filter
    ↓
Logger (Pino)
    ↓
Audit Log (if needed)
    ↓
Socket Alert (if critical)
```

---

## 9.2 Error Categories

* Validation errors
* Database errors
* Authentication errors
* Authorization errors
* System errors

---

# 10. Real-Time Monitoring (Socket Integration)

## Events Tracked

* checklist.submitted
* incident.created
* incident.critical
* user.login
* system.alert

---

## Real-Time Alerts

Critical events trigger:

* Admin dashboard alert
* Socket notification
* Optional email trigger (future)

---

# 11. Logging Security Rules

* No passwords in logs
* No JWT tokens in logs
* Sensitive data masking required
* PII anonymization where possible

---

# 12. Log Retention Policy

| Log Type         | Retention |
| ---------------- | --------- |
| Application Logs | 30 days   |
| Error Logs       | 90 days   |
| Audit Logs       | 1–3 years |
| Security Logs    | 1 year    |

---

# 13. Centralized Logging (Future)

Planned stack:

* Elasticsearch (storage)
* Logstash (processing)
* Kibana (visualization)

OR alternative:

* Grafana Loki stack

---

# 14. Alerting Strategy

## Trigger Conditions

* API error rate > 5%
* Database downtime
* Redis failure
* Critical incident created
* System CPU > 85%

---

## Alert Channels

* Socket.IO (real-time dashboard)
* Email (future integration)
* Slack / Telegram (future integration)

---

# 15. Traceability Strategy

Each request must include:

```text id="trace1"
traceId (UUID)
```

Used for:

* debugging
* cross-service tracking
* error correlation

---

# 16. Logging Best Practices

* Structured JSON logs only
* No plain text logs in production
* Centralized logging format
* Consistent metadata structure
* Avoid logging sensitive data

---

# 17. System Observability Summary

This design ensures:

* Full system traceability
* Real-time issue detection
* Business insight visibility
* Production-grade monitoring
* Scalable observability foundation

---

# End of Logging & Monitoring Design
