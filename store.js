/* ============================================================
   store.js  –  Quick Koffiee  |  Central Data & Logic Layer
   ============================================================ */

const Store = (() => {

  const KEY_USERS   = 'qk_users';
  const KEY_SESSION = 'qk_session';
  const KEY_CART    = 'qk_cart';
  const KEY_ORDERS  = 'qk_orders';
  const KEY_MENU    = 'qk_menu';

  const load  = key        => JSON.parse(localStorage.getItem(key) || 'null');
  const save  = (key, val) => localStorage.setItem(key, JSON.stringify(val));

  /* ── DEFAULT MENU ── */
  const DEFAULT_MENU = [
    { id:'esp1', category:'espresso', name:'Classic Espresso',   price:45, desc:'Bold, rich single-shot espresso with a velvety crema.' },
    { id:'esp2', category:'espresso', name:'Double Shot',        price:55, desc:'Two shots of perfectly extracted espresso for the bold soul.' },
    { id:'esp3', category:'espresso', name:'Cappuccino',         price:65, desc:'Espresso crowned with silky steamed milk and thick foam.' },
    { id:'esp4', category:'espresso', name:'Flat White',         price:60, desc:'Velvety micro-foam espresso — smooth and strong.' },
    { id:'esp5', category:'espresso', name:'Macchiato',          price:58, desc:'Espresso "stained" with a dollop of creamy foam.' },
    { id:'esp6', category:'espresso', name:'Americano',          price:50, desc:'Espresso diluted with hot water — clean and robust.' },
    { id:'brw1', category:'brew',     name:'Pour Over',          price:70, desc:'Single-origin beans, slow pour, clean bright flavour.' },
    { id:'brw2', category:'brew',     name:'French Press',       price:65, desc:'Full-bodied and bold — steeped to perfection.' },
    { id:'brw3', category:'brew',     name:'Cold Brew',          price:75, desc:'Smooth, low-acid brew steeped overnight in cold water.' },
    { id:'brw4', category:'brew',     name:'Chemex',             price:80, desc:'Elegant clarity — paper-filtered for a pure, bright cup.' },
    { id:'brw5', category:'brew',     name:'AeroPress',          price:68, desc:'Pressure-brewed for a rich, full-flavoured concentrate.' },
    { id:'icd1', category:'iced',     name:'Iced Latte',         price:72, desc:'Shots over ice with cold milk — your afternoon saviour.' },
    { id:'icd2', category:'iced',     name:'Iced Mocha',         price:78, desc:'Espresso, chocolate syrup, cold milk, ice. Heaven.' },
    { id:'icd3', category:'iced',     name:'Frappuccino',        price:85, desc:'Blended coffee, ice and cream — thick and indulgent.' },
    { id:'icd4', category:'iced',     name:'Iced Vanilla Latte', price:80, desc:'Cold latte kissed with sweet Madagascar vanilla.' },
    { id:'icd5', category:'iced',     name:'Cold Brew Tonic',    price:82, desc:'Cold brew over tonic water — effervescent and refreshing.' },
  ];

  function getMenu() {
    const stored = load(KEY_MENU);
    if (!stored || stored.length === 0) { save(KEY_MENU, DEFAULT_MENU); return DEFAULT_MENU; }
    return stored;
  }
  function saveMenu(items)          { save(KEY_MENU, items); }
  function addMenuItem(item)        { const m = getMenu(); m.push(item); saveMenu(m); }
  function updateMenuItem(id, upd)  { saveMenu(getMenu().map(i => i.id === id ? {...i,...upd} : i)); }
  function deleteMenuItem(id)       { saveMenu(getMenu().filter(i => i.id !== id)); }

  /* ── USERS ── */
  function getUsers() {
    let users = load(KEY_USERS);
    if (!users) {
      users = [{ id:'owner_001', name:'Owner', email:'owner@quickkoffiee.com', password:'owner123', role:'owner', createdAt: new Date().toISOString() }];
      save(KEY_USERS, users);
    }
    return users;
  }

  function registerUser(name, email, password) {
    const users = getUsers();
    if (users.find(u => u.email.toLowerCase() === email.toLowerCase()))
      return { ok:false, msg:'An account with this email already exists.' };
    const newUser = { id:'usr_'+Date.now(), name, email, password, role:'customer', createdAt: new Date().toISOString() };
    users.push(newUser);
    save(KEY_USERS, users);
    return { ok:true, user:newUser };
  }

  function loginUser(email, password) {
    const user = getUsers().find(u => u.email.toLowerCase() === email.toLowerCase() && u.password === password);
    if (!user) return { ok:false, msg:'Incorrect email or password.' };
    const session = { id:user.id, name:user.name, email:user.email, role:user.role };
    save(KEY_SESSION, session);
    return { ok:true, session };
  }

  function logoutUser() { localStorage.removeItem(KEY_SESSION); }
  function getSession() { return load(KEY_SESSION); }

  /* ── CART ── */
  function getCart() { return load(KEY_CART) || []; }

  function addToCart(item) {
    const cart = getCart();
    const existing = cart.find(i => i.id === item.id);
    if (existing) { existing.qty += 1; } else { cart.push({...item, qty:1}); }
    save(KEY_CART, cart);
  }

  function updateQty(id, delta) {
    let cart = getCart();
    const item = cart.find(i => i.id === id);
    if (!item) return;
    item.qty += delta;
    if (item.qty <= 0) cart = cart.filter(i => i.id !== id);
    save(KEY_CART, cart);
  }

  function removeFromCart(id) { save(KEY_CART, getCart().filter(i => i.id !== id)); }
  function clearCart()        { localStorage.removeItem(KEY_CART); }
  function cartTotal()        { return getCart().reduce((s,i) => s + i.price * i.qty, 0); }
  function cartCount()        { return getCart().reduce((s,i) => s + i.qty, 0); }

  /* ── ORDERS ── */
  function getOrders() { return load(KEY_ORDERS) || []; }

  function placeOrder(name, email, note) {
    const cart = getCart();
    if (cart.length === 0) return { ok:false, msg:'Cart is empty.' };
    const subtotal = cartTotal();
    const vat      = subtotal * 0.14;
    const total    = subtotal + vat;
    const order    = { id:'ORD-'+Date.now(), customer:name, email, note, items:cart, subtotal, vat, total, status:'pending', placedAt: new Date().toISOString() };
    const orders   = getOrders();
    orders.unshift(order);
    save(KEY_ORDERS, orders);
    clearCart();
    return { ok:true, order };
  }

  function updateOrderStatus(id, status) {
    save(KEY_ORDERS, getOrders().map(o => o.id === id ? {...o, status} : o));
  }

  return {
    getMenu, saveMenu, addMenuItem, updateMenuItem, deleteMenuItem,
    getUsers, registerUser, loginUser, logoutUser, getSession,
    getCart, addToCart, updateQty, removeFromCart, clearCart, cartTotal, cartCount,
    getOrders, placeOrder, updateOrderStatus
  };

})();

