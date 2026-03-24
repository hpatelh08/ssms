const fs = require('fs');
const path = require('path');

const targetDir = path.resolve('e:/intership/Std 4/Std 4');

// File extensions to process for text replacement
const extensions = ['.ts', '.tsx', '.js', '.jsx', '.json', '.md', '.html', '.css', '.py', '.mjs', '.bak'];

function processDirectory(dir) {
    const files = fs.readdirSync(dir);

    for (const file of files) {
        // Skip node_modules and .git
        if (file === 'node_modules' || file === '.git' || file === 'dist') continue;

        const fullPath = path.join(dir, file);
        const stat = fs.statSync(fullPath);

        if (stat.isDirectory()) {
            processDirectory(fullPath);
        } else {
            const ext = path.extname(fullPath).toLowerCase();
            if (extensions.includes(ext) || file === 'package.json') {
                replaceInFile(fullPath);
            }
        }

        // Rename file or directory if it contains "Class 1"
        if (file.includes('Class 1') || file.includes('Class-1')) {
            const newName = file.replace(/Class 1/g, 'Class 4').replace(/Class-1/g, 'Class-4');
            const newPath = path.join(dir, newName);
            console.log(`Renaming: ${fullPath} -> ${newPath}`);
            fs.renameSync(fullPath, newPath);
        }
    }
}

function replaceInFile(filePath) {
    try {
        let content = fs.readFileSync(filePath, 'utf8');

        let updated = false;
        // Replace "Class 1" with "Class 4"
        if (content.includes('Class 1')) {
            content = content.replace(/Class 1/g, 'Class 4');
            updated = true;
        }
        // Replace "class 1" with "class 4"
        if (content.includes('class 1')) {
            content = content.replace(/class 1/g, 'class 4');
            updated = true;
        }
        // Replace "Class-1" with "Class-4"
        if (content.includes('Class-1')) {
            content = content.replace(/Class-1/g, 'Class-4');
            updated = true;
        }

        if (updated) {
            fs.writeFileSync(filePath, content, 'utf8');
            console.log(`Updated content in: ${filePath}`);
        }
    } catch (err) {
        console.error(`Error processing file ${filePath}: ${err.message}`);
    }
}

console.log('Starting global replacement...');
processDirectory(targetDir);
console.log('Finished!');
