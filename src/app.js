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

const gameStatus = { waitingOponent: 0, idle: 1, running: 2, finished: 3 }

const game = {
  players: {},
  score: { p1: 0, p2: 0, p1Wins: 0, p2Wins: 0 },
  spawnBallValues: {},
  gameState: gameStatus.waitingOponent,
  maxScore: 3
}

const clientsSockets = []
const players = { p1: {}, p2: {} }

io.on('connection', (socket) => {
  let playersNumber = Object.keys(game.players).length

  // Limit the number of players
  if (playersNumber < 2) {
    game.players[socket.id] = {
      playerId: socket.id,
      playerNumber: playersNumber + 1
    }

    socket.emit('currentPlayers', game.players) // send the players object to the new player
    socket.broadcast.emit('newPlayer', game.players[socket.id]) // update all other players of the new player
    playersNumber = Object.entries(game.players).length

    clientsSockets.push(socket)
    clientsSockets.length === 1 ? (players.p1 = socket) : (players.p2 = socket)

    console.log(`Player ${playersNumber} connected`)
  } else {
    socket.disconnect()
  }

  if (playersNumber === 2 && game.gameState === gameStatus.waitingOponent) {
    socket.broadcast.emit('startGame')
    socket.emit('startGame')
  }

  socket.on('disconnect', () => {
    console.log(`Player ${game.players[socket.id].playerNumber} disconnected`)

    delete game.players[socket.id] // remove this player from our players object
    socket.broadcast.emit('playerLeft', game)

    for (let client of clientsSockets) client.disconnect()
  })

  socket.on('startGame', (gameManager) => {
    socket.broadcast.emit('clientStartGame', gameManager)
  })

  socket.on('syncGame', (data) => {
    if (data.player === 'p1') clientsSockets[1].emit('updateGame', data)
    else clientsSockets[0].emit('updateGame', data)
  })
})
