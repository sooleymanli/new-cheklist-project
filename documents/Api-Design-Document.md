# API Design Document

# Facility Inspection & Incident Management Platform

Version: 1.0

Architecture Style:

* REST API (Primary)
* Event-driven (Secondary)
* JWT Auth
* RBAC Protected Endpoints
* Search Params Driven Queries

---

# 1. API Standards

## Base URL

```text id="baseurl"
https://api.domain.com/v1
```

---

## Response Format

### Success

```json id="res1"
{
  "success": true,
  "data": {},
  "meta": {}
}
```

---

### Error

```json id="res2"
{
  "success": false,
  "message": "Error message",
  "errors": []
}
```

---

## Pagination Format

```json id="pag1"
{
  "data": [],
  "meta": {
    "page": 1,
    "pageSize": 20,
    "total": 100,
    "totalPages": 5
  }
}
```

---

## Query Standards

All list endpoints must support:

```http id="query1"
?page=
&pageSize=
&search=
&sort=
&order=
&status=
&from=
&to=
```

---

# 2. Authentication APIs

## Login

```http id="auth1"
POST /auth/login
```

### Request

```json id="auth2"
{
  "email": "admin@mail.com",
  "password": "123456"
}
```

### Response

```json id="auth3"
{
  "accessToken": "",
  "refreshToken": "",
  "user": {}
}
```

---

## Refresh Token

```http id="auth4"
POST /auth/refresh
```

---

## Logout

```http id="auth5"
POST /auth/logout
```

---

## Get Profile

```http id="auth6"
GET /auth/me
```

---

# 3. Users API

## Get Users

```http id="u1"
GET /users?page=1&pageSize=20
```

---

## Create User

```http id="u2"
POST /users
```

### Request

```json id="u3"
{
  "firstName": "Ali",
  "lastName": "Aliyev",
  "email": "ali@mail.com",
  "mobile": "+994...",
  "roleId": "uuid",
  "password": "123456"
}
```

---

## Update User

```http id="u4"
PATCH /users/:id
```

---

## Delete User

```http id="u5"
DELETE /users/:id
```

---

# 4. Buildings API

## Get Buildings

```http id="b1"
GET /buildings
```

---

## Create Building

```http id="b2"
POST /buildings
```

---

## Update Building

```http id="b3"
PATCH /buildings/:id
```

---

# 5. Floors API

## Get Floors

```http id="f1"
GET /floors?buildingId=uuid
```

---

## Create Floor

```http id="f2"
POST /floors
```

---

# 6. Locations API

## Get Locations

```http id="l1"
GET /locations?buildingId=uuid&floorId=uuid
```

---

## Create Location

```http id="l2"
POST /locations
```

---

# 7. Checklist Templates API

## Get Templates

```http id="ct1"
GET /checklist-templates
```

---

## Create Template

```http id="ct2"
POST /checklist-templates
```

### Request

```json id="ct3"
{
  "name": "Daily Office Check",
  "description": "Daily inspection checklist",
  "locations": ["uuid1", "uuid2"],
  "fields": [
    {
      "label": "Lights Working",
      "type": "checkbox",
      "required": true
    },
    {
      "label": "Temperature",
      "type": "number",
      "required": true
    }
  ]
}
```

---

# 8. Checklist Instances API

## Get Instances

```http id="ci1"
GET /checklist-instances?status=pending
```

---

## Submit Checklist

```http id="ci2"
POST /checklist-instances/:id/submit
```

---

## Approve Checklist

```http id="ci3"
POST /checklist-instances/:id/approve
```

---

## Reject Checklist

```http id="ci4"
POST /checklist-instances/:id/reject
```

---

# 9. Incident APIs

## Get Incidents

```http id="in1"
GET /incidents?status=open&priority=high
```

---

## Create Incident

```http id="in2"
POST /incidents
```

### Request

```json id="in3"
{
  "title": "Air Conditioner Broken",
  "description": "Not cooling",
  "locationId": "uuid",
  "categoryId": "uuid",
  "priority": "high"
}
```

---

## Update Incident

```http id="in4"
PATCH /incidents/:id
```

---

## Assign Incident

```http id="in5"
POST /incidents/:id/assign
```

---

## Resolve Incident

```http id="in6"
POST /incidents/:id/resolve
```

---

# 10. QR APIs

## Generate QR

```http id="qr1"
POST /qr/generate
```

---

## Scan QR

```http id="qr2"
POST /qr/scan
```

---

## Get QR Data

```http id="qr3"
GET /qr/:token
```

---

# 11. Reports APIs

## Get Reports

```http id="r1"
GET /reports?from=2026-01-01&to=2026-01-31
```

---

## Export PDF

```http id="r2"
GET /reports/export/pdf
```

---

## Export Excel

```http id="r3"
GET /reports/export/excel
```

---

# 12. Dashboard APIs

## Get Dashboard Data

```http id="d1"
GET /dashboard/checklist-stats
GET /dashboard/incident-stats
GET /dashboard/activity-feed
```

---

# 13. Notifications APIs

## Get Notifications

```http id="n1"
GET /notifications?page=1&pageSize=20
```

---

## Mark as Read

```http id="n2"
POST /notifications/:id/read
```

---

## Mark All as Read

```http id="n3"
POST /notifications/read-all
```

---

# 14. Files API

## Upload File

```http id="file1"
POST /files/upload
```

---

## Get File

```http id="file2"
GET /files/:id
```

---

# 15. Roles & Permissions APIs

## Roles

```http id="r2a"
GET /roles
POST /roles
PATCH /roles/:id
DELETE /roles/:id
```

---

## Permissions

```http id="p1"
GET /permissions
POST /permissions
```

---

# 16. Search Strategy

All endpoints must support:

```text id="search1"
search → text search
filters → structured filters
sort → sorting
order → asc/desc
```

---

# 17. RBAC Enforcement

Every endpoint must define:

```text id="rbac1"
requiredPermission: "incident.create"
```

Example:

```typescript id="rbac2"
@Permissions("incident.create")
```

---

# 18. Socket Events Mapping

## Notifications

```text id="s1"
notification.created
notification.read
```

---

## Incidents

```text id="s2"
incident.created
incident.updated
incident.resolved
```

---

## Checklists

```text id="s3"
checklist.assigned
checklist.submitted
checklist.approved
```

---

# 19. Error Codes Strategy

| Code | Meaning          |
| ---- | ---------------- |
| 400  | Validation Error |
| 401  | Unauthorized     |
| 403  | Forbidden        |
| 404  | Not Found        |
| 409  | Conflict         |
| 500  | Server Error     |

---

# 20. Rate Limiting

| Endpoint      | Limit   |
| ------------- | ------- |
| /auth/login   | 5/min   |
| /auth/refresh | 10/min  |
| /api/*        | 100/min |

---

# 21. Versioning Strategy

API Versioning:

```text id="v1"
/v1/
```

Future:

```text id="v2"
/v2/
```

---

# 22. Summary

This API design ensures:

* Consistency between frontend & backend
* Strict RBAC enforcement
* Search params driven architecture
* Scalable REST structure
* Event-driven extensibility

# End of API Design Document
