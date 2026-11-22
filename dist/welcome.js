'use strict';
window.OrthodoxWelcome=(()=>{
 const main=document.getElementById('main'),homeMarkup=main.querySelector('#welcome-home')?.outerHTML||'<h1>Holy Apostolic</h1>',early=new AbortController();
 const titles={learn:'Learn',lesson:'Lesson',prayers:'Prayers',prayer:'Prayer',saints:'Saints',saint:'Saint',icons:'Icons',icon:'Icon',glossary:'Glossary',term:'Glossary',timeline:'Church history',account:'Account',settings:'Settings',church:'Inside the church',authority:'Church authority','church-year':'Church year',services:'Services',service:'Service',library:'Search'};
 const route=()=>location.hash.replace(/^#\/?/,'').split(/[/?]/)[0]||'home';
 function loading(page,error=''){
  const title=titles[page]||'Library';
  return '<section class="library-loading"><h1>'+title+'</h1>'+(error?'<p role="alert">The library could not be loaded. Check your connection and try again.</p><button class="primary" id="retry-load">Try again</button><p><a href="feedback.html">Share feedback</a> · <a href="#/home">Home</a></p>':'<p role="status">'+(page==='account'?'Loading account options…':page==='learn'?'Loading the curriculum and saved progress…':'Loading this section…')+'</p>')+'</section>';
 }
 function syncAccount(){
  document.body.classList.toggle('landing-page',route()==='home');
  const api=window.OrthodoxAccounts;if(!api)return;
  const user=api.user(),note=document.querySelector('[data-welcome-account-note]'),signup=document.querySelector('[data-welcome-signup]'),login=document.querySelector('[data-welcome-login]');
  if(signup)signup.hidden=Boolean(user);
  if(login){login.textContent=user?'Your account':'Log in';login.href=user?'#/account':'#/account?mode=login';}
  if(note)note.textContent=user?'Your account is available from the navigation.':api.configured()?'Accounts are optional. You can explore the library without signing in.':'Account sign-in is being prepared for the beta. You can explore and save progress in this browser now.';
 }
 function renderEarly(){const page=route();document.body.classList.toggle('landing-page',page==='home');main.innerHTML=page==='home'?homeMarkup:loading(page);syncAccount();document.querySelector('#breadcrumb').textContent=titles[page]||'Home';}
 function closeMenu(){document.querySelector('#sidebar').classList.remove('open');const button=document.querySelector('#menu-toggle');button.setAttribute('aria-expanded','false');button.setAttribute('aria-label','Open navigation');button.textContent='Menu';}
 window.addEventListener('hashchange',()=>{renderEarly();closeMenu();scrollTo(0,0);},{signal:early.signal});
 document.querySelector('#menu-toggle').addEventListener('click',()=>{const open=document.querySelector('#sidebar').classList.toggle('open'),button=document.querySelector('#menu-toggle');button.setAttribute('aria-expanded',String(open));button.setAttribute('aria-label',open?'Close navigation':'Open navigation');button.textContent=open?'Close':'Menu';},{signal:early.signal});
 document.addEventListener('keydown',event=>{if(event.key==='Escape')closeMenu();},{signal:early.signal});
 document.querySelector('#global-search').addEventListener('submit',event=>{event.preventDefault();location.hash='/library?q='+encodeURIComponent(document.querySelector('#global-query').value);},{signal:early.signal});
 document.addEventListener('click',event=>{if(event.target.closest('[data-welcome-explore]')){event.preventDefault();document.getElementById('welcome-ways')?.scrollIntoView({behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'auto':'smooth'});}});
 renderEarly();
 return {homeMarkup,loading,syncAccount,release:()=>early.abort()};
})();
