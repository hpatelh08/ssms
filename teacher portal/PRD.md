# Product Requirements Document

## Product Overview
Smart School Management System — a role-based web application to manage school operations for Admins, Teachers, Students, Parents, and Accountants. Core capabilities include authentication, dashboards, class & student management, attendance, assignments, exams & marks, study materials, communication, leave management, reports and analytics. Backend is Node.js + Express + MongoDB; frontend is React + Tailwind.

## Repository Summary and High-level Structure
Top-level files and folders:
- `README.md` — project overview and setup instructions.
- `client/` — React frontend application (TailwindCSS).
  - `package.json` — frontend dependencies and scripts.
  - `public/`, `src/` — frontend source.
  - `src/components/Teacher/` — teacher-facing UI components.
    - `StudentManagement.js`, `StudyMaterials.js`, `MarksManagement.js`, `AttendanceManagement.js`, `ClassManagement.js`, `Communication.js`, `Dashboard.js`, `ExamManagement.js`, `LeaveManagement.js`, `PerformanceAnalytics.js`, `Reports.js`, `AssignmentManagement.js`
  - `src/App.js`, `src/index.js`, `src/index.css` (app bootstrap).
- `server/` — Node.js backend.
  - `package.json` — backend dependencies and scripts.
  - `index.js` — server bootstrap, route registration, rate limiting, DB connect.
  - `controllers/` — business logic (e.g., `teacherController.js`, `authController.js`).
  - `routes/` — Express routers (e.g., `teacher.js`, `auth.js`, `studyMaterials.js`, `studentManagement.js`, `attendance.js`, etc.).
  - `models/` — Mongoose models (`User.js`, `Student.js`, `StudyMaterial.js`, `Class.js`, `Mark.js`, `Attendance.js`, `Exam.js`, etc.).
  - `middleware/` — `auth.js` (authentication/authorization helpers).
  - `uploads/` — file storage (created at runtime by server).
  - `utils/` — JWT helpers (`jwt.js`) and other utilities.
  - `controllers` & `routes` contain endpoints and heavy business rules.
- Other scripts: `server.bat`, `server-dev.bat`, small utility scripts at repo root.

Note: There is also a small top-level `src/` folder (separate from `client/`) with a `components/Teacher/MarksManagement.js` — appears to be an alternate frontend location or legacy.

## Complete Project File Map (key files)
- Root: `README.md`, `FRD.md` (generated), scripts.
- `client/package.json`
- `client/src/components/Teacher/StudentManagement.js`
- `client/src/components/Teacher/StudyMaterials.js`
- `client/src/components/Teacher/MarksManagement.js`
- `server/package.json`
- `server/index.js`
- `server/controllers/teacherController.js`
- `server/controllers/authController.js`
- `server/routes/teacher.js`
- `server/routes/studyMaterials.js` (light stub)
- `server/models/StudyMaterial.js`, `User.js`, `Student.js`, `Class.js`, `Mark.js`, `Attendance.js`, `Exam.js`, `Subject.js`, `Teacher.js`, `Announcement.js`, `LeaveApplication.js`
- `server/middleware/auth.js`
- `server/utils/jwt.js`

## Step 1 — Detailed Project Structure and Purpose
- `client/` (React UI)
  - Purpose: All user-facing interfaces, forms, dashboards, components, client-side state and fallbacks (localStorage).
  - Important components:
    - `StudentManagement.js`: Student profiles, health records, PTM scheduling, local mock data, local-add student flow, HTTP calls to backend for students and classes.
    - `StudyMaterials.js`: UI for uploading and listing study materials; handles file, link types; local fallback when server unreachable.
    - Other teacher components implement assignments, attendance, exams, analytics (consistent UI patterns).
