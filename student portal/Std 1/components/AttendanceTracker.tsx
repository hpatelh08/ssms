
import React from 'react';

interface AttendanceTrackerProps {
  history: string[];
}

export const AttendanceTracker: React.FC<AttendanceTrackerProps> = ({ history }) => {
  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const today = new Date().toISOString().split('T')[0];

  const getDayStatus = (dateStr: string) => {
    return history.includes(dateStr);
  };

  // Simplified calendar view for the current week
  const getWeekDates = () => {
    const curr = new Date();
    const first = curr.getDate() - curr.getDay() + (curr.getDay() === 0 ? -6 : 1); // Monday
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(curr.setDate(first + i));
      return d.toISOString().split('T')[0];
    });
  };

  const weekDates = getWeekDates();

  return (
    <div className="max-w-2xl mx-auto">
      <div className="bg-white p-8 rounded-3xl card-shadow border border-blue-100 mb-8">
        <h2 className="text-2xl font-bold text-blue-900 mb-6 flex items-center gap-2">
          <span>📅</span> Weekly Progress
        </h2>

        <div className="grid grid-cols-7 gap-4">
          {weekDates.map((date, i) => {
            const isPresent = getDayStatus(date);
            const isToday = date === today;
            return (
              <div key={i} className="flex flex-col items-center gap-2">
                <span className="text-xs font-bold text-gray-400 uppercase">{days[i]}</span>
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all ${
                  isPresent ? 'bg-green-500 text-white shadow-lg' : isToday ? 'bg-blue-100 border-2 border-blue-400 text-blue-500' : 'bg-gray-100 text-gray-300'
                }`}>
                  {isPresent ? '✅' : '⚪'}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="bg-blue-500 p-8 rounded-3xl text-white flex items-center justify-between shadow-xl">
        <div>
          <h3 className="text-xl font-bold mb-1">Keep it up!</h3>
          <p className="text-blue-100 text-sm">You are on a {history.length}-day streak!</p>
        </div>
        <div className="text-5xl">🌱</div>
      </div>
    </div>
  );
};
