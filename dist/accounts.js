'use strict';
window.OrthodoxAccounts=(()=>{
  const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const SESSION='orthodox-way.session.v1',ACTOR='orthodox-way.actor.v1',OAUTH='orthodox-way.oauth.pkce.v1',uid=v=>typeof v==='string'&&/^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i.test(v);
  const CONSENT_TEXTS=Object.freeze({'updates-v1':'Email me occasional updates about The Orthodox Way. Optional; you can change this preference anytime.','updates-v2':'Email me occasional updates about Holy Apostolic. Optional; you can change this preference anytime.'});
  const CONSENT_VERSION='updates-v2',CONSENT_TEXT=CONSENT_TEXTS[CONSENT_VERSION];
  let previousActor='';try{previousActor=sessionStorage.getItem(ACTOR)||'';}catch{}
  const actor=globalThis.crypto?.randomUUID?.()||Date.now().toString(36)+'-'+Math.random().toString(36).slice(2);
  let config=null,session=null,bridge=null,initialization=null,cloud=null,conflict=null,busy=false,timer,notice='',offlineIdentity=false,refreshing=null,identityEpoch=0;
  let emailPreference=null,emailLoaded=false,emailBusy=false,emailNotice='';
  try{const saved=JSON.parse(sessionStorage.getItem(SESSION)||'null');if(uid(saved?.user?.id)&&saved.access_token&&saved.refresh_token)session=saved;}catch{}
  const user=()=>session?.user||null;
  const storageKey=key=>user()?key+'.tab.'+actor+'.account.'+user().id:key;
  const metaKey=()=>storageKey('orthodox-way.sync.v1');
  function syncMeta(){try{return JSON.parse(localStorage.getItem(metaKey())||'{}');}catch{return {};}}
  function storeMeta(data){localStorage.setItem(metaKey(),JSON.stringify(data));}
  function clonePreviousCopy(){if(!user())return;try{if(previousActor&&previousActor!==actor){const ending='.tab.'+previousActor+'.account.'+user().id;for(const key of Object.keys(localStorage))if(key.endsWith(ending))localStorage.setItem(key.slice(0,-ending.length)+'.tab.'+actor+'.account.'+user().id,localStorage.getItem(key));}sessionStorage.setItem(ACTOR,actor);}catch{notice='A previous device copy could not be opened. Export stored copies from Account before clearing browser data.';}}
  function storedCopies(){if(!user())return [];const ending='.account.'+user().id,prefix='orthodox-way.sync.v1.tab.';return Object.keys(localStorage).filter(key=>key.startsWith(prefix)&&key.endsWith(ending)&&key!==metaKey()).map(key=>{try{const metadata=JSON.parse(localStorage.getItem(key)),copyActor=key.slice(prefix.length,-ending.length),suffix='.tab.'+copyActor+ending,state=JSON.parse(localStorage.getItem('orthodox-way.progress.v1'+suffix)||'null'),tools=JSON.parse(localStorage.getItem('orthodox-way.study-tools.v1'+suffix)||'null');return state?{actor:copyActor,metadata,payload:{app:'the-orthodox-way',schema:1,state,...(tools?{studyTools:tools}:{})}}:null;}catch{return null;}}).filter(Boolean).sort((a,b)=>String(b.metadata.lastChanged||b.metadata.lastSync||'').localeCompare(String(a.metadata.lastChanged||a.metadata.lastSync||'')));}
  function persistSession(value){if(value&&!value.expires_at)value.expires_at=Math.floor(Date.now()/1000)+Number(value.expires_in||3600);session=value;if(value)sessionStorage.setItem(SESSION,JSON.stringify(value));else sessionStorage.removeItem(SESSION);}
  function publicConfig(value){
    if(!value?.enabled||!/^https:\/\/[a-z0-9-]+\.supabase\.co$/i.test(value.url)||typeof value.publicKey!=='string'||!value.publicKey||value.publicKey.startsWith('sb_secret_'))return null;
    if(value.publicKey.split('.').length===3){try{if(JSON.parse(atob(value.publicKey.split('.')[1].replace(/-/g,'+').replace(/_/g,'/'))).role!=='anon')return null;}catch{return null;}}
    return {enabled:true,url:value.url,publicKey:value.publicKey,providers:{google:value.providers?.google===true,facebook:value.providers?.facebook===true,apple:value.providers?.apple===true},features:{emailPreferences:value.features?.emailPreferences===true}};
  }
  function callbackURL(){const target=new URL(window.OrthodoxSite?location.origin+'/':location.href);target.search='';target.hash='';return target.href;}
  function cleanCallback(){history.replaceState(null,'',window.OrthodoxSite?'/account/':location.pathname+'#/account');}
  function statusChanged(){window.dispatchEvent(new CustomEvent('orthodox-account-status'));}
  // Supabase Auth's documented /authorize and /token PKCE endpoints. The verifier
  // stays in this tab; only its SHA-256 challenge goes into the authorization URL.
  async function startOAuth(provider){
    if(!config?.providers?.[provider]||!['google','facebook','apple'].includes(provider))throw new Error('This sign-in option is not available yet.');
    if(user())throw new Error('Sign out before signing in to another account.');
    if(!globalThis.crypto?.subtle)throw new Error('Social sign-in needs a secure connection.');
    const base64url=bytes=>btoa(String.fromCharCode(...bytes)).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'');
    const verifier=base64url(crypto.getRandomValues(new Uint8Array(64)));
    const digest=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(verifier));
    const pending={verifier,project:config.url,createdAt:Date.now(),provider};
    sessionStorage.setItem(OAUTH,JSON.stringify(pending));
    const authorize=new URL(config.url+'/auth/v1/authorize');
    authorize.searchParams.set('provider',provider);authorize.searchParams.set('redirect_to',callbackURL());
    authorize.searchParams.set('code_challenge',base64url(new Uint8Array(digest)));authorize.searchParams.set('code_challenge_method','s256');
    if(provider==='facebook')authorize.searchParams.set('scopes','email');
    location.assign(authorize.href);
  }
  async function consumeCallback(){
    const query=new URLSearchParams(location.search||''),hash=new URLSearchParams(location.hash.replace(/^#/,''));
    if(query.has('error')||hash.has('error')){sessionStorage.removeItem(OAUTH);cleanCallback();notice='Sign-in was not completed. You can try again or use another sign-in option.';return;}
    if(query.has('code')){
      const code=query.get('code');cleanCallback();let pending;
      try{pending=JSON.parse(sessionStorage.getItem(OAUTH)||'null');}catch{}
      sessionStorage.removeItem(OAUTH);
      if(!pending||pending.project!==config.url||!['google','facebook','apple'].includes(pending.provider)||!config.providers[pending.provider]||typeof pending.verifier!=='string'||!/^[-_A-Za-z0-9]{43,128}$/.test(pending.verifier)||!Number.isFinite(pending.createdAt)||Date.now()-pending.createdAt>1800000||pending.createdAt>Date.now()+60000){notice='This sign-in attempt has expired or was opened in a different tab. Start sign-in again here.';return;}
      try{
        const next=await request('/auth/v1/token?grant_type=pkce',{method:'POST',body:{auth_code:code,code_verifier:pending.verifier},auth:false});
        if(!next?.access_token||!next.refresh_token||!uid(next.user?.id))throw new Error('Sign-in could not be verified. Try again.');
        persistSession(next);sessionStorage.removeItem('orthodox-way.recovery');
      }catch(error){notice=error.message;}
      return;
    }
    // Email confirmation and recovery links retain Supabase's email-link flow.
    if(hash.has('access_token')){
      const token=hash.get('access_token'),refreshToken=hash.get('refresh_token'),type=hash.get('type');cleanCallback();
      try{
        if(!['signup','recovery','invite','magiclink','email_change'].includes(type))throw new Error('Start social sign-in from the Account page.');
        const response=await fetch(config.url+'/auth/v1/user',{headers:{apikey:config.publicKey,Authorization:'Bearer '+token}});
        if(!response.ok)throw new Error('The email link is no longer valid. Request a new link.');
        const identity=await response.json();if(!uid(identity.id)||!refreshToken)throw new Error('Incomplete email link.');
        persistSession({access_token:token,refresh_token:refreshToken,expires_at:Math.floor(Date.now()/1000)+Number(hash.get('expires_in')||3600),user:identity});
        sessionStorage.setItem('orthodox-way.recovery',type==='recovery'?'1':'0');
        if(type==='recovery')notice='Choose a new password below.';
      }catch(error){notice=error.message;}
    }
  }
  async function request(path,{method='GET',body,auth=true,headers={}}={}){
    if(!config)throw new Error('Accounts are not configured for this edition.');
    const controller=new AbortController(),timeout=setTimeout(()=>controller.abort(),12000);
    try{const response=await fetch(config.url+path,{method,headers:{apikey:config.publicKey,...(auth&&session?{Authorization:'Bearer '+session.access_token}:{}),...(body?{'Content-Type':'application/json'}:{}),...headers},...(body?{body:JSON.stringify(body)}:{}),signal:controller.signal});let data=null;const text=await response.text();try{data=text?JSON.parse(text):null;}catch{}
      if(!response.ok){const error=new Error(data?.msg||data?.error_description||data?.message||'The account service could not complete this request.');error.status=response.status;throw error;}return data;
    }catch(error){if(error.name==='AbortError'||error instanceof TypeError)throw new Error('The account service is unavailable. Your local data is retained.');throw error;}finally{clearTimeout(timeout);}
  }
  async function refresh(){if(!session)return;if((session.expires_at||0)>Date.now()/1000+90)return;if(refreshing)return refreshing;refreshing=(async()=>{const old=session,epoch=identityEpoch;const next=await request('/auth/v1/token?grant_type=refresh_token',{method:'POST',body:{refresh_token:old.refresh_token},auth:false});if(epoch!==identityEpoch||!session)return;if(next?.user?.id!==old.user.id)throw new Error('Account identity did not match. Sign in again.');persistSession(next);})();try{await refreshing;}finally{refreshing=null;}}
  async function ready(){if(initialization)return initialization;initialization=(async()=>{
    try{const response=await fetch(window.OrthodoxSite?'/api/account-config':'api/account-config',{cache:'no-store'});if(!response.ok)throw new Error('Configuration unavailable');config=publicConfig(await response.json());if(config)localStorage.setItem('orthodox-way.public-account-config',JSON.stringify(config));else localStorage.removeItem('orthodox-way.public-account-config');}catch{try{config=publicConfig(JSON.parse(localStorage.getItem('orthodox-way.public-account-config')||'null'));}catch{}}
    if(!config){if(session)persistSession(null);return;}
    await consumeCallback();
    if(session){try{await refresh();const verified=await request('/auth/v1/user');if(verified?.id!==session.user.id)throw new Error('Account identity did not match.');session.user=verified;persistSession(session);}catch(error){if(error.status===401||error.status===403){persistSession(null);notice='Your session has ended. Sign in again.';}else{offlineIdentity=true;notice='Offline account copy. Synchronization requires a verified connection.';}}}clonePreviousCopy();
  })();return initialization;}
  async function setEmailPreference(subscribed,source='account',version=CONSENT_VERSION){
    if(typeof version!=='string'||!Object.prototype.hasOwnProperty.call(CONSENT_TEXTS,version))throw new Error('Unsupported email preference version.');
    if(!user()||!config?.features?.emailPreferences)throw new Error('Email preferences are not connected yet.');
    const epoch=identityEpoch;await refresh();if(epoch!==identityEpoch||!user())return;
    const result=await request('/rest/v1/rpc/set_email_preference',{method:'POST',body:{subscribed_input:Boolean(subscribed),consent_version_input:version,source_input:source}});
    if(epoch!==identityEpoch||!user())return;
    const saved=Array.isArray(result)?result[0]:result;
    if(saved?.user_id!==user().id||typeof saved.subscribed!=='boolean')throw new Error('The email preference could not be confirmed. Try again.');
    emailPreference=saved;emailLoaded=true;emailNotice=saved.subscribed?'Email updates are enabled.':'Email updates are off.';statusChanged();
    return saved;
  }
  async function loadEmailPreference(){
    if(emailBusy||!user()||!config?.features?.emailPreferences)return;
    const epoch=identityEpoch;emailBusy=true;emailNotice='';
    try{
      await refresh();if(epoch!==identityEpoch||!user())return;const rows=await request('/rest/v1/email_preferences?select=*&user_id=eq.'+user().id);
      if(epoch!==identityEpoch||!user())return;
      if(!Array.isArray(rows)||rows.length>1||rows.some(row=>row.user_id!==user().id||typeof row.subscribed!=='boolean'))throw new Error('The email preference could not be read.');
      emailPreference=rows[0]||null;emailLoaded=true;
      // Signup metadata transports the explicit checkbox choice across verification
      // and devices; it grants no role or permission. The verified RPC records it.
      const intent=user().user_metadata?.orthodox_way_email_updates;
      if(!emailPreference&&typeof intent?.version==='string'&&Object.prototype.hasOwnProperty.call(CONSENT_TEXTS,intent.version)&&typeof intent.subscribed==='boolean')await setEmailPreference(intent.subscribed,'signup',intent.version);
    }catch(error){emailNotice=error.message;}finally{emailBusy=false;statusChanged();}
  }
  function connect(value){bridge=value;if(user()&&!offlineIdentity)sync(false).catch(()=>{});}
  function changed(){if(!user())return;const meta=syncMeta();storeMeta({...meta,dirty:true,lastChanged:new Date().toISOString()});clearTimeout(timer);statusChanged();if(!conflict)timer=setTimeout(()=>sync(false).catch(()=>{}),2500);}
  async function sync(forceLocal=false){
    if(!user()||!bridge||busy)return;clearTimeout(timer);busy=true;const epoch=identityEpoch;let failed=false;statusChanged();
    try{await refresh();if(epoch!==identityEpoch||!user())return;const remote=await request('/rest/v1/study_state?select=payload,revision,updated_at&user_id=eq.'+encodeURIComponent(user().id));if(epoch!==identityEpoch||!user())return;cloud=remote?.[0]||null;const meta=syncMeta(),revision=cloud?.revision||0;
      if(cloud&&meta.dirty&&Number(meta.revision||0)!==revision&&(!forceLocal||!conflict||Number(conflict.revision)!==revision)){conflict=cloud;notice='Another saved version exists. Review both copies on the Account page.';return;}
      if(meta.dirty){const snapshot=bridge.snapshot();const result=await request('/rest/v1/rpc/save_study_state',{method:'POST',body:{expected_revision:revision,payload_input:snapshot}});if(epoch!==identityEpoch||!user())return;const saved=result?.[0]||result;if(!saved||saved.conflict){const latest=await request('/rest/v1/study_state?select=payload,revision,updated_at&user_id=eq.'+encodeURIComponent(user().id));if(epoch!==identityEpoch||!user())return;conflict=latest[0];notice='Your data changed on another device. Both copies have been retained.';return;}storeMeta({revision:saved.revision,dirty:JSON.stringify(snapshot)!==JSON.stringify(bridge.snapshot()),lastSync:new Date().toISOString()});notice='Saved to your account.';}
      else if(cloud&&Number(meta.revision||0)!==revision){bridge.apply(cloud.payload);storeMeta({revision,dirty:false,lastSync:new Date().toISOString()});notice='Account data downloaded.';}
      else{storeMeta({...meta,revision,lastSync:new Date().toISOString()});notice=cloud?'Account is up to date.':'Account is ready. Import this browser’s guest data if wanted.';}
      offlineIdentity=false;conflict=null;
    }catch(error){failed=true;notice=error.message;throw error;}finally{busy=false;statusChanged();if(epoch===identityEpoch&&user()&&syncMeta().dirty&&!conflict&&typeof window.addEventListener==='function'&&globalThis.navigator?.onLine!==false)timer=setTimeout(()=>sync(false).catch(()=>{}),failed?30000:2500);}
  }
  function download(data,name){const link=document.createElement('a'),url=URL.createObjectURL(new Blob([JSON.stringify(data,null,2)],{type:'application/json'}));link.href=url;link.download=name;link.click();setTimeout(()=>URL.revokeObjectURL(url),1000);}
  async function logout(){identityEpoch++;clearTimeout(timer);try{await request('/auth/v1/logout',{method:'POST'});}catch{}persistSession(null);sessionStorage.removeItem(OAUTH);location.hash='/account';location.reload();}
  async function clearCacheLogout(){if(!user())return;identityEpoch++;const accountId=user().id;clearTimeout(timer);bridge?.discard?.();try{await request('/auth/v1/logout',{method:'POST'});}catch{}for(const key of Object.keys(localStorage))if(key.endsWith('.account.'+accountId))localStorage.removeItem(key);persistSession(null);location.hash='/account';location.reload();}
  async function roles(){if(!user())return [];try{await refresh();return (await request('/rest/v1/editor_roles?select=role&user_id=eq.'+user().id)).map(r=>r.role);}catch{return [];}}
  async function reports(action,data){await refresh();if(action==='list')return request('/rest/v1/corrections?select=*&order=created_at.desc&limit=250');if(action==='submit')return request('/rest/v1/corrections',{method:'POST',body:{user_id:user().id,...data},headers:{Prefer:'return=representation'}});if(action==='update')return request('/rest/v1/corrections?id=eq.'+data.id,{method:'PATCH',body:{status:data.status,review_note:data.review_note},headers:{Prefer:'return=representation'}});}
  function mount({root,params=new URLSearchParams()}){
    const abort=new AbortController();
    let mode=params.get('mode')==='signup'?'signup':'login',email='',signupUpdates=false,operation=false,lastEmailRender='';
    const on=(event,fn)=>root.addEventListener(event,fn,{signal:abort.signal});
    const consentCheckbox=(name,checked=false,disabled=false)=>'<label class="account-checkbox"><input type="checkbox" name="'+name+'"'+(checked?' checked':'')+(disabled?' disabled':'')+'><span>'+esc(CONSENT_TEXT)+'</span></label>';
    const emailState=()=>JSON.stringify({emailPreference,emailLoaded,emailBusy,emailNotice});
    function emailPanel(){
      if(!config?.features?.emailPreferences)return '';
      return '<h2>Email updates</h2><p>Your choice does not affect access to the learning library or saved progress.</p>'+
        '<p role="status">'+esc(emailNotice||(!emailLoaded?'Loading your email preference…':!emailPreference?'You have not subscribed to email updates.':emailPreference.subscribed?'Email updates are enabled.':'Email updates are off.'))+'</p>'+
        '<form id="account-email">'+consentCheckbox('updates',emailPreference?.subscribed===true,!emailLoaded||emailBusy)+
        '<div class="tool-actions"><button type="submit" class="primary"'+(!emailLoaded||emailBusy?' disabled':'')+'>Save email preference</button>'+
        (!emailPreference&&emailLoaded?'<button type="button" data-account="email-decline" class="secondary">Not now</button>':'')+
        (!emailLoaded&&!emailBusy?'<button type="button" data-account="email-retry" class="secondary">Try again</button>':'')+'</div></form>';
    }
    function signedOut(){
      const connected=Boolean(config),creating=mode==='signup';
      return (!connected?'<section class="setting-panel account-setup"><h2>Accounts are not enabled yet</h2><p>You can keep reading and saving progress on this device. Export a backup in Settings.</p><a href="#/settings">Settings and backups</a></section>':'')+
        '<section class="setting-panel account-access"><h2>'+(!connected?'Sign-in options':creating?'Create an account':'Sign in')+'</h2>'+
        '<div class="account-providers">'+[['google','Google'],['facebook','Facebook'],['apple','Apple']].map(([id,label])=>'<button type="button" data-provider="'+id+'" class="account-provider"'+(!config?.providers[id]?' disabled':'')+'>Continue with '+label+'</button>').join('')+'</div>'+
        '<p class="account-provider-note">'+(!connected?'Sign-in will become available when accounts are connected.':!config.providers.apple?'Apple sign-in is not available yet.':'Choose a sign-in option or use your email below.')+'</p>'+
        '<div class="tool-tabs account-mode"><button type="button" data-auth-mode="login" aria-pressed="'+!creating+'">Sign in with email</button><button type="button" data-auth-mode="signup" aria-pressed="'+creating+'">Create an account</button></div>'+
        '<form id="account-login"><fieldset'+(!connected?' disabled':'')+'><legend class="sr-only">'+(creating?'Create an account':'Sign in with email')+'</legend>'+
        '<label for="account-email-address">Email</label><input id="account-email-address" type="email" name="email" value="'+esc(email)+'" autocomplete="email" required maxlength="254">'+
        '<label for="account-password-input">Password'+(creating?' <span class="account-input-help">(at least 10 characters)</span>':'')+'</label><input id="account-password-input" type="password" name="password" autocomplete="'+(creating?'new-password':'current-password')+'"'+(creating?' minlength="10"':'')+' maxlength="128" required>'+
        (creating?consentCheckbox('updates',signupUpdates):'')+
        '<div class="tool-actions"><button type="submit" value="'+mode+'" class="primary">'+(creating?'Create account':'Sign in')+'</button>'+
        (!creating?'<button type="submit" value="recover" class="text-button" formnovalidate>Reset password</button><button type="submit" value="resend" class="text-button" formnovalidate>Resend verification</button>':'')+'</div></fieldset></form>'+
        '<p>After signing in, you can choose to import this device’s guest progress and notes.</p><p><a href="#/home">Continue without an account</a></p></section>';
    }
    function signedIn(u,meta){
      let recovery=false;try{recovery=sessionStorage.getItem('orthodox-way.recovery')==='1';}catch{}
      return '<section class="setting-panel"><h2>'+esc(u.email||'Signed in')+'</h2><p id="account-sync-meta">'+esc(meta.lastSync?'Last synchronized: '+new Date(meta.lastSync).toLocaleString():'Not yet synchronized')+'</p><p id="account-sync-pending">'+esc(meta.dirty?'Local changes are waiting to synchronize.':'Your account copy is saved on this device.')+'</p>'+
        '<div class="tool-actions"><button data-account="sync" class="primary">Synchronize now</button><button data-account="import" class="secondary">Import guest progress</button><button data-account="signout" class="secondary">Sign out</button></div>'+
        '<p>Account data is also saved on this device for offline reading. Use your own browser profile for private notes.</p>'+
        '<details'+(recovery?' open':'')+'><summary>Change password</summary><form id="account-password"><label for="account-new-password">New password (at least 10 characters)</label><input id="account-new-password" name="password" type="password" minlength="10" maxlength="128" autocomplete="new-password" required><button type="submit" class="secondary">Update password</button></form></details></section>'+
        (config?.features?.emailPreferences?'<section class="setting-panel" id="account-email-panel">'+emailPanel()+'</section>':'')+
        (conflict?'<section class="setting-panel account-conflict"><h2>Two saved versions</h2><p>Your local changes and the other device’s saved version are both retained. Export them before choosing which should become current.</p><div class="tool-actions"><button data-account="export-local">Export local copy</button><button data-account="export-remote">Export account copy</button><button data-account="remote">Use account copy</button><button data-account="local">Use this device’s copy</button></div></section>':'')+
        '<section class="setting-panel"><details><summary>Stored device copies</summary><p>Each open page keeps its own copy to protect concurrent edits. Export older copies here and restore them through Settings if needed.</p>'+storedCopies().map(copy=>'<p>'+esc(copy.metadata.lastChanged||copy.metadata.lastSync||'Date not recorded')+' · '+(copy.metadata.dirty?'Changes were pending when saved':'Stored copy')+' <button data-export-copy="'+esc(copy.actor)+'">Export copy</button></p>').join('')+
        '<button data-account="clear-cache" class="secondary">Remove account caches and sign out</button><p>This removes this account’s copies from this browser. Export unsynchronized copies first. Synchronized account data remains.</p></details></section>'+
        '<section class="setting-panel"><details><summary>Delete account</summary><p>Delete your synchronized study data, email preference, and account. Export a backup first. Guest data is separate.</p><label for="delete-account-confirm">Type DELETE to confirm</label><input id="delete-account-confirm" autocomplete="off"><button data-account="delete" class="secondary">Delete account</button></details></section>';
    }
    function draw(){
      const u=user(),meta=syncMeta();
      root.innerHTML='<h1>Account</h1><p class="account-status notice" id="account-sync-status" role="status" aria-live="polite"'+(!notice?' hidden':'')+'>'+esc(notice)+'</p>'+(u?signedIn(u,meta):signedOut())+'<p><a href="#/privacy">Privacy and saved data</a></p>';
      lastEmailRender=emailState();
    }
    function updateStatus(){
      if(!root.isConnected)return;
      const status=root.querySelector('#account-sync-status');if(status){status.textContent=notice;status.hidden=!notice;}
      const meta=syncMeta(),pending=root.querySelector('#account-sync-pending'),saved=root.querySelector('#account-sync-meta');
      if(pending)pending.textContent=busy?'Saving account progress…':meta.dirty?'Local changes are waiting to synchronize.':'Your account copy is saved on this device.';
      if(saved)saved.textContent=meta.lastSync?'Last synchronized: '+new Date(meta.lastSync).toLocaleString():'Not yet synchronized';
      const panel=root.querySelector('#account-email-panel');if(panel&&lastEmailRender!==emailState()){panel.innerHTML=emailPanel();lastEmailRender=emailState();}
      if(conflict&&!root.querySelector('.account-conflict'))draw();
    }
    draw();
    if(typeof window.addEventListener==='function')window.addEventListener('orthodox-account-status',updateStatus,{signal:abort.signal});
    if(user()&&!emailLoaded&&config?.features?.emailPreferences)loadEmailPreference();
    on('submit',async event=>{
      if(!['account-login','account-password','account-email'].includes(event.target.id))return;
      event.preventDefault();if(operation)return;operation=true;
      const form=event.target,button=event.submitter;
      if(button)button.disabled=true;
      try{
        if(form.id==='account-email'){await setEmailPreference(form.elements.updates.checked);draw();return;}
        if(form.id==='account-password'){await refresh();await request('/auth/v1/user',{method:'PUT',body:{password:form.elements.password.value}});sessionStorage.removeItem('orthodox-way.recovery');notice='Password updated.';draw();return;}
        email=form.elements.email.value.trim();const password=form.elements.password.value,action=button?.value||mode;
        if(!email||!form.elements.email.checkValidity())throw new Error('Enter a valid email address.');
        const redirect='?redirect_to='+encodeURIComponent(callbackURL());
        if(action==='recover'){await request('/auth/v1/recover'+redirect,{method:'POST',body:{email},auth:false});notice='If this address has an account, a recovery email will arrive.';draw();return;}
        if(action==='resend'){await request('/auth/v1/resend'+redirect,{method:'POST',body:{type:'signup',email},auth:false});notice='If verification is needed, an email will arrive.';draw();return;}
        signupUpdates=form.elements.updates?.checked===true;
        const body={email,password};if(action==='signup')body.data={orthodox_way_email_updates:{subscribed:signupUpdates,version:CONSENT_VERSION}};
        const result=await request(action==='signup'?'/auth/v1/signup'+redirect:'/auth/v1/token?grant_type=password',{method:'POST',body,auth:false});
        if(result?.access_token&&result.refresh_token&&uid(result.user?.id)){persistSession(result);location.hash='/account';location.reload();}
        else{notice='Check your email to verify your account, then sign in.';mode='login';draw();}
      }catch(error){if(form.id==='account-email')emailNotice=error.message;else notice=error.message;draw();}
      finally{operation=false;if(button?.isConnected)button.disabled=false;}
    });
    on('click',async event=>{
      const modeButton=event.target.closest('[data-auth-mode]');
      if(modeButton&&!operation){const form=root.querySelector('#account-login');email=form?.elements.email.value||email;signupUpdates=form?.elements.updates?.checked??signupUpdates;mode=modeButton.dataset.authMode;notice='';draw();return;}
      const providerButton=event.target.closest('[data-provider]');
      if(providerButton&&!providerButton.disabled&&!operation){operation=true;providerButton.disabled=true;try{await startOAuth(providerButton.dataset.provider);}catch(error){notice=error.message;operation=false;draw();}return;}
      const exportCopy=event.target.closest('[data-export-copy]');
      if(exportCopy){const copy=storedCopies().find(c=>c.actor===exportCopy.dataset.exportCopy);if(copy)download(copy.payload,'holy-apostolic-stored-device-copy.json');return;}
      const button=event.target.closest('[data-account]');if(!button||operation)return;operation=true;button.disabled=true;
      try{
        const action=button.dataset.account;
        if(action==='email-retry'){await loadEmailPreference();return;}
        if(action==='email-decline'){await setEmailPreference(false);return;}
        if(action==='clear-cache'){if(confirm('Remove all cached copies for this account in this browser and sign out? Export needed unsynchronized copies first.'))await clearCacheLogout();return;}
        if(action==='signout'){await logout();return;}
        if(action==='sync')await sync();
        if(action==='import'){if(!confirm('Import guest progress and notebook into this account on this device? Conflicting text will be retained as separate notes.'))return;bridge.importGuest();changed();notice='Guest data imported. Saving it to your account…';await sync();}
        if(action==='export-local')download(bridge.snapshot(),'holy-apostolic-local-copy.json');
        if(action==='export-remote')download(conflict.payload,'holy-apostolic-account-copy.json');
        if(action==='remote'){if(!confirm('Replace this device’s account copy with the other saved version? Export the local copy first if needed.'))return;bridge.apply(conflict.payload);storeMeta({revision:conflict.revision,dirty:false,lastSync:new Date().toISOString()});conflict=null;notice='Account copy loaded.';}
        if(action==='local'){if(!confirm('Save this device’s copy in place of the other account version?'))return;await sync(true);}
        if(action==='delete'){
          if(root.querySelector('#delete-account-confirm').value!=='DELETE')throw new Error('Type DELETE to confirm account deletion.');
          identityEpoch++;clearTimeout(timer);await refresh();await request('/rest/v1/rpc/delete_own_account',{method:'POST',body:{}});bridge?.discard?.();
          for(const key of Object.keys(localStorage))if(key.endsWith('.account.'+user().id))localStorage.removeItem(key);
          persistSession(null);sessionStorage.removeItem(OAUTH);location.reload();return;
        }
      }catch(error){notice=error.message;}
      finally{operation=false;if(root.isConnected)draw();}
    });
    return ()=>abort.abort();
  }
  if(typeof window.addEventListener==='function')for(const event of ['online','focus'])window.addEventListener(event,()=>{if(globalThis.document?.visibilityState!=='hidden')sync(false).catch(()=>{});});
  return {ready,connect,storageKey,user,changed,sync,roles,reports,mount,clearCacheLogout,startOAuth,loadEmailPreference,setEmailPreference,configured:()=>Boolean(config),status:()=>({notice,busy,conflict:Boolean(conflict),offlineIdentity,dirty:Boolean(syncMeta().dirty),lastSync:syncMeta().lastSync||null}),download};
})();
