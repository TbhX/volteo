import {useEffect,useRef} from 'react';
// Never overlaps requests; pauses hidden tabs and checks again on return/connection.
export function usePolling(callback,interval,enabled=true){
 const latest=useRef(callback);latest.current=callback;
 useEffect(()=>{if(!enabled)return;let running=false,stopped=false;
  const run=async()=>{if(stopped||running||document.hidden||navigator.onLine===false)return;running=true;try{await latest.current();}finally{running=false;}};
  const timer=setInterval(run,interval);document.addEventListener('visibilitychange',run);window.addEventListener('online',run);
  return()=>{stopped=true;clearInterval(timer);document.removeEventListener('visibilitychange',run);window.removeEventListener('online',run);};
 },[interval,enabled]);
}
