const { Sequelize, Model } = require('sequelize')
const { sequelize } = require('../../core/db')

const Op = Sequelize.Op

class AuthMenu extends Model {
  static async getAuthMenu (authLevel) {
    const authMenu = await AuthMenu.findAll({
      attributes:[
        'id',
        'key',
        'title',
        'icon'
      ],
      where: {
        authLevel: {
          [Op.lte]: authLevel
        }
      }
    })

    return authMenu
  }
}

AuthMenu.init({
  id: {
    type: Sequelize.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  key: {
    type: Sequelize.STRING(16),
    unique: true,
  },
  title: {
    type: Sequelize.STRING(10),
    unique: true
  },
  icon: Sequelize.STRING(10),
  authLevel: Sequelize.INTEGER,
  createdAt: {
    type: Sequelize.DATE
  },
  updatedAt: {
    type: Sequelize.DATE
  }
}, {
  sequelize,
  tableName: 'authMenu'
})

module.exports = {
  AuthMenu
}