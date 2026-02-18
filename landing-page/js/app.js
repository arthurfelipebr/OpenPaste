// ── Nav scroll ────────────────────────────────────────────
const nav = document.getElementById('nav');
window.addEventListener('scroll', () => {
  nav.classList.toggle('scrolled', window.scrollY > 40);
});

// ── Scroll reveal ─────────────────────────────────────────
const observer = new IntersectionObserver((entries) => {
  entries.forEach(e => {
    if (e.isIntersecting) { e.target.classList.add('visible'); observer.unobserve(e.target); }
  });
}, { threshold: 0.12 });

document.querySelectorAll('.reveal').forEach(el => observer.observe(el));

// ── Accordion ─────────────────────────────────────────────
function toggleStep(header) {
  const step = header.closest('.shortcut-step');
  const isOpen = step.classList.contains('open');
  // fechar todos
  document.querySelectorAll('.shortcut-step.open').forEach(s => s.classList.remove('open'));
  if (!isOpen) step.classList.add('open');
}

// ── Copy snippets ─────────────────────────────────────────
function copySnippet(id, btn) {
  const el = document.getElementById(id);
  const text = el.childNodes[0].textContent.trim();
  navigator.clipboard.writeText(text).then(() => {
    btn.textContent = 'copiado!';
    btn.classList.add('copied');
    setTimeout(() => { btn.textContent = 'copiar'; btn.classList.remove('copied'); }, 2000);
  }).catch(() => {});
}
