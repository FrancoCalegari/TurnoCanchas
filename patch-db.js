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
    try {
        await executeQuery("ALTER TABLE ajustes_complejo ADD COLUMN wpp_mensaje TEXT");
        console.log("Columna wpp_mensaje añadida");
    } catch (e) {
        console.log("Error wpp_mensaje:", e.message);
    }
    try {
        await executeQuery("ALTER TABLE ajustes_complejo ADD COLUMN devolver_sena VARCHAR(5) DEFAULT 'no'");
        console.log("Columna devolver_sena añadida");
    } catch (e) {
        console.log("Error devolver_sena:", e.message);
    }
    process.exit();


}
patch();
