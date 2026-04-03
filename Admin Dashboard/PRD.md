# Product Requirements Document

## Product Overview
The project is a **Smart School Management System (SSMS)** with:
- A Node.js + Express backend API (`backend/`)
- A SQLite database (`backend/database.sqlite`)
- Two frontend implementations:
- Legacy multi-page static frontend (`frontend/`)
- React + Vite frontend (`frontend-react/`) that wraps and reuses legacy JS modules for the admin experience

The currently implemented product focus is an **Admin-led school operations system** covering admissions, staff, attendance, exams, marks, fees, parents, notices, timetable, and reports.

## Goals and Objectives
- Centralize school master data (students, teachers, classes, parents, staff).
- Provide daily operational tools for attendance, exam management, fee collection, and notices.
- Offer decision support via dashboard metrics and report exports.
- Enforce authentication and role checks for sensitive write operations.
- Support parent authentication for class bands:
- Class 1-6 via Student ID + access key
- Parent ID + password for linked parent accounts in classes 1-6

## Target Users
- `super_admin`: full control, administrative governance.
- `admin`: primary operations user in UI.
- `teacher`: attendance/marks/results contributor via API permissions.
- `accountant`: fee lifecycle contributor via API permissions.
- `parent`: authentication supported; no dedicated parent dashboard in current React app.
- `student`: role exists in auth model; no dedicated student dashboard in current React app.

## Project Structure Analysis
### Repository Structure (project-owned files)
```text
.
|- .vscode/
|  `- launch.json
|- backend/
|  |- config/
|  |  `- db.js
|  |- middleware/
|  |  |- auth.js
|  |  `- errorHandler.js
|  |- routes/
|  |  |- attendance.js
|  |  |- auth.js
|  |  |- classes.js
|  |  |- dashboard.js
|  |  |- exams.js
|  |  |- fees.js
|  |  |- feeStructure.js
|  |  |- holidays.js
|  |  |- leaves.js
|  |  |- marks.js
|  |  |- notices.js
|  |  |- parents.js
|  |  |- reports.js
|  |  |- results.js
|  |  |- staff.js
|  |  |- students.js
|  |  |- teachers.js
|  |  |- timetable.js
|  |  `- vacations.js
|  |- services/
|  |  `- googleCalendar.js
|  |- .env
|  |- .gitignore
|  |- database.sqlite
|  |- database.sqlite-shm
|  |- database.sqlite-wal
|  |- package.json
|  |- package-lock.json
|  `- server.js
|- frontend/
|  |- css/style.css
|  |- js/
|  |  |- admin.js
|  |  |- api.js
|  |  |- auth.js
|  |  |- data.js
|  |  `- layout.js
|  |- admin.html
|  |- index.html
|  |- login.html
|  `- role.html
|- frontend-react/
|  |- public/
|  |  |- css/style.css
|  |  `- js/
|  |     |- admin.js
|  |     |- api.js
|  |     |- auth.js
|  |     |- data.js
|  |     `- layout.js
|  |- src/
|  |  |- assets/adminSections.html
|  |  |- components/ProtectedRoute.jsx
|  |  |- pages/
|  |  |  |- Admin.jsx
|  |  |  `- Login.jsx
|  |  |- styles/main.css
|  |  |- App.jsx
|  |  `- main.jsx
|  |- index.html
|  |- package.json
|  |- package-lock.json
|  `- vite.config.js
|- FRD.md
`- run.bat
```

### Folder Relationships and Purpose
| Path | Purpose | Relationship |
|---|---|---|
| `backend/` | API layer + DB schema + business rules | Source of truth for data and permissions |
| `frontend/` | Legacy static UI | Standalone UI served by backend static hosting |
| `frontend-react/` | Current React shell | Uses `public/js/*` legacy scripts for admin logic |
| `frontend-react/src/assets/adminSections.html` | Admin page markup | Injected into React Admin page via `dangerouslySetInnerHTML` |
| `backend/database.sqlite*` | SQLite data store + WAL files | Persisted runtime data |
| `run.bat` | Local orchestration | Installs deps and launches backend + React dev server |

