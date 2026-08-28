const fs = require('fs');
let content = fs.readFileSync('src/components/ClientIntake/ClientIntakeView.tsx', 'utf8');
content = content.replace(/notes: \(shareModalClient\.notes \? shareModalClient\.notes \+ '\n' : ''\)/g, "notes: (shareModalClient.notes ? shareModalClient.notes + '\\n' : '')");
fs.writeFileSync('src/components/ClientIntake/ClientIntakeView.tsx', content);
