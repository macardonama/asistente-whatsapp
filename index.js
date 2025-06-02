const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const fs = require('fs');
const express = require('express');
const cors = require('cors');


// Inicializa sesión con almacenamiento local (sin tener que escanear cada vez)
const client = new Client({
    authStrategy: new LocalAuth()
});

client.on('qr', (qr) => {
    console.log('🔐 Escanea el código QR:');
    qrcode.generate(qr, { small: true });
});

client.on('ready', () => {
    console.log('✅ Bot conectado y listo.');
});

client.on('message', message => {
    const msg = message.body.toLowerCase();

    // 1. Respuesta a saludo
    if (msg.includes("hola")) {
        message.reply("¡Hola! 😊 ¿En qué puedo ayudarte?");
    }

    // 2. Responder si envían un audio
    if (message.hasMedia && message.type === 'ptt') {
        message.reply("📢 Hola, ¿puedes escribirme tu mensaje en texto por favor? Me ayuda a responderte más rápido. 🙏");
    }

    // 3. Notificar si hay salida temprana
    const claves = ["salida", "recoger", "temprano", "enfermo", "abuel@", "autorización"];
    if (claves.some(palabra => msg.includes(palabra))) {
        fs.appendFileSync('mensajes-log.txt', `[${new Date().toLocaleString()}] ${message.from}: ${message.body}\n`);
        message.reply("✅ Recibido. Gracias por la información.");
    }
});

client.on('auth_failure', (msg) => {
    console.error('❌ Error de autenticación:', msg);
});

client.on('disconnected', (reason) => {
    console.warn('⚠️ Cliente desconectado. Razón:', reason);
});

client.on('loading_screen', (percent, message) => {
    console.log(`⏳ Cargando WhatsApp (${percent}%): ${message}`);
});

client.on('change_state', state => {
    console.log('📶 Estado del cliente:', state);
});


const app = express();
app.use(cors());
app.use(express.json());

// Ruta para enviar mensajes desde otro sistema (como Diario de Aula)
app.post('/enviar-mensaje', async (req, res) => {
    const { telefono, mensaje } = req.body;

    if (!telefono || !mensaje) {
        return res.status(400).json({ error: 'Faltan parámetros: teléfono o mensaje' });
    }

    try {
        await client.sendMessage(`${telefono}@c.us`, mensaje);
        console.log(`✅ Mensaje enviado a ${telefono}: ${mensaje}`);
        res.status(200).json({ estado: 'ok', mensaje: 'Mensaje enviado correctamente' });
    } catch (error) {
        console.error('❌ Error al enviar mensaje:', error);
        res.status(500).json({ estado: 'error', error: 'No se pudo enviar el mensaje' });
    }
});

// Iniciar el servidor Express
app.listen(3001, () => {
    console.log('🌐 Servidor Express escuchando en http://localhost:3001');
});
console.log("🚀 Iniciando bot...");
client.initialize();
