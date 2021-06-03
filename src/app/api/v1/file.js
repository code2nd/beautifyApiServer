/**
 * 文件相关，上传，删除等
 * 
 */

const multiparty = require('multiparty')
const fs = require('fs')
const path = require('path')
const koaSend = require('koa-send')
const { success, isDev: isDevFn } = require('../../../utils')

const Router = require('koa-router')
const { Auth } = require('../../../middlewares/auth')
const { NotEmptyValidator } = require('../../validators/validator')
const { Docs } = require('../../models/docs')
const { deleteFile, shearFile, isFileExisted, dirExists } = require('../../../utils')
const DirExists = require('../../../utils/models/dirExists')
const { uploadDir } = require('../../../config/config')
const { jsonToWord } = require('../../../utils/jsonToWord')

const router = new Router({
  prefix: '/v1/file'
})

const isDev = isDevFn()

// 上传文件存放路径
const fileDir = new DirExists()

// 上传文件(包括文档上传和用户头像上传)
router.post('/upload', new Auth().m, async (ctx) => {
  const uploadFile = () => {
    let sendData = {}
    return new Promise((resolve, reject) => {
      // 存放临时文件
      const form = new multiparty.Form({ uploadDir })
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
            // fileInfo.path 文件上传的地址(包含文件名)
            const { originalFilename, path: filePath } = fileInfo

            // path.parse('F:\\aaa\\bbb.json') => { root: 'F:\\', dir: 'F:\\aaa\\, base: 'aaa.json', ext: '.json', name: 'aaa' }
            const { name: realName } = path.parse(originalFilename)
            const { dir: purePath, base: fileName, name: storedName } = path.parse(filePath)

            // 将 filePath 缓存起来，当用户取消上传的时候就将临时文件删除
            ctx.session.tempFile = {
              name: realName,
              filePath,
              storedName
            };

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

                const { username } = ctx.session.userInfo
                const docPath = isDev ? fileDir.createDir(`${purePath}\\docs\\json\\${username}`) : fileDir.createDir(`${purePath}/docs/json/${username}`)
                destPath = isDev ? `${docPath}\\${fileName}` : `${docPath}/${fileName}`

                const res = await Docs.getDocByName(userId, realName)

                // 如果该文件已存在同名文件
                if (res) {
                  sendData = {
                    isExist: true,
                    type: 'docs',
                    // url: destPath,
                    // wordUrl: destWordPath,
                    name: realName,
                    // id: res.id,
                    description: res.description,
                    // originUrl: res.url,
                    // filePath
                  }
                  resolve(sendData)
                } else {
                  await shearFile(filePath, destPath)
                  // 生成 docx 文档
                  genDoc(destPath, username);
                  resolve({
                    isExist: false,
                    // url: destPath,
                    name: realName
                  })
                }
                break
              case 'avatar':
                // 处理头像上传
                destPath = `${fileDir.createDir(`${purePath}/avatars`)}/${fileName}`
                await shearFile(filePath, destPath)
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
  const { username } = ctx.session.userInfo
  const v = await new NotEmptyValidator('name', 'description').validate(ctx)
  const name = v.get('body.name')
  const description = v.get('body.description')
  const { storedName } = await Docs.getDocByName(userId, name)
  const originJson = isDev ? `${uploadDir}\\docs\\json\\${username}\\${storedName}.json` : `${uploadDir}/docs/json/${username}/${storedName}.json`
  const originWord = isDev ? `${uploadDir}\\doxs\\word\\${username}\\${storedName}.docx` : `${uploadDir}/docs/word/${username}/${storedName}.docx`
  const { storedName: newStoredName, filePath } = ctx.session.tempFile
  const destPath = isDev ? `${uploadDir}\\docs\\json\\${username}\\${newStoredName}.json` : `${uploadDir}/docs/json/${username}/${newStoredName}.json`

  await deleteFile([originJson, originWord])  // 删除需要覆盖的json文件，及对应的docx文件
  await shearFile(filePath, destPath)   //将新文件移入该目录
  await Docs.shearDocs(userId, name, newStoredName, description)
  // 更新缓存
  const data = ctx.session.docs.data
  const aimItem = data[data.findIndex(item => item.name === name)]
  aimItem.name = name
  aimItem.description = description
  success('覆盖成功', 0)
})

// 删除文件(临时文件)
router.delete('/cancel', new Auth().m, async (ctx) => {
  const filePath = ctx.session.tempFile && ctx.session.tempFile.filePath
  await deleteFile(filePath)
  ctx.session.tempFile = null
  ctx.body = {
    msg: "取消成功！"
  }
})

// 读取文件数据
router.get('/doc', new Auth().m, async (ctx) => {
  const { userId } = ctx.auth
  const v = await new NotEmptyValidator('name').validate(ctx)
  const name = v.get('query.name')
  let filePath = ''
  let storedName = '';
  if (name === 'example') {
    storedName = (await Docs.getDocByName(null, name)).storedName
    filePath = isDev ? `${uploadDir}\\docs\\json\\${storedName}.json` : `${uploadDir}/docs/json/${storedName}.json`
  } else {
    const { username } = ctx.session.userInfo
    // 根据 userId 和文件名获取该文件的存储名称
    storedName = (await Docs.getDocByName(userId, name)).storedName
    // 文件路径
    filePath = isDev ? `${uploadDir}\\docs\\json\\${username}\\${storedName}.json` : `${uploadDir}/docs/json/${username}/${storedName}.json`
  }

  try {
    const data = fs.readFileSync(filePath)
    // 读取了文档之后就将该条文档记录中 isUpdate 设置为 0
    await Docs.setIsUpdate(storedName, 0)
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
  const v = await new NotEmptyValidator('name').validate(ctx)
  const name = v.get('query.name')
  // 根据 userId 和文件名获取该文件的存储名称
  const { storedName } = await Docs.getDocByName(userId, name)
  // 文件路径
  const filePath = isDev ? `${uploadDir}\\docs\\json\\${storedName}.json` : `${uploadDir}/docs/json/${storedName}.json`
  const data = fs.readFileSync(filePath)
  await Docs.setIsUpdate(storedName, 0)
  ctx.body = data
})

// 请求下载路径文件下载
router.get('/downloadFile', new Auth().m, async (ctx) => {
  const { userId } = ctx.auth
  const { username } = ctx.session.userInfo
  const v = await new NotEmptyValidator('fileType', 'fileName').validate(ctx)
  const fileType = v.get('query.fileType')
  const fileName = v.get('query.fileName')
  // 根据文件名称查找文件的路径
  const { storedName } = await Docs.getDocByName(userId, fileName)
  const jsonUrl = isDev ? `${uploadDir}\\docs\\json\\${username}\\${storedName}.json` : `${uploadDir}/docs/json/${username}/${storedName}.json`
  const wordUrl = isDev ? `${uploadDir}\\docs\\word\\${username}\\${storedName}.docx` : `${uploadDir}/docs/word/${username}/${storedName}.docx`
  const filePath = fileType === 'json' ? jsonUrl : wordUrl
  const exist = await isFileExisted(filePath);
  if (exist) {
    const fullName = fileName + path.parse(filePath).ext
    // downloadFile(ctx, filePath, fullName);
    ctx.body = {
      filePath,
      name: fullName
    }
  } else {
    // 生成word
    /* const wordPath = path.resolve(jsonUrl, `../../../word/${username}`)
    dirExists(wordPath)
    const wordName = path.parse(jsonUrl).name
    const destWordPath = wordPath + `${isDev ? '\\' : '/'}` + wordName + '.docx'
    let jsonData = fs.readFileSync(jsonUrl, function (err) {
      console.log(err)
    })
    try {
      jsonToWord(JSON.parse(jsonData.toString()), destWordPath)
    } catch (err) {
      throw new global.errs.jsonAnalysisErr()
    } */

    // downloadFile(ctx, filePath, fileName + '.docx');

    // await Docs.saveWordUrl(userId, fileName, destWordPath)
    ctx.body = {
      msg: '文件不存在'
    }
  }
})

//   文件下载
router.get('/download', async (ctx) => {
  const v = await new NotEmptyValidator('filePath', 'fileName').validate(ctx)
  const filePath = v.get('query.filePath')
  const fileName = v.get('query.fileName')
  ctx.attachment(filePath)
  await koaSend(ctx, filePath, {
    root: isDev ? 'F:/' : '/', setHeaders: function (res, path, stats) {
      res.writeHead(200, {
        'Content-Type': 'application/force-download',
        'Content-Disposition': 'attachment; filename=' + fileName,
        'Content-Length': stats.size
      })
    }
  })
})

// 生成 wrod 文档
function genDoc(jsonUrl, username) {
  const wordPath = path.resolve(jsonUrl, `../../../word/${username}`)
  dirExists(wordPath)
  const wordName = path.parse(jsonUrl).name
  const destWordPath = wordPath + `${isDev ? '\\' : '/'}` + wordName + '.docx'
  let jsonData = fs.readFileSync(jsonUrl, function (err) {
    console.log(err)
  })
  try {
    jsonToWord(JSON.parse(jsonData.toString()), destWordPath)
  } catch (err) {
    throw new global.errs.jsonAnalysisErr()
  }
}

module.exports = router