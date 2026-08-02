// Year
document.getElementById("year").textContent = new Date().getFullYear();

// Mobile menu
const menuBtn = document.getElementById("menuBtn");
const nav = document.querySelector(".nav");
if (menuBtn && nav) {
  menuBtn.addEventListener("click", () => {
    const open = nav.classList.toggle("open");
    menuBtn.setAttribute("aria-expanded", String(open));
  });
  nav.querySelectorAll("a").forEach(a => a.addEventListener("click", () => {
    nav.classList.remove("open");
    menuBtn.setAttribute("aria-expanded", "false");
  }));
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
