import { cleanDuelinkToken, encryptToken, getRequestUser, tokenHint } from './_duelink-token-store.js';
import { json, jsonError, readJsonBody, HttpError } from './_http.js';
import { requestDuelsJson } from './_duels-client.js';
export default async function handler(req, res) {
  try {
    if (!['GET','POST','DELETE'].includes(req.method)) { res.setHeader('Allow', 'GET,POST,DELETE'); throw new HttpError(405, 'Méthode non autorisée.'); }
    const { client, user } = await getRequestUser(req);
    if (req.method === 'GET') {
      const { data, error } = await client.from('duelink_connections').select('token_hint,expires_at,last_sync_at,created_at,updated_at,duels_user_id,auth_method,scopes').eq('user_id',user.id).eq('provider','duelink').maybeSingle();
      if (error) throw error;
      const expired = Boolean(data?.expires_at && new Date(data.expires_at).getTime() <= Date.now());
      return json(res,200,{success:true,connected:Boolean(data)&&!expired,expired,connection:data??null});
    }
    if (req.method === 'DELETE') {
      const {error}=await client.from('duelink_connections').delete().eq('user_id',user.id).eq('provider','duelink');
      if(error)throw error;return json(res,200,{success:true,connected:false});
    }
    const body=await readJsonBody(req),token=cleanDuelinkToken(body.token);
    if(!token||token.length>8192||/[\r\n\x00-\x20]/.test(token))throw new HttpError(400,'Format de jeton Duels.ink invalide.','TOKEN_INVALID');
    const profile=await requestDuelsJson('/api/me',{token});
    const duelsUserId=profile.id || profile.user?.id;
    if(typeof duelsUserId!=='string' || !duelsUserId || duelsUserId.length>128)throw new HttpError(502,'Profil Duels.ink non reconnu.');
    const scopes=profile.token?.scopes;
    if(scopes!==undefined && scopes!==null && (!Array.isArray(scopes) || ['profile','match_history:read','replays:read'].some(scope=>!scopes.includes(scope)))) throw new HttpError(400,'Ce jeton doit autoriser le profil, l’historique et les replays.');
    let expiresAt=null;
    if(body.expires_at){const d=new Date(body.expires_at);if(Number.isNaN(d.getTime())||d.getTime()<=Date.now())throw new HttpError(400,'Date d’expiration invalide.');expiresAt=d.toISOString();}
    if(profile.token?.expiresAt){
      const remoteExpiry=Date.parse(profile.token.expiresAt);
      if(!Number.isFinite(remoteExpiry)||remoteExpiry<=Date.now())throw new HttpError(401,'Le jeton Duels.ink a expiré.','DUELS_RECONNECT');
      expiresAt=new Date(Math.min(remoteExpiry,expiresAt?Date.parse(expiresAt):Infinity)).toISOString();
    }
    const {data,error}=await client.from('duelink_connections').upsert({user_id:user.id,provider:'duelink',encrypted_token:encryptToken(token,user.id),token_hint:tokenHint(token),expires_at:expiresAt,duels_user_id:duelsUserId,auth_method:profile.token?.clientId?'oauth':'personal_token',scopes:Array.isArray(scopes)?scopes:null,updated_at:new Date().toISOString()},{onConflict:'user_id,provider'}).select('token_hint,expires_at,last_sync_at,created_at,updated_at,duels_user_id,auth_method,scopes').single();
    if(error)throw error;return json(res,200,{success:true,connected:true,connection:data});
  }catch(error){return jsonError(res,error);}
}
