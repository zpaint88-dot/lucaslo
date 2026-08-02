(function(){
  const root=document.documentElement,toggle=document.querySelector('[data-theme-toggle]');
  let theme=window.matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light';
  root.setAttribute('data-theme',theme);
  function renderIcon(){
    if(!toggle)return;
    toggle.innerHTML=theme==='dark'
      ?'<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="5"/><path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/></svg>'
      :'<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>';
    toggle.setAttribute('aria-label',theme==='dark'?'切換至淺色模式':'切換至深色模式');
  }
  renderIcon();
  toggle&&toggle.addEventListener('click',()=>{theme=theme==='dark'?'light':'dark';root.setAttribute('data-theme',theme);renderIcon();});

  const menuToggle=document.querySelector('[data-menu-toggle]'),menu=document.querySelector('[data-menu]');
  menuToggle&&menuToggle.addEventListener('click',()=>menu.classList.toggle('open'));
  menu&&menu.querySelectorAll('a').forEach(a=>a.addEventListener('click',()=>menu.classList.remove('open')));

  const observer=new IntersectionObserver(entries=>{
    entries.forEach(entry=>{if(entry.isIntersecting)entry.target.classList.add('visible')});
  },{threshold:.12});
  document.querySelectorAll('.reveal').forEach((el,i)=>{if(i<2)el.classList.add('visible');else observer.observe(el)});

  const waFloat=document.querySelector('.wa-float'),footerEl=document.querySelector('.footer');
  if(waFloat&&footerEl){
    const footerObserver=new IntersectionObserver(entries=>{
      entries.forEach(entry=>waFloat.classList.toggle('is-hidden',entry.isIntersecting));
    },{rootMargin:'0px 0px -40px 0px'});
    footerObserver.observe(footerEl);
  }
})();