- `server/` (API & business logic)
  - Purpose: REST API implementing authentication, teacher operations, study materials, attendance, assignments, marks, analytics, and admin actions.
  - `index.js`: Registers routes and starts server; uses `express-rate-limit`, `cors`, body parser; attempts to connect to MongoDB but will keep the server up even if DB fails (limited-mode fallback).
  - `controllers/teacherController.js`: Large controller that implements most Teacher-facing behaviour: dashboard aggregation, classes, assignments, exams, study materials (including fallback when DB disconnected), attendance, marks, leave, and analytics.
  - `controllers/authController.js`: Register/login/password reset/profile management; uses JWT token generation via `server/utils/jwt.js`.
  - `routes/teacher.js`: Exposes teacher endpoints; configures `multer` storage for `uploads/study-materials` (ensures directory exists), file filtering and size limits.
  - `routes/studyMaterials.js`: A separate lightweight router with stub endpoints (likely unused vs teacher route).
  - `models/`: Mongoose schemas modeling `User`, `Student`, `StudyMaterial`, `Mark`, `Class`, `Attendance`, `Exam`, etc.
  - `middleware/auth.js`: `authenticate` middleware (reads JWT from `Authorization` header), plus `authorize` and role check helpers (`isTeacher`, `isAdmin`, etc.).
  - `utils/jwt.js`: Token generation and verification helpers.

## Step 2 — Feature Extraction (Implemented Features)
- Authentication & Authorization
  - Description: Register, Login, token generation/verification, protected routes, role-based access checks.
  - Frontend: client login components (not exhaustively listed).
  - Backend: `server/controllers/authController.js`, `server/middleware/auth.js`, `server/utils/jwt.js`, `server/routes/auth.js`.

- Teacher Dashboard
  - Description: Aggregated teacher metrics: classes today, pending tasks, announcements, performance summaries, upcoming exams.
  - Files: `server/controllers/teacherController.js` (getDashboard), `client/src/components/Teacher/Dashboard.js`.

- Class Management
  - Description: Get classes assigned to teacher, class details, student lists.
  - Files: `server/controllers/teacherController.js` (`getClasses`, `getClassDetails`), `server/models/Class.js`, `client components` (ClassManagement).

- Student Management & Profiles
  - Description: View and edit student profiles, add mock/new student entries in frontend, health records editing.
  - Files: `client/src/components/Teacher/StudentManagement.js`, `server/models/Student.js`, `server/routes/studentManagement.js` (server-side stubs).

- Health Records
  - Description: Edit & update student health info fields; frontend avoids unsafe trimming; backend route exists for student updates (not shown in files read but referenced).
  - Files: `client/src/components/Teacher/StudentManagement.js`, `server/models/Student.js`, backend student routes.

- PTM (Parent-Teacher Meeting) Scheduler (frontend-local)
  - Description: Local scheduling stored in `localStorage` with PTM entries, pending tasks synced to dashboard.
  - Files: `client/src/components/Teacher/StudentManagement.js`.

- Attendance Management
  - Description: Mark attendance, get attendance records, export to PDF/Excel.
  - Files: `server/controllers/teacherController.js` (`markAttendance`, `getAttendanceRecords`), `server/models/Attendance.js`, `client components` (AttendanceManagement).

- Assignments Management
  - Description: Create assignments, list assignments for teacher.
  - Files: `server/controllers/teacherController.js` (`createAssignment`, `getAssignments`), `server/models/Assignment.js`, frontend assignment components.

- Exams & Marks Management
  - Description: Create exams, enter marks, aggregate marks; analytics about performance, grade distributions.
  - Files: `server/controllers/teacherController.js` (`createExam`, `getExams`, `enterMarks`, `getMarks`, `getPerformanceAnalytics`), `server/models/Exam.js`, `server/models/Mark.js`, `client components` (ExamManagement, MarksManagement).

- Study Materials (upload & links)
  - Description: Upload files (pdf, docx, video, images) and add external links; frontend supports file type selection and local fallback; backend stores files to `uploads/study-materials` and persists to `StudyMaterial` model, with DB-disconnected fallback.
  - Files: `client/src/components/Teacher/StudyMaterials.js`, `server/routes/teacher.js` (multer config), `server/controllers/teacherController.js` (`uploadStudyMaterial`, `getStudyMaterials`), `server/models/StudyMaterial.js`.

- Leave Management
  - Description: Apply for leave, view leave applications.
  - Files: `server/controllers/teacherController.js` (`applyForLeave`, `getLeaveApplications`), `server/models/LeaveApplication.js`, route `leaveManagement.js`.

