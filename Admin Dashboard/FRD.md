# Functional Requirements Document (FRD)
## Smart School Management System (SSMS)

Document version: 1.0  
Generated on: 14 March 2026  
Codebase analyzed: `backend`, `frontend`, `frontend-react`

## Project Overview
SSMS is a school administration platform with:
1. A Node.js + Express backend API.
2. SQLite-based persistent storage.
3. A React + Vite admin frontend (`frontend-react`) that reuses a legacy JS module layer.
4. A legacy static frontend (`frontend`) still served by backend static hosting.

The system provides school operations management across academics, attendance, exams, fees, parents, notices, timetable, reporting, holidays, and vacations.

## System Architecture Overview
| Layer | Technology | Responsibility |
|---|---|---|
| Client UI (current) | React 18 + Vite + React Router | Login screen, protected admin route, shell hosting admin modules |
| Client UI (legacy) | Static HTML/CSS/JS | Legacy admin and multi-role login pages |
| Frontend logic layer | Plain JS (`api.js`, `auth.js`, `layout.js`, `admin.js`) | API calls, session logic, section rendering, CRUD workflows |
| API layer | Express 4 | Route handling, validation, role checks, response shaping |
| Auth layer | JWT (`jsonwebtoken`) + bcrypt | Login, token auth, password hashing/verification |
| Data layer | SQLite (`better-sqlite3`) | Persistent domain storage, reporting queries, migrations |
| External integration | Google Calendar API (`googleapis`) | Optional holiday sync into local calendar table |

### Runtime Topology
1. React dev server runs on `5173` and proxies `/api` to backend `5000`.
2. Backend serves APIs and also serves legacy static frontend from `/frontend`.
3. Session and token state are stored in browser `localStorage`.

## User Roles and Access Levels
### Roles in System
1. `super_admin`
2. `admin`
3. `teacher`
4. `accountant`
5. `student`
6. `parent`

### Access Model
| Area | Access Rule |
|---|---|
| React admin panel `/admin` | Only `super_admin`, `admin` (route-protected) |
| Authenticated API reads | Mostly any authenticated role (JWT required) |
| Administrative writes | Endpoint-level role checks via `authorize(...)` |
| Reports API | Only `super_admin`, `admin` |
| Public APIs | Auth login, parent login, student access-key login, health check |

### Effective Permission Summary
| Capability Group | Allowed Roles |
|---|---|
| User registration | `super_admin`, `admin` |
| Students CRUD | `super_admin`, `admin` |
| Teachers CRUD | `super_admin`, `admin` |
| Exams CRUD | `super_admin`, `admin` |
| Marks/Results write | `super_admin`, `admin`, `teacher` |
| Fees write | `super_admin`, `admin`, `accountant` |
| Notices write | `super_admin`, `admin` |
| Timetable write/import | `super_admin`, `admin` |
| Holidays/Vacations write | `super_admin`, `admin` |
| Parents CRUD/password reset | `super_admin`, `admin` |
| Reports download | `super_admin`, `admin` |
| Leave approval/rejection | `super_admin`, `admin` |

## Complete Module List
| Module ID | Module | Layer(s) | Status |
|---|---|---|---|
| M01 | Authentication & Session | Backend + Frontend | Implemented |
| M02 | Dashboard Analytics | Backend + Frontend | Implemented |
| M03 | Student Management | Backend + Frontend | Implemented |
| M04 | Teacher Management | Backend + Frontend | Implemented |
| M05 | Attendance Management | Backend + Frontend | Implemented |
| M06 | Exams Scheduling | Backend + Frontend | Implemented |
| M07 | Marks Entry | Backend + Frontend | Implemented |
| M08 | Results Management | Backend + Frontend | Implemented |
| M09 | Fee Management & Receipts | Backend + Frontend | Implemented |
| M10 | Fee Structure | Backend + Frontend | Implemented |
| M11 | Parent Management | Backend + Frontend | Implemented |
| M12 | Notices | Backend + Frontend | Implemented |
| M13 | Timetable Management | Backend + Frontend | Implemented |
| M14 | Holidays & Vacations | Backend + Frontend | Implemented |
| M15 | Reports Export | Backend + Frontend | Implemented |
| M16 | Classes Master | Backend API | Implemented (limited UI usage) |
| M17 | Staff Management | Backend API | Implemented (not surfaced in current admin UI) |
| M18 | Leave Requests | Backend API | Implemented (not surfaced in current admin UI) |
| M19 | Settings & Profile | Frontend | Implemented (mostly UI-level) |

