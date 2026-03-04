import type { Metadata } from 'next';
import './globals.css';
import { SessionProvider } from './session-provider';

export const metadata: Metadata = {
  title: 'MealMate — Zero decisions. Pure flavour.',
  description: 'AI-powered daily meal planner for busy Indian professionals. Minimal effort, maximum flavour.',
  icons: { icon: 'data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22><text y=%22.9em%22 font-size=%2290%22>🍛</text></svg>' },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <SessionProvider>{children}</SessionProvider>
      </body>
    </html>
  );
}
