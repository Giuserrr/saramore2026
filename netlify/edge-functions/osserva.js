// Osservatorio anti-clone (02/10/2026). Lascia passare tutto.
// Solo se la query contiene il marcatore segreto risponde con gli header ricevuti dall'origine:
// serve a vedere come si presenta il proxy di saramoreyoga.lol. Nessun log, nessun effetto sugli altri.
export default async (request, context) => {
  const url = new URL(request.url);
  if (url.searchParams.get("osserva") === "9cdc806860c4f0261f4c5c69") {
    const headers = {};
    for (const [k, v] of request.headers) headers[k] = v;
    const corpo = {
      ricevuto: new Date().toISOString(),
      url: request.url,
      metodo: request.method,
      ip: context.ip,
      geo: context.geo,
      headers,
    };
    return new Response(JSON.stringify(corpo, null, 1), {
      status: 200,
      headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" },
    });
  }
  return context.next();
};

export const config = { path: "/*" };
