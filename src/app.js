import { getCurrentIPAddress } from './utils'
const express = require('express')
const app = express()
const server = require('http').Server(app)
const io = require('socket.io')(server)

app.use(express.static(__dirname + '/public'))

app.get('/', function (_req, res) {
  res.sendFile(`${__dirname}/public/views/index.html`)
})

// Start server hosting
server.listen(3000, getCurrentIPAddress(), function () {
  console.log(`Hosting: ${server.address().address}:${server.address().port}\n`)
})

const game = {
  players: {},
  score: { p1: 0, p2: 0, p1Wins: 0, p2Wins: 0 },
  spawnBallValues: {},
  gameState: 0,
  maxScore: 3
}

const gameStatus = { idle: 0, running: 1, finished: 2 }

const clients = []
let player1, player2

io.on('connection', function (socket) {
  let playersNumber = Object.entries(game.players).length

  if (playersNumber < 2) {
    console.log('jogador conectado')

    game.players[socket.id] = {
      playerId: socket.id,
      playerNumber: playersNumber + 1
    }

    // send the players object to the new player
    socket.emit('currentPlayers', game.players)
    // update all other players of the new player
    socket.broadcast.emit('newPlayer', game.players[socket.id])
    playersNumber = Object.entries(game.players).length

    clients.push(socket)
    clients.length === 1 ? (player1 = socket) : (player2 = socket)
  } else {
    socket.disconnect()
  }

  console.log(playersNumber)
  if (playersNumber === 2 && game.gameState === gameStatus.idle) {
    socket.broadcast.emit('startGame')
    socket.emit('startGame')
  }

  socket.on('disconnect', function () {
    console.log('jogador desconectado')
    // remove this player from our players object
    delete game.players[socket.id]

    socket.broadcast.emit('playerLeft', game)
    for (let client of clients) {
      client.disconnect()
    }
  })

  socket.on('startGame', async function (gameManager) {
    await socket.broadcast.emit('clientStartGame', gameManager)
  })

  socket.on('syncGame', async function (data) {
    if (data.player === 'p1') {
      clients[1].emit('updateGame', data)
    } else {
      clients[0].emit('updateGame', data)
    }
  })
})
