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
  const dataB64 = await fileToBase64(file);
  return api('POST', '/api/admin/upload', {
    filename: file.name,
    contentType: file.type,
    dataB64,
  });
}

function fileToBase64(f: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const s = String(reader.result || '');
      const idx = s.indexOf(',');
      resolve(idx >= 0 ? s.slice(idx + 1) : s);
    };
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(f);
  });
}
