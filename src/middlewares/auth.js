class Auth {
  constructor (level) {
    this.level = level || 1  // level表现api的级别，也就是api的权限数字
    Auth.USER = 8
    Auth.ADMIN = 16
    Auth.SUPER_ADMIN = 32
  }

  get m () {
    return async (ctx, next) => {
      
      if (ctx.session.userInfo) {
        const { authLevel } = ctx.session.userInfo
        const userId = ctx.session.userInfo.id || ctx.session.userInfo.userId
  
        if (authLevel < this.level) {
          throw new global.errs.Forbbiden('权限不足')
        }
  
        ctx.auth = {
          userId,
          authLevel
        }
      } else {
        // 未登录
        throw new global.errs.Forbbiden('未登录')
      }

      await next()
    }
  }
}

module.exports = {
  Auth
}