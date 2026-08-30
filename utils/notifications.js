const { sendEmail } = require('./mailer');
const { sendWhatsApp } = require('./whatsapp');

/**
 * Función centralizada para notificar la creación de una reserva.
 * @param {Object} reserva - Datos de la reserva
 * @param {Object} clienteInfo - Información opcional del cliente { email, telefono, nombre }
 */
const notifyReservationCreated = async (reserva, clienteInfo) => {
    // Si tenemos email, notificamos
    if (clienteInfo && clienteInfo.email) {
        const subject = `Reserva Recibida - ${reserva.fecha} ${reserva.hora}`;
        const html = `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
                <h2 style="color: #4F46E5;">¡Hola ${clienteInfo.nombre || reserva.cliente}!</h2>
                <p>Hemos recibido tu solicitud de reserva. Actualmente se encuentra en estado: <strong>${(reserva.estado || 'por confirmar').toUpperCase()}</strong>.</p>
                
                <h3>Detalles de tu reserva:</h3>
                <ul>
                    <li><strong>Código:</strong> ${reserva.id}</li>
                    <li><strong>Fecha:</strong> ${reserva.fecha}</li>
                    <li><strong>Hora:</strong> ${reserva.hora}</li>
                    <li><strong>Precio:</strong> $${reserva.precio || 0}</li>
                </ul>
                
                <p>Te notificaremos por este medio cuando el establecimiento confirme tu turno.</p>
                <p style="margin-top: 30px; font-size: 0.9em; color: #666;">Gracias por elegirnos.</p>
            </div>
        `;
        await sendEmail({ to: clienteInfo.email, subject, html });
    }

    // Aquí se llamaría a WhatsApp si está habilitado y si tenemos teléfono
    if (clienteInfo && clienteInfo.telefono) {
        // await sendWhatsApp({ to: clienteInfo.telefono, message: \`Reserva creada: \${reserva.id}\` });
    }
};

/**
 * Función centralizada para notificar cambios de estado de una reserva.
 * @param {Object} reserva - Datos básicos (id, fecha, hora)
 * @param {Object} clienteInfo - Información del cliente { email, telefono, nombre }
 * @param {String} status - Nuevo estado (confirmada, cancelada)
 */
const notifyReservationStatusChanged = async (reserva, clienteInfo, status) => {
    if (clienteInfo && clienteInfo.email) {
        let subject = '';
        let color = '#4F46E5';
        
        if (status === 'confirmada') {
            subject = `¡Tu reserva ha sido confirmada! ✅`;
            color = '#10B981'; // Green
        } else if (status === 'cancelada') {
            subject = `Aviso: Tu reserva ha sido cancelada ❌`;
            color = '#EF4444'; // Red
        } else {
            subject = `Actualización de tu reserva: ${status}`;
        }

        const html = `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
                <h2 style="color: ${color};">${subject}</h2>
                <p>Hola ${clienteInfo.nombre || reserva.cliente}, te informamos que el estado de tu reserva <strong>${reserva.id}</strong> ha cambiado a: <strong>${status.toUpperCase()}</strong>.</p>
                <p>Ante cualquier duda, comunícate con el complejo.</p>
                <p style="margin-top: 30px; font-size: 0.9em; color: #666;">Gracias por elegirnos.</p>
            </div>
        `;
        await sendEmail({ to: clienteInfo.email, subject, html });
    }
};

module.exports = {
    notifyReservationCreated,
    notifyReservationStatusChanged
};
