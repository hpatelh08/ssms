
import React, { useState } from 'react';
import { TextbookChunk, TeacherMessage, UserStats, SkillLevel } from '../types';
import { INITIAL_MESSAGES } from '../constants';

interface ParentDashboardProps {
  knowledgeBase: TextbookChunk[];
  stats: UserStats;
  onAddKnowledge: (chunk: TextbookChunk) => void;
}

export const ParentDashboard: React.FC<ParentDashboardProps> = ({ knowledgeBase, stats, onAddKnowledge }) => {
  const [messages] = useState<TeacherMessage[]>(INITIAL_MESSAGES);
  const [newChunk, setNewChunk] = useState({ subject: 'English', chapter: '', page: 1, content: '' });

  const handleAdd = () => {
    if (!newChunk.chapter || !newChunk.content) return;
    onAddKnowledge({
      id: Math.random().toString(36).substr(2, 9),
      subject: newChunk.subject as 'English' | 'Math',
      chapter: newChunk.chapter,
      page: Number(newChunk.page),
      content: newChunk.content
    });
    setNewChunk({ subject: 'English', chapter: '', page: 1, content: '' });
  };

  const getSmileIcon = (level: SkillLevel) => {
    switch(level) {
      case 'Star': return '🤩';
      case 'Active': return '😊';
      case 'Improving': return '🙂';
      default: return '👶';
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-20">
      <header className="bg-blue-900 p-10 rounded-[24px] text-white shadow-2xl relative overflow-hidden">
        <div className="relative z-10">
          <h2 className="text-4xl font-bold mb-2">Parent Gateway</h2>
          <p className="text-blue-300">Safe monitoring & curriculum management.</p>
        </div>
        <div className="absolute top-0 right-0 p-8 text-8xl opacity-10">🛡️</div>
      </header>

      {/* Skill Progress Section */}
      <section className="bg-white p-8 rounded-[24px] card-shadow border border-blue-50">
        <h3 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-3">
          <span className="p-2 bg-green-100 rounded-xl">📊</span> Qualitative Progress
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <SkillCard label="Reading" level={stats.skills.reading} icon={getSmileIcon(stats.skills.reading)} color="bg-orange-50" />
          <SkillCard label="Writing" level={stats.skills.writing} icon={getSmileIcon(stats.skills.writing)} color="bg-blue-50" />
          <SkillCard label="Participation" level={stats.skills.participation} icon={getSmileIcon(stats.skills.participation)} color="-orange-" />
        </div>
        <p className="mt-4 text-xs text-gray-400 text-center italic">"Progress is measured by engagement and activity completion, not competition."</p>
      </section>

      <div className="grid lg:grid-cols-2 gap-8">
        {/* Messages */}
        <section className="bg-white p-8 rounded-[24px] card-shadow border border-gray-100">
          <h3 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-3">
            <span className="p-2 bg-blue-100 rounded-xl">✉️</span> Teacher Insights
          </h3>
          <div className="space-y-4">
            {messages.map(msg => (
              <div key={msg.id} className="p-5 bg-gray-50 rounded-3xl border border-gray-100 hover:border-blue-200 transition-colors">
                <div className="flex justify-between items-start mb-2">
                  <span className="font-bold text-blue-700">{msg.sender}</span>
                  <span className="text-xs text-gray-400 font-medium">{msg.date}</span>
                </div>
                <p className="text-sm text-gray-600 leading-relaxed">{msg.text}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Curriculum Upload */}
        <section className="bg-white p-8 rounded-[24px] card-shadow border border-gray-100">
          <h3 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-3">
            <span className="p-2 bg-orange-100 rounded-xl">📚</span> Book Knowledge Base
          </h3>
          <div className="space-y-4 bg-blue-50/50 p-6 rounded-3xl">
            <div className="flex gap-3">
              <select 
                value={newChunk.subject}
                onChange={(e) => setNewChunk({...newChunk, subject: e.target.value})}
                className="px-4 py-3 bg-white border-2 border-blue-100 rounded-2xl text-sm font-bold focus:border-blue-500 outline-none"
              >
                <option>English</option>
                <option>Math</option>
              </select>
              <input 
                placeholder="Chapter Topic" 
                value={newChunk.chapter}
                onChange={(e) => setNewChunk({...newChunk, chapter: e.target.value})}
                className="flex-1 px-4 py-3 bg-white border-2 border-blue-100 rounded-2xl text-sm focus:border-blue-500 outline-none"
              />
            </div>
            <textarea 
              placeholder="Paste textbook page text here..." 
              value={newChunk.content}
              onChange={(e) => setNewChunk({...newChunk, content: e.target.value})}
              className="w-full p-4 bg-white border-2 border-blue-100 rounded-2xl text-sm min-h-[120px] focus:border-blue-500 outline-none"
            />
            <button 
              onClick={handleAdd}
              className="w-full bg-blue-600 text-white font-bold py-4 rounded-2xl hover:bg-blue-700 shadow-lg transition-all"
            >
              Feed to AI Brain
            </button>
          </div>
        </section>
      </div>
    </div>
  );
};

const SkillCard: React.FC<{ label: string; level: SkillLevel; icon: string; color: string }> = ({ label, level, icon, color }) => (
  <div className={`${color} p-6 rounded-3xl border border-white shadow-sm flex flex-col items-center text-center`}>
    <div className="text-5xl mb-4">{icon}</div>
    <span className="text-sm text-gray-500 font-medium uppercase tracking-widest">{label}</span>
    <span className="text-xl font-bold text-gray-800">{level}</span>
  </div>
);
