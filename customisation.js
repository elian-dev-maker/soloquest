import { auth, db } from './firebase-config.js';
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import { doc, getDoc, updateDoc } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";
import { genererAvatar } from './avatar.js';

let options = {
  genre: 'masculin',
  peau: '#FDDBB4',
  cheveux: '#1a1a1a',
  yeux: '#3b82f6',
};

let niveauActuel = 1;
let userId = null;

onAuthStateChanged(auth, async (user) => {
  if (!user) { window.location.href = 'index.html'; return; }
  userId = user.uid;

  const snap = await getDoc(doc(db, 'users', user.uid));
  const profil = snap.data();
  niveauActuel = profil.niveau || 1;

  if (profil.avatar) {
    options = { ...options, ...profil.avatar };
    appliquerOptions();
  }

  mettreAJourAvatar();
});

function mettreAJourAvatar() {
  document.getElementById('avatar-preview').innerHTML = genererAvatar(niveauActuel, options);
}

function appliquerOptions() {
  // Genre
  document.querySelectorAll('[data-type="genre"]').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.value === options.genre);
  });
  // Couleurs
  ['peau', 'cheveux', 'yeux'].forEach(type => {
    document.querySelectorAll(`[data-type="${type}"]`).forEach(btn => {
      btn.classList.toggle('active', btn.dataset.value === options[type]);
    });
  });
}

// Clics sur les boutons genre
document.querySelectorAll('[data-type="genre"]').forEach(btn => {
  btn.addEventListener('click', () => {
    options.genre = btn.dataset.value;
    document.querySelectorAll('[data-type="genre"]').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    mettreAJourAvatar();
  });
});

// Clics sur les couleurs
document.querySelectorAll('.couleur-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    const type = btn.dataset.type;
    options[type] = btn.dataset.value;
    document.querySelectorAll(`[data-type="${type}"]`).forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    mettreAJourAvatar();
  });
});

// Sauvegarder
document.getElementById('btn-sauvegarder').addEventListener('click', async () => {
  await updateDoc(doc(db, 'users', userId), { avatar: options });
  const btn = document.getElementById('btn-sauvegarder');
  btn.textContent = '✅ Sauvegardé !';
  setTimeout(() => btn.textContent = '💾 Sauvegarder', 2000);
});