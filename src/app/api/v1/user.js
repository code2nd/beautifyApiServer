const Router = require('koa-router')

const { 
  RegisterValidator, 
  LoginValidator, 
  GetUsersValidator
} = require('../../validators/validator')
const { User } = require('../../models/user')
const { success } = require('../../../utils')
const { Auth } = require('../../../middlewares/auth')
const Config = require('../../../config/config')

const { AUTH_LEVEL: { USER, ADMIN, SUPER_ADMIN } } = Config

const router = new Router({
  prefix: '/v1/user'
})

// 注册(用户名注册)
router.post('/register', async (ctx) => {
  const v = await new RegisterValidator().validate(ctx)
  const user = {
    username: v.get('body.username'),
    password: v.get('body.password2')
  }

  await User.registerByUsername(user)
  success()
})

// github授权信息录入
router.post('/github', async (ctx) => {
  const res = await User.registerByGithub(ctx.body)
  if (res) {
    success()
  } else {
    await ctx.render("exist")
  }
})

// 登录 (用户名密码登录)
router.post('/login', async (ctx) => {
  const v = await new LoginValidator('username', 'password').validate(ctx)
  const user = {
    username: v.get('body.username'),
    password: v.get('body.password')
  }

  const userInfo = await User.loginByUsername(user)
  ctx.session.userInfo = userInfo
  success()
})

// 退出登录
router.post('/logout', new Auth().m, async (ctx) => {
  // console.log(ctx.session)
  ctx.session = null
  success('退出登录成功')
})

// 获取用户信息
router.get('/userInfo', async (ctx) => {
  let sendData = {}
  const userInfo = ctx.session.userInfo
  if (userInfo) {
    const { username, avatarUrl } = userInfo
    sendData = {
      isLogin: true,
      username,
      avatarUrl
    }
  } else {
    sendData = { isLogin: false }
  }
  ctx.body = sendData
})

// 获取用户列表
router.get('/users', new Auth(ADMIN).m, async (ctx) => {
  const v = await new GetUsersValidator('page', 'pageSize').validate(ctx)
  const param = {
    page: v.get('query.page') || 1,
    pageSize: v.get('query.pageSize') || 10
  }
  const users = await User.getUsers(param)
  ctx.body = users ? users : []
})

module.exports = router