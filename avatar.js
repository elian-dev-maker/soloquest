// avatar.js — Génère le SVG du personnage selon niveau et personnalisation

export function genererAvatar(niveau, options = {}) {
  const {
    genre = 'masculin',
    peau = '#F5D5A8',
    cheveux = '#1a1a1a',
    yeux = '#3b82f6',
  } = options;

  const palier = getPalier(niveau);
  
  if (genre === 'feminin') {
    return genererAvatarFeminin(palier, niveau, peau, cheveux, yeux);
  }
  return genererAvatarMasculin(palier, niveau, peau, cheveux, yeux);
}

function getPalier(niveau) {
  if (niveau <= 5)   return 'F';
  if (niveau <= 15)  return 'E';
  if (niveau <= 30)  return 'D';
  if (niveau <= 50)  return 'C';
  if (niveau <= 75)  return 'B';
  if (niveau <= 100) return 'A';
  return 'S';
}

function getAura(palier, yeux) {
  if (palier === 'S') return `
    <ellipse cx="60" cy="170" rx="45" ry="12" fill="rgba(0,0,0,0.4)" filter="url(#auraS)"/>
    <filter id="auraS"><feGaussianBlur stdDeviation="4"/></filter>
    <ellipse cx="60" cy="100" rx="55" ry="130" fill="none" stroke="#1a0033" stroke-width="2" opacity="0.6" filter="url(#glowS)"/>
    <filter id="glowS"><feGaussianBlur stdDeviation="6"/></filter>
  `;
  if (palier === 'A') return `
    <ellipse cx="60" cy="160" rx="40" ry="10" fill="rgba(124,58,237,0.3)" filter="url(#auraA)"/>
    <filter id="auraA"><feGaussianBlur stdDeviation="5"/></filter>
  `;
  if (palier === 'B') return `
    <ellipse cx="60" cy="160" rx="35" ry="8" fill="rgba(59,130,246,0.3)" filter="url(#auraB)"/>
    <filter id="auraB"><feGaussianBlur stdDeviation="4"/></filter>
  `;
  return '';
}

function getYeux(palier, yeux, x1, x2, y) {
  if (palier === 'S') {
    return `
      <ellipse cx="${x1}" cy="${y}" rx="5" ry="5" fill="${yeux}" filter="url(#flamme)"/>
      <ellipse cx="${x2}" cy="${y}" rx="5" ry="5" fill="${yeux}" filter="url(#flamme)"/>
      <filter id="flamme"><feGaussianBlur stdDeviation="2"/></filter>
      <ellipse cx="${x1}" cy="${y}" rx="3" ry="3" fill="white" opacity="0.8"/>
      <ellipse cx="${x2}" cy="${y}" rx="3" ry="3" fill="white" opacity="0.8"/>
    `;
  }
  return `
    <ellipse cx="${x1}" cy="${y}" rx="3" ry="3" fill="${yeux}"/>
    <ellipse cx="${x2}" cy="${y}" rx="3" ry="3" fill="${yeux}"/>
    <ellipse cx="${x1}" cy="${y}" rx="1.5" ry="1.5" fill="#000"/>
    <ellipse cx="${x2}" cy="${y}" rx="1.5" ry="1.5" fill="#000"/>
  `;
}

