import React,{useLayoutEffect,useRef} from 'react';
import {useLocation} from 'react-router-dom';
import './screen-deck.css';
export default function ScreenDeck({children}){
 const loc=useLocation(),viewport=useRef(null);
 useLayoutEffect(()=>{viewport.current?.scrollTo({left:0,top:0,behavior:'instant'});},[loc.pathname,loc.search]);
 return <div className="screen-deck is-scrollable"><div className="screen-viewport" ref={viewport} tabIndex={0} role="region" aria-label="Contenu de la rubrique"><div className="screen-pages">{children}</div></div></div>;
}
