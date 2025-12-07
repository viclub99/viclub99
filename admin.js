const API_BASE = location.origin;
const ADMIN_TOKEN = 'admintoken123';
document.getElementById('uploadBtn').addEventListener('click', async ()=>{
  const f = document.getElementById('fileInput').files[0];
  if(!f) return alert('Choose file');
  const fd = new FormData(); fd.append('file', f);
  const res = await fetch(API_BASE + '/api/upload', { method:'POST', headers: {'x-admin-token':ADMIN_TOKEN}, body: fd });
  const data = await res.json();
  if(data.url) document.getElementById('uploadResult').innerText = 'Uploaded: ' + data.url;
  loadMethods(); loadDeposits(); loadIdRequests();
});
document.getElementById('addUpi').addEventListener('click', async ()=>{
  const title = prompt('Title (eg: UPI - Rahul)');
  const upi = prompt('UPI ID (eg:rahul@upi)');
  if(!title || !upi) return;
  const res = await fetch(API_BASE + '/api/payment-methods', { method:'POST', headers: {'content-type':'application/json','x-admin-token':ADMIN_TOKEN}, body: JSON.stringify({type:'upi',title,upi_id:upi,holder:''})});
  const data = await res.json();
  alert('Created method: '+data.id);
  loadMethods();
});
async function loadMethods(){
  const res = await fetch(API_BASE + '/api/payment-methods');
  const arr = await res.json();
  document.getElementById('methods').innerHTML = arr.map(a=>'<div>'+a.title+' ('+a.type+')</div>').join('');
}
async function loadDeposits(){
  const res = await fetch(API_BASE + '/api/admin/deposits', { headers: {'x-admin-token':ADMIN_TOKEN} });
  const arr = await res.json();
  const el = document.getElementById('deposits');
  if(!arr.length) el.innerText = 'No deposits';
  else el.innerHTML = arr.map(d=>'ID:'+d.id+' '+d.user_name+' ₹'+d.amount+' <button onclick="approve('+d.id+')">Approve</button>').join('<br>');
}
async function loadIdRequests(){
  const res = await fetch(API_BASE + '/api/admin/id-requests', { headers: {'x-admin-token':ADMIN_TOKEN} });
  const arr = await res.json();
  const el = document.getElementById('idrequests');
  if(!arr.length) el.innerText = 'No requests';
  else el.innerHTML = arr.map(r=>'ID:'+r.id+' '+r.user_name+' '+r.site+' <button onclick="approveId('+r.id+')">Approve & Send</button>').join('<br>');
}
window.approve = async function(id){
  await fetch(API_BASE + '/api/admin/deposits/'+id+'/approve', { method:'POST', headers: {'x-admin-token':ADMIN_TOKEN} });
  loadDeposits();
}
window.approveId = async function(id){
  const username = prompt('Username for client'); const password = prompt('Password');
  if(!username||!password) return;
  await fetch(API_BASE + '/api/admin/id-requests/'+id+'/approve', { method:'POST', headers: {'content-type':'application/json','x-admin-token':ADMIN_TOKEN}, body: JSON.stringify({username,password})});
  loadIdRequests();
}
window.onload = ()=>{ loadMethods(); loadDeposits(); loadIdRequests(); }
