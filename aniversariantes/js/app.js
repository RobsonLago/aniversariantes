// =====================================================
// ANIVERSARIANTES APP - Lógica Principal
// =====================================================

const MONTHS_SHORT = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez'];
const MONTHS_FULL  = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'];
const STORAGE_KEY  = 'aniversariantes_v3';

// ——— Estado global ———
let db        = [];
let nextId    = 1;
let view      = 'todos';
let filterMonth = null;
let notifOn   = false;
let deferredPrompt = null;

// =====================================================
// BANCO DE DADOS (localStorage)
// =====================================================

function loadDB() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        db = parsed;
        nextId = Math.max(...db.map(p => p.id || 0)) + 1;
        return;
      }
    }
  } catch (e) { console.warn('loadDB error', e); }
  // Primeiro uso: carrega dados iniciais
  db = INITIAL_DATA.map((r, i) => ({ id: i + 1, name: r.name, dob: r.dob || '', phone: r.phone || '' }));
  nextId = db.length + 1;
  saveDB();
}

function saveDB() {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(db)); } catch (e) { console.warn('saveDB error', e); }
}

// =====================================================
// FUNÇÕES DE DATA / CÁLCULO
// =====================================================

function parseDate(dob) {
  if (!dob) return null;
  const d = new Date(dob + 'T12:00:00');
  return isNaN(d.getTime()) ? null : d;
}

function calcAge(dob) {
  const d = parseDate(dob);
  if (!d) return null;
  const today = new Date();
  let age = today.getFullYear() - d.getFullYear();
  if (today.getMonth() < d.getMonth() || (today.getMonth() === d.getMonth() && today.getDate() < d.getDate())) age--;
  return age;
}

function isToday(dob) {
  const d = parseDate(dob);
  if (!d) return false;
  const t = new Date();
  return d.getMonth() === t.getMonth() && d.getDate() === t.getDate();
}

function daysUntil(dob) {
  const d = parseDate(dob);
  if (!d) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const next = new Date(today.getFullYear(), d.getMonth(), d.getDate());
  if (next < today) next.setFullYear(today.getFullYear() + 1);
  return Math.round((next - today) / 86400000);
}

function isSoon(dob, days = 30) {
  const n = daysUntil(dob);
  return n !== null && n > 0 && n <= days;
}

function isThisMonth(dob) {
  const d = parseDate(dob);
  if (!d) return false;
  return d.getMonth() === new Date().getMonth();
}

function getInitials(name) {
  return name.trim().split(/\s+/).slice(0, 2).map(w => w[0] || '').join('').toUpperCase() || '?';
}

function formatDate(dob) {
  const d = parseDate(dob);
  if (!d) return '';
  return `${d.getDate()} de ${MONTHS_FULL[d.getMonth()]} de ${d.getFullYear()}`;
}

function formatPhone(phone) {
  if (!phone) return '';
  // limpa e formata
  const digits = String(phone).replace(/\D/g, '');
  if (digits.length === 11) return `(${digits.slice(0,2)}) ${digits.slice(2,7)}-${digits.slice(7)}`;
  if (digits.length === 10) return `(${digits.slice(0,2)}) ${digits.slice(2,6)}-${digits.slice(6)}`;
  return phone;
}

// =====================================================
// RENDER
// =====================================================