### Important Notes on Generated/Third-Party Content
- `backend/node_modules`, `frontend-react/node_modules`, and `frontend-react/dist` are dependency/build artifacts.
- Functional analysis below is based on project-owned source files, not vendored package internals.

## System Architecture Overview
### High-Level Architecture
1. User interacts with React app (`frontend-react`, port `5173`) or legacy pages (`frontend`).
2. Frontend calls REST APIs under `/api/*`.
3. Vite proxy forwards `/api` to backend (`http://localhost:5000`).
4. Express backend handles auth, validation, business rules, and DB I/O.
5. `better-sqlite3` performs synchronous SQL operations on SQLite.
6. API responds with JSON, CSV, or report HTML.

### Backend Composition
- Entry point: `backend/server.js`
- Cross-cutting middleware:
- `cors` with `CORS_ORIGIN` (default `*`)
- JSON/urlencoded body parsing
- JWT auth/authorize middleware (`middleware/auth.js`)
- Error middleware (`middleware/errorHandler.js`)
- Route modules mounted under `/api/...`

### Frontend Composition
- React routes:
- `/login` (login page)
- `/admin` (protected for `super_admin`, `admin`)
- `/` and fallback redirect to `/login`
- Admin UI logic is primarily imperative JS loaded at runtime:
- `public/js/data.js`, `api.js`, `auth.js`, `layout.js`, `admin.js`

### Data Storage
- SQLite with WAL mode and foreign keys enabled.
- Schema initialization and migrations executed in `backend/config/db.js`.

## Modules
### Implemented Modules
| Module | Purpose | Core Functionality | Primary Files |
|---|---|---|---|
| Authentication & Session | Identity and JWT session handling | Login, JWT issuance, session TTL checks, role checks | `backend/routes/auth.js`, `backend/middleware/auth.js`, `frontend-react/public/js/auth.js`, `frontend-react/src/components/ProtectedRoute.jsx` |
| Admin Panel Shell | Unified admin workspace | Sidebar/topbar, section switching, role gating | `frontend-react/src/pages/Admin.jsx`, `frontend-react/public/js/layout.js`, `frontend-react/public/js/admin.js` |
| Dashboard & Analytics | Real-time operational visibility | KPIs, heatmaps, fee summary, marks progress, today attendance | `backend/routes/dashboard.js`, `frontend-react/public/js/admin.js` |
| Student Management | Student lifecycle | Create/read/update/delete, auto IDs, class-based fee logic, parent linking fields | `backend/routes/students.js`, `frontend-react/public/js/admin.js` |
| Teacher Management | Teacher lifecycle | CRUD, auto employee/teacher credentials | `backend/routes/teachers.js`, `frontend-react/public/js/admin.js` |
| Attendance Management | Daily attendance operations | Student/teacher attendance, monthly report, day detail, CSV export, date restrictions | `backend/routes/attendance.js`, `backend/routes/holidays.js`, `backend/routes/vacations.js`, `frontend-react/public/js/admin.js` |
| Exams, Marks, Results | Assessment pipeline | Exam schedule CRUD, subject-wise marks entry, aggregated result cards | `backend/routes/exams.js`, `backend/routes/marks.js`, `backend/routes/results.js`, `frontend-react/public/js/admin.js` |
| Fee Management | Collection and status tracking | Fee CRUD, paid/partial/pending logic, receipt generation, student fee sync | `backend/routes/fees.js`, `backend/routes/feeStructure.js`, `frontend-react/public/js/admin.js` |
| Parent Management | Parent account lifecycle | Parent login, create/link children (classes 1-6), password reset | `backend/routes/parents.js`, `frontend-react/public/js/admin.js`, `frontend/login.html` |
| Notice & Notification | Announcement distribution | Notice CRUD, filtering, urgent tagging, notification dropdown dismissal | `backend/routes/notices.js`, `frontend-react/public/js/layout.js`, `frontend-react/public/js/admin.js` |
| Timetable Management | Academic schedule planning | Generated/default timetable, import/export JSON/CSV, cell edits, conflict checks | `backend/routes/timetable.js`, `frontend-react/public/js/admin.js` |
| Reports & Exports | Auditor/stakeholder outputs | School summary, marks, students, attendance, fees reports (HTML/CSV) | `backend/routes/reports.js`, dashboard report dropdown handlers in `frontend-react/public/js/admin.js` |
| Settings | Admin profile/security/system cards | Profile UI edits, password success feedback, health/storage widgets | `frontend-react/public/js/admin.js`, `frontend-react/src/assets/adminSections.html` |
| Staff & Leave (backend available) | HR and leave processes | Staff CRUD/stats; leave submit/approve/reject/delete | `backend/routes/staff.js`, `backend/routes/leaves.js` |

