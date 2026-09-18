/* ═══════════════════════════════════════════════════════════
   COOLISM — Complete App Logic
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

/* ═══════ HERO BANNER FILES ═══════ */
const PC_BANNER = 'Banner1.jpg';
const MOBILE_BANNER = 'banner111.jpg';

/* ═══════ STATE ═══════ */
let PRODUCTS = [];
let CATEGORIES = {};
let cart = [];
let allUsers = [];
let allOrders = [];
let allCategories = [];
let allBanners = [];
let currentBannerId = null;
let currentDetail = { product:null, size:null, color:null, qty:1, images:[], index:0 };
let currentSort = 'featured';
let currentOrderId = null;
let shopGender = null;
let shopCat = null;

const SHIPPING_FROM = { city: 'Jaranwala', district: 'Faisalabad', province: 'Punjab' };
const SHIPPING_RATES = { sameCity:150, sameDistrict:200, sameProvince:250, other:300, freeThreshold:5000 };

const money = n => 'Rs ' + Number(n || 0).toLocaleString('en-PK');
const isEmail = v => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.trim());
const isPhone = v => /^03\d{9}$/.test(v.replace(/[\s-]/g, ''));

function buildImageUrl(filenameOrUrl) {
  if (!filenameOrUrl) return '';
  const v = String(filenameOrUrl).trim();
  if (v.startsWith('http')) return v;
  const base = window.location.origin + window.location.pathname.replace(/[^/]*$/, '');
  return base + 'images/' + v;
}

/* ═══════ CACHE (5 min) ═══════ */
const CACHE_TTL = 5 * 60 * 1000;
const CACHE_KEY = 'coolism_cache_v1';

function getCache(key) {
  try {
    const raw = localStorage.getItem(CACHE_KEY + '_' + key);
    if (!raw) return null;
    const obj = JSON.parse(raw);
    if (Date.now() - obj.time > CACHE_TTL) {
      localStorage.removeItem(CACHE_KEY + '_' + key);
      return null;
    }
    return obj.data;
  } catch (e) { return null; }
}

function setCache(key, data) {
  try {
    localStorage.setItem(CACHE_KEY + '_' + key, JSON.stringify({ time: Date.now(), data }));
  } catch (e) {}
}

/* ═══════ FALLBACK CATEGORIES ═══════ */
const FALLBACK_CATS = {
  shirts:   { label:'Shirts',        gender:'men',   desc:'Casual & formal shirts',           img:'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=600&q=60&auto=format' },
  pants:    { label:'Pants',         gender:'men',   desc:'Chinos, cargos & formal',          img:'https://images.unsplash.com/photo-1624378439575-d8705ad7ae80?w=600&q=60&auto=format' },
  jackets:  { label:'Jackets',       gender:'men',   desc:'Bombers & leather',                img:'https://images.unsplash.com/photo-1551028719-00167b16eac5?w=600&q=60&auto=format' },
  hoodies:  { label:'Hoodies',       gender:'men',   desc:'Oversized comfort',                img:'https://images.unsplash.com/photo-1556821840-3a63f95609a7?w=600&q=60&auto=format' },
  suits2:   { label:'2-Piece Suits', gender:'women', desc:'Coordinated two-piece sets',       img:'https://images.unsplash.com/photo-1583391733956-6c78276477e2?w=600&q=60&auto=format' },
  suits3:   { label:'3-Piece Suits', gender:'women', desc:'Embroidered three-piece',          img:'https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=600&q=60&auto=format' },
  kurtis:   { label:'Kurtis',        gender:'women', desc:'Daily & formal kurtis',            img:'https://images.unsplash.com/photo-1583391733975-a6a3a6c6c4d1?w=600&q=60&auto=format' },
  purses:   { label:'Purses',        gender:'women', desc:'Leather & mini totes',             img:'https://images.unsplash.com/photo-1584917865442-de89df76afd3?w=600&q=60&auto=format' }
};

const FALLBACK_PRODUCTS = [
  { id:'m1', name:'Classic White Tee', gender:'men', cat:'shirts', price:2490, oldPrice:3200, tag:'New',
    images:['https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=600&q=60&auto=format'],
    desc:'Relaxed-fit heavyweight cotton tee.', sizes:['S','M','L','XL','XXL'],
    colors:[{name:'White',hex:'#F9F8F6'},{name:'Navy',hex:'#0B1A30'}],
    fabric:'100% Cotton', care:'Machine wash cold', sku:'CLM-M-SH-001', inStock:true, stock:50, lowStock:5, featured:true },
  { id:'m2', name:'Pleated Wide-Leg Trousers', gender:'men', cat:'pants', price:5890, oldPrice:6990, tag:'Bestseller',
    images:['https://images.unsplash.com/photo-1594633312681-425c7b97ccd1?w=600&q=60&auto=format'],
    desc:'Tailored with wide flowing leg.', sizes:['30','32','34','36','38'],
    colors:[{name:'Brown',hex:'#6B5442'}], fabric:'Poly-wool', care:'Dry clean', sku:'CLM-M-PT-001',
    inStock:true, stock:25, lowStock:5, featured:true },
  { id:'m3', name:'Oversized Navy Hoodie', gender:'men', cat:'hoodies', price:6490, oldPrice:7990, tag:'Bestseller',
    images:['https://images.unsplash.com/photo-1556821840-3a63f95609a7?w=600&q=60&auto=format'],
    desc:'Dropped shoulder boxy fit.', sizes:['S','M','L','XL','XXL'],
    colors:[{name:'Navy',hex:'#131F3A'}], fabric:'Cotton blend', care:'Machine wash', sku:'CLM-M-HD-001',
    inStock:true, stock:60, lowStock:5, featured:true },
  { id:'m4', name:'Moto Leather Jacket', gender:'men', cat:'jackets', price:18900, tag:'Limited',
    images:['https://images.unsplash.com/photo-1551028719-00167b16eac5?w=600&q=60&auto=format'],
    desc:'Full-grain sheep leather.', sizes:['S','M','L','XL'],
    colors:[{name:'Black',hex:'#0E0E0E'}], fabric:'Leather', care:'Wipe clean', sku:'CLM-M-JK-001',
    inStock:true, stock:8, lowStock:3, featured:true },
  { id:'w1', name:'Embroidered 3-Piece Suit', gender:'women', cat:'suits3', price:12890, oldPrice:14990, tag:'Bestseller',
    images:['https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=600&q=60&auto=format'],
    desc:'Classic three-piece with embroidery.', sizes:['XS','S','M','L','XL'],
    colors:[{name:'Ivory',hex:'#F4EFE6'}], fabric:'Lawn & Chiffon', care:'Dry clean', sku:'CLM-W-3P-001',
    inStock:true, stock:18, lowStock:3, featured:true },
  { id:'w2', name:'Printed 2-Piece Suit', gender:'women', cat:'suits2', price:8490, tag:'New',
    images:['https://images.unsplash.com/photo-1583391733956-6c78276477e2?w=600&q=60&auto=format'],
    desc:'Co-ordinated two-piece.', sizes:['XS','S','M','L','XL'],
    colors:[{name:'Cream',hex:'#EFE5D2'}], fabric:'Cotton Lawn', care:'Machine wash', sku:'CLM-W-2P-001',
    inStock:true, stock:25, lowStock:5, featured:true },
  { id:'w3', name:'Chikankari Kurti', gender:'women', cat:'kurtis', price:5990, oldPrice:6990, tag:'Bestseller',
    images:['https://images.unsplash.com/photo-1583391733975-a6a3a6c6c4d1?w=600&q=60&auto=format'],
    desc:'Hand-embroidered soft cotton.', sizes:['XS','S','M','L','XL'],
    colors:[{name:'White',hex:'#F9F8F6'}], fabric:'Cotton', care:'Hand wash', sku:'CLM-W-KT-001',
    inStock:true, stock:22, lowStock:5, featured:true },
  { id:'w4', name:'Leather Crossbody Purse', gender:'women', cat:'purses', price:7990, tag:'New',
    images:['https://images.unsplash.com/photo-1584917865442-de89df76afd3?w=600&q=60&auto=format'],
    desc:'Compact full-grain leather.', sizes:['One Size'],
    colors:[{name:'Black',hex:'#0E0E0E'}], fabric:'Leather', care:'Wipe clean', sku:'CLM-W-PU-001',
    inStock:true, stock:16, lowStock:5, featured:true }
];

