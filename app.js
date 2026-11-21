(function(){
  'use strict';

  document.querySelectorAll('.year').forEach(function(el){
    el.textContent=new Date().getFullYear();
  });

  var menuButton=document.getElementById('menu-toggle');
  var nav=document.getElementById('nav');
  if(menuButton&&nav){
    function closeMenu(){
      nav.classList.remove('open');
      menuButton.setAttribute('aria-expanded','false');
      menuButton.setAttribute('aria-label','Открыть меню');
    }
    menuButton.addEventListener('click',function(){
      var open=menuButton.getAttribute('aria-expanded')!=='true';
      nav.classList.toggle('open',open);
      menuButton.setAttribute('aria-expanded',String(open));
      menuButton.setAttribute('aria-label',open?'Закрыть меню':'Открыть меню');
    });
    nav.querySelectorAll('a').forEach(function(link){
      link.addEventListener('click',closeMenu);
    });
    document.addEventListener('keydown',function(event){
      if(event.key==='Escape')closeMenu();
    });
    window.addEventListener('resize',function(){
      if(window.innerWidth>920)closeMenu();
    });
  }

  var reducedMotion=window.matchMedia&&window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var revealSelector='.page-hero-inner,.page-section > *, .app-card,.timeline-item,.glass-panel,.discord-note,.rules-group,.rules-toc,.rules-article,.home-inner';
  var revealItems=Array.prototype.slice.call(document.querySelectorAll(revealSelector));
  if(!reducedMotion&&'IntersectionObserver' in window&&revealItems.length){
    revealItems.forEach(function(item,index){
      item.classList.add('reveal');
      item.style.setProperty('--reveal-delay',Math.min(index%5,4)*65+'ms');
    });
    document.body.classList.add('reveal-ready');
    var revealObserver=new IntersectionObserver(function(entries){
      entries.forEach(function(entry){
        if(entry.isIntersecting){
          entry.target.classList.add('is-visible');
          revealObserver.unobserve(entry.target);
        }
      });
    },{threshold:0.12,rootMargin:'0px 0px -35px 0px'});
    revealItems.forEach(function(item){revealObserver.observe(item);});
  }

  var soundEnabled=false;
  try{soundEnabled=localStorage.getItem('averis-sound')==='on';}catch(error){}
  var audioContext=null;
  var soundButton=document.createElement('button');
  soundButton.type='button';
  soundButton.className='sound-toggle';
  soundButton.id='averis-sound-toggle';
  soundButton.setAttribute('aria-pressed',String(soundEnabled));
  soundButton.setAttribute('aria-label',soundEnabled?'Выключить звуки интерфейса':'Включить звуки интерфейса');
  soundButton.innerHTML='<span class="sound-icon" aria-hidden="true">♫</span><span class="sound-label"></span>';
  document.body.appendChild(soundButton);

  function updateSoundButton(){
    soundButton.setAttribute('aria-pressed',String(soundEnabled));
    soundButton.setAttribute('aria-label',soundEnabled?'Выключить звуки интерфейса':'Включить звуки интерфейса');
    soundButton.querySelector('.sound-label').textContent=soundEnabled?'Звук включён':'Звук выключен';
  }
  function getAudioContext(){
    var AudioContextClass=window.AudioContext||window.webkitAudioContext;
    if(!AudioContextClass)return null;
    if(!audioContext)audioContext=new AudioContextClass();
    if(audioContext.state==='suspended')audioContext.resume();
    return audioContext;
  }
  function playTone(frequency,delay,duration,volume,type){
    var context=getAudioContext();
    if(!context)return;
    var start=context.currentTime+delay;
    var oscillator=context.createOscillator();
    var gain=context.createGain();
    oscillator.type=type||'sine';
    oscillator.frequency.setValueAtTime(frequency,start);
    gain.gain.setValueAtTime(0.0001,start);
    gain.gain.exponentialRampToValueAtTime(volume,start+0.012);
    gain.gain.exponentialRampToValueAtTime(0.0001,start+duration);
    oscillator.connect(gain);
    gain.connect(context.destination);
    oscillator.start(start);
    oscillator.stop(start+duration+0.025);
  }
  function playSound(kind){
    if(!soundEnabled)return;
    try{
      if(kind==='transition'){
        playTone(440,0,.16,.018,'sine');
        playTone(587,.055,.17,.016,'sine');
        playTone(784,.11,.2,.014,'sine');
      }else if(kind==='toggle'){
        playTone(620,0,.11,.022,'sine');
        playTone(880,.07,.14,.018,'sine');
      }else{
        playTone(690,0,.075,.018,'sine');
        playTone(920,.035,.09,.012,'sine');
      }
    }catch(error){}
  }

  soundButton.addEventListener('click',function(){
    soundEnabled=!soundEnabled;
    try{localStorage.setItem('averis-sound',soundEnabled?'on':'off');}catch(error){}
    updateSoundButton();
    if(soundEnabled)playSound('toggle');
  });
  updateSoundButton();

  var navigationPending=false;
  document.addEventListener('click',function(event){
    var target=event.target;
    var anchor=target&&target.closest?target.closest('a[href]'):null;
    if(anchor){
      if(event.defaultPrevented||event.button!==0||event.metaKey||event.ctrlKey||event.shiftKey||event.altKey)return;
      if(anchor.hasAttribute('download')||anchor.target==='_blank') {
        playSound('click');
        return;
      }
      var destination;
      try{destination=new URL(anchor.href,window.location.href);}catch(error){return;}
      if(destination.origin!==window.location.origin){
        playSound('click');
        return;
      }
      if(destination.pathname===window.location.pathname&&destination.search===window.location.search){
        playSound('click');
        return;
      }
      event.preventDefault();
      if(navigationPending)return;
      navigationPending=true;
      playSound('transition');
      document.body.classList.add('page-leaving');
      window.setTimeout(function(){window.location.assign(destination.href);},230);
      return;
    }
    if(target&&target.closest&&target.closest('button,.app-card'))playSound('click');
  },true);
})();