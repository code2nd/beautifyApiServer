const officegen = require('officegen')
const fs = require('fs')
/* const {
  isUndefined
} = require('./') */
const { apiDataProxy } = require('./proxy')

const jsonToWord = (docData, storagedPath) => {
  // Create an empty Word object:
  let docx = officegen('docx')

  // Officegen calling this function after finishing to generate the docx document:
  docx.on('finalize', function (written) {
    console.log(
      'Finish to create a Microsoft Word document.'
    )
  })

  // Officegen calling this function to report errors:
  docx.on('error', function (err) {
    console.log(err)
  })

  const fontFamily = "Arial"
  const color85 = "262626"
  const size = (size) => size

  const pageTitleOpt = {
    color: color85,
    font_size: size(24),
    fontFamily,
    bold: true
  }

  const moduleTitleOpt = {
    color: color85,
    font_size: size(20),
    fontFamily,
    bold: true
  }

  const paraTitle = {
    color: color85,
    font_size: size(16),
    fontFamily,
    bold: true
  }

  const paraText = {
    color: color85,
    font_size: size(14),
    fontFamily
  }

  const jsonToString = (json) => JSON.stringify(json, undefined, 2)

  const docDataProxy = apiDataProxy(docData)

  const {
    host,
    basePath,
    info,
    interfaces,
    errorCode
  } = docDataProxy

  const {
    title,
    description,
    version
  } = info

  const data = []

  data.push([{
    type: "text",
    val: title,
    opt: pageTitleOpt
  }, {
    type: "linebreak"
  }, {
    type: "text",
    val: `v${version}`,
    opt: paraText
  }, {
    type: "linebreak"
  }, {
    type: "text",
    val: `Base URL: ${host}${basePath}`,
    opt: paraText
  }, {
    type: "linebreak"
  }, {
    type: "text",
    val: description,
    opt: paraText
  }, {
    type: "linebreak"
  }])

  if (interfaces && interfaces.length) {
    let dataBuff = []
    for (const item of interfaces) {
      if (item.children.length) {
        dataBuff = dataBuff.concat(item.children)
      }
    }

    for (const item of dataBuff) {
      const {
        hash,
        title,
        method,
        path,
        responses,
        parameters,
        response_description
      } = item

      const parametersData = []
      const resDesData = []

      if (parameters.length) {
        for (const i of parameters) {
          parametersData.push({
            type: "text",
            val: `    ${i.name}${i.required ? '' : ' ? '}: <${i.type}> ${i.description}`,
            opt: paraText
          }, {
            type: "linebreak"
          })
        }
      }

      if (response_description.length) {
        for (const i of response_description) {
          resDesData.push({
            type: "text",
            val: `    ${i.name}: ${i.description}`,
            opt: paraText
          }, {
            type: "linebreak"
          })
        }
      }

      data.push([{
          type: "text",
          val: title,
          opt: moduleTitleOpt
        }, {
          type: "linebreak"
        }, {
          type: "text",
          val: "URL:",
          opt: paraTitle
        }, {
          type: "linebreak"
        }, {
          type: "text",
          val: `    ${method.toUpperCase()}  ${path}`,
          opt: paraText
        }, {
          type: "linebreak"
        }, {
          type: "text",
          val: "Parameter:",
          opt: paraTitle
        }, {
          type: "linebreak"
        },
        ...parametersData,
        {
          type: "text",
          val: "Response:",
          opt: paraTitle
        }, {
          type: "linebreak"
        }, {
          type: "text",
          val: jsonToString(responses.success.example),
          opt: paraText
        }, {
          type: "linebreak"
        }, {
          type: "text",
          val: "Response_Description:",
          opt: paraTitle
        }, {
          type: "linebreak"
        },
        ...resDesData,
        {
          type: "linebreak"
        }
      ])
    }
  }

  if (errorCode && Object.keys(errorCode).length) {
    const {
      title,
      description,
      dataSource
    } = errorCode

    const tables = []

    const tableHead = [
      [{
        val: "错误码",
        opts: {
          cellColWidth: 4261,
          b: true,
          color: color85,
          sz: size(24),
          fontFamily
        }
      }, {
        val: "含义",
        opts: {
          b: true,
          color: color85,
          align: "left",
          fontFamily
        }
      }],
    ]

    const tableStyle = {
      tableColWidth: 4261,
      tableSize: size(24),
      // tableColor: "ada",
      tableAlign: "left",
      tableFontFamily: fontFamily
    }


    if (dataSource && dataSource.length) {
      for (const item of dataSource) {
        const table = [].concat(tableHead)
        if (item.dataSource.length) {
          for (const i of item.dataSource) {
            table.push([String(i.code), i.meaning])
          }
        }

        tables.push({
          type: "text",
          val: `${item.code} ${item.meaning}`,
          opt: paraText
        }, {
          type: "table",
          val: table,
          opt: tableStyle
        }, {
          type: "linebreak"
        })
      }
    }

    data.push({
        type: "text",
        val: title,
        opt: moduleTitleOpt
      }, {
        type: "text",
        val: description,
        opt: paraText
      },
      ...tables
    )
  }

  docx.createByJson(data);

  //let out = fs.createWriteStream(`./words/example${new Date().getTime()}.docx`)
  let out = fs.createWriteStream(storagedPath)

  out.on('error', function (err) {
    console.log(err)
  })

  // Async call to generate the output file:
  docx.generate(out)
}

module.exports = {
  jsonToWord
}