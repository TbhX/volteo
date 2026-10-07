import {cloudApi} from './supabase';
import {createApi} from './api-core.js';
export const {api,publicSnapshot,clearPublicCache,subscribeNetwork,networkSnapshot}=createApi(cloudApi);
// Components keep this compatibility hook; cloud calls use bearer tokens, never local cookies.
export function setCsrf(){}
