import React, { useState, useEffect } from 'react';
import { Package, ArrowDownCircle, AlertTriangle, ShieldAlert, TrendingUp, PieChart, UserCheck, Clock } from 'lucide-react';

const Dashboard = ({ user }) => {
  const [stats, setStats] = useState({ totalItems: 0, totalValor: 0, lowStock: 0, averiados: 0 });
  const [porAlmacen, setPorAlmacen] = useState([]);
  const [accesos, setAccesos] = useState([]);
  const [cargando, setCargando] = useState(true);

  const esAdmin = ['Admin', 'Gerente'].includes(user?.rol);
  const tituloDashboard = esAdmin ? 'Resumen Global' : `Área: ${user?.rol}`;

  useEffect(() => {
    // 1. CARGAR PRODUCTOS Y ESTADÍSTICAS
    fetch('/api/productos')
      .then(res => res.json())
      .then(data => {
        let lista = data.data || [];
        if (!esAdmin) lista = lista.filter(p => p.nombre_almacen === user.rol);
        
        const totalItems = lista.reduce((acc, p) => acc + Number(p.cantidad || 0), 0);
        const totalValor = lista.reduce((acc, p) => acc + (Number(p.cantidad||0) * Number(p.valor||0)), 0);
        const lowStock = lista.filter(p => Number(p.cantidad||0) < 5 && p.estado === 'Disponible').length;
        const averiados = lista.filter(p => p.estado !== 'Disponible').length;

        setStats({ totalItems, totalValor, lowStock, averiados });

        const agrupado = lista.reduce((acc, p) => {
          const nombre = p.nombre_almacen || 'General';
          if (!acc[nombre]) acc[nombre] = 0;
          acc[nombre] += Number(p.cantidad || 0);
          return acc;
        }, {});

        const listaAlmacenes = Object.keys(agrupado).map(nombre => ({
          name: nombre,
          count: agrupado[nombre],
          percentage: totalItems > 0 ? (agrupado[nombre] / totalItems) * 100 : 0
        }));

        setPorAlmacen(listaAlmacenes);
        setCargando(false);
      })
      .catch(err => console.error("Error Dashboard:", err));

    // 2. CARGAR BITÁCORA DE ACCESOS
    if (esAdmin) {
      fetch('/api/accesos')
        .then(res => res.json())
        .then(data => setAccesos(data.data || []))
        .catch(err => console.error("Error Accesos:", err));
    }

  }, [user, esAdmin]);

  const getColor = (index) => ['bg-blue-600', 'bg-purple-600', 'bg-orange-500', 'bg-teal-500'][index % 4];

  // --- CORRECCIÓN DE HORA ---
  const formatearFecha = (f) => {
    if (!f) return "-";
    const fecha = new Date(f);
    
    // Si la fecha viene en UTC desde SQLite (ej: "2023-11-29 10:00:00"), 
    // a veces hay que "avisarle" al navegador que es UTC agregando 'Z' al final
    // para que la conversión a local funcione bien.
    if (typeof f === 'string' && !f.endsWith('Z')) {
       // Intentamos forzar la interpretación correcta
       // Nota: Esto depende de cómo SQLite guarde el timestamp.
       // Si SQLite guarda "YYYY-MM-DD HH:MM:SS", esto lo hace compatible con Date()
       const fechaUTC = new Date(f.replace(' ', 'T') + 'Z'); 
       if (!isNaN(fechaUTC.getTime())) {
         return fechaUTC.toLocaleString('es-PE', { 
           hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit', hour12: true 
         });
       }
    }

    return fecha.toLocaleString('es-PE', { 
      hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit', hour12: true 
    });
  };

  return (
    <div className="space-y-6 pb-20"> 
      <div className="flex items-center gap-3">
        <div className="p-2 bg-blue-100 rounded-lg text-blue-700"><PieChart size={28} /></div>
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-gray-900">{tituloDashboard}</h1>
          <p className="text-sm text-gray-500">{esAdmin ? 'Vista General' : 'Tus Indicadores'}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex justify-between items-center">
          <div><p className="text-sm font-medium text-gray-500">Unidades</p><h3 className="text-3xl font-bold mt-1">{stats.totalItems}</h3></div>
          <div className="p-3 bg-blue-500 rounded-lg text-white"><Package size={24} /></div>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex justify-between items-center">
          <div><p className="text-sm font-medium text-gray-500">Valor (S/.)</p><h3 className="text-2xl font-bold mt-1">{stats.totalValor.toLocaleString()}</h3></div>
          <div className="p-3 bg-green-500 rounded-lg text-white"><TrendingUp size={24} /></div>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex justify-between items-center">
          <div><p className="text-sm font-medium text-gray-500">Stock Bajo</p><h3 className="text-3xl font-bold mt-1">{stats.lowStock}</h3></div>
          <div className="p-3 bg-orange-500 rounded-lg text-white"><AlertTriangle size={24} /></div>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex justify-between items-center">
          <div><p className="text-sm font-medium text-gray-500">No Disp.</p><h3 className="text-3xl font-bold mt-1">{stats.averiados}</h3></div>
          <div className="p-3 bg-red-500 rounded-lg text-white"><ShieldAlert size={24} /></div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h3 className="text-lg font-bold text-gray-900 mb-6">{esAdmin ? 'Por Almacén' : 'Mi Stock'}</h3>
          {cargando ? <p className="text-center text-sm">Cargando...</p> : porAlmacen.length > 0 ? (
            <div className="space-y-4">
              {porAlmacen.map((item, index) => (
                <div key={item.name}>
                  <div className="flex justify-between text-xs md:text-sm mb-1">
                    <span className="font-medium truncate w-32">{item.name}</span>
                    <span>{item.count} u.</span>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-3">
                    <div className={`h-3 rounded-full ${getColor(index)}`} style={{ width: `${item.percentage}%` }}></div>
                  </div>
                </div>
              ))}
            </div>
          ) : <p className="text-gray-400 text-center text-sm">Sin datos.</p>}
        </div>

        {esAdmin && (
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <div className="flex items-center gap-2 mb-4">
              <div className="p-2 bg-indigo-100 rounded text-indigo-600"><UserCheck size={20} /></div>
              <h3 className="text-lg font-bold text-gray-900">Últimos Accesos</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm whitespace-nowrap">
                <thead className="bg-gray-50 text-gray-600 font-medium">
                  <tr><th className="px-4 py-2">Usuario</th><th className="px-4 py-2">Rol</th><th className="px-4 py-2">Hora</th></tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {accesos.length > 0 ? accesos.map((a) => (
                    <tr key={a.id}>
                      <td className="px-4 py-3 font-medium">{a.usuario}</td>
                      <td className="px-4 py-3 text-xs"><span className="bg-gray-100 px-2 py-1 rounded border">{a.rol}</span></td>
                      <td className="px-4 py-3 text-gray-500 text-xs flex items-center gap-1">
                        <Clock size={12}/> 
                        {/* AQUI SE MUESTRA LA HORA CORREGIDA */}
                        {formatearFecha(a.fecha)}
                      </td>
                    </tr>
                  )) : (
                    <tr><td colSpan="3" className="text-center py-4 text-gray-400 text-xs">Sin registros.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;