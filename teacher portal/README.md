# Smart School Management System

A comprehensive school management system with role-based access control for Admin, Teacher, Student, Parent, and Accountant panels.

## 🚀 Features

### Core System Modules
- Secure Login / Logout
- Role-Based Access Control (Admin, Teacher, Student, Parent, Accountant)
- Dashboard with analytics & summaries
- Profile Management
- Notification System (SMS, Email, In-app)
- Academic Year & Session Management

### Teacher Panel Modules
1. **Dashboard** - Today's classes, pending tasks, recent announcements, student performance summary, upcoming exams
2. **Class Management** - Assigned classes & sections, subject allocation, timetable view, lesson planning
3. **Attendance Management** - Daily attendance marking, bulk attendance, edit previous attendance, attendance reports, export to PDF/Excel
4. **Assignment & Homework** - Create assignments, attach files, set deadlines, auto grading (if MCQs), manual grading, student submission tracking
5. **Exam & Marks Management** - Create exams, enter marks, grade calculation, result publishing, report card generation
6. **Student Management** - View student profiles, academic history, performance analytics, behavior remarks
7. **Communication** - Message students, message parents, class announcements, group messaging
8. **Study Materials** - Upload notes, upload videos, upload PDFs, share resources
9. **Leave Management** - Apply leave, view leave balance, leave approval status
10. **Performance Analytics** - Class performance charts, subject performance comparison, weak student identification
11. **Reports** - Attendance report, marks report, assignment completion report, export to PDF/Excel

## 🛠️ Tech Stack

### Backend
- Node.js
- Express.js
- MongoDB with Mongoose
- JWT for authentication
- Bcrypt for password hashing
- Multer for file uploads
- PDFKit for PDF generation

### Frontend
- React.js
- TailwindCSS
- Axios for API calls
- Recharts for data visualization
- Lucide React for icons

## 📋 Prerequisites

- Node.js (v14 or higher)
- MongoDB
- npm or yarn

## 🚀 Getting Started

### Backend Setup
1. Navigate to the server directory: `cd server`
2. Install dependencies: `npm install`
3. Create a `.env` file with the required environment variables
4. Start the server: `npm run dev`

### Frontend Setup
1. Navigate to the client directory: `cd client`
2. Install dependencies: `npm install`
3. Start the development server: `npm start`

## 🔐 Environment Variables

Create a `.env` file in the server directory with the following variables:

```env
JWT_SECRET=your_jwt_secret_key_here
JWT_EXPIRE=30d
JWT_REFRESH_SECRET=your_jwt_refresh_secret_key_here
JWT_REFRESH_EXPIRE=30d
MONGO_URI=mongodb://localhost:27017/smart_school_db
PORT=5000
NODE_ENV=development
```

## 🏗️ Project Structure

```
teacher-portal/
├── client/                 # React frontend
│   ├── public/
│   └── src/
│       ├── components/
│       │   ├── Auth/
│       │   └── Teacher/
│       └── App.js
├── server/                 # Node.js backend
│   ├── controllers/
│   ├── middleware/
│   ├── models/
│   ├── routes/
│   ├── uploads/
│   ├── utils/
│   ├── .env
│   └── index.js
└── README.md
```

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.# hetu
