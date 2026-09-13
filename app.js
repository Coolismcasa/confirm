/* ═══════════════════════════════════════════════════════════
   COOLISM — Complete App Logic (Single Theme, No Loyalty)
   ═══════════════════════════════════════════════════════════ */

const firebaseConfig = {
  apiKey: "AIzaSyB9V9qVT1Tsje14gVs5r2q-f1IePFqFfTE",
  authDomain: "coolism-ff714.firebaseapp.com",
  projectId: "coolism-ff714",
  storageBucket: "coolism-ff714.firebasestorage.app",
  messagingSenderId: "393937665947",
  appId: "1:393937665947:web:f7becefed9c456e3baab3e"
};
firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();

let PRODUCTS = [];
let CATEGORIES = {};
let cart = [];
let allUsers = [];
let allOrders = [];
let currentDetail = { product:null, size:null, color:null, qty:1, images:[], index:0 };
let currentFilter = 'all';
let currentSort = 'featured';
let currentOrderId = null;
let shopGender = null;
let shopCat = null;

const SHIPPING_FROM = { city: 'Jaranwala', district: 'Faisalabad', province: 'Punjab' };
const SHIPPING_RATES = { sameCity:150, sameDistrict:200, sameProvince:250, other:300, freeThreshold:5000 };

const money = n => 'Rs ' + Number(n || 0).toLocaleString('en-PK');
const isEmail = v => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.trim());
const isPhone = v => /^03\d{9}$/.test(v.replace(/[\s-]/g, ''));

/* ═══════ FALLBACK DATA ═══════ */
const FALLBACK_CATS = {
  shirts:  { label:'Shirts',  gender:'unisex', desc:'Heavyweight tees & crisp cotton', img:'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=800&q=80' },
  pants:   { label:'Pants',   gender:'unisex', desc:'Tailored wide-leg & relaxed fits', img:'https://images.unsplash.com/photo-1624378439575-d8705ad7ae80?w=800&q=80' },
  jackets: { label:'Jackets', gender:'unisex', desc:'Leather, bombers & denim',         img:'https://images.unsplash.com/photo-1551028719-00167b16eac5?w=800&q=80' },
  hoodies: { label:'Hoodies', gender:'unisex', desc:'Oversized & fleece-lined comfort', img:'https://images.unsplash.com/photo-1556821840-3a63f95609a7?w=800&q=80' },
  purses:  { label:'Purses',  gender:'women',  desc:'Leather & mini totes',             img:'https://images.unsplash.com/photo-1584917865442-de89df76afd3?w=800&q=80' }
};

const FALLBACK_PRODUCTS = [
  // MEN
  { id:'m1', name:'Classic White Tee', gender:'men', cat:'shirts', price:2490, oldPrice:3200, tag:'New',
    images:['https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=700&q=80'],
    desc:'A relaxed-fit tee cut from heavyweight 320 GSM cotton.',
    sizes:['S','M','L','XL','XXL'],
    colors:[{name:'White',hex:'#F9F8F6'},{name:'Navy',hex:'#0B1A30'}],
    fabric:'100% Combed Cotton', care:'Machine wash cold', sku:'CLM-M-SH-001',
    inStock:true, stock:50, lowStock:5 },
  { id:'m2', name:'Royal Oxford Shirt', gender:'men', cat:'shirts', price:4990,
    images:['https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=700&q=80'],
    desc:'A crisp Oxford weave with mother-of-pearl buttons.',
    sizes:['S','M','L','XL'],
    colors:[{name:'White',hex:'#F9F8F6'},{name:'Sky',hex:'#A8C4E0'}],
    fabric:'Egyptian Cotton Oxford', care:'Machine wash warm', sku:'CLM-M-SH-002',
    inStock:true, stock:30, lowStock:5 },
  { id:'m3', name:'Pleated Wide-Leg Trousers', gender:'men', cat:'pants', price:5890, oldPrice:6990, tag:'Bestseller',
    images:['https://images.unsplash.com/photo-1594633312681-425c7b97ccd1?w=700&q=80'],
    desc:'Tailored with a single front pleat and a wide, flowing leg.',
    sizes:['30','32','34','36','38'],
    colors:[{name:'Brown',hex:'#6B5442'},{name:'Charcoal',hex:'#2A2A2A'}],
    fabric:'Poly-wool blend', care:'Dry clean only', sku:'CLM-M-PT-001',
    inStock:true, stock:25, lowStock:5 },
  { id:'m4', name:'Relaxed Linen Pants', gender:'men', cat:'pants', price:4290,
    images:['https://images.unsplash.com/photo-1624378439575-d8705ad7ae80?w=700&q=80'],
    desc:'Breathable pure linen with a soft elasticated back.',
    sizes:['30','32','34','36'],
    colors:[{name:'Sand',hex:'#D6C7A8'},{name:'Sage',hex:'#9CAE93'}],
    fabric:'100% European Linen', care:'Machine wash cold', sku:'CLM-M-PT-002',
    inStock:true, stock:40, lowStock:5 },
  { id:'m5', name:'Moto Leather Jacket', gender:'men', cat:'jackets', price:18900, oldPrice:22500, tag:'Limited',
    images:['https://images.unsplash.com/photo-1551028719-00167b16eac5?w=700&q=80'],
    desc:'A classic asymmetrical biker silhouette in full-grain sheep leather.',
    sizes:['S','M','L','XL'],
    colors:[{name:'Black',hex:'#0E0E0E'},{name:'Espresso',hex:'#3A2C20'}],
    fabric:'Full-grain leather', care:'Wipe clean', sku:'CLM-M-JK-001',
    inStock:true, stock:8, lowStock:3 },
  { id:'m6', name:'Navy Bomber Jacket', gender:'men', cat:'jackets', price:11900,
    images:['https://images.unsplash.com/photo-1591047139829-d91aecb6caea?w=700&q=80'],
    desc:'Lightweight nylon bomber with ribbed cuffs and hem.',
    sizes:['S','M','L','XL','XXL'],
    colors:[{name:'Navy',hex:'#0B1A30'},{name:'Olive',hex:'#4A5240'}],
    fabric:'Recycled nylon shell', care:'Machine wash cold', sku:'CLM-M-JK-002',
    inStock:true, stock:20, lowStock:5 },
  { id:'m7', name:'Oversized Navy Hoodie', gender:'men', cat:'hoodies', price:6490, oldPrice:7990, tag:'Bestseller',
    images:['https://images.unsplash.com/photo-1556821840-3a63f95609a7?w=700&q=80'],
    desc:'Cut with a dropped shoulder and a boxy fit that drapes perfectly.',
    sizes:['S','M','L','XL','XXL'],
    colors:[{name:'Navy',hex:'#131F3A'},{name:'Charcoal',hex:'#3A3A3A'}],
    fabric:'85% Cotton / 15% Poly', care:'Machine wash cold', sku:'CLM-M-HD-001',
    inStock:true, stock:60, lowStock:5 },
  { id:'m8', name:'Fleece-Lined Zip Hoodie', gender:'men', cat:'hoodies', price:7290, tag:'New',
    images:['https://images.unsplash.com/photo-1620799140408-edc6dcb6d633?w=700&q=80'],
    desc:'Full-zip hoodie with a double-lined hood and soft brushed interior.',
    sizes:['S','M','L','XL'],
    colors:[{name:'Navy',hex:'#131F3A'},{name:'Grey',hex:'#8A8A8A'}],
    fabric:'Cotton-poly blend', care:'Machine wash cold', sku:'CLM-M-HD-002',
    inStock:true, stock:35, lowStock:5 },

  // WOMEN
  { id:'w1', name:'Silk Button Blouse', gender:'women', cat:'shirts', price:5490, oldPrice:6490, tag:'New',
    images:['https://images.unsplash.com/photo-1564257577032-6b3d3cfa1ce4?w=700&q=80'],
    desc:'Fluid silk blouse with a relaxed drape and pearl buttons.',
    sizes:['XS','S','M','L','XL'],
    colors:[{name:'Ivory',hex:'#F4EFE6'},{name:'Blush',hex:'#E8C4C0'}],
    fabric:'100% Mulberry Silk', care:'Dry clean only', sku:'CLM-W-SH-001',
    inStock:true, stock:28, lowStock:5 },
  { id:'w2', name:'Cropped Linen Top', gender:'women', cat:'shirts', price:3490,
    images:['https://images.unsplash.com/photo-1554568218-0f1715e72254?w=700&q=80'],
    desc:'Breathable linen crop top with a tie-front detail.',
    sizes:['XS','S','M','L'],
    colors:[{name:'White',hex:'#F9F8F6'},{name:'Sky',hex:'#B8D0E6'}],
    fabric:'100% Linen', care:'Machine wash cold', sku:'CLM-W-SH-002',
    inStock:true, stock:42, lowStock:5 },
  { id:'w3', name:'High-Waist Flared Pants', gender:'women', cat:'pants', price:5890, oldPrice:6990, tag:'Bestseller',
    images:['https://images.unsplash.com/photo-1594633312681-425c7b97ccd1?w=700&q=80'],
    desc:'Flattering high-waist cut with a wide, fluid flare.',
    sizes:['24','26','28','30','32'],
    colors:[{name:'Black',hex:'#0E0E0E'},{name:'Camel',hex:'#B89368'}],
    fabric:'Poly-crepe', care:'Machine wash cold', sku:'CLM-W-PT-001',
    inStock:true, stock:34, lowStock:5 },
  { id:'w4', name:'Relaxed Tailored Trousers', gender:'women', cat:'pants', price:4790,
    images:['https://images.unsplash.com/photo-1584370848010-d7fe6bc767ec?w=700&q=80'],
    desc:'Straight-leg trousers with a clean tailored finish.',
    sizes:['24','26','28','30','32'],
    colors:[{name:'Charcoal',hex:'#3A3A3A'},{name:'Cream',hex:'#EFE5D2'}],
    fabric:'Wool-blend', care:'Dry clean only', sku:'CLM-W-PT-002',
    inStock:true, stock:26, lowStock:5 },
  { id:'w5', name:'Cropped Bomber Jacket', gender:'women', cat:'jackets', price:10900, tag:'New',
    images:['https://images.unsplash.com/photo-1551028719-00167b16eac5?w=700&q=80'],
    desc:'A cropped bomber with satin sheen and ribbed cuffs.',
    sizes:['XS','S','M','L'],
    colors:[{name:'Olive',hex:'#4A5240'},{name:'Wine',hex:'#6B1F2A'}],
    fabric:'Recycled satin', care:'Machine wash cold', sku:'CLM-W-JK-001',
    inStock:true, stock:18, lowStock:5 },
  { id:'w6', name:'Oversized Teddy Jacket', gender:'women', cat:'jackets', price:8990, oldPrice:10900, tag:'Sale',
    images:['https://images.unsplash.com/photo-1548126032-079a0fb0099d?w=700&q=80'],
    desc:'Plush teddy fleece with a relaxed oversized silhouette.',
    sizes:['S','M','L','XL'],
    colors:[{name:'Cream',hex:'#EFE5D2'},{name:'Camel',hex:'#C9A16E'}],
    fabric:'Recycled teddy fleece', care:'Machine wash cold', sku:'CLM-W-JK-002',
    inStock:true, stock:22, lowStock:5 },
  { id:'w7', name:'Oversized Hoodie', gender:'women', cat:'hoodies', price:6290, tag:'Bestseller',
    images:['https://images.unsplash.com/photo-1556821840-3a63f95609a7?w=700&q=80'],
    desc:'Dropped shoulders and a soft brushed interior.',
    sizes:['XS','S','M','L','XL'],
    colors:[{name:'Blush',hex:'#E8C4C0'},{name:'Charcoal',hex:'#3A3A3A'}],
    fabric:'80% Cotton / 20% Poly', care:'Machine wash cold', sku:'CLM-W-HD-001',
    inStock:true, stock:45, lowStock:5 },
  { id:'w8', name:'Leather Crossbody Purse', gender:'women', cat:'purses', price:7990, oldPrice:9900, tag:'New',
    images:['https://images.unsplash.com/photo-1584917865442-de89df76afd3?w=700&q=80'],
    desc:'Compact full-grain leather crossbody with adjustable strap.',
    sizes:['One Size'],
    colors:[{name:'Black',hex:'#0E0E0E'},{name:'Tan',hex:'#B98B5A'}],
    fabric:'Full-grain leather', care:'Wipe clean', sku:'CLM-W-PU-001',
    inStock:true, stock:16, lowStock:5 },
  { id:'w9', name:'Mini Structured Tote', gender:'women', cat:'purses', price:6490, tag:'Limited',
    images:['https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=700&q=80'],
    desc:'Structured mini tote in saffiano-textured leather.',
    sizes:['One Size'],
    colors:[{name:'Ivory',hex:'#F4EFE6'},{name:'Wine',hex:'#6B1F2A'}],
    fabric:'Saffiano leather', care:'Wipe clean', sku:'CLM-W-PU-002',
    inStock:true, stock:12, lowStock:4 }
];

