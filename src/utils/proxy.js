const infoProxy = (info) => {
  const handler = {
    get (target, key) {
      return Reflect.get(target, key) || ''
    }
  }

  return new Proxy(info || {}, handler)
}

const apiDataProxy = (data) => {
  const handler = {
    get (target, key) {
      switch (key) {
        case 'info':
          return infoProxy(Reflect.get(target, key))
        case 'host':
        case 'basePath':
          return Reflect.get(target, key) || ''
        case 'interfaces': 
          return Reflect.get(target, key) || []
        case 'errorCode':
          return Reflect.get(target, key) || null
        default: 
        return Reflect.get(target, key)
      }
    }
  }

  return new Proxy(data || {}, handler)
}

module.export = {
  apiDataProxy
}