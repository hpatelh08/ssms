import React, { useState } from 'react';
import { Lock, Mail, GraduationCap, Eye, EyeOff } from 'lucide-react';
import teachers from '../../data/teachers';

const Login = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [teacherClass, setTeacherClass] = useState('');
  const [teacherDivision, setTeacherDivision] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    if (e.target.name === 'email' || e.target.name === 'password') {
      const nextEmail = e.target.name === 'email' ? e.target.value : formData.email;
      const nextPassword = e.target.name === 'password' ? e.target.value : formData.password;
      setTimeout(() => fetchTeacherClass(nextEmail, nextPassword), 0);
    }
  };

  // Fetch teacher class/division after entering email+password
  const fetchTeacherClass = (email, password) => {
    if (!email || !password) {
      setTeacherClass('');
      setTeacherDivision('');
      return;
    }
    const matchedTeacher = teachers.find(
      (teacher) =>
        teacher.email.toLowerCase() === email.trim().toLowerCase() &&
        teacher.password === password
    );

    if (!matchedTeacher) {
      setTeacherClass('');
      setTeacherDivision('');
      return;
    }

    setTeacherClass(matchedTeacher.assignedClass);
    setTeacherDivision(matchedTeacher.division);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const matchedTeacher = teachers.find(
      (teacher) =>
        teacher.email.toLowerCase() === formData.email.trim().toLowerCase() &&
        teacher.password === formData.password
    );

    if (!matchedTeacher) {
      setError('Invalid email or password');
      setLoading(false);
      return;
    }

    const userData = {
      name: matchedTeacher.name,
      email: matchedTeacher.email,
      role: 'teacher',
      assignedClass: matchedTeacher.assignedClass,
      division: matchedTeacher.division
    };

    localStorage.setItem('token', `teacher-${Date.now()}`);
    localStorage.setItem('user', JSON.stringify(userData));
    window.location.href = '/';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-indigo-800 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Animated background shapes */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-500/20 rounded-full blur-3xl" />
        <div className="absolute top-1/2 -left-20 w-60 h-60 bg-indigo-400/15 rounded-full blur-3xl" />
        <div className="absolute -bottom-20 right-1/3 w-72 h-72 bg-blue-500/15 rounded-full blur-3xl" />
        <div className="absolute top-20 left-1/3 w-2 h-2 bg-white/30 rounded-full animate-pulse" />
        <div className="absolute top-40 right-1/4 w-1 h-1 bg-white/20 rounded-full animate-pulse" style={{ animationDelay: '0.5s' }} />
        <div className="absolute bottom-40 left-1/4 w-1.5 h-1.5 bg-white/25 rounded-full animate-pulse" style={{ animationDelay: '1s' }} />
      </div>

      <div className="relative z-10 w-full max-w-md">
        <div className="bg-white/95 backdrop-blur-xl rounded-3xl shadow-2xl p-8 border border-white/20">
          {/* Logo & Title */}
          <div className="text-center mb-8">
            <div className="mx-auto w-20 h-20 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center mb-5 shadow-lg shadow-indigo-500/30">
              <GraduationCap className="h-10 w-10 text-white" />
            </div>
            <h1 className="text-3xl font-extrabold text-gray-800 tracking-tight">
              Welcome Back
            </h1>
            <p className="text-gray-500 mt-1 text-sm font-medium">
              Sign in to Teacher Portal
            </p>
          </div>

          {error && (
            <div className="mb-5 p-3.5 bg-red-50 border border-red-200 text-red-600 rounded-xl text-sm font-medium flex items-center gap-2 animate-fadeIn">
              <div className="w-2 h-2 bg-red-500 rounded-full flex-shrink-0" />
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Email</label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 transform -translate-y-1/2 h-4 w-4 text-indigo-400" />
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  className="w-full pl-11 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-0 focus:border-indigo-500 bg-gray-50/50 hover:border-gray-300 text-gray-800 font-medium placeholder:text-gray-400 transition-colors"
                  placeholder="Enter your email"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Password</label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 transform -translate-y-1/2 h-4 w-4 text-indigo-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  required
                  className="w-full pl-11 pr-11 py-3 border-2 border-gray-200 rounded-xl focus:ring-0 focus:border-indigo-500 bg-gray-50/50 hover:border-gray-300 text-gray-800 font-medium placeholder:text-gray-400 transition-colors"
                  placeholder="Enter your password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-indigo-500"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Role</label>
              <input
                type="text"
                name="role"
                value="Teacher"
                disabled
                className="w-full p-3 border-2 border-gray-200 rounded-xl bg-indigo-50/50 text-indigo-700 font-semibold"
              />
            </div>

            {teacherClass && (
              <div className="grid grid-cols-2 gap-4 animate-fadeInUp">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">Assigned Class</label>
                  <input
                    type="text"
                    value={teacherClass}
                    disabled
                    className="w-full p-3 border-2 border-gray-200 rounded-xl bg-emerald-50/50 text-emerald-700 font-semibold"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">Division</label>
                  <input
                    type="text"
                    value={teacherDivision}
                    disabled
                    className="w-full p-3 border-2 border-gray-200 rounded-xl bg-emerald-50/50 text-emerald-700 font-semibold"
                  />
                </div>
              </div>
            )}

            <div>
              <button
                type="submit"
                disabled={loading}
                className={`w-full py-3.5 px-4 rounded-xl font-bold text-white text-base shadow-lg transition-all duration-300 ${
                  loading 
                    ? 'bg-indigo-400 cursor-not-allowed' 
                    : 'bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 hover:shadow-xl hover:shadow-indigo-500/25 hover:-translate-y-0.5 active:translate-y-0'
                }`}
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    Signing in...
                  </span>
                ) : 'Sign In'}
              </button>
            </div>
          </form>
        </div>
        
        <p className="text-center text-indigo-200/60 text-xs mt-6 font-medium">
          © 2026 Teacher Portal • All Rights Reserved
        </p>
      </div>
    </div>
  );
};

export default Login;
