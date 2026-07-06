const fs = require('fs');

const filePath = 'c:/Users/HP/OneDrive/Desktop/POS_Inventory/POS/frontend/src/pages/CashierDashboard.tsx';
const content = fs.readFileSync(filePath, 'utf8');

let lineNum = 1;
let openBraces = [];
let openParens = [];

let i = 0;
while (i < content.length) {
  const char = content[i];
  if (char === '\n') {
    lineNum++;
  }

  // Skip strings
  if (char === '"' || char === "'" || char === '`') {
    const quote = char;
    i++;
    while (i < content.length) {
      if (content[i] === '\n') lineNum++;
      if (content[i] === quote && content[i-1] !== '\\') {
        break;
      }
      i++;
    }
    i++;
    continue;
  }

  // Skip comments
  if (content.substr(i, 2) === '/*') {
    i = content.indexOf('*/', i + 2);
    if (i === -1) break;
    i += 1;
    continue;
  }
  if (content.substr(i, 2) === '//') {
    const nextNL = content.indexOf('\n', i + 2);
    if (nextNL === -1) break;
    lineNum++;
    i = nextNL;
    continue;
  }

  // Braces
  if (char === '{') {
    openBraces.push(lineNum);
  } else if (char === '}') {
    if (openBraces.length === 0) {
      console.log(`Extra close brace } at line ${lineNum}`);
    } else {
      openBraces.pop();
    }
  }

  // Parentheses
  if (char === '(') {
    openParens.push(lineNum);
  } else if (char === ')') {
    if (openParens.length === 0) {
      console.log(`Extra close paren ) at line ${lineNum}`);
    } else {
      openParens.pop();
    }
  }

  i++;
}

console.log(`Unmatched Braces count: ${openBraces.length}. Left open at lines:`, openBraces);
console.log(`Unmatched Parens count: ${openParens.length}. Left open at lines:`, openParens);
