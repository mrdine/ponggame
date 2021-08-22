var express = require('express');
var app = express();
var server = require('http').Server(app);
var io = require('socket.io')(server);

const ip = 'localhost'

const game = { players: {}, pontos: { p1: 0, p2: 0, p1Wins: 0, p2Wins: 0 }, spawnBolaValues: {}, gameState: 0, maxScore: 3 }
const GAME_STATE_IDLE = 0;
const GAME_STATE_RUNNING = 1;
const GAME_STATE_FINISHED = 2;

app.use(express.static(__dirname + '/public'));


app.get('/', function (req, res) {
  res.sendFile(`${__dirname}/public/views/index.html`);
});

server.listen(3000, ip, function () {
  console.log(`Hospedando em ${server.address().address}:${server.address().port}`);
  //console.log(Object.entries(players))
});


const clients = []
io.on('connection', function (socket) {

  let playersNumber = Object.entries(game.players).length
  if (playersNumber < 2) {
    console.log('jogador conectado');

    game.players[socket.id] = {
      playerId: socket.id,
      playerNumber: playersNumber + 1
    }

    // send the players object to the new player
    socket.emit('currentPlayers', game.players);
    // update all other players of the new player
    socket.broadcast.emit('newPlayer', game.players[socket.id]);
    playersNumber = Object.entries(game.players).length

    clients.push(socket)

  } else {
    socket.disconnect();
  }

  console.log(playersNumber)
  if (playersNumber == 2 && game.gameState === GAME_STATE_IDLE) {
    changeGameState(GAME_STATE_RUNNING)
    socket.broadcast.emit('startGame', game)
    socket.emit('startGame', game)

  }


  socket.on('disconnect', function () {
    changeGameState(GAME_STATE_IDLE)
    console.log('jogador desconectado');
    // remove this player from our players object
    delete game.players[socket.id];

    socket.broadcast.emit('playerSaiu', game)
    restartGame()
    for (let client of clients) {
      client.disconnect()
    }
  });

  socket.on('pontuou', function (quemPontuou) {
    const { quem, pontos } = quemPontuou
    console.log('pontos cliente: ')
    console.log(pontos)
    console.log('pontos servidor: ')
    console.log(game.pontos)
    if (!((pontos.p1 === game.pontos.p1) && (pontos.p2 === game.pontos.p2))) {
      console.log('oi')
      if (quem === 'p1') {
        game.pontos.p1 += 1
      } else {
        game.pontos.p2 += 1
      }
      // verificar se houve ganhador

      // spawnar bola
      game.spawnBolaValues = getSpawnBolaValues()

      for (client of clients) {
        client.emit('respostaPontuou', game)
      }
    }

  })
});

function restartRound() {
  game.pontos.p1 = 0
  game.pontos.p2 = 0

}

function restartGame() {
  restartRound()
  game.pontos.p1Wins = 0
  game.pontos.p2Wins = 0

}

function changeGameState(state) {
  if (state === GAME_STATE_RUNNING) {
    game.spawnBolaValues = getSpawnBolaValues()
  }
  game.gameState = state
}

function getSpawnBolaValues() {
  const values = {
    directionH: getRndInteger(1, 3),
    directionV: getRndInteger(1, 3),
    velocity: getRndInteger(300, 401)
  }
  return values
}

function getRndInteger(min, max) {
  return Math.floor(Math.random() * (max - min)) + min;
}