const gameStatus = { idle: 0, running: 1, finished: 2 }

const gameManager = {
  p1: {},
  p2: {},
  ball: {},
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
    keyUp: '',
    keyDown: '',
    keySpacebar: ''
  },
  actualScene: '',
  gameState: gameStatus.idle,
  previousState: gameStatus.idle,
  maxScore: 3,
  currentWinner: 0
}

function preload() {
  this.load.setBaseURL(`/game`)
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
    'Controls\n\nP1: W A S D\nP2: ↑ ← ↓ →',
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
    'Tap spacebar to start',
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
  gameManager.inputs.keyUp = this.input.keyboard.addKey(
    Phaser.Input.Keyboard.KeyCodes.UP
  )
  gameManager.inputs.keyDown = this.input.keyboard.addKey(
    Phaser.Input.Keyboard.KeyCodes.DOWN
  )
  gameManager.inputs.keySpacebar = this.input.keyboard.addKey(
    Phaser.Input.Keyboard.KeyCodes.SPACE
  )
  gameManager.p1.body.collideWorldBounds = true
  gameManager.p2.body.collideWorldBounds = true

  this.physics.world.on('worldbounds', (body, up, down, left, right) => {
    processScored(body, up, down, left, right)
  })

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
}

function update() {
  switch (gameManager.gameState) {
    case gameStatus.idle:
      // Start the game if spacebar is pressed
      if (gameManager.inputs.keySpacebar.isDown) {
        updateGameState(gameStatus.running)
      }

      break
    case gameStatus.running:
      if (!gameManager.audio.cyberpunkMusic.isPlaying) {
        gameManager.audio.cyberpunkMusic.play({ volume: 0.7, loop: true })
      }
      if (
        gameManager.previousState == gameStatus.idle ||
        gameManager.previousState == gameStatus.finished
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

        gameManager.p1.y = 300
        gameManager.p2.y = 300

        spawnBall(gameManager.actualScene)
      }

      movePlayer(
        gameManager.p1,
        gameManager.inputs.keyW,
        gameManager.inputs.keyS
      )
      movePlayer(
        gameManager.p2,
        gameManager.inputs.keyUp,
        gameManager.inputs.keyDown
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
      if (gameManager.previousState == gameStatus.running) {
        gameManager.uiTexts.winnerText.text = `Player ${gameManager.currentWinner} wins! (${gameManager.score.p1} - ${gameManager.score.p2})`
        gameManager.uiTexts.winnerText.visible = true
        gameManager.uiTexts.startGameText.visible = true
        gameManager.uiTexts.matchsResume.visible = true
        gameManager.uiTexts.matchsResume.setText(
          `Score\n\nP1: ${gameManager.score.p1Wins}\nP2: ${gameManager.score.p2Wins}`
        )

        gameManager.score.p1Text.visible = false
        gameManager.score.p2Text.visible = false

        updateGameState(gameStatus.idle)
      } else updateGameState(gameStatus.finished)

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
}

function movePlayer(player, up, down) {
  if (up.isDown) player.y -= 10
  else if (down.isDown) player.y += 10
}

function processScored(_body, _up, _down, left, right) {
  if (scored(left, right)) {
    gameManager.audio.point.play()
    if (!hasWinner(gameManager.score.p1, gameManager.score.p2))
      respawnBall(gameManager.actualScene)
    else gameManager.ball.destroy()
  }
}

function scored(left, right) {
  if (!right && !left) return false

  if (right) gameManager.score.p1++
  else if (left) gameManager.score.p2++

  return true
}

function respawnBall(scene) {
  gameManager.ball.destroy()
  spawnBall(scene)
}

function spawnBall(scene) {
  gameManager.ball = scene.physics.add.sprite(400, 400, 'ball')
  gameManager.ball.setScale(0.25)
  gameManager.ball.body.collideWorldBounds = true
  gameManager.ball.body.onWorldBounds = true
  //  scene gets it moving
  const directions = {
    horizontal: Phaser.Math.Between(1, 2),
    vertical: Phaser.Math.Between(1, 2)
  }
  const velocity = Phaser.Math.Between(300, 350)

  if (directions.horizontal === 2) directions.horizontal = -1
  if (directions.vertical === 2) directions.vertical = -1

  gameManager.ball.body.velocity.setTo(
    velocity * directions.horizontal,
    velocity * directions.vertical
  )
  //  scene sets the image bounce energy for the horizontal
  //  and vertical vectors (as an x,y point). "1" is 100% energy return
  gameManager.ball.body.bounce.setTo(1, 1)

  scene.physics.add.collider(gameManager.p1, gameManager.ball, playAudioBall)
  scene.physics.add.collider(gameManager.p2, gameManager.ball, playAudioBall)
}

function playAudioBall() {
  gameManager.audio.ballImpacts[Phaser.Math.Between(0, 4)].play()
}

const windowSize = { width: 800, height: 600 }

// TODO @imns1ght: create a config.js
const phaserConfig = {
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

const game = new Phaser.Game(phaserConfig)