/* ═══════ TOAST ═══════ */
let toastTimer;
function toast(msg) {
  const el = document.getElementById('toast');
  if (!el) return;
  const m = document.getElementById('toastMsg');
  if (m) m.textContent = msg;
  el.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.remove('show'), 3000);
}

/* ═══════ AUTH ═══════ */
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
        logoutBtn.onclick = () => auth.signOut().then(() => location.reload());
      }
    } else {
      if (accountBtn) accountBtn.hidden = false;
      if (profileIcon) profileIcon.hidden = true;
      if (logoutBtn) logoutBtn.hidden = true;
    }
    resolve(user);
  });
});

async function saveUserToFirestore(user) {
  try {
    const ref = db.collection('users').doc(user.uid);
    const snap = await ref.get();
    const base = {
      uid: user.uid, email: user.email || '',
      displayName: user.displayName || '',
      provider: (user.providerData[0] && user.providerData[0].providerId) || 'password',
      emailVerified: user.emailVerified,
      lastLogin: firebase.firestore.FieldValue.serverTimestamp()
    };
    if (!snap.exists) {
      await ref.set({ ...base, firstName:'', lastName:'', fullName:'', phone:'',
        address:'', city:'', district:'', province:'',
        createdAt: firebase.firestore.FieldValue.serverTimestamp() });
    } else {
      await ref.update(base);
    }
  } catch (e) { console.error(e); }
}

/* ═══════ LOAD DATA ═══════ */
async function loadCatalog() {
  const cachedProducts = getCache('products');
  const cachedCats = getCache('categories');
  if (cachedProducts && cachedCats && cachedProducts.length) {
    PRODUCTS = cachedProducts;
    CATEGORIES = cachedCats;
    return;
  }

  try {
    const snap = await db.collection('categories').get();
    const loaded = {};
    const hidden = [];
    snap.forEach(doc => {
      const d = doc.data();
      if (d.hidden) { hidden.push(doc.id); return; }
      loaded[doc.id] = {
        label: d.label || doc.id,
        gender: d.gender || 'men',
        desc: d.desc || d.sub || '',
        img: d.img || ''
      };
    });
    CATEGORIES = { ...FALLBACK_CATS, ...loaded };
    hidden.forEach(id => { delete CATEGORIES[id]; });
  } catch (e) { CATEGORIES = { ...FALLBACK_CATS }; }

  try {
    const snap = await db.collection('products').get();
    const fsProducts = [];
    const hiddenIds = [];
    snap.forEach(doc => {
      const d = doc.data();
      if (d.hidden) { hiddenIds.push(doc.id); return; }
      fsProducts.push({
        id: doc.id,
        name: d.name || '', gender: d.gender || 'men', cat: d.cat || 'shirts',
        price: Number(d.price) || 0,
        oldPrice: d.oldPrice ? Number(d.oldPrice) : null,
        tag: d.tag || null,
        images: Array.isArray(d.images) ? d.images : (d.img ? [d.img] : []),
        desc: d.desc || '',
        sizes: Array.isArray(d.sizes) ? d.sizes : ['S','M','L','XL'],
        colors: Array.isArray(d.colors) ? d.colors : [{ name:'Navy', hex:'#0B1A30' }],
        fabric: d.fabric || '', care: d.care || '', sku: d.sku || '',
        inStock: d.inStock !== false,
        featured: d.featured !== false,
        stock: d.stock ?? 50, lowStock: d.lowStock ?? 5,
        _ts: d.createdAt?.seconds || 0
      });
    });
    const byId = {};
    fsProducts.forEach(p => { byId[p.id] = p; });
    const fallbacksKept = FALLBACK_PRODUCTS.filter(p => !byId[p.id] && !hiddenIds.includes(p.id));
    PRODUCTS = [...fsProducts, ...fallbacksKept];
  } catch (e) {
    PRODUCTS = [ ...FALLBACK_PRODUCTS ];
  }

  setCache('products', PRODUCTS);
  setCache('categories', CATEGORIES);
}

const getCat = k => CATEGORIES[k] || FALLBACK_CATS[k] || { label:k, gender:'men', desc:'', img:'' };

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

/* ═══════ PRODUCT CARDS ═══════ */
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

/* ═══════ FEATURED SECTIONS ═══════ */
function renderFeaturedMen() {
  const grid = document.getElementById('featuredMenGrid');
  if (!grid) return;
  const list = PRODUCTS.filter(p => p.gender === 'men' && p.featured !== false);
  if (!list.length) {
    grid.innerHTML = `<div class="empty-state"><h3>No men's products yet</h3></div>`;
    return;
  }
  grid.innerHTML = list.slice(0, 8).map(productCardHTML).join('');
}

function renderFeaturedWomen() {
  const grid = document.getElementById('featuredWomenGrid');
  if (!grid) return;
  const list = PRODUCTS.filter(p => p.gender === 'women' && p.featured !== false);
  if (!list.length) {
    grid.innerHTML = `<div class="empty-state"><h3>No women's products yet</h3></div>`;
    return;
  }
  grid.innerHTML = list.slice(0, 8).map(productCardHTML).join('');
}

/* ═══════ SHOP PAGE ═══════ */
function getUrlParam(key) { return new URLSearchParams(window.location.search).get(key); }
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
  const catHeading = document.getElementById('catHeading');

  if (shopGender === 'men') {
    if (title) title.textContent = "Men's Collection";
    if (sub) sub.textContent = "Sharp tailoring, premium fabrics.";
    if (eyebrow) eyebrow.textContent = 'For Him';
    if (catHeading) catHeading.textContent = "Shop Men's Categories";
  } else if (shopGender === 'women') {
    if (title) title.textContent = "Women's Collection";
    if (sub) sub.textContent = "Fluid silhouettes and essentials.";
    if (eyebrow) eyebrow.textContent = 'For Her';
    if (catHeading) catHeading.textContent = "Shop Women's Categories";
  } else {
    if (title) title.textContent = "All Collections";
    if (sub) sub.textContent = "Everything Coolism has to offer.";
    if (eyebrow) eyebrow.textContent = 'Browse All';
    if (catHeading) catHeading.textContent = "Shop by Category";
  }

  const shopCatGrid = document.getElementById('shopCatGrid');
  if (shopCatGrid) {
    const catKeys = Object.keys(CATEGORIES).filter(k => {
      const g = CATEGORIES[k].gender || 'men';
      if (!shopGender) return true;
      return g === shopGender;
    });
    if (!catKeys.length) {
      shopCatGrid.innerHTML = `<div class="empty-state" style="grid-column:1/-1"><p>No categories yet.</p></div>`;
    } else {
      shopCatGrid.innerHTML = catKeys.map(k => {
        const c = CATEGORIES[k];
        return `<a href="shop.html?${shopGender ? 'gender='+shopGender+'&' : ''}cat=${k}" style="display:block;text-decoration:none;text-align:center">
          <div style="width:100%;aspect-ratio:1/1;border-radius:16px;overflow:hidden;background:#EDE8DD;margin-bottom:12px">
            <img src="${c.img}" alt="${c.label}" loading="lazy" style="width:100%;height:100%;object-fit:cover;display:block" onerror="this.style.display='none'">
          </div>
          <h4 style="font-family:'Jost',sans-serif;font-size:.85rem;font-weight:600;letter-spacing:.18em;text-transform:uppercase;color:#0B1A30;margin:0">${c.label}</h4>
        </a>`;
      }).join('');
    }
    shopCatGrid.style.display = 'grid';
    shopCatGrid.style.gridTemplateColumns = window.innerWidth <= 620 ? 'repeat(2, 1fr)' : window.innerWidth <= 900 ? 'repeat(3, 1fr)' : 'repeat(4, 1fr)';
    shopCatGrid.style.gap = '24px';
  }

  const filters = document.getElementById('filters');
  if (filters) {
    const catKeys = Object.keys(CATEGORIES).filter(k => {
      const g = CATEGORIES[k].gender || 'men';
      if (!shopGender) return true;
      return g === shopGender;
    });
    filters.innerHTML = `<button class="chip ${!shopCat?'active':''}" data-filter="all">All</button>` +
      catKeys.map(k => `<button class="chip ${shopCat===k?'active':''}" data-filter="${k}">${CATEGORIES[k].label}</button>`).join('');
  }

  let list = PRODUCTS;
  if (shopGender) list = list.filter(p => p.gender === shopGender);
  if (shopCat) list = list.filter(p => p.cat === shopCat);
  list = sortProducts(list, currentSort);

  if (heading) heading.textContent = shopCat ? getCat(shopCat).label : (shopGender ? `${shopGender==='men'?'Men':'Women'}'s Products` : 'All Products');

  const grid = document.getElementById('productGrid');
  if (grid) {
    grid.innerHTML = list.length ? list.map(productCardHTML).join('') : `<div class="empty-state"><h3>No products found</h3></div>`;
  }

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

