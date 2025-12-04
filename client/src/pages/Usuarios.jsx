import React, { useState, useEffect } from 'react';
import { Users, UserPlus, Shield, UserCheck, Trash2 } from 'lucide-react';
import ModalUsuario from '../components/ModalUsuario';

const Usuarios = () => {
  const [usuarios, setUsuarios] = useState([]);
  const [modalAbierto, setModalAbierto] = useState(false);

  const cargarUsuarios = () => {
    // ⚠️ RUTA RELATIVA
    fetch('/api/usuarios')
      .then(res => res.json())
      .then(data => setUsuarios(data.data || []))
      .catch(err => console.error(err));
  };

  useEffect(() => {
    cargarUsuarios();
  }, []);

  const eliminarUsuario = async (id, nombre) => {
    if (!window.confirm(`¿Eliminar acceso a "${nombre}"?`)) return;
    const codigoIngresado = window.prompt("🔒 Clave Maestra:");
    if (!codigoIngresado) return;

    try {
      const response = await fetch(`/api/usuarios/${id}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ adminCode: codigoIngresado })
      });
      const data = await response.json();
      if (response.ok) { alert("Usuario eliminado."); cargarUsuarios(); }
      else { alert(data.error); }
    } catch (error) { console.error(error); alert("Error de conexión"); }
  };

  return (
    <div className="space-y-6">
      <ModalUsuario isOpen={modalAbierto} onClose={() => setModalAbierto(false)} onSave={cargarUsuarios} usuariosExistentes={usuarios} />
      
      <div className="flex justify-between items-center">
        <div><h1 className="text-2xl font-bold text-gray-900">Gestión de Usuarios</h1><p className="text-gray-500">Control de accesos</p></div>
        <button onClick={() => setModalAbierto(true)} className="bg-indigo-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 shadow-sm"><UserPlus size={20} /><span>Nuevo</span></button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        {/* ⚠️ CAJA CON RUEDAS (SCROLL) */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-gray-50 text-gray-600 font-medium border-b border-gray-100">
              <tr><th className="px-6 py-4">Nombre</th><th className="px-6 py-4">Email</th><th className="px-6 py-4">Rol</th><th className="px-6 py-4 text-center">Estado</th><th className="px-6 py-4 text-center">Acciones</th></tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {usuarios.map((u) => (
                <tr key={u.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 font-bold text-gray-900 flex items-center gap-2"><div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center font-bold text-xs">{u.nombre.charAt(0)}</div>{u.nombre}</td>
                  <td className="px-6 py-4 text-gray-500">{u.email}</td>
                  <td className="px-6 py-4"><span className={`inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium border ${u.rol === 'Admin' ? 'bg-purple-100 text-purple-700 border-purple-200' : 'bg-gray-100 text-gray-700 border-gray-200'}`}><Shield size={12} /> {u.rol}</span></td>
                  <td className="px-6 py-4 text-center"><span className="text-green-600 text-xs font-bold bg-green-50 px-2 py-1 rounded-full flex items-center justify-center gap-1"><UserCheck size={12} /> Activo</span></td>
                  <td className="px-6 py-4 text-center">
                    {u.id !== 1 && <button onClick={() => eliminarUsuario(u.id, u.nombre)} className="p-2 text-red-500 hover:bg-red-50 rounded-lg"><Trash2 size={18} /></button>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Usuarios;