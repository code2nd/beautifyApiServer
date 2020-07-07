const fs = require('fs')
const path = require('path')

class DirExists {

  getStat(filePath) {
    return new Promise((resolve, reject) => {
      fs.stat(filePath, (err, stats) => {
        if (err) {
          resolve(false);
        } else {
          resolve(stats);
        }
      })
    })
  }

  mkdir(filePath) {
    return new Promise((resolve, reject) => {
      fs.mkdir(filePath, err => {
        if (err) {
          resolve(false);
        } else {
          resolve(true);
        }
      })
    })
  }

  async isDirExists (filePath) {
    let isExists = await this.getStat(filePath);
    if (isExists && isExists.isDirectory()) {
      return true;
    } else if (isExists) {
      return false;
    }
  
    const { dir } = path.parse(filePath)
    let status = await this.isDirExists(dir);
    let mkdirStatus;
    if (status) {
      mkdirStatus = await this.mkdir(filePath);
    }
    return mkdirStatus;
  }

  createDir (filePath) {
    const res = this.isDirExists(filePath)
    return res ? filePath : ''
  }

}

module.exports =  DirExists 