const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = 3000;

// Aumentamos el límite de tamaño para recibir mucha data
app.use(cors());
app.use(express.json({ limit: '10mb' })); 

// --- CONEXIÓN BASE DE DATOS ---
const dbPath = path.resolve(__dirname, 'inventario.db');
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) console.error('❌ Error BD:', err.message);
  else {
    console.log('✅ BD Conectada.');
    initTables();
  }
});

function initTables() {
  db.serialize(() => {
    // 1. USUARIOS
    db.run(`CREATE TABLE IF NOT EXISTS usuarios (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nombre TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      rol TEXT NOT NULL,
      session_id TEXT
    )`);

    // 2. ALMACENES
    db.run(`CREATE TABLE IF NOT EXISTS almacenes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nombre TEXT NOT NULL
    )`);

    // 3. PRODUCTOS
    db.run(`CREATE TABLE IF NOT EXISTS productos (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      codigo TEXT NOT NULL, 
      nombre TEXT NOT NULL,
      modelo TEXT,
      tipo TEXT,
      tamano TEXT,
      valor REAL,
      estado TEXT DEFAULT 'Disponible',
      cantidad INTEGER DEFAULT 0,
      id_almacen INTEGER,
      FOREIGN KEY(id_almacen) REFERENCES almacenes(id),
      UNIQUE(codigo, id_almacen, estado) 
    )`);

    // 4. MOVIMIENTOS
    db.run(`CREATE TABLE IF NOT EXISTS movimientos (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      id_producto INTEGER,
      tipo TEXT,
      cantidad INTEGER,
      fecha DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);

    // 5. BITÁCORA
    db.run(`CREATE TABLE IF NOT EXISTS accesos (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      usuario TEXT NOT NULL,
      rol TEXT NOT NULL,
      fecha DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);

    // --- DATOS POR DEFECTO ---
    db.get("SELECT count(*) as count FROM usuarios", [], (err, row) => {
      if (row && row.count === 0) {
        db.run(`INSERT INTO usuarios (nombre, email, password, rol) VALUES (?, ?, ?, ?)`, ['Administrador', 'admin@lomasanta.com', '123456', 'Admin']);
      }
    });

    db.get("SELECT count(*) as count FROM almacenes", [], (err, row) => {
      if (row && row.count === 0) {
        const stmt = db.prepare("INSERT INTO almacenes (nombre) VALUES (?)");
        ['Administración', 'Marketing', 'Seguridad y Mantenimiento', 'Eventos'].forEach(a => stmt.run(a));
        stmt.finalize();
      }
    });
  });
}

// --- RUTAS API ---

app.post('/api/login', (req, res) => {
  const { email, password } = req.body;
  db.get("SELECT id, nombre, email, rol FROM usuarios WHERE email = ? AND password = ?", [email, password], (err, row) => {
    if (err) return res.status(500).json({ error: "Error de servidor" });
    if (row) {
      const nuevaSesion = Math.random().toString(36).substring(2) + Date.now().toString(36);
      db.run("UPDATE usuarios SET session_id = ? WHERE id = ?", [nuevaSesion, row.id], (errUpdate) => {
        db.run(`INSERT INTO accesos (usuario, rol) VALUES (?, ?)`, [row.nombre, row.rol]);
        res.json({ success: true, user: { ...row, session_id: nuevaSesion } });
      });
    } else {
      res.status(401).json({ success: false, error: "Credenciales inválidas" });
    }
  });
});

app.post('/api/verificar-sesion', (req, res) => {
  const { id, session_id } = req.body;
  db.get("SELECT session_id FROM usuarios WHERE id = ?", [id], (err, row) => {
    if (err || !row) return res.json({ valid: false });
    if (row.session_id === session_id) res.json({ valid: true });
    else res.json({ valid: false });
  });
});

app.get('/api/accesos', (req, res) => {
  db.all("SELECT * FROM accesos ORDER BY id DESC LIMIT 10", [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ data: rows });
  });
});

app.get('/api/productos', (req, res) => {
  const sql = `SELECT p.*, a.nombre as nombre_almacen FROM productos p LEFT JOIN almacenes a ON p.id_almacen = a.id ORDER BY p.codigo ASC`;
  db.all(sql, [], (err, rows) => { if (err) return res.status(500).json({error:err.message}); res.json({data:rows}); });
});

app.post('/api/productos', (req, res) => {
  const { codigo, nombre, modelo, tipo, tamano, valor, id_almacen, estado } = req.body;
  const sql = `INSERT INTO productos (codigo, nombre, modelo, tipo, tamano, valor, cantidad, id_almacen, estado) VALUES (?,?,?,?,?,?,?,?,?)`;
  db.run(sql, [codigo, nombre, modelo, tipo, tamano, valor, 0, id_almacen, estado || 'Disponible'], function(err) {
    if(err) { if(err.message.includes("UNIQUE")) return res.status(400).json({error:"Ya existe este producto con ese estado"}); return res.status(400).json({error:err.message}); }
    res.json({message:"Creado", id:this.lastID});
  });
});

