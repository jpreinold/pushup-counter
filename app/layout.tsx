import "./globals.css";
import { GoalProvider } from "./context/GoalContext";
import { LogProvider } from "./context/LogContext";
import { AchievementProvider } from "./context/AchievementContext";
import { ToastProvider } from "./context/ToastContext";
import { PrestigeProvider } from "./context/PrestigeContext";
import { AuthProvider } from "./context/AuthContext";
import Header from "./components/Header";
import { Toaster } from 'react-hot-toast';

export const metadata = {
  title: "Pushup Pal",
  description: "Track your daily pushups and see your stats!",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-gray-100">
        <AuthProvider>
          <ToastProvider>
            <GoalProvider>
              <LogProvider>
                <PrestigeProvider>
                  <AchievementProvider>
                    <Header />
                    {/* Added pt-20 to push content below the fixed header */}
                    <main className="container mx-auto px-4 pt-20 pb-8">
                      {children}
                    </main>
                  </AchievementProvider>
                </PrestigeProvider>
              </LogProvider>
            </GoalProvider>
          </ToastProvider>
          <Toaster 
            position="top-right" 
            reverseOrder={false} 
            gutter={8}
            toastOptions={{
              duration: 3000,
              style: {
                borderRadius: '6px',
                padding: '12px 16px',
              },
              // Custom styling
              success: {
                style: {
                  background: '#3b82f6',
                  color: 'white',
                },
              },
              error: {
                style: {
                  background: '#ef4444',
                  color: 'white',
                },
                // Remove close button for error toasts
                icon: null,
              },
              // Custom animations
              className: 'toast-animation',
            }}
          />
        </AuthProvider>
      </body>
    </html>
  );
}