## Feature List Per Module and Functional Descriptions
## M01. Authentication & Session
1. Email/password login for system users with JWT issuance.
2. Parent login for linked Class 1-6 records via `parent_id` + password.
3. Parent login for Class 1-6 via `student_id` + `parent_access_key`.
4. Token validation middleware on protected APIs.
5. Role-based access guard middleware.
6. Password change for authenticated users.
7. User registration endpoint restricted to admin roles.
8. Frontend session TTL enforcement (8 hours) via localStorage.

## M02. Dashboard Analytics
1. Live KPI aggregation for students, teachers, classes, attendance, fees, exams.
2. Real-time today attendance split by student and teacher.
3. Attendance heatmap data for academic year period.
4. Monthly attendance and fee collection chart data feeds.
5. Class-wise fee collection summary.
6. Class-wise marks progress and overall academic average.
7. Dashboard section-level quick navigation to operational modules.

## M03. Student Management
1. Student listing with pagination, search, class/section/status filtering.
2. Dynamic stat cards: total, active, inactive, fee-pending.
3. Student creation with auto-generated:
4. GR number.
5. Admission number.
6. Student ID.
7. Student password.
8. Parent access key generation for Classes 1-6 from phone digits.
9. Conditional fee status logic:
10. Classes outside 1-6 use `Paid` as the default fee status.
11. Classes 1-6 use pending/partial/paid flow.
12. Student update and delete operations.
13. Student detail view with linked parent enrichment for Class 1-6 links.
14. Table and card presentation modes.

## M04. Teacher Management
1. Teacher listing with pagination and search/status filters.
2. Teacher stats: total, active, subjects, average salary.
3. Teacher creation with auto-generated:
4. Employee ID (`EMP-xxx`).
5. Teacher ID (`TCH<year><seq>`).
6. Teacher password.
7. Full teacher CRUD.
8. Table/card presentation.

## M05. Attendance Management
1. Attendance target toggle for `student` or `teacher`.
2. People loader by role and class.
3. Per-record status marking (`P`, `A`, `L`) with bulk actions.
4. Date validation rules:
5. No future dates.
6. No holidays.
7. No Sundays.
8. Bulk upsert save with duplicate handling and change counts.
9. Monthly heatmap report with:
10. Working day calculation.
11. Vacation and holiday overlay.
12. Person-wise monthly attendance percentages.
13. Day-level drilldown modal for clicked heatmap date.
14. CSV export for attendance data.

## M06. Exams Scheduling
1. Exam list and filters by class.
2. Exam creation/update/delete.
3. Subject list constrained by class-level subject pools.
4. Status and schedule visualization.

## M07. Marks Entry
1. Class + section + exam-type scoped marks load.
2. Subject sets adapt by standard group:
3. Primary (Class 1-5).
4. Upper (Class 6-10).
5. Per-subject marks entry with validation boundaries `0..100`.
6. Live total/percentage/grade recalculation.
7. Bulk upsert save into `marks` table.

## M08. Results Management
1. Legacy results CRUD endpoint (`results`) retained.
2. Marks-driven result cards generated from `marks` data.
3. Grade and pass/fail visualization.
4. Filters by class, exam type, section, grade, and student search.

## M09. Fee Management & Receipts
1. Fee listing with search/status filtering and pagination.
2. Fee stats: collected, pending, partial, collection rate.
3. Class applicability rule:
4. Fee operations restricted to Class 1-6.
5. Add/update/delete fee records with computed due/status.
6. Payment modal with:
7. Class-section selection.
8. Student selection/autocomplete.
9. Existing balance detection.
10. Existing fully paid lockout.
11. Receipt generation and receipt timestamping (`receipt_at`).
12. Receipt print and download.
13. Student fee status synchronization from fee records.

## M10. Fee Structure
1. Per-class fee components (`total`, `tuition`, `lab`, `sports`, `misc`, `accent`).
2. Upsert-style update API by class.
3. Used by dashboard fee analytics and fee entry calculations.

