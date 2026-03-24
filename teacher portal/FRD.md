# Functional Requirements Document (FRD)

## 1) Project Overview

### 1.1 Project Name
Smart School / Teacher Portal Management System

### 1.2 Purpose
This system provides a teacher-focused portal for managing daily academic and administrative activities, including attendance, assignments, exams, marks, student records, communication, study materials, leave, analytics, and reports.

### 1.3 Scope
The current implementation includes:
- React-based frontend (teacher portal UI)
- Node.js + Express backend APIs
- MongoDB data models via Mongoose
- JWT-based authentication/authorization middleware
- File upload support (study materials, assignments)
- Hybrid data behavior: database-backed + localStorage/mock fallback paths in several modules

---

## 2) System Architecture Overview

### 2.1 High-Level Architecture
- **Frontend:** React (single-page app, page switching via local state)
- **Backend:** Express REST API server
- **Database:** MongoDB (Mongoose ODM)
- **Auth:** JWT token in `Authorization: Bearer <token>` header
- **File Handling:** Multer for multipart upload; PDFKit for report PDF generation (attendance route)

### 2.2 Runtime Flow
1. User logs in from frontend.
2. Token and user payload are stored in browser localStorage.
3. Frontend calls backend APIs using Axios.
4. Backend routes pass through middleware (authentication/role checks where configured).
5. Controllers execute business logic and Mongoose operations.
6. Response returns to frontend; UI renders server data or fallback/mock data.

### 2.3 Deployment/Startup Behavior
- Backend starts on configured port even if MongoDB is unavailable (limited mode).
- If DB is unavailable, certain features (notably study materials, and many frontend modules via local mock logic) still provide degraded behavior.

---

## 3) User Roles and Access Levels

### 3.1 Defined Roles (Backend Model + Middleware)
- Admin
- Teacher
- Student
- Parent
- Accountant

### 3.2 Effective Role Support in Current UI
- **Teacher role is the only fully implemented frontend role.**
- Login UI uses teacher credential matching from local static teacher data.

### 3.3 Access Control Rules
- JWT authentication middleware validates token and loads user context.
- Role middleware exists for all roles; teacher-protected endpoints are implemented under `/api/teacher/*`.
- Some route groups (e.g., `/api/student/*`, `/api/class/*`, `/api/exam/*`) currently have no explicit auth middleware.

---

## 4) Complete Module List

### 4.1 Frontend Modules
1. Authentication (Login)
2. Dashboard
3. Attendance Management
4. Class Management
5. Assignment Management
6. Exam Management
7. Marks Management
8. Student Management
9. Communication
10. Study Materials
11. Leave Management
12. Performance Analytics
13. Reports
14. Sidebar Navigation / App Shell

### 4.2 Backend Route Modules
1. Auth (`/api/auth`)
2. Teacher Core (`/api/teacher`)
3. Student Management (`/api/student`)
4. Attendance (`/api/attendance`)
5. Assignments (`/api/assignments`)
6. Class Management (`/api/class`)
7. Attendance Management (`/api/attendance-management`)
8. Assignment Management (`/api/assignment`)
9. Exam Management (`/api/exam`)
10. Communication (`/api/communication`)
11. Study Materials (`/api/study`)
12. Leave Management (`/api/leave`)
13. Performance Analytics (`/api/analytics`)
14. Reports (`/api/reports`)

### 4.3 Data Model Modules
- User
- Class
- Student
- Assignment
- Attendance
- Exam
- Mark
- StudyMaterial
- LeaveApplication
- Subject
- Announcement
- AcademicYear
- Teacher (legacy/alternate)
- StudentMarks (legacy/alternate)

---

## 5) Feature List per Module (with Functional Description)

## 5.1 Authentication
- **Teacher sign-in UI**
  - Email/password entry, role display, class/division preview.
  - On success stores token + user profile in localStorage.
- **Auth APIs**
  - Register, login, current user profile, password recovery/reset, profile update, password change.

## 5.2 Dashboard
- Teacher summary cards and schedule snapshots.
- Today classes, pending tasks, announcements, upcoming exams.
- Attendance summary read from localStorage (daily persistence).
- PTM-related task visibility via localStorage synchronization.
- Profile panel and utility actions (UI-driven).

## 5.3 Attendance Management
- Class/date-based attendance marking.
- Student-wise status, uniform compliance, ID card compliance, remarks.
- Bulk save behavior and local persistence by class/date.
- Reporting and exports (PDF/Excel from frontend utilities).
- SMS trigger attempt for absentees (API call path present).

## 5.4 Class Management
- Assigned class display and selection logic.
- Timetable view.
- Lesson planning UI + storage.
- Syllabus chapter/subtopic tracking with completion toggles.
- Seating arrangement and classroom planning helpers.

