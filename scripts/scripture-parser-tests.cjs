'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const parser=require('../dist/scripture-references.js');
const cases=[
 ['John 3:16','John',3,16],['John3:16','John',3,16],['Jn. 3:16','John',3,16],['St. John iii. 16.','John',3,16],
 ['Heb. xi. 1.','Heb',11,1],['1 Cor. xiii.13','1Cor',13,13],['I. Corinthians xiii. 13.','1Cor',13,13],
 ['II Cor. v. 17.','2Cor',5,17],['First Corinthians 13:13','1Cor',13,13],['1st Corinthians 13:13','1Cor',13,13],
 ['2 John 1:5','2John',1,5],['III John i. 4','3John',1,4],['1 Tim. ii. 5.','1Tim',2,5],['2 Thess. ii. 15.','2Thess',2,15],
 ['James i. 26.','Jas',1,26],['Jas 2:14','Jas',2,14],['Philemon 1:8','Phlm',1,8],['Jude 1:3','Jude',1,3],
 ['Genesis i. 1.','Gen',1,1],['Exod. xx. 1','Exod',20,1],['Lev. xvi. 2','Lev',16,2],['Num. xvi. 46','Num',16,46],
 ['Deut. v. 6','Deut',5,6],['Joshua 1:9','Josh',1,9],['Judg. 6:12','Judg',6,12],['Ruth 1:16','Ruth',1,16],
 ['1 Samuel 2:1','1Sam',2,1],['2 Kings 13:21','2Kgs',13,21],['2 (4) Kings xiii. 21.','2Kgs',13,21],
 ['1 (3 in the Greek) Kings i. 39.','1Kgs',1,39],['3 Kings 1:39','1Kgs',1,39],['IV Kingdoms 13:21','2Kgs',13,21],
 ['I Paralipomenon 16:8','1Chr',16,8],['Ezra 1:1','Ezra',1,1],['Neh. 8:10','Neh',8,10],['Esther 4:14','Esth',4,14],
 ['Job xix. 25','Job',19,25],['Psalm xc. 2.','Ps',90,2],['Psalm xi. 8.','Ps',11,8],['Ps. cxxxix. 6–11.','Ps',139,6],
 ['Psalm 151:1','Ps',151,1],['Prov. iii. 5','Prov',3,5],['Eccles. iii. 1','Eccl',3,1],['Song of Songs 2:1','Song',2,1],
 ['Cant. i. 5','Song',1,5],['Isaias vii. 14','Isa',7,14],['Isa. vii. 9','Isa',7,9],['Isa 7:14','Isa',7,14],['I Sa. 7:9','1Sam',7,9],['Jer. xxxi. 31','Jer',31,31],['Ezech. xxxvi. 26','Ezek',36,26],
 ['Hos. vi. 6','Hos',6,6],['Joel 2:28','Joel',2,28],['Obadiah 1:3','Obad',1,3],['Jonas ii. 1','Jonah',2,1],
 ['Micheas vi. 8','Mic',6,8],['Habacuc ii. 4','Hab',2,4],['Sophonias iii. 17','Zeph',3,17],['Aggeus ii. 9','Hag',2,9],
 ['Zacharias ix. 9','Zech',9,9],['Malachias iii. 1','Mal',3,1],['Tobit 4:7','Tob',4,7],['Judith 13:18','Jdt',13,18],
 ['Wisdom of Solomon 3:1','Wis',3,1],['Ecclesiasticus 2:1','Sir',2,1],['Sirach 38:1','Sir',38,1],['Baruch 3:36','Bar',3,36],
 ['Epistle of Jeremiah 1:3','EpJer',1,3],['2 Macc. vii. 9','2Macc',7,9],['3 Maccabees 6:1','3Macc',6,1],
 ['Prayer of Manasseh 1:1','PrMan',1,1],['Bel and the Dragon 1:1','Bel',1,1],['Susanna 1:2','Sus',1,2],
 ['Revelation xxi. 4','Rev',21,4],['Apoc. iii. 20','Rev',3,20],['1 John iv,16.','1John',4,16],
 ['See Matt. chapter 5:3','Matt',5,3],['Luke chap. xv. 11','Luke',15,11],['Acts ch.2:42','Acts',2,42],
 ['Greek Esther 1:1','EsthGr',1,1],['Greek Daniel 3:24','DanGr',3,24],['GreekDaniel3:24','DanGr',3,24],
 ['Additions to Esther 10:4','AddEsth',10,4],['Rest of Esther 16:1','AddEsth',16,1],
 ['EsthGr 1:1','EsthGr',1,1],['DanGr 3:24','DanGr',3,24],['AddEsth 10:4','AddEsth',10,4],
];
let count=0;
for(const [input,book,chapter,startVerse]of cases){
 const result=parser.find(input);assert.equal(result.length,1,input);assert.equal(result[0].book,book,input);assert.equal(result[0].parts[0].chapter,chapter,input);assert.equal(result[0].parts[0].startVerse,startVerse,input);assert.equal(result[0].text,input.slice(result[0].start,result[0].end));count++;
}
const deep=(input,parts,context)=>{assert.deepEqual(parser.find(input,context)[0]?.parts,parts,input);count++;};
deep('Rom. 8:1,14–17',[{chapter:8,startVerse:1},{chapter:8,startVerse:14,endVerse:17}]);
deep('1 Cor. xv. 51, 52.',[{chapter:15,startVerse:51},{chapter:15,startVerse:52}]);
deep('John 3:16;4:2',[{chapter:3,startVerse:16},{chapter:4,startVerse:2}]);
deep('John 3:16–4:2',[{chapter:3,startVerse:16,endChapter:4,endVerse:2}]);
deep('Matthew 5–7',[{chapter:5,endChapter:7}]);
deep('Matthew 5',[{chapter:5}]);
deep('Titus iii. 4-6.',[{chapter:3,startVerse:4,endVerse:6}]);
deep('Ps. cxxxix. 6–11.',[{chapter:139,startVerse:6,endVerse:11}]);
deep('Matt xix. 17, and v.',[{chapter:19,startVerse:17},{chapter:5}]);
deep('Psalm cxlv. 8, 9.',[{chapter:145,startVerse:8},{chapter:145,startVerse:9}]);
deep('John 3:16,18;4:1,4',[{chapter:3,startVerse:16},{chapter:3,startVerse:18},{chapter:4,startVerse:1},{chapter:4,startVerse:4}]);
deep('John 3:16a–17b',[{chapter:3,startVerse:16,startSuffix:'a',endVerse:17,endSuffix:'b'}]);
deep('verse 17–18',[{chapter:3,startVerse:17,endVerse:18}],{book:'John',chapter:3});
deep('Jude 5–7',[{chapter:1,startVerse:5,endVerse:7}]);
deep('Jude vv. 5–7',[{chapter:1,startVerse:5,endVerse:7}]);
deep('Philemon v. 8',[{chapter:1,startVerse:8}]);
deep('2 John 5',[{chapter:1,startVerse:5}]);
deep('Susanna 42',[{chapter:1,startVerse:42}]);
assert.equal(parser.find('Pet. i. 12.')[0].bookCandidates.length,2);count++;
assert.equal(parser.find('Cor. xiii. 13.')[0].ambiguousReason.includes('does not specify'),true);count++;
assert.equal(parser.find('Psalm 50:10 (LXX)')[0].numbering,'lxx');count++;
assert.equal(parser.find('Psalm 51:10 (KJV)')[0].editionHint,'kjv');count++;
assert.equal(parser.find('Psalm 11:8',{editionHint:'coverdale',numbering:'mt'})[0].editionHint,'coverdale');count++;
assert.equal(parser.find('1 Kings 2:1',{bookNaming:'greek'})[0].book,'1Sam');count++;
assert.equal(parser.find('John 3:16ff.')[0].following,true);count++;
assert.equal(parser.find('John 3:16a')[0].partialVerse,true);count++;
assert.equal(parser.find('Jude 1')[0].singleChapterAmbiguity,true);count++;
assert.equal(parser.find('Genesis 1:1 and John 1:1').length,2);count++;
for(const input of ['Henry VIII','Book I, chapter 3','chapter II.3','Pope John XXIII (1958)','John I believe this','Saint John Chrysostom, Book II','John of Damascus I.2','Mark 1982','John 2026','Jude 1982','Hebrews were mentioned','My friend Peter 2020','A work by James in 1883','Revelation in nature','Romanticism 8:1','1 Corinthiansxyz 13:1','John 0:16','1 John 20']){assert.equal(parser.find(input).length,0,input);count++;}
const report={assertions:count,referenceCases:cases.length,issues:[]};console.log(report);
