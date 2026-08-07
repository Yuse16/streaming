import { z } from 'zod';
import Tesseract from 'tesseract.js';
import Anthropic from '@anthropic-ai/sdk';

export const credentialSchema = z.object({
  correo: z.string().email(),
  password: z.string().min(4)
});

export type Credential = z.infer<typeof credentialSchema>;

export type ParsedCredentials = {
  credentials: Credential[];
  unrecognized: string[];
};

export function parseCredentials(rawText: string): ParsedCredentials {
  const credentials: Credential[] = [];
  const unrecognized: string[] = [];
  const linePattern = /^([\w.+%-]+@[\w.-]+\.[a-z]{2,})\s*[:|/]\s*(.+)$/i;

  for (const rawLine of rawText.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line) continue;
    const match = line.match(linePattern);
    const parsed = match ? credentialSchema.safeParse({ correo: match[1].toLowerCase(), password: match[2].trim() }) : null;
    if (parsed?.success) credentials.push(parsed.data);
    else unrecognized.push(line);
  }

  return { credentials, unrecognized };
}

export async function extractTextWithTesseract(image: Buffer): Promise<{ text: string; confidence: number }> {
  const result = await Tesseract.recognize(image, 'spa+eng');
  return { text: result.data.text, confidence: result.data.confidence };
}

const visionResponseSchema = z.object({
  cuentas: z.array(credentialSchema)
});

export async function extractCredentialsWithVision(image: Buffer, mediaType: string): Promise<Credential[] | null> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return null;

  const anthropic = new Anthropic({ apiKey });
  const response = await anthropic.messages.create({
    model: process.env.ANTHROPIC_VISION_MODEL ?? 'claude-sonnet-4-6',
    max_tokens: 2000,
    messages: [{
      role: 'user',
      content: [
        { type: 'image', source: { type: 'base64', media_type: mediaType as 'image/jpeg' | 'image/png' | 'image/gif' | 'image/webp', data: image.toString('base64') } },
        { type: 'text', text: 'Extrae credenciales. Responde únicamente JSON con formato {"cuentas":[{"correo":"...","password":"..."}]}. Si no hay cuentas válidas, devuelve {"cuentas":[]}. No inventes datos.' }
      ]
    }]
  });

  const text = response.content.find((block) => block.type === 'text')?.text ?? '';
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) return null;
  try {
    const parsed = visionResponseSchema.safeParse(JSON.parse(jsonMatch[0]));
    return parsed.success ? parsed.data.cuentas : null;
  } catch {
    return null;
  }
}
