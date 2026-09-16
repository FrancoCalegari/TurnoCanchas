const { executeQuery, sqlEscape } = require('./config/db');

async function checkTenants() {
    try {
        console.log("Checking tenants...");
        const result = await executeQuery("SELECT id, slug, estado FROM tenants LIMIT 5");
        console.log("Tenants found:", result);
    } catch (err) {
        console.error("Error fetching tenants:", err);
    }
}

async function checkClients() {
    try {
        console.log("Checking clients...");
        const result = await executeQuery("SELECT id, nombre, email FROM clientes LIMIT 5");
        console.log("Clients found:", result);
    } catch (err) {
        console.error("Error fetching clients:", err);
    }
}

checkTenants().then(checkClients);
