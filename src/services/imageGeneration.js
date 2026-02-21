export async function generateImage(prompt) {
  const res = await fetch('/api/generate-image', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ prompt }),
  });

  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.error || 'Image generation failed');
  }

  return data;
}
