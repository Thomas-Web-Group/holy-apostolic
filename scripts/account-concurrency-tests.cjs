'use strict';
const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict'),crypto=require('node:crypto').webcrypto;
const source=fs.readFileSync(require('node:path').join(__dirname,'../dist/accounts.js'),'utf8');
const uid='11111111-1111-4111-8111-111111111111';
const shared=new Map(),store=map=>new Proxy({getItem:k=>map.get(k)||null,setItem:(k,v)=>map.set(k,String(v)),removeItem:k=>map.delete(k),key:i=>[...map.keys()][i],get length(){return map.size;}},{ownKeys:()=>[...map.keys()],getOwnPropertyDescriptor:()=>({configurable:true,enumerable:true})});
const clone=v=>JSON.parse(JSON.stringify(v));
let remote={payload:{state:{notes:{lesson:'old'},bookmarks:[]}},revision:1};
shared.set('orthodox-way.sync.v1.account.'+uid,JSON.stringify({revision:1,dirty:false}));
async function tab(previousActor=''){
 let state=clone(remote.payload);const tokens=new Map([['orthodox-way.session.v1',JSON.stringify({access_token:'fixture',refresh_token:'fixture',expires_at:Date.now()/1000+3600,user:{id:uid}})]]);if(previousActor)tokens.set('orthodox-way.actor.v1',previousActor);
 const context={console,crypto,localStorage:store(shared),sessionStorage:store(tokens),URLSearchParams,URL,AbortController,CustomEvent:class{},Date,JSON,Error,TypeError,encodeURIComponent,setTimeout:()=>1,clearTimeout:()=>{},location:{hash:'',pathname:'/',search:''},history:{replaceState(){}},fetch:async(url,options={})=>{
  const result=data=>({ok:true,status:200,text:async()=>JSON.stringify(data),json:async()=>clone(data)});
  if(url==='api/account-config')return result({enabled:true,url:'https://example.supabase.co',publicKey:'public'});
  if(url.endsWith('/auth/v1/user'))return result({id:uid});
  if(url.includes('/rest/v1/study_state'))return result([remote]);
  if(url.endsWith('/rpc/save_study_state')){const body=JSON.parse(options.body);if(body.expected_revision!==remote.revision)return result({conflict:true});remote={payload:clone(body.payload_input),revision:remote.revision+1};return result({revision:remote.revision,conflict:false});}
  throw new Error('Unexpected fixture request '+url);
 }};context.window=context;context.dispatchEvent=()=>{};vm.createContext(context);vm.runInContext(source,context);await context.OrthodoxAccounts.ready();context.OrthodoxAccounts.connect({snapshot:()=>clone(state),apply:value=>{state=clone(value);}});await new Promise(r=>setImmediate(r));return {accounts:context.OrthodoxAccounts,get:()=>state};
}
(async()=>{const a=await tab(),b=await tab();a.get().state.notes.lesson='alpha';a.accounts.changed();await a.accounts.sync();assert.equal(remote.payload.state.notes.lesson,'alpha');const afterA=clone(remote);b.get().state.bookmarks.push('another-lesson');b.accounts.changed();await b.accounts.sync();const result={afterA,afterB:remote,tabBReportedConflict:b.accounts.status().conflict,tabBNotice:b.accounts.status().notice,tabAKey:a.accounts.storageKey('orthodox-way.progress.v1'),tabBKey:b.accounts.storageKey('orthodox-way.progress.v1')};assert.equal(remote.payload.state.notes.lesson,'alpha','Newer account note must survive stale-tab edit');assert.equal(remote.revision,2);assert.equal(b.accounts.status().conflict,true);assert.notEqual(result.tabAKey,result.tabBKey);
 shared.set(result.tabAKey,JSON.stringify(a.get().state));const actor=result.tabAKey.split('.tab.')[1].split('.account.')[0],reloaded=await tab(actor),reloadedKey=reloaded.accounts.storageKey('orthodox-way.progress.v1');assert.notEqual(reloadedKey,result.tabAKey);assert.equal(shared.get(reloadedKey),shared.get(result.tabAKey));assert.ok(shared.has(result.tabAKey));result.reloadClonedWithoutRemovingPriorCopy=true;
 const fresh=await tab(),root={innerHTML:'',addEventListener(){}};fresh.accounts.mount({root});assert.ok(root.innerHTML.includes('data-export-copy="'+actor+'"'));result.oldCopyDiscoverableAfterSessionPointerLoss=true;console.log(JSON.stringify({accountTabs:'isolated',staleEdit:'conflict',cloudNote:'preserved',reloadCopy:'retained',oldCopyExport:'available',issues:[]},null,2));})();
