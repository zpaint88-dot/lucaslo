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

  // Before/After compare slider
  document.querySelectorAll('[data-compare-slider]').forEach(slider=>{
    const wrap=slider.querySelector('.compare-after-wrap');
    const divider=slider.querySelector('.compare-divider');
    const handle=slider.querySelector('.compare-handle');
    const afterImg=wrap&&wrap.querySelector('.compare-img');
    if(!wrap||!divider)return;
    let dragging=false;
    function updateSize(){
      const w=slider.getBoundingClientRect().width;
      if(afterImg)afterImg.style.width=w+'px';
    }
    updateSize();
    window.addEventListener('resize',updateSize);
    function setSplit(x){
      const r=slider.getBoundingClientRect();
      let p=Math.min(1,Math.max(0,(x-r.left)/r.width));
      wrap.style.width=(p*100)+'%';
      divider.style.left=(p*100)+'%';
      if(handle)handle.style.left=(p*100)+'%';
    }
    function onStart(e){dragging=true;const t=e.touches?e.touches[0]:e;setSplit(t.clientX);e.preventDefault();}
    function onMove(e){if(!dragging)return;const t=e.touches?e.touches[0]:e;setSplit(t.clientX);}
    function onEnd(){dragging=false;}
    slider.addEventListener('mousedown',onStart);
    slider.addEventListener('touchstart',onStart,{passive:false});
    window.addEventListener('mousemove',onMove);
    window.addEventListener('touchmove',onMove,{passive:false});
    window.addEventListener('mouseup',onEnd);
    window.addEventListener('touchend',onEnd);
    // click-to-jump
    slider.addEventListener('click',e=>{if(!dragging){setSplit((e.touches?e.touches[0]:e).clientX);}});
  });

  const tocLinks=document.querySelectorAll('.toc a[href^="#"]');
  if(tocLinks.length){
    const idToLink=new Map();
    const sections=[];
    tocLinks.forEach(a=>{const id=a.getAttribute('href').slice(1);const el=document.getElementById(id);if(el){idToLink.set(id,a);sections.push(el);}});
    const spy=new IntersectionObserver(entries=>{
      entries.forEach(entry=>{
        if(entry.isIntersecting){
          tocLinks.forEach(l=>l.classList.remove('is-active'));
          const link=idToLink.get(entry.target.id);
          if(link)link.classList.add('is-active');
        }
      });
    },{rootMargin:'-100px 0px -70% 0px',threshold:0});
    sections.forEach(s=>spy.observe(s));
  }

  const backTop=document.querySelector('.back-to-top');
  if(backTop){
    const onScroll=()=>backTop.classList.toggle('is-visible',window.scrollY>500);
    window.addEventListener('scroll',onScroll,{passive:true});
    onScroll();
    backTop.addEventListener('click',()=>window.scrollTo({top:0,behavior:'smooth'}));
  }

  const waFloat=document.querySelector('.wa-float'),footerEl=document.querySelector('.footer');
  if(waFloat&&footerEl){
    const footerObserver=new IntersectionObserver(entries=>{
      entries.forEach(entry=>waFloat.classList.toggle('is-hidden',entry.isIntersecting));
    },{rootMargin:'0px 0px -40px 0px'});
    footerObserver.observe(footerEl);
  }
})();
