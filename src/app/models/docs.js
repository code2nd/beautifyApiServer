const fs = require('fs')
const { Sequelize, Model } = require('sequelize')
const { sequelize } = require('../../core/db')
const { deleteFile } = require('../../utils')

const Op = Sequelize.Op;

class Docs extends Model {
  // 查
  static async getDocs (userId) {
    /**
     * 1 每次取到的列表存入缓存，外加一个update字段表示当前是否有更新
     * 2 当有新上传文件时将列表缓存中的update字段置为true
     * 3 每次取完数据将update字段置为false
     * 4 如果缓存中的update为false则直接取缓存，否则查询数据库，但是只查id大于缓存中最大id的记录，然后合并返回，同时更新缓存
     */
    const docList = await Docs.findAll({
      attributes:{
        exclude:[
          'userId',
          'createdAt',
          'updatedAt'
        ]
      },
      where: {
        [Op.or]: [{userId}, {userId: null}]
      },
      order: [
        ['createdAt', 'DESC']
      ]
    })

    return docList
  }

  // 查 -- 根据userId和id获取一条数据
  static async getOneDoc (userId, id) {
    const doc = await Docs.findOne({
      attributes:{
        exclude:[
          'userId',
          'createdAt',
          'updatedAt'
        ]
      },
      where: {
        [Op.and]: [{userId}, {id}]
      }
    })

    return doc
  }

  // 查 -- 根据userId和id获取大于该id号的记录
  static async getUpdatedData (userId, id) {
    const doc = await Docs.findAll({
      attributes:{
        exclude:[
          'userId',
          'createdAt',
          'updatedAt'
        ]
      },
      where: {
        [Op.and]: [
          {userId},
          {
            id: {
              [Op.gt]: id
            }
          }
        ]
      }
    })

    return doc
  }

  // 获取文档列表（游客接口）
  static async getDocListVisitor () {
    const doc = await Docs.findOne({
      attributes:{
        exclude:[
          'userId',
          'createdAt',
          'updatedAt'
        ]
      },
      where: {
        userId: null
      }
    })

    return doc
  }

  // 增
  static async addDocs (param) {
    await Docs.create({
      ...param,
      isUpdate: 1
    })
  }

  // 改
  static async updateDocs (param) {
    const { userId, id, ...rest } = param

    const doc = await this.getOneDoc(userId, id)
    
    if (doc) {
      await Docs.update(rest, {
        where: {
          [Op.and]: [{userId}, {id}]
        }
      })
    } else {
      throw new global.errs.EditError()
    }
  }

  // 删
  static async deleteDocs (userId, id) {

    const doc = await this.getOneDoc(userId, id)

    if (!doc) {
      throw new global.errs.DeleteError()
    }

    await Docs.destroy({
      where: {
        id
      }
    })

    fs.exists(doc.url, async function(exists) {
      if (exists) {
        await deleteFile(doc.url)
      }
    })

    fs.exists(doc.wordUrl, async function(exists) {
      if (exists) {
        await deleteFile(doc.wordUrl)
      }
    })
  }

   // 覆盖文件修改数据信息
   static async shearDocs (userId, name, url) {
    await Docs.update({
      url,
      wordUrl: '',
      isUpdate: 1
    }, {
      where: {
        [Op.and]: [{userId}, {name}]
      }
    })
   }

  // 根据文件名称获取文件信息
  static async getDocByName (userId, name, id=null) {
    const idConfig = id ? {id: {[Op.ne]: id}} : null
    const doc = await Docs.findOne({
      attributes:{
        exclude:[
          'userId',
          'createdAt',
          'updatedAt'
        ]
      },
      where: {
        [Op.or]: [
          {
            userId,
            name
          },
          {
            userId: null,
            name
          }
        ],
        ...idConfig
      }
    })

    return doc
  }

  // 设置isUpdate
  static async setIsUpdate (url, value) {
    await Docs.update({
      isUpdate: value
    }, {
      where: {
        url
      }
    })
  }

  // 保存word文档路径
  static async saveWordUrl (userId, name, wordUrl) {
    await Docs.update({
      wordUrl
    }, {
      where: {
        [Op.and]: [{userId}, {name}]
      }
    })
  }
}

Docs.init({
  id: {
    type: Sequelize.INTEGER,
    primaryKey: true,
    allowNull: false,
    unique: true,
    autoIncrement: true
  },
  userId: Sequelize.INTEGER,
  name: Sequelize.STRING(64),
  description: Sequelize.STRING(64),
  url: Sequelize.STRING(128),
  wordUrl: Sequelize.STRING(128),
  deletable: Sequelize.BOOLEAN,
  isUpdate: Sequelize.BOOLEAN,
  createdAt: Sequelize.DATE,
  updatedAt:  Sequelize.DATE
}, {
  sequelize,
  tableName: 'docs'
})

module.exports = {
  Docs
}