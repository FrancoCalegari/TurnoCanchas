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
            colorTag VARCHAR(100)
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

    try {
        console.log("Creando tabla 'canchas'...");
        await executeQuery(createCanchas);
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
        try {
            await executeQuery("ALTER TABLE ajustes_complejo ADD COLUMN ubicacion_maps VARCHAR(500)");
        } catch (e) {}
        try {
            await executeQuery("ALTER TABLE ajustes_complejo ADD COLUMN logo_url VARCHAR(500)");
        } catch (e) {}
        try {
            await executeQuery("ALTER TABLE ajustes_complejo ADD COLUMN hero_image_url VARCHAR(500)");
        } catch (e) {}
        try {
            await executeQuery("ALTER TABLE ajustes_complejo ADD COLUMN hero_title VARCHAR(200)");
        } catch (e) {}
        try {
            await executeQuery("ALTER TABLE ajustes_complejo ADD COLUMN canchas_title VARCHAR(100)");
        } catch (e) {}
        try {
            await executeQuery("ALTER TABLE ajustes_complejo ADD COLUMN nosotros_title VARCHAR(100)");
        } catch (e) {}
        
        console.log("Tabla 'ajustes_complejo' lista.");

        // Poblar algunas canchas mock si la tabla está vacía
        console.log("Comprobando si existen canchas...");
        const result = await executeQuery("SELECT COUNT(*) as count FROM canchas");
        // Dependiendo de cómo devuelva los resultados la API de SpiderWeb, count será un array
        const count = Array.isArray(result) && result[0] ? parseInt(result[0].count) : 0;
        
        if (count === 0) {
            console.log("Poblando canchas de prueba...");
            await executeQuery(`
                INSERT INTO canchas (nombre, deporte, descripcion, precioPorHora, estado, colorTag) VALUES 
                ('Cancha 1 (Techada)', 'Fútbol 5', 'Césped sintético, techada y buena iluminación.', 18000, 'disponible', 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300'),
                ('Cancha 2 (Descubierta)', 'Fútbol 5', 'Césped sintético al aire libre.', 15000, 'disponible', 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300'),
                ('Pádel Pro 1', 'Pádel', 'Cancha de blindex profesional.', 12000, 'disponible', 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300'),
                ('Pádel Standard 2', 'Pádel', 'Cancha de muro de concreto.', 9000, 'mantenimiento', 'bg-slate-100 text-slate-700 dark:bg-slate-800/40 dark:text-slate-300'),
                ('Cancha Mixta', 'Básquet/Vóley', 'Suelo de parquet con demarcación.', 16000, 'disponible', 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300')
            `);
            console.log("Canchas de prueba insertadas.");
        } else {
            console.log(`Ya existen ${count} canchas en la base de datos.`);
        }

        // Comprobar suscripcion
        const platRes = await executeQuery("SELECT COUNT(*) as count FROM plataforma_config");
        const countPlat = Array.isArray(platRes) && platRes[0] ? parseInt(platRes[0].count) : 0;
        if (countPlat === 0) {
            console.log("Inyectando configuración inicial de plataforma...");
            // Vence el proximo mes por defecto para la demo
            const nextMonth = new Date();
            nextMonth.setMonth(nextMonth.getMonth() + 1);
            await executeQuery(`
                INSERT INTO plataforma_config (id, estado, fecha_vencimiento, demo_mode) 
                VALUES (1, 'activo', '${nextMonth.toISOString()}', 'true')
            `);
        }

        // Comprobar Ajustes
        const ajustesRes = await executeQuery("SELECT COUNT(*) as count FROM ajustes_complejo");
        const countAjustes = Array.isArray(ajustesRes) && ajustesRes[0] ? parseInt(ajustesRes[0].count) : 0;
        if (countAjustes === 0) {
            console.log("Inyectando configuración inicial de ajustes...");
            await executeQuery(`
                INSERT INTO ajustes_complejo (id, nombre_complejo, open_time, close_time, wpp_contacto, ubicacion_maps) 
                VALUES (1, 'Complejo Deportivo TurnoCanchas', '09:00', '23:00', '5491100000000', 'https://maps.app.goo.gl/placeholder')
            `);
        }

        // Comprobar Admin Users
        const adminRes = await executeQuery("SELECT COUNT(*) as count FROM admin_users");
        const countAdmins = Array.isArray(adminRes) && adminRes[0] ? parseInt(adminRes[0].count) : 0;
        if (countAdmins === 0) {
            console.log("Inyectando admin inicial (admin/admin)...");
            // Nota: En producción usar bcrypt, aquí para el demo usaremos el texto plano 'admin' validado de forma básica
            await executeQuery(`
                INSERT INTO admin_users (username, password_hash) 
                VALUES ('admin', 'admin')
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
