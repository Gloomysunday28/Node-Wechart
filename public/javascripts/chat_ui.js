function divEscpedContent(message) {
  return $('<div></div>').text(message)
}

function divSystem(message) {
  return $('<div></div>').html('<i>' + message + '</i>')
}

function procssUserInput(chatApp) {
  var message = $('#send-message').val()
  var sysytemMessage

  if (message[0] == '/') {
    sysytemMessage = chatApp.processCommand(message)

    if (sysytemMessage) {
      $('#message').append(divSystem(sysytemMessage))
    }
  } else {
    chatApp.sendMessage($('#room').text(), message)
    $('#messages').append(divEscpedContent(message))
    $('#messages').scrollTop($('#message').prop('scrollHeight'))
  }
}

var socket = io.connect()

$(document).ready(function() {
  var chatApp = new Chat(socket)
  
  socket.on('nameResult', function(res) {
    var message
    if (res.success) {
      message = 'You are now known as' + res.name + '.'
    } else {
      message = res.message
    }

    $('#messages').append(divSystem(message))
  })

  socket.on('joinResult', function(res) {
    $('#room').text(res.room)
    $('#messages').append(divSystem('Room Changed.'))
  })

  socket.on('message', function(message) {
    var newElement = $('<div></div>').text(message.text)
    $('#messages').append(newElement)
  })

  socket.on('rooms', function(rooms) {
    $('#room-list').empty()

    for(var room in rooms) {
      room = room.substring(1, room.length)

      if (room !== '') {
        $('#room-list').append(divEscpedContent(room))
      }
    }

    $('#room-list div').click(function() {
      chatApp.processCommand('/join' + $(this).text())

      $('#send-message').focus()
    })
  })

  setInterval(function() {
    socket.emit('rooms')
  }, 1000)

  $('#send-message').focus()

  $('#send-form').submit(function() {
    procssUserInput(chatApp, socket)

    return false
  })
})