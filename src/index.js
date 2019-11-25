import "./index.css"

// ========================================================================
// GRAPHICS
// ========================================================================

function debounce(fn, delay) {
  var timer = null;
  return function () {
    var context = this, args = arguments;
    clearTimeout(timer);
    timer = setTimeout(function () {
      fn.apply(context, args);
    }, delay);
  };
}

function throttle(fn, threshhold, scope) {
  threshhold || (threshhold = 250);
  var last,
      deferTimer;
  return function () {
    var context = scope || this;

    var now = +new Date,
        args = arguments;
    if (last && now < last + threshhold) {
      // hold on to it
      clearTimeout(deferTimer);
      deferTimer = setTimeout(function () {
        last = now;
        fn.apply(context, args);
      }, threshhold);
    } else {
      last = now;
      fn.apply(context, args);
    }
  };
}

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
// LOOP
// ========================================================================

const slide1 = `
  fg red
  bg black
  text Hello 200 30 600
`

const slide2 = `
  fg black
  bg red
  text Goodbye 200 30 670
`

const slide3 = `
  fg green
  bg blue
  text Twitter 200 300 670
`

class ReadSlide {
  constructor(slide, graphics) {
    this.fg = 'white'
    this.graphics = graphics;
    const lines = this.parse(slide)
    lines.map(line => this.interpet(line));
  }

  interpet(line) {
    const tokens = line.split(" ");
    const g = this.graphics
    switch (tokens[0]) {
      case "bg":
        g.rect(tokens[1], 0, 0, g.canvas.width, g.canvas.height);
        break;
      case "fg":
        this.fg = tokens[1];
        break;
      case "text":
        g.text(tokens[1], this.fg, parseInt(tokens[2]), parseInt(tokens[3]), parseInt(tokens[4]));
        break;
    }
  }

  parse(slide) {
    return slide.split("\n").map(l => l.trim()).filter(l => l != "");
  }
}

class Game {
  constructor() {
    this.graphics = new Graphics();
    this.state = {
      slides: [
        slide1, slide2, slide3
      ],
      current: 0
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
    if (this.state.current > this.state.slides.length - 1) this.state.current = 0;
    if (this.state.current < 0) this.state.current = this.state.slides.length - 1;
  }

  doOneFrame() {
    const slide = this.state.slides[this.state.current]
    console.log("CURRENT", this.state.current);
    new ReadSlide(slide, this.graphics)
  }

  loop() {
    this.doOneFrame()
    requestAnimationFrame(() => this.loop())
  }
}


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
// STARTUP
// ========================================================================

const boot = () => {
  const loop = new Game()
  Input.setup();
  loop.start();
}

window.onload = boot;
