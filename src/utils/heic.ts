/**
 * Fotos HEIC/HEIF (padrão da câmera do iPhone).
 *
 * O Safari decodifica HEIC sozinho; Chrome, Edge e Firefox não. Nesses navegadores
 * a conversão usa a biblioteca heic-to, baixada só quando aparece uma foto HEIC
 * (~1 MB): quem não envia fotos do iPhone nunca a carrega.
 */
export const HEIC_MIME_TYPES = ['image/heic', 'image/heif', 'image/heic-sequence', 'image/heif-sequence'];
export const HEIC_EXTENSIONS = ['.heic', '.heif'];

/** No Windows, o navegador costuma entregar o HEIC sem tipo; por isso a extensão também conta. */
export function looksLikeHeic(file: Pick<File, 'name' | 'type'>): boolean {
  return HEIC_MIME_TYPES.includes(file.type.toLowerCase()) || /\.hei[cf]$/i.test(file.name);
}

const jpegName = (name: string) => `${name.replace(/\.hei[cf]$/i, '') || 'foto'}.jpg`;

async function viaBrowser(file: File): Promise<Blob | null> {
  let bitmap: ImageBitmap;
  try {
    bitmap = await createImageBitmap(file, { imageOrientation: 'from-image' });
  } catch {
    return null;
  }
  try {
    const canvas = document.createElement('canvas');
    canvas.width = bitmap.width;
    canvas.height = bitmap.height;
    canvas.getContext('2d')?.drawImage(bitmap, 0, 0);
    return await new Promise((resolve) => canvas.toBlob(resolve, 'image/jpeg', 0.9));
  } finally {
    bitmap.close();
  }
}

/** Converte uma foto HEIC em JPEG. Lança erro se o arquivo não puder ser lido. */
export async function convertHeicToJpeg(file: File): Promise<File> {
  let blob = await viaBrowser(file);
  if (!blob) {
    // Variante "csp": sem eval/new Function, compatível com a política de segurança do site.
    const { heicTo } = await import('heic-to/csp');
    blob = await heicTo({ blob: file, type: 'image/jpeg', quality: 0.9 });
  }
  return new File([blob], jpegName(file.name), { type: 'image/jpeg', lastModified: file.lastModified });
}
