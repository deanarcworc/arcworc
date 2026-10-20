// Temporary alphabet glyphs resolve into the supplied logo, never a replacement font.
export const wordmarkLetters='ARCWORC';
export function decodeWordmark(elapsed){
 return [...wordmarkLetters].map((letter,i)=>{
  const start=i*75,duration=i===0?120:280,progress=Math.max(0,Math.min(1,(elapsed-start)/duration));
  return {started:elapsed>=start,settled:progress===1,letter:elapsed<start?'':String.fromCharCode(65+Math.min(letter.charCodeAt(0)-65,Math.floor(progress*(letter.charCodeAt(0)-64))))};
 });
}
export function decodedEdge(states){
 const edges=[14.25,26.46,39.94,60.33,74.53,86.77,100];let edge=0;
 for(let i=0;i<states.length;i++){if(!states[i].settled)break;edge=edges[i];}
 return edge;
}
