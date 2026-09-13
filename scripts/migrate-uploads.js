const fs = require('fs');
const path = require('path');
const { executeQuery } = require('../config/db');

async function migrateUploads() {
    const uploadDir = path.join(__dirname, '../public/uploads');
    const obsoleteDir = path.join(__dirname, '../public/uploads(obsolete)');
    const API_KEY = process.env.spiderwebapikey;
    const PROJECT_ID = process.env.spiderwebcloudstorageid;

    if (!API_KEY || !PROJECT_ID) {
        console.warn("[Migrate Uploads] API Key o Project ID faltante. No se puede migrar.");
        return;
    }

    if (!fs.existsSync(uploadDir)) return;
    if (!fs.existsSync(obsoleteDir)) fs.mkdirSync(obsoleteDir, { recursive: true });

    const files = fs.readdirSync(uploadDir);
    let migratedCount = 0;
    
    for (const file of files) {
        const filePath = path.join(uploadDir, file);
        if (fs.statSync(filePath).isDirectory()) continue;
        
        console.log(`[Migrate Uploads] Procesando ${file}...`);
        
        try {
            // Read file
            const fileBuf = fs.readFileSync(filePath);
            const form = new FormData();
            form.append('files', new Blob([fileBuf]), file);
            
            // Upload to API
            const res = await fetch(`https://spiderwebargapi.com.ar/api/v1/storage/projects/${PROJECT_ID}/files`, {
                method: 'POST',
                headers: {
                    'X-API-KEY': API_KEY
                },
                body: form
            });
            
            const data = await res.json();
            if (!data.success || !data.files || data.files.length === 0) {
                console.warn(`[Migrate Uploads] Error subiendo ${file}:`, data);
                continue; // Skip and continue to next file
            }
            
            const rawUrl = data.files[0].url;
            const newUrl = `/api/proxy/image?url=${encodeURIComponent(rawUrl)}`;
            const oldUrl = '/uploads/' + file;
            
            // Update DB references
            await executeQuery(`UPDATE ajustes_complejo SET logo_url = '${newUrl}' WHERE logo_url = '${oldUrl}'`);
            await executeQuery(`UPDATE ajustes_complejo SET hero_image_url = '${newUrl}' WHERE hero_image_url = '${oldUrl}'`);
            await executeQuery(`UPDATE ajustes_complejo SET hero_image_url_2 = '${newUrl}' WHERE hero_image_url_2 = '${oldUrl}'`);
            await executeQuery(`UPDATE ajustes_complejo SET hero_image_url_3 = '${newUrl}' WHERE hero_image_url_3 = '${oldUrl}'`);
            
            await executeQuery(`UPDATE plataforma_config SET logo_url = '${newUrl}' WHERE logo_url = '${oldUrl}'`);
            
            await executeQuery(`UPDATE mensajes SET file_url = '${newUrl}' WHERE file_url = '${oldUrl}'`);
            
            await executeQuery(`UPDATE reservas SET comprobante_url = '${newUrl}' WHERE comprobante_url = '${oldUrl}'`);
            
            // Move file to obsolete dir
            fs.renameSync(filePath, path.join(obsoleteDir, file));
            console.log(`[Migrate Uploads] Archivo ${file} migrado a ${newUrl}. Movido a obsoletos.`);
            migratedCount++;
        } catch (e) {
            console.error(`[Migrate Uploads] Excepción procesando ${file}:`, e.message);
        }
    }
    if (migratedCount > 0) {
        console.log(`[Migrate Uploads] Migración completada. ${migratedCount} archivos migrados.`);
    }
}

module.exports = migrateUploads;
