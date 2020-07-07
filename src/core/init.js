const requireDirectory = require('require-directory')     // 路由自动加载
const Router = require('koa-router')

class InitManager {
  static initCore (app) {
    // 入口方法
    InitManager.app = app
    InitManager.initLoadRouter()
    InitManager.loadHttpException()
    InitManager.loadConfig()
  }

  static loadConfig(path = '') {
    const configPath = path || process.cwd() + '/src/config/config.js'
    const config = require(`${configPath}`)
    global.config = config
  }

  static initLoadRouter () {
    // process.cwd() 取文件所在的绝对路径
    const appApiDirectory = `${process.cwd()}/src/app/api`
    /**
     * 1 第一个固定参数module
     * 2 第二个要加载的模块的文件路径
     * 3 第三个注册每个路由之前执行的业务代码
     */
    requireDirectory(module, appApiDirectory, {
      visit: whenLoadModule
    })

    function whenLoadModule (obj) {
      if (obj instanceof Router) {
        InitManager.app.use(obj.routes())
      }
    }
  }

  // 将异常处理绑定到全局global上，以便调用
  static loadHttpException () {
    const errors = require('./http-exception')
    global.errs = errors
  }
}

module.exports = InitManager