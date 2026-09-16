const express = require('express');
const app = express();
app.use(express.json());
require('dotenv').config();
app.use((req, res, next) => {
    // mock req.tenant
    req.tenant = { id: 1, slug: 'myslug' };
    next();
});
app.use('/api/reservas', require('./routes/reservas'));
app.use((err, req, res, next) => { console.error(err); res.status(500).json({ error: err.message }); });
app.listen(3006, () => {
    console.log('Server started on 3006');
    const fetch = require('node-fetch');
    fetch('http://localhost:3006/api/reservas/RES-123/status', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': 'Tenant dGVuYW50OjE6bXlzbHVnOjEyMw==' },
        body: JSON.stringify({ status: 'confirmada' })
    })
    .then(res => res.json().then(data => ({status: res.status, data})))
    .then(console.log)
    .catch(console.error)
    .finally(() => process.exit(0));
});
