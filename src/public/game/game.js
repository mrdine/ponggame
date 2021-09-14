const gameStatus = { waitingOponent: 0, idle: 1, running: 2, finished: 3 }

const gameManager = {
  socket: {},
  p1: {},
  p2: {},
  ball: {},
  thisPlayer: null,
  otherPlayer: null,
  thisPlayerText: '',
  spawnBallValues: {},
  uiTexts: {},
  audio: { ballImpacts: [] },
  score: {
    p1: 0,
    p2: 0,
    p1Text: '',
    p2Text: '',
    p1Wins: 0,
    p2Wins: 0
  },
  inputs: {
    keyW: '',
    keyS: '',
    keySpacebar: ''
  },
  actualScene: '',
  gameState: gameStatus.waitingOponent,
  previousState: gameStatus.waitingOponent,
  maxScore: 3,
  currentWinner: 0
}

let gamedata = {}

function preload() {
  this.load.setBaseURL('/game')
  this.load.image('p1', './assets/images/p1.png')
  this.load.image('p2', './assets/images/p2.png')
  this.load.image('ball', './assets/images/ball.png')

  this.load.audio('cyberpunk', './assets/sounds/cyberpunk8bit.mp3')
  this.load.audio('point', './assets/sounds/point.ogg')
  for (let i = 1; i <= 5; i++) {
    this.load.audio(`ballImpact${i}`, `./assets/sounds/ball${i}.ogg`)
  }
}

