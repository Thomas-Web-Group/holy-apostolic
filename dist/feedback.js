'use strict';
(()=>{
 const form=document.getElementById('feedback-form');if(!form)return;
 const status=document.getElementById('feedback-status'),button=document.getElementById('feedback-submit');
 form.elements.message.addEventListener('input',()=>form.elements.message.setCustomValidity(''));
 form.addEventListener('submit',async event=>{
  event.preventDefault();form.elements.message.setCustomValidity(form.elements.message.value.trim().length>=3?'':'Please enter your message or request.');if(!form.reportValidity()||button.disabled)return;
  if(form.elements['bot-field'].value)return;
  const body=new URLSearchParams({'form-name':'feedback',email:form.elements.email.value.trim(),message:form.elements.message.value.trim(),'bot-field':''});
  const abort=new AbortController(),timer=setTimeout(()=>abort.abort(),20000);button.disabled=true;button.textContent='Sending…';status.textContent='';
  try{const response=await fetch('feedback.html',{method:'POST',headers:{'Content-Type':'application/x-www-form-urlencoded'},body:body.toString(),signal:abort.signal});if(!response.ok)throw new Error();status.textContent='Thank you. Your message has been sent.';form.reset();}
  catch{status.textContent='Your message could not be sent. Please try again. Your text is still here.';}
  finally{clearTimeout(timer);button.disabled=false;button.textContent='Send feedback';}
 });
})();
