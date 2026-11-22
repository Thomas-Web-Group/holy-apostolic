'use strict';
function accountConfig(env=process.env){
  const url=String(env.ORTHODOX_SUPABASE_URL||'').replace(/\/$/,''),publicKey=String(env.ORTHODOX_SUPABASE_PUBLIC_KEY||'');
  if(!url&&!publicKey)return {enabled:false};
  if(!/^https:\/\/[a-z0-9-]+\.supabase\.co$/i.test(url))return {enabled:false,error:'Account project URL must be an HTTPS Supabase project origin.'};
  let accepted=/^sb_publishable_[A-Za-z0-9_-]{15,}$/.test(publicKey);
  if(publicKey.split('.').length===3){try{accepted=JSON.parse(Buffer.from(publicKey.split('.')[1],'base64url').toString()).role==='anon';}catch{}}
  if(!accepted)return {enabled:false,error:'Use a publishable key or public anon key. Secret and service-role keys are not accepted.'};
  // These are public feature switches, never provider client secrets.
  const providers={google:env.ORTHODOX_AUTH_GOOGLE_ENABLED==='true',facebook:env.ORTHODOX_AUTH_FACEBOOK_ENABLED==='true',apple:env.ORTHODOX_AUTH_APPLE_ENABLED==='true'};
  return {enabled:true,url,publicKey,providers,features:{emailPreferences:true}};
}
module.exports=accountConfig;
