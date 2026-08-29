require('dotenv').config();
const { executeQuery } = require('./config/db');

async function patch() {
    try {
        await executeQuery("ALTER TABLE ajustes_complejo ADD COLUMN hero_image_url_2 VARCHAR(500)");
        console.log("Columna 2 añadida");
    } catch (e) {
        console.log("Error 2:", e.message);
    }
    
    try {
        await executeQuery("ALTER TABLE ajustes_complejo ADD COLUMN hero_image_url_3 VARCHAR(500)");
        console.log("Columna 3 añadida");
    } catch (e) {
        console.log("Error 3:", e.message);
    }
    process.exit();
}
patch();
