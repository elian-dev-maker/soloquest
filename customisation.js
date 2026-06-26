import { auth, db } from './firebase-config.js';
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import { doc, getDoc, updateDoc } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

const BASE_URL = 'https://raw.githubusercontent.com/LiberatedPixelCup/Universal-LPC-Spritesheet-Character-Generator/master/spritesheets/';

const SKIN_OPTIONS = [
  { key: 'light',   hex: '#F5D5A8' },
  { key: 'tanned',  hex: '#C68642' },
  { key: 'tanned2', hex: '#D4894A' },
  { key: 'dark',    hex: '#8D5524' },
  { key: 'dark2',   hex: '#6B3A16' },
  { key: 'darkelf', hex: '#4A2912' },
];

const HAIR_STYLES = [
  'plain', 'bangs', 'bangs2', 'long', 'longhawk',
  'mohawk', 'pixie', 'princess', 'shaved', 'swoop', 'unkempt',
];

const HAIR_COLOR_OPTIONS = [
  { key: 'black',    hex: '#1a1a1a' },
  { key: 'blonde',   hex: '#F5E136' },
  { key: 'blue',     hex: '#3b82f6' },
  { key: 'brown',    hex: '#5C3317' },
  { key: 'brunette', hex: '#3D1C02' },
  { key: 'gold',     hex: '#FFD700' },
  { key: 'gray',     hex: '#9CA3AF' },
  { key: 'green',    hex: '#10b981' },
  { key: 'light',    hex: '#F5DEB3' },
  { key: 'orange',   hex: '#F97316' },
  { key: 'pink',     hex: '#EC4899' },
  { key: 'purple',   hex: '#8B5CF6' },
  { key: 'raven',    hex: '#1c1c2e' },
  { key: 'redhead',  hex: '#C0392B' },
  { key: 'silver',   hex: '#C0C0C0' },
  { key: 'teal',     hex: '#14B8A6' },
  { key: 'white',    hex: '#F5F5F5' },
];

function getOutfit(niv) {
  if (niv <= 5)   return { torso: 'shirt_longsleeve',    leg: 'pants',                          rang: 'F' };
  if (niv <= 15)  return { torso: 'shirt',               leg: 'pants',                          rang: 'E' };
  if (niv <= 30)  return { torso: 'leather_armor_shirt', leg: 'leather_armor_pants_longsleeve', rang: 'D' };
  if (niv <= 50)  return { torso: 'chain_armor_shirt',   leg: 'chain_armor_pants_longsleeve',   rang: 'C' };
  if (niv <= 75)  return { torso: 'plate_armor_shirt',   leg: 'plate_armor_pants',              rang: 'B' };
  if (niv <= 100) return { torso: 'legion_armor_torso',  leg: 'legion_armor_legs',              rang: 'A' };
  return               { torso: 'robe_shirt',            leg: 'robe_pants',                     rang: 'S' };
}

let state = { genre: 'male', skin: 'light', hairStyle: 'plain', hairColor: 'black' };
let niveau = 1;
let userId = null;

// ─── Image loading ────────────────────────────────────────────────────────────

function loadImage(url) {
  return new Promise(resolve => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
    img.src = url;
  });
}

// ─── Main canvas ──────────────────────────────────────────────────────────────

function getMainLayers() {
  const { torso, leg } = getOutfit(niveau);
  const g = state.genre;
  return [
    `body/${g}/${state.skin}.png`,
    `hair/${state.hairStyle}/${g}/${state.hairColor}.png`,
    `torso/${torso}/${g}/white.png`,
    `leg/${leg}/${g}/white.png`,
  ];
}

function drawPlaceholder(ctx) {
  ctx.clearRect(0, 0, 64, 64);
  ctx.font = '32px serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('⚔️', 32, 32);
}

async function renderCharacter(skipThumbs = false) {
  const canvas = document.getElementById('character-canvas');
  const ctx = canvas.getContext('2d');
  const spinner = document.getElementById('loading-spinner');

  spinner.classList.remove('hidden');

  try {
    const images = await Promise.all(
      getMainLayers().map(p => loadImage(BASE_URL + p))
    );

    ctx.clearRect(0, 0, 64, 64);
    let anyLoaded = false;
    for (const img of images) {
      if (img) {
        ctx.drawImage(img, 0, 640, 64, 64, 0, 0, 64, 64);
        anyLoaded = true;
      }
    }
    if (!anyLoaded) drawPlaceholder(ctx);
  } catch {
    drawPlaceholder(canvas.getContext('2d'));
  }

  spinner.classList.add('hidden');

  const { rang } = getOutfit(niveau);
  document.getElementById('rang-badge').textContent = `RANG ${rang}`;
  document.getElementById('canvas-wrap').classList.toggle('s-rank-glow', rang === 'S');

  if (!skipThumbs) renderAllThumbnails();
}

// ─── Hair thumbnails ──────────────────────────────────────────────────────────

async function renderHairThumbnail(canvas, hairStyle) {
  const ctx = canvas.getContext('2d');
  ctx.clearRect(0, 0, 64, 64);
  const g = state.genre;
  const [bodyImg, hairImg] = await Promise.all([
    loadImage(BASE_URL + `body/${g}/${state.skin}.png`),
    loadImage(BASE_URL + `hair/${hairStyle}/${g}/${state.hairColor}.png`),
  ]);
  if (bodyImg) ctx.drawImage(bodyImg, 0, 640, 64, 64, 0, 0, 64, 64);
  if (hairImg) ctx.drawImage(hairImg, 0, 640, 64, 64, 0, 0, 64, 64);
}

