let products = [];

const state = {
  category: 'All',
  query: '',
  selected: null,
};

const els = {
  cards: document.getElementById('cards'),
  resultMeta: document.getElementById('result-meta'),
  search: document.getElementById('search'),
  filterButtons: Array.from(document.querySelectorAll('.filter-btn')),
  nearbyBtn: document.getElementById('nearby-btn'),
  // Modal elements
  modal: document.getElementById('modal'),
  modalClose: document.getElementById('modal-close'),
  modalImg: document.getElementById('modal-img'),
  modalTitle: document.getElementById('modal-title'),
  modalNotes: document.getElementById('modal-notes'),
  modalCategory: document.getElementById('modal-category'),
  modalRecycle: document.getElementById('modal-recycle'),
  modalTips: document.getElementById('modal-tips'),
  modalFind: document.getElementById('modal-find-recyclers'),
};

function debounce(fn, wait = 200){
  let t; return (...args) => { clearTimeout(t); t = setTimeout(() => fn(...args), wait); };
}

function formatCount(n){
  return n === 1 ? '1 item' : `${n} items`;
}

function filterProducts(){
  const q = state.query.trim().toLowerCase();
  return products.filter(p => {
    const matchesCategory = state.category === 'All' || p.category === state.category;
    const hay = `${p.name} ${p.category} ${p.notes ?? ''}`.toLowerCase();
    const matchesQuery = !q || hay.includes(q);
    return matchesCategory && matchesQuery;
  });
}

function renderProducts(list){
  els.cards.innerHTML = '';
  if(list.length === 0){
    els.cards.innerHTML = `<div class="empty">No results found. Try a different search or category.</div>`;
  } else {
    const fragment = document.createDocumentFragment();
    list.forEach(item => {
      const card = document.createElement('article');
      card.className = 'card';
      card.setAttribute('tabindex', '0');
      card.setAttribute('role', 'button');
      card.setAttribute('aria-label', `${item.name} details`);
      card.dataset.cat = item.category;
      card.innerHTML = `
        <div class="card-media">
          <img src="${item.image}" alt="${item.name}" onerror="this.src='images/placeholder.svg'"/>
        </div>
        <div class="card-body">
          <h3 class="card-title">${item.name}</h3>
          <p class="card-sub">${item.notes ?? ''}</p>
          <div class="badges">
            <span class="badge cat">${item.category}</span>
            ${item.recyclable
              ? '<span class="badge rec">Recyclable</span>'
              : '<span class="badge nonrec">Non‑recyclable</span>'}
          </div>
        </div>
      `;
      card.addEventListener('click', () => openModal(item));
      card.addEventListener('keydown', (e) => {
        if(e.key === 'Enter' || e.key === ' '){ e.preventDefault(); openModal(item); }
      });
      fragment.appendChild(card);
    });
    els.cards.appendChild(fragment);
  }
  els.resultMeta.textContent = `${formatCount(list.length)} • ${state.category}` + (state.query ? ` • “${state.query}”` : '');
}

function setActiveButton(btn){
  els.filterButtons.forEach(b => {
    const isActive = b === btn;
    b.classList.toggle('active', isActive);
    b.setAttribute('aria-pressed', isActive ? 'true' : 'false');
  });
}

