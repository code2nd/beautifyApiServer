const path = require('path')
const DirExists = require('../utils/models/dirExists')

const GITHUB_OAUTH_URL = 'https://github.com/login/oauth/authorize'
const SCOPE = 'user'
const client_id = 'your client_id'

module.exports = {
  // prod
  environment: 'dev',
  port: 3005,
  database: {
    dbName: 'your dbName',
    host: 'your host',
    port: 3306,
    user: 'root',
    password: 'your password'
  },
  security: {
    secretKey: '25ccdlkmxksmk5%%%3ds', // jwt令牌加密随机字符串，越复杂无规律越好
    expiresIn: 60*60*24       // 令牌的过期时间，60*60代表的是一个小时
  },
  redis: {
    port: 6379,
    host: "127.0.0.1",
    password: "your password",
    db: 0
  },
  github: {
    request_token_url: 'https://github.com/login/oauth/access_token',
    client_id,
    client_secret: 'your client_secret'
  },
  GITHUB_OAUTH_URL,
  OAUTH_URL: `${GITHUB_OAUTH_URL}?client_id=${client_id}&scope=${SCOPE}`,
  AUTH_LEVEL: {
    USER: 8,
    ADMIN: 16,
    SUPER_ADMIN: 32
  },
  uploadDir: new DirExists().createDir(path.join(__dirname, '../../files'))
}