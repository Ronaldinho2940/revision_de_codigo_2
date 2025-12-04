import React from 'react';
import { Menu } from 'lucide-react'; // Quitamos 'Search' también

const Navbar = ({ user, toggleSidebar }) => {
  // Si no hay usuario cargado aún, mostramos datos genéricos para que no falle
  const safeUser = user || { nombre: 'Usuario', rol: 'Invitado' };

  return (
    <header className="bg-white shadow-sm h-16 flex items-center justify-between px-6 fixed top-0 right-0 left-0 z-10 lg:left-64 transition-all duration-300">
      <div className="flex items-center gap-4">
        {/* Botón para abrir el menú en móviles */}
        <button onClick={toggleSidebar} className="lg:hidden p-2 hover:bg-gray-100 rounded-lg text-gray-600">
          <Menu size={24} />
        </button>
        <h2 className="text-xl font-semibold text-gray-800 hidden sm:block">Panel de Control</h2>
      </div>
      
      <div className="flex items-center gap-4">
        {/* SECCIÓN PERFIL DEL USUARIO */}
        <div className="flex items-center gap-3 pl-4 border-l">
          <div className="text-right hidden sm:block">
            <p className="text-sm font-medium text-gray-900">{safeUser.nombre}</p>
            <p className="text-xs text-gray-500">{safeUser.rol}</p>
          </div>
          <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-bold">
            {safeUser.nombre ? safeUser.nombre.charAt(0) : 'U'}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Navbar;