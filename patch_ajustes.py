import re

with open('controllers/ajustes.js', 'r', encoding='utf-8') as f:
    js = f.read()

getAjustesLogic = """
        // Asegurar que las columnas existan
        const columns = [
            "ALTER TABLE ajustes_complejo ADD COLUMN info_wifi_ssid VARCHAR(100)",
            "ALTER TABLE ajustes_complejo ADD COLUMN info_wifi_pass VARCHAR(100)",
            "ALTER TABLE ajustes_complejo ADD COLUMN info_buffet VARCHAR(255)",
            "ALTER TABLE ajustes_complejo ADD COLUMN info_reglas TEXT"
        ];
        for (const sql of columns) {
            try { await executeQuery(sql); } catch (e) {}
        }
"""

# Insert into getAjustes before the SELECT query
pattern1 = r'(        const result = await executeQuery\(`SELECT \* FROM ajustes_complejo WHERE \$\{tenantFilter\}`\);)'
js = re.sub(pattern1, getAjustesLogic + r'\1', js)

# Add to updateAjustes variables
pattern2 = r'(const \{ nombre_complejo, open_time, close_time, wpp_contacto, wpp_mensaje, ubicacion_maps, logo_url, hero_image_url, hero_image_url_2, hero_image_url_3, hero_title, canchas_title, nosotros_title, devolver_sena, mercadopago_alias )(\} = req\.body;)'
js = re.sub(pattern2, r'\1, info_wifi_ssid, info_wifi_pass, info_buffet, info_reglas \2', js)

# Add update fields
updateFieldsLogic = """
        if (info_wifi_ssid !== undefined) {
            const safe = String(info_wifi_ssid).replace(/'/g, "''");
            updates.push(`info_wifi_ssid = '${safe}'`);
        }
        if (info_wifi_pass !== undefined) {
            const safe = String(info_wifi_pass).replace(/'/g, "''");
            updates.push(`info_wifi_pass = '${safe}'`);
        }
        if (info_buffet !== undefined) {
            const safe = String(info_buffet).replace(/'/g, "''");
            updates.push(`info_buffet = '${safe}'`);
        }
        if (info_reglas !== undefined) {
            const safe = String(info_reglas).replace(/'/g, "''");
            updates.push(`info_reglas = '${safe}'`);
        }
"""
pattern3 = r'(        if \(mercadopago_alias !== undefined\) \{.*?        \})'
js = re.sub(pattern3, r'\1\n' + updateFieldsLogic, js, flags=re.DOTALL)

with open('controllers/ajustes.js', 'w', encoding='utf-8') as f:
    f.write(js)