### Requested Module Coverage Status
| Requested Module | Status in Codebase |
|---|---|
| Authentication | Implemented |
| Admin Panel | Implemented |
| Teacher Dashboard | Partial (role exists; no dedicated teacher UI/dashboard route) |
| Student Dashboard | Partial (role exists; no dedicated student UI/dashboard route) |
| Parent Dashboard | Partial (parent login supported; no dedicated dashboard route in React app) |
| Learning System | Not implemented |
| Games | Not implemented |
| Notification System | Implemented via notices + in-app notification dropdown |
| Analytics / Reports | Implemented |
| Settings | Implemented (mostly UI-driven, limited backend persistence) |

## Feature List per Module
| Feature | Description | UI Presence | Implementing Files |
|---|---|---|---|
| Admin JWT Login | Email/password login with token storage | React Login + legacy login pages | `backend/routes/auth.js`, `frontend-react/public/js/api.js`, `frontend-react/public/js/auth.js`, `frontend-react/src/pages/Login.jsx` |
| Parent Access-Key Login | Class 1-6 parent login using student ID + access key | Legacy `frontend/login.html` | `backend/routes/students.js`, `frontend/js/auth.js` |
| Parent ID Login | Parent ID login for linked classes 1-6 | Legacy `frontend/login.html` | `backend/routes/parents.js`, `frontend/js/auth.js` |
| Student Admission Auto IDs | Auto-generates GR, admission number, student ID/password | Students section modal | `backend/routes/students.js`, `frontend-react/public/js/admin.js` |
| Teacher Onboarding Auto IDs | Auto-generates employee ID, teacher ID/password | Teachers section modal | `backend/routes/teachers.js`, `frontend-react/public/js/admin.js` |
| Dashboard Live Attendance | 60-second refresh of today attendance cards | Dashboard section | `backend/routes/dashboard.js`, `frontend-react/public/js/admin.js` |
| Academic Heatmap | Attendance heatmap with holiday/vacation/Sunday semantics | Dashboard + Attendance sections | `backend/routes/dashboard.js`, `backend/routes/attendance.js`, `frontend-react/public/js/admin.js` |
| Attendance Bulk Save | Bulk upsert attendance with validations | Attendance section | `backend/routes/attendance.js`, `frontend-react/public/js/admin.js` |
| Holiday Management | Manual add/delete and Google sync | Attendance tools + holiday modal | `backend/routes/holidays.js`, `backend/services/googleCalendar.js`, `frontend-react/public/js/admin.js` |
| Vacation Management | Add/list/delete vacation periods | Attendance tools + vacation modals | `backend/routes/vacations.js`, `frontend-react/public/js/admin.js` |
| Exam Scheduling | CRUD exam schedule | Exams tab | `backend/routes/exams.js`, `frontend-react/public/js/admin.js` |
| Subject-wise Marks Entry | Load class+section students, edit marks, bulk save | Marks tab | `backend/routes/marks.js`, `frontend-react/public/js/admin.js` |
| Result Cards | Filter/search cards with grade and pass/fail visualization | Results tab | `backend/routes/marks.js`, `frontend-react/public/js/admin.js` |
| Fee Payment Workflow | Record payments, partial settlement, status updates | Fees section + payment modal | `backend/routes/fees.js`, `frontend-react/public/js/admin.js` |
| Fee Receipt | Receipt fetch with parent info + print/download HTML | Fees section receipt modal | `backend/routes/fees.js`, `frontend-react/public/js/admin.js` |
| Parent Account Provisioning | Create parent IDs/passwords, link child records | Parents section | `backend/routes/parents.js`, `frontend-react/public/js/admin.js` |
| Parent Password Reset | Admin changes parent password | Parents credentials modal | `backend/routes/parents.js`, `frontend-react/public/js/admin.js` |
| Notice Board CRUD | Post/update/delete notices and urgency target | Notices section | `backend/routes/notices.js`, `frontend-react/public/js/admin.js` |
| Notification Dropdown | Topbar list from notices with dismiss actions | Topbar | `frontend-react/public/js/layout.js` |
| Timetable Cell Editing | Inline edit with subject/teacher mapping and conflict checks | Timetable section | `backend/routes/timetable.js`, `frontend-react/public/js/admin.js` |
| Timetable Import/Export | JSON import and layout download, CSV export | Timetable section | `backend/routes/timetable.js`, `frontend-react/public/js/admin.js` |
| Report Export | HTML/CSV report generation and download | Dashboard report menu | `backend/routes/reports.js`, `frontend-react/public/js/admin.js` |
| Settings Profile UI | Profile edit UI and password success alert | Settings section | `frontend-react/public/js/admin.js` |

