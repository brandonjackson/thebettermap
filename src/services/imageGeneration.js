import { getImageProvider } from './settings';

export async function generateImage(prompt, { siteImage, mask, inspirationImages } = {}) {
  const provider = getImageProvider();

  const res = await fetch('/api/generate-image', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      prompt,
      provider,
      siteImage: siteImage || undefined,
      mask: mask || undefined,
      inspirationImages: inspirationImages?.length ? inspirationImages : undefined,
    }),
  });

  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.error || 'Image generation failed');
  }

  return data;
}