function genererAvatarMasculin(palier, niveau, peau, cheveux, yeux) {
  const configs = {
    F: { // Maigre, civil
      corps: `<rect x="42" y="85" width="36" height="55" rx="5" fill="${peau}"/>`,
      epaules: 36,
      bras: `
        <rect x="25" y="85" width="17" height="40" rx="4" fill="${peau}"/>
        <rect x="78" y="85" width="17" height="40" rx="4" fill="${peau}"/>
      `,
      jambes: `
        <rect x="42" y="138" width="15" height="45" rx="4" fill="#2a3a5c"/>
        <rect x="59" y="138" width="15" height="45" rx="4" fill="#2a3a5c"/>
      `,
      tenue: `<rect x="42" y="85" width="36" height="55" rx="5" fill="#4a5568" opacity="0.8"/>`,
      cou: 8,
    },
    E: { // Légèrement musclé
      corps: `<rect x="40" y="83" width="40" height="57" rx="5" fill="${peau}"/>`,
      epaules: 38,
      bras: `
        <rect x="22" y="83" width="18" height="42" rx="5" fill="${peau}"/>
        <rect x="80" y="83" width="18" height="42" rx="5" fill="${peau}"/>
      `,
      jambes: `
        <rect x="40" y="138" width="17" height="47" rx="4" fill="#2a3a5c"/>
        <rect x="59" y="138" width="17" height="47" rx="4" fill="#2a3a5c"/>
      `,
      tenue: `<rect x="40" y="83" width="40" height="57" rx="5" fill="#3b4f6e" opacity="0.8"/>`,
      cou: 9,
    },
    D: { // Athlétique
      corps: `<rect x="37" y="80" width="46" height="60" rx="6" fill="${peau}"/>`,
      epaules: 42,
      bras: `
        <rect x="19" y="80" width="20" height="45" rx="6" fill="${peau}"/>
        <rect x="81" y="80" width="20" height="45" rx="6" fill="${peau}"/>
      `,
      jambes: `
        <rect x="37" y="138" width="19" height="50" rx="5" fill="#1a2744"/>
        <rect x="58" y="138" width="19" height="50" rx="5" fill="#1a2744"/>
      `,
      tenue: `
        <rect x="37" y="80" width="46" height="60" rx="6" fill="#1a2744" opacity="0.9"/>
        <line x1="60" y1="80" x2="60" y2="140" stroke="#7c3aed" stroke-width="1.5" opacity="0.6"/>
      `,
      cou: 10,
    },
    C: { // Musclé, armure légère
      corps: `<rect x="34" y="78" width="52" height="62" rx="7" fill="${peau}"/>`,
      epaules: 46,
      bras: `
        <rect x="16" y="78" width="20" height="48" rx="7" fill="${peau}"/>
        <rect x="84" y="78" width="20" height="48" rx="7" fill="${peau}"/>
        <rect x="16" y="78" width="20" height="20" rx="7" fill="#4a5568"/>
        <rect x="84" y="78" width="20" height="20" rx="7" fill="#4a5568"/>
      `,
      jambes: `
        <rect x="34" y="138" width="22" height="52" rx="5" fill="#1a1a2e"/>
        <rect x="58" y="138" width="22" height="52" rx="5" fill="#1a1a2e"/>
        <rect x="34" y="138" width="22" height="15" rx="3" fill="#4a5568"/>
        <rect x="58" y="138" width="22" height="15" rx="3" fill="#4a5568"/>
      `,
      tenue: `
        <rect x="34" y="78" width="52" height="62" rx="7" fill="#2d3748" opacity="0.95"/>
        <rect x="34" y="78" width="52" height="62" rx="7" fill="none" stroke="#7c3aed" stroke-width="1"/>
      `,
      cou: 11,
    },
    B: { // Armure complète, aura bleue
      corps: `<rect x="32" y="75" width="56" height="65" rx="8" fill="#1a1a2e"/>`,
      epaules: 50,
      bras: `
        <rect x="13" y="75" width="21" height="50" rx="8" fill="#1a1a2e"/>
        <rect x="86" y="75" width="21" height="50" rx="8" fill="#1a1a2e"/>
        <rect x="13" y="75" width="21" height="50" rx="8" fill="none" stroke="#3b82f6" stroke-width="1.5"/>
        <rect x="86" y="75" width="21" height="50" rx="8" fill="none" stroke="#3b82f6" stroke-width="1.5"/>
      `,
      jambes: `
        <rect x="32" y="138" width="24" height="55" rx="6" fill="#1a1a2e"/>
        <rect x="57" y="138" width="24" height="55" rx="6" fill="#1a1a2e"/>
        <rect x="32" y="138" width="24" height="55" rx="6" fill="none" stroke="#3b82f6" stroke-width="1"/>
        <rect x="57" y="138" width="24" height="55" rx="6" fill="none" stroke="#3b82f6" stroke-width="1"/>
      `,
      tenue: `
        <rect x="32" y="75" width="56" height="65" rx="8" fill="#0f172a"/>
        <rect x="32" y="75" width="56" height="65" rx="8" fill="none" stroke="#3b82f6" stroke-width="2"/>
        <line x1="60" y1="75" x2="60" y2="140" stroke="#3b82f6" stroke-width="1" opacity="0.5"/>
      `,
      cou: 11,
    },
    A: { // Armure noire, aura violette
      corps: `<rect x="30" y="72" width="60" height="68" rx="9" fill="#0a0a1a"/>`,
      epaules: 54,
      bras: `
        <rect x="10" y="72" width="22" height="52" rx="9" fill="#0a0a1a"/>
        <rect x="88" y="72" width="22" height="52" rx="9" fill="#0a0a1a"/>
        <rect x="10" y="72" width="22" height="52" rx="9" fill="none" stroke="#7c3aed" stroke-width="2"/>
        <rect x="88" y="72" width="22" height="52" rx="9" fill="none" stroke="#7c3aed" stroke-width="2"/>
      `,
      jambes: `
        <rect x="30" y="138" width="26" height="58" rx="7" fill="#0a0a1a"/>
        <rect x="56" y="138" width="26" height="58" rx="7" fill="#0a0a1a"/>
        <rect x="30" y="138" width="26" height="58" rx="7" fill="none" stroke="#7c3aed" stroke-width="1.5"/>
        <rect x="56" y="138" width="26" height="58" rx="7" fill="none" stroke="#7c3aed" stroke-width="1.5"/>
      `,
      tenue: `
        <rect x="30" y="72" width="60" height="68" rx="9" fill="#050510"/>
        <rect x="30" y="72" width="60" height="68" rx="9" fill="none" stroke="#7c3aed" stroke-width="2.5"/>
        <line x1="60" y1="72" x2="60" y2="140" stroke="#7c3aed" stroke-width="1.5" opacity="0.7"/>
        <circle cx="60" cy="95" r="6" fill="#7c3aed" opacity="0.8"/>
      `,
      cou: 12,
    },
    S: { // Monarque des ombres
      corps: `<rect x="28" y="70" width="64" height="70" rx="10" fill="#050510"/>`,
      epaules: 58,
      bras: `
        <rect x="8" y="70" width="22" height="55" rx="10" fill="#050510"/>
        <rect x="90" y="70" width="22" height="55" rx="10" fill="#050510"/>
        <rect x="8" y="70" width="22" height="55" rx="10" fill="none" stroke="#1a0033" stroke-width="2"/>
        <rect x="90" y="70" width="22" height="55" rx="10" fill="none" stroke="#1a0033" stroke-width="2"/>
        <line x1="8" y1="90" x2="30" y2="90" stroke="#3b82f6" stroke-width="1" opacity="0.8"/>
        <line x1="90" y1="90" x2="112" y2="90" stroke="#3b82f6" stroke-width="1" opacity="0.8"/>
      `,
      jambes: `
        <rect x="28" y="138" width="28" height="62" rx="8" fill="#050510"/>
        <rect x="58" y="138" width="28" height="62" rx="8" fill="#050510"/>
        <rect x="28" y="138" width="28" height="62" rx="8" fill="none" stroke="#1a0033" stroke-width="2"/>
        <rect x="58" y="138" width="28" height="62" rx="8" fill="none" stroke="#1a0033" stroke-width="2"/>
      `,
      tenue: `
        <rect x="28" y="70" width="64" height="70" rx="10" fill="#02020a"/>
        <rect x="28" y="70" width="64" height="70" rx="10" fill="none" stroke="#1a0033" stroke-width="3"/>
        <line x1="60" y1="70" x2="60" y2="140" stroke="#3b82f6" stroke-width="2" opacity="0.9"/>
        <circle cx="60" cy="90" r="8" fill="#1a0033"/>
        <circle cx="60" cy="90" r="4" fill="#3b82f6" opacity="0.9"/>
      `,
      cou: 13,
    }
  };

  const c = configs[palier];
  const tailleCorps = { F: 170, E: 175, D: 180, C: 185, B: 188, A: 192, S: 195 };
  const hauteur = tailleCorps[palier];

  return `
    <svg viewBox="0 0 120 ${hauteur}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <radialGradient id="bgGrad" cx="50%" cy="50%">
          <stop offset="0%" stop-color="#12122a"/>
          <stop offset="100%" stop-color="#0a0a1a"/>
        </radialGradient>
      </defs>
      
      ${getAura(palier, yeux)}
      
      <!-- Jambes -->
      ${c.jambes}
      
      <!-- Bras -->
      ${c.bras}

      <!-- Corps -->
      ${c.corps}
      ${c.tenue}
      
      <!-- Cou -->
      <rect x="${60 - c.cou/2}" y="${68 - c.cou}" width="${c.cou}" height="18" rx="4" fill="${peau}"/>
      
      <!-- Tête -->
      <ellipse cx="60" cy="55" rx="${c.epaules * 0.38}" ry="22" fill="${peau}"/>
      
      <!-- Cheveux -->
      <ellipse cx="60" cy="38" rx="${c.epaules * 0.38}" ry="10" fill="${cheveux}"/>
      <rect x="${60 - c.epaules * 0.38}" y="38" width="${c.epaules * 0.76}" height="8" fill="${cheveux}"/>
      
      <!-- Yeux -->
      ${getYeux(palier, yeux, 53, 67, 55)}
      
      <!-- Bouche -->
      <path d="M 55 63 Q 60 67 65 63" stroke="#8B4513" stroke-width="1.2" fill="none" opacity="0.6"/>
      
      <!-- Rang badge -->
      <text x="60" y="${hauteur - 5}" text-anchor="middle" font-size="8" fill="#7c3aed" font-weight="bold" opacity="0.8">RANG ${palier}</text>
    </svg>
  `;
}

