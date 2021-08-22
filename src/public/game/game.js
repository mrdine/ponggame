const width = 800
const height = 600

const config = {
  type: Phaser.AUTO,
  audio: {
    disableWebAudio: true
  },
  scale: {
    mode: Phaser.Scale.FIT,
    parent: 'phaser-example',
    autoCenter: Phaser.Scale.CENTER_BOTH,
    width: 800,
    height: 600
  },
  physics: {
    default: 'arcade',
    arcade: {
      fps: 60,
      gravity: { y: 0 },
    }
  },
  scene: {
    preload: preload,
    create: create,
    update: update,
  }
};

const GAME_STATE_IDLE = 0;
const GAME_STATE_RUNNING = 1;
const GAME_STATE_FINISHED = 2;

const gameManager = {
  socket: {},
  p1: {},
  p2: {},
  thisPlayer: null,
  otherPlayer: null,
  bola: {},
  spawnBolaValues: {},
  uiTexts: {},
  audio: { bolaImpacts: [] },
  pontos: {
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
  gameState: GAME_STATE_IDLE,
  previousState: GAME_STATE_IDLE,
  maxScore: 3,
  currentWinner: 0
}

function preload() {
  this.load.setBaseURL(`/game`);
  this.load.image('p1', './assets/p1.png');
  this.load.image('p2', './assets/p2.png');
  this.load.image('bola', './assets/bola.png');

  this.load.audio('cyberpunk', './assets/cyberpunk8bit.mp3')
  this.load.audio('ponto', './assets/ponto.ogg')
  for (let i = 1; i <= 5; i++) {
    this.load.audio(`bolaImpact${i}`, `./assets/bola${i}.ogg`)
  }
}

function create() {
  gameManager.socket = io()
  gameManager.actualScene = this
  gameManager.p1 = this.physics.add.sprite(50, 300, 'p1').setImmovable();
  gameManager.p2 = this.physics.add.sprite(750, 300, 'p2').setImmovable();
  gameManager.pontos.p1Text = this.add.text(220, 300, '0', { font: '90px Courier', fill: '#004400' });
  gameManager.pontos.p2Text = this.add.text(580, 300, '0', { font: '90px Courier', fill: '#004400' });

  gameManager.uiTexts.startGameText = this.add.text(400, 400, 'tap spacebar to start', { font: '28px Courier', fill: '#ffffff', boundsAlignH: "center", boundsAlignV: "middle" });
  gameManager.uiTexts.controlsText = this.add.text(400, 340, 'controls: WASD ↑←↓→', { font: '14px Courier', fill: '#00CC00', boundsAlignH: "center", boundsAlignV: "middle" });
  gameManager.uiTexts.winnerText = this.add.text(400, 240, 'player 0 wins', { font: '20px Courier', fill: '#00CC00', boundsAlignH: "center", boundsAlignV: "middle" });
  gameManager.uiTexts.matchsResume = this.add.text(300, 280, `matchs resume\nplayer 1: ${gameManager.pontos.p1Wins}\nplayer 2: ${gameManager.pontos.p2Wins}`, { font: '20px Courier', fill: '#00CC00', boundsAlignH: "center", boundsAlignV: "middle" });

  gameManager.audio.cyberpunkMusic = this.sound.add('cyberpunk')
  gameManager.audio.ponto = this.sound.add('ponto')
  for (let i = 1; i <= 5; i++) {
    gameManager.audio.bolaImpacts.push(this.sound.add(`bolaImpact${i}`))
  }


  gameManager.uiTexts.startGameText.setOrigin(0.5)
  gameManager.uiTexts.controlsText.setOrigin(0.5)
  gameManager.uiTexts.winnerText.setOrigin(0.5)

  gameManager.uiTexts.winnerText.visible = false;

  gameManager.p1.setScale(0.5)
  gameManager.p2.setScale(0.5)

  gameManager.pontos.p1Text.setOrigin(0.5)
  gameManager.pontos.p2Text.setOrigin(0.5)

  gameManager.pontos.p1Text.visible = false;
  gameManager.pontos.p2Text.visible = false;
  gameManager.uiTexts.matchsResume.visible = false;

  gameManager.inputs.keyW = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.W);
  gameManager.inputs.keyS = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.S);
  gameManager.inputs.keyUp = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.UP);
  gameManager.inputs.keyDown = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.DOWN);
  gameManager.inputs.keySpacebar = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);

  gameManager.p1.body.collideWorldBounds = true;
  gameManager.p2.body.collideWorldBounds = true;

  this.physics.world.on('worldbounds', (body, up, down, left, right) => {
    processPontuou(body, up, down, left, right)
  })


  const primaryColor = Phaser.Display.Color.ValueToColor(0x00FF00)
  const secondaryColor = Phaser.Display.Color.ValueToColor(0x008800)

  this.tweens.addCounter({
    from: 0,
    to: 100,
    duration: 600,
    ease: Phaser.Math.Easing.Sine.InOut,
    repeat: -1,
    yoyo: true,
    onUpdate: tween => {
      const value = tween.getValue()
      const colorObject = Phaser.Display.Color.Interpolate.ColorWithColor(
        primaryColor,
        secondaryColor,
        100,
        value
      )

      const color = Phaser.Display.Color.GetColor(colorObject.r, colorObject.g, colorObject.b)

      gameManager.uiTexts.startGameText.setTint(color)
    }
  })

  // socket
  gameManager.socket.on('currentPlayers', function (players) {
    gameManager.p1.nome = 'player 1'
    gameManager.p2.nome = 'player 2'
    if (!gameManager.thisPlayer) {
      let myNumberPlayer = players[gameManager.socket.id].playerNumber
      if (myNumberPlayer === 1) {
        gameManager.thisPlayer = gameManager.p1
        gameManager.otherPlayer = gameManager.p2
      } else {
        gameManager.thisPlayer = gameManager.p2
        gameManager.otherPlayer = gameManager.p1
      }

      console.log(gameManager.thisPlayer.nome)
    }
  });

  gameManager.socket.on('playerSaiu', function(game) {
    window.location.reload()
    updateGameState(GAME_STATE_IDLE)
  })

  gameManager.socket.on('startGame', function (game) {
    console.log('Servidor mandou iniciar o jogo')
    updateGameState(game.gameState)
    gameManager.maxScore = game.maxScore
    gameManager.spawnBolaValues = game.spawnBolaValues
  })

  gameManager.socket.on('respostaPontuou', function(game) {
    //console.log('')
    gameManager.bola.destroy()

    gameManager.spawnBolaValues = game.spawnBolaValues
    gameManager.pontos.p1 = game.pontos.p1
    gameManager.pontos.p2 = game.pontos.p2
    console.log(gameManager.pontos)
    if (!hasWinner(gameManager.pontos.p1, gameManager.pontos.p2))
      respawnBola(gameManager.actualScene)
    else
      gameManager.bola.destroy()
    
  })

}