function create() {
  gameManager.socket = io()
  gameManager.actualScene = this
  gameManager.p1 = this.physics.add.sprite(50, 300, 'p1').setImmovable()
  gameManager.p2 = this.physics.add.sprite(750, 300, 'p2').setImmovable()

  const defaultScoreStyle = {
    font: '90px Courier',
    fill: '#004400'
  }

  gameManager.score.p1Text = this.add.text(220, 300, '0', defaultScoreStyle)
  gameManager.score.p2Text = this.add.text(580, 300, '0', defaultScoreStyle)

  gameManager.uiTexts.controlsText = this.add.text(
    400,
    300,
    'Controls\n\nW 🡡\nS 🡣',
    {
      font: '18px Courier',
      fill: '#00CC00',
      boundsAlignH: 'center',
      boundsAlignV: 'middle'
    }
  )

  gameManager.uiTexts.startGameText = this.add.text(
    400,
    500,
    'Waiting for the opponent to connect',
    {
      font: '28px Courier',
      fill: '#ffffff',
      boundsAlignH: 'center',
      boundsAlignV: 'middle'
    }
  )

  gameManager.uiTexts.winnerText = this.add.text(400, 125, '', {
    font: '32px Courier',
    fill: '#00CC00',
    boundsAlignH: 'center',
    boundsAlignV: 'middle'
  })

  gameManager.uiTexts.matchsResume = this.add.text(370, 250, '', {
    font: '24px Courier',
    fill: '#00CC00',
    boundsAlignH: 'center',
    boundsAlignV: 'middle'
  })

  gameManager.audio.cyberpunkMusic = this.sound.add('cyberpunk')
  gameManager.audio.point = this.sound.add('point')
  for (let i = 1; i <= 5; i++)
    gameManager.audio.ballImpacts.push(this.sound.add(`ballImpact${i}`))

  gameManager.uiTexts.startGameText.setOrigin(0.5)
  gameManager.uiTexts.controlsText.setOrigin(0.5)
  gameManager.uiTexts.winnerText.setOrigin(0.5)
  gameManager.score.p1Text.setOrigin(0.5)
  gameManager.score.p2Text.setOrigin(0.5)

  gameManager.uiTexts.winnerText.visible = false
  gameManager.score.p1Text.visible = false
  gameManager.score.p2Text.visible = false
  gameManager.uiTexts.matchsResume.visible = false

  gameManager.p1.setScale(0.5)
  gameManager.p2.setScale(0.5)

  gameManager.inputs.keyW = this.input.keyboard.addKey(
    Phaser.Input.Keyboard.KeyCodes.W
  )
  gameManager.inputs.keyS = this.input.keyboard.addKey(
    Phaser.Input.Keyboard.KeyCodes.S
  )
  gameManager.inputs.keySpacebar = this.input.keyboard.addKey(
    Phaser.Input.Keyboard.KeyCodes.SPACE
  )

  gameManager.p1.body.collideWorldBounds = true
  gameManager.p2.body.collideWorldBounds = true

  this.physics.world.on('worldbounds', (body, up, down, left, right) => {
    processScored(body, up, down, left, right)
  })

  if (!gameManager.audio.cyberpunkMusic.isPlaying) {
    gameManager.audio.cyberpunkMusic.play({ volume: 0.5, loop: true })
  }

  const primaryColor = Phaser.Display.Color.ValueToColor(0x00ff00)
  const secondaryColor = Phaser.Display.Color.ValueToColor(0x008800)

  this.tweens.addCounter({
    from: 0,
    to: 100,
    duration: 600,
    ease: Phaser.Math.Easing.Sine.InOut,
    repeat: -1,
    yoyo: true,
    onUpdate: (tween) => {
      const value = tween.getValue()
      const colorObject = Phaser.Display.Color.Interpolate.ColorWithColor(
        primaryColor,
        secondaryColor,
        100,
        value
      )

      const color = Phaser.Display.Color.GetColor(
        colorObject.r,
        colorObject.g,
        colorObject.b
      )

      gameManager.uiTexts.startGameText.setTint(color)
    }
  })

  gameManager.socket.on('startGame', () => {
    if (gameManager.thisPlayer === gameManager.p1) {
      gameManager.maxScore = 3
      gameManager.spawnBallValues = getSpawnBallValues()

      // enviar dados para o servidor repassar para o p2
      gamedata = {
        p1: gameManager.p1,
        ball: gameManager.ball,
        score: gameManager.score,
        maxScore: gameManager.maxScore,
        spawnBallValues: gameManager.spawnBallValues,
        gameState: gameManager.gameState,
        previousState: gameManager.previousState
      }
      gameManager.socket.emit('startGame', gamedata)
      updateGameState(gameStatus.idle)
    }
  })

  gameManager.socket.on('clientStartGame', (gamedata) => {
    if (gameManager.thisPlayer === gameManager.p2) {
      gameManager.maxScore = gamedata.maxScore
      gameManager.spawnBallValues = gamedata.spawnBallValues
      gameManager.gameState = gamedata.gameState
      gameManager.previousState = gamedata.previousState
      gameManager.score.p1 = gamedata.score.p1
      gameManager.score.p2 = gamedata.score.p2
      gameManager.score.p1Wins = gamedata.score.p1Wins
      gameManager.score.p2Wins = gamedata.score.p2Wins

      updateGameState(gameStatus.idle)
    }
  })

  gameManager.socket.on('updateGame', (data) => {
    if (data.player === 'p1') {
      if (data.playerObject && data.playerObject_y)
        gameManager.p1.y = data.playerObject_y
      if (data.ball) {
        gameManager.ball.x = data.ball.x
        gameManager.ball.y = data.ball.y
      }
      if (data.score) {
        gameManager.score.p1 = data.score.p1
        gameManager.score.p2 = data.score.p2
        gameManager.score.p1Wins = data.score.p1Wins
        gameManager.score.p2Wins = data.score.p2Wins
      }
      if (data.gameState) updateGameState(data.gameState)
    } else {
      gameManager.p2.y = data.playerObject_y
    }
  })

  gameManager.socket.on('playerLeft', (game) => {
    window.location.reload()
    // updateGameState(gameStatus.waitingOponent)
    // gameManager.socket.emit('startGame', game)
  })

  gameManager.socket.on('currentPlayers', (players) => {
    gameManager.p1.name = 'player 1'
    gameManager.p2.name = 'player 2'

    if (!gameManager.thisPlayer) {
      const myNumberPlayer = players[gameManager.socket.id].playerNumber

      if (myNumberPlayer === 1) {
        gameManager.thisPlayer = gameManager.p1
        gameManager.thisPlayerText = 'p1'
        gameManager.otherPlayer = gameManager.p2
      } else {
        gameManager.thisPlayer = gameManager.p2
        gameManager.thisPlayerText = 'p2'
        gameManager.otherPlayer = gameManager.p1
      }
    }
  })
}

