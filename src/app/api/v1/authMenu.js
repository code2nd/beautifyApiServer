const Router = require('koa-router')

const { AuthMenu } = require('../../models/authMenu')
const { Auth } = require('../../../middlewares/auth')

const router = new Router({
  prefix: '/v1'
})

// 获取menu
router.get('/menu', new Auth().m, async (ctx) => {
  const { authLevel } = ctx.auth
  const res = await AuthMenu.getAuthMenu(authLevel)
  ctx.body = res || []
})

module.exports = router