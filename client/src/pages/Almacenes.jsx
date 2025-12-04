import React, { useState, useEffect, useRef } from 'react';
import { Plus, CheckCircle, AlertTriangle, PackageX, ArrowUpCircle, ArrowDownCircle, Edit, Clock, Search, Trash2, Lock, Download, Upload } from 'lucide-react';
import ModalProducto from '../components/ModalProducto';
import ModalMovimiento from '../components/ModalMovimiento';

const TextoResaltado = ({ texto, busqueda }) => {
  if (!busqueda || !texto) return <span>{texto}</span>;
  const partes = texto.toString().split(new RegExp(`(${busqueda})`, 'gi'));
  return (
    <span>
      {partes.map((parte, i) => 
        parte.toLowerCase() === busqueda.toLowerCase() ? <span key={i} className="bg-yellow-200 text-yellow-800 font-semibold px-0.5 rounded">{parte}</span> : parte
      )}
    </span>
  );
};

const Almacenes = ({ user }) => {
  const [productos, setProductos] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [busqueda, setBusqueda] = useState('');
  
  const fileInputRef = useRef(null);

  const [modalProductoAbierto, setModalProductoAbierto] = useState(false);
  const [modalMovimientoAbierto, setModalMovimientoAbierto] = useState(false);
  const [productoAEditar, setProductoAEditar] = useState(null);
  const [productoSeleccionado, setProductoSeleccionado] = useState(null);
  const [tipoMovimiento, setTipoMovimiento] = useState(null);

  const tienePermisoEdicion = ['Admin', 'Gerente', 'Marketing', 'Ventas'].includes(user?.rol);

  const cargarProductos = () => {
    setCargando(true);
    // ⚠️ RUTA RELATIVA (Vital para móvil)
    fetch('/api/productos')
      .then(response => response.json())
      .then(data => {
        setProductos(data.data);
        setCargando(false);
      })
      .catch(error => {
        console.error("Error:", error);
        setCargando(false);
      });
  };

  useEffect(() => {
    cargarProductos();
  }, []);

  const productosFiltrados = productos.filter(p => {
    const esAdmin = ['Admin', 'Gerente'].includes(user?.rol);
    const esSuAlmacen = p.nombre_almacen === user?.rol;
    if (!esAdmin && !esSuAlmacen) return false;

    return (
      p.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
      p.codigo.toLowerCase().includes(busqueda.toLowerCase()) ||
      (p.nombre_almacen && p.nombre_almacen.toLowerCase().includes(busqueda.toLowerCase()))
    );
  });

  const abrirCreacion = () => { setProductoAEditar(null); setModalProductoAbierto(true); };
  const abrirEdicion = (p) => { setProductoAEditar(p); setModalProductoAbierto(true); };
  const abrirMovimiento = (p, tipo) => { setProductoSeleccionado(p); setTipoMovimiento(tipo); setModalMovimientoAbierto(true); };

  const eliminarProducto = async (id, nombre) => {
    if (window.confirm(`⚠️ ¿Estás seguro de ELIMINAR "${nombre}"?`)) {
      try {
        const response = await fetch(`/api/productos/${id}`, { method: 'DELETE' });
        if (response.ok) { alert('Producto eliminado.'); cargarProductos(); }
        else { alert('Error al eliminar.'); }
      } catch (error) { console.error(error); }
    }
  };

  const exportarExcel = () => {
    if (productosFiltrados.length === 0) return alert("No hay datos para exportar");
    const encabezados = ["Código,Producto,Modelo,Tipo,Tamaño,Almacén,Estado,Precio,Stock"];
    const filas = productosFiltrados.map(p => {
      const nombre = `"${p.nombre}"`; 
      const almacen = p.nombre_almacen || 'General';
      return `${p.codigo},${nombre},${p.modelo},${p.tipo},${p.tamano},${almacen},${p.estado},${p.valor},${p.cantidad}`;
    });
    const csvContent = [encabezados, ...filas].join("\n");
    const blob = new Blob(["\uFEFF" + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `inventario_${new Date().toISOString().slice(0,10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleImportClick = () => { fileInputRef.current.click(); };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (evt) => {
      const text = evt.target.result;
      const lines = text.split('\n');
      const data = lines.slice(1).map(line => {
        const cols = line.split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/).map(c => c.trim().replace(/^"|"$/g, ''));
        if (cols.length < 2) return null;
        return {
          codigo: cols[0], nombre: cols[1], modelo: cols[2], tipo: cols[3], tamano: cols[4],
          almacen: cols[5], estado: cols[6], valor: parseFloat(cols[7]) || 0, cantidad: parseInt(cols[8]) || 0
        };
      }).filter(x => x !== null);

      if (data.length === 0) return alert("Archivo vacío");
      if (window.confirm(`¿Importar ${data.length} productos?`)) {
        setCargando(true);
        try {
          const response = await fetch('/api/productos/masivo', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
          });
          const result = await response.json();
          alert(result.message || 'Carga completada');
          cargarProductos();
        } catch (error) { console.error(error); alert('Error al subir'); setCargando(false); }
      }
      e.target.value = '';
    };
    reader.readAsText(file);
  };

  const tituloPagina = ['Admin', 'Gerente'].includes(user.rol) ? 'Gestión de Almacenes' : 'Mi Inventario';

  return (
    <div className="space-y-6">
      {tienePermisoEdicion && <ModalProducto isOpen={modalProductoAbierto} onClose={() => setModalProductoAbierto(false)} onSave={cargarProductos} productoAEditar={productoAEditar} usuarioActual={user} />}
      <ModalMovimiento isOpen={modalMovimientoAbierto} onClose={() => setModalMovimientoAbierto(false)} producto={productoSeleccionado} tipo={tipoMovimiento} onSave={cargarProductos} />
      <input type="file" accept=".csv" ref={fileInputRef} onChange={handleFileUpload} className="hidden" />

      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{tituloPagina}</h1>
          <p className="text-gray-500">Rol: <strong className="text-blue-600">{user?.rol}</strong></p>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input type="text" placeholder="Buscar..." className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 w-full" value={busqueda} onChange={(e) => setBusqueda(e.target.value)} />
          </div>
          <button onClick={exportarExcel} className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg flex items-center justify-center gap-2 shadow-sm"><Download size={20} /></button>
          {tienePermisoEdicion && <button onClick={handleImportClick} className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg flex items-center justify-center gap-2 shadow-sm"><Upload size={20} /></button>}
          {tienePermisoEdicion && <button onClick={abrirCreacion} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center justify-center gap-2 shadow-sm"><Plus size={20} /></button>}
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        {/* ⚠️ AQUÍ ESTÁ EL ARREGLO DE SCROLL HORIZONTAL (overflow-x-auto) */}
        <div className="overflow-x-auto"> 
          {cargando ? <div className="p-12 text-center text-gray-500">Cargando...</div> : 
            <table className="w-full text-left text-sm whitespace-nowrap"> {/* whitespace-nowrap evita que el texto se parta feo */}
              <thead className="bg-gray-50 text-gray-600 font-medium border-b border-gray-100">
                <tr><th className="px-6 py-4">Producto</th><th className="px-6 py-4">Almacén</th><th className="px-6 py-4">Estado</th><th className="px-6 py-4 text-right">Precio</th><th className="px-6 py-4 text-center">Stock</th><th className="px-6 py-4 text-center">Acciones</th></tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {productosFiltrados.map((p) => (
                  <tr key={p.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4"><div className="font-medium text-gray-900"><TextoResaltado texto={p.nombre} busqueda={busqueda} /></div><div className="text-xs text-gray-400 font-mono"><TextoResaltado texto={p.codigo} busqueda={busqueda} /></div></td>
                    <td className="px-6 py-4 text-gray-500"><TextoResaltado texto={p.nombre_almacen || 'General'} busqueda={busqueda} /></td>
                    <td className="px-6 py-4">{p.estado === 'Averiado' ? <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800"><AlertTriangle size={12}/> Averiado</span> : p.estado === 'En Uso' ? <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-800"><Clock size={12}/> En Uso</span> : <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800"><CheckCircle size={12}/> Disponible</span>}</td>
                    <td className="px-6 py-4 text-right">S/. {p.valor}</td>
                    <td className="px-6 py-4 text-center"><span className={`px-3 py-1 rounded-full font-bold text-sm ${p.cantidad > 0 ? 'bg-blue-50 text-blue-700' : 'bg-red-50 text-red-700'}`}>{p.cantidad}</span></td>
                    <td className="px-6 py-4 text-center flex justify-center gap-2">
                      {tienePermisoEdicion ? <><button onClick={() => abrirEdicion(p)} className="p-2 text-orange-600 hover:bg-orange-50 rounded-lg"><Edit size={18} /></button><button onClick={() => eliminarProducto(p.id, p.nombre)} className="p-2 text-red-600 hover:bg-red-50 rounded-lg"><Trash2 size={18} /></button><div className="w-px h-6 bg-gray-300 mx-1"></div></> : <div className="mr-2 text-gray-300"><Lock size={16} /></div>}
                      <button onClick={() => abrirMovimiento(p, 'ENTRADA')} className="p-2 text-green-600 hover:bg-green-50 rounded-lg"><ArrowDownCircle size={20} /></button>
                      <button onClick={() => abrirMovimiento(p, 'SALIDA')} className="p-2 text-red-600 hover:bg-red-50 rounded-lg"><ArrowUpCircle size={20} /></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          }
        </div>
      </div>
    </div>
  );
};

export default Almacenes;