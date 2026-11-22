'use strict';
const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict'),crypto=require('node:crypto').webcrypto;
const uid='11111111-1111-4111-8111-111111111111',shared=new Map([['orthodox-way.progress.v1','guest data retained']]);
const store=map=>new Proxy({getItem:k=>map.get(k)||null,setItem:(k,v)=>map.set(k,String(v)),removeItem:k=>map.delete(k),key:i=>[...map.keys()][i],get length(){return map.size;}},{ownKeys:()=>[...map.keys()],getOwnPropertyDescriptor:()=>({configurable:true,enumerable:true})});
const tokens=new Map([['orthodox-way.session.v1',JSON.stringify({access_token:'fixture',refresh_token:'fixture',expires_at:Date.now()/1000+3600,user:{id:uid}})]]);
let started,release,applyCount=0,discardCount=0,reloads=0;
const startedPromise=new Promise(resolve=>started=resolve),held=new Promise(resolve=>release=resolve);
const response=data=>({ok:true,status:200,text:async()=>JSON.stringify(data),json:async()=>JSON.parse(JSON.stringify(data))});
const context={console,crypto,localStorage:store(shared),sessionStorage:store(tokens),URLSearchParams,URL,AbortController,CustomEvent:class{},Date,JSON,Error,TypeError,encodeURIComponent,setTimeout:()=>1,clearTimeout:()=>{},location:{hash:'',pathname:'/',search:'',reload:()=>{reloads++;}},history:{replaceState(){}},fetch:async(url,options={})=>{
 if(url==='api/account-config')return response({enabled:true,url:'https://example.supabase.co',publicKey:'public'});
 if(url.endsWith('/auth/v1/user'))return response({id:uid});
 if(url.endsWith('/auth/v1/logout'))return response({});
 if(url.includes('/rest/v1/study_state')){started();await held;return response([{payload:{app:'the-orthodox-way',schema:1,state:{notes:{private:'Must not enter guest memory'}}},revision:10}]);}
 throw new Error('Unexpected fixture request '+url);
}};context.window=context;context.dispatchEvent=()=>{};vm.createContext(context);vm.runInContext(fs.readFileSync(require('node:path').join(__dirname,'../dist/accounts.js'),'utf8'),context);
(async()=>{const api=context.OrthodoxAccounts;await api.ready();shared.set(api.storageKey('orthodox-way.progress.v1'),'private cached fixture');api.connect({snapshot:()=>({}),apply:()=>{applyCount++;},discard:()=>{discardCount++;}});await startedPromise;assert.equal(api.status().busy,true);await api.clearCacheLogout();assert.equal(api.user(),null);release();for(let n=0;n<30&&api.status().busy;n++)await new Promise(resolve=>setImmediate(resolve));assert.equal(api.status().busy,false);assert.equal(applyCount,0);assert.equal(discardCount,1);assert.equal(reloads,1);assert.equal(shared.get('orthodox-way.progress.v1'),'guest data retained');assert.equal([...shared.keys()].filter(k=>k.endsWith('.account.'+uid)).length,0);assert.equal(api.user(),null);console.log(JSON.stringify({delayedCloudResponseAfterLogoutIgnored:true,bridgeApplyCount:applyCount,userAfterLateResponse:api.user(),guestCachePreserved:true,accountCachesRemoved:true,issues:[]},null,2));})();
