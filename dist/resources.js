'use strict';
window.OrthodoxResources=(()=>{
 const data=new Map(),scripts=new Map(),nativeFetch=window.fetch.bind(window);let activeBackground=null,lastInput=performance.now(),warming=false,foreground=0,leases=0;
 const root=path=>new URL('/'+String(path).replace(/^\//,''),location.origin).href;
 const diagnostics={background:[],foreground:[],aborted:0};
 for(const event of ['pointerdown','keydown','wheel','touchstart'])addEventListener(event,()=>{lastInput=performance.now();},{passive:true,capture:true});
 const yieldTask=()=>new Promise(resolve=>setTimeout(resolve,0));
 function interrupt(){if(activeBackground){data.delete(activeBackground.file);activeBackground.abort();activeBackground=null;diagnostics.aborted++;}}
 function prune(){const readers=[...data].filter(([key])=>/^page-data\/(lessons|saints|icons|prayers)\//.test(key)&&!key.endsWith('/index.json')&&!key.endsWith('/search.json'));while(readers.length>12){const [key]=readers.shift();data.delete(key);}}
 async function json(file,{background=false}={}){
   file=String(file).replace(/^\//,'');if(!background)interrupt();const found=data.get(file);if(found){data.delete(file);data.set(file,found);return found;}
   if(!background)interrupt();
   const controller=new AbortController();controller.file=file;if(background)activeBackground=controller;
   const task=(async()=>{const response=await nativeFetch(root(file),{signal:controller.signal,priority:background?'low':'high'});if(!response.ok)throw Error('This section could not be downloaded.');const text=await response.text();await yieldTask();if(controller.signal.aborted)throw new DOMException('Preempted','AbortError');return JSON.parse(text);})();
   data.set(file,task);if(!background)foreground++;(background?diagnostics.background:diagnostics.foreground).push(file);
   try{const value=await task;prune();dispatchEvent(new CustomEvent('orthodox-resource',{detail:{file,value}}));return value;}catch(error){if(data.get(file)===task)data.delete(file);throw error;}finally{if(!background)foreground--;if(activeBackground===controller)activeBackground=null;}
 }
 function script(file){if(!scripts.has(file))scripts.set(file,new Promise((resolve,reject)=>{const element=document.createElement('script');element.src=root(file);element.async=true;element.onload=resolve;element.onerror=()=>{scripts.delete(file);element.remove();reject(Error('This section’s controls could not be loaded.'));};document.head.append(element);}));return scripts.get(file);}
 const warmOrder=['page-data/catalog.json','page-data/glossary.json','page-data/saints/index.json','page-data/icons/index.json','page-data/prayers/index.json','content/worship-year.json','content/formation.json','content/church-interior.json','content/church-authority.json','content/timeline.json','content/timeline-reception.json'];
 function mayWarm(){const connection=navigator.connection;return foreground===0&&leases===0&&!document.hidden&&!connection?.saveData&&!/^(slow-2g|2g)$/.test(connection?.effectiveType||'')&&performance.now()-lastInput>900;}
 async function warm(){if(warming)return;warming=true;for(let index=0;index<warmOrder.length;index++){const file=warmOrder[index];while(!mayWarm())await new Promise(resolve=>setTimeout(resolve,1600));if(!data.has(file)){try{await json(file,{background:true});}catch(error){if(error.name==='AbortError'){index--;await new Promise(resolve=>setTimeout(resolve,1800));continue;}}}await new Promise(resolve=>setTimeout(resolve,1600));}warming=false;}
 if(document.readyState==='complete')setTimeout(warm,1800);else addEventListener('load',()=>setTimeout(warm,1800),{once:true});
 return {json,script,interrupt,hold(){leases++;let released=false;return ()=>{if(!released){released=true;leases--;}};},yield:yieldTask,root,diagnostics,has:file=>data.has(file)};
})();
