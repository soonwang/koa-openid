# koa-openid

## Installation

```js
    npm i koa-openid -S
```

## Example
```js
const Koa = require('koa');
const router = require('koa-router')();
const Openid = require('koa-openid');

const app = new Koa();
const openidConfig = {
    client_id: '****',
    client_secret: '****',
    redirect_uri: 'http://hostname/login'
};
const openid = new Openid(openidConfig);

router.get('/', async function(ctx, next) {
    //判断用户未登录
    if(true) {
        return await openid.goLogin(ctx);
    }
});
router.get('/login', async function(ctx, next) {
    return await openid.getUserInfo(ctx, next, function(result) {
        if(!result.error) {
            console.log(result.userInfo);
        }
    })
})
```

## API

### CONFIG
```js
{
    client_id: '****',  //必须
    client_secret: '****', //必须
    redirect_uri: 'http://hostname/login', //必须 登录成功后，Openid重定向地址
    scope: 'openid fullname nickname email', //具体查看文档https://login.netease.com/download/oidc_docs/flow/authorization_request.html
    base_uri: 'https://login.netease.com/connect', //OpenId Provider 的地址
    authorize_uri: 'https://login.netease.com/connect/authorize', //认证授权请求地址
    token_uri: 'https://login.netease.com/connect/token', //Token Endpoint 应用请求Token地址
    userinfo_uri: 'https://login.netease.com/connect/userinfo' //获取用户信息地址
}
```
