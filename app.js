const Koa = require('koa')
const bodyParser = require('koa-bodyparser')
const session = require('koa-session')
const Redis = require('ioredis')
const views = require('koa-views')
const { join } = require("path")
const config = require('./src/config/config')
const InitManager = require('./src/core/init')
const catchError = require('./src/middlewares/exeption')
const auth = require('./src/app/services/auth')
const redisConfig = require('./src/config/config').redis
const DirExists = require('./src/utils/models/dirExists')


const SessionStore = require('./src/app/services/sessionStore')

require('./src/app/models/user')

const app = new Koa()

app.keys = ['beautify api application']

// 创建redis client
const redis = new Redis(redisConfig)

const SESSION_CONFIG = {
  key: 'SESSIONID',
  maxAge: 1000*60*60*24,
  store: new SessionStore(redis)
}

// 创建用于存储上传文件的文件夹（如果没有的话就创建）
// console.log(config.uploadDir)
new DirExists().createDir(config.uploadDir)

app.use(views(join(__dirname + '/src/views'), {
  extension: "hbs",  //使用Handlebars模板引擎
  map: { 
    hbs: 'handlebars' 
  }
}))

app.use(catchError)

app.use(bodyParser())

app.use(session(SESSION_CONFIG, app))
auth(app)

process.cwd()
InitManager.initCore(app)


app.listen(config.port, () => {
  console.log(`app running at port ${config.port}`)
})