## Functional Requirements
### Authentication and Access
- FR-1: System shall authenticate users via `/api/auth/login` and issue JWT tokens.
- FR-2: System shall protect API routes using token validation middleware.
- FR-3: System shall enforce role checks for protected write operations using `authorize(...)`.
- FR-4: Frontend shall enforce 8-hour session expiry and redirect expired sessions to login.

### Student and Teacher Lifecycle
- FR-5: System shall allow admin/super_admin to create, update, delete students and teachers.
- FR-6: Student creation shall auto-generate identifiers and credentials.
- FR-7: Teacher creation shall auto-generate EMP ID, teacher ID, and password.

### Attendance and Calendar Rules
- FR-8: System shall support attendance for both students and teachers.
- FR-9: System shall reject attendance marking for future dates, Sundays, and configured holidays.
- FR-10: System shall provide monthly attendance analytics, per-person percentages, and daily drill-down.

### Exams, Marks, and Results
- FR-11: System shall manage exam schedules with class, subject, date, duration, and status.
- FR-12: System shall allow bulk upsert of subject-wise marks by class and exam type.
- FR-13: System shall compute totals, percentages, and grades for display and persistence workflows.

### Fee Management
- FR-14: System shall restrict fee applicability to classes 9 and 10 in backend logic.
- FR-15: System shall support paid/pending/partial status calculations and updates.
- FR-16: System shall generate enriched receipt data including parent details where available.

### Parents and Notices
- FR-17: System shall create parent accounts with generated IDs and passwords.
- FR-18: System shall link parent accounts to students in classes 1-6 via mapping table.
- FR-19: System shall allow notice creation with audience targeting and urgency flags.

### Timetable and Reports
- FR-20: System shall provide generated fallback timetable and uploaded override timetable.
- FR-21: System shall detect teacher conflicts for same day and lecture slot.
- FR-22: System shall generate downloadable school reports in HTML and CSV formats.

## User Roles and Permissions
### Role Inventory (from schema and seed data)
- `super_admin`
- `admin`
- `teacher`
- `accountant`
- `student`
- `parent`

### Capability Matrix (implemented behavior)
| Capability | super_admin/admin | teacher | accountant | parent/student |
|---|---|---|---|---|
| Admin UI access (`/admin`) | Yes | No | No | No |
| Login via `/api/auth/login` | Yes | Yes | Yes | Yes (if in `users`) |
| Parent login endpoints | No | No | No | Yes |
| Student/Teacher/Class read APIs | Yes | Yes | Yes | Yes (authenticated access) |
| Student CRUD | Yes | No | No | No |
| Teacher CRUD | Yes | No | No | No |
| Attendance bulk save | Yes | Yes | No | No |
| Exam CRUD | Yes | No | No | No |
| Marks bulk save | Yes | Yes | No | No |
| Results create/update/bulk | Yes | Yes | No | No |
| Results delete | Yes | No | No | No |
| Fee create/update/delete | Yes | No | Yes | No |
| Notice CRUD | Yes | No | No | No |
| Parent CRUD/password reset | Yes | No | No | No |
| Timetable write/import | Yes | No | No | No |
| Reports export | Yes | No | No | No |
| Leave submit | Yes | Yes | Yes | Yes (any authenticated role) |
| Leave approve/reject/delete | Yes | No | No | No |

