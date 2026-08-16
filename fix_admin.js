const fs = require('fs');
let content = fs.readFileSync('public/admin.html', 'utf-8');

// Replace table body
const tableStartStr = '<tbody\n                    class="divide-y divide-slate-100 dark:divide-slate-800/60 text-sm"\n                  >';
const tableEndStr = '</tbody>';

const startIdx = content.indexOf(tableStartStr);
const endIdx = content.indexOf(tableEndStr, startIdx) + tableEndStr.length;

if (startIdx !== -1 && endIdx !== -1) {
    const replacement = '<tbody id="admin-reservas-table" class="divide-y divide-slate-100 dark:divide-slate-800/60 text-sm">\n                    <!-- Dynamically populated by admin.js -->\n                  </tbody>';
    content = content.slice(0, startIdx) + replacement + content.slice(endIdx);
} else {
    console.log("Could not find table body");
}

// Replace KPIs
content = content.replace('<p class="text-3xl font-black text-slate-900 dark:text-white">\n                  24\n                </p>', '<p id="kpi-reservas-hoy" class="text-3xl font-black text-slate-900 dark:text-white">\n                  0\n                </p>');

content = content.replace('<p class="text-3xl font-black text-slate-900 dark:text-white">\n                  $845k\n                </p>', '<p id="kpi-ingresos" class="text-3xl font-black text-slate-900 dark:text-white">\n                  $0\n                </p>');

content = content.replace('<p class="text-3xl font-black text-slate-900 dark:text-white">\n                  68%\n                </p>', '<p id="kpi-ocupacion" class="text-3xl font-black text-slate-900 dark:text-white">\n                  0%\n                </p>');

content = content.replace('<p class="text-3xl font-black text-slate-900 dark:text-white">\n                  5<span class="text-lg text-slate-400 font-medium">/6</span>\n                </p>', '<p id="kpi-canchas-activas" class="text-3xl font-black text-slate-900 dark:text-white">\n                  0<span class="text-lg text-slate-400 font-medium">/0</span>\n                </p>');

// Insert JS scripts
content = content.replace('</body>', '  <script src="/js/api.js"></script>\n    <script src="/js/admin.js"></script>\n  </body>');

fs.writeFileSync('public/admin.html', content);
console.log("Successfully replaced admin.html content");