function render() {
  const today = new Date();

  // Header date
  document.getElementById('header-date').textContent =
    today.toLocaleDateString('pt-BR', { weekday:'long', day:'numeric', month:'long', year:'numeric' });

  // Today banners
  const todayList = db.filter(p => isToday(p.dob));
  const todaySection = document.getElementById('today-section');
  if (todayList.length > 0) {
    todaySection.innerHTML = `
      <div class="today-banner">
        <div class="today-banner-title">🎉 Aniversariante${todayList.length > 1 ? 's' : ''} hoje!</div>
        ${todayList.map(p => `
          <div class="today-person">
            <div class="today-avatar">${getInitials(p.name)}</div>
            <div>
              <div class="today-name">${p.name}</div>
              <div class="today-sub">Fazendo ${calcAge(p.dob)} anos hoje! 🎂</div>
            </div>
          </div>`).join('')}
      </div>`;
  } else {
    todaySection.innerHTML = '';
  }

  // Stats
  const withDate = db.filter(p => p.dob);
  document.getElementById('stat-total').textContent  = db.length;
  document.getElementById('stat-month').textContent  = withDate.filter(p => isThisMonth(p.dob)).length;
  document.getElementById('stat-today').textContent  = todayList.length;
  document.getElementById('stat-nodate').textContent = db.filter(p => !p.dob).length;

  // Month filter pills
  const mfEl = document.getElementById('month-filters');
  let mfHtml = '';
  MONTHS_SHORT.forEach((m, i) => {
    const cnt = withDate.filter(p => { const d = parseDate(p.dob); return d && d.getMonth() === i; }).length;
    if (cnt > 0) mfHtml += `<button class="mf-btn ${filterMonth === i ? 'on' : ''}" onclick="setMonthFilter(${i})">${m} <b>${cnt}</b></button>`;
  });
  mfEl.innerHTML = mfHtml;

  // Filter & sort list
  const q = document.getElementById('search').value.trim().toLowerCase();
  let filtered = [...db];

  if (q)                    filtered = filtered.filter(p => p.name.toLowerCase().includes(q) || (p.phone || '').includes(q));
  if (view === 'este-mes')  filtered = filtered.filter(p => isThisMonth(p.dob));
  if (view === 'proximos')  filtered = filtered.filter(p => isToday(p.dob) || isSoon(p.dob, 30));
  if (view === 'sem-data')  filtered = filtered.filter(p => !p.dob);
  if (filterMonth !== null) filtered = filtered.filter(p => { const d = parseDate(p.dob); return d && d.getMonth() === filterMonth; });

  // Sort: by month/day ascending; no-date at end
  filtered.sort((a, b) => {
    if (!a.dob && !b.dob) return a.name.localeCompare(b.name, 'pt-BR');
    if (!a.dob) return 1;
    if (!b.dob) return -1;
    const da = parseDate(a.dob), db2 = parseDate(b.dob);
    const ak = da.getMonth() * 100 + da.getDate();
    const bk = db2.getMonth() * 100 + db2.getDate();
    return ak - bk;
  });

  // Build cards
  let html = '';
  let lastMonth = -99;

  if (filtered.length === 0) {
    html = `<div class="empty-state">
      <div class="emoji">🔍</div>
      <p>Nenhuma pessoa encontrada</p>
    </div>`;
  } else {
    filtered.forEach(p => {
      const d = parseDate(p.dob);
      const today_flag = isToday(p.dob);
      const soon_flag  = !today_flag && isSoon(p.dob, 7);
      const age        = calcAge(p.dob);
      const days       = daysUntil(p.dob);

      // Group header
      if (d) {
        const m = d.getMonth();
        if (m !== lastMonth) {
          html += `<div class="month-group-label">${MONTHS_FULL[m]}</div>`;
          lastMonth = m;
        }
      } else if (lastMonth !== -1 && view !== 'este-mes' && view !== 'proximos' && filterMonth === null) {
        html += `<div class="month-group-label">Sem data</div>`;
        lastMonth = -1;
      }

      const pill = today_flag
        ? `<span class="pill pill-today">🎉 Hoje!</span>`
        : soon_flag
          ? `<span class="pill pill-soon">em ${days} dias</span>`
          : '';

      const metaParts = [];
      if (p.dob) metaParts.push(formatDate(p.dob));
      if (p.phone) metaParts.push(`📞 ${formatPhone(p.phone)}`);

      html += `
        <div class="person-card ${today_flag ? 'is-today' : ''} ${soon_flag ? 'is-soon' : ''}" onclick="openModal(${p.id})">
          <div class="avatar ${today_flag ? 'is-today-av' : p.dob ? 'has-date' : 'no-date'}">${getInitials(p.name)}</div>
          <div class="person-info">
            <div class="person-name">${esc(p.name)}</div>
            <div class="person-meta">${metaParts.join(' · ')}</div>
            ${pill}
          </div>
          <div class="person-right">
            ${age !== null
              ? `<div class="age-chip">${age}</div><div class="age-unit">anos</div>`
              : '<div class="age-unit" style="font-size:20px">—</div>'}
          </div>
        </div>`;
    });
  }

  document.getElementById('list').innerHTML = html;
}

