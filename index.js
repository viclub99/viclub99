// server/index.js
const express = require('express');
const fileUpload = require('express-fileupload');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json({limit: '10mb'}));
app.use(fileUpload());
const UPLOADS = path.join(__dirname, 'uploads');
if (!fs.existsSync(UPLOADS)) fs.mkdirSync(UPLOADS);

const DB = path.join(__dirname, 'db.sqlite');
const db = new sqlite3.Database(DB);

function run(sql, params=[]) {
  return new Promise((res, rej) => db.run(sql, params, function(err){ if(err) rej(err); else res(this); }));
}
function all(sql, params=[]) {
  return new Promise((res, rej) => db.all(sql, params, (err, rows)=> { if(err) rej(err); else res(rows); }));
}
function get(sql, params=[]) {
  return new Promise((res, rej) => db.get(sql, params, (err, row)=> { if(err) rej(err); else res(row); }));
}

async function init(){
  await run(`CREATE TABLE IF NOT EXISTS payment_methods (
    id INTEGER PRIMARY KEY AUTOINCREMENT, type TEXT, title TEXT, upi_id TEXT, holder TEXT,
    bank_name TEXT, account_number TEXT, ifsc TEXT, qr_image TEXT, notes TEXT, active INTEGER DEFAULT 1
  )`);
  await run(`CREATE TABLE IF NOT EXISTS deposits (
    id INTEGER PRIMARY KEY AUTOINCREMENT, user_name TEXT, user_mobile TEXT, method_id INTEGER, amount REAL, screenshot TEXT, status TEXT DEFAULT 'pending', created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);
  await run(`CREATE TABLE IF NOT EXISTS id_requests (
    id INTEGER PRIMARY KEY AUTOINCREMENT, user_name TEXT, user_mobile TEXT, site TEXT, site_link TEXT, notes TEXT, status TEXT DEFAULT 'pending', admin_username TEXT, admin_password TEXT, created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);
  await run(`CREATE TABLE IF NOT EXISTS banners ( id INTEGER PRIMARY KEY AUTOINCREMENT, title TEXT, image TEXT, link TEXT, position TEXT, active INTEGER DEFAULT 1, created_at DATETIME DEFAULT CURRENT_TIMESTAMP )`);
}
init().catch(console.error);

// simple admin token for demo
const ADMIN_TOKEN = process.env.ADMIN_TOKEN || 'admintoken123';

app.use('/static', express.static(path.join(__dirname, '../client/static')));

// upload endpoint
app.post('/api/upload', async (req, res) => {
  const token = req.headers['x-admin-token'] || '';
  if (token !== ADMIN_TOKEN) return res.status(401).json({ error: 'unauthorized' });
  if (!req.files || !req.files.file) return res.status(400).json({ error: 'no file' });
  const file = req.files.file;
  const name = Date.now() + '_' + file.name.replace(/\\s+/g,'_');
  const savePath = path.join(UPLOADS, name);
  await file.mv(savePath);
  const url = '/uploads/' + name;
  return res.json({ url });
});

app.use('/uploads', express.static(UPLOADS));

// payment methods
app.get('/api/payment-methods', async (req,res)=> {
  const rows = await all('SELECT * FROM payment_methods ORDER BY id DESC');
  res.json(rows);
});
app.post('/api/payment-methods', async (req,res)=> {
  const token = req.headers['x-admin-token'] || '';
  if (token !== ADMIN_TOKEN) return res.status(401).json({ error: 'unauthorized' });
  const { type, title, upi_id, holder, bank_name, account_number, ifsc, qr_image, notes } = req.body;
  const stmt = await run(`INSERT INTO payment_methods (type,title,upi_id,holder,bank_name,account_number,ifsc,qr_image,notes) VALUES (?,?,?,?,?,?,?,?,?)`, [type,title,upi_id||'',holder||'',bank_name||'',account_number||'',ifsc||'',qr_image||'',notes||'']);
  const row = await get('SELECT * FROM payment_methods WHERE id=?', [stmt.lastID]);
  res.json(row);
});

// deposits
app.post('/api/deposits', async (req,res)=> {
  const { user_name, user_mobile, method_id, amount, screenshot } = req.body;
  const stmt = await run(`INSERT INTO deposits (user_name,user_mobile,method_id,amount,screenshot) VALUES (?,?,?,?,?)`, [user_name,user_mobile,method_id||null,amount||0,screenshot||'']);
  const row = await get('SELECT * FROM deposits WHERE id=?', [stmt.lastID]);
  res.json(row);
});
app.get('/api/admin/deposits', async (req,res)=> {
  const token = req.headers['x-admin-token'] || '';
  if (token !== ADMIN_TOKEN) return res.status(401).json({ error: 'unauthorized' });
  const rows = await all('SELECT d.*, p.title as method_title FROM deposits d LEFT JOIN payment_methods p ON p.id=d.method_id ORDER BY d.created_at DESC');
  res.json(rows);
});
app.post('/api/admin/deposits/:id/approve', async (req,res)=> {
  const token = req.headers['x-admin-token'] || '';
  if (token !== ADMIN_TOKEN) return res.status(401).json({ error: 'unauthorized' });
  const id = req.params.id;
  await run('UPDATE deposits SET status=? WHERE id=?', ['approved', id]);
  const row = await get('SELECT * FROM deposits WHERE id=?', [id]);
  res.json(row);
});

// id requests
app.post('/api/id-requests', async (req,res)=> {
  const { user_name, user_mobile, site, site_link, notes } = req.body;
  const stmt = await run(`INSERT INTO id_requests (user_name,user_mobile,site,site_link,notes) VALUES (?,?,?,?,?)`, [user_name,user_mobile,site,site_link||'',notes||'']);
  const row = await get('SELECT * FROM id_requests WHERE id=?', [stmt.lastID]);
  res.json(row);
});
app.get('/api/admin/id-requests', async (req,res)=> {
  const token = req.headers['x-admin-token'] || '';
  if (token !== ADMIN_TOKEN) return res.status(401).json({ error: 'unauthorized' });
  const rows = await all('SELECT * FROM id_requests ORDER BY created_at DESC');
  res.json(rows);
});
app.post('/api/admin/id-requests/:id/approve', async (req,res)=> {
  const token = req.headers['x-admin-token'] || '';
  if (token !== ADMIN_TOKEN) return res.status(401).json({ error: 'unauthorized' });
  const id = req.params.id;
  const { username, password } = req.body;
  await run('UPDATE id_requests SET status=?, admin_username=?, admin_password=? WHERE id=?', ['approved', username, password, id]);
  const row = await get('SELECT * FROM id_requests WHERE id=?', [id]);
  res.json(row);
});

// banners
app.post('/api/admin/banner', async (req,res)=> {
  const token = req.headers['x-admin-token'] || '';
  if (token !== ADMIN_TOKEN) return res.status(401).json({ error: 'unauthorized' });
  const { title, image, link, position, active } = req.body;
  const stmt = await run('INSERT INTO banners (title,image,link,position,active) VALUES (?,?,?,?,?)', [title,image||'',link||'',position||'home',active?1:0]);
  const row = await get('SELECT * FROM banners WHERE id=?',[stmt.lastID]);
  res.json(row);
});
app.get('/api/public/banners', async (req,res)=> {
  const rows = await all('SELECT * FROM banners WHERE active=1 ORDER BY created_at DESC');
  res.json(rows);
});

app.get('/api/health', (req,res)=> res.json({ ok:true }));

const PORT = process.env.PORT || 4000;
app.listen(PORT, ()=> console.log('Server listening on', PORT));
