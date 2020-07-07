const axios = require('axios')

const config = require('../../config/config')
const { User } = require('../models/user')

const { 
  client_id, 
  client_secret, 
  request_token_url 
} = config.github

/**
 *  1 获取code
 *    https://github.com/login/oauth/authorize?client_id=383ac64a98fca7cdd347&scope=user
 *    结果：http://localhost:8080/oauth/redirect?code=c1600eb680a601336507
 *  2 根据cliend_id, cliend_secret, code 获取access-token
 *    POST https://github.com/login/oauth/access_token
 *  3 通过access_token获取userInfo
 *    https://api.github.com/user
 */

module.exports = app => {
  app.use(async (ctx, next) => {
    if (ctx.path === '/auth') {
      const code = ctx.query.code
      if (!code) {
        ctx.body = 'code not exist'
        return
      }
      const result = await axios({
        method: 'POST',
        url: request_token_url,
        data: {
          client_id,
          client_secret,
          code,
        },
        headers: {
          Accept: 'application/json',
        },
      })

      // console.log(result.status, result.data)

      if (result.status === 200 && (result.data && !result.data.error)) {
        ctx.session.githubAuth = result.data

        const { access_token, token_type } = result.data

        const userInfoResp = await axios({
          method: 'GET',
          url: 'https://api.github.com/user',
          headers: {
            Authorization: `${token_type} ${access_token}`,
          },
        })

        const gitUserInfo = userInfoResp.data
        const userInfo = {
          userId: gitUserInfo.id,
          username: gitUserInfo.name,
          avatarUrl: gitUserInfo.avatar_url,
          authType: 'github'
        }
        ctx.session.userInfo = userInfo

        await User.registerByGithub(userInfo)

        // 前后端分离应用，此处需要生成一个html页面返回前端而非重定向
        await ctx.render("loading", {  //将views目录下的loading.hbs内容渲染到页面中去
          bearer: token_type,  //往loading.hbs里传参
          token: access_token,
          domain: config.environment === 'dev' ? 'http://localhost:9000' : 'http://www.jalamy.cn'
        });

        /* ctx.redirect((ctx.session && ctx.session.urlBeforeOAuth) || 'http://localhost:9000/')
        ctx.session.urlBeforeOAuth = '' */
      } else {
        const errorMsg = result.data && result.data.error
        ctx.body = `request token failed ${errorMsg}`
      }
    } else {
      await next()
    }
  })

  app.use(async (ctx, next) => {
    const path = ctx.path
    const method = ctx.method
    if (path === '/logout' && method === 'POST') {
      ctx.session = null
      ctx.body = `logout success`
    } else {
      await next()
    }
  })

  app.use(async (ctx, next) => {
    const path = ctx.path
    const method = ctx.method
    if (path === '/prepare-auth' && method === 'GET') {
      // ctx.session = null
      // ctx.body = `logout success`
      const { url } = ctx.query
      ctx.session.urlBeforeOAuth = url
      // ctx.body = 'ready'
      ctx.redirect(config.OAUTH_URL)
    } else {
      await next()
    }
  })
}
