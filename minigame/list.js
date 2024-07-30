var HomeScene = new Phaser.Class({
  Extends: Phaser.Scene,

  initialize: function HomeScene() {
    Phaser.Scene.call(this, { key: "homeScene" });
  },

  preload: function () {
    this.load.image("logo", "./assets/logo.png");
    this.load.image("copyright", "./assets/copyright.png");
    this.load.image("habo", "./assets/habo.png");
    this.load.image("start_btn", "./assets/start_btn.png");
    this.load.image("road_bg", "assets/road_bg.png");
  },

  create: function () {
    var roadBg = this.add.sprite(0, 0, "road_bg");
    roadBg.setOrigin(0);

    var logo = this.add.sprite(400, 380, "logo");
    logo.setOrigin(0.5);

    var startText = this.add.text(400, 550, "아무키나 누르세요", {
      fontSize: "24px",
      fill: "#fff",
    });
    startText.setOrigin(0.5);

    this.time.addEvent({
      delay: 500,
      callback: function () {
        startText.visible = !startText.visible;
      },
      loop: true,
    });

    var hero = localStorage.getItem("beer_hero");
    if (hero) {
      var stat = JSON.parse(hero);
      this.game.customData = {
        hero: new Hero(
          "hero",
          240,
          canvasSize / 2 - 100,
          stat.attack,
          stat.shield,
          stat.hp,
          stat.potion,
          stat.coin
        ),
      };
    } else {
      this.game.customData = {
        hero: new Hero(
          "hero",
          240,
          canvasSize / 2 - 100,
          setupHeroStat.attack,
          setupHeroStat.shield,
          setupHeroStat.hp,
          setupHeroStat.potion,
          setupHeroStat.coin
        ),
      };
    }

    var scene = this.scene;
    var hb = this.add.sprite(400, 1000, "HB");
    hb.setOrigin(0.5);
    ["기획", "디자인", "개발"].map((t, index) => {
      var a = this.add.text(400, 1350 - index * 80, `${t}: HB`, {
        fontSize: "24px",
        fill: "#fff",
      });
      a.setOrigin(0.5);
    });
    var start_btn = this.add.sprite(400, 1450, "start_btn");
    start_btn.setOrigin(0.5);
    start_btn.setInteractive();
    start_btn.on("pointerdown", function () {
      scene.start("roadScene");
    });
    this.input.on(
      "pointerdown",
      function () {
        this.cameras.main.pan(400, 1200, 1000, "Power2");
      },
      this
    );

    this.input.keyboard.on(
      "keydown",
      function () {
        this.cameras.main.pan(400, 1200, 1000, "Power2");
      },
      this
    );
  },
});

var homeScene = new HomeScene();