### Access Model Observation
Many GET endpoints are guarded by authentication only (not role-specific authorization), meaning **any authenticated role can read broad operational data** unless explicitly restricted.

## User Flows
### Flow 1: Admin Login to Dashboard
1. User opens `/login`.
2. Credentials are sent to `/api/auth/login`.
3. JWT and session metadata are stored in localStorage.
4. User is routed to `/admin`.
5. Admin page loads layout and section scripts, then fetches dashboard data.

### Flow 2: Student Admission
1. Admin opens Students section and clicks `New Admission`.
2. Form submission calls `POST /api/students`.
3. Backend generates GR, admission, student ID, password.
4. UI refreshes paginated table/cards and stats.

### Flow 3: Attendance Marking and Monthly Analytics
1. Admin selects person type/date/class and loads people.
2. Statuses are set (P/A/L), then saved via `POST /api/attendance/bulk`.
3. Backend validates date rules and upserts records.
4. Monthly heatmap/report is refreshed via `/api/attendance/monthly-report`.

### Flow 4: Exam to Marks to Result Cards
1. Admin manages exam schedules in Exams tab.
2. Marks tab loads active students + existing marks by class/exam type.
3. Admin edits marks and saves via `POST /api/marks/bulk`.
4. Results tab reads grouped marks and renders graded cards.

### Flow 5: Fee Payment and Receipt
1. Admin selects class/student and enters payment amount.
2. Existing pending/partial fee is updated or new fee record is created.
3. Status recalculates (Paid/Partial/Pending), table/stats refresh.
4. Receipt is fetched via `/api/fees/:id/receipt` and printed/downloaded.

### Flow 6: Parent Provisioning
1. Admin creates parent with child links (classes 1-6 only).
2. Backend creates `PAR###`, hashes generated password, links children.
3. Credentials modal displays generated Parent ID/password.
4. Optional password change updates `/api/parents/:id/password`.

### Flow 7: Timetable Edit and Conflict Check
1. Admin enters timetable edit mode.
2. Selects cell, chooses subject/teacher (auto teacher mapping supported).
3. System checks conflict via `/api/timetable/check-conflict`.
4. Save-all applies batched updates via `/api/timetable/bulk-cells`.

## UI Components
- Layout:
- Sidebar navigation (`#sidebar-root`)
- Topbar with notifications/profile (`#topbar-root`)
- Section Panels:
- `dashboard-section`
- `students-section`
- `teachers-section`
- `attendance-section`
- `exams-section`
- `fees-section`
- `parents-section`
- `notices-section`
- `timetable-section`
- `settings-section`
- Shared interaction components:
- Search/filter bars
- Table/card view toggles
- Pagination controls
- Modal overlays for CRUD and details
- KPI stat cards with animated counters

## API Endpoints
### Public Endpoints
| Method | Path | Description |
|---|---|---|
| GET | `/api/health` | Backend health and timestamp |
| POST | `/api/auth/login` | User login |
| POST | `/api/students/access-key-login` | Parent login for class 1-6 |
| POST | `/api/parents/login` | Parent login for linked classes 1-6 |

### Auth/User
| Method | Path | Access |
|---|---|---|
| GET | `/api/auth/me` | Any authenticated user |
| POST | `/api/auth/register` | `super_admin`, `admin` |
| PUT | `/api/auth/password` | Any authenticated user |

### Students
| Method | Path | Access |
|---|---|---|
| GET | `/api/students` | Any authenticated user |
| GET | `/api/students/counts` | Any authenticated user |
| GET | `/api/students/:id` | Any authenticated user |
| POST | `/api/students` | `super_admin`, `admin` |
| PUT | `/api/students/:id` | `super_admin`, `admin` |
| DELETE | `/api/students/:id` | `super_admin`, `admin` |

