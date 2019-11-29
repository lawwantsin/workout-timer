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

  rect(color, x, y, w, h, stroke, fill) {
    const c = this.context;
    if (stroke) {
      c.strokeStyle = color;
      c.strokeRect(x, y, w, h);
    }
    else {
      c.fillStyle = fill || color;
      c.fillRect(x, y, w, h);
    }
  }

  text(text, color, size, x, y, align) {
    const c = this.context;
    c.fillStyle = color;
    c.textAlign = align
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
    const oldFont = parseInt(this.font)

    // Positioning
    let x = t[2]
    let y = t[3]
    if (x && y) {
      this.x =  (x[x.length - 1] == '%') ? (((parseInt(x.slice(0, -1))/100.0) * g.canvas.width)) : parseInt(x);
      if (y[y.length - 1] == '%') {
        this.y = (((parseInt(y.slice(0, -1))/100.0) * g.canvas.height))
      } else if (y[0] == '+') {
        const extra = parseInt(y.slice(1, y.length))
        const lineHeight = oldFont + extra;
        this.y += lineHeight;
      } else {
        this.y = parseInt(y);
      }
    }

    switch (cmd) {

      case "bg":
        return { type: "rect", color: t[1], x: 0, y: 0, w: g.canvas.width, h: g.canvas.height};    // Min Entity
        break;

      case "fg":
        this.fg = t[1];
        break;

      case "circle":
        return { type: "circle", color: this.fg, x: this.x, y: this.y, size: t[1]};    // Min Entity
        break;

      case "rect":
        return { type: "rect", color: this.fg, x: this.x, y: this.y, w: t[4], h: t[5] };    // Min Entity
        break;

      case "font":
        this.font = parseInt(t[1])
        this.align = t[5] || 'center';
        break;

      case "text":
        if (this.lastY == this.y) this.y += parseInt(this.font); // Multi-line text
        t.shift() // Chop off command "text". Everything after is taken literally.
        return { type: "text", text: t.join(" "), color: this.fg, x: this.x, y: this.y, size: parseInt(this.font), align: this.align};  // Min Entity
        break;
    }
    this.lastY = this.y;
  }

  parse(slide) {
    return slide.split("\n").map(l => l.trim()).filter(l => l != "");
  }

  toArray() {
    return this.entities
  }

  draw(e) {
    const g = this.graphics
    const { type, text, size, align, color, x, y, w, h } = e
    switch (type) {
      case "circle":
        g.circle(color, x, y, size);
        break;
      case "rect":
        g.rect(color, x, y, w, h);
        break;
      case "text":
        g.text(text, color, size, x, y, align);
        break;
    }
  }
}

// ========================================================================
// GAME LOOP
// ========================================================================

class Game {
  constructor() {
    this.graphics = new Graphics();
    this.debugger = new Debug(this.graphics)
    this.loopId = null;
    this.animation = {
      inputFPS: 0,
      id: 0,
      frameCount: 0,
      fps: 0,
      currentFPS: 0,
      fpsInterval: 0,
      startTime: 0,
      now: 0,
      then: 0,
      elapsed: 0,
      stop: false
    }
    this.state = {
      slides: Data,
      current: 0,
      debugging: false
    }
  }

  start() {
    this.loopFPS(60)
    window.addEventListener("keydown", e => this.handlePress(e), false)
  }

  handlePress(e) {
    if (e.key == "ArrowRight") this.state.current++;
    if (e.key == "ArrowLeft") this.state.current--;
    if (e.key == "ArrowUp") {
      this.animation.fps *= 2
      this.loopFPS(this.animation.fps)
    }
    if (e.key == "ArrowDown") {
      this.animation.fps /= 2;
      this.loopFPS(this.animation.fps)
    }
    if (e.key == "Escape") this.state.debugging = !this.state.debugging;
    if (e.key == "CapsLock") {
      this.animation.stop = !this.animation.stop;
      this.loopFPS(this.animation.fps)
    }
    if (this.state.current > this.state.slides.length - 1) this.state.current = 0;
    if (this.state.current < 0) this.state.current = this.state.slides.length - 1;
  }

  doOneFrame() {
    const slide = this.state.slides[this.state.current]
    const reader = new ReadSlide(slide, this.graphics)
    reader.toArray().map(e => reader.draw(e));
    const secs = 3 - Math.floor(this.animation.sinceStart/1000).toFixed();
    if (secs < 0) this.animation.startTime = Date.now();
    else this.graphics.text(secs, 'black', 200, 200, 360)
    if (this.state.debugging) this.drawDebugging(reader);
    this.switchSlide();
  }

  switchSlide() {
    const SLIDE_TIME = 3000

    if (this.animation.sinceStart > SLIDE_TIME) {
      this.animation.startTime = Date.now();
      this.state.current++;
    }
    if (this.state.current > this.state.slides.length - 1) this.state.current = 0;
    if (this.state.current < 0) this.state.current = this.state.slides.length - 1;
  }

  addForce(e, force) {
    e.ax += force.x / (e.size || 1)
    e.ay += force.y / (e.size || 1)
  }

  move(e) {
    e.vx += e.ax
    e.vy += e.ay
    e.x += e.vx
    e.y += e.vy
    e.ax = 0
    e.ay = 0
  }

  drawDebugging(reader) {
    const GRAVITY = {x: 0, y: 3}
    const now = new Date()
    const time = `${now.getHours()}:${now.getMinutes()}:${now.getSeconds()}`
    const fpsInfo = `${this.animation.stop ? "PAUSED -" : "PLAYING -"} INPUT: ${this.animation.fps} FPS: ${this.animation.currentFPS} | COUNT: ${this.animation.frameCount} | TIMER: ${(this.animation.sinceStart/1000).toFixed()} |TIME: ${time}`
    this.debugger.fpsInfo(fpsInfo);
    const ex = reader.toArray();
    ex.map(e => {
      this.addForce(e, GRAVITY);
      this.move(e);
      this.debugger.draw(e);
    })
  }

  loopFPS(fps) {
    cancelAnimationFrame(this.animation.id);
    this.animation.fps = fps
    this.animation.fpsInterval = 1000 / this.animation.fps;
    this.animation.then = Date.now();
    this.animation.startTime = this.animation.then;
    this.animation.frameCount = 0;
    this.animation.id = requestAnimationFrame(() => this.loop());
  }

  loop() {
    this.animation.now = Date.now();
    this.animation.elapsed = this.animation.now - this.animation.then;
    this.animation.sinceStart = this.animation.now - this.animation.startTime;
    this.animation.currentFPS = (Math.round(1000 / (this.animation.sinceStart / ++this.animation.frameCount) * 100) / 100).toFixed(2);
    if (this.animation.elapsed > this.animation.fpsInterval) {
      this.doOneFrame()
      this.animation.then = this.animation.now - (this.animation.elapsed % this.animation.fpsInterval);
      if (this.animation.stop) return;
    }
    this.animation.id = requestAnimationFrame(() => this.loop());
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
    const { x, y } = e;
    this.graphics.circle('lightgreen', x, y, 1)
    this.graphics.rect('rgba(0,255,0,0.1)', x+2, y+2, 46, 32)
    this.graphics.text(`X  ${x.toFixed(1)}`, 'lightgreen', 10, x + 6, y + 16, 'left')
    this.graphics.text(`Y  ${y.toFixed(1)}`, 'lightgreen', 10, x + 6, y + 29, 'left')
  }

  fpsInfo(info) {
    this.graphics.text(info, "lightgreen", 12, 20, this.graphics.canvas.height - 20, 'left')
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