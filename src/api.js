import {cloudApi} from './supabase';
import {trackEvent} from './measurement';
import {createApi} from './api-core.js';
export const {api,publicSnapshot,clearPublicCache,subscribeNetwork,networkSnapshot}=createApi(async(path,method,data)=>{const result=await cloudApi(path,method,data);if(path==='/leads'&&method==='POST'&&data?.offer_id&&result?.id){try{trackEvent('generate_lead',{transaction_id:result.id});}catch{/* Measurement must never invalidate a recorded request. */}}return result;});
// Components keep this compatibility hook; cloud calls use bearer tokens, never local cookies.
export function setCsrf(){}