/* ═══════ BANNERS ═══════ */
async function renderBannerSlots() {
  const heroSlider = document.getElementById('heroSlider');
  if (heroSlider) {
    const pcUrl = buildImageUrl(PC_BANNER);
    const mobileUrl = buildImageUrl(MOBILE_BANNER);

    heroSlider.innerHTML = `
  <picture>
    <source media="(max-width: 768px)" srcset="${mobileUrl}">
    <img src="${pcUrl}" alt="Coolism Collection" fetchpriority="high" loading="eager"
         style="width:100%;height:auto;aspect-ratio:21/9;display:block;object-fit:cover;object-position:center 40%;">
  </picture>
`;

  let banners = [];
  try {
    const snap = await db.collection('banners').orderBy('order', 'asc').get();
    banners = snap.docs.map(d => ({ id: d.id, ...d.data() })).filter(b => b.active !== false && b.position !== 'hero');
  } catch (e) { return; }

  const isMobile = window.matchMedia('(max-width: 768px)').matches;
  banners = banners.filter(b => {
    if (isMobile && b.showOnMobile === false) return false;
    if (!isMobile && b.showOnPc === false) return false;
    return true;
  });

  const SLOTS = ['before-categories','after-categories','home-before-men','home-after-men','home-before-women','home-after-women','after-products','before-footer','shop-men-top','shop-men-mid','shop-women-top','shop-women-mid'];
  SLOTS.forEach(pos => {
    const slot = document.querySelector(`[data-banner-slot="${pos}"]`);
    if (!slot) return;
    const matching = banners.filter(b => b.position === pos);
    if (!matching.length) { slot.style.display = 'none'; return; }
    slot.style.display = 'block';
    slot.innerHTML = matching.map(b => `<div class="site-banner-link"><img src="${b.image}" class="site-banner-img" loading="lazy" alt="Coolism"></div>`).join('');
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
    if (total >= free) { msg.textContent = '🎉 You got free shipping!'; if (prog) prog.classList.add('free'); }
    else { msg.textContent = `Add ${money(free - total)} more for free shipping`; if (prog) prog.classList.remove('free'); }
  }

  if (!cart.length) {
    body.innerHTML = `<div class="cart-empty"><p>Your bag is empty.</p><a href="shop.html" class="btn btn-line" style="margin-top:16px">Start Shopping</a></div>`;
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
  document.getElementById('cartDrawer')?.classList.add('open');
  document.getElementById('overlay')?.classList.add('show');
  document.body.style.overflow = 'hidden';
}
function closeCart() {
  document.getElementById('cartDrawer')?.classList.remove('open');
  document.getElementById('overlay')?.classList.remove('show');
  document.body.style.overflow = '';
}

/* ═══════ PRODUCT DETAIL ═══════ */
function openDetail(id) {
  const p = PRODUCTS.find(x => x.id === id);
  if (!p) return;
  currentDetail = { product: p, size: p.sizes[0], color: p.colors[0].name, qty: 1, images: p.images && p.images.length ? p.images : [], index: 0 };
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
  if (thumbs) thumbs.innerHTML = total > 1
    ? currentDetail.images.map((img, i) => `<div class="thumb ${i===0?'active':''}" data-thumb="${i}"><img src="${img}" alt=""></div>`).join('')
    : '';
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
  if (ds) ds.innerHTML = p.sizes.map(s => `<button class="opt-btn ${s===currentDetail.size?'active':''}" data-size="${s}">${s}</button>`).join('');
  const dc = document.getElementById('detailColors');
  if (dc) dc.innerHTML = p.colors.map(c => `<button class="color-btn ${c.name===currentDetail.color?'active':''}" data-color="${c.name}"><span class="swatch" style="background:${c.hex}"></span><span>${c.name}</span></button>`).join('');
  const qv = document.getElementById('qtyValue'); if (qv) qv.textContent = '1';
  document.getElementById('detailModal')?.classList.add('show');
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
  document.querySelectorAll('.detail-thumbs .thumb').forEach((t, i) => t.classList.toggle('active', i === currentDetail.index));
}

/* ═══════ CHECKOUT ═══════ */
function calcShipping(subtotal, city, district, province) {
  if (subtotal >= SHIPPING_RATES.freeThreshold) return 0;
  const c = (city||'').toLowerCase().trim(), d = (district||'').toLowerCase().trim(), p = (province||'').toLowerCase().trim();
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
        set('co-name', d.fullName || `${d.firstName||''} ${d.lastName||''}`.trim());
        set('co-phone', d.phone); set('co-address', d.address);
        set('co-city', d.city || SHIPPING_FROM.city);
        set('co-district', d.district || SHIPPING_FROM.district);
        set('co-province', d.province || SHIPPING_FROM.province);
      }
    }).catch(() => {});
  }
  updateCheckoutSummary();
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
  const set = (id, v) => { const el = document.getElementById(id); if (el) el.textContent = v; };
  set('co-subtotal', money(subtotal));
  set('co-shipping', shipping === 0 ? 'Free' : money(shipping));
  set('co-total', money(subtotal + shipping));
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
    if (typeof gtag !== 'undefined') {
      gtag('event', 'purchase', { transaction_id: orderId, value: total, currency: 'PKR',
        items: cart.map(i => ({ item_id: i.id, item_name: i.name, price: i.price, quantity: i.qty })) });
    }
    cart = []; saveCart(); renderCart();
    document.getElementById('checkoutModal').classList.remove('show');
    document.body.style.overflow = '';
    document.getElementById('successOrderId').textContent = orderId;
    document.getElementById('successModal').classList.add('show');
    setTimeout(() => document.getElementById('successModal').classList.remove('show'), 8000);
    toast('Order placed!');
  } catch (e) { console.error(e); toast('Could not place order.'); }
}

/* ═══════ PROFILE ═══════ */
async function loadProfile(user) {
  const noAuth = document.getElementById('noAuth');
  if (!user) { if (noAuth) noAuth.hidden = false; return; }
  if (noAuth) noAuth.hidden = true;
  try {
    const snap = await db.collection('users').doc(user.uid).get();
    const d = snap.exists ? snap.data() : {};
    const set = (id, v) => { const el = document.getElementById(id); if (el) el.textContent = v || '—'; };
    set('profileName', `Hello, ${d.firstName || 'there'}`);
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
    const snap = await db.collection('orders').where('uid','==',user.uid).get();
    const orders = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }))
      .sort((a,b) => (b.createdAt?.seconds||0) - (a.createdAt?.seconds||0));
    renderProfileOrders(orders);
  } catch (e) { console.error(e); }
}

function renderProfileOrders(orders) {
  const c = document.getElementById('ordersContainer');
  if (!c) return;
  const ce = document.getElementById('ordersCount'); const te = document.getElementById('ordersTotal');
  if (ce) ce.textContent = orders.length;
  if (te) te.textContent = money(orders.reduce((s,o) => s + (o.total||0), 0));
  if (!orders.length) {
    c.innerHTML = `<div class="empty-state"><h3>No orders yet</h3><a href="shop.html" class="btn btn-silver">Start Shopping</a></div>`;
    return;
  }
  c.innerHTML = orders.map(o => {
    const date = o.createdAt?.toDate ? o.createdAt.toDate().toLocaleDateString() : '—';
    return `<div class="order-card">
      <div class="order-card-head">
        <div><h4>Order ${o.orderId}</h4><p class="oc-date">${date} · ${o.itemCount||0} items</p></div>
        <div><div class="oc-total">${money(o.total)}</div><span class="badge-info">${o.status||'pending'}</span></div>
      </div>
    </div>`;
  }).join('');
}