function init(){
  // Load products from JSON then render
  fetch('data/products.json')
    .then(r => r.ok ? r.json() : Promise.reject(new Error('Failed to load products')))
    .then(data => {
      products = Array.isArray(data) ? data : [];
      renderProducts(filterProducts());
    })
    .catch(() => {
      // Fallback to empty with message
      products = [];
      renderProducts([]);
      els.resultMeta.textContent = '0 items • Failed to load data';
    });

  // Search
  els.search.addEventListener('input', debounce(e => {
    state.query = e.target.value;
    renderProducts(filterProducts());
  }, 150));

  // Filters
  els.filterButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      state.category = btn.dataset.category;
      setActiveButton(btn);
      renderProducts(filterProducts());
    });
    btn.addEventListener('keydown', (e) => {
      if(e.key === 'Enter' || e.key === ' '){
        e.preventDefault(); btn.click();
      }
    });
  });

  // Nearby recyclers button
  if(els.nearbyBtn){
    els.nearbyBtn.addEventListener('click', () => {
      const fallback = () => window.open('https://www.google.com/maps/search/e-waste+recycling', '_blank');
      if(!('geolocation' in navigator)) return fallback();
      navigator.geolocation.getCurrentPosition(pos => {
        const { latitude, longitude } = pos.coords || {};
        if(typeof latitude === 'number' && typeof longitude === 'number'){
          const url = `https://www.google.com/maps/search/e-waste+recycling/@${latitude},${longitude},12z`;
          window.open(url, '_blank');
        } else { fallback(); }
      }, fallback, { enableHighAccuracy:true, timeout:5000, maximumAge:300000 });
    });
  }

  // Modal close interactions
  document.addEventListener('click', (e) => {
    const target = e.target;
    if(target && target.closest('[data-close]')) closeModal();
  });
  els.modalClose?.addEventListener('click', closeModal);
  document.addEventListener('keydown', (e) => {
    if(e.key === 'Escape' && isModalOpen()) closeModal();
  });
}

function isModalOpen(){
  return els.modal?.classList.contains('show');
}

let lastFocused = null;
function openModal(item){
  state.selected = item;
  lastFocused = document.activeElement;
  if(!els.modal) return;
  els.modalImg.src = item.image || 'images/placeholder.svg';
  els.modalImg.alt = item.name;
  els.modalTitle.textContent = item.name;
  els.modalNotes.textContent = item.notes || '';
  els.modalCategory.textContent = item.category;
  const rec = !!item.recyclable;
  els.modalRecycle.className = 'badge ' + (rec ? 'rec' : 'nonrec');
  els.modalRecycle.textContent = rec ? 'Recyclable' : 'Non‑recyclable';
  // Tips
  els.modalTips.innerHTML = '';
  if(Array.isArray(item.tips) && item.tips.length){
    item.tips.forEach(t => {
      const li = document.createElement('li');
      li.textContent = t; els.modalTips.appendChild(li);
    });
    els.modalTips.style.display = '';
  } else {
    els.modalTips.style.display = 'none';
  }
  // Find recyclers for this item
  els.modalFind?.addEventListener('click', onFindForItem);
  els.modal.classList.add('show');
  document.body.classList.add('modal-open');
  // focus management
  setTimeout(() => els.modalClose?.focus(), 0);
  trapFocus(els.modal);
}

function closeModal(){
  els.modal?.classList.remove('show');
  document.body.classList.remove('modal-open');
  els.modalFind?.removeEventListener('click', onFindForItem);
  if(lastFocused && typeof lastFocused.focus === 'function') lastFocused.focus();
  state.selected = null;
}

function onFindForItem(){
  const name = state.selected?.name || '';
  const q = encodeURIComponent(`${name} recycling`);
  const fallback = () => window.open(`https://www.google.com/maps/search/${q}`, '_blank');
  if(!('geolocation' in navigator)) return fallback();
  navigator.geolocation.getCurrentPosition(pos => {
    const { latitude, longitude } = pos.coords || {};
    if(typeof latitude === 'number' && typeof longitude === 'number'){
      const url = `https://www.google.com/maps/search/${q}/@${latitude},${longitude},12z`;
      window.open(url, '_blank');
    } else { fallback(); }
  }, fallback, { enableHighAccuracy:true, timeout:5000, maximumAge:300000 });
}

function trapFocus(container){
  const selectors = [
    'a[href]', 'button', 'input', 'select', 'textarea', '[tabindex]:not([tabindex="-1"])'
  ];
  const focusables = () => Array.from(container.querySelectorAll(selectors.join(',')))
    .filter(el => !el.hasAttribute('disabled') && el.offsetParent !== null);
  container.addEventListener('keydown', (e) => {
    if(e.key !== 'Tab') return;
    const f = focusables();
    if(!f.length) return;
    const first = f[0], last = f[f.length - 1];
    if(e.shiftKey && document.activeElement === first){ e.preventDefault(); last.focus(); }
    else if(!e.shiftKey && document.activeElement === last){ e.preventDefault(); first.focus(); }
  });
}

document.addEventListener('DOMContentLoaded', init);
