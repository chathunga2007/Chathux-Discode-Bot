const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

function getAllJsFiles(dir) {
    let results = [];
    const list = fs.readdirSync(dir);
    for (const file of list) {
        if (file === 'node_modules') continue;
        const filePath = path.join(dir, file);
        const stat = fs.statSync(filePath);
        if (stat && stat.isDirectory()) {
            results = results.concat(getAllJsFiles(filePath));
        } else if (file.endsWith('.js')) {
            results.push(filePath);
        }
    }
    return results;
}

const rootFiles = ['index.js'].map(f => path.join(__dirname, '..', f)).filter(f => fs.existsSync(f));
const srcFiles = getAllJsFiles(path.join(__dirname, '../src'));
const dashboardFiles = getAllJsFiles(path.join(__dirname, '../dashboard'));
const scriptFiles = getAllJsFiles(path.join(__dirname, '../scripts'));

const allFiles = [...rootFiles, ...srcFiles, ...dashboardFiles, ...scriptFiles];

console.log(`Checking syntax for ${allFiles.length} JavaScript files...`);
let passed = 0;
let failed = 0;

for (const file of allFiles) {
    try {
        execSync(`node --check "${file}"`);
        passed++;
    } catch (err) {
        console.error(`❌ Syntax error in ${file}:`, err.message);
        failed++;
    }
}

if (failed > 0) {
    console.error(`\nFound ${failed} syntax error(s)!`);
    process.exit(1);
} else {
    console.log(`✔ All ${passed} JavaScript files passed syntax verification successfully!`);
    process.exit(0);
}
