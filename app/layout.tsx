import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Streamish',
  description: 'Tu tienda de cuentas digitales'
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  );
}