### Teachers
| Method | Path | Access |
|---|---|---|
| GET | `/api/teachers` | Any authenticated user |
| GET | `/api/teachers/counts` | Any authenticated user |
| GET | `/api/teachers/:id` | Any authenticated user |
| POST | `/api/teachers` | `super_admin`, `admin` |
| PUT | `/api/teachers/:id` | `super_admin`, `admin` |
| DELETE | `/api/teachers/:id` | `super_admin`, `admin` |

### Classes
| Method | Path | Access |
|---|---|---|
| GET | `/api/classes` | Any authenticated user |
| GET | `/api/classes/:id` | Any authenticated user |
| POST | `/api/classes` | `super_admin`, `admin` |
| PUT | `/api/classes/:id` | `super_admin`, `admin` |
| DELETE | `/api/classes/:id` | `super_admin`, `admin` |

### Attendance
| Method | Path | Access |
|---|---|---|
| GET | `/api/attendance` | Any authenticated user |
| GET | `/api/attendance/people` | Any authenticated user |
| POST | `/api/attendance/bulk` | `super_admin`, `admin`, `teacher` |
| GET | `/api/attendance/summary` | Any authenticated user |
| GET | `/api/attendance/check-date` | Any authenticated user |
| GET | `/api/attendance/monthly-report` | Any authenticated user |
| GET | `/api/attendance/day` | Any authenticated user |
| GET | `/api/attendance/export` | Any authenticated user (token query param supported) |

### Dashboard
| Method | Path | Access |
|---|---|---|
| GET | `/api/dashboard/stats` | Any authenticated user |
| GET | `/api/dashboard/monthly-attendance` | Any authenticated user |
| GET | `/api/dashboard/fee-summary` | Any authenticated user |
| GET | `/api/dashboard/class-fee-summary` | Any authenticated user |
| GET | `/api/dashboard/fee-collection` | Any authenticated user |
| GET | `/api/dashboard/class-marks-progress` | Any authenticated user |
| GET | `/api/dashboard/attendance-heatmap` | Any authenticated user |
| GET | `/api/dashboard/today-attendance` | Any authenticated user |

### Exams, Marks, Results
| Method | Path | Access |
|---|---|---|
| GET | `/api/exams` | Any authenticated user |
| GET | `/api/exams/:id` | Any authenticated user |
| POST | `/api/exams` | `super_admin`, `admin` |
| PUT | `/api/exams/:id` | `super_admin`, `admin` |
| DELETE | `/api/exams/:id` | `super_admin`, `admin` |
| GET | `/api/marks` | Any authenticated user |
| POST | `/api/marks/bulk` | `super_admin`, `admin`, `teacher` |
| GET | `/api/results` | Any authenticated user |
| GET | `/api/results/:id` | Any authenticated user |
| POST | `/api/results` | `super_admin`, `admin`, `teacher` |
| PUT | `/api/results/:id` | `super_admin`, `admin`, `teacher` |
| POST | `/api/results/bulk` | `super_admin`, `admin`, `teacher` |
| DELETE | `/api/results/:id` | `super_admin`, `admin` |

### Fees and Fee Structure
| Method | Path | Access |
|---|---|---|
| GET | `/api/fees` | Any authenticated user |
| GET | `/api/fees/stats` | Any authenticated user |
| GET | `/api/fees/:id/receipt` | Any authenticated user |
| GET | `/api/fees/:id` | Any authenticated user |
| POST | `/api/fees` | `super_admin`, `admin`, `accountant` |
| PUT | `/api/fees/:id` | `super_admin`, `admin`, `accountant` |
| DELETE | `/api/fees/:id` | `super_admin`, `admin`, `accountant` |
| POST | `/api/fees/sync-students` | `super_admin`, `admin` |
| GET | `/api/fee-structure` | Any authenticated user |
| GET | `/api/fee-structure/:cls` | Any authenticated user |
| PUT | `/api/fee-structure/:cls` | `super_admin`, `admin` |

