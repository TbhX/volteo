import {eventPayload,consentState,consentCommands,safeCampaign} from './measurement-core';
const env=import.meta.env;
export const measurementConfig={ga:/^G-[A-Z0-9]+$/.test(env.VITE_GA4_ID||'')?env.VITE_GA4_ID:'',ads:/^AW-\d+$/.test(env.VITE_GOOGLE_ADS_ID||'')?env.VITE_GOOGLE_ADS_ID:'',label:/^[A-Za-z0-9_-]+$/.test(env.VITE_GOOGLE_ADS_LEAD_LABEL||'')?env.VITE_GOOGLE_ADS_LEAD_LABEL:''};
export const measurementEnabled=!!(measurementConfig.ga||measurementConfig.ads);
const KEY='volteo-consent-v1',AGE=180*86400000;
let choice={analytics:false,ads:false},loaded=false,initialized=new Set(),sent=new Set();
export function readConsent(){try{const v=JSON.parse(localStorage.getItem(KEY)||'null');if(v?.version===1&&v.at<=Date.now()&&Date.now()-v.at<AGE)return consentState(v);}catch{}return null;}
function command(){window.dataLayer.push(arguments);}
function init(){
 const activeIds=[choice.analytics&&measurementConfig.ga,choice.ads&&measurementConfig.ads].filter(Boolean);
 if(!activeIds.length)return;
 if(!loaded){window.dataLayer=window.dataLayer||[];command('consent','default',consentCommands({}));command('consent','update',consentCommands(choice));command('set','ads_data_redaction',true);command('js',new Date());loaded=true;}
 command('consent','update',consentCommands(choice));
 const config={send_page_view:false,allow_google_signals:false,allow_ad_personalization_signals:false,page_location:location.origin+location.pathname,page_referrer:''};
 for(const id of activeIds)if(!initialized.has(id)){command('config',id,config);initialized.add(id);}
 if(!document.getElementById('volteo-google-tag')){const script=document.createElement('script');script.id='volteo-google-tag';script.async=true;script.src='https://www.googletagmanager.com/gtag/js?id='+encodeURIComponent(activeIds[0]);document.head.append(script);}
}
export function applyConsent(value,persist=true){choice=consentState(value);if(persist){try{localStorage.setItem(KEY,JSON.stringify({...choice,version:1,at:Date.now()}));}catch{}}
 if(loaded)command('consent','update',consentCommands(choice));
 if(!choice.analytics&&!choice.ads){try{sessionStorage.removeItem('volteo-campaign');}catch{}}
 init();window.dispatchEvent(new Event('volteo-consent'));
}
export function trackEvent(name,params={}){
 const payload=eventPayload(name,params);if(!payload||!measurementEnabled||(!choice.analytics&&!choice.ads))return;
 const id=name==='generate_lead'?payload.transaction_id:'';
 if(name==='generate_lead'&&!id)return;
 if(id&&sent.has(id))return;
 init();if(!loaded)return;if(id)sent.add(id);
 const campaign=safeCampaign(location.search);if(campaign){try{sessionStorage.setItem('volteo-campaign',campaign);}catch{}}
 let saved='';try{saved=sessionStorage.getItem('volteo-campaign')||'';}catch{}
 const common={...payload,...(saved?{campaign:safeCampaign('?utm_campaign='+encodeURIComponent(saved))}:{}),page_location:location.origin+location.pathname,page_referrer:'',page_title:'VOLTÉO'};
 if(choice.analytics&&measurementConfig.ga)command('event',name,{...common,send_to:measurementConfig.ga});
 if(name==='generate_lead'&&choice.ads&&measurementConfig.ads&&measurementConfig.label)command('event','conversion',{...common,send_to:measurementConfig.ads+'/'+measurementConfig.label});
}
export function openConsent(){window.dispatchEvent(new Event('volteo-open-consent'));}
