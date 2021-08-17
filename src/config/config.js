const path = require('path')
const DirExists = require('../utils/models/dirExists')

const GITHUB_OAUTH_URL = 'https://github.com/login/oauth/authorize'
const SCOPE = 'user'
const client_id = '383ac64a9adadad8fca7asacadadaddd3adada47dsdsda'

module.exports = {
  // prod
  environment: 'dev',
  port: 3005,
  database: {
    dbName: 'your dbName',
    host: 'your host',
    port: 'your port',
    user: 'your username',
    password: 'your password'
  },
  security: {
    secretKey: 'doodfsssdadajdofjodfjofe$DS#$#$^SD', // jwt令牌加密随机字符串，越复杂无规律越好
    expiresIn: 60 * 60 * 24       // 令牌的过期时间，60*60代表的是一个小时
  },
  redis: {
    port: 'your port',
    host: 'your host',
    password: "your password",
    db: 0
  },
  github: {
    request_token_url: 'https://github.com/login/oauth/access_token',
    client_id,
    client_secret: 'dfdfddadasf787d7asdadab14585faa0d04dfdfadaf5b9852fddfdf24266c8ef3e201dfdf3'
  },
  GITHUB_OAUTH_URL,
  OAUTH_URL: `${GITHUB_OAUTH_URL}?client_id=${client_id}&scope=${SCOPE}`,
  AUTH_LEVEL: {
    USER: 8,
    ADMIN: 16,
    SUPER_ADMIN: 32
  },
  uploadDir: new DirExists().createDir(path.join(__dirname, '../../../files')),
  // fileServer: 'https://www.jalamy.cn:9002/'
}
