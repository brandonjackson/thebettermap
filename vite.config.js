import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

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

        const apiKey = env.OPENAI_API_KEY;
        if (!apiKey) {
          res.statusCode = 500;
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ error: 'OPENAI_API_KEY not set. Add it to your .env file.' }));
          return;
        }

        let body = '';
        for await (const chunk of req) body += chunk;

        let prompt;
        try {
          ({ prompt } = JSON.parse(body));
        } catch {
          res.statusCode = 400;
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ error: 'Invalid request body' }));
          return;
        }

        try {
          const response = await fetch('https://api.openai.com/v1/images/generations', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${apiKey}`,
            },
            body: JSON.stringify({
              model: 'chatgpt-image-latest',
              prompt: prompt,
              n: 1,
              size: '1024x1024',
            }),
          });

          const data = await response.json();

          if (!response.ok) {
            res.statusCode = response.status;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ error: data.error?.message || 'Image generation failed' }));
            return;
          }

          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({
            images: data.data.map((d) => d.url || `data:image/png;base64,${d.b64_json}`),
            revisedPrompt: data.data[0]?.revised_prompt || null,
          }));
        } catch (err) {
          res.statusCode = 500;
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