function update() {



  switch (gameManager.gameState) {
    case GAME_STATE_IDLE: {

      // aguarda SPACEBAR pra startar jogo
      if (gameManager.inputs.keySpacebar.isDown)
        updateGameState(GAME_STATE_RUNNING);

    } break;
    case GAME_STATE_RUNNING: {
      if (!gameManager.audio.cyberpunkMusic.isPlaying) {
        //gameManager.audio.cyberpunkMusic.play({ volume: 0.7, loop: true })
      }
      if (gameManager.previousState == GAME_STATE_IDLE
        || gameManager.previousState == GAME_STATE_FINISHED) {

        // reset stats
        gameManager.pontos.p1 = 0;
        gameManager.pontos.p2 = 0;
        gameManager.pontos.p1Text.text = '0';
        gameManager.pontos.p2Text.text = '0';

        gameManager.currentWinner = 0;

        gameManager.pontos.p1Text.visible = true
        gameManager.pontos.p2Text.visible = true

        gameManager.uiTexts.startGameText.visible = false
        gameManager.uiTexts.controlsText.visible = false
        gameManager.uiTexts.winnerText.visible = false
        gameManager.uiTexts.matchsResume.visible = false

        gameManager.p1.y = 300
        gameManager.p2.y = 300

        spawnBola(gameManager.actualScene, gameManager.spawnBolaValues.directionH, gameManager.spawnBolaValues.directionV, gameManager.spawnBolaValues.velocity)
      }

      movePlayer(gameManager.p1, gameManager.inputs.keyW, gameManager.inputs.keyS)
      movePlayer(gameManager.p2, gameManager.inputs.keyUp, gameManager.inputs.keyDown)

      gameManager.pontos.p1Text.setText(`${gameManager.pontos.p1}`)
      gameManager.pontos.p2Text.setText(`${gameManager.pontos.p2}`)

      let w = hasWinner(gameManager.pontos.p1, gameManager.pontos.p2);
      if (w) {
        gameManager.currentWinner = w;
        updateGameState(GAME_STATE_FINISHED);
        gameManager.pontos[`p${w}Wins`] += 1
      } else
        updateGameState(GAME_STATE_RUNNING);

    } break;
    case GAME_STATE_FINISHED: {

      if (gameManager.previousState == GAME_STATE_RUNNING) {
        gameManager.uiTexts.winnerText.text = '' + gameManager.pontos.p1 +
          ' - ' + gameManager.pontos.p2 + ' (player ' +
          gameManager.currentWinner + ' wins)'
        gameManager.uiTexts.winnerText.visible = true;
        gameManager.uiTexts.startGameText.visible = true;
        gameManager.uiTexts.matchsResume.visible = true
        gameManager.uiTexts.matchsResume.setText(`matchs resume\nplayer 1: ${gameManager.pontos.p1Wins}\nplayer 2: ${gameManager.pontos.p2Wins}`)

        gameManager.pontos.p1Text.visible = false
        gameManager.pontos.p2Text.visible = false

        updateGameState(GAME_STATE_IDLE);
      } else
        updateGameState(GAME_STATE_FINISHED);

      gameManager.pontos.p1Text.setText(`${gameManager.pontos.p1}`)
      gameManager.pontos.p2Text.setText(`${gameManager.pontos.p2}`)
    } break;
  }

}

