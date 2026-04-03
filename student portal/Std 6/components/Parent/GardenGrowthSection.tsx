import React from 'react';
import { motion } from 'framer-motion';

// Dummy data for now — replace with real growth/progress later
const plants = [
  { id: 1, name: 'Sunflower', stage: 3, maxStage: 5, icon: '🌻', color: '#fde68a' },
  { id: 2, name: 'Tulip', stage: 2, maxStage: 4, icon: '🌷', color: '#fca5a5' },
  { id: 3, name: 'Cactus', stage: 4, maxStage: 4, icon: '🌵', color: '#bbf7d0' },
  { id: 4, name: 'Sprout', stage: 1, maxStage: 3, icon: '🌱', color: '#a7f3d0' },
];

const stageIcons = ['🌱', '🌿', '🌼', '🌻', '🏆'];

const GardenGrowthSection: React.FC = () => {
  return (
    <motion.section
      className="bg-gradient-to-br from-green-50 via-lime-100 to-yellow-50 p-8 rounded-[24px] card-shadow border border-green-100 relative overflow-hidden"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <h3 className="text-2xl font-bold text-green-800 mb-6 flex items-center gap-3">
        <span className="p-2 bg-green-200 rounded-xl">🌱</span> Garden Growth
      </h3>
      <div className="flex flex-wrap gap-6 justify-center">
        {plants.map((plant, i) => (
          <motion.div
            key={plant.id}
            className="flex flex-col items-center justify-end bg-white/70 rounded-3xl shadow-lg p-6 w-40 h-56 border-2 border-green-100 relative"
            style={{ background: plant.color }}
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: i * 0.08 }}
          >
            <span className="text-5xl mb-2 drop-shadow-lg">{plant.icon}</span>
            <div className="flex gap-1 mb-2">
              {Array.from({ length: plant.maxStage }).map((_, s) => (
                <span key={s} className={`text-xl ${s < plant.stage ? 'opacity-100' : 'opacity-30'}`}>{stageIcons[s] || '🌱'}</span>
              ))}
            </div>
            <span className="font-bold text-green-900 text-lg mb-1">{plant.name}</span>
            <span className="text-xs text-green-700">Stage {plant.stage} / {plant.maxStage}</span>
            {plant.stage === plant.maxStage && <span className="absolute top-3 right-3 text-xl">🏆</span>}
          </motion.div>
        ))}
      </div>
      <p className="mt-6 text-center text-green-700 text-sm italic">Each plant grows as your child completes activities and learns new things!</p>
      <div className="absolute left-4 bottom-4 text-4xl select-none pointer-events-none">🐞</div>
      <div className="absolute right-4 bottom-4 text-4xl select-none pointer-events-none">🦋</div>
    </motion.section>
  );
};

export default GardenGrowthSection;
