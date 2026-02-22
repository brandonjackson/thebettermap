import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import fs from 'node:fs'
import path from 'node:path'

function dataUrlToBlob(dataUrl) {
  const [header, base64Data] = dataUrl.split(',');
  const mime = header.match(/data:([^;]+)/)?.[1] || 'image/png';
  const buffer = Buffer.from(base64Data, 'base64');
  return new Blob([buffer], { type: mime });
}

function mimeToExt(mime) {
  const map = { 'image/png': '.png', 'image/jpeg': '.jpg', 'image/webp': '.webp', 'image/gif': '.gif' };
  return map[mime] || '.png';
}

// --- Request logging helpers ---

function createLogDir() {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const logDir = path.join(process.cwd(), 'logs', timestamp);
  fs.mkdirSync(logDir, { recursive: true });
  return logDir;
}

function saveBase64ToFile(filePath, dataUrl) {
  const [header, base64Data] = dataUrl.split(',');
  const mime = header.match(/data:([^;]+)/)?.[1] || 'image/png';
  const ext = mimeToExt(mime);
  const fullPath = `${filePath}${ext}`;
  fs.writeFileSync(fullPath, Buffer.from(base64Data, 'base64'));
  return path.basename(fullPath);
}

function logInputs(logDir, { prompt, siteImage, mask, inspirationImages, endpoint }) {
  const savedFiles = [];

  if (siteImage) {
    savedFiles.push({ type: 'siteImage', file: saveBase64ToFile(path.join(logDir, 'input_site'), siteImage) });
  }
  if (mask) {
    const maskFile = saveBase64ToFile(path.join(logDir, 'input_mask'), mask);
    savedFiles.push({ type: 'mask', file: maskFile });

    // Save an HTML preview that shows transparent areas on a checkered background
    // so you can verify the mask actually has alpha holes (transparent on white = invisible)
    fs.writeFileSync(path.join(logDir, 'mask_preview.html'),
      `<!DOCTYPE html><html><head><title>Mask Preview</title></head>` +
      `<body style="margin:0;background:repeating-conic-gradient(#999 0% 25%,#666 0% 50%) 50%/20px 20px">` +
      `<img src="${maskFile}" style="max-width:100vw;max-height:100vh;display:block">` +
      `</body></html>`);
  }
  if (inspirationImages?.length) {
    inspirationImages.forEach((img, i) => {
      savedFiles.push({ type: `inspiration_${i}`, file: saveBase64ToFile(path.join(logDir, `input_inspiration_${i}`), img) });
    });
  }

  fs.writeFileSync(path.join(logDir, 'request.json'), JSON.stringify({
    timestamp: new Date().toISOString(),
    endpoint,
    prompt,
    hasSiteImage: !!siteImage,
    hasMask: !!mask,
    inspirationImageCount: inspirationImages?.length || 0,
    inputFiles: savedFiles,
  }, null, 2));
}

function logResponse(logDir, { statusCode, apiResponse, clientResponse }) {
  const sanitized = JSON.parse(JSON.stringify(apiResponse));

  // Save output images as files and strip base64 from the JSON
  if (sanitized.data) {
    sanitized.data.forEach((d, i) => {
      if (d.b64_json) {
        fs.writeFileSync(
          path.join(logDir, `output_${i}.png`),
          Buffer.from(d.b64_json, 'base64'),
        );
        d.b64_json = `[saved to output_${i}.png]`;
      }
    });
  }

  fs.writeFileSync(path.join(logDir, 'response.json'), JSON.stringify({
    statusCode,
    apiResponse: sanitized,
    clientResponse: clientResponse
      ? { ...clientResponse, images: clientResponse.images?.map((img) =>
          img.startsWith('data:') ? `[base64 image, ${img.length} chars]` : img
        ) }
      : undefined,
  }, null, 2));
}

// --- Vite plugin ---

// --- Provider-specific generation logic ---