function hasWinner(p1, p2) {
  if (p1 >= gameManager.maxScore)
    return 1;
  else if (p2 >= gameManager.maxScore)
    return 2;
  return 0;
}

function updateGameState(newState) {
  gameManager.previousState = gameManager.gameState;
  gameManager.gameState = newState;
}

function movePlayer(player, up, down) {
  if (up.isDown) {
    player.y -= 10
  } else if (down.isDown) {
    player.y += 10
  }
}

function processPontuou(body, up, down, left, right) {
  let quemPontuou = pontuou(body, up, down, left, right)
  if (quemPontuou.pontuou) {
    gameManager.audio.ponto.play()
    gameManager.socket.emit('pontuou', { quem: quemPontuou.quem, pontos: { p1: gameManager.pontos.p1, p2: gameManager.pontos.p2 } })
    /*
    if (!hasWinner(gameManager.pontos.p1, gameManager.pontos.p2))
      respawnBola(gameManager.actualScene)
    else
      gameManager.bola.destroy()
    */
  }
}

function pontuou(body, up, down, left, right) {
  let quem = ''
  let pontuou = false
  if (right) {
    gameManager.pontos.p1 += 1
    quem = 'p1'
    pontuou = true
    return { pontuou, quem };
  }
  if (left) {
    gameManager.pontos.p2 += 1
    quem = 'p2'
    pontuou = true
    return { pontuou, quem };
  }

  return { pontuou, quem };
}

function respawnBola(scene) {
  gameManager.bola.destroy()
  spawnBola(scene, gameManager.spawnBolaValues.directionH, gameManager.spawnBolaValues.directionV, gameManager.spawnBolaValues.velocity)
}

function spawnBola(scene, directionH, directionV, velocity) {
  gameManager.bola = scene.physics.add.sprite(400, 400, 'bola');
  gameManager.bola.setScale(0.25)
  gameManager.bola.body.collideWorldBounds = true;
  gameManager.bola.body.onWorldBounds = true;

  if (directionH === 2) {
    directionH = -1
  }
  if (directionV === 2) {
    directionV = -1
  }
  gameManager.bola.body.velocity.setTo(velocity * directionH, velocity * directionV);
  //  scene sets the image bounce energy for the horizontal 
  //  and vertical vectors (as an x,y point). "1" is 100% energy return
  gameManager.bola.body.bounce.setTo(1, 1);


  scene.physics.add.collider(gameManager.p1, gameManager.bola, playAudioBola);
  scene.physics.add.collider(gameManager.p2, gameManager.bola, playAudioBola);

}

function playAudioBola() {
  gameManager.audio.bolaImpacts[Phaser.Math.Between(0, 4)].play()
}

const game = new Phaser.Game(config);