const fs = require('fs');
const path = require('path');

const srcNcert = path.join(__dirname, 'STD 04', 'NCERT');
const srcGseb = path.join(__dirname, 'STD 04', 'GSEB', 'GUJAARATI');

const destNcert = path.join(__dirname, 'public', 'books', 'ncert');
const destGsebGuj = path.join(__dirname, 'public', 'books', 'gseb', 'gujarati');

// Create directories if they don't exist
[destNcert, destGsebGuj].forEach(dir => {
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
        console.log('Created dir:', dir);
    }
});

const filesToCopy = [
    { src: path.join(srcNcert, 'NCERT_Eglish.pdf'), dest: path.join(destNcert, 'NCERT_English.pdf') },
    { src: path.join(srcNcert, 'NCERT_Hindi.pdf'), dest: path.join(destNcert, 'NCERT_Hindi.pdf') },
    { src: path.join(srcNcert, 'NCERT_Mathematics.pdf'), dest: path.join(destNcert, 'NCERT_Mathematics.pdf') },
    { src: path.join(srcNcert, 'NCERT_Science.pdf'), dest: path.join(destNcert, 'NCERT_Science.pdf') },
    { src: path.join(srcGseb, 'Gujarat-Board-Class-4-Gujarati-Second-Langauge-Textbook.pdf'), dest: path.join(destGsebGuj, 'Gujarat_Gujarati.pdf') },
];

filesToCopy.forEach(({ src, dest }) => {
    try {
        fs.copyFileSync(src, dest);
        console.log(`Copied ${src} -> ${dest}`);
    } catch (err) {
        console.error(`Failed to copy ${src}: ${err.message}`);
    }
});
