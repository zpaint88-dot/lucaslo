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

// Reveal on scroll
const io = new IntersectionObserver((entries) => {
  entries.forEach(e => {
    if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); }
  });
}, { threshold: 0.12 });
document.querySelectorAll(".service-card, .work, .process-list li, .about-grid > *, .section-head").forEach(el => {
  el.classList.add("reveal"); io.observe(el);
});

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
