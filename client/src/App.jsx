import React, { useState, useEffect } from 'react';

import Navbar from './components/Navbar';
import Sidebar from './components/Sidebar';

import Dashboard from './pages/Dashboard';
import Almacenes from './pages/Almacenes';
import Reportes from './pages/Reportes';
import Usuarios from './pages/Usuarios';
import Login from './pages/Login';

function App() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [activePage, setActivePage] = useState('dashboard');
  
  const [user, setUser] = useState(() => {
    const usuarioGuardado = localStorage.getItem('usuario_loma_santa');
    return usuarioGuardado ? JSON.parse(usuarioGuardado) : null;
  });

  const handleLogout = () => {
    localStorage.removeItem('usuario_loma_santa');
    setUser(null);
    setActivePage('dashboard'); 
  };

  // --- 🔒 GUARDIÁN DE SESIÓN ÚNICA (VERSIÓN ANTI-CACHÉ) ---
  useEffect(() => {
    if (!user) return;

    const verificarSesion = async () => {
      try {
        // TRUCO: Agregamos ?t=TIMESTAMP para que el celular no guarde caché
        // Esto obliga a consultar al servidor siempre.
        const tiempoActual = Date.now();
        const response = await fetch(`/api/verificar-sesion?t=${tiempoActual}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: user.id, session_id: user.session_id })
        });
        
        const data = await response.json();

        if (data.valid === false) {
          // Usamos confirm en lugar de alert para que detenga la ejecución visualmente
          alert("⚠️ SEGURIDAD: Se ha iniciado sesión en otro dispositivo. Tu sesión se cerrará.");
          handleLogout(); 
        }
      } catch (error) {
        console.error("Error red sesión:", error);
      }
    };

    // Ejecutar inmediatamente al cargar y luego cada 5 seg
    verificarSesion();
    const intervalo = setInterval(verificarSesion, 5000);
    return () => clearInterval(intervalo);
  }, [user]); 

  if (!user) {
    return <Login onLogin={(datosUsuario) => setUser(datosUsuario)} />;
  }

  const renderPage = () => {
    switch (activePage) {
      case 'dashboard': 
        return <Dashboard user={user} />;
      
      case 'almacenes': 
        return <Almacenes user={user} />;
      
      case 'reportes': 
        if (['Admin', 'Gerente'].includes(user.rol)) return <Reportes />;
        return <div className="p-10 text-center text-red-500 font-bold bg-white rounded-lg shadow">⛔ Acceso Denegado: Solo Gerencia General</div>;
      
      case 'usuarios': 
        if (user.rol === 'Admin') return <Usuarios />;
        return <div className="p-10 text-center text-red-500 font-bold bg-white rounded-lg shadow">⛔ Acceso Denegado: Solo Administradores</div>;
      
      default: return <Dashboard user={user} />;
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-gray-900">
      <Sidebar 
        isOpen={isSidebarOpen} 
        activePage={activePage} 
        setActivePage={setActivePage}
        onLogout={handleLogout}
        user={user}
        toggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
      />
      <div className="lg:ml-64 min-h-screen flex flex-col transition-all duration-300">
        <Navbar user={user} toggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)} />
        <main className="flex-1 p-6 mt-16">
          {renderPage()}
        </main>
      </div>
    </div>
  );
}

export default App;