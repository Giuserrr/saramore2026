// Anti-clone (02/10/2026). Blocca il reverse proxy saramoreyoga.lol che copia il sito in tempo reale.
// Firma osservata il 02/10/2026 08:23 (Sara/raw/2026-10-02-osserva-lol.json nella Conoscenza):
//   cf-worker: saramoreyoga.lol   host: saramoreyoga.lol   cdn-loop: cloudflare; loops=1, netlify
// Regola: 403 se la richiesta arriva da un Cloudflare Worker (header cf-worker: noi non ne usiamo)
// oppure se l'Host non e' uno dei nostri. Niente redirect (eviterebbe loop col proxy).
// Rollback: togliere il blocco [[edge_functions]] da netlify.toml e ripubblicare.
// Diagnostica: ?osserva=<marcatore> restituisce gli header ricevuti dall'origine.

const HOST_NOSTRI = new Set(["saramoreyoga.com", "www.saramoreyoga.com", "saramoreyoga.netlify.app", "localhost"]);

function hostAmmesso(host) {
  if (!host) return true; // HTTP/1.0 senza Host: non e' il proxy, lascia stare
  const h = host.toLowerCase().split(":")[0];
  return HOST_NOSTRI.has(h) || h.endsWith("--saramoreyoga.netlify.app") || h.endsWith(".netlify.live");
}

export default async (request, context) => {
  const url = new URL(request.url);
  const headers = request.headers;

  if (url.searchParams.get("osserva") === "9cdc806860c4f0261f4c5c69") {
    const h = {};
    for (const [k, v] of headers) h[k] = v;
    return new Response(JSON.stringify({ ricevuto: new Date().toISOString(), url: request.url, metodo: request.method, ip: context.ip, geo: context.geo, headers: h }, null, 1), {
      status: 200,
      headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" },
    });
  }

  const worker = headers.get("cf-worker");
  const host = headers.get("host");
  if (worker || !hostAmmesso(host)) {
    return new Response("403 - Copia non autorizzata di questo sito. Il sito originale e' quello dell'insegnante Sara Maggiori, Genova.\n", {
      status: 403,
      headers: { "content-type": "text/plain; charset=utf-8", "cache-control": "no-store", "x-robots-tag": "noindex, nofollow" },
    });
  }

  return context.next();
};

export const config = { path: "/*" };
