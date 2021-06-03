const path = require('path')
const DirExists = require('../utils/models/dirExists')

const GITHUB_OAUTH_URL = 'https://github.com/login/oauth/authorize'
const SCOPE = 'user'
const client_id = '383ac64a98fca7cdd347'

module.exports = {
  // prod
  environment: 'dev',
  port: 3005,
  database: {
    dbName: 'beautifyApi',
    host: '47.106.21.30',
    port: 3306,
    user: 'root',
    password: 'jalamy2020'
  },
  security: {
    secretKey: 'dsa5151d*3%&@fGjcs)&egfr#grgb5', // jwt令牌加密随机字符串，越复杂无规律越好
    expiresIn: 60 * 60 * 24       // 令牌的过期时间，60*60代表的是一个小时
  },
  redis: {
    port: 6379,
    host: "47.106.21.30",
    password: "jalamy123456",
    db: 0
  },
  github: {
    request_token_url: 'https://github.com/login/oauth/access_token',
    client_id,
    client_secret: '787d7b14585faa0d04f5b985224266c8ef3e2013'
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