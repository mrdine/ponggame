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

const gameManager = {
  p1: {},
  p2: {},
  bola: {},
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
    keyDown: ''
  },
  actualScene : ''
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
  gameManager.pontos.p1Text = this.add.text(120, 50, '0', { font: '50px Courier', fill: '#00ff00' });
  gameManager.pontos.p2Text = this.add.text(680, 50, '0', { font: '50px Courier', fill: '#00ff00' });


  gameManager.p1.setScale(0.5)
  gameManager.p2.setScale(0.5)

  gameManager.pontos.p1Text.setOrigin(0.5)
  gameManager.pontos.p2Text.setOrigin(0.5)

  gameManager.inputs.keyW = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.W);
  gameManager.inputs.keyS = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.S);

  gameManager.inputs.keyUp = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.UP);
  gameManager.inputs.keyDown = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.DOWN);

  gameManager.p1.body.collideWorldBounds = true;
  gameManager.p2.body.collideWorldBounds = true;
  
  spawnBola(this)

  this.physics.world.on('worldbounds', (body, up, down, left, right) => {
    pontuou(body, up, down, left, right)
  })


}

function update() {

  movePlayer(gameManager.p1, gameManager.inputs.keyW, gameManager.inputs.keyS)
  movePlayer(gameManager.p2, gameManager.inputs.keyUp, gameManager.inputs.keyDown)

  gameManager.pontos.p1Text.setText(`${gameManager.pontos.p1}`)
  gameManager.pontos.p2Text.setText(`${gameManager.pontos.p2}`)



}

function movePlayer(player, up, down) {
  if (up.isDown) {
    player.y -= 10
  } else if (down.isDown) {
    player.y += 10
  }
}

function pontuou(body, up, down, left, right) {
  if(right) {
    gameManager.pontos.p1 += 1
    gameManager.bola.destroy()
    spawnBola(gameManager.actualScene)
  }
  if(left) {
    gameManager.pontos.p2 += 1
    gameManager.bola.destroy()
    spawnBola(gameManager.actualScene)

  }

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