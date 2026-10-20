export function escapeHtml(value){
  return String(value ?? '').replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
}

// Team descriptions are user-controlled text, never trusted HTML.
export function descriptionHtml(value){
  return String(value || '').split(/\r?\n/).filter(Boolean).map(line=>{
    const pattern=/https?:\/\/[^\s<>"']+/g;
    let html='',end=0;
    for(const match of line.matchAll(pattern)){
      html+=escapeHtml(line.slice(end,match.index));
      let href=null;
      try{const url=new URL(match[0]);if(['https:','http:'].includes(url.protocol)&&!url.username&&!url.password)href=url.href;}catch{}
      html+=href?'<a href="'+escapeHtml(href)+'" target="_blank" rel="noopener noreferrer" class="team-link">'+escapeHtml(match[0])+'</a>':escapeHtml(match[0]);
      end=match.index+match[0].length;
    }
    return '<p class="team-desc-para">'+html+escapeHtml(line.slice(end))+'</p>';
  }).join('');
}
