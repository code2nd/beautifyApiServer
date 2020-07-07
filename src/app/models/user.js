const bcrypt = require('bcryptjs')
const { Sequelize, Model } = require('sequelize')
const { sequelize } = require('../../core/db')

const salt = bcrypt.genSaltSync(10)

class User extends Model {

  static async registerByUsername (data) {
    let { username, password } = data

    const hash = bcrypt.hashSync(password, salt)
    password = hash

    return await User.create({
      username,
      password,
      authType: 'username'
    })
  }

  static async registerByGithub (data) {
    const user = await User.getUserInfoByUsername(data.username)
    if (!user) {
      return await User.create({
        ...data
      })
    } else {
      return null
    }
  }

  static async loginByUsername (userInfo) {
    const { username, password } = userInfo
    const user = await User.findOne({
      where: {
        username
      }
    })

    if (!user) {
      throw new global.errs.AuthFailed('账号不存在')
    } else if (!user.dataValues.password) {
      throw new global.errs.AuthFailed('该账号为第三方登录账号')
    }

    const correct = bcrypt.compareSync(password, user.password)
    if (!correct) {
      throw new global.errs.AuthFailed('密码不正确')
    }

    return user
  }

  static async getUserInfoByUsername (username) {
    const user = await User.findOne({
      attributes:[
        'id',
        'username',
        'avatarUrl',
        'authType'
      ],
      where: {
        username
      }
    })

    return user
  }

  static async getUsers(param) {
    const { page, pageSize } = param
    const users = await User.findAll({
      attributes: [
        'username',
        'avatarUrl',
        'authLevel',
        'authType',
        'createdAt'
      ],
      offset: (page-1)*pageSize,
      limit: pageSize
    })

    return users
  }
}

User.init({
  id: {
    type: Sequelize.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  userId: {
    type: Sequelize.INTEGER,
    unique: true,
  },
  username: {
    type: Sequelize.STRING(32),
    unique: true
  },
  password: Sequelize.STRING(64),
  avatarUrl: Sequelize.STRING(64),
  authType: Sequelize.STRING(16),
  authLevel: Sequelize.INTEGER,
  createdAt: Sequelize.DATE,
  updatedAt: Sequelize.DATE
}, {
  sequelize,
  tableName: 'user'
})

module.exports = {
  User
}