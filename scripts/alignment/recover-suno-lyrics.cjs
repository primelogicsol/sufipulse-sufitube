const fs=require('fs');
(async()=>{
 const id='6a79ea36-a31d-45db-aae1-6862e99db69e';
 const url='https://suno.com/song/'+id;
 const res=await fetch(url,{headers:{'User-Agent':'Mozilla/5.0','Accept-Language':'en-US,en;q=0.9,ur;q=0.8,hi;q=0.7'}});
 if(!res.ok) throw new Error('HTTP '+res.status);
 const html=await res.text();
 let lyrics;
 const m=html.match(/[a-z0-9]+:T[0-9a-f]+,(#[^\n]+[\s\S]*?)(?=(?:\n[a-z0-9]+:|$))/i);
 if(m&&m[1]) lyrics=m[1].replace(/\\n/g,'\n').replace(/\\"/g,'"').trim();
 if(!lyrics){
   const p=html.match(/\\?"prompt\\?"\s*:\s*\\?"([^"\\]{20,})\\?"/i);
   if(p&&p[1]&&!p[1].startsWith('$')) lyrics=p[1].replace(/\\n/g,'\n').replace(/\\"/g,'"').trim();
 }
 if(!lyrics) throw new Error('lyrics not found');
 const ai=lyrics.search(/\d+:\s*\[|\{"prefetched"|<\/script>|\$L[a-z0-9]+/i);
 if(ai!==-1) lyrics=lyrics.slice(0,ai).trim();
 fs.writeFileSync('.data/pipeline-drafts/draft_1794713823276_8baeb8cc/alignment/recovered_suno_lyrics.txt',lyrics,'utf8');
 console.log('chars',lyrics.length,'lines',lyrics.split(/\r?\n/).length);
 console.log(lyrics.slice(0,180));
})().catch(e=>{console.error(e);process.exit(1)});