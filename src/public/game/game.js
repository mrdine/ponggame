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
  p1: {},
  p2: {},
  bola: {},
  uiTexts: {},
  pontos: {
    p1: 0, 
    p2: 0,
    p1Text: '',
    p2Text: ''
  },
  inputs: {
    keyW: '',
    keyS: '',
    keyUp: '',
    keyDown: '',
    keySpacebar: ''
  },
  actualScene : '',
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
}

function create() {
  gameManager.actualScene = this
  gameManager.p1 = this.physics.add.sprite(50, 300, 'p1').setImmovable();
  gameManager.p2 = this.physics.add.sprite(750, 300, 'p2').setImmovable();
  gameManager.pontos.p1Text = this.add.text(220, 300, '0', { font: '90px Courier', fill: '#004400' });
  gameManager.pontos.p2Text = this.add.text(580, 300, '0', { font: '90px Courier', fill: '#004400' });

  gameManager.uiTexts.startGameText = this.add.text(400, 300, 'tap spacebar to start', { font: '28px Courier', fill: '#ffffff', boundsAlignH: "center", boundsAlignV: "middle" });
  gameManager.uiTexts.controlsText = this.add.text(400, 340, 'controls: WASD ↑←↓→', { font: '14px Courier', fill: '#00CC00', boundsAlignH: "center", boundsAlignV: "middle" });
  gameManager.uiTexts.winnerText = this.add.text(400, 240, 'player 0 wins', { font: '20px Courier', fill: '#00CC00', boundsAlignH: "center", boundsAlignV: "middle" });

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

}

function update() {

  

  switch(gameManager.gameState) {
    case GAME_STATE_IDLE: {
      
      // aguarda SPACEBAR pra startar jogo
      if (gameManager.inputs.keySpacebar.isDown)
        updateGameState(GAME_STATE_RUNNING);

    } break;
    case GAME_STATE_RUNNING: {

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

          gameManager.p1.y = 300
          gameManager.p2.y = 300

          spawnBola(gameManager.actualScene)
      }

      movePlayer(gameManager.p1, gameManager.inputs.keyW, gameManager.inputs.keyS)
      movePlayer(gameManager.p2, gameManager.inputs.keyUp, gameManager.inputs.keyDown)

      gameManager.pontos.p1Text.setText(`${gameManager.pontos.p1}`)
      gameManager.pontos.p2Text.setText(`${gameManager.pontos.p2}`)

      let w = hasWinner( gameManager.pontos.p1, gameManager.pontos.p2 );
      if (w) {
        gameManager.currentWinner = w;
        updateGameState(GAME_STATE_FINISHED);
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
  if (pontuou(body, up, down, left, right))
    if (!hasWinner( gameManager.pontos.p1, gameManager.pontos.p2 ))
      respawnBola(gameManager.actualScene)
    else
      gameManager.bola.destroy()
}

function pontuou(body, up, down, left, right) {
  if(right) {
    gameManager.pontos.p1 += 1
    return true;
  }
  if(left) {
    gameManager.pontos.p2 += 1
    return true;
  }

  return false;
}

function respawnBola(scene) {
  gameManager.bola.destroy()
  spawnBola(scene)
}

function spawnBola(scene) {
  gameManager.bola = scene.physics.add.sprite(400, 400, 'bola');
  gameManager.bola.setScale(0.25)
  gameManager.bola.body.collideWorldBounds = true;
  gameManager.bola.body.onWorldBounds = true;
  //  scene gets it moving
  let directionH = Phaser.Math.Between(1,2)
  let directionV = Phaser.Math.Between(1,2)
  let velocity = Phaser.Math.Between(300,400)
  if(directionH === 2) {
    directionH = -1
  }
  if(directionV === 2) {
    directionV = -1
  } 
  gameManager.bola.body.velocity.setTo(velocity * directionH, velocity * directionV);
  //  scene sets the image bounce energy for the horizontal 
  //  and vertical vectors (as an x,y point). "1" is 100% energy return
  gameManager.bola.body.bounce.setTo(1, 1);


  scene.physics.add.collider(gameManager.p1, gameManager.bola);
  scene.physics.add.collider(gameManager.p2, gameManager.bola);
}

const game = new Phaser.Game(config);