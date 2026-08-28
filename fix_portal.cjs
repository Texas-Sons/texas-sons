const fs = require('fs');
let content = fs.readFileSync('src/components/IntakePortal/IntakePortal.tsx', 'utf8');

// Replace corrupted fetch calls
content = content.replace(/fetch\([^\)]*?t[^\)]*\)/g, "fetch('/api/intake/' + t)");
content = content.replace(/fetch\([^\)]*?token[^\)]*\)/g, "fetch('/api/intake/' + token, {");

fs.writeFileSync('src/components/IntakePortal/IntakePortal.tsx', content);
