import { Space_Grotesk, Playfair_Display } from 'next/font/google';
import EmailModalProvider from '../contexts/EmailModalContext';
import './globals.css';

const spaceGrotesk = Space_Grotesk({ subsets: ['latin'] });
const playfairDisplay = Playfair_Display({ 
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800', '900'],
  variable: '--font-playfair',
});

export const metadata = {
  title: 'Asteris',
  description: 'Automation platform for your workflow',
  icons: {
    icon: '/favicon.ico',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <head>
        <link rel="canonical" href="https://asteris.ai" />
      </head>
      <body className={`${spaceGrotesk.className} ${playfairDisplay.variable}`}>
        <EmailModalProvider>
          {children}
        </EmailModalProvider>
      </body>
    </html>
  );
}
