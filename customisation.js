import { auth, db } from './firebase-config.js';
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import { doc, getDoc, updateDoc } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

const BASE_URL = './sprites/';

// ─── Data ─────────────────────────────────────────────────────────────────────

const SKIN_OPTIONS = [
  { key: 'light',   hex: '#F5D5A8' },
  { key: 'tanned',  hex: '#C68642' },
  { key: 'tanned2', hex: '#D4894A' },
  { key: 'dark',    hex: '#8D5524' },
  { key: 'dark2',   hex: '#6B3A16' },
  { key: 'darkelf', hex: '#4A2912' },
];

// All paths confirmed: hair/{style}/adult/idle.png
const HAIR_STYLES = [
  'plain', 'bangs', 'bangslong', 'bob', 'long',
  'longhawk', 'pixie', 'buzzcut', 'spiked', 'shorthawk', 'swoop', 'unkempt',
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

// Actual spritesheet paths (confirmed on disk):
//   torso: torso/clothes/longsleeve/longsleeve/{g}/idle.png
//          torso/clothes/shortsleeve/shortsleeve/{g}/idle.png
//          torso/armour/leather/{g}/idle.png
//          torso/chainmail/{g}/idle.png
//          torso/armour/plate/{g}/idle.png
//          torso/armour/legion/{g}/idle.png
//   legs:  legs/pants/male/idle.png  (female idle missing — use male fallback)
function getOutfit(niv) {
  if (niv <= 5)   return { torso: 'torso/clothes/longsleeve/longsleeve', leg: 'legs/pants', rang: 'F' };
  if (niv <= 15)  return { torso: 'torso/clothes/shortsleeve/shortsleeve', leg: 'legs/pants', rang: 'E' };
  if (niv <= 30)  return { torso: 'torso/armour/leather',                  leg: 'legs/pants', rang: 'D' };
  if (niv <= 50)  return { torso: 'torso/chainmail',                       leg: 'legs/pants', rang: 'C' };
  if (niv <= 75)  return { torso: 'torso/armour/plate',                    leg: 'legs/pants', rang: 'B' };
  if (niv <= 100) return { torso: 'torso/armour/legion',                   leg: 'legs/pants', rang: 'A' };
  return               { torso: 'torso/armour/legion',                    leg: 'legs/pants', rang: 'S' };
}

// ─── State ────────────────────────────────────────────────────────────────────

let state = { genre: 'male', skin: 'light', hairStyle: 'plain', hairColor: 'black' };
let niveau = 1;
let userId = null;

function lpcGenre(genre) {
  return genre === 'masculin' ? 'male' : genre === 'feminin' ? 'female' : genre;
}

// ─── Canvas colorize ──────────────────────────────────────────────────────────

function colorizeHair(ctx, hexColor) {
  const imageData = ctx.getImageData(0, 0, 64, 64);
  const data = imageData.data;
  const r = parseInt(hexColor.slice(1, 3), 16);
  const g = parseInt(hexColor.slice(3, 5), 16);
  const b = parseInt(hexColor.slice(5, 7), 16);
  for (let i = 0; i < data.length; i += 4) {
    if (data[i + 3] > 0) {
      const brightness = (data[i] + data[i + 1] + data[i + 2]) / (3 * 255);
      data[i]     = Math.round(r * brightness);
      data[i + 1] = Math.round(g * brightness);
      data[i + 2] = Math.round(b * brightness);
    }
  }
  ctx.putImageData(imageData, 0, 0);
}

// Draw a loaded image onto ctx, optionally colorizing with hexColor.
// Colorization runs on an offscreen canvas so only this layer is affected.
// Source crop: idle frame at row 10, col 0 → x=0, y=640, w=64, h=64.
function drawLayer(ctx, img, hexColor) {
  if (!hexColor) {
    ctx.drawImage(img, 0, 640, 64, 64, 0, 0, 64, 64);
    return;
  }

  const off = document.createElement('canvas');
  off.width = 64;
  off.height = 64;
  const offCtx = off.getContext('2d');
  offCtx.drawImage(img, 0, 640, 64, 64, 0, 0, 64, 64);

  colorizeHair(offCtx, hexColor);

  ctx.drawImage(off, 0, 0);
}

// ─── Image loading ────────────────────────────────────────────────────────────

function loadImage(url) {
  return new Promise(resolve => {
    const img = new Image();
    img.onload  = () => resolve(img);
    img.onerror = () => resolve(null);
    img.src = url;
  });
}

// ─── Layer list ───────────────────────────────────────────────────────────────

function getMainLayers() {
  const { torso, leg } = getOutfit(niveau);
  const g = lpcGenre(state.genre);
  const skinHex = SKIN_OPTIONS.find(s => s.key === state.skin)?.hex || null;
  const hairHex = HAIR_COLOR_OPTIONS.find(h => h.key === state.hairColor)?.hex || null;

  return [
    // female idle pants don't exist — use male for both genders
    { path: `body/bodies/${g}/idle.png`,            color: skinHex },
    { path: `hair/${state.hairStyle}/adult/idle.png`, color: hairHex },
    { path: `${torso}/${g}/idle.png`,               color: null    },
    { path: `${leg}/male/idle.png`,                 color: null    },
  ];
}

// ─── Main canvas ──────────────────────────────────────────────────────────────

function drawPlaceholder(ctx) {
  ctx.clearRect(0, 0, 64, 64);
  ctx.font = '32px serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('⚔️', 32, 32);
}

async function renderCharacter(skipThumbs = false) {
  const canvas  = document.getElementById('character-canvas');
  const ctx     = canvas.getContext('2d');
  const spinner = document.getElementById('loading-spinner');

  spinner.classList.remove('hidden');
  ctx.clearRect(0, 0, 64, 64);

  try {
    const layers = getMainLayers();
    const images = await Promise.all(layers.map(l => loadImage(BASE_URL + l.path)));

    let anyLoaded = false;
    for (let i = 0; i < layers.length; i++) {
      const img = images[i];
      if (!img) continue;
      anyLoaded = true;
      drawLayer(ctx, img, layers[i].color);
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

  const g       = state.genre;
  const skinHex = SKIN_OPTIONS.find(s => s.key === state.skin)?.hex || null;
  const hairHex = HAIR_COLOR_OPTIONS.find(h => h.key === state.hairColor)?.hex || null;

  const [bodyImg, hairImg] = await Promise.all([
    loadImage(BASE_URL + `body/bodies/${g}/idle.png`),
    loadImage(BASE_URL + `hair/${hairStyle}/adult/idle.png`),
  ]);

  if (bodyImg) drawLayer(ctx, bodyImg, skinHex);
  if (hairImg) drawLayer(ctx, hairImg, hairHex);
}

function renderAllThumbnails() {
  document.querySelectorAll('.hair-thumb').forEach(thumb => {
    renderHairThumbnail(thumb.querySelector('canvas'), thumb.dataset.style);
  });
}

// ─── UI builders ──────────────────────────────────────────────────────────────

function buildGenreSection() {
  const el    = document.getElementById('section-genre');
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
  const el   = document.getElementById('section-peau');
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
  const el     = document.getElementById('section-coiffure');
  const scroll = document.createElement('div');
  scroll.className = 'hair-scroll';

  HAIR_STYLES.forEach(style => {
    const thumb  = document.createElement('div');
    thumb.className = 'hair-thumb' + (state.hairStyle === style ? ' active' : '');
    thumb.dataset.style = style;

    const canvas = document.createElement('canvas');
    canvas.width  = 64;
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
  const el   = document.getElementById('section-couleur-cheveux');
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
    const snap  = await getDoc(doc(db, 'users', user.uid));
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
