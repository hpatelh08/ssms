const fs = require('fs');
const path = require('path');

const srcNcert = path.join(__dirname, 'STD 04', 'NCERT');
const destNcert = path.join(__dirname, 'public', 'books', 'ncert');

const filesToCopy = [
    { src: path.join(srcNcert, 'NCERT_Khel Yoga.pdf'), dest: path.join(destNcert, 'NCERT_Khel_Yoga.pdf') },
    { src: path.join(srcNcert, 'NCERT_art.pdf'), dest: path.join(destNcert, 'NCERT_Art.pdf') },
];

filesToCopy.forEach(({ src, dest }) => {
    try {
        fs.copyFileSync(src, dest);
        console.log(`Copied ${src} -> ${dest}`);
    } catch (err) {
        console.error(`Failed to copy ${src}: ${err.message}`);
    }
});
