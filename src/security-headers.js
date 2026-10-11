export function securityHeaders(supabaseUrl,{analytics=false,ads=false}={}){
 const url=new URL(supabaseUrl);if(url.protocol!=='https:'||!url.hostname.endsWith('.supabase.co'))throw new Error('Invalid Supabase origin');
 const scripts=["'self'"],connect=["'self'",url.origin],images=["'self'",'data:','https://tile.openstreetmap.org'];
 if(analytics||ads)scripts.push('https://www.googletagmanager.com');
 if(analytics)connect.push('https://*.google-analytics.com','https://*.analytics.google.com','https://www.googletagmanager.com');
 if(ads){connect.push('https://www.googleadservices.com','https://googleads.g.doubleclick.net','https://www.google.com');images.push('https://www.googleadservices.com','https://googleads.g.doubleclick.net','https://www.google.com');}
 return {'Content-Security-Policy':`default-src 'self'; script-src ${scripts.join(' ')}; style-src 'self' 'unsafe-inline'; font-src 'self'; img-src ${images.join(' ')}; connect-src ${connect.join(' ')}; media-src 'self'; object-src 'none'; frame-ancestors 'none'; base-uri 'self'; form-action 'self'`,'X-Content-Type-Options':'nosniff','X-Frame-Options':'DENY','Referrer-Policy':'no-referrer','Permissions-Policy':'camera=(), microphone=(), geolocation=(self)','Strict-Transport-Security':'max-age=31536000'};
}
