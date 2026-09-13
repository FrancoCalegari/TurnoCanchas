const updateTenant = async (req, res) => {
    try {
        const { id } = req.params;
        const { nombre, telefono, email, ubicacion, rubro_id, logo_url } = req.body;

        const tenant = await executeQuery(`SELECT id FROM tenants WHERE id = ${parseInt(id)}`);
        if (!tenant || tenant.length === 0) return res.status(404).json({ error: 'Tenant no encontrado' });

        const safeNombre = sqlEscape(nombre);
        const safeTel = sqlEscape(telefono || '');
        const safeEmail = sqlEscape(email);
        const safeUbicacion = sqlEscape(ubicacion || '');
        const safeRubroId = rubro_id ? parseInt(rubro_id) : 'NULL';

        await executeQuery(`
            UPDATE tenants 
            SET nombre = ${safeNombre}, 
                telefono = ${safeTel}, 
                email = ${safeEmail}, 
                ubicacion = ${safeUbicacion}, 
                rubro_id = ${safeRubroId}
            WHERE id = ${parseInt(id)}
        `);

        if (logo_url !== undefined) {
            const safeLogo = logo_url ? sqlEscape(logo_url) : 'NULL';
            // We need to check if ajustes_complejo exists, if not, maybe create it?
            // Usually it's created on tenant approval.
            const ajustes = await executeQuery(`SELECT id FROM ajustes_complejo WHERE tenant_id = ${parseInt(id)}`);
            if (ajustes && ajustes.length > 0) {
                await executeQuery(`UPDATE ajustes_complejo SET logo_url = ${safeLogo} WHERE tenant_id = ${parseInt(id)}`);
            } else {
                await executeQuery(`INSERT INTO ajustes_complejo (tenant_id, logo_url) VALUES (${parseInt(id)}, ${safeLogo})`);
            }
        }

        res.json({ message: 'Tenant actualizado' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};
