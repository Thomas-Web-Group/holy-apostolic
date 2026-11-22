'use strict';
const fs=require('node:fs'),path=require('node:path');
const fields=new Set(['ORTHODOX_SUPABASE_URL','ORTHODOX_SUPABASE_PUBLIC_KEY','ORTHODOX_AUTH_GOOGLE_ENABLED','ORTHODOX_AUTH_FACEBOOK_ENABLED','ORTHODOX_AUTH_APPLE_ENABLED']);
function parse(text){
  const values={};
  for(const [index,line]of text.replace(/^\uFEFF/,'').split(/\r?\n/).entries()){
    if(!line.trim()||line.trimStart().startsWith('#'))continue;
    const match=line.match(/^\s*(?:export\s+)?([A-Z][A-Z0-9_]*)\s*=\s*(.*?)\s*$/);
    if(!match)throw new Error('Check the formatting of .env line '+(index+1)+'.');
    if(!fields.has(match[1]))continue;
    let value=match[2];
    if(value.startsWith('"')||value.startsWith("'")){const quote=value[0],end=value.indexOf(quote,1);if(end<0||!/^\s*(?:#.*)?$/.test(value.slice(end+1)))throw new Error('Check the quotes on .env line '+(index+1)+'.');value=value.slice(1,end);}
    else value=value.replace(/\s+#.*$/,'').trim();
    values[match[1]]=value;
  }
  return values;
}
function read(env=process.env){
  let local={};try{local=parse(fs.readFileSync(path.join(__dirname,'.env'),'utf8'));}catch(error){if(error.code!=='ENOENT')throw error;}
  for(const name of fields)if(Object.prototype.hasOwnProperty.call(env,name))local[name]=env[name];
  return local;
}
module.exports={parse,read};
