import React, { useState, useRef, useEffect } from 'react';

export default function Dashboard() {
  const teacherName = 'hetvi';
  const [showMenu, setShowMenu] = useState(false);
  const menuRef = useRef(null);

  const stats = [
    { label: 'Assignments Graded', value: 24, color: 'bg-green-400', percent: 80 },
    { label: 'Homework', value: 12, color: 'bg-blue-400', percent: 60 },
    { label: 'Pending Reviews', value: 7, color: 'bg-yellow-400', percent: 35 },
    { label: 'Upcoming Deadlines', value: 3, color: 'bg-pink-400', percent: 15 },
  ];

  useEffect(() => {
    function handleClickOutside(event) {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setShowMenu(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-2xl font-semibold">Good Morning, {teacherName}!</div>
        </div>

        <div className="relative" ref={menuRef}>
          <button
            onClick={() => setShowMenu(!showMenu)}
            className="bg-white rounded-3xl shadow px-6 py-3 flex items-center gap-3 cursor-pointer hover:shadow-md transition"
          >
            <div className="w-10 h-10 rounded-full bg-purple-500 flex items-center justify-center text-white font-bold text-lg">
              {teacherName.charAt(0).toUpperCase()}
            </div>
            <span className="text-lg font-bold text-gray-800">Profile</span>
          </button>

          {showMenu && (
            <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-lg py-2 z-50">
              <a href="/profile" className="block px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg mx-1">👤 My Profile</a>
              <a href="/settings" className="block px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg mx-1">⚙️ Settings</a>
              <hr className="my-1" />
              <a href="/logout" className="block px-4 py-2 text-red-500 hover:bg-gray-100 rounded-lg mx-1">🚪 Logout</a>
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat) => (
          <div key={stat.label} className="rounded-3xl p-6 shadow bg-white flex flex-col items-center">
            <div className="text-3xl font-bold mb-2">{stat.value}</div>
            <div className="text-md font-semibold mb-2">{stat.label}</div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div className="bg-purple-500 h-2 rounded-full" style={{ width: `${stat.percent}%` }}></div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}