/* ═══════ TRACK ═══════ */
function renderTrackResult(order) {
  const c = document.getElementById('trackResult');
  if (!c) return;
  if (!order) { c.innerHTML = `<div class="access-msg" style="text-align:center">❌ No order found.</div>`; return; }
  const date = order.createdAt?.toDate ? order.createdAt.toDate().toLocaleString() : '—';
  c.innerHTML = `<div class="track-result">
    <h3>Order ${order.orderId}</h3>
    <p>Placed ${date}</p>
    <div class="order-detail-block"><h4>Summary</h4>
      <div class="row"><b>Customer</b><span>${order.fullName||'—'}</span></div>
      <div class="row"><b>City</b><span>${order.city||'—'}</span></div>
      <div class="row"><b>Total</b><span><b>${money(order.total)}</b></span></div>
      <div class="row"><b>Status</b><span>${order.status||'pending'}</span></div>
    </div>
  </div>`;
}
async function trackOrder() {
  const input = document.getElementById('trackInput'); const c = document.getElementById('trackResult');
  if (!input || !c) return;
  const id = input.value.trim();
  if (!id) return toast('Enter Order ID');
  c.innerHTML = `<div class="table-empty">Searching…</div>`;
  try {
    const snap = await db.collection('orders').where('orderId','==',id).limit(1).get();
    if (snap.empty) return renderTrackResult(null);
    renderTrackResult({ id: snap.docs[0].id, ...snap.docs[0].data() });
  } catch (e) { c.innerHTML = `<div class="access-msg">⚠️ Error.</div>`; }
}

/* ═══════ ADMIN — PRODUCTS ═══════ */
async function loadProducts() {
  const tbody = document.getElementById('productsTbody');
  if (!tbody) return;
  tbody.innerHTML = `<tr><td colspan="9" class="table-empty">Loading…</td></tr>`;
  let fsProducts = []; const hiddenIds = [];
  try {
    const snap = await db.collection('products').get();
    snap.forEach(doc => {
      const d = doc.data();
      if (d.hidden) { hiddenIds.push(doc.id); return; }
      fsProducts.push({
        id: doc.id, name: d.name||'', gender: d.gender||'men', cat: d.cat||'shirts',
        price: Number(d.price)||0, oldPrice: d.oldPrice ? Number(d.oldPrice) : null, tag: d.tag||null,
        images: Array.isArray(d.images) ? d.images : (d.img ? [d.img] : []),
        desc: d.desc||'', sizes: Array.isArray(d.sizes) ? d.sizes : ['S','M','L','XL'],
        colors: Array.isArray(d.colors) ? d.colors : [{ name:'Navy', hex:'#0B1A30' }],
        fabric: d.fabric||'', care: d.care||'', sku: d.sku||'',
        inStock: d.inStock !== false, featured: d.featured !== false,
        stock: d.stock ?? 50, lowStock: d.lowStock ?? 5, _ts: d.createdAt?.seconds || 0
      });
    });
  } catch (e) { tbody.innerHTML = `<tr><td colspan="9" class="table-empty">Error: ${e.message}</td></tr>`; return; }
  const byId = {}; fsProducts.forEach(p => byId[p.id] = p);
  const fallbacks = FALLBACK_PRODUCTS.filter(p => !byId[p.id] && !hiddenIds.includes(p.id));
  PRODUCTS = [...fsProducts, ...fallbacks];
  renderProductsTable(PRODUCTS); updateAdminStats();
}

function renderProductsTable(list) {
  const tbody = document.getElementById('productsTbody');
  if (!tbody) return;
  if (!list.length) { tbody.innerHTML = `<tr><td colspan="9" class="table-empty">No products.</td></tr>`; return; }
  tbody.innerHTML = list.map((p, i) => {
    const thumb = (p.images && p.images[0])
      ? `<img src="${p.images[0]}" class="product-thumb" alt="" onerror="this.style.display='none'">`
      : `<div class="product-thumb-ph">${p.name.charAt(0)}</div>`;
    const sn = p.stock ?? 0, ls = p.lowStock ?? 5;
    const sc = sn === 0 ? 'badge-no' : (sn <= ls ? 'badge-info' : 'badge-yes');
    return `<tr>
      <td>${i+1}</td><td>${thumb}</td><td><b>${p.name}</b></td>
      <td>${p.gender||'—'}</td><td>${getCat(p.cat).label}</td>
      <td><b>${money(p.price)}</b></td><td>${p.sku||'—'}</td>
      <td><span class="${sc}">${sn === 0 ? 'Out' : sn+' left'}</span></td>
      <td>
        <button class="action-btn edit" data-edit-product="${p.id}">Edit</button>
        <button class="action-btn delete" data-delete-product="${p.id}">Delete</button>
      </td>
    </tr>`;
  }).join('');
  tbody.querySelectorAll('[data-edit-product]').forEach(b => b.addEventListener('click', () => openProductForm(b.dataset.editProduct)));
  tbody.querySelectorAll('[data-delete-product]').forEach(b => b.addEventListener('click', async () => {
    if (!confirm('Delete?')) return;
    try {
      const ref = db.collection('products').doc(b.dataset.deleteProduct);
      const snap = await ref.get();
      if (snap.exists) await ref.delete();
      else await ref.set({ hidden: true }, { merge: true });
      toast('Deleted'); localStorage.removeItem(CACHE_KEY + '_products'); await loadCatalog(); loadProducts();
    } catch (e) { toast('Error'); }
  }));
}

/* ═══════ ADMIN — CATEGORIES ═══════ */
async function loadCategories() {
  const tbody = document.getElementById('categoriesTbody');
  if (!tbody) return;
  tbody.innerHTML = `<tr><td colspan="7" class="table-empty">Loading…</td></tr>`;
  let fsCats = {}; const hiddenIds = [];
  try {
    const snap = await db.collection('categories').get();
    snap.forEach(doc => {
      const d = doc.data();
      if (d.hidden) { hiddenIds.push(doc.id); return; }
      fsCats[doc.id] = { id: doc.id, ...d };
    });
  } catch (e) { tbody.innerHTML = `<tr><td colspan="7" class="table-empty">Error: ${e.message}</td></tr>`; return; }
  const merged = { ...FALLBACK_CATS, ...fsCats };
  hiddenIds.forEach(id => delete merged[id]);
  allCategories = Object.keys(merged).map(id => ({ id, ...merged[id] }));
  renderCategoriesTable(allCategories); updateAdminStats();
}

function renderCategoriesTable(list) {
  const tbody = document.getElementById('categoriesTbody');
  if (!tbody) return;
  if (!list.length) { tbody.innerHTML = `<tr><td colspan="7" class="table-empty">No categories.</td></tr>`; return; }
  tbody.innerHTML = list.map((c, i) => {
    const thumb = c.img ? `<img src="${c.img}" class="product-thumb" alt="" onerror="this.style.display='none'">` : `<div class="product-thumb-ph">${(c.label||'?').charAt(0)}</div>`;
    const count = PRODUCTS.filter(p => p.cat === c.id).length;
    return `<tr>
      <td>${i+1}</td><td>${thumb}</td><td><b>${c.label||c.id}</b></td>
      <td>${c.gender||'men'}</td><td>${c.desc||'—'}</td><td>${count}</td>
      <td>
        <button class="action-btn edit" data-edit-cat="${c.id}">Edit</button>
        <button class="action-btn delete" data-delete-cat="${c.id}">Delete</button>
      </td>
    </tr>`;
  }).join('');
  tbody.querySelectorAll('[data-edit-cat]').forEach(b => b.addEventListener('click', () => openCategoryForm(b.dataset.editCat)));
  tbody.querySelectorAll('[data-delete-cat]').forEach(b => b.addEventListener('click', async () => {
    if (!confirm('Delete?')) return;
    try {
      const ref = db.collection('categories').doc(b.dataset.deleteCat);
      const snap = await ref.get();
      if (snap.exists) await ref.delete(); else await ref.set({ hidden: true }, { merge: true });
      toast('Deleted'); localStorage.removeItem(CACHE_KEY + '_categories'); await loadCatalog(); loadCategories();
    } catch (e) { toast('Error'); }
  }));
}