/* ═══════ TOAST ═══════ */
let toastTimer;
function toast(msg) {
  const el = document.getElementById('toast');
  if (!el) return;
  document.getElementById('toastMsg').textContent = msg;
  el.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.remove('show'), 3200);
}

/* ═══════ SEASONAL BANNER ═══════ */
(function initSeasonal() {
  const banner = document.getElementById('seasonalBanner');
  if (!banner) return;
  if (localStorage.getItem('coolism_sb_dismissed') === '1') return;
  const m = new Date().getMonth();
  let t;
  if (m >= 11 || m <= 1) t = { icon:'❄️', title:'Winter Drop 2026', sub:'Up to 30% off selected pieces' };
  else if (m >= 2 && m <= 3) t = { icon:'🌸', title:'Spring Collection', sub:'Fresh arrivals just landed' };
  else if (m >= 4 && m <= 6) t = { icon:'☀️', title:'Summer Essentials', sub:'Light linens & breathable cotton' };
  else if (m >= 7 && m <= 8) t = { icon:'🌧️', title:'Monsoon Edit', sub:'Comfort meets Coolism' };
  else t = { icon:'🍂', title:'Autumn Drop', sub:'Rich tones for cooler days' };
  const i = document.getElementById('sbIcon');
  const tt = document.getElementById('sbTitle');
  const sb = document.getElementById('sbSub');
  if (i) i.textContent = t.icon;
  if (tt) tt.textContent = t.title;
  if (sb) sb.textContent = t.sub;
  banner.hidden = false;
  const close = document.getElementById('sbClose');
  if (close) close.addEventListener('click', () => {
    banner.hidden = true;
    localStorage.setItem('coolism_sb_dismissed', '1');
  });
})();

/* ═══════ AUTH STATE ═══════ */
const authReady = new Promise(resolve => {
  auth.onAuthStateChanged(user => {
    const accountBtn = document.getElementById('accountBtn');
    const profileIcon = document.getElementById('profileIcon');
    const logoutBtn = document.getElementById('logoutBtn');
    if (user) {
      if (accountBtn) accountBtn.hidden = true;
      if (profileIcon) profileIcon.hidden = false;
      if (logoutBtn) {
        logoutBtn.hidden = false;
        logoutBtn.onclick = () => auth.signOut().then(() => {
          toast('Logged out');
          setTimeout(() => location.reload(), 400);
        });
      }
    } else {
      if (accountBtn) accountBtn.hidden = false;
      if (profileIcon) profileIcon.hidden = true;
      if (logoutBtn) logoutBtn.hidden = true;
    }
    resolve(user);
  });
});

async function saveUserToFirestore(user, extra = {}) {
  try {
    const ref = db.collection('users').doc(user.uid);
    const snap = await ref.get();
    const base = {
      uid: user.uid, email: user.email || '',
      displayName: user.displayName || '', photoURL: user.photoURL || '',
      provider: (user.providerData[0] && user.providerData[0].providerId) || 'password',
      emailVerified: user.emailVerified,
      lastLogin: firebase.firestore.FieldValue.serverTimestamp()
    };
    if (!snap.exists) {
      await ref.set({
        ...base,
        firstName: extra.firstName || '', lastName: extra.lastName || '',
        fullName: extra.fullName || '', phone: extra.phone || '',
        address: '', city: '', district: '', province: '',
        createdAt: firebase.firestore.FieldValue.serverTimestamp()
      });
    } else {
      await ref.update(base);
    }
  } catch (err) { console.error('Save user:', err); }
}

/* ═══════ LOAD CATALOG ═══════ */
async function loadCatalog() {
  try {
    const snap = await db.collection('categories').get();
    if (!snap.empty) {
      const loaded = {};
      snap.forEach(doc => {
        const d = doc.data();
        loaded[doc.id] = {
          label: d.label || doc.id,
          gender: d.gender || 'unisex',
          desc: d.desc || d.sub || '',
          img: d.img || ''
        };
      });
      CATEGORIES = { ...FALLBACK_CATS, ...loaded };
    } else {
      CATEGORIES = { ...FALLBACK_CATS };
    }
  } catch (e) { CATEGORIES = { ...FALLBACK_CATS }; }

  try {
    const snap = await db.collection('products').get();
    if (!snap.empty) {
      PRODUCTS = snap.docs.map(doc => {
        const d = doc.data();
        return {
          id: doc.id, name: d.name || '',
          gender: d.gender || 'men',
          cat: d.cat || 'shirts',
          price: Number(d.price) || 0,
          oldPrice: d.oldPrice ? Number(d.oldPrice) : null,
          tag: d.tag || null,
          images: Array.isArray(d.images) ? d.images : (d.img ? [d.img] : []),
          desc: d.desc || '',
          sizes: Array.isArray(d.sizes) ? d.sizes : ['S','M','L','XL'],
          colors: Array.isArray(d.colors) ? d.colors : [{ name:'Navy', hex:'#0B1A30' }],
          fabric: d.fabric || '', care: d.care || '', sku: d.sku || '',
          inStock: d.inStock !== false, stock: d.stock ?? 50, lowStock: d.lowStock ?? 5,
          _ts: d.createdAt?.seconds || 0
        };
      });
    } else {
      PRODUCTS = [ ...FALLBACK_PRODUCTS ];
    }
  } catch (e) { PRODUCTS = [ ...FALLBACK_PRODUCTS ]; }
}

const getCat = k => CATEGORIES[k] || FALLBACK_CATS[k] || { label:k, gender:'unisex', desc:'', img:'' };

/* ═══════ PRODUCT VISUALS ═══════ */
function productVisual(p, cls = 'card-placeholder') {
  const img = (p.images && p.images[0]) || p.img;
  if (img) {
    return `<img src="${img}" alt="${p.name}" loading="lazy" onerror="this.style.display='none';this.nextElementSibling.style.display='grid'">
      <div class="${cls}" style="display:none;background:linear-gradient(140deg,#333,#111)"><span class="letter">${p.name.charAt(0)}</span></div>`;
  }
  return `<div class="${cls}" style="background:linear-gradient(140deg,#333,#111)"><span class="letter">${p.name.charAt(0)}</span></div>`;
}
function cartVisual(p) {
  const img = (p.images && p.images[0]) || p.img;
  if (img) {
    return `<img src="${img}" alt="${p.name}" onerror="this.style.display='none';this.nextElementSibling.style.display='grid'">
      <div class="mini-letter" style="display:none;background:#333">${p.name.charAt(0)}</div>`;
  }
  return `<div class="mini-letter" style="background:#333">${p.name.charAt(0)}</div>`;
}

/* ═══════ RENDER CATEGORY TILES (homepage) ═══════ */
function renderCategoryTiles() {
  const grid = document.getElementById('catGrid');
  if (!grid) return;
  const keys = Object.keys(CATEGORIES);
  grid.innerHTML = keys.map(k => {
    const c = CATEGORIES[k];
    return `<a href="shop.html?cat=${k}" class="cat-tile">
      <img class="cat-img" src="${c.img}" alt="${c.label}" loading="lazy" onerror="this.style.background='#1a2a50';this.style.display='none'">
      <div class="cat-inner"><h3>${c.label}</h3><p>${c.desc || ''}</p></div>
    </a>`;
  }).join('');
}

/* ═══════ RENDER PRODUCTS ═══════ */
function sortProducts(list, mode) {
  const a = [...list];
  if (mode === 'price-asc') a.sort((x,y) => x.price - y.price);
  else if (mode === 'price-desc') a.sort((x,y) => y.price - x.price);
  else if (mode === 'newest') a.sort((x,y) => (y._ts||0) - (x._ts||0));
  return a;
}
function productCardHTML(p) {
  const oos = p.stock !== undefined && p.stock <= 0;
  const oc = (!p.inStock || oos) ? 'out-of-stock' : '';
  return `<article class="card ${oc}" data-id="${p.id}">
    <div class="card-media">
      ${p.tag ? `<span class="tag">${p.tag}</span>` : ''}
      ${productVisual(p)}
      <button class="quick-add" data-quick="${p.id}" ${(!p.inStock || oos) ? 'disabled' : ''}>
        ${(!p.inStock || oos) ? 'Out of Stock' : 'Add to Bag'}
      </button>
    </div>
    <div class="card-body">
      <span class="cat">${getCat(p.cat).label}</span>
      <h3>${p.name}</h3>
      <div class="price">
        <span class="now">${money(p.price)}</span>
        ${p.oldPrice ? `<span class="was">${money(p.oldPrice)}</span>` : ''}
      </div>
    </div>
  </article>`;
}
function renderProducts(filter = 'all', sortMode = 'featured') {
  const grid = document.getElementById('productGrid');
  if (!grid) return;
  let list = filter === 'all' ? PRODUCTS : PRODUCTS.filter(p => p.cat === filter);
  list = sortProducts(list, sortMode);
  if (!list.length) {
    grid.innerHTML = `<div class="empty-state">
      <svg viewBox="0 0 24 24" stroke-linecap="round" stroke-linejoin="round"><path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><path d="M3 6h18"/><path d="M16 10a4 4 0 0 1-8 0"/></svg>
      <h3>No products found</h3><p>Try a different category.</p>
    </div>`;
    return;
  }
  grid.innerHTML = list.map(productCardHTML).join('');
}

/* ═══════ SHOP PAGE ═══════ */
function getUrlParam(key) {
  return new URLSearchParams(window.location.search).get(key);
}
function renderShopPage() {
  shopGender = getUrlParam('gender');
  shopCat = getUrlParam('cat');

  const genderSwitch = document.getElementById('genderSwitch');
  if (genderSwitch) {
    genderSwitch.innerHTML = `
      <a href="shop.html" class="${!shopGender?'active':''}">All</a>
      <a href="shop.html?gender=men" class="${shopGender==='men'?'active':''}">Men</a>
      <a href="shop.html?gender=women" class="${shopGender==='women'?'active':''}">Women</a>
    `;
  }

  const title = document.getElementById('shopTitle');
  const sub = document.getElementById('shopSubtitle');
  const eyebrow = document.getElementById('shopEyebrow');
  const heading = document.getElementById('shopHeading');

  if (shopGender === 'men') {
    if (title) title.textContent = "Men's Collection";
    if (sub) sub.textContent = "Sharp tailoring, premium fabrics, built for daily wear.";
    if (eyebrow) eyebrow.textContent = 'For Him';
  } else if (shopGender === 'women') {
    if (title) title.textContent = "Women's Collection";
    if (sub) sub.textContent = "Fluid silhouettes and elevated essentials.";
    if (eyebrow) eyebrow.textContent = 'For Her';
  } else {
    if (title) title.textContent = "All Collections";
    if (sub) sub.textContent = "Everything Coolism has to offer.";
    if (eyebrow) eyebrow.textContent = 'Browse All';
  }

  // Filter chips — show categories for current gender
  const filters = document.getElementById('filters');
  if (filters) {
    const catKeys = Object.keys(CATEGORIES).filter(k => {
      const g = CATEGORIES[k].gender || 'unisex';
      if (!shopGender) return true;
      return g === 'unisex' || g === shopGender;
    });
    filters.innerHTML = `<button class="chip ${!shopCat?'active':''}" data-filter="all">All</button>` +
      catKeys.map(k => `<button class="chip ${shopCat===k?'active':''}" data-filter="${k}">${CATEGORIES[k].label}</button>`).join('');
  }

  // Filter products
  let list = PRODUCTS;
  if (shopGender) list = list.filter(p => p.gender === shopGender);
  if (shopCat) list = list.filter(p => p.cat === shopCat);
  list = sortProducts(list, currentSort);

  if (heading) heading.textContent = shopCat ? getCat(shopCat).label : (shopGender ? `${shopGender==='men'?'Men':'Women'}'s` + ' Products' : 'All Products');

  const grid = document.getElementById('productGrid');
  if (grid) {
    if (!list.length) {
      grid.innerHTML = `<div class="empty-state">
        <svg viewBox="0 0 24 24" stroke-linecap="round" stroke-linejoin="round"><path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><path d="M3 6h18"/><path d="M16 10a4 4 0 0 1-8 0"/></svg>
        <h3>No products found</h3><p>Try a different category.</p>
      </div>`;
    } else {
      grid.innerHTML = list.map(productCardHTML).join('');
    }
  }

  // Filter chip clicks
  if (filters) filters.addEventListener('click', e => {
    const chip = e.target.closest('.chip');
    if (!chip) return;
    const f = chip.dataset.filter;
    const params = new URLSearchParams();
    if (shopGender) params.set('gender', shopGender);
    if (f !== 'all') params.set('cat', f);
    window.location.href = 'shop.html' + (params.toString() ? '?' + params.toString() : '');
  });
}

