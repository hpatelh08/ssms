import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Lock, Mail, GraduationCap, Eye, EyeOff, Globe } from 'lucide-react';
import { apiUrl } from '../../config/api';

const Login = () => {
  const [formData, setFormData] = useState({
    teacherId: '',
    password: ''
  });
  const [teacherClass, setTeacherClass] = useState('');
  const [teacherDivision, setTeacherDivision] = useState('');
  const [teacherName, setTeacherName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  useEffect(() => {
    const teacherId = formData.teacherId.trim();
    const password = formData.password.trim();

    if (!teacherId || !password) {
      setTeacherClass('');
      setTeacherDivision('');
      setTeacherName('');
      return undefined;
    }

    const controller = new AbortController();
    const timer = setTimeout(async () => {
      try {
        const response = await axios.post(
          apiUrl('/api/auth/teacher-info'),
          { teacherId, password },
          { signal: controller.signal, timeout: 4000 }
        );

        const teacher = response?.data?.user;
        setTeacherName(teacher?.name || '');
        setTeacherClass(teacher?.assignedClass || '');
        setTeacherDivision(teacher?.division || '');
      } catch (requestError) {
        if (requestError.name !== 'CanceledError' && requestError.code !== 'ERR_CANCELED') {
          setTeacherClass('');
          setTeacherDivision('');
          setTeacherName('');
        }
      }
    }, 350);

    return () => {
      controller.abort();
      clearTimeout(timer);
    };
  }, [formData.teacherId, formData.password]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await axios.post(apiUrl('/api/auth/teacher-login'), {
        teacherId: formData.teacherId.trim(),
        password: formData.password
      });

      const userData = response?.data?.user;
      const token = response?.data?.token;

      if (!userData || !token) {
        throw new Error('Teacher login failed');
      }

      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(userData));
      window.location.href = '/';
    } catch (loginError) {
      setError(loginError?.response?.data?.error || 'Invalid teacher ID or password');
      setLoading(false);
      return;
    }

    setLoading(false);
  };

  const openVisitorPage = () => {
    window.location.href = '/visitor';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-indigo-800 flex items-center justify-center p-4 relative overflow-hidden">
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
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Teacher ID</label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 transform -translate-y-1/2 h-4 w-4 text-indigo-400" />
                <input
                  type="text"
                  name="teacherId"
                  value={formData.teacherId}
                  onChange={handleChange}
                  required
                  className="w-full pl-11 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-0 focus:border-indigo-500 bg-gray-50/50 hover:border-gray-300 text-gray-800 font-medium placeholder:text-gray-400 transition-colors"
                  placeholder="Enter your teacher ID"
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
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Teacher Name</label>
              <input
                type="text"
                value={teacherName || 'Teacher'}
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

            <button
              type="button"
              onClick={openVisitorPage}
              className="w-full inline-flex items-center justify-center gap-2 rounded-xl border border-sky-200 bg-sky-50 px-4 py-3 text-sm font-semibold text-sky-700 transition hover:-translate-y-0.5 hover:bg-sky-100"
            >
              <Globe className="h-4 w-4" />
              Visitor Page
            </button>
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
