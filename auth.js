import { auth, db } from './firebase-config.js';
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword,
  sendPasswordResetEmail,
  onAuthStateChanged 
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import { doc, setDoc } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

// Vérifier si l'utilisateur est déjà connecté
onAuthStateChanged(auth, (user) => {
  if (user) {
    window.location.href = 'dashboard.html';
  }
});

// Inscription
document.getElementById('btn-inscription').addEventListener('click', async () => {
  const email = document.getElementById('email').value;
  const password = document.getElementById('password').value;

  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    // Créer le profil du joueur dans Firestore
    await setDoc(doc(db, 'users', user.uid), {
      pseudo: 'Chasseur',
      niveau: 1,
      xp: 0,
      xpPourLevelUp: 100,
      dateCreation: new Date()
    });

    window.location.href = 'dashboard.html';

  } catch (error) {
    afficherErreur(error.code);
  }
});

// Connexion
document.getElementById('btn-connexion').addEventListener('click', async () => {
  const email = document.getElementById('email').value;
  const password = document.getElementById('password').value;

  try {
    await signInWithEmailAndPassword(auth, email, password);
    window.location.href = 'dashboard.html';
  } catch (error) {
    afficherErreur(error.code);
  }
});

// Mot de passe oublié
document.getElementById('btn-mdp-oublie').addEventListener('click', async () => {
  const email = document.getElementById('email').value;
  if (!email) {
    afficherErreur('Entre ton email d\'abord');
    return;
  }
  await sendPasswordResetEmail(auth, email);
  afficherErreur('Email de réinitialisation envoyé !');
});

// Afficher les erreurs
function afficherErreur(code) {
  const msg = document.getElementById('message-erreur');
  msg.classList.remove('hidden');
  const erreurs = {
    'auth/email-already-in-use': 'Cet email est déjà utilisé.',
    'auth/invalid-email': 'Email invalide.',
    'auth/weak-password': 'Mot de passe trop court (6 caractères min).',
    'auth/invalid-credential': 'Email ou mot de passe incorrect.',
  };
  msg.textContent = erreurs[code] || code;
}