// --- 🔥 NUEVA RUTA: CARGA MASIVA DE PRODUCTOS ---
app.post('/api/productos/masivo', (req, res) => {
  const productos = req.body; // Esperamos un array de objetos
  
  if (!Array.isArray(productos) || productos.length === 0) {
    return res.status(400).json({ error: "No se enviaron datos válidos" });
  }

  console.log(`📦 Recibiendo carga masiva de ${productos.length} items...`);

  // Usamos una transacción para que sea ultra rápido
  db.serialize(() => {
    db.run("BEGIN TRANSACTION");
    
    const stmt = db.prepare(`INSERT OR IGNORE INTO productos (codigo, nombre, modelo, tipo, tamano, valor, cantidad, id_almacen, estado) VALUES (?,?,?,?,?,?,?,?,?)`);
    
    let insertados = 0;
    productos.forEach(p => {
      // Mapeo de nombre de almacén a ID (Simple)
      let idAlmacen = 1; // Default Admin
      const nombreAlmacen = p.almacen ? p.almacen.toLowerCase() : '';
      if (nombreAlmacen.includes('marketing')) idAlmacen = 2;
      else if (nombreAlmacen.includes('seguridad')) idAlmacen = 3;
      else if (nombreAlmacen.includes('eventos')) idAlmacen = 4;

      stmt.run([
        p.codigo, p.nombre, p.modelo || '', p.tipo || 'General', 
        p.tamano || '', p.valor || 0, p.cantidad || 0, idAlmacen, p.estado || 'Disponible'
      ]);
      insertados++;
    });

    stmt.finalize();
    
    db.run("COMMIT", (err) => {
      if (err) {
        console.error("Error en carga masiva:", err);
        return res.status(500).json({ error: "Error procesando la carga masiva" });
      }
      console.log("✅ Carga masiva completada.");
      res.json({ message: `Proceso completado. Se procesaron ${insertados} registros.` });
    });
  });
});

app.put('/api/productos/:id', (req, res) => {
  const { id } = req.params;
  const { codigo, nombre, modelo, tipo, tamano, valor, id_almacen, estado } = req.body;
  const sql = `UPDATE productos SET codigo=?, nombre=?, modelo=?, tipo=?, tamano=?, valor=?, id_almacen=?, estado=? WHERE id=?`;
  db.run(sql, [codigo, nombre, modelo, tipo, tamano, valor, id_almacen, estado, id], function(err) {
    if(err) { if(err.message.includes("UNIQUE")) return res.status(400).json({error:"Conflicto de duplicados"}); return res.status(400).json({error:err.message}); }
    res.json({message:"Actualizado"});
  });
});

app.delete('/api/productos/:id', (req, res) => {
  const { id } = req.params;
  db.run("DELETE FROM movimientos WHERE id_producto = ?", [id], (err) => {
    if (err) return res.status(500).json({ error: "Error historial" });
    db.run("DELETE FROM productos WHERE id = ?", [id], (err) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ message: "Eliminado" });
    });
  });
});

app.post('/api/movimientos', (req, res) => {
  const { id_producto, tipo, cantidad } = req.body;
  if(tipo==='SALIDA'){
    db.get("SELECT cantidad FROM productos WHERE id=?", [id_producto], (err,row)=>{
      if(row.cantidad < cantidad) return res.status(400).json({error:"Stock insuficiente"});
      ejecutarMov();
    });
  } else { ejecutarMov(); }
  function ejecutarMov(){
    db.run(`INSERT INTO movimientos (id_producto, tipo, cantidad) VALUES (?,?,?)`, [id_producto, tipo, cantidad], (err)=>{
      if(err)return res.status(500).json({error:err.message});
      const op = tipo === 'ENTRADA' ? '+' : '-';
      db.run(`UPDATE productos SET cantidad = cantidad ${op} ? WHERE id = ?`, [cantidad, id_producto], (err)=>{
        res.json({message:"Éxito"});
      });
    });
  }
});

app.get('/api/movimientos', (req, res) => {
  const sql = `SELECT m.id, m.tipo, m.cantidad, m.fecha, p.nombre as producto, p.codigo FROM movimientos m JOIN productos p ON m.id_producto = p.id ORDER BY m.fecha DESC`;
  db.all(sql, [], (err, rows) => res.json({ data: rows }));
});

app.get('/api/usuarios', (req, res) => {
  db.all("SELECT id, nombre, email, rol FROM usuarios", [], (err, rows) => { if (err) return res.status(500).json({error:err.message}); res.json({data:rows}); });
});

app.post('/api/usuarios', (req, res) => {
  const { nombre, email, password, rol } = req.body;
  db.run(`INSERT INTO usuarios (nombre, email, password, rol) VALUES (?, ?, ?, ?)`, [nombre, email, password, rol], function(err) {
    if(err) return res.status(400).json({error:"Email duplicado"});
    res.json({message:"Creado", id:this.lastID});
  });
});

app.delete('/api/usuarios/:id', (req, res) => {
  const { id } = req.params; const { adminCode } = req.body;
  if(adminCode !== "LOMA2024") return res.status(403).json({error:"Clave maestra incorrecta"});
  if(id==1) return res.status(400).json({error:"No se puede borrar al Admin principal"});
  db.run("DELETE FROM usuarios WHERE id = ?", [id], (err)=>{ res.json({message:"Eliminado"}); });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`🔥 Servidor listo en http://0.0.0.0:${PORT}`);
});