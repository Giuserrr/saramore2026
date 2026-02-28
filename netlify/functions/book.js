// Netlify Function: Gestione Prenotazioni Classi
// Usa Netlify Blobs come storage (zero database)

const { getStore } = require("@netlify/blobs");

exports.handler = async (event) => {
  const headers = {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Allow-Methods": "POST, GET, OPTIONS"
  };

  // CORS preflight
  if (event.httpMethod === "OPTIONS") {
    return { statusCode: 200, headers, body: "" };
  }

  const store = getStore("bookings");

  // GET: controlla disponibilità o lista prenotazioni (admin)
  if (event.httpMethod === "GET") {
    const params = event.queryStringParameters || {};

    // Admin: lista tutte le prenotazioni
    if (params.admin === "true" && params.key) {
      // Password semplice per admin (da impostare come env var su Netlify)
      const adminKey = process.env.ADMIN_KEY || "sarayoga2026";
      if (params.key !== adminKey) {
        return { statusCode: 401, headers, body: JSON.stringify({ message: "Non autorizzato" }) };
      }

      try {
        const { blobs } = await store.list();
        const allBookings = {};
        for (const blob of blobs) {
          const data = await store.get(blob.key, { type: "json" });
          allBookings[blob.key] = data;
        }
        return { statusCode: 200, headers, body: JSON.stringify(allBookings) };
      } catch (err) {
        return { statusCode: 200, headers, body: JSON.stringify({}) };
      }
    }

    // Disponibilità per una classe
    if (params.classId) {
      try {
        const data = await store.get(params.classId, { type: "json" });
        const current = data ? data.bookings.length : 0;
        const max = data ? data.maxSpots : 0;
        return {
          statusCode: 200, headers,
          body: JSON.stringify({ classId: params.classId, booked: current, maxSpots: max, available: max - current })
        };
      } catch (err) {
        return { statusCode: 200, headers, body: JSON.stringify({ classId: params.classId, booked: 0, maxSpots: 0, available: 0 }) };
      }
    }

    return { statusCode: 400, headers, body: JSON.stringify({ message: "Parametro classId mancante" }) };
  }

  // POST: nuova prenotazione
  if (event.httpMethod === "POST") {
    let body;
    try {
      body = JSON.parse(event.body);
    } catch (e) {
      return { statusCode: 400, headers, body: JSON.stringify({ message: "Dati non validi" }) };
    }

    const { classId, className, day, time, location, maxSpots, name, email, phone } = body;

    if (!classId || !name || !email || !phone) {
      return { statusCode: 400, headers, body: JSON.stringify({ message: "Compila tutti i campi" }) };
    }

    // Recupera o crea il record della classe
    let classData;
    try {
      classData = await store.get(classId, { type: "json" });
    } catch (e) {
      classData = null;
    }

    if (!classData) {
      classData = { classId, className, day, time, location, maxSpots: maxSpots || 12, bookings: [] };
    }

    // Controlla se già prenotato con questa email
    const alreadyBooked = classData.bookings.find(b => b.email.toLowerCase() === email.toLowerCase());
    if (alreadyBooked) {
      return { statusCode: 409, headers, body: JSON.stringify({ message: "Sei già prenotato per questa classe!" }) };
    }

    // Controlla posti disponibili
    if (classData.bookings.length >= classData.maxSpots) {
      return { statusCode: 409, headers, body: JSON.stringify({ message: "Posti esauriti per questa classe." }) };
    }

    // Aggiungi prenotazione
    classData.bookings.push({
      name,
      email: email.toLowerCase(),
      phone,
      bookedAt: new Date().toISOString()
    });

    // Salva
    await store.setJSON(classId, classData);

    const remaining = classData.maxSpots - classData.bookings.length;

    return {
      statusCode: 200, headers,
      body: JSON.stringify({
        message: `Prenotazione confermata! Posti rimasti: ${remaining}`,
        booked: classData.bookings.length,
        maxSpots: classData.maxSpots
      })
    };
  }

  // DELETE: reset prenotazioni di una classe (admin)
  if (event.httpMethod === "DELETE") {
    const params = event.queryStringParameters || {};
    const adminKey = process.env.ADMIN_KEY || "sarayoga2026";

    if (params.key !== adminKey) {
      return { statusCode: 401, headers, body: JSON.stringify({ message: "Non autorizzato" }) };
    }

    if (params.classId) {
      await store.delete(params.classId);
      return { statusCode: 200, headers, body: JSON.stringify({ message: `Prenotazioni per ${params.classId} resettate.` }) };
    }

    // Reset tutto
    if (params.resetAll === "true") {
      const { blobs } = await store.list();
      for (const blob of blobs) {
        await store.delete(blob.key);
      }
      return { statusCode: 200, headers, body: JSON.stringify({ message: "Tutte le prenotazioni resettate." }) };
    }

    return { statusCode: 400, headers, body: JSON.stringify({ message: "Specifica classId o resetAll=true" }) };
  }

  return { statusCode: 405, headers, body: JSON.stringify({ message: "Metodo non supportato" }) };
};
