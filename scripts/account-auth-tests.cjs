'use strict';
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict'),{webcrypto,createHash}=require('node:crypto');
const source=fs.readFileSync(path.join(__dirname,'../dist/accounts.js'),'utf8'),uid='aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaaaaa',other='bbbbbbbb-bbbb-4bbb-bbbb-bbbbbbbbbbbb',origin='https://fixture.supabase.co';
const clone=value=>JSON.parse(JSON.stringify(value));
const store=map=>new Proxy({getItem:key=>map.get(key)||null,setItem:(key,value)=>map.set(key,String(value)),removeItem:key=>map.delete(key)},{ownKeys:()=>[...map.keys()],getOwnPropertyDescriptor:()=>({enumerable:true,configurable:true})});
function setup({tokens=new Map(),local=new Map(),search='',hash='#/account',metadata={},preference=null,pending,providerOverrides={},tokenResponse}={}){
  if(pending)tokens.set('orthodox-way.oauth.pkce.v1',JSON.stringify(pending));
  const calls=[],redirects=[],history=[],user={id:uid,email:'reader@example.test',email_confirmed_at:'2026-11-20T00:00:00Z',user_metadata:metadata};
  let savedPreference=preference,remote=null,unavailable=false;
  const session={access_token:'fixture-access',refresh_token:'fixture-refresh',expires_in:3600,user};
  const context={console,crypto:webcrypto,TextEncoder,URL,URLSearchParams,AbortController,CustomEvent:class{},Date,JSON,Error,TypeError,encodeURIComponent,localStorage:store(local),sessionStorage:store(tokens),btoa:text=>Buffer.from(text,'binary').toString('base64'),atob:text=>Buffer.from(text,'base64').toString('binary'),setTimeout:()=>1,clearTimeout(){},location:{href:'https://orthodox.example/'+search+hash,origin:'https://orthodox.example',pathname:'/',search,hash,assign:url=>redirects.push(url),reload(){}},history:{replaceState:(_state,_title,url)=>{history.push(url);context.location.search='';context.location.hash='#/account';}},fetch:async(url,options={})=>{
    const response=(data,status=200)=>({ok:status>=200&&status<300,status,json:async()=>clone(data),text:async()=>JSON.stringify(data)});
    calls.push({url,options});
    if(url==='api/account-config')return response({enabled:true,url:origin,publicKey:'public-fixture',providers:{google:true,facebook:true,apple:false,...providerOverrides},features:{emailPreferences:true}});
    if(url.endsWith('/token?grant_type=pkce'))return response(tokenResponse||session);
    if(url.endsWith('/auth/v1/user'))return response(user);
    if(url.endsWith('/auth/v1/logout'))return response({});
    if(url.includes('/email_preferences?'))return response(savedPreference?[savedPreference]:[]);
    if(url.endsWith('/rpc/set_email_preference')){
      assert.equal(options.headers.Authorization,'Bearer fixture-access');
      const body=JSON.parse(options.body);assert.deepEqual(Object.keys(body).sort(),['consent_version_input','source_input','subscribed_input']);
      assert.ok(['updates-v1','updates-v2'].includes(body.consent_version_input));assert.equal(typeof body.subscribed_input,'boolean');
      savedPreference={user_id:uid,subscribed:body.subscribed_input,consent_version:body.consent_version_input,updated_at:'2026-11-20T00:00:00Z'};return response([savedPreference]);
    }
    if(url.includes('/study_state?')){if(unavailable)return response({message:'Connection fixture unavailable'},503);return response(remote?[remote]:[]);}
    if(url.endsWith('/rpc/save_study_state')){const body=JSON.parse(options.body);remote={payload:body.payload_input,revision:(remote?.revision||0)+1};return response([{revision:remote.revision,conflict:false}]);}
    throw new Error('Unexpected fixture path '+url);
  }};context.window=context;context.dispatchEvent=()=>{};
  vm.createContext(context);vm.runInContext(source,context);
  return {api:context.OrthodoxAccounts,context,calls,redirects,history,tokens,local,session,preference:()=>savedPreference,remote:()=>remote,setUnavailable:value=>{unavailable=value;}};
}
let checks=0;const ok=(value,message)=>{assert.ok(value,message);checks++;};
async function main(){
  const initial=setup();await initial.api.ready();await initial.api.startOAuth('google');
  const url=new URL(initial.redirects[0]),pending=JSON.parse(initial.tokens.get('orthodox-way.oauth.pkce.v1'));
  ok(url.origin===origin&&url.pathname==='/auth/v1/authorize','OAuth redirects only to the configured Supabase service');
  ok(url.searchParams.get('provider')==='google'&&url.searchParams.get('redirect_to')==='https://orthodox.example/','Provider and callback use the current app origin');
  ok(url.searchParams.get('code_challenge_method')==='s256','SHA-256 PKCE required');
  ok(url.searchParams.get('code_challenge')===createHash('sha256').update(pending.verifier).digest('base64url'),'Challenge independently matches the random verifier');
  ok(!url.href.includes(pending.verifier),'Verifier is never included in the redirect');
  await assert.rejects(initial.api.startOAuth('apple'),/not available/);checks++;
  await initial.api.startOAuth('facebook');ok(new URL(initial.redirects[1]).searchParams.get('scopes')==='email','Facebook requests the account email scope');
  const expected=JSON.parse(initial.tokens.get('orthodox-way.oauth.pkce.v1')).verifier;
  const callback=setup({tokens:initial.tokens,search:'?code=fixture-code'});await callback.api.ready();
  ok(callback.api.user().id===uid,'PKCE callback establishes a verified session');
  const exchange=callback.calls.find(call=>call.url.endsWith('grant_type=pkce'));
  ok(JSON.parse(exchange.options.body).code_verifier===expected,'Code exchange uses the tab-bound verifier');
  ok(!callback.tokens.has('orthodox-way.oauth.pkce.v1')&&callback.history[0]==='/#/account','Code and verifier are removed after callback');
  const replay=setup({tokens:initial.tokens,search:'?code=replayed'});await replay.api.ready();ok(!replay.calls.some(call=>call.url.endsWith('grant_type=pkce')),'Callback cannot replay without its pending verifier');
  for(const bad of [{...pending,createdAt:Date.now()-1800001},{...pending,project:'https://other.supabase.co'},{...pending,verifier:'bad'}]){
    const invalid=setup({search:'?code=untrusted',pending:bad});await invalid.api.ready();ok(invalid.api.user()===null&&!invalid.calls.some(call=>call.url.endsWith('grant_type=pkce')),'Expired, wrong-project and malformed callbacks are rejected');
  }
  const cancelled=setup({search:'?error=access_denied&error_description=untrusted',pending});await cancelled.api.ready();ok(cancelled.api.user()===null&&!cancelled.tokens.has('orthodox-way.oauth.pkce.v1'),'Cancelled sign-in clears pending state');
  const disabled=setup({providerOverrides:{google:false}});await disabled.api.ready();await assert.rejects(disabled.api.startOAuth('google'),/not available/);checks++;
  const fragment=setup({hash:'#access_token=forged&refresh_token=forged&type=bearer'});await fragment.api.ready();ok(fragment.api.user()===null,'Unsolicited social fragment is rejected');
  const invalidResult=setup({search:'?code=fixture',pending,tokenResponse:{access_token:'access',user:{id:other}}});await invalidResult.api.ready();ok(invalidResult.api.user()===null,'Incomplete token responses are rejected');
  const email=setup();email.tokens.set('orthodox-way.session.v1',JSON.stringify({...email.session,expires_at:Date.now()/1000+3600}));
  const reader=setup({tokens:email.tokens,local:new Map([['orthodox-way.progress.v1','guest fixture']])});await reader.api.ready();await reader.api.loadEmailPreference();
  ok(reader.preference()===null,'New social sign-in does not silently subscribe');
  await reader.api.setEmailPreference(true);ok(reader.preference().subscribed===true,'Explicit opt-in is saved');
  ok(reader.preference().consent_version==='updates-v2','New Holy Apostolic choices use their new wording version');
  await reader.api.setEmailPreference(false);ok(reader.preference().subscribed===false,'Withdrawal is saved');
  ok(reader.local.get('orthodox-way.progress.v1')==='guest fixture','Consent changes preserve guest progress');
  const intent=setup({tokens:email.tokens,metadata:{orthodox_way_email_updates:{version:'updates-v1',subscribed:true}}});await intent.api.ready();await intent.api.loadEmailPreference();
  ok(intent.preference()?.subscribed===true,'Explicit signup intent survives email verification');
  ok(intent.preference().consent_version==='updates-v1','An older signup intent retains the wording version actually chosen');
  const newIntent=setup({tokens:email.tokens,metadata:{orthodox_way_email_updates:{version:'updates-v2',subscribed:true}}});await newIntent.api.ready();await newIntent.api.loadEmailPreference();
  ok(newIntent.preference()?.consent_version==='updates-v2','A current signup intent retains the new wording version');
  const malformedIntent=setup({tokens:email.tokens,metadata:{orthodox_way_email_updates:{version:['updates-v1'],subscribed:true}}});await malformedIntent.api.ready();await malformedIntent.api.loadEmailPreference();
  ok(malformedIntent.preference()===null,'Malformed version metadata cannot silently subscribe');
  await assert.rejects(reader.api.setEmailPreference(true,'account','unsupported'),/Unsupported/);checks++;
  const withdrawal=setup({tokens:email.tokens,preference:{user_id:uid,subscribed:false},metadata:{orthodox_way_email_updates:{version:'updates-v1',subscribed:true}}});await withdrawal.api.ready();await withdrawal.api.loadEmailPreference();
  ok(withdrawal.preference().subscribed===false&&!withdrawal.calls.some(call=>call.url.endsWith('/rpc/set_email_preference')),'Older signup intent cannot undo withdrawal');
  let state={app:'the-orthodox-way',schema:1,state:{notes:{lesson:'Pending offline note'}}};
  reader.setUnavailable(true);reader.api.connect({snapshot:()=>clone(state),apply:value=>{state=clone(value);}});await new Promise(resolve=>setImmediate(resolve));reader.api.changed();
  await assert.rejects(reader.api.sync(),/unavailable/);ok(reader.api.status().dirty&&state.state.notes.lesson==='Pending offline note','Failed saves retain pending edits');
  reader.setUnavailable(false);await reader.api.sync();ok(!reader.api.status().dirty&&reader.remote().payload.state.notes.lesson==='Pending offline note','Retry saves retained edits');
  const sql=fs.readFileSync(path.join(__dirname,'../hosting/email-preferences.sql'),'utf8');
  ok(sql.includes('auth.uid()')&&sql.includes('email_confirmed_at is not null'),'Consent identity and verified email are derived on the server');
  ok(!/grant\s+(?:all|insert|update|delete).*email_preferences.*to authenticated/i.test(sql),'Direct browser writes to consent records are denied');
  ok(sql.includes('on delete cascade')&&sql.includes('email_consent_events'),'Consent is auditable and removed with the account');
  console.log(JSON.stringify({authenticationAndConsentChecks:checks,provider:'controlled responses',liveProviderSetup:'pending',issues:[]},null,2));
}
main().catch(error=>{console.error(error);process.exitCode=1;});