/* ═══════ CART ═══════ */
function loadLocalCart() {
  try { cart = JSON.parse(localStorage.getItem('coolism_cart') || '[]'); } catch (e) { cart = []; }
  renderCart();
}
function saveCart() {
  try { localStorage.setItem('coolism_cart', JSON.stringify(cart)); } catch (e) {}
}
const lineKey = i => `${i.id}|${i.size}|${i.color}`;

function addToCart(product, size, color, qty) {
  if (!product.inStock || (product.stock !== undefined && product.stock <= 0)) return toast('Out of stock');
  const key = `${product.id}|${size}|${color}`;
  const existing = cart.find(i => lineKey(i) === key);
  if (existing) existing.qty += qty;
  else cart.push({ id: product.id, name: product.name, price: product.price, images: product.images, size, color, qty });
  saveCart();
  renderCart();
  toast(`${product.name} added to bag`);
}

function renderCart() {
  const body = document.getElementById('cartBody');
  if (!body) return;
  const count = cart.reduce((s,i) => s + i.qty, 0);
  const total = cart.reduce((s,i) => s + i.price * i.qty, 0);
  const cnt = document.getElementById('cartCount');
  const tot = document.getElementById('cartTotal');
  if (cnt) { cnt.textContent = count; cnt.classList.toggle('show', count > 0); }
  if (tot) tot.textContent = money(total);

  const fill = document.getElementById('shipFill');
  const msg = document.getElementById('shipMsg');
  const prog = document.getElementById('shipProgress');
  if (fill && msg) {
    const free = SHIPPING_RATES.freeThreshold;
    fill.style.width = Math.min(100, (total/free)*100) + '%';
    if (total >= free) {
      msg.textContent = '🎉 You got free shipping!';
      if (prog) prog.classList.add('free');
    } else {
      msg.textContent = `Add ${money(free - total)} more for free shipping`;
      if (prog) prog.classList.remove('free');
    }
  }

  if (!cart.length) {
    body.innerHTML = `<div class="cart-empty">
      <svg viewBox="0 0 24 24" stroke-linecap="round" stroke-linejoin="round"><path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><path d="M3 6h18"/><path d="M16 10a4 4 0 0 1-8 0"/></svg>
      <p>Your bag is empty.</p>
      <a href="shop.html" class="btn btn-line" style="margin-top:16px">Start Shopping</a>
    </div>`;
    return;
  }
  body.innerHTML = cart.map(i => `
    <div class="cart-item">
      <div class="ci-thumb">${cartVisual(i)}</div>
      <div class="ci-info">
        <h4>${i.name}</h4>
        <div class="ci-variant">${i.size} · ${i.color}</div>
        <div class="p">${money(i.price)} × ${i.qty}</div>
        <div class="ci-controls">
          <div class="ci-qty">
            <button data-cart-dec="${lineKey(i)}">−</button>
            <span>${i.qty}</span>
            <button data-cart-inc="${lineKey(i)}">+</button>
          </div>
          <button class="ci-remove" data-cart-remove="${lineKey(i)}">Remove</button>
        </div>
      </div>
    </div>`).join('');
}

function openCart() {
  const d = document.getElementById('cartDrawer');
  const o = document.getElementById('overlay');
  if (d) d.classList.add('open');
  if (o) o.classList.add('show');
  document.body.style.overflow = 'hidden';
}
function closeCart() {
  const d = document.getElementById('cartDrawer');
  const o = document.getElementById('overlay');
  if (d) d.classList.remove('open');
  if (o) o.classList.remove('show');
  document.body.style.overflow = '';
}

/* ═══════ PRODUCT DETAIL ═══════ */
function openDetail(id) {
  const p = PRODUCTS.find(x => x.id === id);
  if (!p) return;
  currentDetail = {
    product: p, size: p.sizes[0], color: p.colors[0].name, qty: 1,
    images: p.images && p.images.length ? p.images : [], index: 0
  };
  const media = document.getElementById('detailMedia');
  const thumbs = document.getElementById('detailThumbs');
  const counter = document.getElementById('imgCounter');
  const prevBtn = document.getElementById('imgPrev');
  const nextBtn = document.getElementById('imgNext');
  if (media) media.innerHTML = productVisual(p, 'detail-placeholder');
  const total = currentDetail.images.length;
  if (counter) counter.textContent = total > 0 ? `1 / ${total}` : '';
  if (prevBtn) prevBtn.style.display = total > 1 ? 'grid' : 'none';
  if (nextBtn) nextBtn.style.display = total > 1 ? 'grid' : 'none';
  if (thumbs) {
    thumbs.innerHTML = total > 1
      ? currentDetail.images.map((img, i) =>
          `<div class="thumb ${i === 0 ? 'active' : ''}" data-thumb="${i}"><img src="${img}" alt="${p.name} ${i+1}"></div>`).join('')
      : '';
  }
  const set = (id, v) => { const el = document.getElementById(id); if (el) el.textContent = v; };
  set('detailCat', getCat(p.cat).label);
  set('detailName', p.name);
  const dp = document.getElementById('detailPrice');
  if (dp) dp.innerHTML = `<span class="now">${money(p.price)}</span>${p.oldPrice ? `<span class="was">${money(p.oldPrice)}</span>` : ''}`;
  set('detailDesc', p.desc || '');
  set('detailFabric', p.fabric || '—');
  set('detailCare', p.care || '—');
  set('detailSku', p.sku || '—');
  const ds = document.getElementById('detailSizes');
  if (ds) ds.innerHTML = p.sizes.map(s => `<button class="opt-btn ${s === currentDetail.size ? 'active' : ''}" data-size="${s}">${s}</button>`).join('');
  const dc = document.getElementById('detailColors');
  if (dc) dc.innerHTML = p.colors.map(c => `<button class="color-btn ${c.name === currentDetail.color ? 'active' : ''}" data-color="${c.name}"><span class="swatch" style="background:${c.hex}"></span><span class="color-name">${c.name}</span></button>`).join('');
  const qv = document.getElementById('qtyValue');
  if (qv) qv.textContent = '1';
  const sw = document.getElementById('stockWarning');
  if (sw) {
    if (p.stock !== undefined && p.stock <= 5 && p.stock > 0) {
      sw.textContent = `Only ${p.stock} left in stock!`; sw.style.display = 'block';
    } else if (p.stock === 0) {
      sw.textContent = 'Out of stock'; sw.style.display = 'block';
    } else sw.style.display = 'none';
  }
  const dm = document.getElementById('detailModal');
  if (dm) dm.classList.add('show');
  document.body.style.overflow = 'hidden';
}

function showImageIndex(idx) {
  if (!currentDetail.images.length) return;
  const total = currentDetail.images.length;
  currentDetail.index = ((idx % total) + total) % total;
  const img = currentDetail.images[currentDetail.index];
  const dm = document.getElementById('detailMedia');
  if (dm) dm.innerHTML = `<img src="${img}" alt="Product">`;
  const c = document.getElementById('imgCounter');
  if (c) c.textContent = `${currentDetail.index + 1} / ${total}`;
  document.querySelectorAll('.detail-thumbs .thumb').forEach((t, i) =>
    t.classList.toggle('active', i === currentDetail.index));
}

/* ═══════ SHIPPING / CHECKOUT ═══════ */
function calcShipping(subtotal, city, district, province) {
  if (subtotal >= SHIPPING_RATES.freeThreshold) return 0;
  const c = (city || '').toLowerCase().trim();
  const d = (district || '').toLowerCase().trim();
  const p = (province || '').toLowerCase().trim();
  if (c === SHIPPING_FROM.city.toLowerCase()) return SHIPPING_RATES.sameCity;
  if (d === SHIPPING_FROM.district.toLowerCase() || c === 'faisalabad') return SHIPPING_RATES.sameDistrict;
  if (p === SHIPPING_FROM.province.toLowerCase()) return SHIPPING_RATES.sameProvince;
  return SHIPPING_RATES.other;
}

function openCheckout() {
  const modal = document.getElementById('checkoutModal');
  if (!modal) return;
  const u = auth.currentUser;
  if (u) {
    db.collection('users').doc(u.uid).get().then(snap => {
      if (snap.exists) {
        const d = snap.data();
        const set = (id, v) => { const el = document.getElementById(id); if (el && v) el.value = v; };
        set('co-name', d.fullName || `${d.firstName || ''} ${d.lastName || ''}`.trim());
        set('co-phone', d.phone);
        set('co-address', d.address);
        set('co-city', d.city || SHIPPING_FROM.city);
        set('co-district', d.district || SHIPPING_FROM.district);
        set('co-province', d.province || SHIPPING_FROM.province);
      }
    }).catch(() => {});
  } else {
    const c = document.getElementById('co-city'); if (c && !c.value) c.value = SHIPPING_FROM.city;
    const d = document.getElementById('co-district'); if (d && !d.value) d.value = SHIPPING_FROM.district;
    const p = document.getElementById('co-province'); if (p && !p.value) p.value = SHIPPING_FROM.province;
  }
  updateCheckoutSummary();
  const note = document.getElementById('checkoutNote');
  if (note) note.textContent = u ? 'Your order will be placed as Cash on Delivery.' : "You'll be asked to sign in to confirm.";
  modal.classList.add('show');
  document.body.style.overflow = 'hidden';
  closeCart();
}

function updateCheckoutSummary() {
  const subtotal = cart.reduce((s,i) => s + i.price * i.qty, 0);
  const city = document.getElementById('co-city')?.value || SHIPPING_FROM.city;
  const district = document.getElementById('co-district')?.value || SHIPPING_FROM.district;
  const province = document.getElementById('co-province')?.value || SHIPPING_FROM.province;
  const shipping = calcShipping(subtotal, city, district, province);
  const total = subtotal + shipping;
  const set = (id, v) => { const el = document.getElementById(id); if (el) el.textContent = v; };
  set('co-subtotal', money(subtotal));
  set('co-shipping', shipping === 0 ? 'Free' : money(shipping));
  set('co-total', money(total));
}

async function placeOrder(user, formData) {
  const subtotal = cart.reduce((s,i) => s + i.price * i.qty, 0);
  const shipping = calcShipping(subtotal, formData.city, formData.district, formData.province);
  const total = subtotal + shipping;
  const orderId = 'ORD-' + Date.now().toString().slice(-8);
  const order = {
    orderId, uid: user.uid, email: user.email || '',
    fullName: formData.fullName, phone: formData.phone, address: formData.address,
    city: formData.city, district: formData.district, province: formData.province,
    items: cart.map(i => ({ id:i.id, name:i.name, size:i.size, color:i.color, qty:i.qty, price:i.price })),
    itemCount: cart.reduce((s,i) => s + i.qty, 0),
    subtotal, shipping, total,
    status: 'pending', paymentMethod: 'Cash on Delivery',
    createdAt: firebase.firestore.FieldValue.serverTimestamp()
  };
  try {
    await db.collection('orders').add(order);
    await db.collection('users').doc(user.uid).set({
      fullName: formData.fullName,
      firstName: formData.fullName.split(' ')[0] || '',
      lastName: formData.fullName.split(' ').slice(1).join(' ') || '',
      phone: formData.phone, address: formData.address,
      city: formData.city, district: formData.district, province: formData.province
    }, { merge: true });
    for (const item of cart) {
      try {
        const ref = db.collection('products').doc(item.id);
        const sn = await ref.get();
        if (sn.exists) await ref.update({ stock: Math.max(0, (sn.data().stock ?? 0) - item.qty) });
      } catch (e) {}
    }
    cart = [];
    saveCart();
    renderCart();
    document.getElementById('checkoutModal').classList.remove('show');
    document.body.style.overflow = '';
    document.getElementById('successOrderId').textContent = orderId;
    document.getElementById('successModal').classList.add('show');
    setTimeout(() => document.getElementById('successModal').classList.remove('show'), 8000);
    toast('Order placed successfully!');
  } catch (err) {
    console.error(err);
    toast('Could not place order. Try again.');
  }
}

