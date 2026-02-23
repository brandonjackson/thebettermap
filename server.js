/**
 * Production server for thebettermap
 *
 * Serves the built static files from dist/ and handles the
 * /api/generate-image endpoint (which is a Vite middleware during dev).
 *
 * Usage:
 *   node server.js
 *
 * Requires:
 *   - npm run build to have been run first (dist/ directory must exist)
 *   - OPENAI_API_KEY and/or GEMINI_API_KEY set in environment (or .env file)
 *   - PORT environment variable (defaults to 3000)
 */

import http from 'node:http'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

// ---------------------------------------------------------------------------
// Minimal .env loader (no external dependencies)
// ---------------------------------------------------------------------------

function loadDotEnv() {
  const envPath = path.join(__dirname, '.env')
  if (!fs.existsSync(envPath)) return
  const lines = fs.readFileSync(envPath, 'utf8').split('\n')
  for (const line of lines) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue
    const eqIdx = trimmed.indexOf('=')
    if (eqIdx === -1) continue
    const key = trimmed.slice(0, eqIdx).trim()
    const value = trimmed.slice(eqIdx + 1).trim().replace(/^['"]|['"]$/g, '')
    if (!(key in process.env)) process.env[key] = value
  }
}

loadDotEnv()

// ---------------------------------------------------------------------------
// Image generation helpers (extracted from vite.config.js)
// ---------------------------------------------------------------------------

function dataUrlToBlob(dataUrl) {
  const [header, base64Data] = dataUrl.split(',')
  const mime = header.match(/data:([^;]+)/)?.[1] || 'image/png'
  const buffer = Buffer.from(base64Data, 'base64')
  return { buffer, mime }
}

function mimeToExt(mime) {
  const map = { 'image/png': '.png', 'image/jpeg': '.jpg', 'image/webp': '.webp', 'image/gif': '.gif' }
  return map[mime] || '.png'
}

function dataUrlToBase64(dataUrl) {
  return dataUrl.split(',')[1]
}

function dataUrlToMime(dataUrl) {
  return dataUrl.match(/data:([^;]+)/)?.[1] || 'image/png'
}

// --- Request logging ---

function createLogDir() {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
  const logDir = path.join(__dirname, 'logs', timestamp)
  fs.mkdirSync(logDir, { recursive: true })
  return logDir
}

function saveBase64ToFile(filePath, dataUrl) {
  const [header, base64Data] = dataUrl.split(',')
  const mime = header.match(/data:([^;]+)/)?.[1] || 'image/png'
  const ext = mimeToExt(mime)
  const fullPath = `${filePath}${ext}`
  fs.writeFileSync(fullPath, Buffer.from(base64Data, 'base64'))
  return path.basename(fullPath)
}

function logInputs(logDir, { prompt, siteImage, mask, inspirationImages, endpoint }) {
  const savedFiles = []
  if (siteImage) savedFiles.push({ type: 'siteImage', file: saveBase64ToFile(path.join(logDir, 'input_site'), siteImage) })
  if (mask) savedFiles.push({ type: 'mask', file: saveBase64ToFile(path.join(logDir, 'input_mask'), mask) })
  if (inspirationImages?.length) {
    inspirationImages.forEach((img, i) => {
      savedFiles.push({ type: `inspiration_${i}`, file: saveBase64ToFile(path.join(logDir, `input_inspiration_${i}`), img) })
    })
  }
  fs.writeFileSync(path.join(logDir, 'request.json'), JSON.stringify({
    timestamp: new Date().toISOString(), endpoint, prompt,
    hasSiteImage: !!siteImage, hasMask: !!mask,
    inspirationImageCount: inspirationImages?.length || 0, inputFiles: savedFiles,
  }, null, 2))
}

function logResponse(logDir, { statusCode, apiResponse, clientResponse }) {
  const sanitized = JSON.parse(JSON.stringify(apiResponse))
  if (sanitized.data) {
    sanitized.data.forEach((d, i) => {
      if (d.b64_json) {
        fs.writeFileSync(path.join(logDir, `output_${i}.png`), Buffer.from(d.b64_json, 'base64'))
        d.b64_json = `[saved to output_${i}.png]`
      }
    })
  }
  fs.writeFileSync(path.join(logDir, 'response.json'), JSON.stringify({
    statusCode, apiResponse: sanitized,
    clientResponse: clientResponse
      ? { ...clientResponse, images: clientResponse.images?.map((img) => img.startsWith('data:') ? `[base64 image, ${img.length} chars]` : img) }
      : undefined,
  }, null, 2))
}

// --- OpenAI ---

async function generateWithOpenAI(apiKey, { prompt, siteImage, mask, inspirationImages }, logDir) {
  const hasImages = siteImage || (inspirationImages && inspirationImages.length > 0)
  let response, endpoint

  if (hasImages) {
    endpoint = 'https://api.openai.com/v1/images/edits'

    // Build multipart form manually (no external deps)
    const boundary = `----FormBoundary${Math.random().toString(36).slice(2)}`
    const parts = []

    const textPart = (name, value) =>
      `--${boundary}\r\nContent-Disposition: form-data; name="${name}"\r\n\r\n${value}\r\n`

    const filePart = (name, filename, mime, buffer) => {
      const header = `--${boundary}\r\nContent-Disposition: form-data; name="${name}"; filename="${filename}"\r\nContent-Type: ${mime}\r\n\r\n`
      return { header: Buffer.from(header), body: buffer, tail: Buffer.from('\r\n') }
    }

    const textChunks = [
      textPart('model', 'gpt-image-1'),
      textPart('prompt', prompt),
      textPart('n', '1'),
      textPart('size', '1024x1024'),
    ]

    const fileChunks = []

    if (siteImage) {
      const { buffer, mime } = dataUrlToBlob(siteImage)
      fileChunks.push(filePart('image[]', `site${mimeToExt(mime)}`, mime, buffer))
    }
    if (mask && siteImage) {
      const { buffer, mime } = dataUrlToBlob(mask)
      fileChunks.push(filePart('mask', 'mask.png', mime, buffer))
    }
    if (inspirationImages) {
      inspirationImages.forEach((img, i) => {
        const { buffer, mime } = dataUrlToBlob(img)
        fileChunks.push(filePart('image[]', `inspiration_${i}${mimeToExt(mime)}`, mime, buffer))
      })
    }

    const closingBoundary = Buffer.from(`--${boundary}--\r\n`)
    const bodyParts = [
      Buffer.from(textChunks.join('')),
      ...fileChunks.flatMap(({ header, body, tail }) => [header, body, tail]),
      closingBoundary,
    ]
    const bodyBuffer = Buffer.concat(bodyParts)

    if (logDir) {
      try { logInputs(logDir, { prompt, siteImage, mask, inspirationImages, endpoint }) } catch (e) { console.error('[image-gen] log error:', e) }
    }

    response = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': `multipart/form-data; boundary=${boundary}` },
      body: bodyBuffer,
    })
  } else {
    endpoint = 'https://api.openai.com/v1/images/generations'

    if (logDir) {
      try { logInputs(logDir, { prompt, siteImage, mask, inspirationImages, endpoint }) } catch (e) { console.error('[image-gen] log error:', e) }
    }

    response = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` },
      body: JSON.stringify({ model: 'gpt-image-1', prompt, n: 1, size: '1024x1024' }),
    })
  }

  const data = await response.json()

  if (!response.ok) {
    if (logDir) { try { logResponse(logDir, { statusCode: response.status, apiResponse: data }) } catch (e) { } }
    const err = new Error(data.error?.message || 'Image generation failed')
    err.statusCode = response.status
    throw err
  }

  const clientResponse = {
    images: data.data.map((d) => d.url || `data:image/png;base64,${d.b64_json}`),
    revisedPrompt: data.data[0]?.revised_prompt || null,
  }

  if (logDir) { try { logResponse(logDir, { statusCode: response.status, apiResponse: data, clientResponse }) } catch (e) { } }
  return clientResponse
}

// --- Gemini ---

async function generateWithGemini(apiKey, { prompt, siteImage, mask, inspirationImages }, logDir) {
  const endpoint = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-image:generateContent'
  const parts = [{ text: prompt }]

  if (siteImage) parts.push({ inline_data: { mime_type: dataUrlToMime(siteImage), data: dataUrlToBase64(siteImage) } })
  if (mask && siteImage) parts.push({ inline_data: { mime_type: dataUrlToMime(mask), data: dataUrlToBase64(mask) } })
  if (inspirationImages) {
    inspirationImages.forEach((img) => {
      parts.push({ inline_data: { mime_type: dataUrlToMime(img), data: dataUrlToBase64(img) } })
    })
  }

  const requestBody = { contents: [{ parts }], generationConfig: { responseModalities: ['TEXT', 'IMAGE'] } }

  if (logDir) { try { logInputs(logDir, { prompt, siteImage, mask, inspirationImages, endpoint }) } catch (e) { } }

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: { 'x-goog-api-key': apiKey, 'Content-Type': 'application/json' },
    body: JSON.stringify(requestBody),
  })

  const data = await response.json()

  if (!response.ok) {
    if (logDir) { try { logResponse(logDir, { statusCode: response.status, apiResponse: data }) } catch (e) { } }
    const err = new Error(data.error?.message || 'Gemini image generation failed')
    err.statusCode = response.status
    throw err
  }

  const images = []
  let revisedPrompt = null
  if (data.candidates) {
    for (const candidate of data.candidates) {
      if (candidate.content?.parts) {
        for (const part of candidate.content.parts) {
          if (part.inline_data) {
            const mime = part.inline_data.mime_type || 'image/png'
            images.push(`data:${mime};base64,${part.inline_data.data}`)
          } else if (part.text && !revisedPrompt) {
            revisedPrompt = part.text
          }
        }
      }
    }
  }

  if (images.length === 0) {
    const err = new Error('Gemini returned no images. The model may have declined the prompt.')
    err.statusCode = 400
    throw err
  }

  const clientResponse = { images, revisedPrompt }
  if (logDir) { try { logResponse(logDir, { statusCode: response.status, apiResponse: { ...data, _imagesStripped: true }, clientResponse }) } catch (e) { } }
  return clientResponse
}

// ---------------------------------------------------------------------------
// Geograph scraping
// ---------------------------------------------------------------------------

function isValidGeographPhotoUrl(url) {
  return /^https?:\/\/(www\.)?geograph\.org\.uk\/photo\/\d+$/.test(url);
}

async function scrapeGeograph(url) {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to fetch Geograph page: ${response.status}`);
  }
  const html = await response.text();

  // Extract image URL, photographer and title from JSON-LD structured data (preferred)
  let imageUrl = null;
  let photographer = null;
  let title = null;
  let lat = null;
  let lng = null;
  const jsonLdBlocks = html.matchAll(/<script\s+type="application\/ld\+json">([\s\S]*?)<\/script>/g);
  for (const m of jsonLdBlocks) {
    try {
      const jsonLd = JSON.parse(m[1]);
      if (jsonLd['@type'] === 'ImageObject') {
        imageUrl = imageUrl || jsonLd.contentUrl || null;
        photographer = photographer || jsonLd.creator?.name || jsonLd.creditText || null;
        title = title || jsonLd.name || null;
        if (jsonLd.contentLocation) {
          lat = lat ?? (typeof jsonLd.contentLocation.latitude === 'number' ? jsonLd.contentLocation.latitude : null);
          lng = lng ?? (typeof jsonLd.contentLocation.longitude === 'number' ? jsonLd.contentLocation.longitude : null);
        }
      }
    } catch {
      // skip malformed JSON-LD blocks
    }
  }

  // Fallback: extract image from div#mainphoto > img
  if (!imageUrl) {
    const mainPhotoMatch = html.match(/id="mainphoto"[\s\S]*?<img[^>]*src="([^"]+)"/);
    if (mainPhotoMatch) {
      imageUrl = mainPhotoMatch[1];
    }
  }

  if (!imageUrl) {
    throw new Error('Could not find main photo on Geograph page');
  }

  // Fallback: extract title from <title> tag (everything before the copyright symbol)
  if (!title) {
    const titleMatch = html.match(/<title>([^<]*?)(?:\s*©|\s*&copy;)/i);
    if (titleMatch) {
      title = titleMatch[1].trim();
    }
  }

  // Fallback: extract photographer from copyright text in page
  if (!photographer) {
    const copyrightMatch = html.match(/©\s*Copyright\s+<a[^>]*>([^<]+)<\/a>/i)
      || html.match(/©\s*Copyright\s+([^,<]+)/i);
    if (copyrightMatch) {
      photographer = copyrightMatch[1].trim();
    }
  }

  // Download the image
  const imgResponse = await fetch(imageUrl);
  if (!imgResponse.ok) {
    throw new Error(`Failed to download image: ${imgResponse.status}`);
  }
  const imgBuffer = Buffer.from(await imgResponse.arrayBuffer());
  const mime = imgResponse.headers.get('content-type') || 'image/jpeg';
  const base64 = imgBuffer.toString('base64');
  const dataUrl = `data:${mime};base64,${base64}`;

  return {
    imageDataUrl: dataUrl,
    photographer,
    title,
    lat,
    lng,
    sourceUrl: url,
    credits: photographer
      ? `Copyright ${photographer}, via Geograph under CC-BY-SA licence`
      : 'Via Geograph under CC-BY-SA licence',
  };
}