## M11. Parent Management
1. Parent account creation for Class 1-6 student guardians.
2. Parent ID auto-generation (`PARxxx`).
3. Parent password auto-generation pattern from name + phone.
4. Child linking via junction table.
5. Synchronization of `students.parent_id` and `students.parent` fields.
6. Parent list with child details.
7. Parent profile detail modal.
8. Parent update/delete/password reset.
9. Parent credentials modal after creation.

## M12. Notices
1. Notice CRUD with target audience and urgency flag.
2. Filtering by audience, urgency, and search text.
3. Dashboard recent notices integration.
4. Notification dropdown badge and session-level dismiss behavior.

## M13. Timetable Management
1. Timetable view by standard and section.
2. Auto-generated timetable fallback when no uploaded timetable exists.
3. JSON timetable import.
4. Download current timetable layout template.
5. Edit mode for per-cell subject/teacher updates.
6. Bulk save of changed cells.
7. Teacher auto-assignment for selected subject.
8. Teacher conflict check API integration.
9. Timetable print and CSV export.

## M14. Holidays & Vacations
1. Holiday retrieval by year or month.
2. Optional Google Calendar sync for public holiday source.
3. Manual holiday add/delete.
4. Vacation period CRUD.
5. Attendance module integration for:
6. Blocking attendance on holidays/vacations.
7. Heatmap visual overlays.

## M15. Reports Export
1. School summary report (HTML printable).
2. Marks report in HTML and CSV.
3. Student list report in HTML and CSV.
4. Attendance report in HTML and CSV.
5. Fees report in HTML and CSV.
6. Report endpoints protected to admin roles.

## M16. Classes Master (API)
1. Classes CRUD endpoints.
2. Used for dashboard aggregates and master data.

## M17. Staff Management (API)
1. Staff CRUD.
2. Staff stats and salary stats endpoints.
3. Present in backend but not currently rendered in React admin sections.

## M18. Leave Requests (API)
1. Leave request creation.
2. Leave listing and status summary.
3. Admin approval/rejection/delete operations.
4. Present in backend but not currently rendered in React admin sections.

## M19. Settings & Profile
1. Display of current user identity details.
2. UI-driven profile edit interactions.
3. UI-driven password update feedback.
4. Server health and storage cards are currently display-focused (no backend write binding).

## Workflow Description
## WF-01: Admin Login to Admin Panel
1. User submits email/password.
2. Frontend calls `POST /api/auth/login`.
3. Backend validates user with bcrypt and returns JWT.
4. Frontend stores token/session and routes to `/admin`.
5. Protected route validates session and role (`super_admin` or `admin`).

## WF-02: Parent Login (Class 1-6)
1. Parent enters `student_id` and access key.
2. Frontend calls `POST /api/students/access-key-login`.
3. Backend validates class band and key.
4. Parent JWT issued with student context.

## WF-03: Parent Login (Parent ID for Class 1-6)
1. Parent enters `parent_id` + password.
2. Frontend calls `POST /api/parents/login`.
3. Backend validates status + password hash.
4. Parent JWT issued with parent context.

## WF-04: Student Admission Creation
1. Admin opens new admission modal.
2. Frontend collects student profile and class info.
3. Backend auto-generates identifiers and access credentials.
4. Student inserted; frontend refreshes table/stats.

## WF-05: Parent Creation and Child Linking
1. Admin creates parent profile and selects children (Class 1-6).
2. Backend creates parent and links records in junction table.
3. Backend updates linked students with `parent_id` and parent name.
4. Frontend displays generated Parent ID/password.

## WF-06: Daily Attendance Marking
1. Admin/teacher chooses date and person type.
2. Frontend loads student/teacher roster.
3. User marks statuses in grid and submits.
4. Backend validates date rules and performs bulk upsert.
5. Summary and heatmap data are refreshed.

## WF-07: Marks Entry and Save
1. Admin selects class/section/exam type.
2. Frontend loads student list and existing marks.
3. User enters subject marks.
4. Frontend recalculates totals/grades client-side.
5. Backend bulk-upserts into `marks`.

