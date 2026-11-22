'use strict';
// Local-only static server. No user notes or progress are stored by this process.
const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const {execFile} = require('node:child_process');
const accountConfig = require('./account-config.cjs')(require('./local-environment.cjs').read());
const HOST='127.0.0.1', PORT=4317, ADDRESS=`http://${HOST}:${PORT}`, APP='the-orthodox-way';
const ROOT=path.join(__dirname,'dist'), TOKEN=crypto.randomBytes(24).toString('hex');
const TYPES={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.json':'application/json; charset=utf-8','.svg':'image/svg+xml','.ico':'image/x-icon','.jpg':'image/jpeg','.jpeg':'image/jpeg','.png':'image/png','.webp':'image/webp','.pdf':'application/pdf'};
function getStatus(){return new Promise(resolve=>{const req=http.get(ADDRESS+'/__app',res=>{let body='';res.on('data',d=>{body+=d;if(body.length>8192)req.destroy();});res.on('end',()=>{try{const data=JSON.parse(body);resolve(data.app===APP?data:null);}catch{resolve(null);}});});req.on('error',()=>resolve(null));req.setTimeout(1500,()=>{req.destroy();resolve(null);});});}
function openBrowser(){if(process.platform==='win32')execFile('explorer.exe',[ADDRESS],()=>{});else console.log('Open '+ADDRESS+' in your browser.');}
function respond(res,status,body,type='text/plain; charset=utf-8'){res.writeHead(status,{'Content-Type':type,'Cache-Control':'no-store','X-Content-Type-Options':'nosniff'});res.end(body);}
async function run(){
  const existing=await getStatus();
  if(process.argv.includes('--stop')){
    if(!existing){console.log('Holy Apostolic is not running at '+ADDRESS);return;}
    const req=http.request(ADDRESS+'/__shutdown',{method:'POST',headers:{'X-Orthodox-Way-Token':existing.token}},res=>{res.resume();res.on('end',()=>console.log(res.statusCode===200?'Holy Apostolic has stopped.':'The app could not be stopped.'));});
    req.on('error',err=>{console.error(err.message);process.exitCode=1;});req.end();return;
  }
  if(existing){console.log('Holy Apostolic is already running at '+ADDRESS);if(process.argv.includes('--open'))openBrowser();return;}
  const server=http.createServer((req,res)=>{
    if(req.headers.host!==`${HOST}:${PORT}` && req.headers.host!==`localhost:${PORT}`){respond(res,403,'Use '+ADDRESS);return;}
    const common={'Cache-Control':'no-store','X-Content-Type-Options':'nosniff','Referrer-Policy':'no-referrer','Content-Security-Policy':"default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; connect-src 'self'"+(accountConfig.enabled?' '+accountConfig.url:'')+"; font-src 'self'; object-src 'none'; base-uri 'none'; frame-ancestors 'self'; form-action 'self'"};
    if(req.url==='/api/account-config' && req.method==='GET'){respond(res,200,JSON.stringify(accountConfig),'application/json');return;}
    if(req.url==='/__app' && req.method==='GET'){respond(res,200,JSON.stringify({app:APP,token:TOKEN,url:ADDRESS}),'application/json');return;}
    if(req.url==='/__shutdown'){
      if(req.method!=='POST'||req.headers['x-orthodox-way-token']!==TOKEN){respond(res,403,'Invalid shutdown request.');return;}
      respond(res,200,'Stopped.');server.close(()=>process.exit(0));setTimeout(()=>process.exit(0),1500).unref();return;
    }
    if(req.method!=='GET' && req.method!=='HEAD'){respond(res,405,'Method not allowed.');return;}
    let pathname;
    try{pathname=decodeURIComponent(new URL(req.url,ADDRESS).pathname);if(pathname.includes('\0'))throw new Error('Invalid path.');}catch{respond(res,400,'Invalid path.');return;}
    const target=path.resolve(ROOT,'.'+pathname.replace(/\//g,path.sep));
    if(target!==ROOT && !target.startsWith(ROOT+path.sep)){respond(res,403,'Forbidden.');return;}
    const file=target===ROOT||pathname.endsWith('/')?path.join(target,'index.html'):target;
    fs.readFile(file,(err,data)=>{
      if(err){respond(res,404,'File not found.');return;}
      res.writeHead(200,{...common,'Content-Type':TYPES[path.extname(file)]||'application/octet-stream'});res.end(req.method==='HEAD'?undefined:data);
    });
  });
  server.on('error',err=>{console.error(err.code==='EADDRINUSE'?`Port ${PORT} is occupied by another app. Stop that app before starting Holy Apostolic. Saved progress uses the fixed address ${ADDRESS}.`:err.message);process.exitCode=1;});
  server.listen(PORT,HOST,()=>{console.log('Holy Apostolic is running at '+ADDRESS);console.log('Stop with Ctrl+C or Stop.cmd.');if(process.argv.includes('--open'))openBrowser();});
}
run().catch(err=>{console.error(err);process.exitCode=1;});
