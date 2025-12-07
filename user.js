const API_BASE = location.origin;
async function loadMethods(){
  const res = await fetch(API_BASE + '/api/payment-methods');
  const methods = await res.json();
  const el = document.getElementById('methods');
  if(!methods.length) el.innerText = 'No methods configured by admin';
  else{
    el.innerHTML = methods.map(m=>`<div class="method"><b>${m.title}</b> (${m.type})<div>${m.type==='upi'?('UPI: '+m.upi_id):''}</div>${m.qr_image?('<img src="'+m.qr_image+'" style="width:120px;margin-top:6px">':'')}</div>`).join('');
  }
}
async function loadBanners(){
  const res = await fetch(API_BASE + '/api/public/banners');
  const banners = await res.json();
  const el = document.getElementById('bannerList');
  if(!banners.length) el.innerText = 'No banners';
  else el.innerHTML = banners.map(b=>`<div><img src="${b.image}" style="width:200px"><div>${b.title}</div></div>`).join('');
}
document.getElementById('submitDeposit').addEventListener('click', async ()=>{
  const name = document.getElementById('uname').value;
  const mobile = document.getElementById('mobile').value;
  const amount = document.getElementById('amount').value;
  const method = null;
  const res = await fetch(API_BASE + '/api/deposits', {method:'POST', headers:{'content-type':'application/json'}, body:JSON.stringify({user_name:name,user_mobile:mobile,method_id:method,amount})});
  const data = await res.json();
  document.getElementById('depositMsg').innerText = 'Deposit request submitted (id='+data.id+')';
});
document.getElementById('createIdBtn').addEventListener('click', async ()=>{
  const site = document.getElementById('site').value;
  const name = document.getElementById('uname').value || 'Guest';
  const mobile = document.getElementById('mobile').value || '';
  if(!site) return alert('Enter site');
  const res = await fetch(API_BASE + '/api/id-requests', {method:'POST', headers:{'content-type':'application/json'}, body:JSON.stringify({user_name:name,user_mobile:mobile,site,site_link:site})});
  const data = await res.json();
  document.getElementById('idMsg').innerText = 'ID Request submitted (id='+data.id+')';
});
window.onload = ()=>{ loadMethods(); loadBanners(); }
