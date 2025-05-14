import express from "express";
import cors from "cors";
import { Client } from "whatsapp-web.js";
import qrcode from "qrcode-terminal";
import xlsx from "xlsx";
import fs from "fs";
import pg from "pg";


import {
  DB_HOST,
  DB_DATABASE,
  DB_PASSWORD,
  DB_PORT,
  DB_USER,
  FRONTEND_URL,
  PORT,
  FILE_PATH // Nueva importación
} from "./config.js";

const app = express();
app.use(express.json()); // Para manejar datos JSON en las peticiones

// Configuración de la base de datos
const pool = new pg.Pool({
  host: DB_HOST,
  database: DB_DATABASE,
  user: DB_USER,
  password: DB_PASSWORD,
  port: DB_PORT,
});

// Configuración de CORS
app.use(
  cors({
    origin: FRONTEND_URL,
  })
);

// Cliente de WhatsApp
const cliente = new Client();

// Generar QR para autenticar
cliente.on('qr', qr => {
  qrcode.generate(qr, { small: true });
});

// Cliente listo
cliente.on('ready', () => {
  console.log('Cliente de WhatsApp listo!');
});

// Iniciar cliente
cliente.initialize();

// Leer archivo .xlsx
const leerArchivoXlsx = (ruta) => {
    try {
      if (!fs.existsSync(ruta)) {
        throw new Error(`Archivo no encontrado en: ${ruta}`);
      }
      
      const archivo = xlsx.readFile(ruta);
      
      if (!archivo.Sheets["Contactos"]) {
        throw new Error('La hoja "Contactos" no existe en el archivo');
      }
      
      return xlsx.utils.sheet_to_json(archivo.Sheets["Contactos"]);
    } catch (error) {
      console.error("Error al leer archivo:", error.message);
      throw error;
    }
  };

// Función para enviar mensaje a un número
const enviarMensaje = async (telefono, mensaje) => {
  try {
    const chat = await cliente.getChatById(telefono + "@c.us"); // WhatsApp usa @c.us
    await chat.sendMessage(mensaje); // Enviar el mensaje
    console.log(`Mensaje enviado a ${telefono}`);
  } catch (error) {
    console.error(`Error al enviar mensaje a ${telefono}: ${error}`);
  }
};

// Endpoint para enviar mensajes masivos
app.post("/enviar-mensajes", async (req, res) => {
  try {
    const contactos = leerArchivoXlsx(FILE_PATH); // Usa la variable de configuración // Lee el archivo .xlsx
    const { campaña } = req.body; // Si necesitas filtrar por campaña, lo puedes pasar desde el frontend

    const contactosFiltrados = contactos.filter(contacto => contacto.Campaña === campaña);

    // Enviar los mensajes
    for (const contacto of contactosFiltrados) {
      if (contacto.Teléfono && contacto.Mensaje) {
        await enviarMensaje(contacto.Teléfono, contacto.Mensaje);
      }
    }

    res.status(200).send({ message: "Mensajes enviados exitosamente!" });
  } catch (error) {
    console.error("Error al enviar mensajes:", error);
    res.status(500).send({ message: "Error al enviar mensajes." });
  }
});

// Endpoint ping para verificar el estado del backend
app.get("/ping", async (req, res) => {
  const result = await pool.query("SELECT Now()");
  res.send({
    pong: result.rows[0].now,
  });
});

// Endpoint raíz para verificar que el backend está activo
app.get("/", (req, res) => {
  res.send("Backend activo y corriendo 3🎉");
});

// Iniciar el servidor
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
