const fs = require('fs')

const deleteFile = async (path) => {
  if (typeof path === 'string') {
    _deleteFile(path)
  } else if (path instanceof Array) {
    const arr = []
    for (const item of path) {
      arr.push(_deleteFile(item))
    }

    try {
      return await Promise.all(arr)
    } catch (err) {
      console.log('删除失败：', err)
    }
  }
}

const shearFile = (filePath, destPath) => {
  return new Promise((resolve, reject) => {
    fs.rename(filePath, destPath, function (err) {
      if (err) throw err
      resolve()
    });
  })
}

function _deleteFile (path) {
  return new Promise((resolve, reject) => {
    fs.exists(path, (exists) => {
      if (exists) {
        fs.unlink(path, (err) => {
          if (err) {
            console.error(err)
          }
          resolve({
            error_code: 0,
            msg: '删除成功！'
          })
        })
      } else {
        resolve({
          error_code: 2004,
          msg: '文件不存在'
        })
      }
    })
  })
}

const success = (msg, errorCode) => {
  throw new global.errs.Success(msg, errorCode)
}

module.exports = {
  deleteFile,
  shearFile,
  success
}