// ---------------------------------------------------------------------------
// MIME type map for static file serving
// ---------------------------------------------------------------------------

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js':   'application/javascript',
  '.mjs':  'application/javascript',
  '.css':  'text/css',
  '.json': 'application/json',
  '.png':  'image/png',
  '.jpg':  'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif':  'image/gif',
  '.webp': 'image/webp',
  '.svg':  'image/svg+xml',
  '.ico':  'image/x-icon',
  '.woff': 'font/woff',
  '.woff2':'font/woff2',
  '.ttf':  'font/ttf',
  '.map':  'application/json',
}

// ---------------------------------------------------------------------------
// HTTP server
// ---------------------------------------------------------------------------

const PORT = parseInt(process.env.PORT || '3000', 10)
const DIST_DIR = path.join(__dirname, 'dist')

if (!fs.existsSync(DIST_DIR)) {
  console.error('ERROR: dist/ directory not found. Run "npm run build" first.')
  process.exit(1)
}

async function readBody(req) {
  return new Promise((resolve, reject) => {
    let body = ''
    req.on('data', (chunk) => { body += chunk })
    req.on('end', () => resolve(body))
    req.on('error', reject)
  })
}

function sendJson(res, statusCode, data) {
  const body = JSON.stringify(data)
  res.writeHead(statusCode, { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(body) })
  res.end(body)
}

