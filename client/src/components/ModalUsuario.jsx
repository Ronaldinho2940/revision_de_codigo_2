import React, { useState, useEffect } from 'react';
import { X, Save, UserPlus, AlertCircle } from 'lucide-react';

const ModalUsuario = ({ isOpen, onClose, onSave, usuariosExistentes }) => {
  // Lista Oficial de Almacenes (Deben coincidir exactamente con los de la BD)
  const ALMACENES = [
    'Administración',
    'Marketing',
    'Seguridad y Mantenimiento',
    'Eventos'
  ];

  // Estado del formulario
  const [formData, setFormData] = useState({
    nombre: '',
    email: '',
    password: '',
    rol: '' // Empezamos vacío para obligar a elegir
  });

  // Estado para las opciones disponibles
  const [rolesDisponibles, setRolesDisponibles] = useState([]);

  // CADA VEZ QUE SE ABRE EL MODAL: Calculamos qué puestos están libres
  useEffect(() => {
    if (isOpen && usuariosExistentes) {
      // 1. Ver quiénes ya tienen puesto (excluyendo Admins, que pueden ser infinitos)
      const rolesOcupados = usuariosExistentes
        .map(u => u.rol)
        .filter(rol => rol !== 'Admin'); // Admin no cuenta para el límite

      // 2. Filtrar almacenes disponibles
      const almacenesLibres = ALMACENES.filter(almacen => !rolesOcupados.includes(almacen));

      // 3. La lista final siempre incluye 'Admin' + lo que quede libre
      setRolesDisponibles(['Admin', ...almacenesLibres]);
      
      // Resetear rol seleccionado
      setFormData(prev => ({ ...prev, rol: '' }));
    }
  }, [isOpen, usuariosExistentes]);

  if (!isOpen) return null;

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.rol) return alert("Por favor selecciona un rol.");

    try {
      const res = await fetch('/api/usuarios', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      if (res.ok) {
        alert('Usuario registrado correctamente');
        onSave();
        onClose();
        setFormData({ nombre: '', email: '', password: '', rol: '' });
      } else {
        alert('Error: Puede que el correo ya esté registrado');
      }
    } catch (error) {
      console.error(error);
      alert('Error de conexión');
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden">
        <div className="bg-indigo-600 p-4 flex justify-between items-center text-white">
          <div className="flex items-center gap-2">
            <UserPlus size={20} />
            <h3 className="font-bold text-lg">Nuevo Usuario</h3>
          </div>
          <button onClick={onClose} className="hover:bg-white/20 p-1 rounded"><X size={20} /></button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="bg-blue-50 p-3 rounded-lg border border-blue-100 text-sm text-blue-800 flex gap-2">
            <AlertCircle size={16} className="mt-0.5 shrink-0" />
            <p>Solo aparecerán los roles/almacenes que aún no tienen un encargado asignado.</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nombre Completo</label>
            <input name="nombre" required onChange={handleChange} value={formData.nombre} className="w-full p-2 border rounded focus:ring-2 focus:ring-indigo-500 outline-none" placeholder="Ej: Juan Pérez" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Correo Electrónico</label>
            <input name="email" type="email" required onChange={handleChange} value={formData.email} className="w-full p-2 border rounded focus:ring-2 focus:ring-indigo-500 outline-none" placeholder="juan@lomasanta.com" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Contraseña</label>
            <input name="password" type="password" required onChange={handleChange} value={formData.password} className="w-full p-2 border rounded focus:ring-2 focus:ring-indigo-500 outline-none" placeholder="******" />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Asignar Rol / Almacén</label>
            <select 
              name="rol" 
              required 
              onChange={handleChange} 
              value={formData.rol}
              className="w-full p-2 border rounded bg-white outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="" disabled>-- Selecciona un puesto disponible --</option>
              {rolesDisponibles.map(rol => (
                <option key={rol} value={rol}>
                  {rol === 'Admin' ? '🛡️ Administrador General (Acceso Total)' : `📦 Encargado: ${rol}`}
                </option>
              ))}
            </select>
            {rolesDisponibles.length === 1 && (
              <p className="text-xs text-red-500 mt-1">¡Todos los almacenes ya tienen encargado!</p>
            )}
          </div>

          <button type="submit" className="w-full py-2 bg-indigo-600 text-white rounded font-bold hover:bg-indigo-700 flex justify-center gap-2 shadow-sm transition-colors">
            <Save size={18} /> Guardar Usuario
          </button>
        </form>
      </div>
    </div>
  );
};

export default ModalUsuario;