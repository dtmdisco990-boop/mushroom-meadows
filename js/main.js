"use strict";
(function () {
  const stage = document.getElementById("stage");
  function resize() {
    stage.style.transform = `scale(${Math.min(innerWidth / 1440, innerHeight / 900)})`;
  }
  window.addEventListener("resize", resize);
  resize();
  const C = Meadow.Config;
  Meadow.game = new Phaser.Game({
    type: Phaser.AUTO,
    parent: "game",
    width: C.width,
    height: C.height,
    backgroundColor: "#7ccbea",
    render: {
      antialias: true,
      roundPixels: false,
      powerPreference: "high-performance",
    },
    audio: { noAudio: true },
    fps: { target: 60, forceSetTimeOut: false },
    scene: [
      Meadow.BootScene,
      Meadow.MenuScene,
      Meadow.LoadoutScene,
      Meadow.GameScene,
      Meadow.VictoryScene,
    ],
  });
})();