- Communication & Announcements
  - Description: Send announcements/messages to students/parents; `Announcement` model exists; sample queries in dashboard use it.
  - Files: `server/models/Announcement.js`, `server/controllers/teacherController.js` (uses announcements).

- Performance Analytics & Reports
  - Description: Aggregations and analytics using MongoDB aggregation pipelines (class performance, subject performance, weak students, weekly trends, grade distribution).
  - Files: `server/controllers/teacherController.js` (`getPerformanceAnalytics`), `client components` for reports/analytics.

- User Profile & Password Management
  - Description: Update profile, change password, forgot/reset password.
  - Files: `server/controllers/authController.js`, `server/models/User.js`, `server/utils/jwt.js`.

- File Upload Resilience & Local Fallbacks
  - Description: The server ensures upload directory exists; file size limits and type filters are applied. Frontend uses local fallback when backend unreachable; backend uses in-memory fallback if MongoDB disconnected.
  - Files: `server/routes/teacher.js`, `server/controllers/teacherController.js`, `client/src/components/Teacher/StudyMaterials.js`, `client/src/components/Teacher/StudentManagement.js`.

## Step 3 — Module Identification and Breakdown
1. Authentication Module
   - Purpose: Secure access, session management, role-based access.
   - Core functionality: register, login, token generation/validation, password reset, current-user endpoints.
   - Files: `server/controllers/authController.js`, `server/routes/auth.js`, `server/middleware/auth.js`, `server/utils/jwt.js`, `server/models/User.js`.
   - Dependencies: `jsonwebtoken`, `bcryptjs`, `nodemailer` (placeholder sending), `mongoose`.

2. Teacher Module (Teacher Dashboard & Workflows)
   - Purpose: Teacher-facing operations across classes, students, attendance, marks, assignments, study materials, analytics.
   - Core functionality: `getDashboard`, classes CRUD, assignments CRUD, exams CRUD, marks entry, attendance marking, study materials management, leave.
   - Files: `server/controllers/teacherController.js`, `server/routes/teacher.js`, `client/src/components/Teacher/*`.
   - Dependencies: `multer` (uploads), `mongoose` queries/aggregations, `pdfkit` for exports.

3. Student Management Module
   - Purpose: Manage student data, profiles, health records, academic history.
   - Core functionality: read/update student records, profile viewing, health updates.
   - Files: `server/models/Student.js`, `server/routes/studentManagement.js` (exists), `client/src/components/Teacher/StudentManagement.js`.

4. Study Materials Module
   - Purpose: Upload and serve study resources.
   - Core functionality: file uploads, URL links, metadata, download counts, class/subject association.
   - Files: `server/models/StudyMaterial.js`, `server/controllers/teacherController.js` (get/upload), `server/routes/teacher.js` (upload route), `client/src/components/Teacher/StudyMaterials.js`.
   - Dependencies: `multer`, filesystem (`fs`), `mongoose`.

5. Attendance & Timetable Module
   - Purpose: Track attendance, generate reports, export.
   - Core functionality: mark attendance, fetch records, export to PDF/Excel.
   - Files: `server/models/Attendance.js`, `server/controllers/teacherController.js`, frontend `AttendanceManagement.js`.

6. Exam & Marks Module
   - Purpose: Create exams, enter marks, analyze performance.
   - Core functionality: exam CRUD, marks entry/update, aggregate analytics and report generation.
   - Files: `server/models/Exam.js`, `server/models/Mark.js`, `server/controllers/teacherController.js`, frontend `ExamManagement.js` & `MarksManagement.js`.

7. Reporting & Analytics Module
   - Purpose: Provide teacher-facing performance analytics and reports.
   - Core functionality: Aggregation pipelines for class performance, subject performance, grade distribution, top performers, weak students, weekly trends.
   - Files: `server/controllers/teacherController.js`, frontend `PerformanceAnalytics.js`, `Reports.js`.

8. Communication & Notifications Module
   - Purpose: Announcements, messages to students/parents, in-app notifications, email/SMS placeholders.
   - Core functionality: create announcements, query recent announcements.
   - Files: `server/models/Announcement.js`, `server/controllers/teacherController.js`, `communication.js` route stub.

