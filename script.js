const $=s=>document.querySelector(s);
const fileInput=$("#fileInput"), uploadBtn=$("#uploadBtn"), editor=$("#editor"), trackInfo=$("#trackInfo");
const trackName=$("#trackName"), trackMeta=$("#trackMeta"), playBtn=$("#playBtn"), stopBtn=$("#stopBtn");
const canvas=$("#wave"), ctx=canvas.getContext("2d"), playhead=$("#playhead"), meter=$("#meterBar"), progress=$("#progress");

let audioCtx=null, buffer=null, source=null, gain=null, analyser=null, dryGain=null, delay=null, feedback=null;
let startedAt=0, pausedAt=0, raf=0, playing=false;

const presets={
 club:{bass:7,treble:3,echo:12,width:118,energy:9,speed:100},
 night:{bass:3,treble:4,echo:7,width:110,energy:5,speed:100},
 hard:{bass:10,treble:5,echo:17,width:125,energy:13,speed:103},
 chill:{bass:2,treble:1,echo:15,width:130,energy:3,speed:96}
};
const ids=["bass","treble","echo","width","energy","speed"];

function fmt(sec){sec=Math.max(0,sec||0);return `${String(Math.floor(sec/60)).padStart(2,"0")}:${String(Math.floor(sec%60)).padStart(2,"0")}`}
function setVal(id,v){$("#"+id).value=v;$("#"+id+"Val").textContent=v}
ids.forEach(id=>$("#"+id).addEventListener("input",()=>{ $("#"+id+"Val").textContent=$("#"+id).value; updateLive(); }));
document.querySelectorAll(".preset").forEach(b=>b.onclick=()=>{document.querySelectorAll(".preset").forEach(x=>x.classList.remove("active"));b.classList.add("active");Object.entries(presets[b.dataset.preset]).forEach(([k,v])=>setVal(k,v));updateLive()});

uploadBtn.onclick=()=>fileInput.click();
fileInput.onchange=async()=>{const f=fileInput.files[0];if(!f)return; await loadFile(f)};
$("#removeBtn").onclick=()=>{stop();buffer=null;editor.classList.add("hidden");trackInfo.classList.add("hidden");uploadBtn.classList.remove("hidden");fileInput.value=""};

async function loadFile(file){
 try{
  audioCtx=audioCtx||new (window.AudioContext||window.webkitAudioContext)();
  buffer=await audioCtx.decodeAudioData(await file.arrayBuffer());
  trackName.textContent=file.name;
  trackMeta.textContent=`${fmt(buffer.duration)} · ${(file.size/1048576).toFixed(2)} MB`;
  uploadBtn.classList.add("hidden");trackInfo.classList.remove("hidden");editor.classList.remove("hidden");
  drawWave(); drawLoop(); updateLive();
 }catch(e){alert("Format audio tidak bisa dibaca browser ini. Coba MP3 atau WAV.");console.error(e)}
}

