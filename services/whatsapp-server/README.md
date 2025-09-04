# WhatsApp Microservice (VPS)

An always-on Express service that runs whatsapp-web.js and exposes minimal endpoints for your Next.js app to use in production.

## Endpoints

- GET `/status`
- POST `/init`
- POST `/send` (body: `{ "to": "+383XXXXXXXX", "message": "..." }`)
- POST `/restart`

All requests should include header `X-API-KEY: <your-secret>` if `API_KEY` is set.

## Environment variables

- `PORT` (default `3001`)
- `API_KEY` (recommended)
- `WHATSAPP_DATA_PATH` (default: `/app/whatsapp-session` in Docker, or `./whatsapp-session` locally)
- `CHROME_PATH` (optional; otherwise uses `@sparticuz/chromium`)
- `PUPPETEER_EXECUTABLE_PATH` (optional alternative)

## Run with Docker (recommended)

From `services/whatsapp-server/` on the VPS:

```bash
docker compose up -d
```

To pass a secret at runtime without committing it:

```bash
API_KEY=your-strong-secret docker compose up -d
```

Check logs:

```bash
docker compose logs -f
```

## Run without Docker (pm2)

```bash
npm install
API_KEY=your-strong-secret PORT=3001 node server.js
```

Or with pm2:

```bash
npm install -g pm2
npm install
API_KEY=your-strong-secret PORT=3001 pm2 start server.js --name whatsapp-service
pm2 save
pm2 startup
```

## Nginx reverse proxy (optional, for TLS)

Example server block (replace domain):

```
server {
  server_name wa.example.com;

  location / {
    proxy_pass http://127.0.0.1:3001;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection 'upgrade';
    proxy_set_header Host $host;
    proxy_cache_bypass $http_upgrade;
  }
}
```

After setting up DNS to point to the VPS, obtain Let's Encrypt cert with e.g. `certbot --nginx -d wa.example.com`.

## Connect from Vercel (Next.js)

Set these environment variables in your Vercel project:

- `WHATSAPP_SERVICE_URL = https://wa.example.com` (or `http://<VPS_IP>:3001` temporarily)
- `WHATSAPP_SERVICE_KEY = your-strong-secret`

Your route `app/api/whatsapp/status/route.ts` already proxies to the microservice when `WHATSAPP_SERVICE_URL` is present, so the UI continues to call your existing endpoints unchanged.
