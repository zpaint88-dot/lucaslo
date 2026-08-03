// Year
document.getElementById("year").textContent = new Date().getFullYear();

// Nav overlay (unified hamburger for all breakpoints)
const menuBtn = document.getElementById("menuBtn");
const nav = document.querySelector(".nav");
function closeNav(){
  if (!nav || !menuBtn) return;
  if (nav.classList.contains("closing")) return;
  nav.classList.add("closing");
  menuBtn.setAttribute("aria-expanded", "false");
  menuBtn.setAttribute("aria-label", "開啟選單");
  // Wait for CSS fade-out then fully hide + restore scroll
  const finish = () => {
    nav.classList.remove("open", "closing");
    document.body.style.overflow = "";
  };
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (reduced) { finish(); return; }
  setTimeout(finish, 380);
}
function openNav(){
  if (!nav || !menuBtn) return;
  nav.classList.add("open");
  menuBtn.setAttribute("aria-expanded", "true");
  menuBtn.setAttribute("aria-label", "關閉選單");
  document.body.style.overflow = "hidden";
}
if (menuBtn && nav) {
  menuBtn.addEventListener("click", () => {
    if (nav.classList.contains("open")) closeNav(); else openNav();
  });
  nav.querySelectorAll("a").forEach(a => a.addEventListener("click", closeNav));
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && nav.classList.contains("open")) closeNav();
  });
}

// Sticky WhatsApp float button visibility
const waFloat = document.getElementById("waFloat");
if (waFloat) {
  const toggleWa = () => {
    if (window.scrollY > 400) waFloat.classList.add("visible");
    else waFloat.classList.remove("visible");
  };
  toggleWa();
  window.addEventListener("scroll", toggleWa, { passive: true });
}

// Reveal on scroll — refined blur + scale + stagger
const io = new IntersectionObserver((entries) => {
  entries.forEach(e => {
    if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); }
  });
}, { threshold: 0.12, rootMargin: "0px 0px -80px 0px" });

// Individual reveal targets (section headings, standalone blocks)
document.querySelectorAll(
  ".section-head, .about-grid > *, .cases-cta, .reviews-cta, .contact-info, .contact-form-wrap"
).forEach(el => {
  el.classList.add("reveal"); io.observe(el);
});

// Grid/list groups: stagger their children with --i index
document.querySelectorAll(
  ".services-grid, .works-grid, .process-list, .brands-grid, .pricing-grid, .cases-grid, .gallery-grid, .reviews-grid"
).forEach(group => {
  Array.from(group.children).forEach((child, i) => {
    child.classList.add("reveal");
    child.style.setProperty("--i", i);
    io.observe(child);
  });
  // Also mark the container so CSS can trigger stagger via .in on parent (fallback)
  io.observe(group);
  group.classList.add("reveal-group");
});

// 3D tilt on service cards
const tiltCards = document.querySelectorAll('.service-card');
const isCoarsePointer = window.matchMedia('(pointer:coarse)').matches;
const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion:reduce)').matches;
if (!isCoarsePointer && !prefersReducedMotion) {
  tiltCards.forEach(card => {
    let rafId = null;
    const MAX_TILT = 8; // degrees

    const handleMove = (e) => {
      const rect = card.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const cx = rect.width / 2;
      const cy = rect.height / 2;
      const dx = (x - cx) / cx;   // -1 .. 1
      const dy = (y - cy) / cy;
      const rotateY = dx * MAX_TILT;
      const rotateX = -dy * MAX_TILT;
      const mxPct = (x / rect.width) * 100;
      const myPct = (y / rect.height) * 100;

      if (rafId) cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(() => {
        card.style.setProperty('--rx', rotateX.toFixed(2) + 'deg');
        card.style.setProperty('--ry', rotateY.toFixed(2) + 'deg');
        card.style.setProperty('--ty', '-6px');
        card.style.setProperty('--mx', mxPct + '%');
        card.style.setProperty('--my', myPct + '%');
      });
    };

    const handleEnter = () => card.classList.add('tilting');
    const handleLeave = () => {
      card.classList.remove('tilting');
      card.style.setProperty('--rx', '0deg');
      card.style.setProperty('--ry', '0deg');
      card.style.setProperty('--ty', '0px');
      card.style.setProperty('--mx', '50%');
      card.style.setProperty('--my', '50%');
    };

    card.addEventListener('pointerenter', handleEnter);
    card.addEventListener('pointermove', handleMove);
    card.addEventListener('pointerleave', handleLeave);
  });
}

// Contact form → WhatsApp
function sendToWhatsApp(e) {
  e.preventDefault();
  const f = e.target;
  const name = f.name.value.trim();
  const phone = f.phone.value.trim();
  const car = f.car.value;
  const service = f.service.value;
  const note = f.note.value.trim();

  const lines = [
    "你好，我想預約查詢：",
    "",
    `姓名：${name}`,
    `電話：${phone}`,
    `車型：${car}`,
    `服務：${service}`,
  ];
  if (note) lines.push(`補充：${note}`);

  const msg = encodeURIComponent(lines.join("\n"));
  window.open(`https://wa.me/85292230077?text=${msg}`, "_blank", "noopener");
  return false;
}