9. Leave Management Module
   - Purpose: Apply and view leave applications (teachers, students).
   - Files: `server/models/LeaveApplication.js`, `server/controllers/teacherController.js`, `routes/leaveManagement.js`.

10. Utilities & System-level
    - Purpose: JWT utilities, rate limiting, CORS, express configuration.
    - Files: `server/utils/jwt.js`, `server/index.js`.

## Step 4 — Functionality Mapping (Key Functions & Flows)
- User flows (Teacher-centric)
 1. Authentication:
     - Teacher logs in via client → `POST /api/auth/login` → `authController.login` returns JWT.
     - `Authorization: Bearer <token>` used in subsequent requests.
 2. Dashboard:
     - `GET /api/teacher/dashboard` → `teacherController.getDashboard` uses teacher id from `req.user` and returns aggregated dashboard data (classes, pending tasks, performance).
 3. Manage Classes & Students:
     - Teacher requests `GET /api/teacher/classes` → returns assigned classes (populates students & subjects).
     - For students, views in `StudentManagement` (frontend uses mock data when server unavailable).
     - Health updates: frontend sends `PUT /api/student/health-records` (backend route not shown but referenced).
 4. Study Materials Upload:
     - Frontend `POST /api/teacher/study-materials` (multipart/form-data) via `StudyMaterials` component.
     - Server `teacher.js` handles upload with `multer` to `uploads/study-materials`, validates types, size (50MB), persists `StudyMaterial` doc. If Mongo disconnected, fallback stored in an in-memory array.
     - Frontend displays materials; download triggers client-side stub (alerts) or should call an endpoint (missing real file download endpoint).
 5. Attendance & Marks:
     - Teacher marks attendance via `POST /api/teacher/attendance`, controller creates or updates `Attendance` documents.
     - Enter marks via `POST /api/teacher/marks` which saves `Mark` documents with percentage calculations handled elsewhere.
 6. Analytics & Reports:
     - Teacher requests `GET /api/teacher/analytics` which runs aggregation pipelines and returns charts-ready data.

- Permissions & Roles
  - `authenticate` middleware ensures JWT present and valid.
  - `isTeacher`, `isAdmin`, `isStudent`, `isParent`, `isAccountant` middleware functions guard endpoints.
  - `authorize(...roles)` generic helper exists to protect endpoints by roles.

- Data flow
  - Client sends REST requests (axios) with JWT header.
  - Server authenticates, controllers query `mongoose` models, may perform aggregate pipelines, return JSON.
  - File assets are stored on disk under `uploads/study-materials` and their metadata stored in `StudyMaterial` model.

- UI interactions (examples)
  - `StudentManagement.js`: search, filters, add mock student, edit health record modal, PTM scheduler using `localStorage`.
  - `StudyMaterials.js`: form chooses material type, accepts file/link, uploads via multipart/form-data, has local fallback when server unreachable.

- Backend logic specifics
  - `teacherController.getPerformanceAnalytics` uses aggregation pipelines (`$match`, `$lookup`, `$group`, etc.).
  - `uploadStudyMaterial` checks `materialType` and requires `url` if link, otherwise requires `req.file`.
  - Server listens on port from `process.env.PORT` and attempts MongoDB connect; if DB fails, server continues in "limited mode".

## Step 5 — System Roles & Capabilities
Roles declared in `User` model: `admin`, `teacher`, `student`, `parent`, `accountant`.

- Admin
  - Capabilities: Full access to user management, system configuration, reports, view/modify any data; role-check used via `authorize`/`isAdmin`.
  - Files: `authController`, `admin` routes (admin-specific routes not deeply inspected).

- Teacher
  - Capabilities:
    - Access teacher dashboard.
    - Manage classes assigned to them (view class lists, students).
    - Create assignments, exams; enter and update marks.
    - Mark attendance, view attendance records.
    - Upload study materials (files & links).
    - Apply for & review leave applications.
    - Access analytics and reports for their classes.
  - Files: `server/controllers/teacherController.js`, `server/routes/teacher.js`, `client/src/components/Teacher/*`.

