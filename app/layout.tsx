// app/layout.tsx
import './globals.css';
import { GoalProvider } from './context/GoalContext';
import { LogProvider } from './context/LogContext';
import { AchievementProvider } from './context/AchievementContext';
import { ToastProvider } from './context/ToastContext';
import { PrestigeProvider } from './context/PrestigeContext';
import Header from './components/Header';

export const metadata = {
  title: 'Pushup Counter',
  description: 'Track your daily pushups and see your stats!',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-gray-100">
        <ToastProvider>
          <GoalProvider>
            <LogProvider>
              <PrestigeProvider>
                <AchievementProvider>
                  <Header />
                  <main className="container mx-auto px-4 py-8">{children}</main>
                </AchievementProvider>
              </PrestigeProvider>
            </LogProvider>
          </GoalProvider>
        </ToastProvider>
      </body>
    </html>
  );
}
