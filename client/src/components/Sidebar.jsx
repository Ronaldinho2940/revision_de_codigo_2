import React from 'react';
import { LayoutDashboard, Package, FileText, Users, LogOut, Shield, ClipboardList, X } from 'lucide-react';

const Sidebar = ({ activePage, setActivePage, isOpen, onLogout, user, toggleSidebar }) => {
  
  const TODOS_LOS_ROLES = [
    'Admin', 
    'Administración', 
    'Marketing', 
    'Seguridad y Mantenimiento', 
    'Eventos'
  ];

  const esJefeArea = user && !['Admin', 'Gerente'].includes(user.rol);
  const labelInventario = esJefeArea ? 'Mi Inventario' : 'Almacenes';
  const IconoInventario = esJefeArea ? ClipboardList : Package;

  const menuItems = [
    { 
      id: 'dashboard', 
      icon: LayoutDashboard, 
      label: 'Dashboard', 
      roles: TODOS_LOS_ROLES 
    },
    { 
      id: 'almacenes', 
      icon: IconoInventario, 
      label: labelInventario,
      roles: TODOS_LOS_ROLES 
    },
    { 
      id: 'reportes', 
      icon: FileText, 
      label: 'Reportes', 
      roles: ['Admin', 'Gerente'] 
    },
    { 
      id: 'usuarios', 
      icon: Users, 
      label: 'Usuarios', 
      roles: ['Admin'] 
    },
  ];

  const allowedMenuItems = menuItems.filter(item => 
    user && item.roles.includes(user.rol)
  );

  // Función para cambiar de página Y cerrar el menú (ideal para móviles)
  const handleNavigation = (id) => {
    setActivePage(id);
    // Si la pantalla es pequeña (móvil), cerramos el menú al hacer clic
    if (window.innerWidth < 1024 && toggleSidebar) {
      toggleSidebar();
    }
  };

  return (
    <>
      {/* FONDO OSCURO (OVERLAY) PARA MÓVILES */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-10 lg:hidden"
          onClick={toggleSidebar} // Cierra si haces clic fuera
        ></div>
      )}

      <aside className={`fixed top-0 left-0 z-20 h-screen w-64 bg-slate-900 text-white transition-transform duration-300 ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}>
        <div className="h-16 flex items-center justify-between px-6 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="bg-blue-600 p-1.5 rounded-lg">
              <Shield size={20} className="text-white" />
            </div>
            <span className="text-lg font-bold tracking-wide">LOMA SANTA</span>
          </div>
          {/* BOTÓN X PARA CERRAR EN MÓVIL */}
          <button onClick={toggleSidebar} className="lg:hidden text-slate-400 hover:text-white">
            <X size={24} />
          </button>
        </div>
        
        <div className="p-4 mb-2 border-b border-slate-800">
          <p className="text-xs text-slate-400 uppercase font-semibold mb-1">Conectado como:</p>
          <p className="text-sm font-bold text-white truncate" title={user ? user.nombre : ''}>
            {user ? user.nombre : 'Usuario'}
          </p>
          <p className="text-xs text-blue-400 font-medium truncate">
            {user ? user.rol : 'Invitado'}
          </p>
        </div>

        <nav className="p-4 space-y-2">
          {allowedMenuItems.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                onClick={() => handleNavigation(item.id)} // Usamos la nueva función
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                  activePage === item.id 
                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/50' 
                    : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                }`}
              >
                <Icon size={20} />
                <span className="font-medium">{item.label}</span>
              </button>
            );
          })}
        </nav>

        <div className="absolute bottom-0 w-full p-4 border-t border-slate-800">
          <button 
            onClick={onLogout}
            className="w-full flex items-center gap-3 px-4 py-3 text-red-400 hover:bg-slate-800 rounded-lg transition-colors group"
          >
            <LogOut size={20} className="group-hover:text-red-300" />
            <span className="font-medium group-hover:text-red-300">Cerrar Sesión</span>
          </button>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;