/* ═══════ PROFILE PAGE ═══════ */
async function loadProfile(user) {
  const noAuth = document.getElementById('noAuth');
  if (!user) { if (noAuth) noAuth.hidden = false; return; }
  if (noAuth) noAuth.hidden = true;
  try {
    const snap = await db.collection('users').doc(user.uid).get();
    const d = snap.exists ? snap.data() : {};
    const set = (id, v) => { const el = document.getElementById(id); if (el) el.textContent = v || '—'; };
    set('profileName', `Hello, ${d.firstName || (user.displayName && user.displayName.split(' ')[0]) || 'there'}`);
    set('pf-name', `${d.firstName||''} ${d.lastName||''}`.trim() || '—');
    set('pf-email', user.email);
    set('pf-phone', d.phone);
    set('pf-provider', d.provider || 'password');
    set('pf-created', d.createdAt?.toDate ? d.createdAt.toDate().toLocaleDateString() : '—');
    set('pf-address', d.address); set('pf-city', d.city);
    set('pf-district', d.district); set('pf-province', d.province);
    const v = (id, val) => { const el = document.getElementById(id); if (el) el.value = val || ''; };
    v('ed-first', d.firstName); v('ed-last', d.lastName); v('ed-phone', d.phone);
    v('ed-address', d.address); v('ed-city', d.city);
    v('ed-district', d.district); v('ed-province', d.province);
  } catch (e) { console.error(e); }

  try {
    const snap = await db.collection('orders').where('uid', '==', user.uid).get();
    const orders = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }))
      .sort((a,b) => (b.createdAt?.seconds||0) - (a.createdAt?.seconds||0));
    renderProfileOrders(orders);
  } catch (e) { console.error(e); }
}

function renderProfileOrders(orders) {
  const c = document.getElementById('ordersContainer');
  if (!c) return;
  const ce = document.getElementById('ordersCount');
  const te = document.getElementById('ordersTotal');
  if (ce) ce.textContent = orders.length;
  if (te) te.textContent = money(orders.reduce((s,o) => s + (o.total||0), 0));

  if (!orders.length) {
    c.innerHTML = `<div class="empty-state">
      <svg viewBox="0 0 24 24" stroke-linecap="round" stroke-linejoin="round"><path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><path d="M3 6h18"/><path d="M16 10a4 4 0 0 1-8 0"/></svg>
      <h3>No orders yet</h3><p>Your order history will appear here.</p>
      <a href="shop.html" class="btn btn-silver">Start Shopping</a>
    </div>`;
    return;
  }
  const steps = ['pending','confirmed','dispatched','delivered'];
  const labels = ['Placed','Confirmed','Dispatched','Delivered'];
  c.innerHTML = orders.map(o => {
    const date = o.createdAt?.toDate ? o.createdAt.toDate().toLocaleDateString() : '—';
    const st = o.status || 'pending';
    let idx = steps.indexOf(st);
    if (st === 'cancelled') idx = -1;
    const bc = st === 'delivered' ? 'badge-yes' : (st === 'pending' ? 'badge-info' : (st === 'cancelled' ? 'badge-no' : 'badge-info'));
    const tp = idx >= 0 ? (idx / (steps.length - 1)) * 90 : 0;
    return `<div class="order-card">
      <div class="order-card-head">
        <div><h4>Order ${o.orderId}</h4><p class="oc-date">${date} · ${o.itemCount||0} item(s)</p></div>
        <div style="text-align:right"><div class="oc-total">${money(o.total)}</div><span class="${bc}">${st}</span></div>
      </div>
      <div class="order-track">
        <div class="order-track-fill" style="width:${tp}%"></div>
        ${steps.map((s,i) => {
          const cls = i <= idx ? (i === idx ? 'current' : 'done') : '';
          return `<div class="track-step ${cls}"><div class="track-dot">${i+1}</div><span>${labels[i]}</span></div>`;
        }).join('')}
      </div>
      <div class="order-card-actions"><button class="link-btn" data-view-order="${o.id}">View Details →</button></div>
    </div>`;
  }).join('');
  c.querySelectorAll('[data-view-order]').forEach(b =>
    b.addEventListener('click', () => showOrderDetail(b.dataset.viewOrder, orders)));
}

function showOrderDetail(id, orders) {
  const o = orders.find(x => x.id === id);
  if (!o) return;
  const modal = document.getElementById('orderDetailModal');
  if (!modal) return;
  document.getElementById('odTitle').textContent = `Order ${o.orderId}`;
  document.getElementById('odSub').textContent = o.createdAt?.toDate ? o.createdAt.toDate().toLocaleString() : '';
  const items = (o.items||[]).map(it => `
    <div class="order-item">
      <div><div class="nm">${it.name}</div><div class="vr">${it.size} · ${it.color}</div><div class="qt">Qty: ${it.qty}</div></div>
      <div><b>${money(it.price * it.qty)}</b></div>
    </div>`).join('');
  document.getElementById('odBody').innerHTML = `
    <div class="order-detail-block"><h4>Shipping Address</h4>
      <div class="row"><b>Name</b><span>${o.fullName||'—'}</span></div>
      <div class="row"><b>Phone</b><span>${o.phone||'—'}</span></div>
      <div class="row"><b>Address</b><span>${o.address||'—'}</span></div>
      <div class="row"><b>City</b><span>${o.city||'—'}</span></div>
      <div class="row"><b>District</b><span>${o.district||'—'}</span></div>
      <div class="row"><b>Province</b><span>${o.province||'—'}</span></div>
    </div>
    <div class="order-detail-block"><h4>Items</h4><div class="order-items-list">${items}</div></div>
    <div class="order-detail-block"><h4>Payment</h4>
      <div class="row"><b>Subtotal</b><span>${money(o.subtotal)}</span></div>
      <div class="row"><b>Shipping</b><span>${o.shipping === 0 ? 'Free' : money(o.shipping)}</span></div>
      <div class="row"><b>Total</b><span><b>${money(o.total)}</b></span></div>
      <div class="row"><b>Method</b><span>Cash on Delivery</span></div>
      <div class="row"><b>Status</b><span>${o.status||'pending'}</span></div>
    </div>`;
  modal.classList.add('show');
}

/* ═══════ TRACK PAGE ═══════ */
function renderTrackResult(order) {
  const c = document.getElementById('trackResult');
  if (!c) return;
  if (!order) {
    c.innerHTML = `<div class="access-msg" style="text-align:center">❌ No order found with that ID. Please check and try again.</div>`;
    return;
  }
  const steps = ['pending','confirmed','dispatched','delivered'];
  const labels = ['Placed','Confirmed','Dispatched','Delivered'];
  const st = order.status || 'pending';
  let idx = steps.indexOf(st);
  const cancelled = st === 'cancelled';
  const date = order.createdAt?.toDate ? order.createdAt.toDate().toLocaleString() : '—';

  c.innerHTML = `<div class="track-result">
    <h3 style="margin-bottom:8px">Order ${order.orderId}</h3>
    <p style="color:var(--text-muted);font-size:.9rem;margin-bottom:22px">Placed on ${date}</p>
    ${cancelled ? `<div style="text-align:center;padding:24px;background:rgba(224,106,106,.15);border-radius:14px;color:#E06A6A;font-weight:700">This order was cancelled</div>` :
      `<div class="track-steps">
        ${steps.map((s,i) => {
          const cls = i <= idx ? (i === idx ? 'current' : 'done') : '';
          return `<div class="track-step ${cls}"><div class="dot">${i+1}</div><span>${labels[i]}</span></div>`;
        }).join('')}
      </div>`}
    <div class="order-detail-block" style="margin-top:24px">
      <h4>Order Summary</h4>
      <div class="row"><b>Customer</b><span>${order.fullName||'—'}</span></div>
      <div class="row"><b>City</b><span>${order.city||'—'}</span></div>
      <div class="row"><b>Items</b><span>${order.itemCount||0}</span></div>
      <div class="row"><b>Total</b><span><b>${money(order.total)}</b></span></div>
      <div class="row"><b>Status</b><span>${st}</span></div>
    </div>
    <div class="order-detail-block">
      <h4>Items</h4>
      <div class="order-items-list">${(order.items||[]).map(it => `
        <div class="order-item"><div><div class="nm">${it.name}</div><div class="vr">${it.size} · ${it.color}</div><div class="qt">Qty: ${it.qty}</div></div><div><b>${money(it.price*it.qty)}</b></div></div>
      `).join('')}</div>
    </div>
  </div>`;
}

async function trackOrder() {
  const input = document.getElementById('trackInput');
  const c = document.getElementById('trackResult');
  if (!input || !c) return;
  const id = input.value.trim();
  if (!id) return toast('Please enter an Order ID');
  c.innerHTML = `<div class="table-empty">Searching…</div>`;
  try {
    const snap = await db.collection('orders').where('orderId', '==', id).limit(1).get();
    if (snap.empty) return renderTrackResult(null);
    const doc = snap.docs[0];
    renderTrackResult({ id: doc.id, ...doc.data() });
  } catch (e) {
    console.error(e);
    c.innerHTML = `<div class="access-msg" style="text-align:center">⚠️ Could not search. Try again.</div>`;
  }
}

/* ═══════ ADMIN — PRODUCTS ═══════ */
async function loadProducts() {
  const tbody = document.getElementById('productsTbody');
  if (!tbody) return;
  tbody.innerHTML = `<tr><td colspan="9" class="table-empty">Loading products…</td></tr>`;
  try {
    const snap = await db.collection('products').get();
    PRODUCTS = snap.docs.map(doc => {
      const d = doc.data();
      return {
        id: doc.id, name: d.name||'', gender: d.gender||'men', cat: d.cat||'shirts',
        price: Number(d.price)||0, oldPrice: d.oldPrice ? Number(d.oldPrice) : null,
        tag: d.tag||null, images: Array.isArray(d.images) ? d.images : (d.img ? [d.img] : []),
        desc: d.desc||'', sizes: Array.isArray(d.sizes) ? d.sizes : ['S','M','L','XL'],
        colors: Array.isArray(d.colors) ? d.colors : [{ name:'Navy', hex:'#0B1A30' }],
        fabric: d.fabric||'', care: d.care||'', sku: d.sku||'',
        inStock: d.inStock !== false, stock: d.stock ?? 50, lowStock: d.lowStock ?? 5,
        _ts: d.createdAt?.seconds || 0
      };
    });
    if (!PRODUCTS.length) PRODUCTS = [ ...FALLBACK_PRODUCTS ];
    renderProductsTable(PRODUCTS);
    updateAdminStats();
  } catch (e) {
    tbody.innerHTML = `<tr><td colspan="9" class="table-empty">Error: ${e.message}</td></tr>`;
  }
}

function renderProductsTable(list) {
  const tbody = document.getElementById('productsTbody');
  if (!tbody) return;
  if (!list.length) {
    tbody.innerHTML = `<tr><td colspan="9" class="table-empty">No products yet. Click "+ Add Product".</td></tr>`;
    return;
  }
  tbody.innerHTML = list.map((p, i) => {
    const thumb = (p.images && p.images[0])
      ? `<img src="${p.images[0]}" class="product-thumb" alt="${p.name}" onerror="this.style.display='none';this.nextElementSibling.style.display='grid'"><div class="product-thumb-ph" style="display:none">${p.name.charAt(0)}</div>`
      : `<div class="product-thumb-ph">${p.name.charAt(0)}</div>`;
    const sn = p.stock ?? 0;
    const ls = p.lowStock ?? 5;
    const sc = sn === 0 ? 'badge-no' : (sn <= ls ? 'badge-info' : 'badge-yes');
    const sl = sn === 0 ? 'Out' : `${sn} left`;
    return `<tr>
      <td>${i+1}</td>
      <td>${thumb}</td>
      <td><b>${p.name}</b></td>
      <td>${p.gender || '—'}</td>
      <td>${getCat(p.cat).label}</td>
      <td><b>${money(p.price)}</b></td>
      <td>${p.sku||'—'}</td>
      <td><span class="${sc}">${sl}</span></td>
      <td>
        <button class="action-btn edit" data-edit-product="${p.id}">Edit</button>
        <button class="action-btn delete" data-delete-product="${p.id}">Delete</button>
      </td>
    </tr>`;
  }).join('');
  tbody.querySelectorAll('[data-edit-product]').forEach(b =>
    b.addEventListener('click', () => openProductForm(b.dataset.editProduct)));
  tbody.querySelectorAll('[data-delete-product]').forEach(b =>
    b.addEventListener('click', async () => {
      const p = PRODUCTS.find(x => x.id === b.dataset.deleteProduct);
      if (!confirm(`Delete "${p?.name || 'this product'}"?`)) return;
      try {
        await db.collection('products').doc(b.dataset.deleteProduct).delete();
        toast('Product deleted');
        loadProducts();
      } catch (e) { toast('Could not delete'); }
    }));
}

