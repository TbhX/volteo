export const allowedEvents=new Set(['landing_cta','budget_open','diagnostic_open','view_catalogue','generate_lead']);
export const campaignNames=new Set(['budget','recharge','essai_ulis']);
export function eventPayload(name,params={}){
 if(!allowedEvents.has(name))return null;
 const payload={};if(campaignNames.has(params.campaign))payload.campaign=params.campaign;
 if(name==='generate_lead'&&/^[a-zA-Z0-9-]{1,80}$/.test(params.transaction_id||''))payload.transaction_id=params.transaction_id;
 return payload;
}
export function consentState(value){return{analytics:value?.analytics===true,ads:value?.ads===true};}
export function consentCommands(value){const c=consentState(value);return{analytics_storage:c.analytics?'granted':'denied',ad_storage:c.ads?'granted':'denied',ad_user_data:c.ads?'granted':'denied',ad_personalization:'denied'};}
export function safeCampaign(search){const p=new URLSearchParams(search);const campaign=p.get('utm_campaign');return campaignNames.has(campaign)?campaign:'';}
