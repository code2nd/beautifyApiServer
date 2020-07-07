const Router = require('koa-router')

const { Docs } = require('../../models/docs')
const { Auth } = require('../../../middlewares/auth')
const { success } = require('../../../utils')
const { 
  NotEmptyValidator, 
  PositiveIntegerValidator 
} = require('../../validators/validator')

const router = new Router({
  prefix: '/v1/doc'
})

// 查询文档列表
router.get('/docs', new Auth().m, async (ctx) => {
  const { userId } = ctx.auth
  let docs = []
  if (ctx.session.docs) {
    const { update, data } = ctx.session.docs
    if (update) {
      const id = data[0].id
      const updatedDocs = await Docs.getUpdatedData(userId, id)
      docs = updatedDocs.concat(data)
    } else {
      docs = data
    }
  } else {
    docs = await Docs.getDocs(userId)
  }

  ctx.session.docs = {
    data: docs, 
    update: false
  }
  ctx.body = docs
})

// 查询单条数据记录
router.get('/oneDoc', new Auth().m, async (ctx) => {
  const v = await new PositiveIntegerValidator('id').validate(ctx)
  const { userId } = ctx.auth
  const doc = await Docs.getOneDoc(userId, v.get('query.id'))
  ctx.body = doc
})

// 游客查询文档列表
router.get('/visitorDocList', async (ctx) => {
  const docs = await Docs.getDocListVisitor()
  ctx.body = docs ? [docs] : []
})

// 新增
router.post('/docs', new Auth().m, async (ctx) => {
  const { userId } = ctx.auth
  const v = await new NotEmptyValidator('name', 'url', 'description').validate(ctx)
  const param = {
    name: v.get('body.name'),
    url: v.get('body.url'),
    description: v.get('body.description'),
    userId
  }
  await Docs.addDocs(param)
  ctx.session.docs.update = true
  success('添加成功', 0)
})

// 修改
router.put('/docs', new Auth().m, async (ctx) => {
  const { userId } = ctx.auth
  const v = await new NotEmptyValidator('id', 'name', 'description').validate(ctx)
  const id = v.get('body.id')
  const name = v.get('body.name')
  const description = v.get('body.description')
  const isExist = await Docs.getDocByName(userId, name, id)
  if (isExist) {
    throw new global.errs.FileNameExist()
  }

  const param = {
    id,
    name,
    description,
    userId
  }
  await Docs.updateDocs(param)
  const data = ctx.session.docs.data
  const aimItem = data[data.findIndex(item => item.id === id)]
  aimItem.name = name
  aimItem.description = description
  success('修改成功', 0)
})

// 删除
router.delete('/docs', new Auth().m, async (ctx) => {
  const { userId } = ctx.auth
  const v = await new PositiveIntegerValidator('id').validate(ctx)
  const id = v.get('query.id')
  await Docs.deleteDocs(userId, id)
  const data = ctx.session.docs.data
  data.splice(data.findIndex(item => item.id === id), 1)
  success('删除成功', 0)
})

// 根据文档名称查询文档（上传时判断上传的文件是否已经存在）
router.get('/name', new Auth().m, async (ctx) => {
  const { userId } = ctx.auth
  const v = await new NotEmptyValidator('name').validate(ctx)
  const doc = await Docs.getDocByName(userId, v.get('query.name'))
  ctx.body = doc
})

// 游客查询默认文档信息
router.get('/visitorDocInfo', async (ctx) => {
  const userId = null
  const doc = await Docs.getDocByName(userId, 'example')
  ctx.body = doc
})

module.exports = router