/* ═══════ ADMIN — CATEGORIES ═══════ */
let allCategories = [];
async function loadCategories() {
  const tbody = document.getElementById('categoriesTbody');
  if (!tbody) return;
  tbody.innerHTML = `<tr><td colspan="7" class="table-empty">Loading categories…</td></tr>`;
  try {
    const snap = await db.collection('categories').get();
    allCategories = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    renderCategoriesTable(allCategories);
    updateAdminStats();
  } catch (e) {
    tbody.innerHTML = `<tr><td colspan="7" class="table-empty">Error: ${e.message}</td></tr>`;
  }
}

function renderCategoriesTable(list) {
  const tbody = document.getElementById('categoriesTbody');
  if (!tbody) return;
  if (!list.length) {
    tbody.innerHTML = `<tr><td colspan="7" class="table-empty">No categories yet. Click "+ Add Category".</td></tr>`;
    return;
  }
  tbody.innerHTML = list.map((c, i) => {
    const thumb = c.img
      ? `<img src="${c.img}" class="product-thumb" alt="${c.label}" onerror="this.style.display='none';this.nextElementSibling.style.display='grid'"><div class="product-thumb-ph" style="display:none">${(c.label||'?').charAt(0)}</div>`
      : `<div class="product-thumb-ph">${(c.label||'?').charAt(0)}</div>`;
    const count = PRODUCTS.filter(p => p.cat === c.id).length;
    return `<tr>
      <td>${i+1}</td>
      <td>${thumb}</td>
      <td><b>${c.label||c.id}</b></td>
      <td>${c.gender||'unisex'}</td>
      <td style="max-width:280px">${c.desc||c.sub||'—'}</td>
      <td><b>${count}</b></td>
      <td>
        <button class="action-btn edit" data-edit-cat="${c.id}">Edit</button>
        <button class="action-btn delete" data-delete-cat="${c.id}">Delete</button>
      </td>
    </tr>`;
  }).join('');
  tbody.querySelectorAll('[data-edit-cat]').forEach(b =>
    b.addEventListener('click', () => openCategoryForm(b.dataset.editCat)));
  tbody.querySelectorAll('[data-delete-cat]').forEach(b =>
    b.addEventListener('click', async () => {
      const c = allCategories.find(x => x.id === b.dataset.deleteCat);
      if (!confirm(`Delete category "${c?.label || 'this'}"?`)) return;
      try {
        await db.collection('categories').doc(b.dataset.deleteCat).delete();
        toast('Category deleted');
        loadCategories();
      } catch (e) { toast('Could not delete'); }
    }));
}

function openCategoryForm(id) {
  const modal = document.getElementById('categoryModal');
  if (!modal) return;
  const form = document.getElementById('categoryForm');
  form.reset();
  document.getElementById('categoryModalTitle').textContent = id ? 'Edit Category' : 'Add New Category';

  // Reset preview
  const prev = document.getElementById('catPreview');
  if (prev) {
    prev.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.4"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="m21 15-5-5L5 21"/></svg>`;
    prev.classList.remove('has-image');
  }

  if (id) {
    const c = allCategories.find(x => x.id === id);
    if (c) {
      document.getElementById('c-label').value = c.label || '';
      document.getElementById('c-gender').value = c.gender || 'unisex';
      document.getElementById('c-img').value = c.img || '';
      document.getElementById('c-desc').value = c.desc || c.sub || '';
      if (c.img) {
        const pv = document.getElementById('catPreview');
        if (pv) { pv.innerHTML = `<img src="${c.img}" alt="Preview">`; pv.classList.add('has-image'); }
      }
    }
    form.dataset.editId = id;
  } else {
    form.dataset.editId = '';
  }
  modal.classList.add('show');
}

async function saveCategory(e) {
  e.preventDefault();
  const form = document.getElementById('categoryForm');
  const editId = form.dataset.editId;
  const label = document.getElementById('c-label').value.trim();
  const gender = document.getElementById('c-gender').value;
  const imgRaw = document.getElementById('c-img').value.trim();
  const desc = document.getElementById('c-desc').value.trim();

  if (!label) return toast('Category name required');
  if (!gender) return toast('Select a gender');
  if (!imgRaw) return toast('Category image required');
  if (!desc) return toast('Description required');

  const baseUrl = window.location.origin + window.location.pathname.replace(/[^/]*$/, '') + 'images/';
  const img = imgRaw.startsWith('http') ? imgRaw : baseUrl + imgRaw;

  const slug = editId || label.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

  try {
    await db.collection('categories').doc(slug).set({
      label, gender, img, desc,
      updatedAt: firebase.firestore.FieldValue.serverTimestamp()
    }, { merge: true });
    toast(editId ? 'Category updated' : 'Category created');
    document.getElementById('categoryModal').classList.remove('show');
    // Refresh both categories and the CATEGORIES global map
    await loadCatalog();
    loadCategories();
  } catch (e) {
    console.error(e);
    toast('Could not save: ' + (e.code || e.message));
  }
}

/* ═══════ PRODUCT FORM ═══════ */
function fillCategoryDropdown() {
  const sel = document.getElementById('p-category');
  if (!sel) return;
  const cur = sel.value;
  const keys = Object.keys(CATEGORIES);
  sel.innerHTML = `<option value="">Select category…</option>` +
    keys.map(k => `<option value="${k}">${CATEGORIES[k].label} (${CATEGORIES[k].gender || 'unisex'})</option>`).join('');
  if (cur) sel.value = cur;
}

function openProductForm(id) {
  const modal = document.getElementById('productModal');
  if (!modal) return;
  if (!Object.keys(CATEGORIES).length) CATEGORIES = { ...FALLBACK_CATS };
  fillCategoryDropdown();
  const form = document.getElementById('productForm');
  form.reset();
  document.getElementById('productModalTitle').textContent = id ? 'Edit Product' : 'Add New Product';
  document.getElementById('productModalSub').textContent = id ? 'Update the details below' : 'Fill in the details below';

  [0,1,2].forEach(i => {
    const prev = document.getElementById('prev-' + i);
    if (prev) {
      prev.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.4"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="m21 15-5-5L5 21"/></svg><span>Image ${i+1}</span>`;
      prev.classList.remove('has-image');
    }
    const inp = document.getElementById('p-img' + (i+1));
    if (inp) inp.value = '';
  });

  if (id) {
    const p = PRODUCTS.find(x => x.id === id);
    if (p) {
      document.getElementById('p-name').value = p.name;
      document.getElementById('p-gender').value = p.gender || 'men';
      document.getElementById('p-category').value = p.cat;
      document.getElementById('p-price').value = p.price;
      document.getElementById('p-old').value = p.oldPrice || '';
      document.getElementById('p-tag').value = p.tag || '';
      document.getElementById('p-sizes').value = (p.sizes||[]).join(', ');
      document.getElementById('p-sku').value = p.sku || '';
      document.getElementById('p-colors').value = (p.colors||[]).map(c => `${c.name}:${c.hex}`).join(', ');
      document.getElementById('p-desc').value = p.desc || '';
      document.getElementById('p-fabric').value = p.fabric || '';
      document.getElementById('p-care').value = p.care || '';
      document.getElementById('p-instock').checked = p.inStock !== false;
      document.getElementById('p-stock').value = p.stock ?? 50;
      document.getElementById('p-lowstock').value = p.lowStock ?? 5;
      const imgs = p.images || [];
      for (let i = 0; i < 3; i++) {
        const inp = document.getElementById('p-img' + (i+1));
        if (inp && imgs[i]) {
          const fn = imgs[i].includes('/') ? imgs[i].split('/').pop() : imgs[i];
          inp.value = fn;
          const prev = document.getElementById('prev-' + i);
          if (prev) { prev.innerHTML = `<img src="${imgs[i]}" alt="Preview">`; prev.classList.add('has-image'); }
        }
      }
    }
    form.dataset.editId = id;
  } else {
    form.dataset.editId = '';
    document.getElementById('p-stock').value = 50;
    document.getElementById('p-lowstock').value = 5;
  }
  modal.classList.add('show');
}

function parseColors(str) {
  if (!str) return [];
  return str.split(',').map(s => s.trim()).filter(Boolean).map(pair => {
    const [n, h] = pair.split(':').map(s => s.trim());
    return { name: n || 'Default', hex: h || '#333333' };
  });
}

function parseImagesFromSlots(baseUrl) {
  const imgs = [];
  for (let i = 1; i <= 3; i++) {
    const v = document.getElementById('p-img' + i)?.value.trim();
    if (v) imgs.push(v.startsWith('http') ? v : baseUrl + v);
  }
  return imgs;
}

async function saveProduct(e) {
  e.preventDefault();
  const form = document.getElementById('productForm');
  const editId = form.dataset.editId;

  const name = document.getElementById('p-name').value.trim();
  const gender = document.getElementById('p-gender').value;
  const cat = document.getElementById('p-category').value;
  const price = Number(document.getElementById('p-price').value);
  const oldPrice = document.getElementById('p-old').value ? Number(document.getElementById('p-old').value) : null;
  const tag = document.getElementById('p-tag').value || null;
  const sizes = document.getElementById('p-sizes').value.split(',').map(s => s.trim()).filter(Boolean);
  const sku = document.getElementById('p-sku').value.trim();
  const colors = parseColors(document.getElementById('p-colors').value);
  const desc = document.getElementById('p-desc').value.trim();
  const fabric = document.getElementById('p-fabric').value.trim();
  const care = document.getElementById('p-care').value.trim();
  const inStock = document.getElementById('p-instock').checked;
  const stock = Number(document.getElementById('p-stock').value) || 0;
  const lowStock = Number(document.getElementById('p-lowstock').value) || 5;

  if (name.length < 2) return toast('Product name required');
  if (!gender) return toast('Select a gender');
  if (!cat) return toast('Select a category');
  if (!price || price < 0) return toast('Valid price required');

  const baseUrl = window.location.origin + window.location.pathname.replace(/[^/]*$/, '') + 'images/';
  const images = parseImagesFromSlots(baseUrl);

  const data = {
    name, gender, cat, price, oldPrice, tag, images, sizes, sku,
    colors: colors.length ? colors : [{ name:'Default', hex:'#333333' }],
    desc, fabric, care, inStock, stock, lowStock,
    updatedAt: firebase.firestore.FieldValue.serverTimestamp()
  };

  try {
    if (editId) {
      await db.collection('products').doc(editId).update(data);
      toast('Product updated');
    } else {
      data.createdAt = firebase.firestore.FieldValue.serverTimestamp();
      await db.collection('products').add(data);
      toast('Product added');
    }
    document.getElementById('productModal').classList.remove('show');
    loadProducts();
  } catch (e) {
    console.error(e);
    toast('Could not save: ' + (e.code || e.message));
  }
}

/* ═══════ ADMIN — ORDERS ═══════ */
async function loadOrders() {
  const tbody = document.getElementById('ordersTbody');
  if (!tbody) return;
  tbody.innerHTML = `<tr><td colspan="9" class="table-empty">Loading orders…</td></tr>`;
  try {
    const snap = await db.collection('orders').orderBy('createdAt', 'desc').get();
    allOrders = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    renderOrdersTable(allOrders);
    updateAdminStats();
  } catch (e) {
    tbody.innerHTML = `<tr><td colspan="9" class="table-empty">Error: ${e.message}</td></tr>`;
  }
}

function renderOrdersTable(list) {
  const tbody = document.getElementById('ordersTbody');
  if (!tbody) return;
  if (!list.length) {
    tbody.innerHTML = `<tr><td colspan="9" class="table-empty">No orders yet.</td></tr>`;
    return;
  }
  tbody.innerHTML = list.map((o, i) => {
    const date = o.createdAt?.toDate ? o.createdAt.toDate().toLocaleDateString() : '—';
    const st = o.status || 'pending';
    const c = st === 'delivered' ? 'badge-yes' : (st === 'cancelled' ? 'badge-no' : 'badge-info');
    return `<tr>
      <td>${i+1}</td>
      <td><b>${o.orderId||'—'}</b></td>
      <td>${date}</td>
      <td>${o.fullName||'—'}</td>
      <td>${o.phone||'—'}</td>
      <td>${o.city||'—'}</td>
      <td><b>${money(o.total)}</b></td>
      <td><span class="${c}">${st}</span></td>
      <td><button class="link-btn" data-view-order="${o.id}">View</button></td>
    </tr>`;
  }).join('');
  tbody.querySelectorAll('[data-view-order]').forEach(b =>
    b.addEventListener('click', () => showAdminOrder(b.dataset.viewOrder)));
}

