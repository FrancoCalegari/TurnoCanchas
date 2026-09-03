// scripts/add-mp-alias.js
// Migración: agrega columnas para alias MercadoPago y comprobante de pago

require('dotenv').config();
const { executeQuery } = require('../config/db');

async function migrate() {
    console.log('🚀 Iniciando migración: alias MercadoPago y comprobante de reserva...\n');

    try {
        // 1. Agregar columna mercadopago_alias a ajustes_complejo
        console.log('→ Agregando columna mercadopago_alias a ajustes_complejo...');
        await executeQuery(
            `ALTER TABLE ajustes_complejo ADD COLUMN IF NOT EXISTS mercadopago_alias VARCHAR(100) DEFAULT ''`
        );
        console.log('  ✅ mercadopago_alias agregada correctamente.\n');
    } catch (err) {
        console.error('  ❌ Error en ajustes_complejo:', err.message);
    }

    try {
        // 2. Agregar columna comprobante_url a reservas
        console.log('→ Agregando columna comprobante_url a reservas...');
        await executeQuery(
            `ALTER TABLE reservas ADD COLUMN IF NOT EXISTS comprobante_url TEXT DEFAULT NULL`
        );
        console.log('  ✅ comprobante_url agregada correctamente.\n');
    } catch (err) {
        console.error('  ❌ Error en reservas:', err.message);
    }

    console.log('✅ Migración completada.');
}

migrate().catch(console.error);
