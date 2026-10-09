import React,{useEffect,useLayoutEffect,useRef,useState,useSyncExternalStore} from 'react';
import {useLocation} from 'react-router-dom';
import {subscribeNetwork,networkSnapshot} from './api';
import {Icon} from './Experience';
import './screen-deck.css';
const positions=new Map();
// Only guided journeys use horizontal pages; consultation pages scroll inside the workspace.
const pagedRoutes=new Set(['/diagnostic', '/projet']);
export default function ScreenDeck({children}){
 const loc=useLocation(),key=loc.pathname+loc.search,viewport=useRef(null),content=useRef(null),flash=useRef(null),[desktop,setDesktop]=useState(()=>matchMedia('(min-width: 901px)').matches),[page,setPage]=useState(0),[total,setTotal]=useState(1),pending=useSyncExternalStore(subscribeNetwork,networkSnapshot,()=>0);
 const paged=desktop&&pagedRoutes.has(loc.pathname);
 const pulse=()=>{if(matchMedia('(prefers-reduced-motion: reduce)').matches)return;flash.current?.getAnimations().forEach(x=>x.cancel());flash.current?.animate([{opacity:0,transform:'translateX(-100%)'},{opacity:.9,offset:.2},{opacity:0,transform:'translateX(120%)'}],{duration:360,easing:'ease-out'});};
 useEffect(()=>{const m=matchMedia('(min-width: 901px)');const change=()=>setDesktop(m.matches);m.addEventListener('change',change);return()=>m.removeEventListener('change',change);},[]);
 const go=next=>{const el=viewport.current;if(!el)return;const n=Math.max(0,Math.min(total-1,next));el.scrollTo({left:n*(el.clientWidth+32),top:0,behavior:'instant'});setPage(n);positions.set(key,n);pulse();};
 useLayoutEffect(()=>{
  const el=viewport.current,body=content.current;if(!el||!body)return;let frame;
  if(!paged){setTotal(1);setPage(0);el.scrollTo({left:0,top:0,behavior:'instant'});body.style.removeProperty('--screen-width');return;}
  const measure=()=>{cancelAnimationFrame(frame);frame=requestAnimationFrame(()=>{const width=el.clientWidth;body.style.setProperty('--screen-width',width+'px');const count=Math.max(1,Math.round((body.scrollWidth+32)/(width+32)));setTotal(count);const n=Math.min(positions.get(key)||0,count-1);el.scrollTo({left:n*(width+32),top:0,behavior:'instant'});setPage(n);});};
  measure();const resize=new ResizeObserver(measure);resize.observe(el);const mutation=new MutationObserver(measure);mutation.observe(body,{childList:true,characterData:true,subtree:true,attributes:true,attributeFilter:['open']});body.addEventListener('load',measure,true);
  return()=>{cancelAnimationFrame(frame);resize.disconnect();mutation.disconnect();body.removeEventListener('load',measure,true);};
 },[key,paged]);
 useEffect(()=>{pulse();},[key]);
 useEffect(()=>{const clicked=e=>{if(e.target.closest('.workspace')&&e.target.closest('a,button,summary,input,select'))pulse();};document.addEventListener('click',clicked,true);return()=>document.removeEventListener('click',clicked,true);},[]);
 useEffect(()=>{if(pending)pulse();},[pending]);
 return <div className={'screen-deck'+(paged?' is-paged':' is-scrollable')} onClickCapture={e=>{if(e.target.closest('a,button,summary,input[type="checkbox"],input[type="radio"],select'))pulse();}}><div className="electric-sweep" ref={flash} aria-hidden="true"><Icon name="bolt" size={22}/></div><div className="screen-viewport" ref={viewport} tabIndex={paged?undefined:0} role="region" aria-label="Contenu de la rubrique" onFocusCapture={e=>{if(!paged||!e.target.matches('input,select,textarea,button,a,summary'))return;const el=viewport.current,frame=el.getBoundingClientRect(),target=e.target.getBoundingClientRect();if(target.left<frame.left-1||target.right>frame.right+1)go(Math.floor((target.left-frame.left+el.scrollLeft)/(el.clientWidth+32)));}} onScroll={e=>{if(!paged)return;const el=e.currentTarget,n=Math.round(el.scrollLeft/(el.clientWidth+32));setPage(n);positions.set(key,n);}}><div className="screen-pages" ref={content}>{children}</div></div>{paged&&total>1&&<nav className="screen-pagination" aria-label="Navigation dans cette rubrique"><button className="secondary" onClick={()=>go(page-1)} disabled={page===0}><Icon name="back" size={16}/><span>Précédent</span></button><span role="status">Vue <b>{page+1}</b> / {total}<small>{total>1?'Suite du contenu dans cette rubrique':'Tout votre contenu à l’écran'}</small></span><button className="secondary" onClick={()=>go(page+1)} disabled={page>=total-1}><span>Suivant</span><Icon name="arrow" size={16}/></button></nav>}</div>;
}
