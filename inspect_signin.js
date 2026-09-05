const fs = require('fs');
const content = fs.readFileSync('/app/packages/twenty-server/dist/front/assets/SignInUp-T9ijW4vP.js', 'utf8');

const taIdx = content.indexOf('ta=');
if (taIdx !== -1) {
  console.log(content.substring(taIdx, taIdx + 800));
} else {
  const taIdx2 = content.indexOf('ta =');
  console.log(content.substring(taIdx2, taIdx2 + 800));
}