function genererAvatarFeminin(palier, niveau, peau, cheveux, yeux) {
  const configs = {
    F: { corpsW: 32, corpsH: 52, brasW: 14, jambW: 13, cou: 7 },
    E: { corpsW: 34, corpsH: 54, brasW: 15, jambW: 14, cou: 8 },
    D: { corpsW: 38, corpsH: 57, brasW: 17, jambW: 16, cou: 9 },
    C: { corpsW: 42, corpsH: 60, brasW: 18, jambW: 18, cou: 10 },
    B: { corpsW: 46, corpsH: 63, brasW: 19, jambW: 20, cou: 10 },
    A: { corpsW: 50, corpsH: 66, brasW: 20, jambW: 22, cou: 11 },
    S: { corpsW: 54, corpsH: 68, brasW: 21, jambW: 24, cou: 12 },
  };

  const c = configs[palier];
  const cx = 60;
  const bodyX = cx - c.corpsW / 2;
  const brasGX = bodyX - c.brasW - 2;
  const brasDX = bodyX + c.corpsW + 2;
  const jambGX = cx - c.jambW - 1;
  const jambDX = cx + 1;
  const couleurTenue = { F: '#6b7280', E: '#4b5563', D: '#374151', C: '#7c3aed', B: '#1d4ed8', A: '#4c1d95', S: '#0f0f1a' };
  const couleurBord = { F: 'none', E: 'none', D: '#7c3aed', C: '#7c3aed', B: '#3b82f6', A: '#7c3aed', S: '#3b82f6' };

  return `
    <svg viewBox="0 0 120 195" xmlns="http://www.w3.org/2000/svg">
      ${getAura(palier, yeux)}
      
      <!-- Jambes -->
      <rect x="${jambGX}" y="138" width="${c.jambW}" height="52" rx="5" fill="${couleurTenue[palier]}"/>
      <rect x="${jambDX}" y="138" width="${c.jambW}" height="52" rx="5" fill="${couleurTenue[palier]}"/>
      ${couleurBord[palier] !== 'none' ? `
        <rect x="${jambGX}" y="138" width="${c.jambW}" height="52" rx="5" fill="none" stroke="${couleurBord[palier]}" stroke-width="1.5"/>
        <rect x="${jambDX}" y="138" width="${c.jambW}" height="52" rx="5" fill="none" stroke="${couleurBord[palier]}" stroke-width="1.5"/>
      ` : ''}
      
      <!-- Bras -->
      <rect x="${brasGX}" y="83" width="${c.brasW}" height="45" rx="6" fill="${peau}"/>
      <rect x="${brasDX}" y="83" width="${c.brasW}" height="45" rx="6" fill="${peau}"/>
      
      <!-- Corps (forme féminine) -->
      <path d="M ${bodyX} 83 Q ${cx} 78 ${bodyX + c.corpsW} 83 L ${bodyX + c.corpsW} ${83 + c.corpsH} Q ${cx} ${83 + c.corpsH + 5} ${bodyX} ${83 + c.corpsH} Z" fill="${couleurTenue[palier]}"/>
      ${couleurBord[palier] !== 'none' ? `<path d="M ${bodyX} 83 Q ${cx} 78 ${bodyX + c.corpsW} 83 L ${bodyX + c.corpsW} ${83 + c.corpsH} Q ${cx} ${83 + c.corpsH + 5} ${bodyX} ${83 + c.corpsH} Z" fill="none" stroke="${couleurBord[palier]}" stroke-width="1.5"/>` : ''}
      
      <!-- Cou -->
      <rect x="${cx - c.cou/2}" y="${66}" width="${c.cou}" height="18" rx="4" fill="${peau}"/>
      
      <!-- Tête -->
      <ellipse cx="${cx}" cy="52" rx="${c.corpsW * 0.36}" ry="20" fill="${peau}"/>
      
      <!-- Cheveux longs -->
      <ellipse cx="${cx}" cy="36" rx="${c.corpsW * 0.4}" ry="10" fill="${cheveux}"/>
      <rect x="${cx - c.corpsW * 0.4}" y="36" width="${c.corpsW * 0.8}" height="6" fill="${cheveux}"/>
      <rect x="${cx - c.corpsW * 0.42}" y="42" width="7" height="35" rx="3" fill="${cheveux}"/>
      <rect x="${cx + c.corpsW * 0.42 - 7}" y="42" width="7" height="35" rx="3" fill="${cheveux}"/>
      
      <!-- Yeux -->
      ${getYeux(palier, yeux, 54, 66, 52)}
      
      <!-- Bouche -->
      <path d="M 56 60 Q 60 64 64 60" stroke="#8B4513" stroke-width="1.2" fill="none" opacity="0.6"/>
      
      <!-- Rang badge -->
      <text x="60" y="190" text-anchor="middle" font-size="8" fill="#7c3aed" font-weight="bold" opacity="0.8">RANG ${palier}</text>
    </svg>
  `;
}