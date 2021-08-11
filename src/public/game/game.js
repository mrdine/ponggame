const width = 800
const height = 600

const config = {
  width: 800,
  height: 600,
  type: Phaser.AUTO,
  audio: {
    disableWebAudio: true
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
  inputs: {
    keyW: '',
    keyS: '',
    keyUp: '',
    keyDown: ''
  }
}

function preload() {
  this.load.setBaseURL(`/game`);
  this.load.image('p1', './assets/p1.png');
  this.load.image('p2', './assets/p2.png');
  this.load.image('bola', './assets/bola.png');
}

function create() {
  gameManager.p1 = this.physics.add.sprite(50, 300, 'p1').setImmovable();
  gameManager.p2 = this.physics.add.sprite(750, 300, 'p2').setImmovable();
  gameManager.bola = this.physics.add.sprite(300, 300, 'bola');

  gameManager.bola.setScale(0.25)
  gameManager.p1.setScale(0.5)
  gameManager.p2.setScale(0.5)

  gameManager.inputs.keyW = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.W);
  gameManager.inputs.keyS = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.S);

  gameManager.inputs.keyUp = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.UP);
  gameManager.inputs.keyDown = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.DOWN);

  gameManager.p1.body.collideWorldBounds = true;
  gameManager.p2.body.collideWorldBounds = true;
  gameManager.bola.body.collideWorldBounds = true;
  //  This gets it moving
  gameManager.bola.body.velocity.setTo(300, 300);
  //  This sets the image bounce energy for the horizontal 
  //  and vertical vectors (as an x,y point). "1" is 100% energy return
  gameManager.bola.body.bounce.setTo(1, 1);


  this.physics.add.collider(gameManager.p1, gameManager.bola);
  this.physics.add.collider(gameManager.p2, gameManager.bola);


}

function update() {

  movePlayer(gameManager.p1, gameManager.inputs.keyW, gameManager.inputs.keyS)
  movePlayer(gameManager.p2, gameManager.inputs.keyUp, gameManager.inputs.keyDown)


}

function movePlayer(player, up, down) {
  if (up.isDown) {
    player.y -= 10
  } else if (down.isDown) {
    player.y += 10
  }
}

const game = new Phaser.Game(config);