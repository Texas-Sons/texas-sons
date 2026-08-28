const fs = require('fs');
let content = fs.readFileSync('src/components/ClientIntake/ClientIntakeView.tsx', 'utf8');

content = content.replace(/const emailText = "Subject: Welcome to TX Sons[\s\S]*?Engine";/g, (match) => {
  return 'const emailText = `Subject: Welcome to TX Sons — Let\'s build ${shareModalClient.businessName}\\n\\nHi ${shareModalClient.clientContact || \'there\'},\\n\\nWe are thrilled to kick off your new digital platform! To get started, please take a few minutes to upload your logo, photos, and basic info to your secure intake portal:\\n\\n${link}\\n\\nOnce received, we\'ll start building your site right away. Let us know if you have any questions!\\n\\nBest regards,\\nMorgan\\nTX Sons Delivery Engine`;';
});

content = content.replace(/const smsText = "Hey[\s\S]*?link;/g, (match) => {
  return 'const smsText = `Hey ${shareModalClient.clientContact || \'there\'}! This is Morgan with TX Sons. We\'re ready to start building ${shareModalClient.businessName}. Please upload your logo and photos to your secure portal here: ${link}`;';
});

fs.writeFileSync('src/components/ClientIntake/ClientIntakeView.tsx', content);
