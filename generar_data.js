const fs = require('fs');

console.log("🏭 Generando lote de 500 productos de prueba...");

const ALMACENES = ['Administración', 'Marketing', 'Seguridad y Mantenimiento', 'Eventos'];
const TIPOS = ['Mobiliario', 'Tecnología', 'Insumos', 'Equipo', 'Herramienta', 'Audio', 'Video'];
const ESTADOS = ['Disponible', 'Disponible', 'Disponible', 'En Uso', 'Averiado']; 

let csvContent = "Código,Nombre,Modelo,Tipo,Tamaño,Almacén,Estado,Precio,Stock\n";

for (let i = 1; i <= 500; i++) {
  const codigo = `TEST-${1000 + i}`;
  const nombre = `Producto Masivo ${i}`;
  const modelo = `Mod-${Math.floor(Math.random() * 999)}`;
  const tipo = TIPOS[Math.floor(Math.random() * TIPOS.length)];
  const tamano = 'Estándar';
  const almacen = ALMACENES[Math.floor(Math.random() * ALMACENES.length)];
  const estado = ESTADOS[Math.floor(Math.random() * ESTADOS.length)];
  const precio = (Math.random() * 500 + 10).toFixed(2);
  const stock = Math.floor(Math.random() * 50);

  csvContent += `${codigo},${nombre},${modelo},${tipo},${tamano},${almacen},${estado},${precio},${stock}\n`;
}

// Guardamos el archivo en la carpeta actual
fs.writeFileSync('datos_prueba_500.csv', csvContent, 'utf8');
console.log("✅ ¡Listo! Se creó el archivo 'datos_prueba_500.csv'.");
console.log("👉 Ahora ve a tu sistema -> Almacenes -> Botón Morado 'Subir CSV' y selecciona este archivo.");