## 5.5 Assignment Management
- Create/edit/delete assignments.
- Attach files and set deadlines.
- Auto/manual grading workflow controls.
- Submission tracking and per-student grading.
- Local persistence fallback for assignments, submissions, and grading state.

## 5.6 Exam Management
- Create/edit/delete exams.
- Exam listing and result workflows.
- Class/exam selection for marks entry.
- Publish-result workflow trigger.
- CSV/XLSX exports and local fallback data generation.

## 5.7 Marks Management
- Consolidated marks sheet by class + exam.
- Subject-wise marks grid and computed total/average/grade.
- Export to CSV.
- Uses generated/mock student/marks data in current implementation.

## 5.8 Student Management
- Student profile listing and selection.
- Academic/performance data views.
- Behavior remarks addition.
- Health record view/edit (age/allergy/health info updates).
- PTM scheduling, rescheduling, status update, cancellation.

## 5.9 Communication
- Message compose by recipient type (class/student/section logic).
- Announcement-style communication entries.
- Student search and selection UX.
- Conversations and announcements currently backed by mock data.

## 5.10 Study Materials
- Upload materials with metadata (title, class, subject, type, description).
- Supports types: pdf, video, image, document, link.
- File upload with multipart form-data and server-side validation.
- Material listing + deletion actions in UI.
- Fallback mode support for temporary upload/list if DB unavailable.

## 5.11 Leave Management
- Teacher leave application creation.
- View leave application history/status.
- Parent leave requests overview and action handling (local storage simulation).
- PDF export support for leave records.

## 5.12 Performance Analytics
- Class performance, subject performance, weak students, attendance overview.
- Grade distribution and top performers.
- Weekly attendance/uniform/ID compliance trends.
- Syllabus progress integration from localStorage when available.

## 5.13 Reports
- Marks, assignment, performance-oriented report generation.
- Student-centric full profile extraction including personal, health, attendance, marks, assignments.
- PDF report generation using jsPDF/autotable.
- Export paths via frontend and report APIs.

---

## 6) Workflow Description

## 6.1 Login Workflow
1. Teacher enters credentials.
2. Frontend validates against local teacher dataset.
3. Token and user profile are stored in localStorage.
4. Main app shell loads teacher modules.

## 6.2 Attendance Workflow
1. Teacher selects class/date.
2. Student attendance statuses are edited.
3. Data is saved locally and optionally posted to attendance API.
4. Dashboard reads summarized attendance metrics.

## 6.3 Assignment Workflow
1. Teacher creates assignment (class, subject, due date, marks, type, file).
2. Assignment list displays active/past items.
3. Submission review and grading executed per student.
4. Results are persisted through API or local fallback.

## 6.4 Exam + Marks Workflow
1. Teacher creates exam schedule.
2. Marks are entered per student and subject.
3. Grade and percentage are computed.
4. Results can be exported and published (where endpoint available).

## 6.5 Student Health/PTM Workflow
1. Teacher opens student profile.
2. Updates health record fields.
3. Schedules/updates/cancels PTM meetings.
4. System returns updated data or mock PTM responses.

## 6.6 Study Material Upload Workflow
1. Teacher opens upload form and selects material metadata/type.
2. If file-type material, upload uses multipart with file.
3. Backend validates type/size and stores metadata/file.
4. If DB unavailable, fallback mode keeps temporary in-memory list.

## 6.7 Leave Workflow
1. Teacher submits leave request with date range and reason.
2. System validates constraints (e.g., UI-enforced max duration).
3. Leave record is persisted via API or retained in local fallback mode.

---

## 7) API Endpoints Catalog

> Base URL: `http://localhost:5000`

## 7.1 Authentication (`/api/auth`)

| Method | Endpoint | Purpose |
|---|---|---|
| POST | /api/auth/register | Create user account |
| POST | /api/auth/login | Login and issue JWT |
| POST | /api/auth/teacher-info | Fetch teacher class/division preview |
| POST | /api/auth/forgot-password | Generate password reset token |
| PUT | /api/auth/reset-password | Reset password by token |
| GET | /api/auth/me | Current authenticated user |
| PUT | /api/auth/profile | Update profile |
| PUT | /api/auth/change-password | Change password |

## 7.2 Teacher Core (`/api/teacher`)

