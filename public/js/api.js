// public/js/api.js

const API_BASE = '/api';

window.API = {
    _getHeaders: (isJson = true) => {
        const headers = {};
        if (isJson) headers['Content-Type'] = 'application/json';
        const tenantToken = localStorage.getItem('tenantToken');
        if (tenantToken) { headers['Authorization'] = 'Tenant ' + tenantToken; return headers; }
        const adminToken = localStorage.getItem('adminToken');
        if (adminToken) { headers['Authorization'] = 'Tenant ' + adminToken; }
        return headers;
    },
    /**
     * Helper para extraer slug público
     */
    getPublicTenant: () => {
        const path = window.location.pathname;
        if (path.startsWith('/t/')) {
            return path.split('/t/')[1].split('/')[0];
        }
        const tData = window.API.getTenantInfo ? window.API.getTenantInfo() : null;
        if (tData && tData.slug) return tData.slug;
        return null;
    },

    /**
     * Obtiene la lista de canchas disponibles
     * @returns {Promise<Array>} Array de objetos cancha
     */
    getCanchas: async () => {
        try {
            const tenant = window.API.getPublicTenant();
            const url = tenant ? `${API_BASE}/canchas?tenant=${tenant}` : `${API_BASE}/canchas`;
            const res = await fetch(url);
            if (!res.ok) throw new Error('Error fetching canchas');
            const result = await res.json();
            return result.data || [];
        } catch (error) {
            console.error(error);
            return [];
        }
    },

    /**
     * Crea una nueva cancha (Solo Admin)
     */
    crearCancha: async (data) => {
        const res = await fetch(`${API_BASE}/canchas`, {
            method: 'POST',
            headers: window.API._getHeaders(),
            body: JSON.stringify(data)
        });
        if (!res.ok) throw new Error('Error creating cancha');
        return await res.json();
    },

    /**
     * Actualiza una cancha (Solo Admin)
     */
    actualizarCancha: async (id, data) => {
        const res = await fetch(`${API_BASE}/canchas/${id}`, {
            method: 'PUT',
            headers: window.API._getHeaders(),
            body: JSON.stringify(data)
        });
        if (!res.ok) throw new Error('Error updating cancha');
        return await res.json();
    },

    /**
     * Elimina una cancha (Solo Admin)
     */
    eliminarCancha: async (id) => {
        const res = await fetch(`${API_BASE}/canchas/${id}`, { method: 'DELETE', headers: window.API._getHeaders(false) });
        if (!res.ok) throw new Error('Error deleting cancha');
        return await res.json();
    },

    /**
     * Obtiene las reservas de un cliente específico
     */
    getReservasByUser: async (userId) => {
        try {
            const res = await fetch(`${API_BASE}/reservas/usuario/${encodeURIComponent(userId)}`);
            if (!res.ok) throw new Error('Error fetching reservas by user');
            const result = await res.json();
            return result.data || [];
        } catch (error) {
            console.error(error);
            return [];
        }
    },

    /**
     * Obtiene las reservas para una fecha específica
     * @param {string} date YYYY-MM-DD
     * @returns {Promise<Array>} Array de reservas
     */
    getReservasPorFecha: async (date) => {
        try {
            const tenant = window.API.getPublicTenant();
            let url = `${API_BASE}/reservas?fecha=${date}`;
            if (tenant) url += `&tenant=${tenant}`;
            const res = await fetch(url);
            if (!res.ok) throw new Error('Error fetching reservas');
            const result = await res.json();
            return result.data || [];
        } catch (error) {
            console.error(error);
            return [];
        }
    },

    /**
     * Inicia sesión como cliente
     */
    clientLogin: async (email, password) => {
        const res = await fetch(`${API_BASE}/auth/cliente/login`, {
            method: 'POST',
            headers: window.API._getHeaders(),
            body: JSON.stringify({ email, password })
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Error en login');
        
        localStorage.setItem('clientToken', data.token);
        localStorage.setItem('clientData', JSON.stringify(data.user));
        return data;
    },

    /**
     * Registra a un nuevo cliente
     */
    clientRegister: async (userData) => {
        const res = await fetch(`${API_BASE}/auth/cliente/register`, {
            method: 'POST',
            headers: window.API._getHeaders(),
            body: JSON.stringify(userData)
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Error en registro');
        return data;
    },

    /**
     * Cierra sesión del cliente
     */
    clientLogout: () => {
        localStorage.removeItem('clientToken');
        localStorage.removeItem('clientData');
        window.location.reload();
    },

    /**
     * Crea una nueva reserva
     * @param {Object} data { canchaId, fecha, hora, cliente, duracion, precio }
     * @returns {Promise<Object>} Datos de la reserva creada (incluye id)
     */
    crearReserva: async (data) => {
        const res = await fetch(`${API_BASE}/reservas`, {
            method: 'POST',
            headers: window.API._getHeaders(),
            body: JSON.stringify(data)
        });
        if (!res.ok) {
            const err = await res.json();
            throw new Error(err.error || 'Error al procesar la reserva');
        }
        const result = await res.json();
        return result.data;
    },

    /**
     * Actualiza el estado de una reserva
     */
    updateReservaStatus: async (id, status) => {
        const res = await fetch(`${API_BASE}/reservas/${id}/status`, { method: 'PUT', headers: window.API._getHeaders(), body: JSON.stringify({ status }) });
        if (!res.ok) {
            const err = await res.json();
            throw new Error(err.error || 'Error al actualizar reserva');
        }
        return await res.json();
    },

    /**
     * Obtiene las reservas recientes para el Dashboard de Administración
     * @returns {Promise<Array>} Array de reservas recientes
     */
    getReservasRecientesAdmin: async () => {
        try {
            const res = await fetch(`${API_BASE}/reservas/recientes`, { headers: window.API._getHeaders(false) });
            if (!res.ok) throw new Error('Error fetching recent reservas');
            const result = await res.json();
            return result.data || [];
        } catch (error) {
            console.error(error);
            return [];
        }
    },

    /**
     * Obtiene todas las reservas para gestion admin con filtros
     * @param {Object} filtros { search, estado, desde, hasta }
     * @returns {Promise<Array>} Array de reservas
     */
    getAdminReservas: async (filtros = {}) => {
        try {
            const params = new URLSearchParams();
            if (filtros.search) params.set('search', filtros.search);
            if (filtros.estado) params.set('estado', filtros.estado);
            if (filtros.desde) params.set('desde', filtros.desde);
            if (filtros.hasta) params.set('hasta', filtros.hasta);
            const res = await fetch(`${API_BASE}/reservas/admin?${params.toString()}`, { headers: window.API._getHeaders(false) });
            if (!res.ok) throw new Error('Error fetching admin reservas');
            const result = await res.json();
            return result.data || [];
        } catch (error) {
            console.error(error);
            return [];
        }
    },

    /**
     * Obtiene el estado de la plataforma (Suscripción)
     */
    getPlataforma: async () => {
        try {
            const res = await fetch(`${API_BASE}/plataforma`);
            if (!res.ok) throw new Error('Error fetching platform state');
            const result = await res.json();
            return result.data;
        } catch (error) {
            console.error(error);
            return null;
        }
    },

    /**
     * Actualiza el estado de la plataforma (Suscripción)
     */
    updatePlataforma: async (data) => {
        const res = await fetch(`${API_BASE}/plataforma`, {
            method: 'PUT',
            headers: window.API._getHeaders(),
            body: JSON.stringify(data)
        });
        if (!res.ok) throw new Error('Error updating platform state');
        return await res.json();
    },

    // ==========================================
    // AUTHENTICATION
    // ==========================================
    login: async (username, password) => {
        try {
            const res = await fetch(`${API_BASE}/auth/login`, {
                method: 'POST',
                headers: window.API._getHeaders(),
                body: JSON.stringify({ username, password })
            });
            if (!res.ok) throw new Error('Credenciales incorrectas');
            const data = await res.json();
            localStorage.setItem('adminToken', data.token);
            localStorage.setItem('adminUser', data.username);
            return data;
        } catch (error) {
            console.error(error);
            throw error;
        }
    },

    logout: () => {
        localStorage.removeItem('adminToken');
        localStorage.removeItem('adminUser');
        window.location.href = '/login.html';
    },

    masterLogin: async (username, password) => {
        try {
            const res = await fetch(`${API_BASE}/auth/masterlogin`, {
                method: 'POST',
                headers: window.API._getHeaders(),
                body: JSON.stringify({ username, password })
            });
            if (!res.ok) throw new Error('Credenciales incorrectas');
            const data = await res.json();
            localStorage.setItem('masterToken', data.token);
            localStorage.setItem('masterUser', data.username);
            return data;
        } catch (error) {
            console.error(error);
            throw error;
        }
    },

    masterLogout: () => {
        localStorage.removeItem('masterToken');
        localStorage.removeItem('masterUser');
        window.location.href = '/masterlogin.html';
    },

    // ==========================================
    // TENANT AUTH (propietario del negocio)
    // ==========================================

    /**
     * Login del tenant propietario
     * @param {string} email
     * @param {string} password
     * @returns {Promise<Object>} { token, tenant }
     */
    tenantLogin: async (email, password) => {
        try {
            const res = await fetch(`${API_BASE}/tenants/login`, {
                method: 'POST',
                headers: window.API._getHeaders(),
                body: JSON.stringify({ email, password })
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Error en login');
            localStorage.setItem('tenantToken', data.token);
            localStorage.setItem('tenantData', JSON.stringify(data.tenant));
            return data;
        } catch (error) {
            console.error(error);
            throw error;
        }
    },

    /**
     * Cierra sesión del tenant propietario
     */
    tenantLogout: () => {
        localStorage.removeItem('tenantToken');
        localStorage.removeItem('tenantData');
        window.location.href = '/login.html';
    },

    /**
     * Obtiene los datos del tenant desde localStorage
     * @returns {Object|null} datos del tenant o null si no hay sesión
     */
    getTenantInfo: () => {
        try {
            const data = localStorage.getItem('tenantData');
            return data ? JSON.parse(data) : null;
        } catch {
            return null;
        }
    },

    /**
     * Verifica si hay sesión de tenant activa
     * @returns {boolean}
     */
    isTenantLoggedIn: () => {
        return !!localStorage.getItem('tenantToken') && !!localStorage.getItem('tenantData');
    },

    // ==========================================
    // AJUSTES
    // ==========================================
    getAjustes: async () => {
        try {
            const tenant = window.API.getPublicTenant();
            let url = `${API_BASE}/ajustes`;
            if (tenant) url += `?tenant=${tenant}`;
            const res = await fetch(url);
            if (!res.ok) return null;
            const response = await res.json();
            return response.data;
        } catch (error) {
            console.error(error);
            return null;
        }
    },

    updateAjustes: async (data) => {
        try {
            const res = await fetch(`${API_BASE}/ajustes`, {
                method: 'PUT',
                headers: window.API._getHeaders(),
                body: JSON.stringify(data)
            });
            if (!res.ok) throw new Error('Error al actualizar ajustes');
            return await res.json();
        } catch (error) {
            console.error(error);
            throw error;
        }
    },

    getMensajes: async () => {
        try {
            const res = await fetch(`${API_BASE}/mensajes`, { headers: window.API._getHeaders() });
            if (!res.ok) throw new Error('Error fetch mensajes');
            const data = await res.json();
            return data.data;
        } catch (error) {
            console.error(error);
            return [];
        }
    },

    createMensaje: async (data) => {
        try {
            const res = await fetch(`${API_BASE}/mensajes`, {
                method: 'POST',
                headers: window.API._getHeaders(),
                body: JSON.stringify(data)
            });
            if (!res.ok) throw new Error('Error enviando mensaje');
            return await res.json();
        } catch (error) {
            console.error(error);
            throw error;
        }
    },

    readMensaje: async (id) => {
        try {
            const res = await fetch(`${API_BASE}/mensajes/${id}/read`, {
                method: 'PUT',
                headers: window.API._getHeaders()
            });
            if (!res.ok) throw new Error('Error al marcar leído');
            return await res.json();
        } catch (error) {
            console.error(error);
            throw error;
        }
    },

    /**
     * Cancela una reserva propia del cliente logueado.
     * Solo válida para reservas futuras.
     */
    cancelarReservaCliente: async (id) => {
        const headers = { 'Content-Type': 'application/json' };
        const clientToken = localStorage.getItem('clientToken');
        if (clientToken) headers['Authorization'] = 'Client ' + clientToken;
        const res = await fetch(`${API_BASE}/reservas/${id}/cancelar-cliente`, {
            method: 'PUT',
            headers
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Error al cancelar reserva');
        return data;
    }
};

