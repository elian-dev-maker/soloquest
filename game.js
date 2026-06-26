import { auth, db } from './firebase-config.js';
import { onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import { doc, getDoc, updateDoc, setDoc } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";
import { genererAvatar } from './avatar.js';
const QUETES = [
  { id: "q1", titre: "Éveil du Corps",     description: "Fais 20 pompes",            xp: 30, emoji: "💪" },
  { id: "q2", titre: "Marche du Chasseur", description: "Marche 20 minutes",         xp: 25, emoji: "🚶" },
  { id: "q3", titre: "Squat initiatique",  description: "Fais 30 squats",            xp: 30, emoji: "🦵" },
  { id: "q4", titre: "Gainage",            description: "Tiens la planche 1 minute", xp: 20, emoji: "🧱" },
  { id: "q5", titre: "Endurance",          description: "Fais 50 jumping jacks",     xp: 35, emoji: "⚡" },
];

function getQuetesDuJour() {
  const seed = new Date().toDateString();
  let hash = 0;
  for (let c of seed) hash = (hash * 31 + c.charCodeAt(0)) % 1000;
  const shuffled = [...QUETES].sort((a, b) => 
    ((hash * QUETES.indexOf(a)) % 7) - ((hash * QUETES.indexOf(b)) % 7)
  );
  return shuffled.slice(0, 5);
}

function getDateAujourdhui() {
  return new Date().toISOString().split('T')[0];
}

onAuthStateChanged(auth, async (user) => {
  if (!user) {
    window.location.href = 'index.html';
    return;
  }
  const profil = await chargerProfil(user.uid);
  afficherProfil(profil);
  afficherQuetes(user.uid, profil);
});

async function chargerProfil(uid) {
  const ref = doc(db, 'users', uid);
  const snap = await getDoc(ref);
  
  if (!snap.exists()) {
    // Créer le profil s'il n'existe pas encore
    const profilDefaut = {
      pseudo: 'Chasseur',
      niveau: 1,
      xp: 0,
      xpPourLevelUp: 100,
      dateCreation: new Date()
    };
    await setDoc(ref, profilDefaut);
    return profilDefaut;
  }
  
  return snap.data();
}

function afficherProfil(profil) {
  document.getElementById('pseudo').textContent = profil.pseudo;
  document.getElementById('niveau').textContent = profil.niveau;
  const pct = Math.min((profil.xp / profil.xpPourLevelUp) * 100, 100);
  document.getElementById('xp-fill').style.width = pct + '%';
  document.getElementById('xp-texte').textContent = `${profil.xp} / ${profil.xpPourLevelUp} XP`;
  renderAvatarCanvas(profil);
}

const SKIN_HEX = { light: '#F5D5A8', tanned: '#C68642', tanned2: '#D4894A', dark: '#8D5524', dark2: '#6B3A16', darkelf: '#4A2912' };
const HAIR_HEX = { black: '#1a1a1a', blonde: '#F5E136', blue: '#3b82f6', brown: '#5C3317', brunette: '#3D1C02', gold: '#FFD700', gray: '#9CA3AF', green: '#10b981', light: '#F5DEB3', orange: '#F97316', pink: '#EC4899', purple: '#8B5CF6', raven: '#1c1c2e', redhead: '#C0392B', silver: '#C0C0C0', teal: '#14B8A6', white: '#F5F5F5' };

async function renderAvatarCanvas(profil) {
  const canvas = document.getElementById('avatar-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const av = profil.avatar || {};
  const g = av.genre === 'masculin' ? 'male' : av.genre === 'feminin' ? 'female' : (av.genre || 'male');
  const hairStyle = av.hairStyle || 'plain';
  const skinHex = SKIN_HEX[av.skin] || '#F5D5A8';
  const hairHex = HAIR_HEX[av.hairColor] || '#1a1a1a';

  const loadImg = src => new Promise(res => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => res(img);
    img.onerror = () => res(null);
    img.src = src;
  });

  const tintLayer = (img, hex) => {
    if (!img) return;
    const off = document.createElement('canvas');
    off.width = 64; off.height = 64;
    const oc = off.getContext('2d');
    oc.drawImage(img, 0, 128, 64, 64, 0, 0, 64, 64);
    const id = oc.getImageData(0, 0, 64, 64);
    const d = id.data;
    const r = parseInt(hex.slice(1, 3), 16);
    const gv = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    for (let i = 0; i < d.length; i += 4) {
      if (d[i + 3] > 0) {
        const br = (d[i] + d[i + 1] + d[i + 2]) / (3 * 255);
        d[i] = Math.round(r * br); d[i + 1] = Math.round(gv * br); d[i + 2] = Math.round(b * br);
      }
    }
    oc.putImageData(id, 0, 0);
    ctx.drawImage(off, 0, 0);
  };

  const [bodyImg, headImg, hairImg] = await Promise.all([
    loadImg(`./sprites/body/bodies/${g}/idle.png`),
    loadImg(`./sprites/head/human/${g}/idle.png`),
    loadImg(`./sprites/hair/${hairStyle}/adult/idle.png`),
  ]);

  ctx.clearRect(0, 0, 64, 64);
  tintLayer(bodyImg, skinHex);
  tintLayer(headImg, skinHex);
  tintLayer(hairImg, hairHex);
}

async function afficherQuetes(uid, profil) {
  const quetes = getQuetesDuJour();
  const date = getDateAujourdhui();
  const refCompleted = doc(db, 'users', uid, 'quetes_completees', date);
  const snapCompleted = await getDoc(refCompleted);
  const completees = snapCompleted.exists() ? snapCompleted.data() : {};

  const liste = document.getElementById('liste-quetes');
  liste.innerHTML = '';

  quetes.forEach(q => {
    const fait = completees[q.id] === true;
    const div = document.createElement('div');
    div.className = 'quete-card' + (fait ? ' completee' : '');
    div.innerHTML = `
      <div class="quete-info">
        <span class="quete-emoji">${q.emoji}</span>
        <div>
          <p class="quete-titre">${q.titre}</p>
          <p class="quete-desc">${q.description}</p>
        </div>
      </div>
      <div class="quete-droite">
        <span class="quete-xp">+${q.xp} XP</span>
        <button class="btn-valider" data-id="${q.id}" data-xp="${q.xp}" ${fait ? 'disabled' : ''}>
          ${fait ? '✅' : 'Valider'}
        </button>
      </div>
    `;
    liste.appendChild(div);
  });

  document.querySelectorAll('.btn-valider:not([disabled])').forEach(btn => {
    btn.addEventListener('click', () => validerQuete(uid, btn.dataset.id, parseInt(btn.dataset.xp)));
  });
}

async function validerQuete(uid, queteId, xpGagne) {
  const date = getDateAujourdhui();
  const refCompleted = doc(db, 'users', uid, 'quetes_completees', date);
  const snapCompleted = await getDoc(refCompleted);
  const completees = snapCompleted.exists() ? snapCompleted.data() : {};
  completees[queteId] = true;
  await setDoc(refCompleted, completees);

  const refUser = doc(db, 'users', uid);
  const snap = await getDoc(refUser);
  let profil = snap.data();
  profil.xp += xpGagne;

  if (profil.xp >= profil.xpPourLevelUp) {
    profil.xp -= profil.xpPourLevelUp;
    profil.niveau += 1;
    profil.xpPourLevelUp = Math.round(profil.xpPourLevelUp * 1.5);
    afficherLevelUp(profil.niveau);
  }

  await updateDoc(refUser, profil);
  afficherProfil(profil);
  afficherQuetes(uid, profil);
}

function afficherLevelUp(niveau) {
  const div = document.createElement('div');
  div.className = 'levelup-popup';
  div.innerHTML = `⚡ LEVEL UP ! Niveau ${niveau} atteint !`;
  document.body.appendChild(div);
  setTimeout(() => div.remove(), 3000);
}

document.getElementById('btn-deconnexion').addEventListener('click', async () => {
  await signOut(auth);
  window.location.href = 'index.html';
});