'use strict';
(()=>{
 const banner=document.querySelector('.beta-banner[data-dismissible]');if(!banner)return;
 const key='orthodox-way.beta-notice.v2';let timer,interacting=false,manuallyDismissed=false;
 const dismiss=(manual=false)=>{clearTimeout(timer);const hadFocus=banner.contains(document.activeElement);banner.hidden=true;if(hadFocus)document.getElementById('main')?.focus({preventScroll:true});if(manual)try{sessionStorage.setItem(key,'dismissed');}catch{}};
 const schedule=()=>{clearTimeout(timer);if(!interacting&&!banner.hidden&&!document.hidden)timer=setTimeout(()=>dismiss(false),10000);};
 try{manuallyDismissed=sessionStorage.getItem(key)==='dismissed';}catch{}
 banner.hidden=manuallyDismissed;
 banner.querySelector('[data-dismiss-beta]').addEventListener('click',()=>dismiss(true));
 banner.addEventListener('pointerenter',()=>{interacting=true;clearTimeout(timer);});banner.addEventListener('pointerleave',()=>{interacting=banner.contains(document.activeElement);schedule();});
 banner.addEventListener('focusin',()=>{interacting=true;clearTimeout(timer);});banner.addEventListener('focusout',()=>{setTimeout(()=>{interacting=banner.matches(':hover')||banner.contains(document.activeElement);schedule();},0);});document.addEventListener('visibilitychange',()=>{clearTimeout(timer);if(!document.hidden)schedule();});schedule();
})();
