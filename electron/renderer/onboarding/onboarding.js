'use strict';

// ── State ─────────────────────────────────────────────────
let currentLocale = 'en';
let strings = {};
let currentStep = 0;
const TOTAL_STEPS = 4;

// ── Init ──────────────────────────────────────────────────
window.addEventListener('DOMContentLoaded', async () => {
  currentLocale = await window.openPaste.getLocale();
  strings = await window.openPaste.getStrings(currentLocale);
  applyI18n();
  updateLangButtons();
  updateNavButtons();
  // Step 2 (index 2) needs server info — pre-fetch so it's ready when user arrives
  await loadServerInfo();
});

// ── i18n ──────────────────────────────────────────────────
function t(key, vars) {
  let str = strings[key] || key;
  if (vars) {
    Object.keys(vars).forEach((k) => {
      str = str.replace(`{${k}}`, vars[k]);
    });
  }
  return str;
}

function applyI18n() {
  document.querySelectorAll('[data-i18n]').forEach((el) => {
    el.textContent = t(el.getAttribute('data-i18n'));
  });
  document.querySelectorAll('[data-i18n-html]').forEach((el) => {
    el.innerHTML = t(el.getAttribute('data-i18n-html'));
  });
  document.title = t('onboardingTitle');
}

async function pickLang(lang) {
  if (lang === currentLocale) return;
  await window.openPaste.setLocale(lang);
  currentLocale = lang;
  strings = await window.openPaste.getStrings(lang);
  applyI18n();
  updateLangButtons();
  // Re-populate dynamic fields after language change
  await loadServerInfo();
}

function updateLangButtons() {
  // Header mini buttons
  const btnEn = document.getElementById('langEn');
  const btnPt = document.getElementById('langPt');
  if (btnEn) btnEn.classList.toggle('active', currentLocale === 'en');
  if (btnPt) btnPt.classList.toggle('active', currentLocale === 'pt-BR');

  // Step 1 large lang-option cards
  const optEn = document.getElementById('optEn');
  const optPt = document.getElementById('optPt');
  if (optEn) optEn.classList.toggle('selected', currentLocale === 'en');
  if (optPt) optPt.classList.toggle('selected', currentLocale === 'pt-BR');
}

// ── Navigation ────────────────────────────────────────────
function showStep(n) {
  const prev = document.getElementById(`step-${currentStep}`);
  const next = document.getElementById(`step-${n}`);

  if (prev) {
    prev.classList.remove('active');
    prev.classList.add('exit');
    // Clean up exit class after transition so it doesn't block re-entry
    prev.addEventListener('transitionend', () => prev.classList.remove('exit'), { once: true });
  }

  if (next) {
    next.classList.add('active');
  }

  currentStep = n;
  updateDots();
  updateNavButtons();
}

function nextStep() {
  if (currentStep >= TOTAL_STEPS - 1) {
    window.openPaste.onboardingDone();
  } else {
    showStep(currentStep + 1);
  }
}

function prevStep() {
  if (currentStep > 0) {
    showStep(currentStep - 1);
  }
}

function updateDots() {
  const dots = document.querySelectorAll('#progress .dot');
  dots.forEach((dot, i) => {
    dot.classList.remove('active', 'done');
    if (i < currentStep) dot.classList.add('done');
    else if (i === currentStep) dot.classList.add('active');
  });
}

function updateNavButtons() {
  const btnBack = document.getElementById('btnBack');
  const btnNext = document.getElementById('btnNext');

  if (btnBack) {
    btnBack.style.visibility = currentStep === 0 ? 'hidden' : 'visible';
  }

  if (btnNext) {
    const isLast = currentStep === TOTAL_STEPS - 1;
    btnNext.setAttribute('data-i18n', isLast ? 'onboardBtnFinish' : 'onboardBtnNext');
    btnNext.textContent = t(isLast ? 'onboardBtnFinish' : 'onboardBtnNext');
  }
}

// ── Server info (step 2) ──────────────────────────────────
async function loadServerInfo() {
  try {
    const info = await window.openPaste.getServerInfo();
    const port = info.port ?? 9876;
    const ip   = info.localIP ?? '—';

    const netPort    = document.getElementById('netPort');
    const netIP      = document.getElementById('netIP');
    const endpointBox = document.getElementById('endpointBox');

    if (netPort)     netPort.textContent     = port;
    if (netIP)       netIP.textContent       = ip;
    if (endpointBox) endpointBox.textContent = ip !== '—'
      ? `http://${ip}:${port}/clip`
      : `http://openpaste.local:${port}/clip`;
  } catch (err) {
    console.error('[onboarding] Could not load server info:', err);
  }
}