function update() {
  switch (gameManager.gameState) {
    case gameStatus.waitingOponent:
      gameManager.uiTexts.startGameText.setText(
        'Waiting for the opponent to connect'
      )

      break
    case gameStatus.idle:
      gameManager.uiTexts.startGameText.setText(
        'Tap spacebar to start (Player 1)'
      )
      // Start the game if spacebar is pressed
      if (
        gameManager.inputs.keySpacebar.isDown &&
        gameManager.thisPlayer === gameManager.p1
      ) {
        updateGameState(gameStatus.running)
        gameManager.socket.emit('syncGame', {
          playerObject: gameManager.thisPlayer,
          player: gameManager.thisPlayerText,
          gameState: gameStatus.running
        })
      }

      break
    case gameStatus.running:
      if (
        gameManager.previousState === gameStatus.idle ||
        gameManager.previousState === gameStatus.finished
      ) {
        // reset stats
        gameManager.score.p1 = 0
        gameManager.score.p2 = 0
        gameManager.score.p1Text.text = '0'
        gameManager.score.p2Text.text = '0'

        gameManager.currentWinner = 0

        gameManager.score.p1Text.visible = true
        gameManager.score.p2Text.visible = true

        gameManager.uiTexts.startGameText.visible = false
        gameManager.uiTexts.controlsText.visible = false
        gameManager.uiTexts.winnerText.visible = false
        gameManager.uiTexts.matchsResume.visible = false

        spawnBall(gameManager.actualScene, gameManager.spawnBallValues.velocity)
      }

      movePlayer(
        gameManager.thisPlayer,
        gameManager.inputs.keyW,
        gameManager.inputs.keyS
      )

      gameManager.score.p1Text.setText(`${gameManager.score.p1}`)
      gameManager.score.p2Text.setText(`${gameManager.score.p2}`)

      const winner = hasWinner(gameManager.score.p1, gameManager.score.p2)
      if (winner) {
        gameManager.currentWinner = winner
        updateGameState(gameStatus.finished)
        gameManager.score[`p${winner}Wins`] += 1
      } else updateGameState(gameStatus.running)

      break
    case gameStatus.finished:
      gameManager.uiTexts.winnerText.text = `Player ${gameManager.currentWinner} wins! (${gameManager.score.p1} - ${gameManager.score.p2})`
      gameManager.uiTexts.startGameText.setText(
        'Tap spacebar to start (Player 1)'
      )
      gameManager.uiTexts.winnerText.visible = true
      gameManager.uiTexts.startGameText.visible = true
      gameManager.uiTexts.matchsResume.visible = true
      gameManager.uiTexts.matchsResume.setText(
        `Score\n\nP1: ${gameManager.score.p1Wins}\nP2: ${gameManager.score.p2Wins}`
      )

      gameManager.score.p1Text.visible = false
      gameManager.score.p2Text.visible = false

      updateGameState(gameStatus.idle)
      if (gameManager.thisPlayerText === 'p1') {
        gameManager.socket.emit('syncGame', {
          playerObject: gameManager.thisPlayer,
          player: gameManager.thisPlayerText,
          gameState: gameStatus.finished,
          score: gameManager.score
        })
      }

      gameManager.score.p1Text.setText(`${gameManager.score.p1}`)
      gameManager.score.p2Text.setText(`${gameManager.score.p2}`)

      break
  }
}

