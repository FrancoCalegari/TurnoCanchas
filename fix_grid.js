const fs = require('fs');
const content = fs.readFileSync('public/index.html', 'utf-8');

const targetStart = '<div class="grid grid-cols-1 md:grid-cols-2 gap-6">';
const startIndex = content.indexOf(targetStart);

if (startIndex === -1) {
  console.log("Could not find start");
  process.exit(1);
}

// Find the matching end div for the grid container
let depth = 0;
let endIndex = -1;
let tagRegex = /<\/?div[^>]*>/g;
tagRegex.lastIndex = startIndex;

let match;
while ((match = tagRegex.exec(content)) !== null) {
  if (match[0].startsWith('</div')) {
    depth--;
  } else if (match[0].startsWith('<div')) {
    depth++;
  }
  
  if (depth === 0) {
    endIndex = match.index + match[0].length;
    break;
  }
}

if (endIndex === -1) {
  console.log("Could not find end");
  process.exit(1);
}

const before = content.slice(0, startIndex);
const after = content.slice(endIndex);
const replacement = '<div id="courts-grid" class="grid grid-cols-1 md:grid-cols-2 gap-6">\n                  <!-- Courts will be dynamically injected here by app.js -->\n                </div>';

fs.writeFileSync('public/index.html', before + replacement + after);
console.log("Successfully replaced courts grid");
