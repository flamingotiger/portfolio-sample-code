class Hero {
  constructor(name, x, y, attack, shield, hp, potion, coin) {
    this.name = name;
    this.x = x;
    this.y = y;
    // 공격시 현재 좌표
    this.startX = null;
    this.startY = null;
    this.attack = attack;
    this.shield = shield;
    this.hp = {
      current: hp,
      max: null,
      barWidth: 160,
      bar: null,
      text: null,
    };
    this.potion = potion;
    this.coin = coin;
    this.action = "idle";
    this.hero = null;
  }
  getHero() {
    return this.hero;
  }
  getStartPosition() {
    return { x: this.startX, y: this.startY };
  }
  preload($this) {
    this.startX = this.x;
    this.startY = this.y;
    $this.load.atlas("hero", "assets/hero.png", "assets/hero.json");
    if (!this.hp.max) {
      this.hp.max = this.hp.current;
    }
  }
  create($this) {
    $this.anims.create({
      key: "hero/idle",
      frames: $this.anims.generateFrameNames("hero", {
        prefix: "idle/frame",
        start: 0,
        end: 2,
        zeroPad: 1,
      }),
      frameRate: 1,
      repeat: -1,
    });

    $this.anims.create({
      key: "hero/attack",
      frames: $this.anims.generateFrameNames("hero", {
        prefix: "attack/frame",
        start: 0,
        end: 5,
        zeroPad: 1,
      }),
      frameRate: 10,
      repeat: 0,
    });

    $this.anims.create({
      key: "hero/drink_potion",
      frames: $this.anims.generateFrameNames("hero", {
        prefix: "drink_potion/frame",
        start: 0,
        end: 2,
        zeroPad: 1,
      }),
      frameRate: 10,
      repeat: 0,
    });

    $this.anims.create({
      key: "hero/damage",
      frames: $this.anims.generateFrameNames("hero", {
        prefix: "damage/frame",
        start: 0,
        end: 1,
        zeroPad: 1,
      }),
      frameRate: 3,
      repeat: 0,
    });

    $this.anims.create({
      key: "hero/death",
      frames: $this.anims.generateFrameNames("hero", {
        prefix: "death/frame",
        start: 0,
        end: 2,
        zeroPad: 1,
      }),
      frameRate: 3,
      repeat: 0,
    });
    this.hero = $this.add.sprite(this.x, this.y);
    this.hero.setOrigin(0.5);
    this.hero.play("hero/idle");
  }
}