### Parents
| Method | Path | Access |
|---|---|---|
| GET | `/api/parents` | Any authenticated user |
| GET | `/api/parents/counts` | Any authenticated user |
| GET | `/api/parents/:id` | Any authenticated user |
| POST | `/api/parents` | `super_admin`, `admin` |
| PUT | `/api/parents/:id` | `super_admin`, `admin` |
| PUT | `/api/parents/:id/password` | `super_admin`, `admin` |
| DELETE | `/api/parents/:id` | `super_admin`, `admin` |

### Notices
| Method | Path | Access |
|---|---|---|
| GET | `/api/notices` | Any authenticated user |
| GET | `/api/notices/:id` | Any authenticated user |
| POST | `/api/notices` | `super_admin`, `admin` |
| PUT | `/api/notices/:id` | `super_admin`, `admin` |
| DELETE | `/api/notices/:id` | `super_admin`, `admin` |

### Timetable
| Method | Path | Access |
|---|---|---|
| GET | `/api/timetable` | Any authenticated user |
| GET | `/api/timetable/layout` | Any authenticated user |
| PUT | `/api/timetable/cell` | `super_admin`, `admin` |
| PUT | `/api/timetable/bulk-cells` | `super_admin`, `admin` |
| POST | `/api/timetable/import` | `super_admin`, `admin` |
| GET | `/api/timetable/subjects` | Any authenticated user |
| GET | `/api/timetable/teachers-for-subject` | Any authenticated user |
| GET | `/api/timetable/check-conflict` | Any authenticated user |

### Holidays and Vacations
| Method | Path | Access |
|---|---|---|
| GET | `/api/holidays/:year` | Any authenticated user |
| GET | `/api/holidays/:year/:month` | Any authenticated user |
| POST | `/api/holidays` | `super_admin`, `admin` |
| DELETE | `/api/holidays/:date` | `super_admin`, `admin` |
| POST | `/api/holidays/sync/:year` | `super_admin`, `admin` |
| GET | `/api/vacations/:year` | Any authenticated user |
| GET | `/api/vacations/check/:date` | Any authenticated user |
| POST | `/api/vacations` | `super_admin`, `admin` |
| PUT | `/api/vacations/:id` | `super_admin`, `admin` |
| DELETE | `/api/vacations/:id` | `super_admin`, `admin` |

### Staff, Leaves, Reports
| Method | Path | Access |
|---|---|---|
| GET | `/api/staff` | Any authenticated user |
| GET | `/api/staff/stats` | Any authenticated user |
| GET | `/api/staff/salary-stats` | Any authenticated user |
| GET | `/api/staff/:id` | Any authenticated user |
| POST | `/api/staff` | `super_admin`, `admin` |
| PUT | `/api/staff/:id` | `super_admin`, `admin` |
| DELETE | `/api/staff/:id` | `super_admin`, `admin` |
| GET | `/api/leaves` | Any authenticated user |
| GET | `/api/leaves/stats` | Any authenticated user |
| POST | `/api/leaves` | Any authenticated user |
| PUT | `/api/leaves/:id/approve` | `super_admin`, `admin` |
| PUT | `/api/leaves/:id/reject` | `super_admin`, `admin` |
| DELETE | `/api/leaves/:id` | `super_admin`, `admin` |
| GET | `/api/reports/school-summary` | `super_admin`, `admin` |
| GET | `/api/reports/marks` | `super_admin`, `admin` |
| GET | `/api/reports/students` | `super_admin`, `admin` |
| GET | `/api/reports/attendance` | `super_admin`, `admin` |
| GET | `/api/reports/fees` | `super_admin`, `admin` |

## Database Interaction Overview
### Core Tables
- Security/identity: `users`
- Academic master: `students`, `teachers`, `classes`, `subjects`, `teacher_subjects`, `parents`, `parent_children`
- Operations: `attendance`, `exams`, `marks`, `results`, `fees`, `fee_structure`, `notices`, `timetable`, `holidays`, `vacation_periods`, `staff`, `leave_requests`
- Dashboard cache/history: `dashboard_stats`, `monthly_attendance`, `fee_collection`

