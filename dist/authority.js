'use strict';
window.OrthodoxAuthority=(()=>{
  let pending,cleanup=()=>{};
  const esc=value=>String(value??'').replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
  const paragraphs=value=>String(value||'').split(/\n\s*\n/).map(text=>'<p>'+esc(text.replace(/\n/g,' '))+'</p>').join('');
  const safe=value=>{try{const url=new URL(value);return url.protocol==='https:'?esc(url.href):'#';}catch{return '#';}};
  const external=(url,text)=>'<a href="'+safe(url)+'" target="_blank" rel="noopener noreferrer">'+esc(text)+'</a>';
  const refs=block=>block.sourceRefs?.length?block.sourceRefs:block.sourceId?[{sourceId:block.sourceId,locator:block.locator}]:[];
  const categoryLabels={foundation:'Foundation','sacramental-overview':'Overview','sacramental-orders':'Sacramental order','minor-orders':'Minor order','faithful':'Faithful','conciliar-life':'Conciliar life','rocor-administration':'ROCOR office or body','parish-administration':'Parish office or body','monastic-life':'Monastic life','monastic-office':'Monastic office','wider-russian-church':'2007 agreement','rocor-judicial':'Church court','terminology':'Titles'};
  const relationLabels={commission:'Commission',headship:'Headship','apostolic-succession':'Apostolic succession',ordination:'Ordination','office-not-new-order':'Episcopal office','liturgical-assistance':'Liturgical assistance','minor-order-admission':'Admission to minor orders',administration:'Administration',election:'Election',chairmanship:'Chairmanship',appointment:'Appointment','deanery-oversight':'Deanery oversight','elected-participation':'Elected participation','parish-accountability':'Parish accountability','monastic-oversight':'Monastic oversight','monastic-governance':'Monastic governance','defined-canonical-relationship':'Canonical relationship','appeal-route':'Court appeal'};
  const shortNames={christ:'Jesus Christ',apostles:'Apostles','holy-orders':'The three orders',bishop:'Bishop',priest:'Priest / presbyter',deacon:'Deacon',reader:'Reader',subdeacon:'Subdeacon',laity:'Laity','clerical-titles':'Clerical ranks and titles',councils:'Councils and synods','local-churches':'Local Orthodox Churches','rocor-council':'ROCOR Council of Bishops','rocor-synod':'ROCOR Synod of Bishops','first-hierarch':'First Hierarch',diocese:'Diocesan bishop',dean:'Dean',rector:'Parish rector','parish-council':'Parish council',warden:'Church warden',monastics:'Monks, nuns and elders',abbot:'Abbot',abbess:'Abbess','russian-councils':'Russian Church councils','moscow-patriarch':'Patriarch of Moscow','rocor-court':'ROCOR supreme church court'};
  const views={
    orders:{title:'Holy Orders',defaultRole:'holy-orders',roleIds:['holy-orders','christ','apostles','bishop','priest','deacon','reader','subdeacon','laity','clerical-titles'],context:['holy-orders','clerical-titles'],boards:[{id:'orders',title:'Ministry and service',sourceId:'dq-philaret',locator:'Questions 259, 274, 277 and 357–360',nodes:[['christ',1,2],['apostles',2,2],['bishop',3,2],['priest',4,1],['deacon',4,3],['reader',5,1],['subdeacon',5,3],['laity',6,2]]}]},
    governance:{title:'ROCOR governance',defaultRole:'rocor-council',roleIds:['rocor-council','rocor-synod','first-hierarch','diocese','dean','rector','parish-council','warden','laity','russian-councils','moscow-patriarch','rocor-court','councils','local-churches'],context:['councils','local-churches'],boards:[{id:'governance',title:'ROCOR administration',sourceId:'auth-rocor-regulations',locator:'Sections 7–17, 29 and 40–57',nodes:[['rocor-council',1,2],['first-hierarch',2,1],['rocor-synod',2,3],['diocese',3,2],['dean',4,1],['rector',4,3],['parish-council',5,2],['warden',6,1],['laity',6,3]]},{id:'agreement',title:'ROCOR and the Russian Church',sourceId:'auth-canonical-act-final',locator:'Act of 4/17 May 2007, sections 8–11',nodes:[['russian-councils',1,1],['rocor-council',1,3],['rocor-court',2,1],['moscow-patriarch',2,3]]}]},
    monastic:{title:'Monastic life and offices',defaultRole:'monastics',roleIds:['monastics','abbot','abbess','diocese','holy-orders','priest'],context:['holy-orders','priest'],boards:[{id:'monastic',title:'Monastic offices',sourceId:'auth-monasteries',locator:'Statutes, sections 5, 9–10, 19–22 and 25–27',nodes:[['diocese',1,2],['abbot',2,1],['abbess',2,3],['monastics',3,2]]}]}
  };

  async function load(){
    return pending||(pending=(window.OrthodoxResources?window.OrthodoxResources.json('content/church-authority.json').then(value=>({ok:true,json:async()=>value})):fetch('content/church-authority.json')).then(response=>{if(!response.ok)throw new Error('Authority guide unavailable');return response.json();}).then(data=>{
      if(!Array.isArray(data.roles)||!Array.isArray(data.sources)||!Array.isArray(data.relationships)||!Array.isArray(data.cases))throw new Error('Authority guide unavailable');
      return data;
    }).catch(error=>{pending=null;throw error;}));
  }
  function unmount(){cleanup();cleanup=()=>{};}
  async function mount(ctx){
    unmount();
    const {root}=ctx,controller=new AbortController(),signal=controller.signal;
    delete root.dataset.passageRestored;
    let observer,frame=0,returnReference;
    const closeTransient=()=>{window.ScripturePreviews?.close();window.GlossaryPreviews?.close();document.getElementById('passage-selection-toolbar')?.remove();};
    cleanup=()=>{controller.abort();observer?.disconnect();cancelAnimationFrame(frame);closeTransient();};
    root.innerHTML='<p role="status">Loading church authority…</p>';
    let data;
    try{data=await load();}catch{
      if(signal.aborted||!root.isConnected)return;
      root.innerHTML='<section class="authority-page"><h1>Church authority</h1><p>The authority guide could not be loaded.</p><button type="button" data-authority-retry>Try again</button></section>';
      root.querySelector('[data-authority-retry]').addEventListener('click',()=>mount(ctx),{signal});return;
    }
    if(signal.aborted||!root.isConnected)return;
    const input=ctx.params instanceof URLSearchParams?ctx.params:new URLSearchParams(ctx.params||'');
    const roleMap=new Map(data.roles.map(role=>[role.id,role])),caseMap=new Map(data.cases.map(item=>[item.id,item]));
    const globalSources=ctx.sources instanceof Map?[...ctx.sources.values()]:Array.isArray(ctx.sources)?ctx.sources:[];
    const sourceMap=new Map([...globalSources,...data.sources].map(source=>[source.id,source]));
    const numbers=new Map(data.sources.map((source,index)=>[source.id,index+1]));
    const state={view:views[input.get('view')]?input.get('view'):'orders',role:input.get('role')||ctx.id||'',case:input.get('case')||'',passage:input.get('passage')||''};
    let notice='';
    if(state.role&&!roleMap.has(state.role)){notice='Role not found.';state.role='';}
    if(state.case&&!caseMap.has(state.case)){notice+=(notice?' ':'')+'Policy not found.';state.case='';}
    function viewForRole(id,preferred=state.view){return views[preferred]?.roleIds.includes(id)?preferred:Object.keys(views).find(key=>views[key].roleIds.includes(id))||'orders';}
    if(state.role)state.view=viewForRole(state.role);else state.role=views[state.view].defaultRole;
    const sourceMeta=source=>[source.author,source.work||source.title,source.edition,source.translator].filter(Boolean).map(esc).join(' · ');
    const sourceId=source=>'authority-source-'+source;
    function citations(block){
      return refs(block).map(ref=>'<a href="#'+esc(sourceId(ref.sourceId))+'" data-authority-scroll="'+esc(sourceId(ref.sourceId))+'" aria-label="Source '+esc(numbers.get(ref.sourceId)||ref.sourceId)+'">['+esc(numbers.get(ref.sourceId)||ref.sourceId)+']</a> <span>'+esc(ref.locator||'Published source')+'</span>').join(' · ');
    }
    function renderBlock(block,scope){
      const source=sourceMap.get(block.sourceId||refs(block)[0]?.sourceId),edition=block.edition==='kjv'||source?.id==='sp-kjv';
      const prose=block.kind==='quotation'&&source?.id==='dq-philaret'?block.text.replace(/^(\d+\.[^\n]+)\n/,'$1\n\n'):block.text;
      return '<div class="authority-source-block" data-authority-kind="'+esc(block.kind)+'" data-study-scope="authority-'+esc(scope)+'"'+(source?' data-scripture-source="'+esc(source.id)+'"':'')+(edition?' data-scripture-edition="kjv"':'')+'>'+(block.title?'<p class="authority-reading-title">'+esc(block.title)+'</p>':'')+(block.kind==='quotation'?'<blockquote class="quoted-reading">'+paragraphs(prose)+'</blockquote>':'<div class="authority-summary">'+paragraphs(prose).replace(/<p>/g,'<p data-annotatable>')+'</div>')+'<p class="authority-citations">'+citations(block)+'</p>'+(block.kind==='quotation'&&source?.attribution?'<p class="required-attribution">'+esc(source.attribution)+'</p>':'')+'</div>';
    }
    function updateUrl(){
      const params=new URLSearchParams({view:state.view,role:state.role});if(state.case)params.set('case',state.case);
      if(state.passage)params.set('passage',state.passage);
      history.replaceState(null,'','#/authority?'+params.toString());
    }
    function enhance(container){window.ScripturePreviews?.enhance(container);window.GlossaryPreviews?.enhance(container);}
    function nodeButton(id,row,column,board){
      const role=roleMap.get(id);if(!role)return '';
      return '<button type="button" class="authority-node" data-authority-role="'+esc(id)+'" data-authority-node="'+esc(id)+'" data-authority-board-node="'+esc(board)+'" aria-pressed="'+(state.role===id)+'" aria-controls="authority-role-reading" style="--authority-row:'+row+';--authority-column:'+column+'"><span>'+esc(shortNames[id]||role.title)+'</span><small>'+esc(categoryLabels[role.category]||role.category)+'</small></button>';
    }
    function boardMarkup(board){
      return '<section class="authority-board-section"><h3>'+esc(board.title)+'</h3><p class="authority-citations">'+citations({sourceRefs:[{sourceId:board.sourceId,locator:board.locator}]})+'</p><div class="authority-board" data-authority-board="'+esc(board.id)+'"><svg class="authority-connectors" aria-hidden="true" focusable="false"></svg><div class="authority-node-grid">'+board.nodes.map(([id,row,column])=>nodeButton(id,row,column,board.id)).join('')+'</div></div></section>';
    }
    function renderRole(){
      const role=roleMap.get(state.role),panel=root.querySelector('#authority-role-reading');if(!role||!panel)return;
      closeTransient();
      panel.innerHTML='<p class="authority-category">'+esc(categoryLabels[role.category]||role.category)+'</p><h2 id="authority-role-title" tabindex="-1">'+esc(role.title)+'</h2>'+role.blocks.map((block,index)=>renderBlock(block,'role-'+role.id+'-'+index)).join('');
      for(const button of root.querySelectorAll('[data-authority-role]'))button.setAttribute('aria-pressed',String(button.dataset.authorityRole===state.role));
      const select=root.querySelector('#authority-role-select');if(select)select.value=state.role;
      const status=root.querySelector('#authority-selection-status');if(status)status.textContent='Selected: '+role.title;
      renderRelationships();enhance(panel);scheduleDraw();
    }
    function renderRelationships(){
      const container=root.querySelector('#authority-relationships');if(!container)return;
      const visible=new Set(views[state.view].roleIds),items=data.relationships.filter(item=>visible.has(item.from)&&visible.has(item.to));
      container.innerHTML='<details class="authority-relationship-details"><summary>Diagram relationships and sources ('+items.length+')</summary><ol>'+items.map((item,index)=>'<li class="authority-relationship'+(item.from===state.role||item.to===state.role?' is-selected':'')+'" data-authority-relationship="'+esc(item.from+'--'+item.to)+'"><p class="authority-relationship-type">'+esc(relationLabels[item.type]||item.type)+'</p><div class="authority-related-roles"><button type="button" data-authority-role="'+esc(item.from)+'" aria-pressed="'+(state.role===item.from)+'">'+esc(shortNames[item.from]||roleMap.get(item.from)?.title)+'</button><span aria-hidden="true">→</span><span class="authority-sr-only">to</span><button type="button" data-authority-role="'+esc(item.to)+'" aria-pressed="'+(state.role===item.to)+'">'+esc(shortNames[item.to]||roleMap.get(item.to)?.title)+'</button></div>'+renderBlock(item,'relationship-'+item.from+'-'+item.to+'-'+index)+'</li>').join('')+'</ol></details>';
      enhance(container);
    }
    function sourceRecord(source){
      return '<li id="'+esc(sourceId(source.id))+'" tabindex="-1"><p>'+external(source.url,source.title)+'</p><p class="reading-attribution">'+sourceMeta(source)+'</p><p>'+esc([source.type,source.tradition].filter(Boolean).join(' · '))+'</p><p class="authority-rights">'+(source.rightsUrl?external(source.rightsUrl,source.rights||'Rights'):esc(source.rights||'Rights not recorded'))+'</p>'+(source.rightsNote?'<p class="authority-rights">'+esc(source.rightsNote)+'</p>':'')+(source.attribution?'<p class="authority-rights">'+esc(source.attribution)+'</p>':'')+'</li>';
    }
    function renderCase(){
      const container=root.querySelector('#authority-case-reading'),item=caseMap.get(state.case);if(!container)return;
      closeTransient();
      const select=root.querySelector('#authority-case-select');if(select)select.value=state.case;
      for(const button of root.querySelectorAll('[data-authority-case]'))button.setAttribute('aria-pressed',String(button.dataset.authorityCase===state.case));
      container.hidden=!item;
      if(!item){container.replaceChildren();return;}
      container.innerHTML='<header><h3 id="authority-case-title" tabindex="-1">'+esc(item.title)+'</h3><dl class="authority-case-facts"><div><dt>Jurisdiction / scope</dt><dd>'+esc(item.jurisdiction)+'</dd></div><div><dt>Publication / decision date</dt><dd>'+esc(item.date)+'</dd></div></dl><div class="authority-case-roles">'+item.decisionMakerIds.filter(id=>roleMap.has(id)).map(id=>'<button type="button" data-authority-role="'+esc(id)+'" aria-pressed="'+(state.role===id)+'">'+esc(shortNames[id]||roleMap.get(id).title)+'</button>').join('')+'</div></header>'+item.blocks.map((block,index)=>renderBlock(block,'case-'+item.id+'-'+index)).join('')+'<details class="authority-scope"><summary>Source scope</summary><p>'+esc(item.scope)+'</p></details>';
      enhance(container);
    }
    function renderPage(){
      const view=views[state.view];
      root.innerHTML='<article class="authority-page"><header class="page-heading"><h1>Church authority</h1></header><nav class="authority-views" aria-label="Authority views">'+Object.entries(views).map(([key,item])=>'<a href="#/authority?view='+key+'" data-authority-view="'+key+'"'+(key===state.view?' aria-current="page"':'')+'>'+esc(item.title)+'</a>').join('')+'</nav>'+(notice?'<p class="authority-notice" role="status">'+esc(notice)+'</p>':'')+'<div class="authority-controls"><label for="authority-role-select">Role or office<select id="authority-role-select">'+view.roleIds.filter(id=>roleMap.has(id)).map(id=>'<option value="'+esc(id)+'"'+(state.role===id?' selected':'')+'>'+esc(roleMap.get(id).title)+'</option>').join('')+'</select></label><div class="authority-quick-links"><a href="#authority-role-title" data-authority-scroll="authority-role-title">Read selected role</a><a href="#authority-policies" data-authority-scroll="authority-policies">Published policies and examples</a></div></div><p class="authority-sr-only" role="status" id="authority-selection-status"></p><div class="authority-layout"><section class="authority-diagram-column" aria-label="'+esc(view.title)+' diagram"><h2>'+esc(view.title)+'</h2><div class="authority-context-roles">'+view.context.map(id=>'<button type="button" data-authority-role="'+esc(id)+'" aria-pressed="'+(state.role===id)+'">'+esc(shortNames[id]||roleMap.get(id)?.title)+'</button>').join('')+'</div><p class="authority-diagram-help">Select a role to read its sources. Each arrow names a relationship; open the relationship list for its published basis.</p>'+view.boards.map(boardMarkup).join('')+'<div id="authority-relationships"></div></section><section class="authority-role-reading" id="authority-role-reading" aria-labelledby="authority-role-title"></section></div><section id="authority-policies" class="authority-policies" tabindex="-1"><h2>Published policies and examples</h2><label for="authority-case-select">Policy or question<select id="authority-case-select"><option value="">Choose a published policy</option>'+data.cases.map(item=>'<option value="'+esc(item.id)+'"'+(item.id===state.case?' selected':'')+'>'+esc(item.title)+'</option>').join('')+'</select></label><article class="authority-case-reading" id="authority-case-reading" hidden></article><div class="authority-case-grid">'+data.cases.map(item=>'<button type="button" class="authority-case-card" data-authority-case="'+esc(item.id)+'" aria-pressed="'+(item.id===state.case)+'" aria-controls="authority-case-reading"><span>'+esc(item.title)+'</span><small>'+esc(item.jurisdiction)+'</small><small>'+esc(item.date)+'</small></button>').join('')+'</div></section>'+data.readings.map(reading=>'<section class="authority-published-reading"><details><summary>'+esc(reading.title)+'</summary><p class="authority-reading-date">'+esc(reading.date||'')+'</p>'+reading.blocks.map((block,index)=>renderBlock(block,'reading-'+reading.id+'-'+index)).join('')+'</details></section>').join('')+'<section class="authority-sources-section"><details id="authority-sources"><summary>Sources ('+data.sources.length+')</summary><button type="button" class="authority-reference-return" data-authority-return hidden>Back to reference</button><ol class="authority-source-list">'+data.sources.map(sourceRecord).join('')+'</ol></details></section><details class="authority-scope"><summary>Summary context</summary>'+[...new Set([...data.roles.flatMap(role=>role.blocks),...data.relationships,...data.cases.flatMap(item=>item.blocks)].filter(block=>block.kind==='summary').map(block=>block.reason).filter(Boolean))].map(text=>'<p>'+esc(text)+'</p>').join('')+'</details></article>';
      renderRole();renderCase();enhance(root);observeBoards();updateUrl();
    }
    function focusSection(id,scroll=true){
      const element=root.querySelector('#'+CSS.escape(id));if(!element)return;
      if(scroll)element.scrollIntoView({block:'start'});element.focus({preventScroll:true});
    }
    function chooseRole(id,reveal=true){
      if(!roleMap.has(id))return;
      const nextView=viewForRole(id);state.role=id;state.passage='';notice='';
      if(nextView!==state.view){state.view=nextView;renderPage();}else{renderRole();updateUrl();}
      if(reveal)focusSection('authority-role-title',matchMedia('(max-width: 1040px)').matches);
    }
    function observeBoards(){
      observer?.disconnect();
      if(window.ResizeObserver){observer=new ResizeObserver(scheduleDraw);for(const board of root.querySelectorAll('[data-authority-board]'))observer.observe(board);}
      scheduleDraw();
    }
    function scheduleDraw(){
      cancelAnimationFrame(frame);frame=requestAnimationFrame(()=>{if(!signal.aborted&&root.isConnected)draw();});
    }
    function draw(){
      for(const board of root.querySelectorAll('[data-authority-board]')){
        const svg=board.querySelector('svg'),bounds=board.getBoundingClientRect(),buttons=new Map([...board.querySelectorAll('[data-authority-node]')].map(button=>[button.dataset.authorityNode,button]));
        if(!bounds.width||!bounds.height)continue;
        const items=data.relationships.filter(item=>buttons.has(item.from)&&buttons.has(item.to)),marker='authority-arrow-'+board.dataset.authorityBoard;
        svg.setAttribute('viewBox','0 0 '+bounds.width+' '+bounds.height);
        let markup='<defs><marker id="'+marker+'" markerWidth="9" markerHeight="9" refX="7" refY="3.5" orient="auto"><path d="M 0 0 L 7 3.5 L 0 7"/></marker><marker id="'+marker+'-selected" markerWidth="9" markerHeight="9" refX="7" refY="3.5" orient="auto"><path d="M 0 0 L 7 3.5 L 0 7"/></marker></defs>';
        for(const item of items){
          const a=buttons.get(item.from).getBoundingClientRect(),b=buttons.get(item.to).getBoundingClientRect();
          const ax=a.left-bounds.left+a.width/2,ay=a.top-bounds.top+a.height/2,bx=b.left-bounds.left+b.width/2,by=b.top-bounds.top+b.height/2;
          const horizontal=Math.abs(ay-by)<35,up=by<ay;
          let x1=ax,y1=ay+(up?-a.height/2:a.height/2),x2=bx,y2=by+(up?b.height/2:-b.height/2),path,lx,ly;
          if(item.type==='headship'&&Math.abs(by-ay)>300){
            const lane=bounds.width-8;x1=a.right-bounds.left;y1=ay;x2=b.right-bounds.left;y2=by;
            path='M '+x1+' '+y1+' H '+lane+' V '+y2+' H '+x2;lx=lane-8;ly=(y1+y2)/2;
          }else if(horizontal){
            const right=bx>ax;x1=ax+(right?a.width/2:-a.width/2);y1=ay;x2=bx+(right?-b.width/2:b.width/2);y2=by;
            path='M '+x1+' '+y1+' L '+x2+' '+y2;lx=(x1+x2)/2;ly=ay-Math.max(a.height,b.height)/2-16;
          }else{
            const mid=(y1+y2)/2;path='M '+x1+' '+y1+' C '+x1+' '+mid+' '+x2+' '+mid+' '+x2+' '+y2;lx=(x1+x2)/2;ly=mid-7;
          }
          const selected=item.from===state.role||item.to===state.role,label=relationLabels[item.type]||item.type;
          markup+='<g class="authority-edge'+(selected?' is-selected':'')+'"><title>'+esc((shortNames[item.from]||item.from)+' — '+label+' — '+(shortNames[item.to]||item.to))+'</title><path d="'+path+'" marker-end="url(#'+marker+(selected?'-selected':'')+')"/><text x="'+lx+'" y="'+ly+'" text-anchor="'+(item.type==='headship'?'end':'middle')+'">'+esc(label)+'</text></g>';
        }
        svg.innerHTML=markup;
      }
    }
    root.addEventListener('click',event=>{
      const source=event.target.closest('[data-authority-scroll]');
      if(source){
        event.preventDefault();const target=root.querySelector('#'+CSS.escape(source.dataset.authorityScroll));if(!target)return;
        if(source.dataset.authorityScroll.startsWith('authority-source-')){
          returnReference=source;root.querySelector('#authority-sources').open=true;root.querySelector('[data-authority-return]').hidden=false;
        }
        if(target.tagName==='DETAILS')target.open=true;target.scrollIntoView({block:'start'});target.focus({preventScroll:true});return;
      }
      if(event.target.closest('[data-authority-return]')){if(returnReference?.isConnected){returnReference.scrollIntoView({block:'center'});returnReference.focus({preventScroll:true});}return;}
      const view=event.target.closest('[data-authority-view]');
      if(view){event.preventDefault();state.view=view.dataset.authorityView;state.role=views[state.view].defaultRole;state.passage='';notice='';renderPage();root.querySelector('[data-authority-view="'+state.view+'"]').focus({preventScroll:true});return;}
      const role=event.target.closest('[data-authority-role]');if(role){chooseRole(role.dataset.authorityRole);return;}
      const item=event.target.closest('[data-authority-case]');
      if(item){state.case=item.dataset.authorityCase;state.passage='';renderCase();updateUrl();focusSection('authority-case-title');}
    },{signal});
    root.addEventListener('change',event=>{
      if(event.target.id==='authority-role-select')chooseRole(event.target.value,false);
      if(event.target.id==='authority-case-select'){state.case=event.target.value;state.passage='';renderCase();updateUrl();}
    },{signal});
    window.addEventListener('resize',scheduleDraw,{signal});
    document.fonts?.ready.then(()=>{if(!signal.aborted)scheduleDraw();});
    renderPage();
  }
  return {load,mount,unmount};
})();
