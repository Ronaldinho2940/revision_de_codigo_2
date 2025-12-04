import React, { useState, useEffect } from 'react';
import { FileText, ArrowDownCircle, ArrowUpCircle, RefreshCcw, WifiOff, Download, Printer } from 'lucide-react';

const Reportes = () => {
  const [movimientos, setMovimientos] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);

  const cargarDatos = () => {
    setCargando(true);
    setError(null);
    
    // ⚠️ RUTA RELATIVA PARA QUE FUNCIONE EN EL CELULAR
    fetch('/api/movimientos')
      .then(res => {
        if (!res.ok) throw new Error("Error de conexión con el servidor");
        return res.json();
      })
      .then(data => {
        setMovimientos(data.data || []);
        setCargando(false);
      })
      .catch(err => {
        console.error("Error:", err);
        setError("Error al cargar datos. Verifica tu conexión.");
        setCargando(false);
      });
  };

  useEffect(() => {
    cargarDatos();
  }, []);

  const formatearFecha = (fechaString) => {
    if (!fechaString) return "-";
    const fecha = new Date(fechaString);
    return fecha.toLocaleString();
  };

  const exportarExcel = () => {
    if (movimientos.length === 0) return alert("No hay datos");
    const encabezados = ["ID,Fecha,Tipo,Producto,Código,Cantidad"];
    const filas = movimientos.map(m => {
      const fecha = new Date(m.fecha).toLocaleString().replace(',', '');
      const prod = m.producto.replace(',', ' ');
      return `${m.id},${fecha},${m.tipo},${prod},${m.codigo},${m.cantidad}`;
    });
    const csvContent = [encabezados, ...filas].join("\n");
    const blob = new Blob(["\uFEFF" + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", "reporte_movimientos.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const imprimirReporte = () => {
    const contenidoTabla = document.getElementById('tabla-imprimible').outerHTML;
    const ventana = window.open('', '', 'height=600,width=800');
    ventana.document.write('<html><head><title>Reporte</title><style>table{width:100%;border-collapse:collapse}th,td{border:1px solid #ddd;padding:8px}</style></head><body>');
    ventana.document.write(contenidoTabla);
    ventana.document.write('</body></html>');
    ventana.document.close();
    ventana.print();
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div><h1 className="text-2xl font-bold text-gray-900">Reporte de Movimientos</h1><p className="text-gray-500">Historial completo</p></div>
        <div className="flex gap-2">
          <button onClick={exportarExcel} className="p-2 bg-green-600 text-white rounded-lg"><Download size={18} /></button>
          <button onClick={imprimirReporte} className="p-2 bg-gray-700 text-white rounded-lg"><Printer size={18} /></button>
          <button onClick={cargarDatos} className="p-2 bg-blue-50 text-blue-600 rounded-lg"><RefreshCcw size={18} /></button>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        {cargando ? <div className="p-12 text-center text-gray-500">Cargando...</div> : error ? (
          <div className="p-8 text-center text-red-500 bg-red-50 rounded-xl"><WifiOff size={48} className="mx-auto mb-3 opacity-50" /><p>{error}</p></div>
        ) : (
          // ⚠️ AQUÍ ESTÁ LA CAJA CON RUEDAS (SCROLL)
          <div id="tabla-imprimible" className="overflow-x-auto">
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead className="bg-gray-50 text-gray-600 font-medium border-b border-gray-100">
                <tr><th className="px-6 py-4">Fecha</th><th className="px-6 py-4">Tipo</th><th className="px-6 py-4">Producto</th><th className="px-6 py-4 text-center">Cant.</th></tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {movimientos.length > 0 ? movimientos.map((m) => (
                  <tr key={m.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-gray-500 text-xs">{formatearFecha(m.fecha)}</td>
                    <td className="px-6 py-4"><span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold ${m.tipo === 'ENTRADA' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>{m.tipo === 'ENTRADA' ? <ArrowDownCircle size={14} /> : <ArrowUpCircle size={14} />}{m.tipo}</span></td>
                    <td className="px-6 py-4"><div className="font-medium text-gray-900">{m.producto}</div><div className="text-xs text-gray-400">{m.codigo}</div></td>
                    <td className="px-6 py-4 text-center font-bold text-gray-700">{m.cantidad}</td>
                  </tr>
                )) : <tr><td colSpan="4" className="px-6 py-12 text-center text-gray-400"><FileText size={48} className="mx-auto mb-2 text-gray-300" /><p>Sin registros.</p></td></tr>}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default Reportes;