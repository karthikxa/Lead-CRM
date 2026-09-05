const fs = require('fs');
const path = require('path');

const sh = fs.readFileSync('branding/patch-branding.sh', 'utf8');

// Extract the first node block between << 'EOF' and EOF
const match = sh.match(/node - << 'EOF'([\s\S]*?)\nEOF/);
if (match) {
  console.log('Found node script block in patch-branding.sh, length:', match[1].length);
  // Test if it has valid JS syntax by parsing it
  try {
    new Function(match[1]);
    console.log('JS syntax in patch-branding.sh is 100% VALID!');
  } catch (e) {
    console.error('Syntax error in patch-branding.sh:', e.message);
  }
} else {
  console.log('Could not find node block');
}
