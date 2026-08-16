// public/js/api.js

const API_BASE = '/api';

window.API = {
    /**
     * Obtiene la lista de canchas disponibles
     * @returns {Promise<Array>} Array de objetos cancha
     */
    getCanchas: async () => {
        try {
            const res = await fetch(`${API_BASE}/canchas`);
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
            headers: { 'Content-Type': 'application/json' },
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
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        if (!res.ok) throw new Error('Error updating cancha');
        return await res.json();
    },

    /**
     * Elimina una cancha (Solo Admin)
     */
    eliminarCancha: async (id) => {
        const res = await fetch(`${API_BASE}/canchas/${id}`, {
            method: 'DELETE'
        });
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
            const res = await fetch(`${API_BASE}/reservas?fecha=${date}`);
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
            headers: { 'Content-Type': 'application/json' },
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
            headers: { 'Content-Type': 'application/json' },
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
            headers: { 'Content-Type': 'application/json' },
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
        const res = await fetch(`${API_BASE}/reservas/${id}/status`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status })
        });
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
            const res = await fetch(`${API_BASE}/reservas/recientes`);
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
            const res = await fetch(`${API_BASE}/reservas/admin?${params.toString()}`);
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
            headers: { 'Content-Type': 'application/json' },
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
                headers: { 'Content-Type': 'application/json' },
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
                headers: { 'Content-Type': 'application/json' },
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
    // AJUSTES
    // ==========================================
    getAjustes: async () => {
        try {
            const res = await fetch(`${API_BASE}/ajustes`);
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
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });
            if (!res.ok) throw new Error('Error al actualizar ajustes');
            return await res.json();
        } catch (error) {
            console.error(error);
            throw error;
        }
    }
};
