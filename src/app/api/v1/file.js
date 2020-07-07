/**
 * 文件相关，上传，删除等
 */

 const multiparty = require('multiparty')
 const fs = require('fs')
 const path = require('path')
 const koaSend = require('koa-send')
 const { success } = require('../../../utils')
 const { environment } = require('../../../config/config')

 const Router = require('koa-router')
 const { Auth } = require('../../../middlewares/auth')
 const { NotEmptyValidator } = require('../../validators/validator')
 const { Docs } = require('../../models/docs')
 const { deleteFile, shearFile } = require('../../../utils')
 const DirExists = require('../../../utils/models/dirExists')
 const { uploadDir } = require('../../../config/config')
 const { jsonToWord } = require('../../../utils/jsonToWord')

 const router = new Router({
   prefix: '/v1/file'
 })

 const isDev = environment === 'dev' ? true : false

 // 上传文件存放路径
 const fileDir = new DirExists()

 // 上传文件(包括文档上传和用户头像上传)
router.post('/upload', new Auth().m,  async (ctx) => {
  const uploadFile = () => {
    let sendData = {}
    return new Promise((resolve, reject) => {
      // 存放临时文件
      const form = new multiparty.Form({uploadDir})
      form.parse(ctx.req, async (err, fields, files) => {
        if (err) {
          sendData = {
            msg: '上传失败',
            code: 2001
          }
          resolve(sendData)
        } else {
          const fileInfo = files && files.file && files.file[0]

          if (fileInfo) {

            const { originalFilename, path: filePath } = fileInfo

            const { name: realName } = path.parse(originalFilename)
            const { dir: purePath, base: fileName } = path.parse(filePath)

            const { userId } = ctx.auth
            let destPath = ''
            // let destWordPath = ''

            switch (fields.type[0]) {
              case 'doc': 
                // 处理文档上传

                if (realName === 'example') {
                  await deleteFile(filePath) 
                  reject('文件名不允许与系统默认文件名相同')
                }

                const docPath = isDev ? fileDir.createDir(`${purePath}\\docs\\json`) : fileDir.createDir(`${purePath}/docs/json`)
                destPath = isDev ? `${docPath}\\${fileName}` : `${docPath}/${fileName}`

                const res = await Docs.getDocByName(userId, realName)

                if (res) {
                  sendData = {
                    isExist: true,
                    type: 'docs',
                    url: destPath,
                    // wordUrl: destWordPath,
                    name: realName,
                    id: res.id,
                    description: res.description,
                    originUrl: res.url,
                    filePath
                  }
                  resolve(sendData)
                } else {
                  await shearFile(filePath, destPath)
                  resolve({
                    isExist: false,
                    url: destPath,
                    // wordUrl: destWordPath,
                    name: realName
                  })
                }
                break
              case 'avatar': 
                // 处理头像上传
                destPath = `${fileDir.createDir(`${purePath}/avatars`)}/${fileName}`
                await shearFile(filePath, destPath)
                // 修改用户表中的头像地址
                break
              default: break
            }
          } else {
            sendData = {
              msg: "未上传文件",
              code: 2002
            }
            resolve(sendData)
          }
        }
      })
    })
  }

  try {
    const res = await uploadFile()
    ctx.body = res
  } catch (err) {
    throw new global.errs.Forbbiden(err)
  }
  
})

// 覆盖文件
router.post('/cover', new Auth().m, async (ctx) => {
  const { userId } = ctx.auth
  const v = await new NotEmptyValidator('name', 'url', 'filePath').validate(ctx)
  const name = v.get('body.name')
  const filePath = v.get('body.filePath')
  const purePath = path.dirname(filePath)
  const fileName = path.basename(filePath)
  const destPath = isDev ? `${purePath}\\docs\\json\\${fileName}` : `${purePath}/docs/json/${fileName}`
  const { url, wordUrl } = await Docs.getDocByName(userId, name)

  await deleteFile([url, wordUrl])  // 删除需要覆盖的json文件，及对应的docx文件
  await shearFile(filePath, destPath)   //将新文件移入该目录
  await Docs.shearDocs(userId, name, destPath)
  success('覆盖成功', 0)
})

// 删除文件
router.delete('/delete', new Auth().m, async (ctx) => {
  const v = await new NotEmptyValidator('path').validate(ctx)
  const res = await deleteFile(v.get('query.path'))
  ctx.body = res
})

// 读取文件数据
router.get('/doc', new Auth().m, async (ctx) => {
  const v = await new NotEmptyValidator('url').validate(ctx)
  const url = v.get('query.url')
  try {
    const data = fs.readFileSync(url)
    // 读取了文档之后就将该条文档记录中isUpdate设置为0
    await Docs.setIsUpdate(url, 0)
    let docData = {}
    try {
      docData = JSON.parse(data)
    } catch (err) {
      console.log(err)
    }
    ctx.body = docData
  } catch (err) {
    throw new global.errs.FileReadError()
  }
})

// 游客访问文档
router.get('/visitorDocData', async (ctx) => {
  const v = await new NotEmptyValidator('url').validate(ctx)
  const url = v.get('query.url')
  const data = fs.readFileSync(url)
  await Docs.setIsUpdate(url, 0)
  ctx.body = data
})

// 请求下载路径文件下载
router.get('/downloadFile', new Auth().m, async (ctx) => {
  const { userId } = ctx.auth
  const v = await new NotEmptyValidator('fileType', 'fileName').validate(ctx)
  const fileType = v.get('query.fileType')
  const fileName = v.get('query.fileName')
  // 根据文件名称查找文件的路径
  const { url, wordUrl } = await Docs.getDocByName(userId, fileName)
  const filePath = fileType === 'json' ? url : wordUrl
  if (filePath) {
    const extension = path.parse(filePath).ext
    ctx.body = {
      filePath,
      name: fileName + extension
    }
  } else {
    // 生成word
    const wordPath = path.resolve(url, '../../word')
    const destWordPath = wordPath + `${isDev ? '\\' : '/'}` + path.parse(url).name + '.docx'
    let jsonData = fs.readFileSync(url, function (err) {
      console.log(err)
    })
    try {
      jsonToWord(JSON.parse(jsonData.toString()), destWordPath)
    } catch (err) {
      throw new global.errs.jsonAnalysisErr()
    }
    
    await Docs.saveWordUrl(userId, fileName, destWordPath)
    ctx.body = {
      filePath: destWordPath,
      name: fileName + '.docx'
    }
  }
})

//   文件下载
router.get('/download', async (ctx) => {
  const v = await new NotEmptyValidator('filePath', 'fileName').validate(ctx)
  const filePath = v.get('query.filePath')
  const fileName = v.get('query.fileName')
  ctx.attachment(filePath)
  await koaSend(ctx, filePath, { root: isDev ? 'F:/' : '/', setHeaders: function (res, path, stats) {
    res.writeHead(200, {
      'Content-Type': 'application/force-download',
      'Content-Disposition': 'attachment; filename=' + fileName,
      'Content-Length': stats.size
    })
  }})
})

module.exports = router