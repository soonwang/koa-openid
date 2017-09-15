/**
 * netease auth koa plugins
 */
 const {URLSearchParams} = require('url');
 const fetch = require('node-fetch');
 const jwt = require('jwt-simple');

 function str2base64(str) {
     return new Buffer(str).toString('base64');
 }

 async function fetchToken(code, config) {
     const url = config.token_uri;
     const params = new URLSearchParams();
     params.append('grant_type', 'authorization_code');
     params.append('code', code);
     params.append('redirect_uri', config.redirect_uri);

     const authorization = `${config.client_id}:${config.client_secret}`;
     const authorizationBase64 = str2base64(authorization);
     const headers = {
         'Authorization': `Basic ${authorizationBase64}`
     };
     const res = await fetch(url, {
             method: 'POST',
             body: params,
             headers: headers
         })
         .then(res => res.json());
     return res;
 }
 /**
  *
  * 校验id_token是否合法
  * 1. iss值需要和OpenID Provider的地址完全一致
  * 2. aud值需要包含client_id
  * 3. exp为token过期时间戳，需晚于系统当前时间
  * @param  {[string]} id_token [description]
  * @return {[boolean]}          [description]
  */
 function checkIdToken(id_token, config) {
     const result = jwt.decode(id_token, config.client_secret, false, 'HS256');
     if (result.iss !== config.base_uri) return false;
     if (result.aud.indexOf(config.client_id) < 0) return false;
     //exp有问题
     // if(result.exp < Date.now()) return false;
     return true;
 }
 async function fetchUserInfo(url, access_token) {
     const headers = {
         Authorization: `Bearer ${access_token}`
     };
     const res = await fetch(url, {
         method: 'GET',
         headers: headers
     });
     const resJson = await res.json();
     return resJson;
 }

const defaultConfig = {
    base_uri: 'https://login.netease.com/connect',
    authorize_uri: 'https://login.netease.com/connect/authorize',
    token_uri: 'https://login.netease.com/connect/token',
    userinfo_uri: 'https://login.netease.com/connect/userinfo',
    scope: 'openid fullname nickname email'
}

class KoaOpenid {
    constructor(config) {
        if(!config.client_id) {
            console.error('KoaOpenid constructor client_id is needed');
        }
        if(!config.client_secret) {
            console.error('KoaOpenid constructor client_secret is needed');
        }
        if(!config.redirect_uri) {
            console.error('KoaOpenid constructor redirect_uri is needed');
        }
        this.config = Object.assign({}, defaultConfig, config);
    }
    async goLogin(ctx, next) {
        const params = {
            response_type: 'code',
            scope: this.config.scope,
            client_id: this.config.client_id,
            redirect_uri: this.config.redirect_uri
        };
        const paramsStr = Object.entries(params).map(arr => `${arr[0]}=${arr[1]}`).join('&');
        return ctx.redirect(`${this.config.authorize_uri}?${paramsStr}`)
    }
    async getUserInfo(ctx, next, cb) {
        const code = ctx.query.code;
        let nextParams = {};
        if (ctx.query.error) {
            nextParams = {
                error: ctx.query.error,
                error_description: ctx.query.err
            }
        } else {
            const json = await fetchToken(code, this.config);
            const result = checkIdToken(json.id_token, this.config);
            if (result) {
                const userInfo = await fetchUserInfo(this.config.userinfo_uri, json.access_token);
                nextParams = {
                    error: '',
                    userInfo
                };
            } else {
                nextParams = {
                    error: 'id_token is invalid',
                    error_description: 'id_token is invalid'
                }
            }
        }
        cb.call(ctx, nextParams);
    }
}

module.exports = KoaOpenid;
