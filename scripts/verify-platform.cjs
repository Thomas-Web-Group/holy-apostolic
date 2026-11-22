'use strict';
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'..'),read=p=>fs.readFileSync(path.join(root,p),'utf8'),config=require('../account-config.cjs');
let assertions=0;const ok=(condition,message)=>{assert.ok(condition,message);assertions++;};
ok(!config({}).enabled,'Guest installation requires no account configuration');
ok(!config({ORTHODOX_SUPABASE_URL:'http://evil.test',ORTHODOX_SUPABASE_PUBLIC_KEY:'sb_secret_bad'}).enabled,'Invalid origins/secrets rejected');
ok(!config({ORTHODOX_SUPABASE_URL:'https://project.supabase.co',ORTHODOX_SUPABASE_PUBLIC_KEY:'sb_secret_bad'}).enabled,'Secret key rejected');
const jwt=role=>'e30.'+Buffer.from(JSON.stringify({role})).toString('base64url')+'.signature';
ok(!config({ORTHODOX_SUPABASE_URL:'https://project.supabase.co',ORTHODOX_SUPABASE_PUBLIC_KEY:jwt('service_role')}).enabled,'Service-role JWT rejected');
ok(config({ORTHODOX_SUPABASE_URL:'https://project.supabase.co',ORTHODOX_SUPABASE_PUBLIC_KEY:jwt('anon')}).enabled,'Legacy anon key supported');
ok(config({ORTHODOX_SUPABASE_URL:'https://project.supabase.co',ORTHODOX_SUPABASE_PUBLIC_KEY:'sb_publishable_12345678901234567890'}).enabled,'Publishable key supported');
const sql=read('hosting/supabase.sql');for(const table of ['study_state','editor_roles','corrections'])ok(sql.includes('alter table public.'+table+' enable row level security'),'RLS declaration: '+table);
ok(sql.includes('security invoker')&&sql.includes('study_state.revision=expected_revision'),'Atomic expected-revision update declared');
ok(sql.includes("role='reviewer'")&&sql.includes("status<>'reviewed'"),'Review role enforced in policy');
ok(sql.includes('delete from auth.users where id=current_id')&&!sql.includes('delete from auth.users where id=user_id'),'Account deletion targets authenticated identity');
ok(sql.includes('revoke all on function public.delete_own_account() from public,anon'),'Anonymous deletion denied');
const sw=read('dist/sw.js');ok(sw.includes("url.pathname.includes('/api/')")&&sw.includes("request.headers.has('Authorization')"),'Private/API requests excluded from cache');
const storage=()=>{const map=new Map();return {getItem:k=>map.get(k)||null,setItem:(k,v)=>map.set(k,String(v)),removeItem:k=>map.delete(k)};};
async function accountContract(){
 const accountId='aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaaaaa',otherId='bbbbbbbb-bbbb-4bbb-bbbb-bbbbbbbbbbbb';
 const localStorage=storage(),sessionStorage=storage(),token={access_token:'access-fixture',refresh_token:'refresh-fixture',expires_at:Date.now()/1000+3600,user:{id:accountId,email:'reader@example.test'}};sessionStorage.setItem('orthodox-way.session.v1',JSON.stringify(token));
 let remote=null,snapshot={app:'the-orthodox-way',schema:1,state:{notes:{}},studyTools:{}},applied=0,calls=[];
 const response=data=>({ok:true,status:200,text:async()=>JSON.stringify(data),json:async()=>data});
 const context={window:{dispatchEvent:()=>{}},sessionStorage,localStorage,URLSearchParams,AbortController,setTimeout,clearTimeout,CustomEvent:class{},Date,JSON,console,location:{hash:'#/account'},fetch:async(url,options={})=>{calls.push({url,options});if(url==='api/account-config')return response({enabled:true,url:'https://project.supabase.co',publicKey:'public-fixture'});if(url.endsWith('/auth/v1/user'))return response(token.user);if(url.includes('/study_state?')){assert.ok(url.includes(accountId));return response(remote?[remote]:[]);}if(url.endsWith('/rpc/save_study_state')){const body=JSON.parse(options.body);assert.equal(body.expected_revision,remote?.revision||0);remote={payload:body.payload_input,revision:(remote?.revision||0)+1};return response([{revision:remote.revision,conflict:false}]);}throw new Error('Unexpected mock route');}};
 vm.createContext(context);vm.runInContext(read('dist/accounts.js'),context);const api=context.window.OrthodoxAccounts;await api.ready();ok(api.storageKey('progress').endsWith('.account.'+accountId),'Verified account gets separate storage');
 api.connect({snapshot:()=>JSON.parse(JSON.stringify(snapshot)),apply:value=>{snapshot=value;applied++;}});await new Promise(resolve=>setTimeout(resolve,5));
 snapshot.state.notes.first='Private note';api.changed();await api.sync();ok(remote.payload.state.notes.first==='Private note','Dirty local snapshot saved through account API');
 const ownRevision=remote.revision;remote={payload:{app:'the-orthodox-way',schema:1,state:{notes:{remote:'Other device'}},studyTools:{}},revision:ownRevision+1};snapshot.state.notes.first='Local changed';api.changed();await api.sync();ok(api.status().conflict,'Concurrent change detected');ok(remote.payload.state.notes.remote==='Other device'&&snapshot.state.notes.first==='Local changed','Both conflict copies retained');ok(applied===0,'Conflict does not silently overwrite local edits');
 ok(!calls.some(c=>c.url.includes(otherId)),'Account client queries only its verified identity');
 clearTimeout();
}
async function main(){await accountContract();const manifestPath=path.join(root,'dist/offline-manifest.json');if(fs.existsSync(manifestPath)){const manifest=JSON.parse(fs.readFileSync(manifestPath));for(const pack of manifest.packs){ok(pack.files.every(p=>!p.startsWith('api/')&&!p.includes('..')&&fs.existsSync(path.join(root,'dist',p))),'Offline assets exist and are public: '+pack.id);assert.equal(pack.bytes,pack.files.reduce((n,p)=>n+fs.statSync(path.join(root,'dist',p)).size,0));}ok(manifest.packs.length===4,'Four offline collections');}
 const {spawnSync}=require('node:child_process');for(const test of ['account-concurrency-tests.cjs','account-logout-tests.cjs','notebook-validation-tests.cjs','offline-fallback-tests.cjs','account-auth-tests.cjs','netlify-config-tests.cjs']){const result=spawnSync(process.execPath,[path.join(__dirname,test)],{cwd:root,encoding:'utf8'});ok(result.status===0,test+' failed: '+result.stderr+result.stdout);}
 console.log(JSON.stringify({platformContractAssertions:assertions,independentRegressionChecks:6,accountProvider:'controlled responses',liveRLS:'requires configured provider and hosting/verify-live-isolation.cjs',issues:[]},null,2));}
main().catch(error=>{console.error(error);process.exitCode=1;});