function openCategoryForm(id) {
  const modal = document.getElementById('categoryModal');
  if (!modal) return;
  const form = document.getElementById('categoryForm');
  form.reset();
  document.getElementById('categoryModalTitle').textContent = id ? 'Edit' : 'Add Category';
  const prev = document.getElementById('catPreview');
  if (prev) { prev.innerHTML = ''; prev.classList.remove('has-image'); }
  if (id) {
    const c = allCategories.find(x => x.id === id);
    if (c) {
      document.getElementById('c-label').value = c.label || '';
      document.getElementById('c-gender').value = c.gender || 'men';
      document.getElementById('c-img').value = c.img || '';
      document.getElementById('c-desc').value = c.desc || '';
      if (c.img && prev) { prev.innerHTML = `<img src="${c.img}">`; prev.classList.add('has-image'); }
    }
    form.dataset.editId = id;
  } else { form.dataset.editId = ''; }
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
  if (!label) return toast('Name required');
  if (!gender) return toast('Gender required');
  if (!imgRaw) return toast('Image required');
  const img = buildImageUrl(imgRaw);
  const slug = editId || label.toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'');
  try {
    await db.collection('categories').doc(slug).set({ label, gender, img, desc, hidden: false, updatedAt: firebase.firestore.FieldValue.serverTimestamp() }, { merge: true });
    toast(editId ? 'Updated' : 'Created');
    document.getElementById('categoryModal').classList.remove('show');
    localStorage.removeItem(CACHE_KEY + '_categories');
    await loadCatalog(); loadCategories();
  } catch (e) { toast('Error: ' + e.message); }
}

/* ═══════ ADMIN — PRODUCT FORM ═══════ */
function fillCategoryDropdown() {
  const sel = document.getElementById('p-category');
  if (!sel) return;
  const cur = sel.value;
  const keys = Object.keys(CATEGORIES);
  sel.innerHTML = `<option value="">Select category…</option>` + keys.map(k => `<option value="${k}">${CATEGORIES[k].label} (${CATEGORIES[k].gender || 'men'})</option>`).join('');
  if (cur) sel.value = cur;
}

