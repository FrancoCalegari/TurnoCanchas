const fs = require('fs');
const path = require('path');

const apiPath = path.join(__dirname, '../public/js/api.js');
let apiContent = fs.readFileSync(apiPath, 'utf8');

// Insert _getHeaders helper
if (!apiContent.includes('_getHeaders:')) {
    apiContent = apiContent.replace('window.API = {', `window.API = {
    _getHeaders: (isJson = true) => {
        const headers = {};
        if (isJson) headers['Content-Type'] = 'application/json';
        const tenantToken = localStorage.getItem('tenantToken');
        if (tenantToken) { headers['Authorization'] = 'Tenant ' + tenantToken; return headers; }
        const adminToken = localStorage.getItem('adminToken');
        if (adminToken) { headers['Authorization'] = 'Tenant ' + adminToken; }
        return headers;
    },`);
}

// Replace headers: { 'Content-Type': 'application/json' } with headers: window.API._getHeaders()
apiContent = apiContent.replace(/headers:\s*{\s*'Content-Type':\s*'application\/json'\s*}/g, 'headers: window.API._getHeaders()');

// For DELETE and GET requests that don't have headers specified in api.js but should have them
// Let's manually replace specific fetch calls
apiContent = apiContent.replace(/fetch\(`\$\{API_BASE\}\/canchas\/\$\{id\}`,\s*{\s*method:\s*'DELETE'\s*}\)/g, "fetch(`${API_BASE}/canchas/${id}`, { method: 'DELETE', headers: window.API._getHeaders(false) })");

apiContent = apiContent.replace(/fetch\(`\$\{API_BASE\}\/reservas\/\$\{id\}\/status`,\s*{\s*method:\s*'PUT',\s*headers:\s*window\.API\._getHeaders\(\),\s*body:\s*JSON\.stringify\(\{ status \}\)\s*}\)/g, 
"fetch(`${API_BASE}/reservas/${id}/status`, { method: 'PUT', headers: window.API._getHeaders(), body: JSON.stringify({ status }) })");

apiContent = apiContent.replace(/fetch\(`\$\{API_BASE\}\/reservas\/admin\?\$\{params\.toString\(\)\}`\)/g, "fetch(`${API_BASE}/reservas/admin?${params.toString()}`, { headers: window.API._getHeaders(false) })");

apiContent = apiContent.replace(/fetch\(`\$\{API_BASE\}\/reservas\/recientes`\)/g, "fetch(`${API_BASE}/reservas/recientes`, { headers: window.API._getHeaders(false) })");

apiContent = apiContent.replace(/fetch\(`\$\{API_BASE\}\/ajustes`\)/g, "fetch(`${API_BASE}/ajustes`, { headers: window.API._getHeaders(false) })");

fs.writeFileSync(apiPath, apiContent);
console.log('api.js fixed');