function esc(str) {
  return String(str).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

// =====================================================
// VIEW / FILTER
// =====================================================

function setView(btn, v) {
  view = v;
  filterMonth = null;
  document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
  btn.classList.add('active');
  render();
}

function setMonthFilter(m) {
  filterMonth = filterMonth === m ? null : m;
  render();
}

// =====================================================
// MODAL - ADICIONAR / EDITAR
// =====================================================

function openModal(id) {
  const isNew = id === null;
  const p = isNew ? { id: null, name: '', dob: '', phone: '' } : db.find(x => x.id === id);
  if (!p) return;

  const age   = calcAge(p.dob);
  const days  = daysUntil(p.dob);

  const infoBox = (!isNew && p.dob) ? `
    <div class="info-box">
      🎂 <b>${p.name.split(' ')[0]}</b> faz <b>${age} anos</b> —
      ${isToday(p.dob) ? 'é hoje! 🎉' : `próximo aniversário em <b>${days} dias</b>`}
    </div>` : '';

  document.getElementById('modal-content').innerHTML = `
    <div class="modal-avatar" id="modal-av">${isNew ? '+' : getInitials(p.name)}</div>
    <div class="modal-title">${isNew ? 'Adicionar pessoa' : 'Editar pessoa'}</div>
    ${infoBox}
    <div class="form-group">
      <label class="form-label">Nome completo</label>
      <input class="form-input" id="m-name" type="text" value="${esc(p.name)}" placeholder="Ex: Maria Silva" oninput="updateAvatar()">
    </div>
    <div class="form-group">
      <label class="form-label">Data de nascimento</label>
      <input class="form-input" id="m-dob" type="date" value="${p.dob || ''}">
    </div>
    <div class="form-group">
      <label class="form-label">Telefone / WhatsApp</label>
      <input class="form-input" id="m-phone" type="tel" value="${esc(p.phone || '')}" placeholder="Ex: 35999999999">
    </div>
    <div class="btn-row">
      ${!isNew ? `<button class="btn btn-danger" onclick="deletePerson(${p.id})">Excluir</button>` : ''}
      <button class="btn btn-ghost" onclick="closeModal()">Cancelar</button>
      <button class="btn btn-primary" onclick="savePerson(${isNew ? 'null' : p.id})">${isNew ? 'Adicionar' : 'Salvar'}</button>
    </div>`;

  document.getElementById('backdrop').classList.remove('hidden');
  setTimeout(() => document.getElementById('m-name').focus(), 300);
}

function updateAvatar() {
  const name = document.getElementById('m-name').value;
  const av = document.getElementById('modal-av');
  if (av) av.textContent = name ? getInitials(name) : '+';
}

function closeModal() {
  document.getElementById('backdrop').classList.add('hidden');
}

function handleBackdropClick(e) {
  if (e.target === document.getElementById('backdrop')) closeModal();
}

function savePerson(id) {
  const name  = document.getElementById('m-name').value.trim();
  const dob   = document.getElementById('m-dob').value;
  const phone = document.getElementById('m-phone').value.trim();

  if (!name) {
    document.getElementById('m-name').style.borderColor = '#D85A30';
    document.getElementById('m-name').focus();
    return;
  }

  if (id === null) {
    db.push({ id: nextId++, name, dob, phone });
  } else {
    const idx = db.findIndex(p => p.id === id);
    if (idx >= 0) db[idx] = { id, name, dob, phone };
  }

  saveDB();
  closeModal();
  render();
}

function deletePerson(id) {
  if (!confirm('Remover esta pessoa da lista?')) return;
  db = db.filter(p => p.id !== id);
  saveDB();
  closeModal();
  render();
}

// =====================================================
// IMPORT / EXPORT
// =====================================================

function openImport() {
  document.getElementById('menu-backdrop').classList.remove('hidden');
}

function closeMenu() {
  document.getElementById('menu-backdrop').classList.add('hidden');
}

function exportCSV() {
  const rows = [['ID','Nome','DataNascimento','Telefone','Idade','AniversarioEsteAno']];
  db.forEach(p => {
    const age  = calcAge(p.dob) ?? '';
    const ann  = p.dob ? `${new Date().getFullYear()}-${p.dob.slice(5)}` : '';
    rows.push([p.id, p.name, p.dob || '', p.phone || '', age, ann]);
  });
  const csv = rows.map(r => r.map(c => `"${String(c).replace(/"/g,'""')}"`).join(',')).join('\n');
  download('aniversariantes.csv', 'text/csv;charset=utf-8;', '\uFEFF' + csv);
  closeMenu();
}

function exportJSON() {
  const enriched = db.map(p => ({
    ...p,
    idade: calcAge(p.dob),
    diasParaAniversario: daysUntil(p.dob)
  }));
  download('aniversariantes.json', 'application/json', JSON.stringify(enriched, null, 2));
  closeMenu();
}

function download(filename, mime, content) {
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([content], { type: mime }));
  a.download = filename;
  a.click();
  URL.revokeObjectURL(a.href);
}

function importFile(event) {
  const file = event.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = e => {
    try {
      let imported = [];
      if (file.name.endsWith('.json')) {
        imported = JSON.parse(e.target.result);
      } else {
        // CSV
        const lines = e.target.result.split('\n').slice(1).filter(l => l.trim());
        imported = lines.map(l => {
          const cols = l.split(',').map(c => c.replace(/^"|"$/g,'').replace(/""/g,'"').trim());
          return { name: cols[1] || '', dob: cols[2] || '', phone: cols[3] || '' };
        }).filter(r => r.name);
      }
      if (!confirm(`Importar ${imported.length} registros? Isso substituirá os dados atuais.`)) return;
      db = imported.map((r, i) => ({ id: i + 1, name: r.name || '', dob: r.dob || '', phone: r.phone || '' }));
      nextId = db.length + 1;
      saveDB();
      render();
      closeMenu();
    } catch (err) {
      alert('Erro ao importar arquivo: ' + err.message);
    }
  };
  reader.readAsText(file, 'UTF-8');
  event.target.value = '';
}

