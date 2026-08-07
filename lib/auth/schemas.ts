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

export type SignInInput = z.infer<typeof signInSchema>;
export type SignUpInput = z.infer<typeof signUpSchema>;
