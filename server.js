const http = require('http')
const fs = require('fs')
const path = require('path')
const mime = require('mime') // 根据文件扩展名得出Mime类型

const cache = {} // 访问内存比访问文件系统快的多，所以把数据缓存在这里性能上会比较好

function send404(res) {
  res.writeHead(404, {'Content-type': 'text/plain'})
  res.write('resource is not found')
  res.end()
}

function sendFile(res, filePath, fileContent) {
  res.writeHead(200, {
    'Content-type': mime.lookup(path.basename(filePath))
  })

  res.end(fileContent)
}

function serverStatic(res, cache, absPath) {
  if (cache[absPath]) {
    sendFile(res, absPath, cache[absPath])
  } else {
    fs.exists(absPath, function(exists) {
      if (exists) {
        fs.readFile(absPath, function(err, data) {
          if (err) send404(res)
          else {
            cache[absPath] = data
            sendFile(res, absPath, data)
          }
        })
      } else {
        send404(res)
      }
    })
  }
}