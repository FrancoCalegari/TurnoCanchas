const fs = require('fs');
const path = require('path');

const canchasPath = path.join(__dirname, '../routes/canchas.js');
let canchas = fs.readFileSync(canchasPath, 'utf8');
if (!canchas.includes('requireTenantAdmin')) {
    canchas = canchas.replace("const canchasController = require('../controllers/canchas');", "const canchasController = require('../controllers/canchas');\nconst { requireTenantAdmin } = require('../middleware/auth');");
    canchas = canchas.replace("router.post('/', canchasController.create);", "router.post('/', requireTenantAdmin, canchasController.create);");
    canchas = canchas.replace("router.put('/:id', canchasController.update);", "router.put('/:id', requireTenantAdmin, canchasController.update);");
    canchas = canchas.replace("router.delete('/:id', canchasController.deleteCancha);", "router.delete('/:id', requireTenantAdmin, canchasController.deleteCancha);");
    fs.writeFileSync(canchasPath, canchas);
}

const reservasPath = path.join(__dirname, '../routes/reservas.js');
let reservas = fs.readFileSync(reservasPath, 'utf8');
if (!reservas.includes('requireTenantAdmin')) {
    reservas = reservas.replace("const reservasController = require('../controllers/reservas');", "const reservasController = require('../controllers/reservas');\nconst { requireTenantAdmin } = require('../middleware/auth');");
    reservas = reservas.replace("router.get('/admin', reservasController.getAdminReservas);", "router.get('/admin', requireTenantAdmin, reservasController.getAdminReservas);");
    reservas = reservas.replace("router.get('/recientes', reservasController.getRecent);", "router.get('/recientes', requireTenantAdmin, reservasController.getRecent);");
    reservas = reservas.replace("router.put('/:id/status', reservasController.updateStatus);", "router.put('/:id/status', requireTenantAdmin, reservasController.updateStatus);");
    fs.writeFileSync(reservasPath, reservas);
}

const ajustesPath = path.join(__dirname, '../routes/ajustes.js');
let ajustes = fs.readFileSync(ajustesPath, 'utf8');
if (!ajustes.includes('requireTenantAdmin')) {
    ajustes = ajustes.replace("const ajustesController = require('../controllers/ajustes');", "const ajustesController = require('../controllers/ajustes');\nconst { requireTenantAdmin } = require('../middleware/auth');");
    ajustes = ajustes.replace("router.put('/', ajustesController.updateAjustes);", "router.put('/', requireTenantAdmin, ajustesController.updateAjustes);");
    // getAjustes is used publicly by the portal, but wait, does the portal use it? Yes! 
    // And it uses req.tenant.id if logged in, or req.query.tenant if public.
    fs.writeFileSync(ajustesPath, ajustes);
}

console.log('Routes fixed');
