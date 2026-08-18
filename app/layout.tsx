// app/layout.tsx
import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: '30 Express | Alimentos Saudáveis & Naturais',
  description: 'Mercado 30 em sua casa: Carnes, Frutas, Verduras, Legumes e Alimentos Naturais e Frescos com entrega rápida em Luanda.',
  icons: {
    icon: '/logo-icon.png',
    shortcut: '/logo-icon.png',
    apple: '/logo-icon.png',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-AO" className="scroll-smooth">
      <head>
        <link rel="icon" href="/logo-icon.png" />
      </head>
      <body className="antialiased selection:bg-[#52b788]/30 selection:text-[#1b4332]">
        {children}
      </body>
    </html>
  );
}