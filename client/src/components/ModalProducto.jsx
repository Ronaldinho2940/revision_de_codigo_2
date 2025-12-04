import React, { useState, useEffect } from 'react';
import { X, Save, Edit, Lock } from 'lucide-react';

const ModalProducto = ({ isOpen, onClose, onSave, productoAEditar, usuarioActual }) => {
  
  const esAdmin = ['Admin', 'Gerente'].includes(usuarioActual?.rol);
  const rolUsuario = usuarioActual?.rol;

  // Lógica para asignar almacén automático si no es Admin
  const getAlmacenIdPorRol = (rol) => {
    switch(rol) {
      case 'Administración': return '1';
      case 'Marketing': return '2';
      case 'Seguridad y Mantenimiento': return '3';
      case 'Eventos': return '4';
      default: return '1';
    }
  };

  const estadoInicial = {
    codigo: '',
    nombre: '',
    modelo: '',
    tipo: 'General',
    tamano: '',
    valor: '',
    id_almacen: esAdmin ? '1' : getAlmacenIdPorRol(rolUsuario), 
    estado: 'Disponible'
  };

  const [formData, setFormData] = useState(estadoInicial);

  useEffect(() => {
    if (productoAEditar) {
      setFormData({
        codigo: productoAEditar.codigo,
        nombre: productoAEditar.nombre,
        modelo: productoAEditar.modelo || '',
        tipo: productoAEditar.tipo || 'General',
        tamano: productoAEditar.tamano || '',
        valor: productoAEditar.valor,
        id_almacen: productoAEditar.id_almacen,
        estado: productoAEditar.estado
      });
    } else {
      setFormData({
        ...estadoInicial,
        id_almacen: esAdmin ? '1' : getAlmacenIdPorRol(rolUsuario)
      });
    }
  }, [productoAEditar, isOpen, usuarioActual]);

  if (!isOpen) return null;

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      // ⚠️ CORRECCIÓN VITAL: Usamos rutas relativas ("/api/...")
      // Si usas "http://localhost:3000", el celular fallará porque buscará en sí mismo.
      const url = productoAEditar 
        ? `/api/productos/${productoAEditar.id}`
        : '/api/productos';
      
      const metodo = productoAEditar ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method: metodo,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      const data = await response.json();

      if (response.ok) {
        alert(productoAEditar ? 'Actualizado correctamente' : 'Creado correctamente');
        onSave(); // Recargar la tabla de fondo
        onClose(); // Cerrar modal
        if (!productoAEditar) setFormData(estadoInicial); // Limpiar si era nuevo
      } else {
        alert(`Error: ${data.error}`);
      }
    } catch (error) {
      console.error(error);
      alert('Error de conexión con el servidor (Revisa que el Backend esté encendido)');
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Encabezado */}
        <div className={`${productoAEditar ? 'bg-orange-600' : 'bg-blue-600'} p-4 flex justify-between items-center text-white shrink-0`}>
          <div className="flex items-center gap-2">
            {productoAEditar ? <Edit size={20} /> : <Save size={20} />}
            <h3 className="font-bold text-lg">
              {productoAEditar ? 'Editar Producto' : 'Nuevo Producto'}
            </h3>
          </div>
          <button onClick={onClose} className="hover:bg-white/20 p-1 rounded"><X size={20} /></button>
        </div>

        {/* Formulario con Scroll si es muy largo en celular */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Código (SKU)</label>
              <input required name="codigo" value={formData.codigo} onChange={handleChange} className="w-full p-2 border rounded focus:ring-2 outline-none" placeholder="Ej: A-001" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Modelo</label>
              <input name="modelo" value={formData.modelo} onChange={handleChange} className="w-full p-2 border rounded focus:ring-2 outline-none" />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nombre</label>
            <input required name="nombre" value={formData.nombre} onChange={handleChange} className="w-full p-2 border rounded focus:ring-2 outline-none" />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-sm font-medium text-gray-700">Almacén</label>
                {!esAdmin && <Lock size={12} className="text-gray-400" />}
              </div>
              <select 
                name="id_almacen" 
                value={formData.id_almacen} 
                onChange={handleChange} 
                disabled={!esAdmin} 
                className={`w-full p-2 border rounded outline-none ${!esAdmin ? 'bg-gray-100 text-gray-500 cursor-not-allowed' : 'bg-white focus:ring-2'}`}
              >
                <option value="1">Administración</option>
                <option value="2">Marketing</option>
                <option value="3">Seguridad y Mantenimiento</option>
                <option value="4">Eventos</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Valor (S/.)</label>
              <input type="number" name="valor" value={formData.valor} onChange={handleChange} className="w-full p-2 border rounded focus:ring-2 outline-none" />
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Estado</label>
            <select name="estado" value={formData.estado} onChange={handleChange} className="w-full p-2 border rounded bg-white">
              <option value="Disponible">✅ Disponible</option>
              <option value="Averiado">⚠️ Averiado (Merma)</option>
              <option value="En Uso">🕒 En Uso</option>
            </select>
          </div>

          <div className="flex gap-3 pt-4 border-t shrink-0">
            <button type="button" onClick={onClose} className="flex-1 py-3 border rounded hover:bg-gray-50 font-medium">Cancelar</button>
            <button type="submit" className={`flex-1 py-3 text-white rounded font-bold ${productoAEditar ? 'bg-orange-600' : 'bg-blue-600'}`}>
              {productoAEditar ? 'Actualizar' : 'Guardar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ModalProducto;