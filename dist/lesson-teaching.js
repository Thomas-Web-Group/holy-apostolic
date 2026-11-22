'use strict';
// Editorial explanations are separate from immutable published source passages.
window.OrthodoxLessons=(()=>{
 const esc=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const refs=lesson=>[...(lesson.explanation?.overview||[]),...(lesson.explanation?.readings||[]).flatMap(reading=>reading.paragraphs||[])].flatMap(paragraph=>paragraph.sourceRefs||[]);
 function paragraph(item,ids,scope){return '<p data-annotatable data-study-scope="'+esc(scope)+'">'+esc(item.text)+(item.sourceRefs||[]).filter((ref,index,list)=>list.findIndex(item=>item.sourceId===ref.sourceId)===index).map(ref=>{const number=ids.indexOf(ref.sourceId)+1;return number?'<sup class="footnote-ref"><a href="#fn-'+esc(ref.sourceId)+'" data-cite="'+esc(ref.sourceId)+'" aria-label="Source '+number+'">['+number+']</a></sup>':'';}).join('')+'</p>';}
 function overview(lesson,ids){return lesson.explanation?.overview?.length?'<section class="lesson-overview" aria-label="Lesson introduction" data-editorial="explanation">'+lesson.explanation.overview.map((item,index)=>paragraph(item,ids,'lesson-introduction-'+index)).join('')+'</section>':'';}
 function reading(lesson,index,ids){const item=lesson.explanation?.readings?.find(item=>item.index===index+1);return item?{title:item.title,html:'<div class="lesson-explanation" data-editorial="explanation">'+item.paragraphs.map((paragraphItem,part)=>paragraph(paragraphItem,ids,'lesson-explanation-'+index+'-'+part)).join('')+'</div>'}:null;}
 return {refs,overview,reading};
})();