function openProductForm(id) {
  const modal = document.getElementById('productModal');
  if (!modal) return;
  fillCategoryDropdown();
  const form = document.getElementById('productForm');
  form.reset();
  document.getElementById('productModalTitle').textContent = id ? 'Edit Product' : 'Add Product';
  [0,1,2,3,4].forEach(i => {
    const prev = document.getElementById('prev-' + i);
    if (prev) { prev.innerHTML = ''; prev.classList.remove('has-image'); }
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
      document.getElementById('p-featured').checked = p.featured !== false;
      document.getElementById('p-stock').value = p.stock ?? 50;
      document.getElementById('p-lowstock').value = p.lowStock ?? 5;
      const imgs = p.images || [];
      for (let i = 0; i < 5; i++) {
        const inp = document.getElementById('p-img' + (i+1));
        if (inp && imgs[i]) {
          const fn = imgs[i].includes('/') ? imgs[i].split('/').pop() : imgs[i];
          inp.value = fn;
          const prev = document.getElementById('prev-' + i);
          if (prev) { prev.innerHTML = `<img src="${imgs[i]}">`; prev.classList.add('has-image'); }
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

function parseImages() {
  const imgs = [];
  for (let i = 1; i <= 5; i++) {
    const v = document.getElementById('p-img' + i)?.value.trim();
    if (v) imgs.push(buildImageUrl(v));
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
  const featured = document.getElementById('p-featured').checked;
  const stock = Number(document.getElementById('p-stock').value) || 0;
  const lowStock = Number(document.getElementById('p-lowstock').value) || 5;
  if (name.length < 2) return toast('Name required');
  if (!gender) return toast('Gender required');
  if (!cat) return toast('Category required');
  if (!price) return toast('Price required');
  if (!document.getElementById('p-img1').value.trim()) return toast('Image 1 required');
  const data = {
    name, gender, cat, price, oldPrice, tag, images: parseImages(), sizes, sku,
    colors: colors.length ? colors : [{ name:'Default', hex:'#333333' }],
    desc, fabric, care, inStock, featured, stock, lowStock,
    updatedAt: firebase.firestore.FieldValue.serverTimestamp()
  };
  try {
    if (editId) { await db.collection('products').doc(editId).update(data); toast('Updated'); }
    else { data.createdAt = firebase.firestore.FieldValue.serverTimestamp(); await db.collection('products').add(data); toast('Added'); }
    document.getElementById('productModal').classList.remove('show');
    localStorage.removeItem(CACHE_KEY + '_products');
    await loadCatalog(); loadProducts();
  } catch (e) { toast('Error: ' + e.message); }
}

/* ═══════ ADMIN — BANNERS ═══════ */
async function loadBanners() {
  const tbody = document.getElementById('bannersTbody');
  if (!tbody) return;
  tbody.innerHTML = `<tr><td colspan="7" class="table-empty">Loading…</td></tr>`;
  try {
    const snap = await db.collection('banners').orderBy('order','asc').get();
    allBanners = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    renderBannersTable(allBanners);
  } catch (e) { tbody.innerHTML = `<tr><td colspan="7" class="table-empty">Error: ${e.message}</td></tr>`; }
}

function renderBannersTable(list) {
  const tbody = document.getElementById('bannersTbody');
  if (!tbody) return;
  if (!list.length) { tbody.innerHTML = `<tr><td colspan="7" class="table-empty">No banners.</td></tr>`; return; }
  tbody.innerHTML = list.map((b, i) => `
    <tr>
      <td>${i+1}</td>
      <td><img src="${b.image||''}" style="width:120px;height:60px;object-fit:cover;border-radius:6px" onerror="this.style.background='#333'"></td>
      <td><code style="font-size:.75rem">${b.link||'—'}</code></td>
      <td>${b.position||'—'}</td>
      <td>${b.order||1}</td>
      <td>${b.active !== false ? '<span class="badge-yes">Yes</span>' : '<span class="badge-no">No</span>'}</td>
      <td>
        <button class="action-btn edit" data-edit-banner="${b.id}">Edit</button>
        <button class="action-btn delete" data-delete-banner="${b.id}">Delete</button>
      </td>
    </tr>`).join('');
  tbody.querySelectorAll('[data-edit-banner]').forEach(btn => btn.addEventListener('click', () => openBannerForm(btn.dataset.editBanner)));
  tbody.querySelectorAll('[data-delete-banner]').forEach(btn => btn.addEventListener('click', async () => {
    if (!confirm('Delete?')) return;
    try { await db.collection('banners').doc(btn.dataset.deleteBanner).delete(); toast('Deleted'); loadBanners(); }
    catch (e) { toast('Error'); }
  }));
}

function openBannerForm(id) {
  const modal = document.getElementById('bannerModal');
  if (!modal) return;
  const form = document.getElementById('bannerForm');
  form.reset();
  currentBannerId = id || null;
  document.getElementById('bannerModalTitle').textContent = id ? 'Edit Banner' : 'Add Banner';
  const prev = document.getElementById('bannerPreview'); if (prev) prev.innerHTML = '';
  if (id) {
    const b = allBanners.find(x => x.id === id);
    if (b) {
      document.getElementById('b-image-url').value = b.image || '';
      document.getElementById('b-link').value = b.link || '';
      document.getElementById('b-position').value = b.position || 'hero';
      document.getElementById('b-order').value = b.order || 1;
      document.getElementById('b-active').checked = b.active !== false;
      document.getElementById('b-show-pc').checked = b.showOnPc !== false;
      document.getElementById('b-show-mobile').checked = b.showOnMobile !== false;
      if (b.image && prev) prev.innerHTML = `<img src="${b.image}" style="width:100%;border-radius:12px">`;
    }
  } else {
    document.getElementById('b-show-pc').checked = true;
    document.getElementById('b-show-mobile').checked = true;
  }
  modal.classList.add('show');
}

async function saveBanner(e) {
  e.preventDefault();
  const raw = document.getElementById('b-image-url').value.trim();
  if (!raw) return toast('Image required');
  const image = buildImageUrl(raw);
  const link = document.getElementById('b-link').value.trim();
  const position = document.getElementById('b-position').value;
  const order = Number(document.getElementById('b-order').value) || 1;
  const active = document.getElementById('b-active').checked;
  const showOnPc = document.getElementById('b-show-pc').checked;
  const showOnMobile = document.getElementById('b-show-mobile').checked;
  const data = { image, link, position, order, active, showOnPc, showOnMobile, updatedAt: firebase.firestore.FieldValue.serverTimestamp() };
  try {
    if (currentBannerId) await db.collection('banners').doc(currentBannerId).update(data);
    else { data.createdAt = firebase.firestore.FieldValue.serverTimestamp(); await db.collection('banners').add(data); }
    toast('Saved');
    document.getElementById('bannerModal').classList.remove('show');
    loadBanners();
  } catch (err) { toast('Error: ' + err.message); }
}

/* ═══════ ADMIN — ORDERS ═══════ */
async function loadOrders() {
  const tbody = document.getElementById('ordersTbody');
  if (!tbody) return;
  tbody.innerHTML = `<tr><td colspan="9" class="table-empty">Loading…</td></tr>`;
  try {
    const snap = await db.collection('orders').orderBy('createdAt','desc').get();
    allOrders = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    renderOrdersTable(allOrders); updateAdminStats();
  } catch (e) { tbody.innerHTML = `<tr><td colspan="9" class="table-empty">Error: ${e.message}</td></tr>`; }
}

function renderOrdersTable(list) {
  const tbody = document.getElementById('ordersTbody');
  if (!tbody) return;
  if (!list.length) { tbody.innerHTML = `<tr><td colspan="9" class="table-empty">No orders.</td></tr>`; return; }
  tbody.innerHTML = list.map((o, i) => {
    const date = o.createdAt?.toDate ? o.createdAt.toDate().toLocaleDateString() : '—';
    const st = o.status || 'pending';
    const c = st === 'delivered' ? 'badge-yes' : (st === 'cancelled' ? 'badge-no' : 'badge-info');
    return `<tr>
      <td>${i+1}</td><td><b>${o.orderId||'—'}</b></td><td>${date}</td>
      <td>${o.fullName||'—'}</td><td>${o.phone||'—'}</td><td>${o.city||'—'}</td>
      <td><b>${money(o.total)}</b></td><td><span class="${c}">${st}</span></td>
      <td><button class="link-btn" data-view-order="${o.id}">View</button></td>
    </tr>`;
  }).join('');
  tbody.querySelectorAll('[data-view-order]').forEach(b => b.addEventListener('click', () => showAdminOrder(b.dataset.viewOrder)));
}

function showAdminOrder(orderId) {
  const o = allOrders.find(x => x.id === orderId);
  if (!o) return;
  const modal = document.getElementById('adminOrderModal');
  if (!modal) return;
  currentOrderId = orderId;
  document.getElementById('aoTitle').textContent = `Order ${o.orderId}`;
  document.getElementById('aoSub').textContent = o.createdAt?.toDate ? o.createdAt.toDate().toLocaleString() : '—';
  const items = (o.items||[]).map(it => `<div class="order-item"><div><div class="nm">${it.name}</div><div class="vr">${it.size} · ${it.color}</div><div class="qt">Qty: ${it.qty}</div></div><div><b>${money(it.price*it.qty)}</b></div></div>`).join('');
  document.getElementById('aoBody').innerHTML = `
    <div class="order-detail-block"><h4>Customer</h4>
      <div class="row"><b>Name</b><span>${o.fullName||'—'}</span></div>
      <div class="row"><b>Phone</b><span>${o.phone||'—'}</span></div>
      <div class="row"><b>Address</b><span>${o.address||'—'}</span></div>
      <div class="row"><b>City</b><span>${o.city||'—'}</span></div>
    </div>
    <div class="order-detail-block"><h4>Items</h4><div class="order-items-list">${items}</div></div>
    <div class="order-detail-block"><h4>Payment</h4>
      <div class="row"><b>Total</b><span><b>${money(o.total)}</b></span></div>
      <div class="row"><b>Status</b><span>${o.status||'pending'}</span></div>
    </div>`;
  modal.querySelectorAll('[data-status]').forEach(b => b.classList.toggle('active-status', b.dataset.status === (o.status || 'pending')));
  modal.classList.add('show');
}

async function updateOrderStatus(st) {
  if (!currentOrderId) return;
  try {
    await db.collection('orders').doc(currentOrderId).update({ status: st, updatedAt: firebase.firestore.FieldValue.serverTimestamp() });
    toast('Updated'); loadOrders(); setTimeout(() => showAdminOrder(currentOrderId), 400);
  } catch (e) { toast('Error'); }
}

/* ═══════ ADMIN — USERS ═══════ */
async function loadUsers() {
  const tbody = document.getElementById('usersTbody');
  if (!tbody) return;
  tbody.innerHTML = `<tr><td colspan="8" class="table-empty">Loading…</td></tr>`;
  try {
    const snap = await db.collection('users').orderBy('createdAt','desc').get();
    allUsers = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    renderUsersTable(allUsers); updateAdminStats();
  } catch (e) { tbody.innerHTML = `<tr><td colspan="8" class="table-empty">Error: ${e.message}</td></tr>`; }
}

function renderUsersTable(list) {
  const tbody = document.getElementById('usersTbody');
  if (!tbody) return;
  if (!list.length) { tbody.innerHTML = `<tr><td colspan="8" class="table-empty">No users.</td></tr>`; return; }
  tbody.innerHTML = list.map((u, i) => {
    const c = u.createdAt?.toDate ? u.createdAt.toDate().toLocaleDateString() : '—';
    const v = u.emailVerified ? '<span class="badge-yes">Yes</span>' : '<span class="badge-no">No</span>';
    return `<tr>
      <td>${i+1}</td><td>${u.email||'—'}</td><td>${(u.firstName||'') + ' ' + (u.lastName||'')}</td>
      <td>${u.phone||'—'}</td><td>${u.city||'—'}</td><td>${v}</td><td>${c}</td>
      <td><button class="link-btn" data-view-user="${u.uid||u.id}">View</button></td>
    </tr>`;
  }).join('');
  tbody.querySelectorAll('[data-view-user]').forEach(b => b.addEventListener('click', () => showAdminUser(b.dataset.viewUser)));
}

function showAdminUser(uid) {
  const u = allUsers.find(x => (x.uid || x.id) === uid);
  if (!u) return;
  const modal = document.getElementById('adminUserModal');
  if (!modal) return;
  const n = `${u.firstName||''} ${u.lastName||''}`.trim() || '—';
  document.getElementById('auTitle').textContent = n;
  document.getElementById('auSub').textContent = u.email || '—';
  document.getElementById('auBody').innerHTML = `
    <div class="order-detail-block"><h4>User</h4>
      <div class="row"><b>Name</b><span>${n}</span></div>
      <div class="row"><b>Email</b><span>${u.email||'—'}</span></div>
      <div class="row"><b>Phone</b><span>${u.phone||'—'}</span></div>
      <div class="row"><b>City</b><span>${u.city||'—'}</span></div>
    </div>`;
  modal.classList.add('show');
}

function updateAdminStats() {
  const pc = document.getElementById('productCount'); if (pc) pc.textContent = PRODUCTS.length;
  const cc = document.getElementById('categoryCount'); if (cc) cc.textContent = Object.keys(CATEGORIES).length;
  const oc = document.getElementById('orderCount'); if (oc) oc.textContent = allOrders.length;
  const uc = document.getElementById('userCount'); if (uc) uc.textContent = allUsers.length;
  const rt = document.getElementById('revenueTotal');
  if (rt) rt.textContent = money(allOrders.reduce((s,o) => s + (o.total||0), 0));
}

/* ═══════ ANALYTICS ═══════ */
function renderAnalytics() {
  const grid = document.getElementById('analyticsGrid');
  if (!grid) return;
  const avgOrder = allOrders.length ? Math.round(allOrders.reduce((s,o) => s + (o.total||0), 0) / allOrders.length) : 0;
  grid.innerHTML = `
    <div class="analytics-card">
      <h3>Key Metrics</h3>
      <div class="stat-box" style="width:100%;margin-bottom:12px"><b>${allOrders.length}</b><span>Total Orders</span></div>
      <div class="stat-box" style="width:100%;margin-bottom:12px"><b>${money(avgOrder)}</b><span>Avg Order Value</span></div>
      <div class="stat-box" style="width:100%"><b>${allUsers.length}</b><span>Total Users</span></div>
    </div>`;
}

/* ═══════ BOOT ═══════ */
const page = document.body.dataset.page;

(async function boot() {
  loadLocalCart();
  await loadCatalog();
  const user = await authReady;

  if (page === 'home') {
    try { renderFeaturedMen(); } catch(e) { console.error(e); }
    try { renderFeaturedWomen(); } catch(e) { console.error(e); }
    try { await renderBannerSlots(); } catch(e) { console.error(e); }
  }

  if (page === 'shop') {
    renderShopPage();
    try { await renderBannerSlots(); } catch(e) { console.error(e); }
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
    try { await loadProducts(); } catch(e) { console.error(e); }
    try { await loadCategories(); } catch(e) { console.error(e); }
    try { await loadBanners(); } catch(e) { console.error(e); }
    try { await loadOrders(); } catch(e) { console.error(e); }
    try { await loadUsers(); } catch(e) { console.error(e); }
  }
})();

/* ═══════ CLICK HANDLERS ═══════ */
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
    const orig = quickBtn.textContent; quickBtn.textContent = 'Added ✓'; quickBtn.classList.add('added');
    setTimeout(() => { quickBtn.textContent = orig; quickBtn.classList.remove('added'); }, 1400);
    return;
  }

  const card = e.target.closest('.card');
  if (card && card.dataset.id) { openDetail(card.dataset.id); return; }

  const inc = e.target.closest('[data-cart-inc]');
  if (inc) { const f = cart.find(i => lineKey(i) === inc.dataset.cartInc); if (f) { f.qty++; saveCart(); renderCart(); } return; }
  const dec = e.target.closest('[data-cart-dec]');
  if (dec) { const i = cart.findIndex(x => lineKey(x) === dec.dataset.cartDec); if (i > -1) { if (cart[i].qty > 1) cart[i].qty--; else cart.splice(i,1); saveCart(); renderCart(); } return; }
  const rem = e.target.closest('[data-cart-remove]');
  if (rem) { cart = cart.filter(i => lineKey(i) !== rem.dataset.cartRemove); saveCart(); renderCart(); return; }

  const sr = e.target.closest('[data-search-id]');
  if (sr) { closeSearch(); openDetail(sr.dataset.searchId); return; }

  if (e.target.closest('#imgPrev')) { showImageIndex(currentDetail.index - 1); return; }
  if (e.target.closest('#imgNext')) { showImageIndex(currentDetail.index + 1); return; }
  const thumb = e.target.closest('[data-thumb]');
  if (thumb) { showImageIndex(Number(thumb.dataset.thumb)); return; }

  if (e.target.closest('#detailClose') || e.target.id === 'detailModal') { document.getElementById('detailModal')?.classList.remove('show'); document.body.style.overflow = ''; return; }

  const sz = e.target.closest('#detailSizes [data-size]');
  if (sz) { currentDetail.size = sz.dataset.size; document.querySelectorAll('#detailSizes .opt-btn').forEach(b => b.classList.toggle('active', b === sz)); return; }
  const cl = e.target.closest('#detailColors [data-color]');
  if (cl) { currentDetail.color = cl.dataset.color; document.querySelectorAll('#detailColors .color-btn').forEach(b => b.classList.toggle('active', b === cl)); return; }
  if (e.target.id === 'qtyMinus') { if (currentDetail.qty > 1) currentDetail.qty--; const q = document.getElementById('qtyValue'); if(q) q.textContent = currentDetail.qty; return; }
  if (e.target.id === 'qtyPlus') { currentDetail.qty++; const q = document.getElementById('qtyValue'); if(q) q.textContent = currentDetail.qty; return; }
  if (e.target.closest('#detailAddBtn')) { if (currentDetail.product) { addToCart(currentDetail.product, currentDetail.size, currentDetail.color, currentDetail.qty); document.getElementById('detailModal')?.classList.remove('show'); document.body.style.overflow = ''; } return; }

  if (e.target.closest('[data-size-guide]')) { e.preventDefault(); document.getElementById('sizeGuideModal')?.classList.add('show'); return; }
  if (e.target.id === 'sizeGuideClose' || e.target.id === 'sizeGuideModal') { document.getElementById('sizeGuideModal')?.classList.remove('show'); return; }

  if (e.target.closest('#checkoutBtn')) { if (!cart.length) return toast('Bag is empty'); openCheckout(); return; }
  if (e.target.closest('#checkoutClose')) { document.getElementById('checkoutModal')?.classList.remove('show'); document.body.style.overflow = ''; return; }
  if (e.target.id === 'checkoutModal') { document.getElementById('checkoutModal')?.classList.remove('show'); document.body.style.overflow = ''; return; }
  if (e.target.id === 'successModal' || e.target.closest('#successModal .btn')) { document.getElementById('successModal')?.classList.remove('show'); return; }

  if (e.target.closest('#addProductBtn')) { openProductForm(); return; }
  if (e.target.closest('#productModalClose') || e.target.closest('#productCancelBtn')) { document.getElementById('productModal')?.classList.remove('show'); return; }
  if (e.target.id === 'productModal') { document.getElementById('productModal')?.classList.remove('show'); return; }

  if (e.target.closest('#addCategoryBtn')) { openCategoryForm(); return; }
  if (e.target.closest('#categoryModalClose') || e.target.closest('#categoryCancelBtn')) { document.getElementById('categoryModal')?.classList.remove('show'); return; }
  if (e.target.id === 'categoryModal') { document.getElementById('categoryModal')?.classList.remove('show'); return; }

  if (e.target.closest('#addBannerBtn')) { openBannerForm(); return; }
  if (e.target.closest('#bannerModalClose') || e.target.closest('#bannerCancelBtn')) { document.getElementById('bannerModal')?.classList.remove('show'); return; }
  if (e.target.id === 'bannerModal') { document.getElementById('bannerModal')?.classList.remove('show'); return; }

  const sb = e.target.closest('[data-status]');
  if (sb && sb.classList.contains('action-btn')) { updateOrderStatus(sb.dataset.status); return; }

  if (e.target.closest('#adminOrderClose') || e.target.id === 'adminOrderModal') { document.getElementById('adminOrderModal')?.classList.remove('show'); return; }
  if (e.target.closest('#adminUserClose') || e.target.id === 'adminUserModal') { document.getElementById('adminUserModal')?.classList.remove('show'); return; }

  const adminTab = e.target.closest('.admin-tab');
  if (adminTab) {
    document.querySelectorAll('.admin-tab').forEach(t => t.classList.remove('active'));
    adminTab.classList.add('active');
    const w = adminTab.dataset.tab;
    ['products','categories','banners','orders','users','analytics'].forEach(p => {
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

  if (e.target.id === 'b-image-url') {
    const v = e.target.value.trim();
    const prev = document.getElementById('bannerPreview');
    if (v && prev) prev.innerHTML = `<img src="${buildImageUrl(v)}" style="width:100%;border-radius:12px" onerror="this.style.display='none'">`;
    return;
  }

  if (e.target.classList.contains('img-filename')) {
    const slot = e.target.dataset.slot;
    const val = e.target.value.trim();
    const prev = document.getElementById('prev-' + slot);
    if (!prev) return;
    if (val) { prev.innerHTML = `<img src="${buildImageUrl(val)}" onerror="this.style.display='none'">`; prev.classList.add('has-image'); }
    else { prev.innerHTML = ''; prev.classList.remove('has-image'); }
  }

  if (e.target.id === 'c-img') {
    const v = e.target.value.trim();
    const prev = document.getElementById('catPreview');
    if (!prev) return;
    if (v) { prev.innerHTML = `<img src="${buildImageUrl(v)}" onerror="this.style.display='none'">`; prev.classList.add('has-image'); }
    else { prev.innerHTML = ''; prev.classList.remove('has-image'); }
  }

  if (['co-city','co-district','co-province'].includes(e.target.id)) updateCheckoutSummary();

  if (e.target.id === 'productSearch') {
    const q = e.target.value.toLowerCase().trim();
    const f = PRODUCTS.filter(p => p.name.toLowerCase().includes(q) || (p.sku||'').toLowerCase().includes(q));
    renderProductsTable(f);
  }
  if (e.target.id === 'categorySearch') {
    const q = e.target.value.toLowerCase().trim();
    const f = allCategories.filter(c => (c.label||'').toLowerCase().includes(q));
    renderCategoriesTable(f);
  }
  if (e.target.id === 'orderSearch') {
    const q = e.target.value.toLowerCase().trim();
    const f = allOrders.filter(o => (o.orderId||'').toLowerCase().includes(q) || (o.fullName||'').toLowerCase().includes(q));
    renderOrdersTable(f);
  }
  if (e.target.id === 'userSearch') {
    const q = e.target.value.toLowerCase().trim();
    const f = allUsers.filter(u => (u.email||'').toLowerCase().includes(q));
    renderUsersTable(f);
  }
});

/* ═══════ SEARCH ═══════ */
function openSearch() { document.getElementById('searchOverlay')?.classList.add('show'); document.body.style.overflow = 'hidden'; setTimeout(() => document.getElementById('searchInput')?.focus(), 100); }
function closeSearch() { document.getElementById('searchOverlay')?.classList.remove('show'); document.body.style.overflow = ''; const r = document.getElementById('searchResults'); if (r) { r.classList.remove('show'); r.innerHTML = ''; } const i = document.getElementById('searchInput'); if (i) i.value = ''; }
function performSearch(q) {
  const r = document.getElementById('searchResults');
  if (!r) return;
  const term = q.trim().toLowerCase();
  if (!term) { r.classList.remove('show'); return; }
  const matches = PRODUCTS.filter(p => p.name.toLowerCase().includes(term) || (p.desc||'').toLowerCase().includes(term) || (p.sku||'').toLowerCase().includes(term));
  if (!matches.length) { r.innerHTML = `<div class="search-empty">No matches</div>`; r.classList.add('show'); return; }
  r.innerHTML = matches.map(p => `<div class="search-result" data-search-id="${p.id}">${(p.images&&p.images[0])?`<img src="${p.images[0]}">`:''}<div class="sr-info"><div class="sr-name">${p.name}</div><div class="sr-price">${money(p.price)}</div></div></div>`).join('');
  r.classList.add('show');
}

/* ═══════ AUTH MODAL ═══════ */
function openAuth(tab = 'login') { document.getElementById('authModal')?.classList.add('show'); document.body.style.overflow = 'hidden'; switchTab(tab); }
function closeAuth() { document.getElementById('authModal')?.classList.remove('show'); document.body.style.overflow = ''; }
function switchTab(tab) {
  document.querySelectorAll('.tabs button').forEach(b => b.classList.toggle('active', b.dataset.tab === tab));
  const lf = document.getElementById('loginForm'); if (lf) lf.hidden = tab !== 'login';
  const sf = document.getElementById('signupForm'); if (sf) sf.hidden = tab !== 'signup';
}

/* ═══════ AUTH FORMS ═══════ */
const loginForm = document.getElementById('loginForm');
if (loginForm) loginForm.addEventListener('submit', async e => {
  e.preventDefault();
  const email = document.getElementById('li-email').value.trim();
  const pass = document.getElementById('li-pass').value;
  const btn = document.getElementById('loginBtn');
  if (!isEmail(email)) return toast('Valid email required');
  if (pass.length < 6) return toast('Password 6+ chars');
  btn.classList.add('loading'); btn.textContent = 'Signing in...';
  try {
    const cred = await auth.signInWithEmailAndPassword(email, pass);
    if (cred.user.providerData[0].providerId === 'password' && !cred.user.emailVerified) {
      await auth.signOut(); toast('Verify your email first.'); return;
    }
    await saveUserToFirestore(cred.user);
    closeAuth(); toast('Welcome back');
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
  if (!isEmail(email)) return toast('Valid email required');
  if (pass.length < 6) return toast('Password 6+ chars');
  if (pass !== pass2) return toast('Passwords do not match');
  if (terms && !terms.checked) return toast('Accept terms');
  btn.classList.add('loading'); btn.textContent = 'Creating...';
  try {
    const cred = await auth.createUserWithEmailAndPassword(email, pass);
    await saveUserToFirestore(cred.user);
    await cred.user.sendEmailVerification();
    await auth.signOut();
    closeAuth(); toast('Verification email sent!');
    signupForm.reset(); switchTab('login');
  } catch (err) { handleAuthError(err); }
  finally { btn.classList.remove('loading'); btn.textContent = 'Create Account'; }
});

document.querySelectorAll('[data-social="Google"]').forEach(btn => {
  btn.addEventListener('click', async () => {
    const provider = new firebase.auth.GoogleAuthProvider();
    try {
      const result = await auth.signInWithPopup(provider);
      await saveUserToFirestore(result.user);
      closeAuth(); toast('Signed in');
    } catch (err) { if (err.code !== 'auth/popup-closed-by-user') handleAuthError(err); }
  });
});
document.querySelectorAll('[data-social="Apple"]').forEach(btn => btn.addEventListener('click', () => toast('Coming soon')));

const forgotBtn = document.getElementById('forgotPass');
if (forgotBtn) forgotBtn.addEventListener('click', async e => {
  e.preventDefault();
  const email = document.getElementById('li-email').value.trim();
  if (!isEmail(email)) return toast('Enter email first');
  try { await auth.sendPasswordResetEmail(email); toast('Reset email sent'); }
  catch (err) { handleAuthError(err); }
});

function handleAuthError(err) {
  const code = err.code || '';
  const msgs = {
    'auth/user-not-found':'No account found.', 'auth/wrong-password':'Incorrect password.',
    'auth/invalid-credential':'Invalid credentials.', 'auth/invalid-email':'Invalid email.',
    'auth/email-already-in-use':'Email already registered.', 'auth/weak-password':'Password too weak.',
    'auth/too-many-requests':'Too many attempts.', 'auth/network-request-failed':'Network error.',
    'auth/unauthorized-domain':'Domain not authorized.'
  };
  toast(msgs[code] || 'Something went wrong.');
  console.error(err);
}

/* ═══════ CHECKOUT FORM ═══════ */
const checkoutForm = document.getElementById('checkoutForm');
if (checkoutForm) checkoutForm.addEventListener('submit', async e => {
  e.preventDefault();
  const name = document.getElementById('co-name').value.trim();
  const phone = document.getElementById('co-phone').value.trim();
  const city = document.getElementById('co-city').value.trim();
  const district = document.getElementById('co-district').value.trim();
  const province = document.getElementById('co-province').value;
  const address = document.getElementById('co-address').value.trim();
  if (name.length < 2) return toast('Name required');
  if (!isPhone(phone)) return toast('Valid 03XX number');
  if (city.length < 2) return toast('City required');
  if (district.length < 2) return toast('District required');
  if (!province) return toast('Province required');
  if (address.length < 5) return toast('Address required');
  if (!auth.currentUser) { closeCheckout(); openAuth('signup'); return; }
  const btn = document.getElementById('placeOrderBtn');
  btn.classList.add('loading'); btn.textContent = 'Placing...';
  await placeOrder(auth.currentUser, { fullName: name, phone, address, city, district, province });
  btn.classList.remove('loading'); btn.textContent = 'Place Order';
  checkoutForm.reset();
});

function closeCheckout() { document.getElementById('checkoutModal')?.classList.remove('show'); document.body.style.overflow = ''; }

/* ═══════ EDIT PROFILE ═══════ */
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
    toast('Updated'); loadProfile(user);
  } catch (e) { toast('Error'); }
});

/* ═══════ FORM SUBMITS ═══════ */
const productForm = document.getElementById('productForm');
if (productForm) productForm.addEventListener('submit', saveProduct);
const categoryForm = document.getElementById('categoryForm');
if (categoryForm) categoryForm.addEventListener('submit', saveCategory);
const bannerForm = document.getElementById('bannerForm');
if (bannerForm) bannerForm.addEventListener('submit', saveBanner);

/* ═══════ REFRESH BUTTONS ═══════ */
if (document.getElementById('refreshProducts')) document.getElementById('refreshProducts').addEventListener('click', loadProducts);
if (document.getElementById('refreshCategories')) document.getElementById('refreshCategories').addEventListener('click', loadCategories);
if (document.getElementById('refreshBanners')) document.getElementById('refreshBanners').addEventListener('click', loadBanners);
if (document.getElementById('refreshOrders')) document.getElementById('refreshOrders').addEventListener('click', loadOrders);
if (document.getElementById('refreshUsers')) document.getElementById('refreshUsers').addEventListener('click', loadUsers);

/* ═══════ NEWSLETTER ═══════ */
const newsForm = document.getElementById('newsForm');
if (newsForm) newsForm.addEventListener('submit', e => {
  e.preventDefault();
  const input = e.target.querySelector('input');
  if (!isEmail(input.value)) return toast('Valid email required');
  toast("You're on the list!"); input.value = '';
});

/* ═══════ HEADER SCROLL ═══════ */
const navWrap = document.getElementById('navWrap');
if (navWrap) window.addEventListener('scroll', () => { navWrap.classList.toggle('scrolled', window.scrollY > 20); }, { passive: true });

/* ═══════ MARQUEE ═══════ */
const mq = document.getElementById('marquee');
if (mq) mq.innerHTML += mq.innerHTML;

/* ═══════ ESC ═══════ */
document.addEventListener('keydown', e => {
  if (e.key === 'Escape') {
    closeCart(); closeAuth(); closeSearch(); closeCheckout();
    ['detailModal','productModal','categoryModal','bannerModal','sizeGuideModal','orderDetailModal','adminOrderModal','adminUserModal','editModal','successModal']
      .forEach(id => { const el = document.getElementById(id); if (el) el.classList.remove('show'); });
    document.body.style.overflow = '';
  }
});