function clearAll() {
  if (!confirm('⚠️ Apagar TODOS os dados? Esta ação não pode ser desfeita.')) return;
  db = [];
  nextId = 1;
  saveDB();
  render();
  closeMenu();
}

// =====================================================
// NOTIFICAÇÕES
// =====================================================

function toggleNotif() {
  notifOn = !notifOn;
  const btn = document.getElementById('notif-toggle');
  const txt = document.getElementById('notif-text');
  btn.classList.toggle('on', notifOn);
  txt.textContent = notifOn ? '🔔 Avisos de aniversário ativos' : '🔔 Ativar avisos de aniversário';

  if (notifOn) {
    if (!('Notification' in window)) {
      alert('Seu navegador não suporta notificações.');
      notifOn = false;
      btn.classList.remove('on');
      return;
    }
    Notification.requestPermission().then(permission => {
      if (permission !== 'granted') {
        alert('Permissão negada. Habilite as notificações nas configurações do navegador.');
        notifOn = false;
        btn.classList.remove('on');
        txt.textContent = '🔔 Ativar avisos de aniversário';
        return;
      }
      checkAndNotify();
    });
  }
  localStorage.setItem('notif_on', notifOn ? '1' : '0');
}

function checkAndNotify() {
  const todayBdays = db.filter(p => isToday(p.dob));
  if (todayBdays.length > 0 && Notification.permission === 'granted') {
    const names = todayBdays.map(p => p.name).join(', ');
    new Notification('🎂 Aniversariante(s) hoje!', {
      body: `Feliz aniversário para: ${names}`,
      icon: 'icons/icon-192.png',
      badge: 'icons/icon-192.png',
      tag: 'birthday-today'
    });
  }

  // Próximos 7 dias
  const soon = db.filter(p => isSoon(p.dob, 7));
  if (soon.length > 0 && Notification.permission === 'granted') {
    soon.forEach(p => {
      const days = daysUntil(p.dob);
      new Notification(`🗓️ Aniversário em ${days} dias!`, {
        body: `${p.name} faz aniversário em ${days} dia${days > 1 ? 's' : ''}`,
        icon: 'icons/icon-192.png',
        tag: `birthday-soon-${p.id}`
      });
    });
  }
}

// Verificação periódica (a cada minuto)
setInterval(() => {
  if (!notifOn || Notification.permission !== 'granted') return;
  const now = new Date();
  // Notifica às 08:00
  if (now.getHours() === 8 && now.getMinutes() === 0) checkAndNotify();
}, 60000);

// =====================================================
// PWA INSTALL PROMPT
// =====================================================

window.addEventListener('beforeinstallprompt', e => {
  e.preventDefault();
  deferredPrompt = e;
  document.getElementById('install-bar').classList.remove('hidden');
});

function installApp() {
  if (!deferredPrompt) return;
  deferredPrompt.prompt();
  deferredPrompt.userChoice.then(() => {
    deferredPrompt = null;
    document.getElementById('install-bar').classList.add('hidden');
  });
}

function dismissInstall() {
  document.getElementById('install-bar').classList.add('hidden');
  localStorage.setItem('install_dismissed', '1');
}

// =====================================================
// INICIALIZAÇÃO
// =====================================================

document.addEventListener('DOMContentLoaded', () => {
  loadDB();

  // Restaura estado de notificação
  if (localStorage.getItem('notif_on') === '1') {
    notifOn = true;
    document.getElementById('notif-toggle').classList.add('on');
    document.getElementById('notif-text').textContent = '🔔 Avisos de aniversário ativos';
  }

  // Adiciona barra de instalação ao DOM
  if (!localStorage.getItem('install_dismissed')) {
    const bar = document.createElement('div');
    bar.id = 'install-bar';
    bar.className = 'install-bar hidden';
    bar.innerHTML = `
      <div><strong>📱 Instalar app</strong><br><p>Adicione à sua tela inicial</p></div>
      <div class="install-bar-btns">
        <button class="btn-install" onclick="installApp()">Instalar</button>
        <button class="btn-dismiss" onclick="dismissInstall()">Agora não</button>
      </div>`;
    document.body.appendChild(bar);
  }

  render();
});
