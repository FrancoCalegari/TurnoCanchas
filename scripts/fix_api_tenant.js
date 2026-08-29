const fs = require('fs');
const path = require('path');

const apiPath = path.join(__dirname, '../public/js/api.js');
let api = fs.readFileSync(apiPath, 'utf8');

// Modify getPublicTenant to fallback to tenantData slug if available
api = api.replace(
`    getPublicTenant: () => {
        const path = window.location.pathname;
        if (path.startsWith('/t/')) {
            return path.split('/t/')[1].split('/')[0];
        }
        return null;
    },`,
`    getPublicTenant: () => {
        const path = window.location.pathname;
        if (path.startsWith('/t/')) {
            return path.split('/t/')[1].split('/')[0];
        }
        const tData = window.API.getTenantInfo ? window.API.getTenantInfo() : null;
        if (tData && tData.slug) return tData.slug;
        return null;
    },`);

fs.writeFileSync(apiPath, api);
console.log('getPublicTenant fixed');
