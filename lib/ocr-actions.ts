'use server';

import { requireTenantAdmin } from '@/lib/auth/guards';
import { extractCredentialsWithVision, extractTextWithTesseract, parseCredentials, type Credential } from '@/lib/ocr';

export type OcrActionState = {
  error?: string;
  credentials?: Credential[];
  unrecognized?: string[];
  confidence?: number;
};

const supportedTypes = new Set(['image/jpeg', 'image/png', 'image/gif', 'image/webp']);

export async function extractAccountsAction(_state: OcrActionState, formData: FormData): Promise<OcrActionState> {
  await requireTenantAdmin();
  const file = formData.get('image');
  if (!(file instanceof File) || file.size === 0) return { error: 'Selecciona una imagen.' };
  if (file.size > 10 * 1024 * 1024) return { error: 'La imagen no puede superar 10 MB.' };
  if (!supportedTypes.has(file.type)) return { error: 'Usa una imagen JPG, PNG, GIF o WEBP.' };

  const buffer = Buffer.from(await file.arrayBuffer());
  try {
    const ocr = await extractTextWithTesseract(buffer);
    const parsed = parseCredentials(ocr.text);
    if (ocr.confidence >= 70 && parsed.credentials.length > 0) {
      return { credentials: parsed.credentials, unrecognized: parsed.unrecognized, confidence: ocr.confidence };
    }

    try {
      const visionCredentials = await extractCredentialsWithVision(buffer, file.type);
      if (visionCredentials) return { credentials: visionCredentials, unrecognized: [], confidence: 100 };
    } catch {
      // Si Vision falla, el preview de Tesseract sigue siendo útil para edición manual.
    }
    return { credentials: parsed.credentials, unrecognized: parsed.unrecognized, confidence: ocr.confidence };
  } catch {
    try {
      const visionCredentials = await extractCredentialsWithVision(buffer, file.type);
      if (visionCredentials) return { credentials: visionCredentials, unrecognized: [], confidence: 100 };
    } catch {
      // Se devuelve un error general sin exponer detalles del proveedor OCR.
    }
    return { error: 'No se pudo procesar la imagen.' };
  }
}