| Method | Endpoint | Purpose |
|---|---|---|
| GET | /api/teacher/dashboard | Teacher dashboard data |
| GET | /api/teacher/classes | Get classes assigned to teacher |
| GET | /api/teacher/classes/:classId | Class details |
| GET | /api/teacher/classes/:classId/students | Students in class |
| GET | /api/teacher/assignments | List teacher assignments |
| POST | /api/teacher/assignments | Create assignment |
| GET | /api/teacher/exams | List teacher exams |
| POST | /api/teacher/exams | Create exam |
| GET | /api/teacher/study-materials | List study materials |
| POST | /api/teacher/study-materials | Upload/create study material |
| GET | /api/teacher/attendance | Get attendance records |
| POST | /api/teacher/attendance | Mark attendance |
| GET | /api/teacher/marks | Get marks records |
| POST | /api/teacher/marks | Enter/update marks |
| GET | /api/teacher/leaves | Get leave applications |
| POST | /api/teacher/leaves | Apply for leave |
| GET | /api/teacher/analytics | Teacher analytics summary |

## 7.3 Student Management (`/api/student`)

| Method | Endpoint | Purpose |
|---|---|---|
| GET | /api/student/profile | Student profile |
| GET | /api/student/all | All students (optional class filter) |
| GET | /api/student/academic-history | Academic history |
| GET | /api/student/performance | Student/class performance |
| POST | /api/student/remarks | Add behavior remark |
| GET | /api/student/health-records | Read health record |
| PUT | /api/student/health-records | Update health record |
| GET | /api/student/ptm-scheduled | List PTM meetings (mock) |
| POST | /api/student/ptm-schedule | Create PTM meeting |
| PUT | /api/student/ptm-update/:meetingId | Update PTM meeting |
| DELETE | /api/student/ptm-cancel/:meetingId | Cancel PTM meeting |

## 7.4 Attendance (`/api/attendance`)

| Method | Endpoint | Purpose |
|---|---|---|
| POST | /api/attendance/mark | Save attendance |
| GET | /api/attendance/report/:classId/:date | Generate PDF attendance report |

## 7.5 Assignments (`/api/assignments`)

| Method | Endpoint | Purpose |
|---|---|---|
| POST | /api/assignments/create | Create assignment with file |
| GET | /api/assignments/pending | Pending assignment count |

## 7.6 Class Management (`/api/class`)

| Method | Endpoint | Purpose |
|---|---|---|
| GET | /api/class/assigned | Assigned classes (stub) |
| GET | /api/class/subjects | Subject allocation (stub) |
| GET | /api/class/timetable | Timetable (stub) |
| POST | /api/class/lesson-plan | Save lesson plan (stub) |

## 7.7 Attendance Management (`/api/attendance-management`)

| Method | Endpoint | Purpose |
|---|---|---|
| POST | /api/attendance-management/daily | Daily attendance (stub) |
| POST | /api/attendance-management/bulk | Bulk attendance (stub) |
| PUT | /api/attendance-management/edit | Edit attendance (stub) |
| GET | /api/attendance-management/report | Attendance report (stub) |
| GET | /api/attendance-management/export | Export report (stub) |

## 7.8 Assignment Management (`/api/assignment`)

| Method | Endpoint | Purpose |
|---|---|---|
| POST | /api/assignment/create | Create assignment (stub) |
| POST | /api/assignment/attach-file | Attach file (stub) |
| POST | /api/assignment/set-deadline | Set deadline (stub) |
| POST | /api/assignment/auto-grade | Auto-grade (stub) |
| POST | /api/assignment/manual-grade | Manual-grade (stub) |
| GET | /api/assignment/submissions | Submission list (stub) |

## 7.9 Exam Management (`/api/exam`)

| Method | Endpoint | Purpose |
|---|---|---|
| POST | /api/exam/create | Create exam (stub) |
| POST | /api/exam/marks | Enter marks (stub) |
| POST | /api/exam/grade | Calculate grades (stub) |
| POST | /api/exam/publish | Publish results (stub) |
| GET | /api/exam/report-card | Report card export (stub) |

## 7.10 Communication (`/api/communication`)

| Method | Endpoint | Purpose |
|---|---|---|
| POST | /api/communication/message-student | Send student message (stub) |
| POST | /api/communication/message-parent | Send parent message (stub) |
| POST | /api/communication/announcement | Send announcement (stub) |
| POST | /api/communication/group-message | Send group message (stub) |

## 7.11 Study (`/api/study`)

| Method | Endpoint | Purpose |
|---|---|---|
| POST | /api/study/upload-note | Upload notes (stub) |
| POST | /api/study/upload-video | Upload video (stub) |
| POST | /api/study/upload-pdf | Upload PDF (stub) |
| POST | /api/study/share-resource | Share resource (stub) |

## 7.12 Leave (`/api/leave`)

| Method | Endpoint | Purpose |
|---|---|---|
| POST | /api/leave/apply | Apply leave (stub) |
| GET | /api/leave/balance | Get leave balance (stub) |
| GET | /api/leave/status | Get leave status (stub) |