function showAdminOrder(orderId) {
  const o = allOrders.find(x => x.id === orderId);
  if (!o) return;
  const modal = document.getElementById('adminOrderModal');
  if (!modal) return;
  currentOrderId = orderId;
  document.getElementById('aoTitle').textContent = `Order ${o.orderId}`;
  document.getElementById('aoSub').textContent = o.createdAt?.toDate ? o.createdAt.toDate().toLocaleString() : '—';
  const items = (o.items||[]).map(it => `
    <div class="order-item">
      <div><div class="nm">${it.name}</div><div class="vr">${it.size} · ${it.color}</div><div class="qt">Qty: ${it.qty}</div></div>
      <div><b>${money(it.price * it.qty)}</b></div>
    </div>`).join('');
  document.getElementById('aoBody').innerHTML = `
    <div class="order-detail-block"><h4>Customer & Shipping</h4>
      <div class="row"><b>Name</b><span>${o.fullName||'—'}</span></div>
      <div class="row"><b>Email</b><span>${o.email||'—'}</span></div>
      <div class="row"><b>Phone</b><span>${o.phone||'—'}</span></div>
      <div class="row"><b>Address</b><span>${o.address||'—'}</span></div>
      <div class="row"><b>City</b><span>${o.city||'—'}</span></div>
      <div class="row"><b>District</b><span>${o.district||'—'}</span></div>
      <div class="row"><b>Province</b><span>${o.province||'—'}</span></div>
    </div>
    <div class="order-detail-block"><h4>Items (${o.itemCount||0})</h4><div class="order-items-list">${items}</div></div>
    <div class="order-detail-block"><h4>Payment</h4>
      <div class="row"><b>Subtotal</b><span>${money(o.subtotal)}</span></div>
      <div class="row"><b>Shipping</b><span>${o.shipping === 0 ? 'Free' : money(o.shipping)}</span></div>
      <div class="row"><b>Total</b><span><b>${money(o.total)}</b></span></div>
      <div class="row"><b>Method</b><span>Cash on Delivery</span></div>
      <div class="row"><b>Status</b><span>${o.status||'pending'}</span></div>
    </div>`;
  modal.querySelectorAll('[data-status]').forEach(b =>
    b.classList.toggle('active-status', b.dataset.status === (o.status || 'pending')));
  modal.classList.add('show');
}

async function updateOrderStatus(st) {
  if (!currentOrderId) return;
  try {
    await db.collection('orders').doc(currentOrderId).update({
      status: st, updatedAt: firebase.firestore.FieldValue.serverTimestamp()
    });
    toast(`Order marked as ${st}`);
    loadOrders();
    setTimeout(() => showAdminOrder(currentOrderId), 400);
  } catch (e) { toast('Could not update status'); }
}

/* ═══════ ADMIN — USERS ═══════ */
async function loadUsers() {
  const tbody = document.getElementById('usersTbody');
  if (!tbody) return;
  tbody.innerHTML = `<tr><td colspan="8" class="table-empty">Loading users…</td></tr>`;
  try {
    const snap = await db.collection('users').orderBy('createdAt', 'desc').get();
    allUsers = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    renderUsersTable(allUsers);
    updateAdminStats();
  } catch (e) {
    tbody.innerHTML = `<tr><td colspan="8" class="table-empty">Error: ${e.message}</td></tr>`;
  }
}

function renderUsersTable(list) {
  const tbody = document.getElementById('usersTbody');
  if (!tbody) return;
  if (!list.length) {
    tbody.innerHTML = `<tr><td colspan="8" class="table-empty">No users yet.</td></tr>`;
    return;
  }
  tbody.innerHTML = list.map((u, i) => {
    const c = u.createdAt?.toDate ? u.createdAt.toDate().toLocaleDateString() : '—';
    const v = u.emailVerified ? '<span class="badge-yes">Yes</span>' : '<span class="badge-no">No</span>';
    const n = `${u.firstName||''} ${u.lastName||''}`.trim() || '—';
    return `<tr>
      <td>${i+1}</td>
      <td>${u.email||'—'}</td>
      <td>${n}</td>
      <td>${u.phone||'—'}</td>
      <td>${u.city||'—'}</td>
      <td>${v}</td>
      <td>${c}</td>
      <td><button class="link-btn" data-view-user="${u.uid||u.id}">View</button></td>
    </tr>`;
  }).join('');
  tbody.querySelectorAll('[data-view-user]').forEach(b =>
    b.addEventListener('click', () => showAdminUser(b.dataset.viewUser)));
}

function showAdminUser(uid) {
  const u = allUsers.find(x => (x.uid || x.id) === uid);
  if (!u) return;
  const modal = document.getElementById('adminUserModal');
  if (!modal) return;
  const n = `${u.firstName||''} ${u.lastName||''}`.trim() || '—';
  document.getElementById('auTitle').textContent = n;
  document.getElementById('auSub').textContent = u.email || '—';
  const uo = allOrders.filter(o => o.uid === uid);
  const oh = uo.length
    ? uo.map(o => `<div class="order-item"><div><div class="nm">${o.orderId} · ${money(o.total)}</div><div class="vr">${o.itemCount||0} items · ${o.city||'—'}</div><div class="qt">${o.createdAt?.toDate ? o.createdAt.toDate().toLocaleDateString() : '—'}</div></div><div><span class="${o.status==='delivered'?'badge-yes':'badge-info'}">${o.status||'pending'}</span></div></div>`).join('')
    : `<div style="text-align:center;padding:30px;color:var(--text-muted);font-style:italic;font-size:.9rem">No orders yet</div>`;
  document.getElementById('auBody').innerHTML = `
    <div class="order-detail-block"><h4>User Information</h4>
      <div class="row"><b>Name</b><span>${n}</span></div>
      <div class="row"><b>Email</b><span>${u.email||'—'}</span></div>
      <div class="row"><b>Phone</b><span>${u.phone||'—'}</span></div>
      <div class="row"><b>Address</b><span>${u.address||'—'}</span></div>
      <div class="row"><b>City</b><span>${u.city||'—'}</span></div>
      <div class="row"><b>District</b><span>${u.district||'—'}</span></div>
      <div class="row"><b>Province</b><span>${u.province||'—'}</span></div>
      <div class="row"><b>Provider</b><span>${u.provider||'password'}</span></div>
      <div class="row"><b>Verified</b><span>${u.emailVerified?'Yes':'No'}</span></div>
      <div class="row"><b>Joined</b><span>${u.createdAt?.toDate ? u.createdAt.toDate().toLocaleString() : '—'}</span></div>
    </div>
    <div class="order-detail-block"><h4>Orders (${uo.length})</h4><div class="order-items-list">${oh}</div></div>`;
  modal.classList.add('show');
}

function updateAdminStats() {
  const pc = document.getElementById('productCount'); if (pc) pc.textContent = PRODUCTS.length;
  const cc = document.getElementById('categoryCount'); if (cc) cc.textContent = allCategories.length || Object.keys(CATEGORIES).length;
  const oc = document.getElementById('orderCount'); if (oc) oc.textContent = allOrders.length;
  const uc = document.getElementById('userCount'); if (uc) uc.textContent = allUsers.length;
  const rt = document.getElementById('revenueTotal');
  if (rt) rt.textContent = money(allOrders.reduce((s,o) => s + (o.total||0), 0));
}

/* ═══════ ANALYTICS ═══════ */
function renderAnalytics() {
  const grid = document.getElementById('analyticsGrid');
  if (!grid) return;
  const now = new Date();
  const days = [];
  for (let i = 6; i >= 0; i--) { const d = new Date(now); d.setDate(now.getDate() - i); days.push(d); }
  const daily = days.map(d => {
    const key = d.toDateString();
    const dayOrders = allOrders.filter(o => o.createdAt?.toDate && o.createdAt.toDate().toDateString() === key);
    return { label: d.toLocaleDateString('en-US', { weekday:'short' }), count: dayOrders.length, revenue: dayOrders.reduce((s,o) => s + (o.total||0), 0) };
  });
  const maxRev = Math.max(...daily.map(d => d.revenue), 1);
  const bars = daily.map(d => `<div class="chart-bar" style="height:${Math.max(4, (d.revenue/maxRev)*100)}%" data-value="${money(d.revenue)} · ${d.count} order${d.count!==1?'s':''}"></div>`).join('');
  const labels = daily.map(d => `<div class="chart-label">${d.label}</div>`).join('');
  const productSales = {};
  allOrders.forEach(o => (o.items||[]).forEach(it => {
    if (!productSales[it.name]) productSales[it.name] = { qty:0, rev:0 };
    productSales[it.name].qty += it.qty;
    productSales[it.name].rev += it.price * it.qty;
  }));
  const top = Object.entries(productSales).map(([name, d]) => ({ name, ...d })).sort((a,b) => b.rev - a.rev).slice(0, 5);
  const citySales = {};
  allOrders.forEach(o => { const c = o.city || 'Unknown'; citySales[c] = (citySales[c]||0) + 1; });
  const topCities = Object.entries(citySales).map(([city, count]) => ({ city, count })).sort((a,b) => b.count - a.count).slice(0, 5);
  const avgOrder = allOrders.length ? Math.round(allOrders.reduce((s,o) => s + (o.total||0), 0) / allOrders.length) : 0;
  grid.innerHTML = `
    <div class="analytics-card">
      <h3>Revenue — Last 7 Days</h3>
      <p class="a-sub">Total: ${money(daily.reduce((s,d) => s + d.revenue, 0))}</p>
      <div class="chart-bars">${bars}</div>
      <div class="chart-labels">${labels}</div>
    </div>
    <div class="analytics-card">
      <h3>Key Metrics</h3>
      <p class="a-sub">Overall performance</p>
      <div class="stat-box" style="width:100%;margin-bottom:12px;border-color:var(--line)"><b>${allOrders.length}</b><span>Total Orders</span></div>
      <div class="stat-box" style="width:100%;margin-bottom:12px;border-color:var(--line)"><b>${money(avgOrder)}</b><span>Avg Order Value</span></div>
      <div class="stat-box" style="width:100%;border-color:var(--line)"><b>${allUsers.length}</b><span>Total Users</span></div>
    </div>
    <div class="analytics-card">
      <h3>Top Products</h3>
      <p class="a-sub">By revenue</p>
      <div class="top-list">${top.length ? top.map((t,i) => `<div class="top-item"><div class="top-rank">${i+1}</div><div><b>${t.name}</b><span>${t.qty} sold</span></div><div class="top-rev">${money(t.rev)}</div></div>`).join('') : '<div style="text-align:center;color:var(--text-soft);font-style:italic;padding:20px">No sales yet</div>'}</div>
    </div>
    <div class="analytics-card">
      <h3>Top Cities</h3>
      <p class="a-sub">By order count</p>
      <div class="top-list">${topCities.length ? topCities.map((c,i) => `<div class="top-item"><div class="top-rank">${i+1}</div><div><b>${c.city}</b><span>orders</span></div><div class="top-rev">${c.count}</div></div>`).join('') : '<div style="text-align:center;color:var(--text-soft);font-style:italic;padding:20px">No data yet</div>'}</div>
    </div>`;
}

