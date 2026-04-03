import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { TextbookChunk, TeacherMessage, UserStats, SkillLevel } from '../types';
import { INITIAL_MESSAGES } from '../constants';
import { GlassCard } from './ui/GlassCard';
import { FloatingIcon } from './ui/FloatingIcon';
import { getAuditLog, getAIInteractionLog } from '../utils/auditLog';

interface ParentDashboardProps {
  knowledgeBase: TextbookChunk[];
  stats: UserStats;
  onAddKnowledge: (chunk: TextbookChunk) => void;
}

export const ParentDashboard: React.FC<ParentDashboardProps> = ({ knowledgeBase, stats, onAddKnowledge }) => {
  const [messages] = useState<TeacherMessage[]>(INITIAL_MESSAGES);
  const [newChunk, setNewChunk] = useState({ subject: 'English', chapter: '', page: 1, content: '' });
  const [showAuditLog, setShowAuditLog] = useState(false);

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
    switch (level) {
      case 'Star': return '🤩';
      case 'Active': return '😊';
      case 'Improving': return '🙂';
      default: return '👶';
    }
  };

  const auditLog = showAuditLog ? getAuditLog().slice(0, 20) : [];
  const aiLogs = getAIInteractionLog();

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-24">
      {/* Header */}
      <motion.div
        className="relative overflow-hidden rounded-[24px] bg-gradient-to-br from-blue-900 via-blue-800 -amber- p-8 lg:p-10 text-white shadow-2xl"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="relative z-10">
          <h2 className="text-3xl lg:text-4xl font-bold mb-2 flex items-center gap-3">
            <FloatingIcon icon="🛡️" size="lg" glow="blue" animate={false} />
            Parent Gateway
          </h2>
          <p className="text-blue-300 text-sm ml-[60px]">Safe monitoring & curriculum management</p>
        </div>
        <div className="absolute top-0 right-0 w-60 h-60 bg-blue-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-40 h-40 bg-cyan-500/10 rounded-full blur-3xl" />
      </motion.div>

      {/* Skill Cards */}
      <GlassCard variant="strong" hover={false} className="p-6 lg:p-8">
        <h3 className="text-xl font-bold text-blue-900 mb-5 flex items-center gap-3">
          <FloatingIcon icon="📊" size="sm" glow="green" animate={false} />
          Qualitative Progress
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <SkillCard label="Reading" level={stats.skills.reading} icon={getSmileIcon(stats.skills.reading)} gradient="from-orange-100/60 to-amber-50/40" />
          <SkillCard label="Writing" level={stats.skills.writing} icon={getSmileIcon(stats.skills.writing)} gradient="from-blue-100/60 to-cyan-50/40" />
          <SkillCard label="Participation" level={stats.skills.participation} icon={getSmileIcon(stats.skills.participation)} gradient="-orange-/60 to-pink-50/40" />
        </div>
        <p className="mt-4 text-xs text-gray-400 text-center italic">
          "Progress is measured by engagement and activity completion, not competition."
        </p>
      </GlassCard>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Teacher Messages */}
        <GlassCard variant="strong" hover={false} className="p-6 lg:p-8">
          <h3 className="text-lg font-bold text-blue-900 mb-5 flex items-center gap-3">
            <FloatingIcon icon="✉️" size="sm" glow="blue" animate={false} />
            Teacher Insights
          </h3>
          <div className="space-y-3">
            {messages.map((msg, i) => (
              <motion.div
                key={msg.id}
                className="p-4 bg-white/40 rounded-2xl border border-white/40 hover:bg-white/60 transition-colors"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.1 }}
              >
                <div className="flex justify-between items-start mb-1.5">
                  <span className="font-bold text-blue-700 text-sm">{msg.sender}</span>
                  <span className="text-[10px] text-gray-400 font-medium">{msg.date}</span>
                </div>
                <p className="text-sm text-gray-600 leading-relaxed">{msg.text}</p>
              </motion.div>
            ))}
          </div>
        </GlassCard>

        {/* Book Knowledge Upload */}
        <GlassCard variant="strong" hover={false} className="p-6 lg:p-8">
          <h3 className="text-lg font-bold text-blue-900 mb-5 flex items-center gap-3">
            <FloatingIcon icon="📚" size="sm" glow="amber" animate={false} />
            Book Knowledge Base
          </h3>
          <div className="space-y-3 bg-blue-50/30 p-4 rounded-2xl border border-blue-100/20">
            <div className="flex gap-2">
              <select
                value={newChunk.subject}
                onChange={(e) => setNewChunk({ ...newChunk, subject: e.target.value })}
                className="px-3 py-2.5 bg-white/60 border border-blue-100/30 rounded-xl text-sm font-bold focus:border-blue-400 outline-none backdrop-blur-sm"
              >
                <option>English</option>
                <option>Math</option>
              </select>
              <input
                placeholder="Chapter Topic"
                value={newChunk.chapter}
                onChange={(e) => setNewChunk({ ...newChunk, chapter: e.target.value })}
                className="flex-1 px-3 py-2.5 bg-white/60 border border-blue-100/30 rounded-xl text-sm focus:border-blue-400 outline-none backdrop-blur-sm"
              />
            </div>
            <textarea
              placeholder="Paste textbook page text here..."
              value={newChunk.content}
              onChange={(e) => setNewChunk({ ...newChunk, content: e.target.value })}
              className="w-full p-3 bg-white/60 border border-blue-100/30 rounded-xl text-sm min-h-[100px] focus:border-blue-400 outline-none backdrop-blur-sm resize-none"
            />
            <motion.button
              onClick={handleAdd}
              className="w-full bg-gradient-to-r from-blue-600 to-blue-500 text-white font-bold py-3 rounded-xl shadow-lg shadow-blue-500/15 transition-all"
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.98 }}
            >
              Feed to AI Brain
            </motion.button>
          </div>
        </GlassCard>
      </div>

      {/* Audit Log Section */}
      <GlassCard variant="strong" hover={false} className="p-6 lg:p-8">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-blue-900 flex items-center gap-3">
            <FloatingIcon icon="📋" size="sm" glow="purple" animate={false} />
            Activity & AI Audit Log
          </h3>
          <motion.button
            className="text-xs font-bold text-blue-400 bg-blue-50/60 px-3 py-1.5 rounded-xl border border-blue-100/30"
            onClick={() => setShowAuditLog(!showAuditLog)}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            {showAuditLog ? 'Hide Log' : 'Show Log'} ({aiLogs.length} AI interactions)
          </motion.button>
        </div>

        {showAuditLog && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            className="space-y-2 max-h-80 overflow-y-auto"
          >
            {auditLog.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-4">No activity logged yet.</p>
            ) : (
              auditLog.map((entry) => (
                <div key={entry.id} className="flex items-start gap-3 p-3 bg-white/30 rounded-xl text-xs">
                  <span className={`px-2 py-0.5 rounded-lg font-bold uppercase ${
                    entry.category === 'ai' ? 'bg-cyan-100/60 text-cyan-600' :
                    entry.category === 'homework' ? 'bg-amber-100/60 text-amber-600' :
                    entry.category === 'game' ? '-orange-/60 -orange-' :
                    'bg-gray-100/60 text-gray-500'
                  }`}>
                    {entry.category}
                  </span>
                  <div className="flex-1 min-w-0">
                    <span className="font-medium text-blue-900">{entry.action}</span>
                    <span className="block text-gray-400 mt-0.5 truncate">
                      {new Date(entry.timestamp).toLocaleString()}
                    </span>
                  </div>
                </div>
              ))
            )}
          </motion.div>
        )}
      </GlassCard>
    </div>
  );
};

const SkillCard: React.FC<{ label: string; level: SkillLevel; icon: string; gradient: string }> = ({
  label, level, icon, gradient
}) => (
  <motion.div
    className={`bg-gradient-to-br ${gradient} p-5 rounded-2xl border border-white/40 flex flex-col items-center text-center`}
    whileHover={{ y: -2, scale: 1.02 }}
    transition={{ type: 'spring', stiffness: 300 }}
  >
    <span className="text-4xl mb-3" style={{ filter: 'drop-shadow(0 0 8px rgba(59,130,246,0.3))' }}>
      {icon}
    </span>
    <span className="text-[10px] text-gray-500 font-medium uppercase tracking-widest">{label}</span>
    <span className="text-lg font-bold text-blue-900">{level}</span>
  </motion.div>
);
