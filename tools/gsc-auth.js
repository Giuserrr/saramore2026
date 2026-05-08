#!/usr/bin/env node
/**
 * gsc-auth.js — One-shot OAuth consent flow per ottenere refresh_token GSC.
 *
 * 1. Legge oauth-client.json (Client ID + Secret)
 * 2. Avvia HTTP server locale su porta libera
 * 3. Apre browser sul consent URL Google
 * 4. Cattura il code dal redirect localhost
 * 5. Scambia code → access_token + refresh_token
 * 6. Salva refresh_token in ~/.config/saramoreyoga/gsc-oauth.json
 *
 * Da rilanciare solo se revoki l'autorizzazione o cambi scope.
 */
const fs = require('fs');
const path = require('path');
const os = require('os');
const http = require('http');
const { exec } = require('child_process');
const crypto = require('crypto');

const CONFIG_DIR = path.join(os.homedir(), '.config', 'saramoreyoga');
const CLIENT_PATH = path.join(CONFIG_DIR, 'oauth-client.json');
const TOKEN_PATH = path.join(CONFIG_DIR, 'gsc-oauth.json');
const SCOPE = 'https://www.googleapis.com/auth/webmasters.readonly';

function loadClient() {
    if (!fs.existsSync(CLIENT_PATH)) {
        console.error(`[auth] Client OAuth non trovato in ${CLIENT_PATH}`);
        process.exit(1);
    }
    const raw = JSON.parse(fs.readFileSync(CLIENT_PATH, 'utf8'));
    return raw.installed || raw.web || raw;
}

function openBrowser(url) {
    const platform = process.platform;
    const cmd = platform === 'darwin' ? `open "${url}"` :
                platform === 'win32' ? `start "" "${url}"` :
                `xdg-open "${url}"`;
    exec(cmd, err => { if (err) console.error('[auth] apri manualmente:', url); });
}

(async () => {
    const client = loadClient();
    const state = crypto.randomBytes(16).toString('hex');

    // Listen on random free port
    const server = http.createServer();
    await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
    const port = server.address().port;
    const redirectUri = `http://localhost:${port}`;

    const authUrl = 'https://accounts.google.com/o/oauth2/v2/auth?' + new URLSearchParams({
        client_id: client.client_id,
        redirect_uri: redirectUri,
        response_type: 'code',
        scope: SCOPE,
        access_type: 'offline',     // forza refresh_token
        prompt: 'consent',          // forza il consent screen anche se già accordato (così avere sempre refresh_token)
        state
    });

    console.log(`\n[auth] Apro browser per il consenso. Se non si apre, vai a:\n${authUrl}\n`);
    openBrowser(authUrl);

    const codePromise = new Promise((resolve, reject) => {
        server.on('request', (req, res) => {
            const url = new URL(req.url, redirectUri);
            const code = url.searchParams.get('code');
            const recvState = url.searchParams.get('state');
            const error = url.searchParams.get('error');
            res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
            if (error) {
                res.end(`<h1>Errore: ${error}</h1><p>Puoi chiudere questa finestra.</p>`);
                reject(new Error(`OAuth error: ${error}`));
                return;
            }
            if (!code || recvState !== state) {
                res.end('<h1>Stato non valido o code mancante.</h1>');
                reject(new Error('Invalid state or missing code'));
                return;
            }
            res.end('<h1>✓ Autorizzazione completata</h1><p>Puoi chiudere questa finestra e tornare al terminale.</p>');
            resolve(code);
        });
    });

    const code = await codePromise;
    server.close();

    // Exchange code for tokens
    const tokenRes = await fetch(client.token_uri, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
            code,
            client_id: client.client_id,
            client_secret: client.client_secret,
            redirect_uri: redirectUri,
            grant_type: 'authorization_code'
        })
    });
    const tokens = await tokenRes.json();
    if (!tokenRes.ok || !tokens.refresh_token) {
        console.error('[auth] Token exchange fallito:', tokens);
        process.exit(1);
    }

    fs.writeFileSync(TOKEN_PATH, JSON.stringify({
        refresh_token: tokens.refresh_token,
        client_id: client.client_id,
        client_secret: client.client_secret,
        token_uri: client.token_uri,
        scope: SCOPE,
        obtained_at: new Date().toISOString()
    }, null, 2), 'utf8');
    fs.chmodSync(TOKEN_PATH, 0o600);

    console.log(`\n[auth] ✓ Refresh token salvato in ${TOKEN_PATH}`);
    console.log('[auth] Ora puoi usare: node tools/gsc.js sites');
})().catch(e => { console.error('[auth] Fatal:', e); process.exit(1); });
