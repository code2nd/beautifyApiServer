class HttpException extends Error {
  constructor (msg="服务器异常", errorCode=10000, code=400) {
    super()
    this.errorCode = errorCode
    this.code = code
    this.msg = msg
  }
}

class ParameterException extends HttpException {
  constructor (msg, errorCode) {
    super()
    this.code = 400
    this.msg = msg || '参数错误'
    this.errorCode = errorCode || 10000
  }
}

class Success extends HttpException {
  constructor (msg, errorCode) {
    super()
    this.code = 201
    this.msg = msg || 'ok'
    this.errorCode = errorCode || 0
  }
}

class NotFound extends HttpException {
  constructor (msg, errorCode) {
    super()
    this.msg = msg || '资源未找到'
    this.errorCode = errorCode || 10000
    this.code = 404
  }
}

class AuthFailed extends HttpException {
  constructor (msg, errorCode) {
    super()
    this.msg = msg || '授权失败'
    this.errorCode = errorCode || 10004
    this.code = 401
  }
}

class Forbbiden extends HttpException {
  constructor (msg, errorCode) {
    super()
    this.msg = msg || '禁止访问'
    this.errorCode = errorCode || 10006
    this.code = 403
  }
}

class UserRegistered extends HttpException {
  constructor (msg, errorCode) {
    super()
    this.code = 400
    this.msg = msg || "该用户名已被注册"
    this.errorCode = errorCode || 60001
  }
}

class DeleteError extends HttpException {
  constructor (msg, errorCode) {
    super()
    this.code = 400
    this.msg = msg || "删除项不存在"
    this.errorCode = errorCode || 60001
  }
}

class EditError extends HttpException {
  constructor (msg, errorCode) {
    super()
    this.code = 400
    this.msg = msg || "编辑项不存在"
    this.errorCode = errorCode || 60001
  }
}

class FileReadError extends HttpException {
  constructor (msg, errorCode) {
    super()
    this.code = 400
    this.msg = msg || "文档为空或文档不存在"
    this.errorCode = errorCode || 60001
  }
}

class FileNameExist extends HttpException {
  constructor (msg, errorCode) {
    super()
    this.code = 400
    this.msg = msg || "不允许相同文件名"
    this.errorCode = errorCode || 60001
  }
}

class fieldUndefined extends HttpException {
  constructor (msg, errorCode) {
    super()
    this.code = 400
    this.msg = msg || "字段未定义"
    this.errorCode = errorCode || 30001
  }
}

class jsonAnalysisErr extends HttpException {
  constructor (msg, errorCode) {
    super()
    this.code = 400
    this.msg = msg || "json文件解析失败，请检查是否正确配置"
    this.errorCode = errorCode || 30002
  }
}

module.exports = { 
  HttpException, 
  ParameterException,
  Success,
  NotFound,
  AuthFailed,
  Forbbiden,
  UserRegistered,
  DeleteError,
  EditError,
  FileReadError,
  FileNameExist,
  fieldUndefined,
  jsonAnalysisErr
}