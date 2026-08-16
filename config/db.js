const SPIDERWEB_API = 'https://spiderwebargapi.com.ar/api/v1';
const DB_NAME = process.env.spiderapidbname;
const API_KEY = process.env.spiderwebapikey;

/**
 * Ejecuta una consulta SQL en la API de SpiderWeb
 * @param {string} query Consulta SQL a ejecutar
 * @returns {Promise<any>} Resultados de la consulta
 */
const executeQuery = async (query) => {
    try {
        if (!DB_NAME || !API_KEY) {
            console.warn("ADVERTENCIA: Faltan variables de entorno para la base de datos (spiderapidbname o spiderwebapikey).");
        }

        const response = await fetch(`${SPIDERWEB_API}/query`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-API-KEY': API_KEY
            },
            body: JSON.stringify({
                database: DB_NAME,
                query: query
            })
        });

        const text = await response.text();
        if (!response.ok) {
            throw new Error(`Error en API SpiderWeb (${response.status}): ${text}`);
        }

        let data;
        try {
            data = JSON.parse(text);
            if (data && typeof data === 'object' && data.result !== undefined) {
                return data.result;
            }
        } catch (err) {
            // A veces la API puede retornar un string vacío para inserts/updates
            data = { result: text || "success" };
            return data.result;
        }
        
        return data;
    } catch (error) {
        console.error('[DB Error]:', error.message);
        throw error;
    }
};

module.exports = {
    executeQuery
};
