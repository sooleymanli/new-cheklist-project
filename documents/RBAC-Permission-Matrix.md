# RBAC Permission Matrix

# Facility Inspection & Incident Management Platform

Version: 1.0

Authorization Model:

* RBAC (Role Based Access Control)
* Permission Based Authorization

---

# Roles

## Super Admin

Full system access.

Can manage:

* All users
* All settings
* All permissions
* All reports
* All modules

---

## Admin

Operational administrator.

Can manage:

* Buildings
* Floors
* Locations
* Checklists
* Incidents
* Reports
* Users

Cannot:

* Manage system permissions
* Modify Super Admin accounts

---

## Supervisor

Management role.

Can:

* View assigned areas
* Approve checklists
* Manage incidents
* View reports

Cannot:

* Manage users
* Manage roles
* Manage permissions

---

## Employee

Operational field worker.

Can:

* Complete assigned checklists
* Scan QR codes
* Submit incidents
* View own performance

Cannot access admin modules.

---

## Auditor

Read-only role.

Can:

* View reports
* View audit logs
* View incidents
* View completed checklists

Cannot modify any data.

---

# Permission Naming Convention

Format:

```text
resource.action
```

Examples:

```text
user.create
user.update
user.delete

building.create

incident.manage

report.export
```

---

# User Permissions

| Permission      | Super Admin | Admin | Supervisor | Employee | Auditor |
| --------------- | ----------- | ----- | ---------- | -------- | ------- |
| user.view       | ✅           | ✅     | ❌          | ❌        | ✅       |
| user.create     | ✅           | ✅     | ❌          | ❌        | ❌       |
| user.update     | ✅           | ✅     | ❌          | ❌        | ❌       |
| user.delete     | ✅           | ✅     | ❌          | ❌        | ❌       |
| user.activate   | ✅           | ✅     | ❌          | ❌        | ❌       |
| user.deactivate | ✅           | ✅     | ❌          | ❌        | ❌       |

---

# Role Permissions

| Permission  | Super Admin | Admin | Supervisor | Employee | Auditor |
| ----------- | ----------- | ----- | ---------- | -------- | ------- |
| role.view   | ✅           | ❌     | ❌          | ❌        | ❌       |
| role.create | ✅           | ❌     | ❌          | ❌        | ❌       |
| role.update | ✅           | ❌     | ❌          | ❌        | ❌       |
| role.delete | ✅           | ❌     | ❌          | ❌        | ❌       |

---

# Permission Management

| Permission        | Super Admin | Admin | Supervisor | Employee | Auditor |
| ----------------- | ----------- | ----- | ---------- | -------- | ------- |
| permission.view   | ✅           | ❌     | ❌          | ❌        | ❌       |
| permission.create | ✅           | ❌     | ❌          | ❌        | ❌       |
| permission.update | ✅           | ❌     | ❌          | ❌        | ❌       |
| permission.delete | ✅           | ❌     | ❌          | ❌        | ❌       |

---

# Building Permissions

| Permission      | Super Admin | Admin | Supervisor | Employee | Auditor |
| --------------- | ----------- | ----- | ---------- | -------- | ------- |
| building.view   | ✅           | ✅     | ✅          | ❌        | ✅       |
| building.create | ✅           | ✅     | ❌          | ❌        | ❌       |
| building.update | ✅           | ✅     | ❌          | ❌        | ❌       |
| building.delete | ✅           | ✅     | ❌          | ❌        | ❌       |

---

# Floor Permissions

| Permission   | Super Admin | Admin | Supervisor | Employee | Auditor |
| ------------ | ----------- | ----- | ---------- | -------- | ------- |
| floor.view   | ✅           | ✅     | ✅          | ❌        | ✅       |
| floor.create | ✅           | ✅     | ❌          | ❌        | ❌       |
| floor.update | ✅           | ✅     | ❌          | ❌        | ❌       |
| floor.delete | ✅           | ✅     | ❌          | ❌        | ❌       |

---

# Location Permissions

| Permission      | Super Admin | Admin | Supervisor | Employee | Auditor |
| --------------- | ----------- | ----- | ---------- | -------- | ------- |
| location.view   | ✅           | ✅     | ✅          | ❌        | ✅       |
| location.create | ✅           | ✅     | ❌          | ❌        | ❌       |
| location.update | ✅           | ✅     | ❌          | ❌        | ❌       |
| location.delete | ✅           | ✅     | ❌          | ❌        | ❌       |

---

# Checklist Template Permissions

| Permission                | Super Admin | Admin | Supervisor | Employee | Auditor |
| ------------------------- | ----------- | ----- | ---------- | -------- | ------- |
| checklist-template.view   | ✅           | ✅     | ✅          | ❌        | ✅       |
| checklist-template.create | ✅           | ✅     | ❌          | ❌        | ❌       |
| checklist-template.update | ✅           | ✅     | ❌          | ❌        | ❌       |
| checklist-template.delete | ✅           | ✅     | ❌          | ❌        | ❌       |
| checklist-template.assign | ✅           | ✅     | ❌          | ❌        | ❌       |

---

# Checklist Instance Permissions

