import { auth, db } from './firebase-config.js';
import { onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import { doc, getDoc, updateDoc, setDoc } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

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