function renderAllThumbnails() {
  document.querySelectorAll('.hair-thumb').forEach(thumb => {
    renderHairThumbnail(thumb.querySelector('canvas'), thumb.dataset.style);
  });
}

// ─── UI builders ──────────────────────────────────────────────────────────────

function buildGenreSection() {
  const el = document.getElementById('section-genre');
  const group = document.createElement('div');
  group.className = 'btn-group';

  [
    { value: 'male',   label: '⚔️ Masculin' },
    { value: 'female', label: '🌸 Féminin'  },
  ].forEach(({ value, label }) => {
    const btn = document.createElement('button');
    btn.className = 'btn-option' + (state.genre === value ? ' active' : '');
    btn.textContent = label;
    btn.addEventListener('click', () => {
      if (state.genre === value) return;
      state.genre = value;
      group.querySelectorAll('.btn-option').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      renderCharacter();
    });
    group.appendChild(btn);
  });

  el.appendChild(group);
}

function buildSkinSection() {
  const el = document.getElementById('section-peau');
  const grid = document.createElement('div');
  grid.className = 'couleurs-grid';

  SKIN_OPTIONS.forEach(({ key, hex }) => {
    const swatch = document.createElement('div');
    swatch.className = 'couleur-btn' + (state.skin === key ? ' active' : '');
    swatch.style.background = hex;
    swatch.title = key;
    swatch.addEventListener('click', () => {
      if (state.skin === key) return;
      state.skin = key;
      grid.querySelectorAll('.couleur-btn').forEach(s => s.classList.remove('active'));
      swatch.classList.add('active');
      renderCharacter();
    });
    grid.appendChild(swatch);
  });

  el.appendChild(grid);
}

function buildHairStyleSection() {
  const el = document.getElementById('section-coiffure');
  const scroll = document.createElement('div');
  scroll.className = 'hair-scroll';

  HAIR_STYLES.forEach(style => {
    const thumb = document.createElement('div');
    thumb.className = 'hair-thumb' + (state.hairStyle === style ? ' active' : '');
    thumb.dataset.style = style;

    const canvas = document.createElement('canvas');
    canvas.width = 64;
    canvas.height = 64;

    const label = document.createElement('span');
    label.textContent = style;

    thumb.appendChild(canvas);
    thumb.appendChild(label);

    thumb.addEventListener('click', () => {
      if (state.hairStyle === style) return;
      state.hairStyle = style;
      scroll.querySelectorAll('.hair-thumb').forEach(t => t.classList.remove('active'));
      thumb.classList.add('active');
      renderCharacter(true);
    });

    scroll.appendChild(thumb);
  });

  el.appendChild(scroll);
}

function buildHairColorSection() {
  const el = document.getElementById('section-couleur-cheveux');
  const grid = document.createElement('div');
  grid.className = 'couleurs-grid';

  HAIR_COLOR_OPTIONS.forEach(({ key, hex }) => {
    const swatch = document.createElement('div');
    swatch.className = 'couleur-btn' + (state.hairColor === key ? ' active' : '');
    swatch.style.background = hex;
    swatch.title = key;
    swatch.addEventListener('click', () => {
      if (state.hairColor === key) return;
      state.hairColor = key;
      grid.querySelectorAll('.couleur-btn').forEach(s => s.classList.remove('active'));
      swatch.classList.add('active');
      renderCharacter();
    });
    grid.appendChild(swatch);
  });

  el.appendChild(grid);
}

function buildUI() {
  buildGenreSection();
  buildSkinSection();
  buildHairStyleSection();
  buildHairColorSection();
  document.getElementById('rang-badge').textContent = `RANG ${getOutfit(niveau).rang}`;
}

// ─── Auth + init ──────────────────────────────────────────────────────────────

onAuthStateChanged(auth, async (user) => {
  if (!user) { window.location.href = 'index.html'; return; }
  userId = user.uid;

  try {
    const snap = await getDoc(doc(db, 'users', user.uid));
    const profil = snap.data() || {};
    niveau = profil.niveau || 1;
    if (profil.avatar) state = { ...state, ...profil.avatar };
  } catch (e) {
    console.error('Erreur chargement profil:', e);
  }

  buildUI();
  renderCharacter();

  setTimeout(() => {
    const active = document.querySelector('.hair-thumb.active');
    if (active) active.scrollIntoView({ inline: 'center', behavior: 'smooth', block: 'nearest' });
  }, 400);
});

// ─── Save ─────────────────────────────────────────────────────────────────────

document.getElementById('btn-sauvegarder').addEventListener('click', async () => {
  if (!userId) return;

  const btn = document.getElementById('btn-sauvegarder');
  btn.disabled = true;
  btn.textContent = 'Sauvegarde en cours...';

  try {
    await updateDoc(doc(db, 'users', userId), { avatar: { ...state } });
    btn.textContent = '✅ Sauvegardé !';
    setTimeout(() => {
      btn.textContent = '💾 Sauvegarder';
      btn.disabled = false;
    }, 2000);
  } catch (e) {
    console.error('Erreur sauvegarde:', e);
    btn.textContent = '❌ Erreur, réessaye';
    btn.disabled = false;
    setTimeout(() => { btn.textContent = '💾 Sauvegarder'; }, 3000);
  }
});
