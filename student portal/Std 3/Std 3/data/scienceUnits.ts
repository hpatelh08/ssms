/**
 * data/scienceUnits.ts
 * Science (EVS) syllabus units for AI Buddy - NCERT Std 3
 * Each chapter has a YouTube video link + embed ID for inline player.
 */

export interface ScienceUnitEntry {
  id: string;
  title: string;
  url: string;
  embedId: string;
}

function extractYTId(url: string): string {
  const short = url.match(/youtu\.be\/([^?&]+)/);
  if (short) return short[1];
  const long = url.match(/[?&]v=([^?&]+)/);
  if (long) return long[1];
  return '';
}

export const scienceUnits: ScienceUnitEntry[] = [
  {
    id: 'sci1',
    title: 'Chapter 1 - Family and Friends 👫',
    url: 'https://youtu.be/NWc9oYOW7jE?si=54dwV8FhITdXBFxp',
    embedId: extractYTId('https://youtu.be/NWc9oYOW7jE?si=54dwV8FhITdXBFxp'),
  },
  {
    id: 'sci2',
    title: 'Chapter 2 - Going to the Mela 🎡',
    url: 'https://youtu.be/GvQujzn4ddY?si=BDqUBwWr7OLhYaNs',
    embedId: extractYTId('https://youtu.be/GvQujzn4ddY?si=BDqUBwWr7OLhYaNs'),
  },
  {
    id: 'sci3',
    title: 'Chapter 3 - Celebrating Festivals 🎉',
    url: 'https://youtu.be/Z2UGKY22H4Y?si=_6qdI5KxHAHyl8wM',
    embedId: extractYTId('https://youtu.be/Z2UGKY22H4Y?si=_6qdI5KxHAHyl8wM'),
  },
  {
    id: 'sci4',
    title: 'Chapter 4 - Getting to Know Plants 🌿',
    url: 'https://youtu.be/bAKhlrle0kQ?si=OmVtQStC2VF4GLK8',
    embedId: extractYTId('https://youtu.be/bAKhlrle0kQ?si=OmVtQStC2VF4GLK8'),
  },
  {
    id: 'sci5',
    title: 'Chapter 5 - Plants and Animals Live Together 🦋',
    url: 'https://youtu.be/27BvrHZs8GA?si=I-JegHGzS22hpWNb',
    embedId: extractYTId('https://youtu.be/27BvrHZs8GA?si=I-JegHGzS22hpWNb'),
  },
  {
    id: 'sci6',
    title: 'Chapter 6 - Living in Harmony 🤝',
    url: 'https://youtu.be/6-VG7Yl6hpo?si=AkeYiObBdVfpcUA9',
    embedId: extractYTId('https://youtu.be/6-VG7Yl6hpo?si=AkeYiObBdVfpcUA9'),
  },
  {
    id: 'sci7',
    title: 'Chapter 7 - Water — A Precious Gift 💧',
    url: 'https://youtu.be/5s9-zLvhGsc?si=TFSMLtEn63CzUnTG',
    embedId: extractYTId('https://youtu.be/5s9-zLvhGsc?si=TFSMLtEn63CzUnTG'),
  },
  {
    id: 'sci8',
    title: 'Chapter 8 - Food We Eat 🍎',
    url: 'https://youtu.be/8lLLP4aAVJU?si=WksGbWpPQRZ4Jo0x',
    embedId: extractYTId('https://youtu.be/8lLLP4aAVJU?si=WksGbWpPQRZ4Jo0x'),
  },
  {
    id: 'sci9',
    title: 'Chapter 9 - Staying Healthy and Happy 😊',
    url: 'https://youtu.be/nRFjJIO08Kg?si=8AvjKm0gd8dEMUk_',
    embedId: extractYTId('https://youtu.be/nRFjJIO08Kg?si=8AvjKm0gd8dEMUk_'),
  },
  {
    id: 'sci10',
    title: 'Chapter 10 - This World of Things 📦',
    url: 'https://youtu.be/68uXr_kMpd8?si=67xZCeUyr0o06xdl',
    embedId: extractYTId('https://youtu.be/68uXr_kMpd8?si=67xZCeUyr0o06xdl'),
  },
  {
    id: 'sci11',
    title: 'Chapter 11 - Making Things 🏗️',
    url: 'https://youtu.be/dcpdtA4cJLM?si=hnU0CSXmF4kvhRdx',
    embedId: extractYTId('https://youtu.be/dcpdtA4cJLM?si=hnU0CSXmF4kvhRdx'),
  },
  {
    id: 'sci12',
    title: 'Chapter 12 - Taking Charge of Waste ♻️',
    url: 'https://youtu.be/nqD19H5ZwuE?si=BewCVA7sK8zCqnir',
    embedId: extractYTId('https://youtu.be/nqD19H5ZwuE?si=BewCVA7sK8zCqnir'),
  },
];