/* ═══════ CSV EXPORT ═══════ */
function exportCSV(filename, headers, rows) {
  if (!rows.length) return toast('Nothing to export');
  const csv = [headers, ...rows].map(r => r.map(v => `"${String(v).replace(/"/g,'""')}"`).join(',')).join('\n');
  const blob = new Blob([csv], { type:'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${filename}-${Date.now()}.csv`;
  a.click();
  URL.revokeObjectURL(url);
  toast('Exported successfully');
}

/* ═══════ BOOT ═══════ */
const page = document.body.dataset.page;

(async function boot() {
  loadLocalCart();
  await loadCatalog();
  const user = await authReady;

  if (page === 'home') {
    renderCategoryTiles();
    renderFiltersHome();
    renderProducts('all', 'featured');
    const filters = document.getElementById('filters');
    if (filters) filters.addEventListener('click', e => {
      const chip = e.target.closest('.chip');
      if (!chip) return;
      filters.querySelectorAll('.chip').forEach(c => c.classList.remove('active'));
      chip.classList.add('active');
      currentFilter = chip.dataset.filter;
      renderProducts(currentFilter, currentSort);
    });
    const sortSel = document.getElementById('sortSelect');
    if (sortSel) sortSel.addEventListener('change', () => {
      currentSort = sortSel.value;
      renderProducts(currentFilter, currentSort);
    });
  }

  if (page === 'shop') {
    renderShopPage();
    const sortSel = document.getElementById('sortSelect');
    if (sortSel) sortSel.addEventListener('change', () => {
      currentSort = sortSel.value;
      const params = new URLSearchParams(window.location.search);
      window.location.href = 'shop.html?' + params.toString();
    });
  }

  if (page === 'track') {
    const btn = document.getElementById('trackBtn');
    const inp = document.getElementById('trackInput');
    if (btn) btn.addEventListener('click', trackOrder);
    if (inp) inp.addEventListener('keydown', e => { if (e.key === 'Enter') trackOrder(); });
    const urlId = getUrlParam('id');
    if (urlId && inp) { inp.value = urlId; trackOrder(); }
  }

  if (page === 'profile') loadProfile(user);

  if (page === 'admin') {
    const adminList = (document.body.dataset.admin || '').split(',').map(s => s.trim().toLowerCase()).filter(Boolean);
    if (!user) {
      const msg = document.getElementById('accessMsg');
      if (msg) msg.hidden = false;
      setTimeout(() => { alert('Access denied. Please sign in with your admin account.'); window.location.href = 'index.html'; }, 400);
      return;
    }
    const email = (user.email || '').toLowerCase();
    if (!adminList.includes(email)) {
      alert('Access denied. This dashboard is for admins only.');
      window.location.href = 'index.html';
      return;
    }
    await loadProducts();
    await loadCategories();
    await loadOrders();
    await loadUsers();
  }
})();

function renderFiltersHome() {
  const el = document.getElementById('filters');
  if (!el) return;
  el.innerHTML = `<button class="chip active" data-filter="all">All</button>` +
    Object.keys(CATEGORIES).map(k => `<button class="chip" data-filter="${k}">${CATEGORIES[k].label}</button>`).join('');
}

/* ═══════ GLOBAL EVENTS ═══════ */
document.addEventListener('click', e => {
  if (e.target.closest('#cartBtn')) { openCart(); return; }
  if (e.target.closest('#cartClose')) { closeCart(); return; }
  if (e.target.id === 'overlay') { closeCart(); return; }

  if (e.target.closest('#searchToggle')) { openSearch(); return; }
  if (e.target.closest('#searchClose')) { closeSearch(); return; }
  if (e.target.id === 'searchOverlay') { closeSearch(); return; }

  if (e.target.closest('#accountBtn')) { openAuth('login'); return; }
  if (e.target.closest('#modalClose')) { closeAuth(); return; }
  if (e.target.id === 'authModal') { closeAuth(); return; }

  const tabBtn = e.target.closest('.tabs button');
  if (tabBtn) { switchTab(tabBtn.dataset.tab); return; }

  const quickBtn = e.target.closest('[data-quick]');
  if (quickBtn) {
    e.stopPropagation();
    const p = PRODUCTS.find(x => x.id === quickBtn.dataset.quick);
    if (!p) return;
    if (!p.inStock || p.stock <= 0) return toast('Out of stock');
    addToCart(p, p.sizes[0], p.colors[0].name, 1);
    const orig = quickBtn.textContent;
    quickBtn.textContent = 'Added ✓';
    quickBtn.classList.add('added');
    setTimeout(() => { quickBtn.textContent = orig; quickBtn.classList.remove('added'); }, 1400);
    return;
  }

  const card = e.target.closest('.card');
  if (card && card.dataset.id) { openDetail(card.dataset.id); return; }

  const inc = e.target.closest('[data-cart-inc]');
  if (inc) {
    const f = cart.find(i => lineKey(i) === inc.dataset.cartInc);
    if (f) { f.qty++; saveCart(); renderCart(); }
    return;
  }
  const dec = e.target.closest('[data-cart-dec]');
  if (dec) {
    const i = cart.findIndex(x => lineKey(x) === dec.dataset.cartDec);
    if (i > -1) {
      if (cart[i].qty > 1) cart[i].qty--;
      else cart.splice(i, 1);
      saveCart(); renderCart();
    }
    return;
  }
  const rem = e.target.closest('[data-cart-remove]');
  if (rem) {
    cart = cart.filter(i => lineKey(i) !== rem.dataset.cartRemove);
    saveCart(); renderCart();
    return;
  }

  const sr = e.target.closest('[data-search-id]');
  if (sr) { closeSearch(); openDetail(sr.dataset.searchId); return; }

  if (e.target.closest('#imgPrev')) { showImageIndex(currentDetail.index - 1); return; }
  if (e.target.closest('#imgNext')) { showImageIndex(currentDetail.index + 1); return; }
  const thumb = e.target.closest('[data-thumb]');
  if (thumb) { showImageIndex(Number(thumb.dataset.thumb)); return; }

  if (e.target.closest('#detailClose') || e.target.id === 'detailModal') {
    document.getElementById('detailModal')?.classList.remove('show');
    document.body.style.overflow = '';
    return;
  }

  const sz = e.target.closest('#detailSizes [data-size]');
  if (sz) {
    currentDetail.size = sz.dataset.size;
    document.querySelectorAll('#detailSizes .opt-btn').forEach(b => b.classList.toggle('active', b === sz));
    return;
  }
  const cl = e.target.closest('#detailColors [data-color]');
  if (cl) {
    currentDetail.color = cl.dataset.color;
    document.querySelectorAll('#detailColors .color-btn').forEach(b => b.classList.toggle('active', b === cl));
    return;
  }
  if (e.target.id === 'qtyMinus') { if (currentDetail.qty > 1) currentDetail.qty--; const q = document.getElementById('qtyValue'); if(q) q.textContent = currentDetail.qty; return; }
  if (e.target.id === 'qtyPlus') { currentDetail.qty++; const q = document.getElementById('qtyValue'); if(q) q.textContent = currentDetail.qty; return; }
  if (e.target.closest('#detailAddBtn')) {
    if (currentDetail.product) {
      addToCart(currentDetail.product, currentDetail.size, currentDetail.color, currentDetail.qty);
      document.getElementById('detailModal')?.classList.remove('show');
      document.body.style.overflow = '';
    }
    return;
  }

  if (e.target.closest('[data-size-guide]')) {
    e.preventDefault();
    document.getElementById('sizeGuideModal')?.classList.add('show');
    return;
  }
  if (e.target.id === 'sizeGuideClose' || e.target.id === 'sizeGuideModal') {
    document.getElementById('sizeGuideModal')?.classList.remove('show');
    return;
  }

  if (e.target.closest('#checkoutBtn')) {
    if (!cart.length) return toast('Your bag is empty');
    openCheckout();
    return;
  }
  if (e.target.closest('#checkoutClose')) { closeCheckout(); return; }
  if (e.target.id === 'checkoutModal') { closeCheckout(); return; }
  if (e.target.id === 'successModal' || e.target.closest('#successModal .btn')) {
    document.getElementById('successModal')?.classList.remove('show');
    return;
  }

  if (e.target.closest('#orderDetailClose') || e.target.id === 'orderDetailModal') {
    document.getElementById('orderDetailModal')?.classList.remove('show');
    return;
  }

  if (e.target.closest('#addProductBtn')) { openProductForm(); return; }
  if (e.target.closest('#productModalClose') || e.target.closest('#productCancelBtn')) {
    document.getElementById('productModal')?.classList.remove('show');
    return;
  }
  if (e.target.id === 'productModal') {
    document.getElementById('productModal')?.classList.remove('show');
    return;
  }

  if (e.target.closest('#addCategoryBtn')) { openCategoryForm(); return; }
  if (e.target.closest('#categoryModalClose') || e.target.closest('#categoryCancelBtn')) {
    document.getElementById('categoryModal')?.classList.remove('show');
    return;
  }
  if (e.target.id === 'categoryModal') {
    document.getElementById('categoryModal')?.classList.remove('show');
    return;
  }

  const sb = e.target.closest('[data-status]');
  if (sb && sb.classList.contains('action-btn')) { updateOrderStatus(sb.dataset.status); return; }

  if (e.target.closest('#adminOrderClose') || e.target.id === 'adminOrderModal') {
    document.getElementById('adminOrderModal')?.classList.remove('show');
    return;
  }
  if (e.target.closest('#adminUserClose') || e.target.id === 'adminUserModal') {
    document.getElementById('adminUserModal')?.classList.remove('show');
    return;
  }

  const adminTab = e.target.closest('.admin-tab');
  if (adminTab) {
    document.querySelectorAll('.admin-tab').forEach(t => t.classList.remove('active'));
    adminTab.classList.add('active');
    const w = adminTab.dataset.tab;
    ['products','categories','orders','users','analytics'].forEach(p => {
      const el = document.getElementById('panel-' + p);
      if (el) el.hidden = w !== p;
    });
    if (w === 'analytics') renderAnalytics();
    return;
  }

  if (e.target.closest('#editProfileBtn')) { document.getElementById('editModal')?.classList.add('show'); return; }
  if (e.target.closest('#editClose')) { document.getElementById('editModal')?.classList.remove('show'); return; }
});

/* ═══════ INPUT EVENTS ═══════ */
document.addEventListener('input', e => {
  if (e.target.id === 'searchInput') performSearch(e.target.value);

  if (e.target.classList.contains('img-filename')) {
    const slot = e.target.dataset.slot;
    const val = e.target.value.trim();
    const prev = document.getElementById('prev-' + slot);
    if (!prev) return;
    if (val) {
      const baseUrl = window.location.origin + window.location.pathname.replace(/[^/]*$/, '') + 'images/';
      const src = val.startsWith('http') ? val : baseUrl + val;
      prev.innerHTML = `<img src="${src}" alt="Preview" onerror="this.src='data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 24 24%22 fill=%22none%22 stroke=%22%23999%22%3E%3Crect x=%223%22 y=%223%22 width=%2218%22 height=%2218%22 rx=%222%22/%3E%3C/svg%3E'">`;
      prev.classList.add('has-image');
    } else {
      prev.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.4"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="m21 15-5-5L5 21"/></svg><span>Image ${Number(slot)+1}</span>`;
      prev.classList.remove('has-image');
    }
  }

  // Category image preview
  if (e.target.id === 'c-img') {
    const val = e.target.value.trim();
    const prev = document.getElementById('catPreview');
    if (!prev) return;
    if (val) {
      const baseUrl = window.location.origin + window.location.pathname.replace(/[^/]*$/, '') + 'images/';
      const src = val.startsWith('http') ? val : baseUrl + val;
      prev.innerHTML = `<img src="${src}" alt="Preview" onerror="this.src='data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 24 24%22 fill=%22none%22 stroke=%22%23999%22%3E%3Crect x=%223%22 y=%223%22 width=%2218%22 height=%2218%22 rx=%222%22/%3E%3C/svg%3E'">`;
      prev.classList.add('has-image');
    } else {
      prev.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.4"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="m21 15-5-5L5 21"/></svg>`;
      prev.classList.remove('has-image');
    }
  }

  if (['co-city','co-district','co-province'].includes(e.target.id)) updateCheckoutSummary();

  if (e.target.id === 'productSearch') {
    const q = e.target.value.toLowerCase().trim();
    const f = PRODUCTS.filter(p =>
      p.name.toLowerCase().includes(q) ||
      (p.sku||'').toLowerCase().includes(q) ||
      (getCat(p.cat).label||'').toLowerCase().includes(q));
    renderProductsTable(f);
  }
  if (e.target.id === 'categorySearch') {
    const q = e.target.value.toLowerCase().trim();
    const f = allCategories.filter(c =>
      (c.label||'').toLowerCase().includes(q) ||
      (c.desc||c.sub||'').toLowerCase().includes(q) ||
      (c.gender||'').toLowerCase().includes(q));
    renderCategoriesTable(f);
  }
  if (e.target.id === 'orderSearch') {
    const q = e.target.value.toLowerCase().trim();
    const f = allOrders.filter(o =>
      (o.orderId||'').toLowerCase().includes(q) ||
      (o.fullName||'').toLowerCase().includes(q) ||
      (o.phone||'').toLowerCase().includes(q) ||
      (o.city||'').toLowerCase().includes(q));
    renderOrdersTable(f);
  }
  if (e.target.id === 'userSearch') {
    const q = e.target.value.toLowerCase().trim();
    const f = allUsers.filter(u =>
      (u.email||'').toLowerCase().includes(q) ||
      (u.firstName||'').toLowerCase().includes(q) ||
      (u.lastName||'').toLowerCase().includes(q) ||
      (u.phone||'').toLowerCase().includes(q));
    renderUsersTable(f);
  }
});

/* ═══════ SEARCH ═══════ */
function openSearch() {
  document.getElementById('searchOverlay')?.classList.add('show');
  document.body.style.overflow = 'hidden';
  setTimeout(() => document.getElementById('searchInput')?.focus(), 100);
}
function closeSearch() {
  document.getElementById('searchOverlay')?.classList.remove('show');
  document.body.style.overflow = '';
  const r = document.getElementById('searchResults');
  if (r) { r.classList.remove('show'); r.innerHTML = ''; }
  const i = document.getElementById('searchInput');
  if (i) i.value = '';
}
function performSearch(q) {
  const r = document.getElementById('searchResults');
  if (!r) return;
  const term = q.trim().toLowerCase();
  if (!term) { r.classList.remove('show'); return; }
  const matches = PRODUCTS.filter(p =>
    p.name.toLowerCase().includes(term) ||
    (p.desc||'').toLowerCase().includes(term) ||
    (p.sku||'').toLowerCase().includes(term) ||
    getCat(p.cat).label.toLowerCase().includes(term));
  if (!matches.length) {
    r.innerHTML = `<div class="search-empty">No products match "${q}"</div>`;
    r.classList.add('show');
    return;
  }
  r.innerHTML = matches.map(p => `
    <div class="search-result" data-search-id="${p.id}">
      ${(p.images && p.images[0]) ? `<img src="${p.images[0]}" alt="${p.name}">` : `<div class="product-thumb-ph">${p.name.charAt(0)}</div>`}
      <div class="sr-info"><div class="sr-name">${p.name}</div><div class="sr-price">${money(p.price)}</div></div>
    </div>`).join('');
  r.classList.add('show');
}

/* ═══════ AUTH MODAL ═══════ */
function openAuth(tab = 'login') {
  document.getElementById('authModal')?.classList.add('show');
  document.body.style.overflow = 'hidden';
  switchTab(tab);
}
function closeAuth() {
  document.getElementById('authModal')?.classList.remove('show');
  document.body.style.overflow = '';
}
function switchTab(tab) {
  document.querySelectorAll('.tabs button').forEach(b => b.classList.toggle('active', b.dataset.tab === tab));
  const lf = document.getElementById('loginForm'); if (lf) lf.hidden = tab !== 'login';
  const sf = document.getElementById('signupForm'); if (sf) sf.hidden = tab !== 'signup';
}

/* ═══════ FORM HANDLERS ═══════ */
const loginForm = document.getElementById('loginForm');
if (loginForm) loginForm.addEventListener('submit', async e => {
  e.preventDefault();
  const email = document.getElementById('li-email').value.trim();
  const pass = document.getElementById('li-pass').value;
  const btn = document.getElementById('loginBtn');
  if (!isEmail(email)) return toast('Enter a valid email');
  if (pass.length < 6) return toast('Password must be 6+ characters');
  btn.classList.add('loading'); btn.textContent = 'Signing in...';
  try {
    const cred = await auth.signInWithEmailAndPassword(email, pass);
    const user = cred.user;
    if (user.providerData[0].providerId === 'password' && !user.emailVerified) {
      await auth.signOut();
      toast('Please verify your email first.');
      return;
    }
    await saveUserToFirestore(user);
    closeAuth();
    toast(`Welcome back, ${user.email}`);
    loginForm.reset();
  } catch (err) { handleAuthError(err); }
  finally { btn.classList.remove('loading'); btn.textContent = 'Sign In'; }
});

const signupForm = document.getElementById('signupForm');
if (signupForm) signupForm.addEventListener('submit', async e => {
  e.preventDefault();
  const email = document.getElementById('su-email').value.trim();
  const pass = document.getElementById('su-pass').value;
  const pass2 = document.getElementById('su-pass2').value;
  const terms = document.getElementById('su-terms');
  const btn = document.getElementById('signupBtn');
  if (!isEmail(email)) return toast('Enter a valid email');
  if (pass.length < 6) return toast('Password must be 6+ characters');
  if (pass !== pass2) return toast('Passwords do not match');
  if (terms && !terms.checked) return toast('Please accept the Terms');
  btn.classList.add('loading'); btn.textContent = 'Creating...';
  try {
    const cred = await auth.createUserWithEmailAndPassword(email, pass);
    const user = cred.user;
    await saveUserToFirestore(user);
    await user.sendEmailVerification();
    await auth.signOut();
    closeAuth();
    toast('Verification email sent! Check your inbox.');
    signupForm.reset();
    switchTab('login');
  } catch (err) { handleAuthError(err); }
  finally { btn.classList.remove('loading'); btn.textContent = 'Create Account'; }
});

document.querySelectorAll('[data-social="Google"]').forEach(btn => {
  btn.addEventListener('click', async () => {
    const provider = new firebase.auth.GoogleAuthProvider();
    provider.setCustomParameters({ prompt: 'select_account' });
    try {
      const result = await auth.signInWithPopup(provider);
      await saveUserToFirestore(result.user);
      closeAuth();
      toast(`Signed in as ${result.user.displayName || result.user.email}`);
    } catch (err) {
      if (err.code === 'auth/popup-closed-by-user') return;
      if (err.code === 'auth/popup-blocked') return toast('Popup blocked. Allow popups.');
      handleAuthError(err);
    }
  });
});
document.querySelectorAll('[data-social="Apple"]').forEach(btn =>
  btn.addEventListener('click', () => toast('Apple sign-in coming soon')));

const forgotBtn = document.getElementById('forgotPass');
if (forgotBtn) forgotBtn.addEventListener('click', async e => {
  e.preventDefault();
  const email = document.getElementById('li-email').value.trim();
  if (!isEmail(email)) return toast('Enter your email above first.');
  try { await auth.sendPasswordResetEmail(email); toast('Password reset email sent.'); }
  catch (err) { handleAuthError(err); }
});

function handleAuthError(err) {
  const code = err.code || '';
  const msgs = {
    'auth/user-not-found':'No account found with this email.',
    'auth/wrong-password':'Incorrect password.',
    'auth/invalid-credential':'Incorrect email or password.',
    'auth/invalid-email':'Invalid email address.',
    'auth/email-already-in-use':'This email is already registered.',
    'auth/weak-password':'Password too weak.',
    'auth/too-many-requests':'Too many attempts. Try again later.',
    'auth/network-request-failed':'Network error.',
    'auth/operation-not-allowed':'Sign-in method not enabled.',
    'auth/unauthorized-domain':'Domain not authorized.'
  };
  toast(msgs[code] || 'Something went wrong.');
  console.error(err);
}

/* ═══════ CHECKOUT FORM ═══════ */
const checkoutForm = document.getElementById('checkoutForm');
if (checkoutForm) checkoutForm.addEventListener('submit', async e => {
  e.preventDefault();
  const nameEl = document.getElementById('co-name');
  const phoneEl = document.getElementById('co-phone');
  const cityEl = document.getElementById('co-city');
  const distEl = document.getElementById('co-district');
  const provEl = document.getElementById('co-province');
  const addrEl = document.getElementById('co-address');
  const btn = document.getElementById('placeOrderBtn');

  if (nameEl.value.trim().length < 2) return toast('Enter your full name');
  if (!isPhone(phoneEl.value)) return toast('Enter a valid 03XX number');
  if (cityEl.value.trim().length < 2) return toast('City required');
  if (distEl.value.trim().length < 2) return toast('District required');
  if (!provEl.value) return toast('Select a province');
  if (addrEl.value.trim().length < 5) return toast('Enter your full address');

  const formData = {
    fullName: nameEl.value.trim(),
    phone: phoneEl.value.trim(),
    address: addrEl.value.trim(),
    city: cityEl.value.trim(),
    district: distEl.value.trim(),
    province: provEl.value
  };

  if (!auth.currentUser) {
    closeCheckout();
    openAuth('signup');
    toast('Sign in to place your order');
    return;
  }
  btn.classList.add('loading'); btn.textContent = 'Placing...';
  await placeOrder(auth.currentUser, formData);
  btn.classList.remove('loading'); btn.textContent = 'Place Order — Cash on Delivery';
  checkoutForm.reset();
});

function closeCheckout() {
  document.getElementById('checkoutModal')?.classList.remove('show');
  document.body.style.overflow = '';
}

/* ═══════ EDIT PROFILE FORM ═══════ */
const editForm = document.getElementById('editForm');
if (editForm) editForm.addEventListener('submit', async e => {
  e.preventDefault();
  const user = auth.currentUser;
  if (!user) return;
  const data = {
    firstName: document.getElementById('ed-first').value.trim(),
    lastName: document.getElementById('ed-last').value.trim(),
    phone: document.getElementById('ed-phone').value.trim(),
    address: document.getElementById('ed-address').value.trim(),
    city: document.getElementById('ed-city').value.trim(),
    district: document.getElementById('ed-district').value.trim(),
    province: document.getElementById('ed-province').value
  };
  try {
    await db.collection('users').doc(user.uid).set(data, { merge: true });
    await user.updateProfile({ displayName: `${data.firstName} ${data.lastName}`.trim() });
    document.getElementById('editModal')?.classList.remove('show');
    toast('Profile updated');
    loadProfile(user);
  } catch (err) { toast('Could not save'); }
});

/* ═══════ PRODUCT/CATEGORY FORM SUBMIT ═══════ */
const productForm = document.getElementById('productForm');
if (productForm) productForm.addEventListener('submit', saveProduct);
const categoryForm = document.getElementById('categoryForm');
if (categoryForm) categoryForm.addEventListener('submit', saveCategory);

/* ═══════ ADMIN REFRESH BUTTONS ═══════ */
if (document.getElementById('refreshProducts')) document.getElementById('refreshProducts').addEventListener('click', loadProducts);
if (document.getElementById('refreshCategories')) document.getElementById('refreshCategories').addEventListener('click', loadCategories);
if (document.getElementById('refreshOrders')) document.getElementById('refreshOrders').addEventListener('click', loadOrders);
if (document.getElementById('refreshUsers')) document.getElementById('refreshUsers').addEventListener('click', loadUsers);

/* ═══════ CSV EXPORT BUTTONS ═══════ */
if (document.getElementById('exportOrders')) document.getElementById('exportOrders').addEventListener('click', () => {
  const h = ['Order ID','Date','Customer','Email','Phone','Address','City','District','Province','Items','Subtotal','Shipping','Total','Status'];
  const r = allOrders.map(o => [
    o.orderId||'', o.createdAt?.toDate ? o.createdAt.toDate().toISOString() : '',
    o.fullName||'', o.email||'', o.phone||'', o.address||'',
    o.city||'', o.district||'', o.province||'',
    o.itemCount||0, o.subtotal||0, o.shipping||0, o.total||0, o.status||'pending'
  ]);
  exportCSV('coolism-orders', h, r);
});
if (document.getElementById('exportUsers')) document.getElementById('exportUsers').addEventListener('click', () => {
  const h = ['UID','Email','Name','Phone','City','District','Province','Provider','Verified','Joined'];
  const r = allUsers.map(u => [
    u.uid||u.id, u.email||'', `${u.firstName||''} ${u.lastName||''}`.trim(),
    u.phone||'', u.city||'', u.district||'', u.province||'',
    u.provider||'', u.emailVerified?'Yes':'No',
    u.createdAt?.toDate ? u.createdAt.toDate().toISOString() : ''
  ]);
  exportCSV('coolism-users', h, r);
});

/* ═══════ NEWSLETTER ═══════ */
const newsForm = document.getElementById('newsForm');
if (newsForm) newsForm.addEventListener('submit', e => {
  e.preventDefault();
  const input = e.target.querySelector('input');
  if (!isEmail(input.value)) return toast('Please enter a valid email');
  toast("You're on the list!");
  input.value = '';
});

/* ═══════ HEADER SCROLL ═══════ */
const navWrap = document.getElementById('navWrap');
if (navWrap) window.addEventListener('scroll', () => {
  navWrap.classList.toggle('scrolled', window.scrollY > 20);
}, { passive: true });

/* ═══════ MARQUEE DUPLICATE ═══════ */
const mq = document.getElementById('marquee');
if (mq) mq.innerHTML += mq.innerHTML;

/* ═══════ ESC KEY ═══════ */
document.addEventListener('keydown', e => {
  if (e.key === 'Escape') {
    closeCart(); closeAuth(); closeSearch(); closeCheckout();
    ['detailModal','productModal','categoryModal','sizeGuideModal','orderDetailModal','adminOrderModal','adminUserModal','editModal','successModal']
      .forEach(id => { const el = document.getElementById(id); if (el) el.classList.remove('show'); });
    document.body.style.overflow = '';
  }
});