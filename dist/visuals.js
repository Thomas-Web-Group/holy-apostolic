'use strict';
window.OrthodoxVisuals=(()=>{
  const esc=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const safe=url=>{try{const u=new URL(url);return u.protocol==='https:'?esc(u.href):'#';}catch{return '#';}};
  const local=path=>typeof path==='string'&&/^assets\/[a-z0-9/_-]+\.(?:svg|jpg|jpeg|png|webp)$/i.test(path)?(window.OrthodoxSite?'/':'')+esc(path):'';
  const link=(href,label)=>'<a href="'+safe(href)+'" target="_blank" rel="noopener noreferrer">'+esc(label)+'</a>';
  function symbol(id,classes=''){
    if(!/^[a-z0-9-]+$/.test(id))return '';
    return '<img class="section-symbol '+esc(classes)+'" src="/assets/sections/'+id+'.svg" alt="" width="64" height="64" decoding="async">';
  }
  function credit(image){
    if(!image)return 'Image record unavailable.';
    return '<span class="image-author">'+esc(image.attribution||image.author||'Creator not identified in the source record')+'</span> · '+link(image.licenseUrl,image.license)+' · '+link(image.sourceUrl,'Image source');
  }
  function picture(image,{card=false,title='',href='',deferCredit=false}={}){
    if(!image||!local(image.path))return '<div class="saint-image-missing" role="note">Image unavailable</div>';
    const notes=[image.underlyingArtworkNote,image.rightsNote,image.traditionalAttribution,image.datingNote].filter((note,index,all)=>note&&all.indexOf(note)===index).map(note=>'<p>'+esc(note)+'</p>').join('');
    const img='<img data-saint-image src="'+local(image.path)+'" alt="'+esc(image.alt||image.description||title)+'" width="'+Number(image.width||640)+'" height="'+Number(image.height||800)+'" loading="'+(card?'lazy':'eager')+'" decoding="async">';
    const media=(href?'<a class="saint-image-link" href="'+esc(href)+'" aria-label="Read about '+esc(title)+'">'+img+'</a>':'<button type="button" class="artwork-enlarge" data-view-artwork aria-label="Enlarge image of '+esc(title)+'">'+img+'</button>')+'<span class="saint-image-fallback" hidden>Image unavailable on this device.</span>';
    return '<figure class="saint-portrait '+(card?'saint-card-portrait':'saint-detail-portrait')+'"><div class="saint-image-frame">'+media+'</div>'+(card||deferCredit?'':'<figcaption>'+credit(image)+'<details class="image-provenance"><summary>Image details</summary><p>'+esc(image.title)+'</p><p>'+esc(image.description||'')+'</p><p>'+esc(image.modifications||'Unmodified downloaded reproduction; displayed at a smaller size.')+'</p>'+notes+'</details></figcaption>')+'</figure>';
  }
  function artworkSource(image){
    if(!image)return '';
    const notes=[image.underlyingArtworkNote,image.rightsNote,image.traditionalAttribution,image.datingNote].filter((note,index,all)=>note&&all.indexOf(note)===index).map(note=>'<p>'+esc(note)+'</p>').join('');
    return '<div class="artwork-source"><h3>Image source</h3><p class="image-credit">'+credit(image)+'</p><details class="image-provenance"><summary>Image details</summary><p>'+esc(image.title)+'</p><p>'+esc(image.description||'')+'</p><p>'+esc(image.modifications||'Unmodified downloaded reproduction; displayed at a smaller size.')+'</p>'+notes+'</details></div>';
  }
  function bindArtwork(root,image,title,signal){
    root.addEventListener('error',event=>{
      if(!event.target.matches?.('img[data-saint-image]'))return;
      event.target.hidden=true;const wrapper=event.target.closest('.saint-image-link,.artwork-enlarge');if(wrapper)wrapper.hidden=true;const fallback=event.target.closest('.saint-image-frame')?.querySelector('.saint-image-fallback');if(fallback)fallback.hidden=false;
    },{capture:true,signal});
    if(!image)return;
    root.addEventListener('click',event=>{
      const button=event.target.closest('[data-view-artwork]');if(!button)return;
      const dialog=document.createElement('dialog');dialog.className='artwork-dialog';dialog.setAttribute('aria-label',title);
      dialog.innerHTML='<div class="artwork-dialog-top"><h2>'+esc(title)+'</h2><button type="button" class="secondary" data-close-artwork>Close</button></div><img class="artwork-full" src="'+local(image.path)+'" alt="'+esc(image.alt||image.description||title)+'"><p class="image-credit">'+credit(image)+'</p>';
      const close=()=>dialog.close();dialog.querySelector('[data-close-artwork]').addEventListener('click',close);
      dialog.addEventListener('click',event=>{if(event.target===dialog){const box=dialog.getBoundingClientRect();if(event.clientX<box.left||event.clientX>box.right||event.clientY<box.top||event.clientY>box.bottom)close();}});
      dialog.addEventListener('close',()=>{dialog.remove();if(button.isConnected)button.focus({preventScroll:true});},{once:true});
      signal?.addEventListener('abort',()=>{if(dialog.open)dialog.close();dialog.remove();},{once:true});
      document.body.append(dialog);dialog.showModal();dialog.querySelector('[data-close-artwork]').focus();
    },{signal});
  }
  return {symbol,picture,credit,artworkSource,bindArtwork};
})();
