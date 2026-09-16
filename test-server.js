const express = require('express');
const app = express();
app.use(express.json());
app.use('/api/reservas', require('./routes/reservas'));
app.use((err, req, res, next) => { console.error(err); res.status(500).json({ error: err.message }); });
app.listen(3005, () => console.log('Server started'));
