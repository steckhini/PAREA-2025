// netlify/functions/submit-form.js

const fetch = require('node-fetch');

// Sostituisci questo URL con l'URL della tua Web App di Google Apps Script
const APPSCRIPT_URL = 'https://script.google.com/macros/s/AKfycbwrFZ1yfg0WpbY9cVhQaT6DoUsvZKxwYCkKt-LlW0vgEZXetFQQQmqd5tNUTx8ZSLyW/exec';

exports.handler = async function(event, context) {
  // Assicurati che la richiesta sia un POST
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Metodo non consentito' }),
    };
  }

  try {
    // La funzione Netlify riceve il corpo della richiesta dal tuo frontend
    const payload = JSON.parse(event.body);

    // Inoltra la richiesta al tuo script di Google Apps Script
    const response = await fetch(APPSCRIPT_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    // Leggi la risposta dal tuo script
    const data = await response.json();

    // Restituisci la risposta al tuo frontend (GitHub Pages)
    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    };
  } catch (error) {
    console.error('Errore:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Errore interno del server.' }),
    };
  }
};