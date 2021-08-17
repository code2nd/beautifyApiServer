const fs = require('fs')
const path = require('path');

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

function _deleteFile(path) {
  return new Promise((resolve, reject) => {
    fs.access(path, (error) => {
      if (error) {
        resolve({
          error_code: 2004,
          msg: '文件不存在'
        })
      } else {
        fs.unlink(path, (err) => {
          if (err) {
            console.error(err)
          }
          resolve({
            error_code: 0,
            msg: '删除成功！'
          })
        })
      }
    })
  })
}

const success = (msg, errorCode) => {
  throw new global.errs.Success(msg, errorCode)
}


function isFileExisted(path_way) {
  return new Promise((resolve, reject) => {
    fs.access(path_way, (err) => {
      if (err) {
        resolve(false)
      } else {
        resolve(true)
      }
    })
  })
}

function getStat(path) {
  return new Promise((resolve, reject) => {
    fs.stat(path, (err, stats) => {
      if (err) {
        resolve(false);
      } else {
        resolve(stats);
      }
    })
  })
}

function mkdir(dir) {
  return new Promise((resolve, reject) => {
    fs.mkdir(dir, err => {
      if (err) {
        resolve(false);
      } else {
        resolve(true);
      }
    })
  })
}

async function dirExists(dir) {
  let isExists = await getStat(dir);
  //如果该路径且不是文件，返回true
  if (isExists && isExists.isDirectory()) {
    return true;
  } else if (isExists) {
    //如果该路径存在但是文件，返回false
    return false;
  }
  //如果该路径不存在，拿到上级路径
  let tempDir = path.parse(dir).dir;
  //递归判断，如果上级目录也不存在，则会代码会在此处继续循环执行，直到目录存在
  let status = await dirExists(tempDir);
  let mkdirStatus;
  if (status) {
    mkdirStatus = await mkdir(dir);
  }
  return mkdirStatus;
}

function isDev() {
  return /Windows/.test(process.env.OS)
}

module.exports = {
  deleteFile,
  shearFile,
  success,
  isFileExisted,
  isDev,
  dirExists
}