| Permission        | Super Admin | Admin | Supervisor | Employee | Auditor |
| ----------------- | ----------- | ----- | ---------- | -------- | ------- |
| checklist.view    | ✅           | ✅     | ✅          | Own      | ✅       |
| checklist.execute | ❌           | ❌     | ❌          | ✅        | ❌       |
| checklist.submit  | ❌           | ❌     | ❌          | ✅        | ❌       |
| checklist.approve | ✅           | ✅     | ✅          | ❌        | ❌       |
| checklist.reject  | ✅           | ✅     | ✅          | ❌        | ❌       |

---

# Approval Workflow Permissions

| Permission       | Super Admin | Admin | Supervisor | Employee | Auditor |
| ---------------- | ----------- | ----- | ---------- | -------- | ------- |
| approval.view    | ✅           | ✅     | ✅          | Own      | ✅       |
| approval.approve | ✅           | ✅     | ✅          | ❌        | ❌       |
| approval.reject  | ✅           | ✅     | ✅          | ❌        | ❌       |

---

# Incident Permissions

| Permission       | Super Admin | Admin | Supervisor | Employee | Auditor |
| ---------------- | ----------- | ----- | ---------- | -------- | ------- |
| incident.view    | ✅           | ✅     | ✅          | Own      | ✅       |
| incident.create  | ✅           | ✅     | ✅          | ✅        | ❌       |
| incident.update  | ✅           | ✅     | ✅          | Own Open | ❌       |
| incident.delete  | ✅           | ✅     | ❌          | ❌        | ❌       |
| incident.assign  | ✅           | ✅     | ✅          | ❌        | ❌       |
| incident.resolve | ✅           | ✅     | ✅          | ❌        | ❌       |
| incident.close   | ✅           | ✅     | ✅          | ❌        | ❌       |

---

# QR Permissions

| Permission  | Super Admin | Admin | Supervisor | Employee | Auditor |
| ----------- | ----------- | ----- | ---------- | -------- | ------- |
| qr.view     | ✅           | ✅     | ✅          | ❌        | ✅       |
| qr.generate | ✅           | ✅     | ❌          | ❌        | ❌       |
| qr.download | ✅           | ✅     | ❌          | ❌        | ❌       |
| qr.print    | ✅           | ✅     | ❌          | ❌        | ❌       |
| qr.scan     | ✅           | ✅     | ✅          | ✅        | ❌       |

---

# Report Permissions

| Permission          | Super Admin | Admin | Supervisor | Employee | Auditor |
| ------------------- | ----------- | ----- | ---------- | -------- | ------- |
| report.view         | ✅           | ✅     | ✅          | Own      | ✅       |
| report.export.pdf   | ✅           | ✅     | ✅          | ❌        | ✅       |
| report.export.excel | ✅           | ✅     | ✅          | ❌        | ✅       |

---

# Dashboard Permissions

| Permission     | Super Admin | Admin | Supervisor | Employee | Auditor |
| -------------- | ----------- | ----- | ---------- | -------- | ------- |
| dashboard.view | ✅           | ✅     | ✅          | ✅        | ✅       |

---

# Notification Permissions

| Permission        | Super Admin | Admin | Supervisor | Employee | Auditor |
| ----------------- | ----------- | ----- | ---------- | -------- | ------- |
| notification.view | ✅           | ✅     | ✅          | ✅        | ✅       |
| notification.read | ✅           | ✅     | ✅          | ✅        | ✅       |

---

# Audit Permissions

| Permission | Super Admin | Admin | Supervisor | Employee | Auditor |
| ---------- | ----------- | ----- | ---------- | -------- | ------- |
| audit.view | ✅           | ❌     | ❌          | ❌        | ✅       |

---

# Settings Permissions

| Permission      | Super Admin | Admin | Supervisor | Employee | Auditor |
| --------------- | ----------- | ----- | ---------- | -------- | ------- |
| settings.view   | ✅           | ✅     | ❌          | ❌        | ❌       |
| settings.update | ✅           | ✅     | ❌          | ❌        | ❌       |

---

# Menu Visibility Matrix

## Super Admin

Visible Menus:

* Dashboard
* Users
* Roles
* Permissions
* Buildings
* Floors
* Locations
* Checklist Templates
* Checklist Instances
* Approvals
* Incidents
* Reports
* Audit Logs
* Settings

---

## Admin

Visible Menus:

* Dashboard
* Users
* Buildings
* Floors
* Locations
* Checklist Templates
* Checklist Instances
* Approvals
* Incidents
* Reports
* Settings

---

## Supervisor

Visible Menus:

* Dashboard
* Approvals
* Incidents
* Reports

---

## Employee

Visible Menus:

* My Checklists
* My Incidents
* My Notifications
* Profile

---

## Auditor

Visible Menus:

* Dashboard
* Reports
* Audit Logs
* Incidents

---

# Frontend Permission Usage

Example:

```tsx
<PermissionGuard permission="user.create">
  <CreateUserButton />
</PermissionGuard>
```

---

# Backend Permission Usage

Example:

```typescript
@Permissions("user.create")
@Post()
createUser() {}
```

---

# Permission Resolution Order

```text
User
 ↓
Role
 ↓
Permissions
 ↓
Route Access
 ↓
UI Visibility
```

---

# Future Ready

The permission system must support:

* Dynamic permissions
* Role cloning
* Custom roles
* Temporary permissions
* Department-based permissions
* Multi-tenant permissions

without architectural changes.

# End of RBAC Permission Matrix