## WF-08: Fee Payment and Receipt
1. Admin/accountant selects class and student.
2. Frontend checks existing fee state.
3. User submits payment amount/date/month.
4. Backend inserts/updates fee, recalculates due/status.
5. Receipt endpoint returns enriched data and stamps `receipt_at`.
6. Frontend prints/downloads receipt and refreshes fee status.

## WF-09: Timetable Update
1. User loads timetable by standard/section.
2. User chooses JSON import or edit mode.
3. On edit, cell changes are staged and bulk-saved.
4. Backend upserts timetable cells and serves updated schedule.

## WF-10: Report Export
1. User selects report type and format.
2. Frontend requests `/api/reports/...` with JWT.
3. Backend compiles SQL summary and emits HTML/CSV.
4. Browser downloads generated file.

## API Endpoints
### Public Endpoints
| Method | Path | Description |
|---|---|---|
| POST | `/api/auth/login` | User login |
| POST | `/api/students/access-key-login` | Parent login for Class 1-6 students |
| POST | `/api/parents/login` | Parent login for linked Class 1-6 records |
| GET | `/api/health` | Health check |

### Auth & User Endpoints
| Method | Path | Access | Description |
|---|---|---|---|
| GET | `/api/auth/me` | JWT | Current user profile |
| POST | `/api/auth/register` | JWT (admin check in handler) | Create user |
| PUT | `/api/auth/password` | JWT | Change own password |

### Student Endpoints
| Method | Path | Access |
|---|---|---|
| GET | `/api/students` | JWT |
| GET | `/api/students/counts` | JWT |
| GET | `/api/students/:id` | JWT |
| POST | `/api/students` | JWT + `super_admin|admin` |
| PUT | `/api/students/:id` | JWT + `super_admin|admin` |
| DELETE | `/api/students/:id` | JWT + `super_admin|admin` |

### Teacher Endpoints
| Method | Path | Access |
|---|---|---|
| GET | `/api/teachers` | JWT |
| GET | `/api/teachers/counts` | JWT |
| GET | `/api/teachers/:id` | JWT |
| POST | `/api/teachers` | JWT + `super_admin|admin` |
| PUT | `/api/teachers/:id` | JWT + `super_admin|admin` |
| DELETE | `/api/teachers/:id` | JWT + `super_admin|admin` |

### Attendance Endpoints
| Method | Path | Access |
|---|---|---|
| GET | `/api/attendance` | JWT |
| GET | `/api/attendance/people` | JWT |
| POST | `/api/attendance/bulk` | JWT + `super_admin|admin|teacher` |
| GET | `/api/attendance/summary` | JWT |
| GET | `/api/attendance/check-date` | JWT |
| GET | `/api/attendance/monthly-report` | JWT |
| GET | `/api/attendance/day` | JWT |
| GET | `/api/attendance/export` | JWT |

### Exam & Marks Endpoints
| Method | Path | Access |
|---|---|---|
| GET | `/api/exams` | JWT |
| GET | `/api/exams/:id` | JWT |
| POST | `/api/exams` | JWT + `super_admin|admin` |
| PUT | `/api/exams/:id` | JWT + `super_admin|admin` |
| DELETE | `/api/exams/:id` | JWT + `super_admin|admin` |
| GET | `/api/marks` | JWT |
| POST | `/api/marks/bulk` | JWT + `super_admin|admin|teacher` |
| GET | `/api/results` | JWT |
| GET | `/api/results/:id` | JWT |
| POST | `/api/results` | JWT + `super_admin|admin|teacher` |
| PUT | `/api/results/:id` | JWT + `super_admin|admin|teacher` |
| POST | `/api/results/bulk` | JWT + `super_admin|admin|teacher` |
| DELETE | `/api/results/:id` | JWT + `super_admin|admin` |

### Fee Endpoints
| Method | Path | Access |
|---|---|---|
| GET | `/api/fee-structure` | JWT |
| GET | `/api/fee-structure/:cls` | JWT |
| PUT | `/api/fee-structure/:cls` | JWT + `super_admin|admin` |
| GET | `/api/fees` | JWT |
| GET | `/api/fees/stats` | JWT |
| GET | `/api/fees/:id` | JWT |
| GET | `/api/fees/:id/receipt` | JWT |
| POST | `/api/fees` | JWT + `super_admin|admin|accountant` |
| PUT | `/api/fees/:id` | JWT + `super_admin|admin|accountant` |
| DELETE | `/api/fees/:id` | JWT + `super_admin|admin|accountant` |
| POST | `/api/fees/sync-students` | JWT + `super_admin|admin` |

