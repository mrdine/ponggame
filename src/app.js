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
let player1, player2
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
    clients.length === 1 ? player1 = socket : player2 = socket
  } else {
    socket.disconnect();
  }

  console.log(playersNumber)
  if (playersNumber == 2 && game.gameState === GAME_STATE_IDLE) {
    socket.broadcast.emit('startGame')
    socket.emit('startGame')

  }


  socket.on('disconnect', function () {
    console.log('jogador desconectado');
    // remove this player from our players object
    delete game.players[socket.id];

    socket.broadcast.emit('playerSaiu', game)
    for (let client of clients) {
      client.disconnect()
    }
  });

  socket.on('repasseStartGame', async function (gameManager) {
    await socket.broadcast.emit('clientStartGame', gameManager)
  })

  socket.on('syncGame', async function (data) {
    if(data.player === 'p1') {
      clients[1].emit('updateGame', data)
    } else {
      clients[0].emit('updateGame', data)
    }
  })
  
});



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