- Student
  - Capabilities (inferred/expected): View own profile, attendance, marks, study materials; limited interactions (apply leaves?). Implemented routes for student exist but specifics not fully enumerated.
  - Files: `server/models/Student.js`, `routes/studentManagement.js`.

- Parent
  - Capabilities (inferred): View child's profile, communicate with teachers, receive announcements; specific UI implementation not fully covered in code read.
  - Files: `server/models/User.js` role `parent`, some routes may exist.

- Accountant (role present but not deeply examined)
  - Capabilities: Manage financial records, fee collection (inferred); not actively present in read controllers but role exists.

Permission enforcement:
- All API requests require JWT for protected endpoints (`authenticate`). Role-specific routes use `isTeacher`, `isAdmin`, etc. Some routes may still be stubs and need future hardening.

## Step 6 — Functional Requirements (derived from features and code)
1. Authentication & Security
   - FR1.1: System must allow users to register and login using email & password.
   - FR1.2: Access to protected endpoints must require valid JWT in `Authorization` header.
   - FR1.3: Role-based authorization must restrict access by roles (admin/teacher/student/parent/accountant).
   - FR1.4: Passwords must be stored hashed with `bcryptjs`.

2. Teacher Dashboard & Workflows
   - FR2.1: Show classes assigned to teacher and summary metrics (students count, pending tasks, performance).
   - FR2.2: Allow teachers to view class details and student lists.

3. Student Management
   - FR3.1: View student profiles, including academic history, attendance, behavior remarks.
   - FR3.2: Edit and save student health records, validating inputs; UI should handle mock entries and fallback.

4. Attendance
   - FR4.1: Teachers can mark attendance per student per date; system must allow updates if existing record exists.
   - FR4.2: Attendance must be exportable (PDF/Excel).

5. Assignments & Exams
   - FR5.1: Teacher can create assignments and exams, specify class, subject, dates, and total marks.
   - FR5.2: Teacher can enter marks for students; updates allowed.

6. Study Materials
   - FR6.1: Upload files (pdf, docx, pptx, images, videos) with size limit and MIME filtering.
   - FR6.2: Add external resource links (URL).
   - FR6.3: Persist metadata in DB and allow listing and download (download endpoint pending).
   - FR6.4: If DB or server unavailable, client should support local fallback to avoid data-loss illusions; server should support in-memory fallback for development.

7. Analytics & Reports
   - FR7.1: Provide performance analytics using aggregation (class averages, subject averages, weekly trends).
   - FR7.2: Provide lists of weak students (below threshold), top performers and distributions.

8. Leave & Communication
   - FR8.1: Teachers/users can apply for leave and view leave applications.
   - FR8.2: Announcements can be created and fetched for dashboard display.

9. File Storage & Serving
   - FR9.1: Server must create `uploads/study-materials` as needed.
   - FR9.2: Files uploaded should have saved metadata and safe filenames (timestamp prefixed).

10. Operational Resilience
   - FR10.1: Server should start even if MongoDB is temporarily unavailable (limited-mode).
   - FR10.2: For production, system should fail gracefully and record appropriate logs/errors.

## Step 7 — User Flows (Detailed)
- Flow A: Teacher logs in and views dashboard
  - Teacher -> `POST /api/auth/login` -> receives JWT -> `GET /api/teacher/dashboard` -> dashboard data displayed.

- Flow B: Uploading a Study Material (File)
  - In UI `StudyMaterials` teacher selects Class & Subject, chooses `materialType` != link, selects file -> `POST /api/teacher/study-materials` multipart/form-data -> server saves file to `uploads/study-materials`, creates `StudyMaterial` doc -> client refreshes list.

- Flow C: Adding an External Link
  - Select `materialType` = link -> paste URL -> `POST /api/teacher/study-materials` with `materialType=link` and `url` param -> server validates `url` present and creates `StudyMaterial` with `url`.

- Flow D: Marking Attendance
  - Teacher prepares attendance for `classId` and `date` -> `POST /api/teacher/attendance` with `attendanceData` array -> server validates teacher-class relationship -> creates/updates `Attendance` docs -> returns success.

