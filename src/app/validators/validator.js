/**
 * Rule接受3个参数，1 rule 校验规则 2 msg提示信息 3 可选参数
 */

const { LinValidator, Rule } = require('../../core/lin-validator')
const { User } = require('../models/user')

// 校验正整数
/* class PositiveIntegerValidator extends LinValidator {
  constructor () {
    super()
    // 校验id为正整数，校验方式为数组，表示可以定义多个规则
    this.id = [
      new Rule('isInt', '需要时正整数', {min: 1})
    ]
  }
} */

// 校验多个正整数
class PositiveIntegerValidator extends LinValidator {
  constructor (...params) {
    super()
    // 校验id为正整数，校验方式为数组，表示可以定义多个规则
    params.map((item) => {
      return this[item] = [
        new Rule('isInt', '需要是正整数', {min: 1})
      ]
    })
  }
}

class RegisterValidator extends LinValidator {
  constructor () {
    super()

    this.username = [
      new Rule('isLength', '用户名不符合长度规范', {
        min: 4,
        max: 32
      })
    ]

    this.password1 = [
      // 用户指定范围 123456 $^
      new Rule('isLength', '密码至少6个字符，最多32个字符', {
        min: 6,
        max: 32
      }),
      new Rule('matches', '密码不符合规范', /^[a-zA-Z0-9]{6,32}$/)
    ]

    this.password2 = this.password1
  }

  validatePassword (vals) {
    const pwd1 = vals.body.password1
    const pwd2 = vals.body.password2
    if (pwd1 !== pwd2) {
      throw new Error('两次输入的密码必须相同')
    }
  }

  async validateUsername (vals) {
    const username = vals.body.username
    const user = await User.findOne({
      where: {
        username
      }
    })

    if (user) {
      throw new Error('用户名已经被注册')
    }
  }
}

class NotEmptyValidator extends LinValidator {
  constructor (...params) {
    super()
    params.map((item) => {
      return this[item] = [
        new Rule('isLength', '不允许为空', {min: 1})
      ]
    })
  }
}

class LoginValidator extends NotEmptyValidator {
  constructor () {
    super()
    this.username = [
      new Rule('isLength', '用户名不符合长度规范', {
        min: 4,
        max: 32
      })
    ]
    this.password = [
      new Rule('isLength', '密码至少6个字符，最多32个字符', {
        min: 6,
        max: 32
      }),
      new Rule('matches', '密码不符合规范', /^[a-zA-Z0-9]{6,32}$/)
    ]
  }
}

class GetUsersValidator extends LinValidator {
  constructor () {
    super()
    this.page = [
      new Rule('isOptional'),
      new Rule('isInt', '需要是正整数', {min: 1})
    ]
    this.pageSize = this.page
  }
}

module.exports = {
  RegisterValidator,
  PositiveIntegerValidator,
  NotEmptyValidator,
  LoginValidator,
  GetUsersValidator
}