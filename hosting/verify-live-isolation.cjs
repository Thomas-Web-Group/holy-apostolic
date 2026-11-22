'use strict';
// Optional live check: use TWO disposable, verified reader accounts with no study records.
// This also exercises email opt-in/withdrawal; both are left withdrawn. Consent audit
// events remain until the owner deletes these disposable accounts.
// Environment only: ORTHODOX_SUPABASE_URL, ORTHODOX_SUPABASE_PUBLIC_KEY,
// ORTHODOX_TEST_TOKEN_A, ORTHODOX_TEST_TOKEN_B. Tokens are never printed.
const assert=require('node:assert/strict'),config=require('../account-config.cjs')(require('../local-environment.cjs').read());
async function run(){
  assert.ok(config.enabled,'Configure a project public URL/key first.');
  const a=process.env.ORTHODOX_TEST_TOKEN_A,b=process.env.ORTHODOX_TEST_TOKEN_B;
  assert.ok(a&&b,'Two disposable reader account tokens are required.');
  const call=async(token,path,options={})=>{const response=await fetch(config.url+path,{...options,headers:{apikey:config.publicKey,...(token?{Authorization:'Bearer '+token}:{}),'Content-Type':'application/json',...(options.headers||{})}});let data;try{data=await response.json();}catch{data=null;}return {ok:response.ok,status:response.status,data};};
  const A=(await call(a,'/auth/v1/user')).data,B=(await call(b,'/auth/v1/user')).data;
  assert.ok(A?.id&&B?.id&&A.id!==B.id,'Use two distinct verified users.');
  for(const token of [a,b]){const result=await call(token,'/rest/v1/study_state?select=user_id');assert.ok(result.ok);assert.deepEqual(result.data,[],'Test users must have no study records; existing data is never replaced.');}
  try{
    const save=await call(a,'/rest/v1/rpc/save_study_state',{method:'POST',body:JSON.stringify({expected_revision:0,payload_input:{app:'isolation-test',sentinel:'reader-A'}})});assert.ok(save.ok);assert.equal(save.data[0].conflict,false);
    const other=await call(b,'/rest/v1/study_state?select=*&user_id=eq.'+A.id);assert.ok(other.ok);assert.deepEqual(other.data,[]);
    const anon=await call(null,'/rest/v1/study_state?select=*');assert.ok(!anon.ok||anon.data.length===0);
    const write=await call(b,'/rest/v1/study_state?user_id=eq.'+A.id,{method:'PATCH',body:JSON.stringify({payload:{tampered:true}}),headers:{Prefer:'return=representation'}});assert.ok(!write.ok||write.data.length===0);
    const still=await call(a,'/rest/v1/study_state?select=payload');assert.equal(still.data[0].payload.sentinel,'reader-A');
    const stale=await call(a,'/rest/v1/rpc/save_study_state',{method:'POST',body:JSON.stringify({expected_revision:0,payload_input:{tampered:true}})});assert.ok(stale.data[0].conflict);
    const role=await call(b,'/rest/v1/editor_roles',{method:'POST',body:JSON.stringify({user_id:B.id,role:'reviewer'})});assert.ok(!role.ok,'Reader must not assign itself a reviewer role.');
    const consent=await call(a,'/rest/v1/rpc/set_email_preference',{method:'POST',body:JSON.stringify({subscribed_input:true,consent_version_input:'updates-v2',source_input:'account'})});assert.ok(consent.ok);assert.equal(consent.data[0].user_id,A.id);assert.equal(consent.data[0].subscribed,true);
    const otherConsent=await call(b,'/rest/v1/email_preferences?select=*&user_id=eq.'+A.id);assert.ok(otherConsent.ok);assert.deepEqual(otherConsent.data,[]);
    const directConsent=await call(b,'/rest/v1/email_preferences?user_id=eq.'+A.id,{method:'PATCH',body:JSON.stringify({subscribed:false}),headers:{Prefer:'return=representation'}});assert.ok(!directConsent.ok,'Direct consent-table writes must be denied.');
    const anonConsent=await call(null,'/rest/v1/email_preferences?select=*');assert.ok(!anonConsent.ok||anonConsent.data.length===0);
    const withdraw=await call(a,'/rest/v1/rpc/set_email_preference',{method:'POST',body:JSON.stringify({subscribed_input:false,consent_version_input:'updates-v2',source_input:'account'})});assert.ok(withdraw.ok);assert.equal(withdraw.data[0].subscribed,false);
    console.log(JSON.stringify({liveReaderIsolation:'passed',anonymousRead:'denied',crossUserReadWrite:'denied',staleRevision:'rejected',selfRoleEscalation:'denied',emailPreferenceIsolation:'passed',withdrawal:'saved',credentialsPrinted:false}));
  }finally{await call(a,'/rest/v1/study_state?user_id=eq.'+A.id,{method:'DELETE'});for(const token of [a,b])await call(token,'/rest/v1/rpc/set_email_preference',{method:'POST',body:JSON.stringify({subscribed_input:false,consent_version_input:'updates-v2',source_input:'account'})});}
}
run().catch(error=>{console.error(error.message);process.exitCode=1;});
