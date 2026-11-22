'use strict';
const fs=require('node:fs'),path=require('node:path'),accountConfig=require('../account-config.cjs');
function headersFor(config){
  const csp="default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; connect-src 'self'"+(config.enabled?' '+config.url:'')+"; font-src 'self'; object-src 'none'; base-uri 'none'; frame-ancestors 'self'; form-action 'self'";
  return '/*\n  Content-Security-Policy: '+csp+'\n  X-Content-Type-Options: nosniff\n  X-Robots-Tag: noindex, nofollow\n  Referrer-Policy: no-referrer\n  Permissions-Policy: camera=(), microphone=(), geolocation=()\n  Cache-Control: public, max-age=0, must-revalidate\n/api/*\n  Cache-Control: no-store\n';
}
function prepare(){
  const config=accountConfig(require('../local-environment.cjs').read());
  if(config.error)throw new Error(config.error);
  fs.writeFileSync(path.join(__dirname,'../dist/_headers'),headersFor(config));
  console.log(config.enabled?'Netlify files prepared. Account configuration contains public values only.':'Netlify files prepared in guest mode. Add the documented public account settings to connect Supabase.');
}
if(require.main===module)(async()=>{await require('./build-pages.cjs').build();require('./build-offline-manifest.cjs');prepare();})().catch(error=>{console.error(error);process.exitCode=1;});
module.exports={headersFor};
