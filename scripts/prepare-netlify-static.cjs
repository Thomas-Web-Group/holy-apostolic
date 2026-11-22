'use strict';
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const {headersFor}=require('./prepare-netlify.cjs');
const app=path.resolve(__dirname,'..'),source=path.join(app,'dist'),parent=path.dirname(app),target=path.resolve(parent,'holy-apostolic-netlify'),marker=path.join(target,'.holy-apostolic-static.json');
if(path.dirname(target)!==parent||path.basename(target)!=='holy-apostolic-netlify'||target===source)throw new Error('Unexpected output directory');
if(fs.existsSync(target)&&!fs.existsSync(marker))throw new Error('The output folder is not identified as a generated Holy Apostolic deployment');
if(fs.existsSync(target)&&fs.lstatSync(target).isSymbolicLink())throw new Error('Output directory cannot be a symbolic link');
function files(folder){return fs.readdirSync(folder,{withFileTypes:true}).flatMap(entry=>{const absolute=path.join(folder,entry.name);if(entry.isSymbolicLink())throw new Error('Symbolic links are not publishable');return entry.isDirectory()?files(absolute):[absolute];});}
const publish=files(source);for(const file of publish){const parts=path.relative(source,file).split(path.sep);if(parts.some(part=>part==='.env'||part.startsWith('.env.')||['.git','.runtime','node_modules','.netlify'].includes(part)))throw new Error('Private file in public output');}
const expected=new Set([...publish.map(file=>path.relative(source,file).split(path.sep).join('/')),'api/account-config.json','_redirects','_headers','.holy-apostolic-static.json']);
if(fs.existsSync(target))for(const file of files(target))if(!expected.has(path.relative(target,file).split(path.sep).join('/')))throw new Error('Unexpected file in generated output folder; not publishing it');
fs.mkdirSync(target,{recursive:true});
for(const file of publish){const destination=path.join(target,path.relative(source,file));fs.mkdirSync(path.dirname(destination),{recursive:true});fs.copyFileSync(file,destination);}
fs.mkdirSync(path.join(target,'api'),{recursive:true});
fs.writeFileSync(path.join(target,'api/account-config.json'),JSON.stringify({enabled:false})+'\n');
fs.writeFileSync(path.join(target,'_redirects'),'/api/account-config /api/account-config.json 200\n');
fs.writeFileSync(path.join(target,'_headers'),headersFor({enabled:false}));
const version=JSON.parse(fs.readFileSync(path.join(app,'package.json'),'utf8')).version;
fs.writeFileSync(marker,JSON.stringify({app:'holy-apostolic-static-deployment',version,source:'dist',accounts:'guest mode; no secrets or server required'},null,2)+'\n');
const manifest=files(target).map(file=>({file:path.relative(target,file).split(path.sep).join('/'),sha256:crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex')}));
console.log(JSON.stringify({folder:target,version,files:manifest.length,accounts:'guest mode',forms:'Netlify Forms detection and email notification must be enabled in Netlify',deployment:'prepared, not published'}));