### Parent Endpoints
| Method | Path | Access |
|---|---|---|
| GET | `/api/parents` | JWT |
| GET | `/api/parents/counts` | JWT |
| GET | `/api/parents/:id` | JWT |
| POST | `/api/parents` | JWT + `super_admin|admin` |
| PUT | `/api/parents/:id` | JWT + `super_admin|admin` |
| PUT | `/api/parents/:id/password` | JWT + `super_admin|admin` |
| DELETE | `/api/parents/:id` | JWT + `super_admin|admin` |

### Notice Endpoints
| Method | Path | Access |
|---|---|---|
| GET | `/api/notices` | JWT |
| GET | `/api/notices/:id` | JWT |
| POST | `/api/notices` | JWT + `super_admin|admin` |
| PUT | `/api/notices/:id` | JWT + `super_admin|admin` |
| DELETE | `/api/notices/:id` | JWT + `super_admin|admin` |

### Timetable Endpoints
| Method | Path | Access |
|---|---|---|
| GET | `/api/timetable` | JWT |
| GET | `/api/timetable/layout` | JWT |
| GET | `/api/timetable/subjects` | JWT |
| GET | `/api/timetable/teachers-for-subject` | JWT |
| GET | `/api/timetable/check-conflict` | JWT |
| PUT | `/api/timetable/cell` | JWT + `super_admin|admin` |
| PUT | `/api/timetable/bulk-cells` | JWT + `super_admin|admin` |
| POST | `/api/timetable/import` | JWT + `super_admin|admin` |

### Holiday & Vacation Endpoints
| Method | Path | Access |
|---|---|---|
| GET | `/api/holidays/:year` | JWT |
| GET | `/api/holidays/:year/:month` | JWT |
| POST | `/api/holidays` | JWT + `super_admin|admin` |
| DELETE | `/api/holidays/:date` | JWT + `super_admin|admin` |
| POST | `/api/holidays/sync/:year` | JWT + `super_admin|admin` |
| GET | `/api/vacations/:year` | JWT |
| GET | `/api/vacations/check/:date` | JWT |
| POST | `/api/vacations` | JWT + `super_admin|admin` |
| PUT | `/api/vacations/:id` | JWT + `super_admin|admin` |
| DELETE | `/api/vacations/:id` | JWT + `super_admin|admin` |

### Dashboard Endpoints
| Method | Path | Access |
|---|---|---|
| GET | `/api/dashboard/stats` | JWT |
| GET | `/api/dashboard/monthly-attendance` | JWT |
| GET | `/api/dashboard/fee-summary` | JWT |
| GET | `/api/dashboard/class-fee-summary` | JWT |
| GET | `/api/dashboard/fee-collection` | JWT |
| GET | `/api/dashboard/class-marks-progress` | JWT |
| GET | `/api/dashboard/attendance-heatmap` | JWT |
| GET | `/api/dashboard/today-attendance` | JWT |

### Reports Endpoints
All report endpoints require JWT + `super_admin|admin`.
1. `GET /api/reports/school-summary`
2. `GET /api/reports/marks`
3. `GET /api/reports/students`
4. `GET /api/reports/attendance`
5. `GET /api/reports/fees`

### Additional API Modules
| Module | Endpoints | Access |
|---|---|---|
| Classes | `GET/POST /api/classes`, `GET/PUT/DELETE /api/classes/:id` | JWT; write = admin roles |
| Staff | `/api/staff`, `/api/staff/stats`, `/api/staff/salary-stats`, `/api/staff/:id` | JWT; write = admin roles |
| Leaves | `/api/leaves`, `/api/leaves/stats`, `/api/leaves/:id/(approve|reject)` | JWT; approvals = admin roles |

## Database Interaction Overview
### Database Technology
1. SQLite file: `backend/database.sqlite`.
2. Access library: `better-sqlite3` (synchronous).
3. WAL mode enabled.
4. Foreign key constraints enabled.