- Flow E: Entering Marks
  - Teacher chooses exam & subject -> fills `marksData`, `POST /api/teacher/marks` -> server checks exam ownership -> create/update `Mark` docs.

- Flow F: Local Fallback (offline/DB disconnected)
  - Frontend upload attempt fails (no response) -> frontend stores material locally with `isLocalFallback` flag and informs teacher; server if DB not connected stores fallback study material in `fallbackStudyMaterials` in memory and returns fallback message.

## Step 8 — UI Components (Key ones)
- `StudentManagement` (teacher view): Student cards, search, health record modal, PTM scheduler (local).
- `StudyMaterials`: Upload form (file/link), materials grid with download/edit/delete actions, local fallback UI/alerts.
- `AttendanceManagement`: Attendance marking UI, export actions (frontend uses `jspdf`, `xlsx`).
- `MarksManagement`, `ExamManagement`, `AssignmentManagement`, `PerformanceAnalytics`, `Reports`: standard CRUD and analytics UI components.

## Step 9 — Data Flow & Integration Points
- Client (React) -> HTTP (axios) -> Server (Express).
- Server -> MongoDB (Mongoose models/aggregations).
- File upload: `multer` stores files to `uploads/study-materials` and metadata in `StudyMaterial` model.
- Auth: JWT in `Authorization` header; `authenticate` fetches user by id in token.
- Third-party integrations: placeholders for email (nodemailer) and potential SMS integrations.

## Step 10 — Gaps, Risks, and Future Improvements
Gaps & Observations:
- Several route files (e.g., `server/routes/studyMaterials.js`) are light stubs; ensure single source of truth for study material routes (use teacher routes consistently).
- File download endpoint is missing — current download is client-side alert placeholder.
- Some backend routes are stubs or return mock responses — requires completing CRUD routes for other roles.
- Fallbacks are useful for dev, but must be replaced by persistent retry/queue or transactional mechanisms for production.
- Security hardening: rate limits exist, but input validation, file malware scanning, CORS policies, and consistent role checks should be reviewed.
- Testing: no explicit unit/integration tests observed; add tests for critical controllers and auth flows.
- Logging & monitoring: enhanced error logging and metrics would be valuable for production readiness.

Recommended Future Improvements (priority)
1. Implement robust file download endpoint with signed URLs or proper access checks.
2. Replace in-memory fallback with persistent queue (e.g., Redis) to enqueue operations when DB unavailable.
3. Complete and harden all route stubs; add end-to-end integration tests.
4. Add RBAC enforcement via `authorize(...)` middleware where appropriate and revisit open endpoints.
5. Add input validation (e.g., using `express-validator` or Joi) to controllers to avoid malformed data.
6. Add CI pipeline and automated tests.
7. Add content scanning for uploads and enforce stricter MIME/type checking and quarantining.
8. Add role-based UI components to show/hide functions in the frontend.

## Step 11 — Appendix: Key Implementation Notes (references)
- Server starts before DB connect to support limited-mode: `server/index.js` starts `app.listen(PORT)` then attempts `mongoose.connect(MONGO_URI)`. This enables the API to be reachable for fallback ops but requires caution for production.
- `teacherController.js` contains extensive aggregation and fallback logic. It stores fallback study materials in an in-memory `fallbackStudyMaterials` array when `mongoose.connection.readyState !== 1`.
- `server/routes/teacher.js` sets up `multer` destination to `uploads/study-materials` and ensures directory creation via `fs.mkdirSync(uploadDir, { recursive: true })`. File types allowed include images, videos, pdf, common office docs, and plain text; limit set to 50MB.
- Frontend `StudyMaterials` uses `FormData` and `axios.post('http://localhost:5000/api/teacher/study-materials', ...)` for uploads. It also supports local fallback (adds material locally when server unavailable) and informs user to start MongoDB for persistence.
- `StudentManagement` uses local mocks for student cards and persistence for PTM in `localStorage`. Health record updates send `PUT /api/student/health-records` (frontend code) or update local mock entries.

---

Created by the analysis agent. If you want, I can also:
- Update `FRD.md` to reference this `PRD.md` or remove duplicates.
- Generate a prioritized task list (issues) from the recommendations above.

