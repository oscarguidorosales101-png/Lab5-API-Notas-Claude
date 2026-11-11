/**
 * Script de verificación de conectividad entre el frontend y el backend Express
 * Puede ejecutarse con: node src/scripts/test-api-connection.js
 */
const API_URL = process.env.VITE_API_URL || 'http://localhost:3000/api';

async function verificarConexion() {
  console.log(`Verificando conectividad con el backend en: ${API_URL}`);
  try {
    const res = await fetch(`${API_URL}/materias`);
    if (res.ok) {
      const data = await res.json();
      console.log('✔ Conexión exitosa con la API de Express (MySQL Notas_lab).');
      console.log(`✔ Materias recuperadas: ${data.length}`);
    } else {
      console.error(`✖ El backend respondió con código de error HTTP ${res.status}`);
    }
  } catch (err) {
    console.error('✖ Error al conectar con el backend:', err.message);
  }
}

verificarConexion();