## 7.13 Analytics (`/api/analytics`)

| Method | Endpoint | Purpose |
|---|---|---|
| GET | /api/analytics/class-performance | Class performance (stub) |
| GET | /api/analytics/subject-comparison | Subject comparison (stub) |
| GET | /api/analytics/weak-students | Weak students (stub) |

## 7.14 Reports (`/api/reports`)

| Method | Endpoint | Purpose |
|---|---|---|
| GET | /api/reports/attendance | Attendance report (stub) |
| GET | /api/reports/marks | Marks report (stub) |
| GET | /api/reports/assignment | Assignment report (stub) |
| GET | /api/reports/export | Export report (stub) |

---

## 8) Database Interaction Overview

## 8.1 Primary Collections and Purpose

| Collection | Purpose | Key Relations |
|---|---|---|
| users | System users and auth identity | Referenced by classTeacher, teacher, leave user, etc. |
| classes | Class metadata, teacher assignment, subjects, students | refs users |
| students | Student profiles + academic/health/performance fields | ref class |
| subjects | Subject setup and completion | refs class, user |
| assignments | Teacher assignments | refs class, subject, user |
| exams | Scheduled exams | refs class, subject, user |
| marks | Student marks and grading | refs student(user), exam, class, subject, user |
| attendance | Attendance entries with compliance flags | refs student(user), class, subject, user |
| studymaterials | Uploaded resources metadata | refs class, subject, user |
| leaveapplications | Leave workflows | refs user, approver |
| announcements | Announcements and recipients | refs user, class |
| academicyears | Academic year/session structuring | standalone + session subdocs |

## 8.2 Business Logic in Models
- `User`: pre-save password hashing and password comparison.
- `Mark`: pre-save percentage + grade calculation.
- `Attendance`: unique/indexed combinations for query efficiency.

## 8.3 Data Access Pattern
- Controllers use Mongoose CRUD, populate, and aggregation pipelines.
- Analytics uses MongoDB aggregation with lookups/grouping for derived metrics.

---

## 9) Data Flow Between Components

### 9.1 Frontend to Backend
- Axios from React components sends authenticated requests.
- Token retrieved from localStorage per request.

### 9.2 Backend Processing
- Express route → (optional) auth middleware → controller.
- Controller validates input, executes DB operations, returns JSON.

### 9.3 Fallback Data Paths
- Multiple frontend modules use localStorage when API is unavailable.
- Some backend route modules return static/mock payloads.
- Study materials includes backend fallback mode when DB disconnected.

### 9.4 Reporting Flow
- Frontend generates downloadable CSV/PDF using in-browser libraries.
- Attendance PDF also available through backend route using PDFKit.

---

## 10) System Dependencies

## 10.1 Backend Dependencies
- express
- mongoose
- cors
- dotenv
- express-rate-limit
- jsonwebtoken
- bcryptjs
- multer
- nodemailer
- pdfkit
- nodemon (dev)

## 10.2 Frontend Dependencies
- react / react-dom / react-scripts
- axios
- tailwindcss
- recharts
- lucide-react
- jspdf
- jspdf-autotable
- xlsx
- file-saver

## 10.3 Environment/Infrastructure
- Node.js runtime
- MongoDB instance
- `.env` secrets and DB URI

---

## 11) Assumptions and Constraints

## 11.1 Assumptions
- Teacher is primary actor for current UI scope.
- MongoDB is expected for persistent operation, but limited mode may be used in development.
- LocalStorage is acceptable temporary storage for development/demo continuity.

## 11.2 Constraints
- Several route groups are currently stubs (mock success/static responses).
- Frontend contains calls to some endpoints that are not implemented in `teacher` routes (e.g., certain update/delete/result-specific endpoints), implying partial integration status.
- Auth enforcement is inconsistent across non-teacher route groups.
- Data duplication exists (`Student` model separate from `User`-referenced attendance/marks pattern), which may require domain consolidation.
- Role definitions are broad in backend, but frontend navigation and UX is teacher-only.

## 11.3 Non-Functional Observations
- API timeout values are short in several frontend modules, increasing fallback frequency in slow environments.
- Error handling is partly user-alert-based and partly silent fallback.

---

## 12) Functional Coverage Summary

- The solution is a **teacher-centric management portal** with broad module coverage and mixed implementation maturity.
- Core authenticated teacher APIs (`/api/teacher/*`) plus student profile/health/PTM routes contain the primary functional backend logic.
- Frontend provides extensive UX for all major teacher workflows, with resilience through local storage and mock data where APIs are incomplete.
- The project is suitable for phased hardening: align endpoint contracts, standardize authorization, and replace stubs with complete persistence logic.
