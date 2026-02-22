# Deployment Guide

This guide covers deploying thebettermap from a local development setup to a production server (Ubuntu/Debian VPS).

## Architecture overview

During **development**, `npm run dev` starts Vite's dev server which:
- Serves the React app with hot-reload
- Runs a middleware at `POST /api/generate-image` that calls OpenAI/Gemini

In **production**, Vite's dev server is gone. This repo includes `server.js` — a zero-dependency Node.js HTTP server that:
- Serves the compiled static files from `dist/`
- Handles `POST /api/generate-image` with identical logic to the dev middleware

---

## Prerequisites

### What you need

- A VPS running Ubuntu 22.04 LTS (DigitalOcean, Linode, AWS EC2, Hetzner, etc.)
- SSH access to that server
- A domain name pointed at the server's IP address (required for HTTPS)
- Your API keys:
  - `VITE_MAPTILER_KEY` — from [cloud.maptiler.com](https://cloud.maptiler.com/) (free tier available)
  - `OPENAI_API_KEY` and/or `GEMINI_API_KEY`

### Local requirements

- Git
- Node.js 18+ and npm

---

## Step 1: Set up the server

SSH into your VPS as root (or a sudo user):

```bash
ssh root@your-server-ip
```

### Install Node.js 20

```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs
node --version   # should print v20.x.x
```

### Install nginx

```bash
sudo apt-get install -y nginx
sudo systemctl enable nginx
sudo systemctl start nginx
```

### Install PM2 (process manager)

PM2 keeps the Node server running after you log out and restarts it if it crashes.

```bash
sudo npm install -g pm2
pm2 startup systemd   # follow the printed instruction to enable on boot
```

### Install Git

```bash
sudo apt-get install -y git
```

---

## Step 2: Deploy the code

### Create an app user (recommended)

Running the app as a dedicated user limits blast radius if anything goes wrong.

```bash
sudo adduser --disabled-password --gecos "" appuser
sudo mkdir -p /home/appuser/.ssh
sudo cp ~/.ssh/authorized_keys /home/appuser/.ssh/
sudo chown -R appuser:appuser /home/appuser/.ssh
```

### Clone the repository

```bash
sudo -u appuser bash
cd /home/appuser
git clone <your-repository-url> thebettermap
cd thebettermap
```

Replace `<your-repository-url>` with the actual URL (e.g. from GitHub).

---

## Step 3: Configure environment variables

The app needs environment variables for both the **build step** (VITE_MAPTILER_KEY is baked into the bundle) and **runtime** (API keys for image generation).

Create a `.env` file on the server:

```bash
nano /home/appuser/thebettermap/.env
```

Add:

```
VITE_MAPTILER_KEY=your_maptiler_api_key_here
OPENAI_API_KEY=your_openai_api_key_here
GEMINI_API_KEY=your_gemini_api_key_here
PORT=3000
```

Save with `Ctrl+O`, exit with `Ctrl+X`.

**Important:** `VITE_MAPTILER_KEY` is embedded into the static bundle at build time. If you change it, you must rebuild. The other keys are read at runtime by `server.js`.

---

## Step 4: Build and start the app

```bash
cd /home/appuser/thebettermap

# Install dependencies
npm install --omit=dev

# Build the React app (reads VITE_MAPTILER_KEY from .env)
npm run build

# Start the production server with PM2
pm2 start server.js --name thebettermap

# Save the PM2 process list so it survives reboots
pm2 save
```

Verify it's running:

```bash
pm2 status
curl http://localhost:3000
```

You should see HTML. The API endpoint is at `http://localhost:3000/api/generate-image`.

---

## Step 5: Configure nginx as a reverse proxy

nginx sits in front of Node.js and handles:
- Forwarding web traffic to the Node server
- SSL termination (HTTPS)
- Serving large requests efficiently

Create a site config:

```bash
sudo nano /etc/nginx/sites-available/thebettermap
```

Paste the following, replacing `your-domain.com` with your actual domain:

```nginx
server {
    listen 80;
    server_name your-domain.com www.your-domain.com;

    # Increase body size limit for image uploads (base64 images can be large)
    client_max_body_size 50M;

    # Increase timeouts for image generation (can take 10-30 seconds)
    proxy_connect_timeout 60s;
    proxy_send_timeout    120s;
    proxy_read_timeout    120s;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

Enable the site and test:

```bash
sudo ln -s /etc/nginx/sites-available/thebettermap /etc/nginx/sites-enabled/
sudo nginx -t          # should print "syntax is ok" and "test is successful"
sudo systemctl reload nginx
```

Your site should now be accessible at `http://your-domain.com`.

---

## Step 6: Enable HTTPS with Let's Encrypt

```bash
sudo apt-get install -y certbot python3-certbot-nginx
sudo certbot --nginx -d your-domain.com -d www.your-domain.com
```

Certbot will:
1. Obtain a free TLS certificate
2. Automatically rewrite your nginx config to use HTTPS
3. Set up auto-renewal

Verify auto-renewal works:

```bash
sudo certbot renew --dry-run
```

Your app is now live at `https://your-domain.com`.

---

## Deploying updates

When you push new code, SSH into the server and run:

```bash
sudo -u appuser bash -c "
  cd /home/appuser/thebettermap &&
  git pull origin main &&
  npm install --omit=dev &&
  npm run build &&
  pm2 restart thebettermap
"
```

If you only changed server-side code in `server.js` and did not change any `src/` files or environment variables, you can skip `npm run build` and just restart:

```bash
pm2 restart thebettermap
```

---

## Monitoring and logs

```bash
# Live logs from the Node server
pm2 logs thebettermap

# Last 200 lines
pm2 logs thebettermap --lines 200

# nginx access/error logs
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log

# Image generation request logs (saved to ./logs/ by server.js)
ls /home/appuser/thebettermap/logs/
```

---

## Troubleshooting

### The site loads but image generation fails

1. Check API keys are set in `.env`:
   ```bash
   grep -E "OPENAI|GEMINI" /home/appuser/thebettermap/.env
   ```

2. Check PM2 logs for error messages:
   ```bash
   pm2 logs thebettermap --lines 50
   ```

3. Test the API directly on the server:
   ```bash
   curl -X POST http://localhost:3000/api/generate-image \
     -H "Content-Type: application/json" \
     -d '{"prompt":"a park bench","provider":"openai"}'
   ```

### Map tiles don't load / blank map

The MapTiler key is baked into the bundle at build time. If the key is wrong or missing:
1. Fix `VITE_MAPTILER_KEY` in `.env`
2. Re-run `npm run build`
3. Restart: `pm2 restart thebettermap`

### nginx returns 502 Bad Gateway

The Node server isn't running. Check:
```bash
pm2 status
pm2 restart thebettermap
```

### Port 3000 is in use

Change `PORT=3001` (or any free port) in `.env` and update the nginx config's `proxy_pass` line to match.

### The app works locally but not on the server after git pull

Likely a missing build step. Always run `npm run build` after pulling changes that touch `src/`.

---

## Security hardening (optional but recommended)

### Firewall

Allow only SSH, HTTP, and HTTPS:

```bash
sudo ufw allow OpenSSH
sudo ufw allow 'Nginx Full'
sudo ufw enable
```

### Hide the Node.js port from the public internet

Once nginx is in front, block direct access to port 3000:

```bash
sudo ufw deny 3000
```

### Keep the OS updated

```bash
sudo apt-get update && sudo apt-get upgrade -y
```

---

## File structure on the server

```
/home/appuser/thebettermap/
├── dist/           # Built static files (gitignored, created by npm run build)
├── logs/           # Image generation request logs (gitignored, created at runtime)
├── node_modules/   # Dependencies (gitignored)
├── server.js       # Production Node.js server
├── src/            # React source code
├── vite.config.js  # Vite build config (also contains dev-only API middleware)
├── .env            # Secret environment variables — DO NOT COMMIT
└── package.json
```
