import { themes, themeStylesheet } from '@app-fit/shared/theme';
import type { Metadata } from 'next';
import { Barlow_Condensed, Inter } from 'next/font/google';

import { t } from '@/lib/i18n';

import './globals.css';

const display = Barlow_Condensed({
  variable: '--font-display',
  weight: ['600', '700'],
  subsets: ['latin'],
});

const sans = Inter({
  variable: '--font-sans',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: t.web.title,
  description: t.web.tagline,
};

// Theme variables generated from docs/design-tokens.json (dark by default).
const themeCss = themeStylesheet(themes);

export default function RootLayout({ children }: LayoutProps<'/'>) {
  return (
    <html lang="es" className={`${display.variable} ${sans.variable}`}>
      <head>
        <style dangerouslySetInnerHTML={{ __html: themeCss }} />
      </head>
      <body>{children}</body>
    </html>
  );
}