function drawWave(){
 const w=canvas.width=canvas.clientWidth*devicePixelRatio,h=canvas.height=canvas.clientHeight*devicePixelRatio;
 ctx.clearRect(0,0,w,h);ctx.strokeStyle="rgba(255,57,127,.65)";ctx.lineWidth=1.2*devicePixelRatio;
 const data=buffer.getChannelData(0), step=Math.max(1,Math.floor(data.length/w));
 ctx.beginPath();
 for(let x=0;x<w;x++){let min=1,max=-1;for(let j=0;j<step;j++){const v=data[x*step+j]||0;min=Math.min(min,v);max=Math.max(max,v)}ctx.moveTo(x,h/2+min*h*.42);ctx.lineTo(x,h/2+max*h*.42)}ctx.stroke();
}
function makeGraph(ac,buf,forExport=false){
 const src=ac.createBufferSource();src.buffer=buf;
 const g=ac.createGain(); const bass=ac.createBiquadFilter();bass.type="lowshelf";bass.frequency.value=140;
 const treble=ac.createBiquadFilter();treble.type="highshelf";treble.frequency.value=4500;
 const comp=ac.createDynamicsCompressor();comp.threshold.value=-12;comp.knee.value=18;comp.ratio.value=3;comp.attack.value=.005;comp.release.value=.15;
 const an=ac.createAnalyser();an.fftSize=256;
 const d=ac.createDelay(1);const fb=ac.createGain();
 const vals={bass:+$("#bass").value,treble:+$("#treble").value,echo:+$("#echo").value,energy:+$("#energy").value};
 bass.gain.value=vals.bass;treble.gain.value=vals.treble;g.gain.value=1+vals.energy/100;
 d.delayTime.value=.18;fb.gain.value=Math.min(.48,vals.echo/100*.7);d.connect(fb);fb.connect(d);
 src.connect(bass).connect(treble).connect(comp).connect(g);comp.connect(d);
 const out=ac.createGain(); const width=+$("#width").value/100;
 // Simple stereo widening matrix.
 const splitter=ac.createChannelSplitter(2), merger=ac.createChannelMerger(2);
 if(buf.numberOfChannels>1){
   g.disconnect();g.connect(splitter);
   const l=ac.createGain(),r=ac.createGain();l.gain.value=1; r.gain.value=1;
   splitter.connect(l,0);splitter.connect(r,1);
   l.connect(merger,0,0);r.connect(merger,0,1);
   splitter.connect(merger,0,1);splitter.connect(merger,1,0);
   merger.connect(out);
 }else g.connect(out);
 d.connect(out);out.connect(an);
 return {src,out,an};
}
function updateLive(){
 if(!audioCtx||!buffer)return;
 if(playing){const pos=audioCtx.currentTime-startedAt; // rebuild only on next play to avoid clicks
   if(source) source.playbackRate.value=+$("#speed").value/100;
 }
}
async function start(){
 if(!buffer)return;
 if(!audioCtx)audioCtx=new AudioContext(); await audioCtx.resume();
 stop(false);
 const graph=makeGraph(audioCtx,buffer);
 source=graph.src; analyser=graph.an; gain=graph.out;
 source.playbackRate.value=+$("#speed").value/100;
 const offset=Math.min(pausedAt,Math.max(0,buffer.duration-.01));
 source.start(0,offset);startedAt=audioCtx.currentTime-offset;playing=true;
 playBtn.textContent="Ⅱ"; source.onended=()=>{if(playing){playing=false;pausedAt=0;playBtn.textContent="▶"}};
 meterLoop();
}
function stop(reset=true){
 if(source){try{source.stop()}catch{}source=null}
 playing=false;if(reset)pausedAt=0;playBtn.textContent="▶";cancelAnimationFrame(raf)
}
playBtn.onclick=()=>playing?pause():start();
function pause(){if(!playing)return;pausedAt=Math.min(buffer.duration,audioCtx.currentTime-startedAt);stop(false)}
stopBtn.onclick=()=>stop(true);
function meterLoop(){
 if(!playing)return;const arr=new Uint8Array(analyser.frequencyBinCount);analyser.getByteFrequencyData(arr);let avg=arr.reduce((a,b)=>a+b,0)/arr.length;meter.style.width=Math.min(100,avg*1.7)+"%";
 const t=audioCtx.currentTime-startedAt;$("#current").textContent=fmt(t);$("#duration").textContent=fmt(buffer.duration);
 playhead.style.left=Math.min(100,t/buffer.duration*100)+"%";raf=requestAnimationFrame(meterLoop);
}

function drawLoop(){ if(buffer){$("#duration").textContent=fmt(buffer.duration)} requestAnimationFrame(drawLoop) }

$("#previewBtn").onclick=()=>{if(playing)pause();else start()};

$("#exportBtn").onclick=async()=>{
 if(!buffer)return;
 progress.classList.remove("hidden");
 try{
   const speed=+$("#speed").value/100;
   const outDur=buffer.duration/speed;
   const oc=new OfflineAudioContext(buffer.numberOfChannels,Math.ceil(buffer.sampleRate*outDur),buffer.sampleRate);
   const graph=makeGraph(oc,buffer);graph.src.playbackRate.value=speed;graph.src.start(0);graph.src.connect(oc.destination);
   const rendered=await oc.startRendering();
   const wav=toWav(rendered);
   const blob=new Blob([wav],{type:"audio/wav"});const url=URL.createObjectURL(blob);
   const a=document.createElement("a");a.href=url;a.download=`RD-DJ-${trackName.textContent.replace(/\.[^.]+$/,"")}.wav`;a.click();URL.revokeObjectURL(url);
 }catch(e){alert("Export gagal: "+e.message);console.error(e)}
 finally{progress.classList.add("hidden")}
};

function toWav(ab){
 const ch=ab.numberOfChannels,len=ab.length,rate=ab.sampleRate,bytes=2;
 const buf=new ArrayBuffer(44+len*ch*bytes),v=new DataView(buf),write=(o,s)=>{for(let i=0;i<s.length;i++)v.setUint8(o+i,s.charCodeAt(i))};
 write(0,"RIFF");v.setUint32(4,36+len*ch*bytes,true);write(8,"WAVE");write(12,"fmt ");v.setUint32(16,16,true);v.setUint16(20,1,true);v.setUint16(22,ch,true);v.setUint32(24,rate,true);v.setUint32(28,rate*ch*bytes,true);v.setUint16(32,ch*bytes,true);v.setUint16(34,16,true);write(36,"data");v.setUint32(40,len*ch*bytes,true);
 let o=44;for(let i=0;i<len;i++)for(let c=0;c<ch;c++){let s=Math.max(-1,Math.min(1,ab.getChannelData(c)[i]));v.setInt16(o,s<0?s*0x8000:s*0x7fff,true);o+=2}return buf;
}
window.addEventListener("resize",()=>{if(buffer)drawWave()});
