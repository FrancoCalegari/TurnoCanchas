/**
 * Placeholder para la futura integración con WhatsApp.
 * Por ahora, simplemente registra la intención en la consola.
 */
const sendWhatsApp = async ({ to, message }) => {
    try {
        console.log(`[WHATSAPP PENDIENTE] Mensaje para: ${to} | Contenido: ${message}`);
        // Futura integración (ej. twilio, whatsapp-web.js, etc.)
        return true;
    } catch (error) {
        console.error('❌ Error enviando WhatsApp (Placeholder):', error);
        return false;
    }
};

module.exports = {
    sendWhatsApp
};
