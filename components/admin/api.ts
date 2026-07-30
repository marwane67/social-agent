export async function api(method: string, path: string, body?: any) {
  const r = await fetch(path, {
    method,
    headers: body ? { 'content-type': 'application/json' } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  });
  const j = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(j.error || `HTTP ${r.status}`);
  return j;
}

export async function uploadFile(file: File): Promise<{ path: string; url: string }> {
  // Resize/compress images client-side to stay under Vercel's 4.5MB API body limit.
  // Phones produce 5–15MB photos which would silently fail.
  const isImage = file.type.startsWith('image/');
  const processed: { blob: Blob; filename: string; contentType: string } = isImage
    ? await compressImage(file)
    : { blob: file, filename: file.name, contentType: file.type || 'application/octet-stream' };
  const dataB64 = await fileToBase64(processed.blob);
  return api('POST', '/api/admin/upload', {
    filename: processed.filename,
    contentType: processed.contentType,
    dataB64,
  });
}

async function compressImage(
  file: File,
): Promise<{ blob: Blob; filename: string; contentType: string }> {
  const MAX_DIM = 2000; // longest edge in px
  const QUALITY = 0.85;

  // Read into Image to inspect dimensions
  const url = URL.createObjectURL(file);
  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const i = new Image();
      i.onload = () => resolve(i);
      i.onerror = () => reject(new Error('Image illisible (format non supporté ? HEIC ?)'));
      i.src = url;
    });

    const longest = Math.max(img.naturalWidth, img.naturalHeight);
    const scale = longest > MAX_DIM ? MAX_DIM / longest : 1;
    const w = Math.round(img.naturalWidth * scale);
    const h = Math.round(img.naturalHeight * scale);

    const canvas = document.createElement('canvas');
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Canvas non disponible');
    ctx.drawImage(img, 0, 0, w, h);

    // Always output JPEG (smaller + universally supported)
    const blob: Blob = await new Promise((resolve, reject) =>
      canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('Compression échouée'))), 'image/jpeg', QUALITY),
    );

    const baseName = file.name.replace(/\.[^.]+$/, '') || 'image';
    return { blob, filename: `${baseName}.jpg`, contentType: 'image/jpeg' };
  } finally {
    URL.revokeObjectURL(url);
  }
}

function fileToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const s = String(reader.result || '');
      const idx = s.indexOf(',');
      resolve(idx >= 0 ? s.slice(idx + 1) : s);
    };
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(blob);
  });
}
