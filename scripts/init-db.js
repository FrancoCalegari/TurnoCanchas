require('dotenv').config();
const { executeQuery } = require('../config/db');

async function initDB() {
    console.log("Iniciando creación de tablas en SpiderWeb...");

    const createCanchas = `
        CREATE TABLE IF NOT EXISTS canchas (
            id SERIAL PRIMARY KEY,
            nombre VARCHAR(100) NOT NULL,
            deporte VARCHAR(50) NOT NULL,
            descripcion TEXT,
            precioPorHora INT NOT NULL,
            estado VARCHAR(50) DEFAULT 'disponible',
            colorTag VARCHAR(100),
            porcentaje_sena INT DEFAULT 50
        )
    `;

    const createReservas = `
        CREATE TABLE IF NOT EXISTS reservas (
            id VARCHAR(50) PRIMARY KEY,
            canchaId INT NOT NULL,
            fecha VARCHAR(20) NOT NULL,
            hora VARCHAR(10) NOT NULL,
            cliente VARCHAR(100) NOT NULL,
            cliente_id INT,
            duracion INT NOT NULL,
            precio INT NOT NULL,
            estado VARCHAR(50) DEFAULT 'confirmada',
            createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    `;

    const createClientes = `
        CREATE TABLE IF NOT EXISTS clientes (
            id SERIAL PRIMARY KEY,
            nombre VARCHAR(100) NOT NULL,
            email VARCHAR(100) UNIQUE NOT NULL,
            password VARCHAR(255) NOT NULL,
            telefono VARCHAR(50),
            createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    `;

    const createPlataforma = `
        CREATE TABLE IF NOT EXISTS plataforma_config (
            id INT PRIMARY KEY,
            estado VARCHAR(20) DEFAULT 'activo',
            fecha_vencimiento VARCHAR(50),
            demo_mode VARCHAR(10) DEFAULT 'true'
        )
    `;

    const createAdminUsers = `
        CREATE TABLE IF NOT EXISTS admin_users (
            id SERIAL PRIMARY KEY,
            username VARCHAR(50) UNIQUE NOT NULL,
            password_hash VARCHAR(255) NOT NULL
        )
    `;

    const createAjustes = `
        CREATE TABLE IF NOT EXISTS ajustes_complejo (
            id INT PRIMARY KEY,
            tenant_id INT NOT NULL DEFAULT 0,
            nombre_complejo VARCHAR(100),
            open_time VARCHAR(10),
            close_time VARCHAR(10),
            wpp_contacto VARCHAR(20),
            ubicacion_maps VARCHAR(500),
            logo_url VARCHAR(500),
            hero_image_url VARCHAR(500),
            hero_title VARCHAR(200),
            canchas_title VARCHAR(100),
            nosotros_title VARCHAR(100)
        )
    `;

    const createTenants = `
        CREATE TABLE IF NOT EXISTS tenants (
            id SERIAL PRIMARY KEY,
            nombre VARCHAR(100) NOT NULL,
            slug VARCHAR(50) UNIQUE NOT NULL,
            email VARCHAR(100) UNIQUE NOT NULL,
            password_hash VARCHAR(255) NOT NULL,
            telefono VARCHAR(50),
            ubicacion VARCHAR(255),
            estado VARCHAR(20) DEFAULT 'pendiente',
            fecha_vencimiento VARCHAR(50),
            plan VARCHAR(30) DEFAULT 'mensual',
            createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    `;

    const createSuperAdmins = `
        CREATE TABLE IF NOT EXISTS super_admins (
            id SERIAL PRIMARY KEY,
            username VARCHAR(50) UNIQUE NOT NULL,
            password_hash VARCHAR(255) NOT NULL
        )
    `;

    try {
        console.log("Creando tabla 'canchas'...");
        await executeQuery(createCanchas);
        try {
            await executeQuery("ALTER TABLE canchas ADD COLUMN porcentaje_sena INT DEFAULT 50");
        } catch(e) {}
        console.log("Tabla 'canchas' lista.");

        console.log("Creando tabla 'reservas'...");
        await executeQuery(createReservas);
        console.log("Tabla 'reservas' lista.");

        console.log("Creando tabla 'clientes'...");
        await executeQuery(createClientes);
        console.log("Tabla 'clientes' lista.");

        console.log("Creando tabla 'plataforma_config'...");
        await executeQuery(createPlataforma);
        console.log("Tabla 'plataforma_config' lista.");

        console.log("Creando tabla 'admin_users'...");
        await executeQuery(createAdminUsers);
        console.log("Tabla 'admin_users' lista.");

        console.log("Creando tabla 'ajustes_complejo'...");
        await executeQuery(createAjustes);
        
        // Intentar agregar las columnas por si ya existía la tabla
        const ajustesAlters = [
            "ALTER TABLE ajustes_complejo ADD COLUMN ubicacion_maps VARCHAR(500)",
            "ALTER TABLE ajustes_complejo ADD COLUMN logo_url VARCHAR(500)",
            "ALTER TABLE ajustes_complejo ADD COLUMN hero_image_url VARCHAR(500)",
            "ALTER TABLE ajustes_complejo ADD COLUMN hero_title VARCHAR(200)",
            "ALTER TABLE ajustes_complejo ADD COLUMN canchas_title VARCHAR(100)",
            "ALTER TABLE ajustes_complejo ADD COLUMN nosotros_title VARCHAR(100)",
            "ALTER TABLE ajustes_complejo ADD COLUMN tenant_id INT NOT NULL DEFAULT 0",
        ];
        for (const sql of ajustesAlters) {
            try { await executeQuery(sql); } catch(e) {}
        }
        console.log("Tabla 'ajustes_complejo' lista.");

        // --- NUEVAS TABLAS SAAS ---
        console.log("Creando tabla 'tenants'...");
        await executeQuery(createTenants);
        console.log("Tabla 'tenants' lista.");

        console.log("Creando tabla 'super_admins'...");
        await executeQuery(createSuperAdmins);
        console.log("Tabla 'super_admins' lista.");

        // Agregar tenant_id a tablas existentes
        const tenantAlters = [
            "ALTER TABLE canchas ADD COLUMN tenant_id INT NOT NULL DEFAULT 0",
            "ALTER TABLE reservas ADD COLUMN tenant_id INT NOT NULL DEFAULT 0",
            "ALTER TABLE clientes ADD COLUMN tenant_id INT NOT NULL DEFAULT 0",
            "ALTER TABLE admin_users ADD COLUMN tenant_id INT NOT NULL DEFAULT 0",
        ];
        for (const sql of tenantAlters) {
            try { await executeQuery(sql); } catch(e) {}
        }
        console.log("Columnas tenant_id aplicadas.");

        // Comprobar super admin
        const superAdminRes = await executeQuery("SELECT COUNT(*) as count FROM super_admins");
        const countSuperAdmins = Array.isArray(superAdminRes) && superAdminRes[0] ? parseInt(superAdminRes[0].count) : 0;
        if (countSuperAdmins === 0) {
            const bcrypt = require('bcryptjs');
            const masterPass = process.env.masterpass || 'superadmin123';
            const masterUser = process.env.masteruser || 'superadmin';
            const hash = await bcrypt.hash(masterPass, 10);
            const safeHash = hash.replace(/'/g, "''");
            console.log(`Inyectando super admin inicial (${masterUser})...`);
            await executeQuery(`
                INSERT INTO super_admins (username, password_hash) 
                VALUES ('${masterUser}', '${safeHash}')
            `);
        }

        // Comprobar Admin Users (tenant 0 = legacy)
        const adminRes = await executeQuery("SELECT COUNT(*) as count FROM admin_users");
        const countAdmins = Array.isArray(adminRes) && adminRes[0] ? parseInt(adminRes[0].count) : 0;
        if (countAdmins === 0) {
            console.log("Inyectando admin inicial (admin/admin)...");
            await executeQuery(`
                INSERT INTO admin_users (username, password_hash, tenant_id) 
                VALUES ('admin', 'admin', 0)
            `);
        }

        // Comprobar suscripcion legacy
        const platRes = await executeQuery("SELECT COUNT(*) as count FROM plataforma_config");
        const countPlat = Array.isArray(platRes) && platRes[0] ? parseInt(platRes[0].count) : 0;
        if (countPlat === 0) {
            const nextMonth = new Date();
            nextMonth.setMonth(nextMonth.getMonth() + 1);
            await executeQuery(`
                INSERT INTO plataforma_config (id, estado, fecha_vencimiento, demo_mode) 
                VALUES (1, 'activo', '${nextMonth.toISOString()}', 'true')
            `);
        }

        // Comprobar Ajustes legacy (tenant_id = 0)
        const ajustesRes = await executeQuery("SELECT COUNT(*) as count FROM ajustes_complejo WHERE tenant_id = 0");
        const countAjustes = Array.isArray(ajustesRes) && ajustesRes[0] ? parseInt(ajustesRes[0].count) : 0;
        if (countAjustes === 0) {
            console.log("Inyectando configuración inicial de ajustes...");
            await executeQuery(`
                INSERT INTO ajustes_complejo (id, tenant_id, nombre_complejo, open_time, close_time, wpp_contacto, ubicacion_maps) 
                VALUES (1, 0, 'Complejo Deportivo TurnoCanchas', '09:00', '23:00', '5491100000000', 'https://maps.app.goo.gl/placeholder')
            `);
        }

        console.log("Inicialización completa.");
        process.exit(0);
    } catch (err) {
        console.error("Error inicializando la base de datos:", err);
        process.exit(1);
    }
}

initDB();
