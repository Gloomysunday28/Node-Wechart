const socketio = require('socket.io')

var io = null

let guestNumber = 1

let nickNames = {}
let namesUsed = []
let currentRoom = {}

// 分配昵称
function assinGuestName(socket, guestNumber, nickNames, namesUsed) {
  var name = 'Guest' + guestNumber

  nickNames[socket.id] = name
  socket.emit('nameResult', {
    success: true,
    name
  })
  namesUsed.push(name)

  return guestNumber + 1
}

// 进入聊天室
function joinRoom(socket, room) {
  socket.join(room) // 推送通道，所有这个通道下的都会收到同一个
  currentRoom[socket.id] = room

  socket.emit('joinResult', {room})
  socket.broadcast.to(room).emit('message', { // 发送给所有人, 观察者模式
    text: nickNames[socket.id] + 'has joined' + room + '.',
    system: true
  })

  var usersInRoom = io.sockets.clients(room) // 获取该通道下所有的成员

  if (usersInRoom.length > 1) {
    var usersInRoomSummary = 'Users currently in' + room + ': '

    for (let index in usersInRoom) {
      var userSocketId = usersInRoom[index].id
      if (userSocketId != socket.id) {
        if (index > 0) {
          usersInRoomSummary += ', '
        }
        usersInRoomSummary += nickNames[userSocketId]
      }
    }

    usersInRoomSummary += '.'
    socket.emit('message', {text: usersInRoomSummary, system: true})
  }
}


function handleNameChangeAttempts(socket, nickNames, namesUsed) {
  socket.on('nameAttempt', function(name) {
    if (name.indexOf('Guest') === 0) {
      socket.emit('nameResult', {
        success: false,
        message: 'Name cannot begin with "Guest".'
      })
    } else {
      if (namesUsed.indexOf(name) == -1) {
        var previousName = nickNames[socket.id]

        var previousNameIndex = namesUsed.indexOf(previousName)

        namesUsed.push(name)
        nickNames[socket.id] = name
        delete namesUsed[previousNameIndex]

        socket.emit('nameResult', {
          success: true,
          name
        })
      } else {
        socket.emit('nameResult', {
          success: false,
          message: 'That name is already in use'
        })
      }
    }
  })
}

function handleMessageBroadcasting(socket) {
  socket.on('message', function(message) {
    socket.broadcast.to(message.room).emit('message', {
      text: nickNames[socket.id] + ':' + message.text
    })
  })
}

function handleRoomJoining(socket) {
  socket.on('join', function(room) {
    socket.leave(currentRoom[socket.id])

    joinRoom(socket, room.newRoom)
  })
}

function handleClientDisconnection(socket) {
  socket.on('disconnect', function() {
    var nameIndex = namesUsed.indexOf(nickNames[socket.id])

    delete namesUsed[nameIndex]
    delete nickNames[socket.id]
  })
}

exports.listen = function(server) {
  io = socketio.listen(server)
  
  io.set('log level', 1)
  
  io.sockets.on('connection', function(socket) {
    guestNumber = assinGuestName(socket, guestNumber, nickNames, namesUsed)
    joinRoom(socket, 'Lobby')
    handleMessageBroadcasting(socket, nickNames)
    handleNameChangeAttempts(socket, nickNames, namesUsed)
    handleRoomJoining(socket)

    socket.on('rooms', function() {
      socket.emit('rooms', io.sockets.manager.rooms)
    })

    handleClientDisconnection(socket, nickNames, namesUsed)
  })
}