function serveStatic(req, res) {
  let urlPath = req.url.split('?')[0]
  if (urlPath === '/') urlPath = '/index.html'

  let filePath = path.join(DIST_DIR, urlPath)

  // Security: prevent path traversal
  if (!filePath.startsWith(DIST_DIR)) {
    res.writeHead(403)
    res.end('Forbidden')
    return
  }

  if (!fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
    // SPA fallback: serve index.html for all unmatched routes
    filePath = path.join(DIST_DIR, 'index.html')
  }

  const ext = path.extname(filePath).toLowerCase()
  const contentType = MIME_TYPES[ext] || 'application/octet-stream'

  try {
    const content = fs.readFileSync(filePath)
    res.writeHead(200, { 'Content-Type': contentType })
    res.end(content)
  } catch {
    res.writeHead(404)
    res.end('Not found')
  }
}

const server = http.createServer(async (req, res) => {
  // CORS headers (adjust origins as needed)
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')

  if (req.method === 'OPTIONS') {
    res.writeHead(204)
    res.end()
    return
  }

  // Geograph scraping API
  if (req.url === '/api/scrape-geograph' || req.url.startsWith('/api/scrape-geograph?')) {
    if (req.method !== 'POST') {
      sendJson(res, 405, { error: 'Method not allowed' });
      return;
    }

    let parsed;
    try {
      const body = await readBody(req);
      parsed = JSON.parse(body);
    } catch {
      sendJson(res, 400, { error: 'Invalid request body' });
      return;
    }

    const { url } = parsed;
    if (!url || !isValidGeographPhotoUrl(url)) {
      sendJson(res, 400, { error: 'Invalid Geograph URL. Expected format: https://www.geograph.org.uk/photo/1234567' });
      return;
    }

    try {
      const result = await scrapeGeograph(url);
      sendJson(res, 200, result);
    } catch (err) {
      sendJson(res, 500, { error: err.message });
    }
    return;
  }

  // API route
  if (req.url === '/api/generate-image' || req.url.startsWith('/api/generate-image?')) {
    if (req.method !== 'POST') {
      sendJson(res, 405, { error: 'Method not allowed' })
      return
    }

    let parsed
    try {
      const body = await readBody(req)
      parsed = JSON.parse(body)
    } catch {
      sendJson(res, 400, { error: 'Invalid request body' })
      return
    }

    const { prompt, siteImage, mask, inspirationImages, provider: rawProvider } = parsed
    const provider = rawProvider || 'openai'
    const apiKey = provider === 'gemini' ? process.env.GEMINI_API_KEY : process.env.OPENAI_API_KEY
    const keyEnvName = provider === 'gemini' ? 'GEMINI_API_KEY' : 'OPENAI_API_KEY'

    if (!apiKey) {
      sendJson(res, 500, { error: `${keyEnvName} not set in environment.` })
      return
    }

    let logDir
    try { logDir = createLogDir(); console.log(`[image-gen] provider=${provider} logDir=${logDir}`) }
    catch (e) { console.error('[image-gen] Failed to create log dir:', e) }

    try {
      const inputs = { prompt, siteImage, mask, inspirationImages }
      const clientResponse = provider === 'gemini'
        ? await generateWithGemini(apiKey, inputs, logDir)
        : await generateWithOpenAI(apiKey, inputs, logDir)
      sendJson(res, 200, clientResponse)
    } catch (err) {
      if (logDir) {
        try { fs.writeFileSync(path.join(logDir, 'error.json'), JSON.stringify({ provider, error: err.message, stack: err.stack }, null, 2)) }
        catch (e) { }
      }
      sendJson(res, err.statusCode || 500, { error: err.message })
    }
    return
  }

  // Static file serving
  serveStatic(req, res)
})

server.listen(PORT, () => {
  console.log(`thebettermap running on http://localhost:${PORT}`)
  console.log(`Serving static files from: ${DIST_DIR}`)
  console.log(`OpenAI key: ${process.env.OPENAI_API_KEY ? 'set' : 'NOT SET'}`)
  console.log(`Gemini key: ${process.env.GEMINI_API_KEY ? 'set' : 'NOT SET'}`)
  console.log(`MapTiler key: ${process.env.VITE_MAPTILER_KEY ? 'set (baked into build)' : 'NOT SET'}`)
})

server.on('error', (err) => {
  console.error('Server error:', err)
  process.exit(1)
})
