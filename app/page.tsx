'use client';

import { SSHManager } from "@/components/ssh-manager"
import { AuthModal } from "@/components/auth-modal"
import { useAuth } from "@/contexts/auth-context"

export default function Home() {
  const { isAuthenticated, isLoading } = useAuth();

  // Mostrar loading mientras verificamos autenticación
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="text-muted-foreground">Loading SSH Manager...</p>
        </div>
      </div>
    );
  }

  // Si no está autenticado, mostrar modal de login
  if (!isAuthenticated) {
    return <AuthModal />;
  }

  // Si está autenticado, mostrar la aplicación principal
  return <SSHManager />;
}
