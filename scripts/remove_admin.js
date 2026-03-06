const fs = require('fs');
const path = require('path');
const dir = 'e:/Antigravity/AlumniConnectionFrontend/src/pages/Admin';
const files = fs.readdirSync(dir).filter(f => f.endsWith('.js'));
for (const file of files) {
    const filePath = path.join(dir, file);
    let content = fs.readFileSync(filePath, 'utf8');
    content = content.replace(/import AdminNavbar from '\.\.\/\.\.\/components\/admin\/AdminNavbar';\r?\n?/g, '');
    content = content.replace(/[ \t]*<AdminNavbar \/>\r?\n?/g, '');
    fs.writeFileSync(filePath, content, 'utf8');
}
console.log('Removed all redundant <AdminNavbar /> usages.');
