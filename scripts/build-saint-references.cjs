'use strict';
// A small public identity index. Religious source text remains in its original files.
const fs=require('node:fs'),path=require('node:path');
const dist=path.resolve(__dirname,'../dist'),read=file=>JSON.parse(fs.readFileSync(path.join(dist,'content',file),'utf8'));
function build(){
 const additions=read('saints-reference-additions.json'),contexts=read('saint-reference-contexts.json');
 const saints=[...read('saints.json').saints,...read('saints-additions.json').saints,...additions.saints];
 const identities={},full={},titled={},paragraphs={},sources={};
 const strip=name=>name.replace(/^(?:Saints|Saint|Sts\.|St\.)\s+/,'');
 const special={theotokos:'', 'gabriel-archangel':'', 'michael-archangel':''};
 const joint=new Set(['peter-paul','perpetua-felicity','cosmas-damian','cyril-methodius','joachim-anna','zachariah-elizabeth','sophia-faith-hope-love','natalia-adrian','zosimas-savvaty','boris-gleb','adam-eve']);
 for(const saint of saints){const name=strip(saint.name),prefix=Object.hasOwn(special,saint.id)?special[saint.id]:joint.has(saint.id)?'Sts. ':'St. ';identities[saint.id]={name,display:prefix+name,prefix};
  // Only explicit names enter the global map. Short names require a title or reviewed context.
  const candidates=[name,...(saint.aliases||[]).filter(alias=>alias.split(/\s+/).length>1&&!/[,;]|\b(?:before|name|tribe|Parents|Ancestors|Daughter|Mother of|Son of)\b/i.test(alias))];
  for(const alias of candidates){if(!titled[alias])titled[alias]=[];if(!titled[alias].includes(saint.id))titled[alias].push(saint.id);if(alias.split(/\s+/).length>1)full[alias]=saint.id;}
 }
 for(const item of contexts.fullAliases||[])if(identities[item.saintId])full[item.alias]=item.saintId;
 for(const item of contexts.titledAliases||[]){if(!identities[item.saintId])continue;titled[item.alias]||=[];if(!titled[item.alias].includes(item.saintId))titled[item.alias].push(item.saintId);}
 for(const [key,aliases]of Object.entries(contexts.paragraphs||{})){paragraphs[key]={};for(const [alias,id]of Object.entries(aliases))if(identities[id])paragraphs[key][alias]=id;}
 for(const [key,aliases]of Object.entries(contexts.sources||{})){sources[key]={};for(const [alias,id]of Object.entries(aliases))if(identities[id])sources[key][alias]=id;}
 // A profile's identified primary life supplies context for its own introductory short name.
 const owners=new Map();for(const saint of saints){if(!owners.has(saint.sourceId))owners.set(saint.sourceId,new Set());owners.get(saint.sourceId).add(saint.id);}
 for(const saint of saints)if(owners.get(saint.sourceId).size===1&&!joint.has(saint.id)&&saint.id!=='theotokos'&&saint.id!=='gabriel-archangel'){const short=strip(saint.name).split(/[ ,]/)[0];sources[saint.sourceId]||={};if(!sources[saint.sourceId][short])sources[saint.sourceId][short]=saint.id;}
 for(const alias of contexts.excludedAliases||[])delete full[alias];
 Object.assign(full,{'Theotokos':'theotokos','Mother of God':'theotokos','Virgin Mary':'theotokos','Ever-Virgin Mary':'theotokos'});
 const lessonCandidates={},lessons={};for(const [key,map]of Object.entries(paragraphs)){const lesson=key.split('/')[0];lessonCandidates[lesson]||={};for(const [alias,id]of Object.entries(map)){lessonCandidates[lesson][alias]||=new Set();lessonCandidates[lesson][alias].add(id);}}
 for(const [lesson,map]of Object.entries(lessonCandidates)){lessons[lesson]={};for(const [alias,ids]of Object.entries(map))if(ids.size===1)lessons[lesson][alias]=[...ids][0];}
 const data={schema:1,identities,full,titled,paragraphs,lessons,sources,scoped:contexts.scoped||{},exclusions:contexts.exclusions||{}};
 fs.writeFileSync(path.join(dist,'saint-references-data.js'),'\'use strict\';\nwindow.OrthodoxSaintData='+JSON.stringify(data)+';\n');
 return {saints:saints.length,aliases:Object.keys(full).length,paragraphContexts:Object.keys(paragraphs).length,bytes:fs.statSync(path.join(dist,'saint-references-data.js')).size};
}
if(require.main===module)console.log(JSON.stringify(build()));
module.exports={build};
