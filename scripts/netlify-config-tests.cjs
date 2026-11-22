'use strict';
const assert=require('node:assert/strict'),config=require('../account-config.cjs'),{headersFor}=require('./prepare-netlify.cjs'),{handler}=require('../netlify/functions/account-config.cjs');
const base={ORTHODOX_SUPABASE_URL:'https://fixture.supabase.co',ORTHODOX_SUPABASE_PUBLIC_KEY:'sb_publishable_12345678901234567890'};
async function main(){
  const disabled=config(base);assert.equal(disabled.enabled,true);assert.deepEqual(disabled.providers,{google:false,facebook:false,apple:false});
  const enabled=config({...base,ORTHODOX_AUTH_GOOGLE_ENABLED:'true',ORTHODOX_AUTH_FACEBOOK_ENABLED:'true'});assert.deepEqual(enabled.providers,{google:true,facebook:true,apple:false});
  assert.equal(config({...base,ORTHODOX_AUTH_APPLE_ENABLED:'true'}).providers.apple,true);
  assert.equal(config({...base,ORTHODOX_AUTH_GOOGLE_ENABLED:'false'}).providers.google,false);
  assert.ok(headersFor(enabled).includes("connect-src 'self' https://fixture.supabase.co;"));
  assert.ok(!headersFor({enabled:false}).includes('supabase.co'));
  assert.ok(headersFor(enabled).includes('Referrer-Policy: no-referrer'));
  const {parse}=require('../local-environment.cjs');
  assert.deepEqual(parse('# comment\nORTHODOX_SUPABASE_URL="https://fixture.supabase.co" # comment\nORTHODOX_AUTH_APPLE_ENABLED=false\nUNRELATED_SECRET=ignored\n'),{ORTHODOX_SUPABASE_URL:'https://fixture.supabase.co',ORTHODOX_AUTH_APPLE_ENABLED:'false'});
  assert.throws(()=>parse('ORTHODOX_SUPABASE_URL="unterminated'),/quotes/);
  assert.ok(fsRead('../.gitignore').split(/\r?\n/).includes('.env'));
  const names=[...Object.keys(base),'ORTHODOX_AUTH_GOOGLE_ENABLED','ORTHODOX_AUTH_FACEBOOK_ENABLED','ORTHODOX_AUTH_APPLE_ENABLED','UNRELATED_PRIVATE_FIXTURE'];
  const prior=Object.fromEntries(names.map(name=>[name,process.env[name]]));
  try{
    for(const name of names)delete process.env[name];Object.assign(process.env,base,{ORTHODOX_AUTH_GOOGLE_ENABLED:'true',UNRELATED_PRIVATE_FIXTURE:'must-not-leak'});
    const response=await handler({httpMethod:'GET'}),body=JSON.parse(response.body);
    assert.equal(response.statusCode,200);assert.equal(response.headers['Cache-Control'],'no-store');
    assert.equal(body.url,base.ORTHODOX_SUPABASE_URL);assert.equal(body.providers.apple,false);assert.ok(!response.body.includes('must-not-leak'));
    assert.equal((await handler({httpMethod:'POST'})).statusCode,405);
    process.env.ORTHODOX_SUPABASE_PUBLIC_KEY='sb_secret_do_not_serve';
    const invalid=JSON.parse((await handler({httpMethod:'GET'})).body);assert.equal(invalid.enabled,false);assert.ok(!JSON.stringify(invalid).includes('sb_secret_do_not_serve'));
  }finally{for(const [name,value]of Object.entries(prior)){if(value===undefined)delete process.env[name];else process.env[name]=value;}}
  console.log(JSON.stringify({netlifyConfig:'passed',appleDefault:'disabled',secretKeys:'rejected',runtimePrivateValues:'not exposed',liveDeploy:'not performed',issues:[]}));
}
function fsRead(relative){return require('node:fs').readFileSync(require('node:path').join(__dirname,relative),'utf8');}
main().catch(error=>{console.error(error);process.exitCode=1;});
