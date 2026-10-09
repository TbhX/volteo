import React,{useEffect,useRef,useState} from 'react';
const SEEN_KEY='volteo-intro-v4-full-playback';
const clock=n=>`${Math.floor(n/60)}:${String(Math.floor(n%60)).padStart(2,'0')}`;
export function shouldPlayIntro(){
 if(typeof window==='undefined'||window.matchMedia('(prefers-reduced-motion: reduce)').matches)return false;
 try{return sessionStorage.getItem(SEEN_KEY)!=='seen';}catch{return true;}
}
export default function Intro({onClose}){
 const [time,setTime]=useState(0),[duration,setDuration]=useState(0),[closing,setClosing]=useState(false),[muted,setMuted]=useState(true),[playback,setPlayback]=useState('loading');
 const video=useRef(null),dialog=useRef(null),button=useRef(null),done=useRef(false),previous=useRef(document.activeElement),closeTimer=useRef(null),loadTimer=useRef(null),lastProgress=useRef(Date.now());
 function finish(){if(done.current)return;done.current=true;clearTimeout(loadTimer.current);try{sessionStorage.setItem(SEEN_KEY,'seen');}catch{}setClosing(true);closeTimer.current=setTimeout(()=>{onClose();requestAnimationFrame(()=>{const target=previous.current?.isConnected&&previous.current!==document.body?previous.current:document.querySelector('.hero h1');target?.focus?.({preventScroll:true});});},240);}
 useEffect(()=>{
  const old=document.body.style.overflow;document.body.style.overflow='hidden';button.current?.focus();
  const handle=e=>{if(e.key==='Escape')finish();if(e.key==='Tab'){const controls=[...dialog.current.querySelectorAll('button')];const first=controls[0],last=controls.at(-1);if(e.shiftKey&&document.activeElement===first){e.preventDefault();last.focus();}else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first.focus();}}};
  window.addEventListener('keydown',handle);loadTimer.current=setTimeout(()=>setPlayback('waiting'),15000);
  const watchdog=setInterval(()=>{if(video.current?.currentTime>0&&Date.now()-lastProgress.current>20000)setPlayback('waiting');},2000);
  return()=>{document.body.style.overflow=old;window.removeEventListener('keydown',handle);clearTimeout(loadTimer.current);clearTimeout(closeTimer.current);clearInterval(watchdog);};
 },[]);
 async function play(){try{await video.current?.play();}catch(error){if(error.name!=='AbortError')setPlayback('blocked');}}
 function retry(){if(video.current?.error)video.current.load();play();}
 function toggleSound(){const next=!muted;video.current.muted=next;setMuted(next);}
 return <section ref={dialog} className={'intro-overlay intro-film'+(closing?' is-closing':'')} role="dialog" aria-modal="true" aria-label="Film de présentation VOLTÉO">
  <video ref={video} autoPlay muted={muted} playsInline preload="auto" poster="/media/volteo-home-wide.webp" onLoadedMetadata={e=>setDuration(Number.isFinite(e.currentTarget.duration)?e.currentTarget.duration:0)} onCanPlay={play} onPlaying={()=>{clearTimeout(loadTimer.current);lastProgress.current=Date.now();setPlayback('playing');}} onWaiting={()=>setPlayback('loading')} onEnded={e=>{if(e.currentTarget.ended)finish();}} onError={()=>setPlayback('error')} onTimeUpdate={e=>{setTime(e.currentTarget.currentTime);lastProgress.current=Date.now();}}><source src="/media/volteo-film-v4.mp4" type="video/mp4"/></video>
  {['blocked','waiting','error'].includes(playback)&&<div className="intro-playback-message" role="status"><p>{playback==='error'?'La vidéo n’a pas pu être chargée.':playback==='blocked'?'Lancez la lecture pour voir le film en entier.':'La vidéo attend de pouvoir reprendre.'}</p><button onClick={retry}>{playback==='error'?'Réessayer':'Reprendre la lecture'} ▷</button></div>}
  <div className="intro-top"><span className="intro-label">LE FILM VOLTÉO</span><div className="intro-controls"><button className="intro-skip" aria-pressed={!muted} onClick={toggleSound}>{muted?'Activer le son':'Couper le son'}</button><button ref={button} className="intro-skip" onClick={finish}>Passer l’intro <span>→</span></button></div></div>
  <div className="intro-bottom"><div className="intro-progress" aria-hidden="true"><i style={{transform:`scaleX(${duration?Math.min(time/duration,1):0})`}}/></div><span>{clock(time)} / {duration?clock(duration):'—'}</span></div>
 </section>;
}
