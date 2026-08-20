import { z } from 'zod';

const emailSchema = z.string().trim().email('Ingresa un email válido.').max(254);
const passwordSchema = z.string().min(8, 'La contraseña debe tener al menos 8 caracteres.').max(72);
export const signInSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, 'Ingresa tu contraseña.'),
  next: z.string().optional()
});

export const signUpSchema = z.object({
  name: z.string().trim().min(2, 'Ingresa tu nombre.').max(120),
  email: emailSchema,
  password: passwordSchema
});

export const resetPasswordSchema = z.object({
  email: emailSchema
});

export const updatePasswordSchema = z.object({
  password: passwordSchema,
  confirmation: z.string()
}).refine((values) => values.password === values.confirmation, {
  message: 'Las contraseñas no coinciden.',
  path: ['confirmation']
});

export const purchaseSchema = z.object({
  productId: z.string().uuid('Producto inválido.')
});

export const profileSchema = z.object({
  displayName: z.string().trim().min(2, 'Ingresa un nombre válido.').max(120)
});

export const rechargeSchema = z.object({
  amount: z.coerce.number().positive('El monto debe ser mayor a cero.').max(100000, 'El monto es demasiado grande.'),
  bank: z.string().trim().min(2, 'Ingresa el banco de origen.').max(120),
  reference: z.string().trim().max(120, 'La referencia es demasiado larga.')
});

export const vendorProductSchema = z.object({ productId: z.string().uuid() });
export const vendorInventorySchema = z.object({
  productId: z.string().uuid(),
  rawAccounts: z.string().min(1, 'Pega al menos una cuenta.')
});
export const rejectRechargeSchema = z.object({
  rechargeId: z.string().uuid(),
  note: z.string().trim().min(3, 'Escribe un motivo.').max(500)
});
export const balanceAdjustmentSchema = z.object({
  userId: z.string().uuid(),
  credits: z.coerce.number().refine((value) => value !== 0, 'El ajuste no puede ser cero.'),
  note: z.string().trim().min(3).max(500)
});
export const storeConfigSchema = z.object({
  storeName: z.string().trim().min(2).max(120),
  primaryColor: z.string().regex(/^#[0-9a-f]{6}$/i),
  logoUrl: z.string().url().or(z.literal('')),
  bank: z.string().trim().max(120),
  clabe: z.string().trim().max(30),
  accountHolder: z.string().trim().max(120),
  rechargeInstructions: z.string().trim().max(2000)
});
export const onboardingSchema = z.object({
  commercialName: z.string().trim().min(2).max(120),
  desiredSlug: z.string().trim().toLowerCase().regex(/^[a-z0-9-]+$/).max(63),
  email: z.string().email().max(254),
  whatsapp: z.string().trim().max(40),
  services: z.string().trim().max(500)
});

export type SignInInput = z.infer<typeof signInSchema>;
export type SignUpInput = z.infer<typeof signUpSchema>;
