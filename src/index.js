import "./index.css"
import Data from "./data.js"

// ========================================================================
// INPUT
// ========================================================================
let KEYS_PRESSED = {}
class Input {
  constructor() {
    console.error("Please use as Singleton");
  }

  static setup() {
    window.addEventListener('keydown', this.keyDown, false)
    window.addEventListener('keyup', this.keyUp, false)
  }

  static keyDown(e) {
    KEYS_PRESSED[e.key] = true;
    console.log("KEY: ", Object.keys(KEYS_PRESSED).join(", "));
  }

  static keyUp(e) {
    delete KEYS_PRESSED[e.key];
  }

  static keyPressed(key) {
    return KEYS_PRESSED[key]
  }
}

// ========================================================================
// GRAPHICS
// ========================================================================

class Graphics {
  constructor() {
    this.canvas = document.querySelector('canvas');
    this.context = this.canvas.getContext('2d');
    window.addEventListener('resize', () => this.resize())
    this.resize();
    this.fps();
  }

  circle(color, x, y, r) {
    const c = this.context;
    c.fillStyle = color;
    c.beginPath();
    c.arc(x, y, r, 0, Math.PI*2);
    c.fill();
  }

  rect(color, x, y, w, h) {
    const c = this.context;
    c.fillStyle = color;
    c.fillRect(x, y, w, h);
  }

  text(text, color, size, x, y) {
    const c = this.context;
    c.fillStyle = color;
    c.textAlign = 'center'
    c.font = `normal bold ${size}px sans-serif`;
    c.fillText(text, x, y)
  }

  resize() {
    this.canvas.width = window.innerWidth;
    this.canvas.height = window.innerHeight;
  }

  fps() {
    const now = performance.now();
    const delta = now - this.last;
    this.last = now
    this.text(delta, 'red', 50, 20, 20)
  }
}

// ========================================================================
// INTERPRETER
// ========================================================================

class ReadSlide {
  constructor(slide, graphics) {
    this.fg = 'white'
    this.font = 100
    this.x = 0
    this.y = 0
    this.lastY = null;
    this.graphics = graphics;
    this.entities = [];
    const lines = this.parse(slide)
    for (var i = 0; i < lines.length; i++) {
      const line = lines[i];
      const entity = this.interpet(line)
      if (entity) this.entities.push(entity)
    }
  }

  /*
  SAMPLE SLIDE
  fg black
  bg red
  font 200 50% 50%
  text Such a sweet feature
  */
  interpet(line) {
    const t = line.split(" ");
    const g = this.graphics
    const cmd = t[0]
    switch (cmd) {

      case "bg":
        g.rect(t[1], 0, 0, g.canvas.width, g.canvas.height);
        break;

      case "fg":
        this.fg = t[1];
        break;

      case "font":
        let x = t[2]
        let y = t[3]
        this.x =  (x[x.length - 1] == '%') ? (((parseInt(x.slice(0, -1))/100.0) * g.canvas.width)) : parseInt(x);

        const oldFont = parseInt(this.font)
        this.font = parseInt(t[1])
        if (y[y.length - 1] == '%') {
          this.y = (((parseInt(y.slice(0, -1))/100.0) * g.canvas.height))
        } else if (y[0] == '+') {
          const extra = parseInt(y.slice(1, y.length))
          const lineHeight = oldFont + extra;
          this.y += lineHeight;
        } else {
          this.y = parseInt(y);
        }
        break;

      case "text":
        console.log(this.lastY, this.y);
        if (this.lastY == this.y) {
          this.y += parseInt(this.font);
        }
        t.shift()
        g.text(t.join(" "), this.fg, this.font, this.x, this.y);
        return { x: this.x, y: this.y};
        break;
    }
    this.lastY = this.y;
  }

  parse(slide) {
    return slide.split("\n").map(l => l.trim()).filter(l => l != "");
  }

  export() {
    return this.entities
  }
}

// ========================================================================
// GAME LOOP
// ========================================================================

class Game {
  constructor() {
    this.graphics = new Graphics();
    this.debugger = new Debug(this.graphics)
    this.state = {
      slides: Data,
      current: 0,
      debugging: false
    }
  }

  start() {
    this.loop()
    window.addEventListener("keydown", e => this.handlePress(e), false)
  }

  handlePress(e) {
    console.log(e.key);
    if (e.key == "ArrowRight") this.state.current++;
    if (e.key == "ArrowLeft") this.state.current--;
    if (e.key == "Escape") this.state.debugging = !this.state.debugging;
    if (this.state.current > this.state.slides.length - 1) this.state.current = 0;
    if (this.state.current < 0) this.state.current = this.state.slides.length - 1;
  }

  doOneFrame() {
    const slide = this.state.slides[this.state.current]
    const reader = new ReadSlide(slide, this.graphics)
    if (this.state.debugging) {
      const ex = reader.export();
      // console.log(ex)
      ex.map(e => this.debugger.draw(e));
    }
  }

  loop() {
    this.doOneFrame()
    requestAnimationFrame(() => this.loop())
  }
}


// ========================================================================
// DEBUG
// ========================================================================

class Debug {
  constructor(graphics) {
    this.graphics = graphics;
  }

  draw(e) {
    const { x, y } = this;
    const g = this.graphics
    g.text(`X: ${x}`, 'white', 30, x, y)
    g.text(`Y: ${y}`, 'white', 30, x, y+30)
  }
}

// ========================================================================
// STARTUP
// ========================================================================

const boot = () => {
  const loop = new Game()
  Input.setup();
  loop.start();
}

window.onload = boot;
