import React, { useState } from 'react';
import { X, ArrowDownCircle, ArrowUpCircle, Save } from 'lucide-react';

const ModalMovimiento = ({ isOpen, onClose, producto, tipo, onSave }) => {
  const [cantidad, setCantidad] = useState('');

  if (!isOpen || !producto) return null;

  const esEntrada = tipo === 'ENTRADA';
  
  // CORRECCIÓN: Definimos las clases completas explícitamente para que Tailwind las detecte
  const textoTitulo = esEntrada ? 'Registrar Entrada' : 'Registrar Salida';
  const IconoTitulo = esEntrada ? ArrowDownCircle : ArrowUpCircle;
  
  // Colores de fondo para el encabezado
  const headerClass = esEntrada ? 'bg-green-600' : 'bg-red-600';
  
  // Colores para el borde del input
  const inputBorderClass = esEntrada 
    ? 'border-green-100 focus:ring-green-500 focus:border-green-500' 
    : 'border-red-100 focus:ring-red-500 focus:border-red-500';

  // Colores para el botón de confirmar
  const buttonClass = esEntrada
    ? 'bg-green-600 hover:bg-green-700'
    : 'bg-red-600 hover:bg-red-700';

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!cantidad || cantidad <= 0) return alert("Ingresa una cantidad válida");

    try {
      const response = await fetch('/api/movimientos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id_producto: producto.id,
          tipo: tipo,
          cantidad: parseInt(cantidad)
        })
      });

      const data = await response.json();

      if (response.ok) {
        alert(`¡${esEntrada ? 'Entrada' : 'Salida'} registrada con éxito!`);
        onSave(); 
        onClose(); 
        setCantidad(''); 
      } else {
        alert(`Error: ${data.error}`);
      }
    } catch (error) {
      console.error(error);
      alert('Error de conexión con el servidor');
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden transform transition-all">
        {/* Encabezado con color explícito */}
        <div className={`${headerClass} p-4 flex justify-between items-center text-white`}>
          <div className="flex items-center gap-2">
            <IconoTitulo size={24} />
            <h3 className="font-bold text-lg">{textoTitulo}</h3>
          </div>
          <button onClick={onClose} className="hover:bg-white/20 p-1 rounded"><X size={20} /></button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="bg-gray-50 p-3 rounded-lg border border-gray-200">
            <p className="text-sm text-gray-500">Producto seleccionado:</p>
            <p className="font-bold text-gray-800 text-lg">{producto.nombre}</p>
            <p className="text-xs text-gray-400">Código: {producto.codigo} | Stock Actual: {producto.cantidad}</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Cantidad a {esEntrada ? 'ingresar' : 'retirar'}
            </label>
            {/* Input con borde explícito */}
            <input 
              type="number" 
              min="1"
              autoFocus
              value={cantidad} 
              onChange={(e) => setCantidad(e.target.value)} 
              placeholder="0" 
              className={`w-full p-3 border-2 rounded-lg focus:ring-2 outline-none text-xl font-bold text-center ${inputBorderClass}`} 
            />
          </div>

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 py-2 border border-gray-300 rounded text-gray-600 hover:bg-gray-50 font-medium">
              Cancelar
            </button>
            {/* Botón con fondo explícito */}
            <button 
              type="submit" 
              className={`flex-1 py-2 text-white rounded font-bold flex items-center justify-center gap-2 transition-colors ${buttonClass}`}
            >
              <Save size={18} />
              Confirmar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ModalMovimiento;