### Core Data Entities
| Table | Purpose |
|---|---|
| `users` | System login identities with role |
| `students` | Student master records, auth IDs, fee state, parent links |
| `teachers` | Teacher master records with credentials and assignments |
| `parents` | Parent account records |
| `parent_children` | Parent-student many-to-many linkage |
| `attendance` | Per-person daily attendance (`P/A/L`) |
| `exams` | Exam schedule metadata |
| `marks` | Flexible subject-wise marks per student/class/exam |
| `results` | Legacy result structure with fixed subjects |
| `fees` | Payment ledger per student/month/class |
| `fee_structure` | Class-wise fee policy |
| `notices` | Announcement records |
| `timetable` | Lecture timetable cells |
| `subjects` | Subject master by standard |
| `teacher_subjects` | Teacher-subject-standard mapping |
| `holidays` | Holiday calendar entries |
| `vacation_periods` | Date ranges for vacation breaks |
| `classes` | Class master |
| `staff` | HR staff records |
| `leave_requests` | Leave application and approval states |
| `monthly_attendance` | Dashboard trend source |
| `fee_collection` | Dashboard trend source |
| `dashboard_stats` | Legacy stats cache table (live stats still computed dynamically) |

### Key Constraints and Relationships
1. `users.role` constrained to known roles.
2. `parent_children` enforces unique parent-student links.
3. `attendance` unique key on `(person_id, person_type, date)`.
4. `marks` unique key on `(student, class, exam_type, subject)`.
5. `results` has unique index on `(student, class, exam_type)` for bulk upsert.
6. `timetable` unique key on `(class, section, day, lecture)`.
7. `holidays.holiday_date` unique.

### Database Migration Behavior in Code
1. Conditional table creation (`CREATE TABLE IF NOT EXISTS`).
2. Conditional column additions (students, fees, results).
3. Attendance table unique-key migration for older schema versions.
4. Index creation for attendance and timetable query performance.

## Data Flow Between Components
## Primary Data Flow
1. UI event occurs in admin section.
2. `admin.js` invokes helper in `api.js`.
3. `api.js` attaches JWT and calls backend route.
4. Route validates auth/role and request payload.
5. Route executes SQL read/write on SQLite.
6. JSON/CSV/HTML response returns to frontend.
7. Frontend updates section state and re-renders.

## Secondary Data Flow
1. Google Calendar sync fetches remote holiday events.
2. Service upserts holiday dates into local `holidays` table.
3. Attendance and heatmap modules consume merged holiday/vacation data.

## System Dependencies
### Backend
1. `express`
2. `cors`
3. `dotenv`
4. `better-sqlite3`
5. `jsonwebtoken`
6. `bcryptjs`
7. `googleapis`

### Frontend (React App)
1. `react`
2. `react-dom`
3. `react-router-dom`
4. `vite`
5. `@vitejs/plugin-react`
6. `jspdf`
7. `jspdf-autotable`
8. Font Awesome CDN

### Environment Variables
1. `PORT`
2. `JWT_SECRET`
3. `JWT_EXPIRES_IN`
4. `DB_PATH`
5. `CORS_ORIGIN`
6. `GOOGLE_CALENDAR_API_KEY` (optional)
7. `GOOGLE_CALENDAR_ID` (optional override)

## Assumptions and Constraints
1. Admin panel is effectively designed for `super_admin` and `admin` in current React routing.
2. Backend APIs support more roles than the currently exposed React UI.
3. Fee workflow is intentionally constrained to Class 1-6.
4. Parent authentication is split by class range:
5. Class 1-6 uses student access key.
6. Parent account credentials are used for linked Class 1-6 records.
7. Several joins are name-based (`students.name` to fee/marks/results), which assumes stable spelling and uniqueness.
8. Reports are generated on-demand and returned as downloadable HTML/CSV.
9. If backend is unreachable, frontend can fall back to mock datasets for selected modules.
10. Legacy static frontend and React frontend coexist; behavior differs by entry path.
11. Vacation route ordering currently places `/:year` before `/check/:date`, which may affect route matching for `GET /api/vacations/check/:date`.
12. Default JWT secret fallback exists in code and should be overridden in production environments.