### Module-to-Table Mapping
| Module | Primary Tables | Interaction Pattern |
|---|---|---|
| Auth | `users` | validate credentials, issue token, register/update password |
| Students | `students`, `parents` | CRUD + left joins for parent info |
| Teachers | `teachers` | CRUD + derived counts |
| Attendance | `attendance`, `students`, `teachers`, `holidays`, `vacation_periods` | bulk upsert + summary/report joins |
| Exams/Marks/Results | `exams`, `marks`, `results`, `students` | schedule CRUD + marks/result aggregation |
| Fees | `fees`, `students`, `fee_structure` | payment status lifecycle + receipt enrichment |
| Parents | `parents`, `parent_children`, `students` | create/link/update/delete + child joins |
| Notices | `notices` | CRUD + target/urgent filtering |
| Timetable | `timetable`, `subjects`, `teacher_subjects`, `teachers` | generated/read/write/import/conflict check |
| Calendar | `holidays`, `vacation_periods` | CRUD + external Google sync |
| Reports | multiple | formatted export queries by domain |
| HR/Leaves | `staff`, `leave_requests` | staff CRUD + leave submit/decision |

### Key Constraints and Migrations
- Role check on `users.role`.
- Attendance uniqueness: `(person_id, person_type, date)`.
- Marks uniqueness: `(student, class, exam_type, subject)`.
- Timetable uniqueness: `(class, section, day, lecture)`.
- Results upsert index: `(student, class, exam_type)`.
- Holiday date uniqueness.
- On-start migrations add missing columns/indexes and fix legacy attendance uniqueness.

## Data Flow
### UI to API to DB
1. UI action triggers helper in `public/js/admin.js`.
2. Helper calls service wrapper in `public/js/api.js`.
3. API wrapper attaches bearer token from localStorage.
4. Express route executes business logic and SQL.
5. JSON/CSV/HTML response is rendered or downloaded.

### Cross-Module Data Dependencies
- Fees update may synchronize `students.fees`.
- Parent create/update updates linked `students.parent_id` and `students.parent`.
- Attendance reports merge holiday and vacation periods.
- Dashboard aggregates from students, teachers, attendance, fees, exams, marks/results.
- Timetable teacher mapping depends on `teachers`, `subjects`, and `teacher_subjects`.

## System Dependencies
### Backend
- `express`, `cors`, `dotenv`
- `better-sqlite3`
- `jsonwebtoken`, `bcryptjs`
- `googleapis` (holiday sync)

### Frontend
- React stack: `react`, `react-dom`, `react-router-dom`
- Build/dev: `vite`, `@vitejs/plugin-react`
- Document export libs present: `jspdf`, `jspdf-autotable`
- Styling/icons: project CSS + Font Awesome CDN

### Runtime/Config
- Environment (`backend/.env`): `PORT`, `JWT_SECRET`, `JWT_EXPIRES_IN`, `DB_PATH`, `CORS_ORIGIN`
- Local startup orchestrated by `run.bat`

## Assumptions and Constraints
- Primary usable experience is admin-oriented; non-admin dashboards are not fully implemented.
- React app composes legacy DOM and scripts; maintainability depends on global JS conventions.
- Several frontend modules fall back to mock data when APIs fail, which can mask backend outages in demos.
- Fees are intentionally applicable to classes 9 and 10 only in backend validations.
- Parent workflows are class-band specific:
- Class 1-6: access-key login
- Parent ID/password accounts for linked classes 1-6
- Google holiday sync requires valid API key configuration.
- Database is file-based SQLite; concurrency/scalability constraints apply for larger deployments.
- Reports are admin-only by route-level authorization.
- Current permissions emphasize write restrictions; many reads are available to any authenticated role.

## Future Scope
- Implement dedicated teacher, student, and parent dashboards/routes.
- Align role-based read permissions with least-privilege data access.
- Add automated tests (API, integration, and UI regression).
- Move profile/settings changes to persisted backend endpoints.
- Consolidate duplicate frontend code paths between `frontend/` and `frontend-react/public/`.
- Add audit logging for sensitive operations (fees, marks, account changes).