function hasWinner(p1, p2) {
  if (p1 >= gameManager.maxScore) return 1
  else if (p2 >= gameManager.maxScore) return 2
  return 0
}

function updateGameState(newState) {
  gameManager.previousState = gameManager.gameState
  gameManager.gameState = newState

  //console.log({ prev: gameManager.previousState, curr: gameManager.gameState })
}

function movePlayer(player, up, down) {
  if (up.isDown) player.y -= 10
  else if (down.isDown) player.y += 10

  let ball = ''
  let score = ''

  if (gameManager.thisPlayerText === 'p1') {
    ball = gameManager.ball
    score = gameManager.score
  }

  gameManager.socket.emit('syncGame', {
    playerObject: player,
    player: gameManager.thisPlayerText,
    ball,
    score
  })
}

function scored(body, up, down, left, right) {
  let whoScored = ''
  let wasPointScored = false

  if (right) {
    gameManager.score.p1++
    whoScored = 'p1'
    wasPointScored = true
  } else if (left) {
    gameManager.score.p2++
    whoScored = 'p2'
    wasPointScored = true
  }

  return { wasPointScored, whoScored }
}

function processScored(body, up, down, left, right) {
  const scoreStatus = scored(body, up, down, left, right)
  if (scoreStatus.wasPointScored) {
    gameManager.audio.point.play()

    if (!hasWinner(gameManager.score.p1, gameManager.score.p2))
      respawnBall(gameManager.actualScene)
    else gameManager.ball.destroy()
  }
}

function respawnBall(scene) {
  gameManager.ball.destroy()
  spawnBall(scene, gameManager.spawnBallValues.velocity)
}

function spawnBall(scene, velocity) {
  gameManager.ball = scene.physics.add.sprite(400, 400, 'ball')
  gameManager.ball.setScale(0.25)
  gameManager.ball.body.collideWorldBounds = true
  gameManager.ball.body.onWorldBounds = true
  // scene gets it moving
  const directions = {
    horizontal: Phaser.Math.Between(1, 2),
    vertical: Phaser.Math.Between(1, 2)
  }

  if (directions.horizontal === 2) directions.horizontal = -1
  if (directions.vertical === 2) directions.vertical = -1

  gameManager.ball.body.velocity.setTo(
    velocity * directions.horizontal,
    velocity * directions.vertical
  )
  //  scene sets the image bounce energy for the horizontal
  //  and vertical vectors (as an x,y point). "1" is 100% energy return
  gameManager.ball.body.bounce.setTo(1, 1)

  scene.physics.add.collider(gameManager.p1, gameManager.ball, whenBallCollide)
  scene.physics.add.collider(gameManager.p2, gameManager.ball, whenBallCollide)
}

function whenBallCollide() {
  gameManager.spawnBallValues.velocity += 10
  gameManager.audio.ballImpacts[Phaser.Math.Between(0, 4)].play()
}

function getRndInteger(min, max) {
  return Math.floor(Math.random() * (max - min)) + min
}

function getSpawnBallValues() {
  return {
    directionH: getRndInteger(1, 3),
    directionV: getRndInteger(1, 3),
    velocity: getRndInteger(300, 401)
  }
}

const windowSize = { width: 800, height: 600 }

// TODO @imns1ght: create a config.js
export const phaserConfig = {
  type: Phaser.AUTO,
  audio: {
    disableWebAudio: true
  },
  scale: {
    mode: Phaser.Scale.FIT,
    parent: 'phaser-example',
    autoCenter: Phaser.Scale.CENTER_BOTH,
    width: windowSize.width,
    height: windowSize.height
  },
  physics: {
    default: 'arcade',
    arcade: {
      fps: 60,
      gravity: { y: 0 }
    }
  },
  scene: {
    preload: preload,
    create: create,
    update: update
  }
}

new Phaser.Game(phaserConfig)