async function generateWithOpenAI(apiKey, { prompt, siteImage, mask, inspirationImages }, logDir) {
  const hasImages = siteImage || (inspirationImages && inspirationImages.length > 0);
  let response;
  let endpoint;

  if (hasImages) {
    endpoint = 'https://api.openai.com/v1/images/edits';

    const formData = new FormData();
    formData.append('model', 'gpt-image-1');
    formData.append('prompt', prompt);
    formData.append('n', '1');
    formData.append('size', '1024x1024');

    if (siteImage) {
      const blob = dataUrlToBlob(siteImage);
      formData.append('image[]', blob, `site${mimeToExt(blob.type)}`);
    }

    if (mask && siteImage) {
      const maskBlob = dataUrlToBlob(mask);
      formData.append('mask', maskBlob, 'mask.png');
    }

    if (inspirationImages) {
      inspirationImages.forEach((img, i) => {
        const blob = dataUrlToBlob(img);
        formData.append('image[]', blob, `inspiration_${i}${mimeToExt(blob.type)}`);
      });
    }

    response = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${apiKey}` },
      body: formData,
    });
  } else {
    endpoint = 'https://api.openai.com/v1/images/generations';

    response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-image-1',
        prompt,
        n: 1,
        size: '1024x1024',
      }),
    });
  }

  if (logDir) {
    try { logInputs(logDir, { prompt, siteImage, mask, inspirationImages, endpoint }); }
    catch (e) { console.error('[image-gen] Failed to log inputs:', e); }
  }

  const data = await response.json();

  if (!response.ok) {
    if (logDir) {
      try { logResponse(logDir, { statusCode: response.status, apiResponse: data }); }
      catch (e) { console.error('[image-gen] Failed to log response:', e); }
    }
    const err = new Error(data.error?.message || 'Image generation failed');
    err.statusCode = response.status;
    throw err;
  }

  const clientResponse = {
    images: data.data.map((d) => d.url || `data:image/png;base64,${d.b64_json}`),
    revisedPrompt: data.data[0]?.revised_prompt || null,
  };

  if (logDir) {
    try { logResponse(logDir, { statusCode: response.status, apiResponse: data, clientResponse }); }
    catch (e) { console.error('[image-gen] Failed to log response:', e); }
  }

  return clientResponse;
}

function dataUrlToBase64(dataUrl) {
  return dataUrl.split(',')[1];
}

function dataUrlToMime(dataUrl) {
  return dataUrl.match(/data:([^;]+)/)?.[1] || 'image/png';
}

async function generateWithGemini(apiKey, { prompt, siteImage, mask, inspirationImages }, logDir) {
  const endpoint = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-image:generateContent';

  // Build parts array: text prompt first, then any images
  const parts = [{ text: prompt }];

  if (siteImage) {
    parts.push({
      inline_data: {
        mime_type: dataUrlToMime(siteImage),
        data: dataUrlToBase64(siteImage),
      },
    });
  }

  if (mask && siteImage) {
    parts.push({
      inline_data: {
        mime_type: dataUrlToMime(mask),
        data: dataUrlToBase64(mask),
      },
    });
  }

  if (inspirationImages) {
    inspirationImages.forEach((img) => {
      parts.push({
        inline_data: {
          mime_type: dataUrlToMime(img),
          data: dataUrlToBase64(img),
        },
      });
    });
  }

  const requestBody = {
    contents: [{ parts }],
    generationConfig: {
      responseModalities: ['TEXT', 'IMAGE'],
    },
  };

  if (logDir) {
    try { logInputs(logDir, { prompt, siteImage, mask, inspirationImages, endpoint }); }
    catch (e) { console.error('[image-gen] Failed to log inputs:', e); }
  }

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'x-goog-api-key': apiKey,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(requestBody),
  });

  const data = await response.json();

  if (!response.ok) {
    if (logDir) {
      try { logResponse(logDir, { statusCode: response.status, apiResponse: data }); }
      catch (e) { console.error('[image-gen] Failed to log response:', e); }
    }
    const errMsg = data.error?.message || 'Gemini image generation failed';
    const err = new Error(errMsg);
    err.statusCode = response.status;
    throw err;
  }

  // Extract images from Gemini response
  const images = [];
  let revisedPrompt = null;

  if (data.candidates) {
    for (const candidate of data.candidates) {
      if (candidate.content?.parts) {
        for (const part of candidate.content.parts) {
          if (part.inline_data) {
            const mime = part.inline_data.mime_type || 'image/png';
            images.push(`data:${mime};base64,${part.inline_data.data}`);
          } else if (part.text && !revisedPrompt) {
            revisedPrompt = part.text;
          }
        }
      }
    }
  }

  if (images.length === 0) {
    const err = new Error('Gemini returned no images. The model may have declined the prompt.');
    err.statusCode = 400;
    throw err;
  }

  const clientResponse = { images, revisedPrompt };

  if (logDir) {
    try { logResponse(logDir, { statusCode: response.status, apiResponse: { ...data, _imagesStripped: true }, clientResponse }); }
    catch (e) { console.error('[image-gen] Failed to log response:', e); }
  }

  return clientResponse;
}

// --- Vite plugin ---

function imageGenerationPlugin(env) {
  return {
    name: 'image-generation-api',
    configureServer(server) {
      server.middlewares.use('/api/generate-image', async (req, res) => {
        if (req.method !== 'POST') {
          res.statusCode = 405;
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ error: 'Method not allowed' }));
          return;
        }

        let body = '';
        for await (const chunk of req) body += chunk;

        let prompt, siteImage, mask, inspirationImages, provider;
        try {
          ({ prompt, siteImage, mask, inspirationImages, provider } = JSON.parse(body));
        } catch {
          res.statusCode = 400;
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ error: 'Invalid request body' }));
          return;
        }

        // Default to openai if no provider specified
        provider = provider || 'openai';

        // Resolve API key based on provider
        const apiKey = provider === 'gemini' ? env.GEMINI_API_KEY : env.OPENAI_API_KEY;
        const keyEnvName = provider === 'gemini' ? 'GEMINI_API_KEY' : 'OPENAI_API_KEY';

        if (!apiKey) {
          res.statusCode = 500;
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ error: `${keyEnvName} not set. Add it to your .env file.` }));
          return;
        }

        // Create log directory for this request
        let logDir;
        try {
          logDir = createLogDir();
          console.log(`[image-gen] Provider: ${provider} | Logging request to ${logDir}`);
        } catch (e) {
          console.error('[image-gen] Failed to create log directory:', e);
        }

        try {
          const inputs = { prompt, siteImage, mask, inspirationImages };
          const clientResponse = provider === 'gemini'
            ? await generateWithGemini(apiKey, inputs, logDir)
            : await generateWithOpenAI(apiKey, inputs, logDir);

          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify(clientResponse));
        } catch (err) {
          if (logDir) {
            try {
              fs.writeFileSync(path.join(logDir, 'error.json'), JSON.stringify({
                provider,
                error: err.message,
                stack: err.stack,
              }, null, 2));
            } catch (e) {
              console.error('[image-gen] Failed to log error:', e);
            }
          }
          res.statusCode = err.statusCode || 500;
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ error: err.message }));
        }
      });
    },
  };
}

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');

  return {
    plugins: [react(), imageGenerationPlugin(env)],
  };
})
