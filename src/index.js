import "./index.css"
import Data from "./data.json"

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
  }

  validate() {
    const args = Array.from(arguments)
    args.map(a => {
      if (typeof a === 'undefined' || a === null) {
        console.error(`Wrong arguments drawing graphics: ${args.join(", ")}`);
      }
    })
  }

  circle(color, x, y, r) {
    this.validate(color, x, y, r);
    const c = this.context;
    c.fillStyle = color;
    c.beginPath();
    c.arc(x, y, r, 0, Math.PI*2);
    c.fill();
  }

  rect(color, x, y, w, h, stroke, fill) {
    this.validate(color, x, y, w, h);
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

  text(text, color, size, x, y, align, maxWidth) {
    this.validate(text, color, size, x, y);
    const c = this.context;
    c.fillStyle = color;
    c.textAlign = align || 'center'
    c.font = `normal bold ${size}px sans-serif`;
    const lines = maxWidth ? this.wrappingText(text, maxWidth) : [text]
    lines.map((line, i) => {
      const lh = (size + 15) * i
      c.fillText(line, x, y + lh)
    });

  }

  resize() {
    this.canvas.width = window.innerWidth;
    this.canvas.height = window.innerHeight;
  }

  wrappingText(text, maxWidth) {
    const c = this.context
    var lines = [],
    words = text.replace(/\n\n/g,' ` ').replace(/(\n\s|\s\n)/g,'\r')
    .replace(/\s\s/g,' ').replace('`',' ').replace(/(\r|\n)/g,' '+' ').split(' '),
    space = c.measureText(' ').width,
    width = 0,
    line = '',
    word = '',
    len = words.length,
    w = 0,
    i;
    for (i = 0; i < len; i++) {
      word = words[i];
      w = word ? c.measureText(word).width : 0;
      if (w) {
        width = width + space + w;
      }
      if (w > maxWidth) {
        return [];
      } else if (w && width < maxWidth) {
        line += (i ? ' ' : '') + word;
      } else {
        !i || lines.push(line !== '' ? line.trim() : '');
        line = word;
        width = w;
      }
    }
    if (len !== i || line !== '') {
      lines.push(line);
    }
    return lines;
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
    this.phases = ["warmups", "exercises", "stretches"];
    this.REP_TIMES = {
      warmups: 30,
      exercises: 60,
      stretches: 30
    }
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
      phase: 0,
      warmups: Data.warmups,
      exercises: Data.exercises.flat(),
      stretches: Data.stretches,
      current: 0,
      debugging: false,
    }
  }

  start() {
    this.loopFPS(60)
    window.addEventListener("keydown", e => this.handlePress(e), false)
  }

  handlePress(e) {
    if (e.key == "ArrowRight") {
      this.state.current++;
      this.animation.startTime = Date.now();
    }
    if (e.key == "ArrowLeft") {
      this.state.current--;
      this.animation.startTime = Date.now();
    }
    if (e.key == "ArrowUp") {
      this.animation.fps *= 2
      this.loopFPS(this.animation.fps)
    }
    if (e.key == "ArrowDown") {
      this.animation.fps /= 2;
      this.loopFPS(this.animation.fps)
    }
    if (e.key == "Escape") this.state.debugging = !this.state.debugging;
    if (e.keyCode == 32) {
      this.animation.stop = !this.animation.stop;
      if (!this.animation.stop) this.loopFPS(this.animation.fps, true)
    }
    console.log("PHASE: ", this.state.phase, "EX: ", this.state.current)
  }

  doOneFrame() {
    const G = this.graphics;
    const w = G.canvas.width;
    const h = G.canvas.height;
    const r = 150;
    this.switch();
    let currentPhase = this.phases[this.state.phase];
    const exercise = this.state[currentPhase][this.state.current];
    const secs = this.REP_TIMES[currentPhase] - Math.floor(this.animation.sinceStart/1000).toFixed();
    G.rect('black', 0, 0, w, h);
    G.text(exercise.name, 'white', 60, w/2, 100);
    G.circle('white', w/2, h/2, r);
    G.text(secs, 'black', 200, w/2, h/2 + 70);
    const cueNum = this.getCueNum(exercise, currentPhase, secs);
    const cue = exercise.cues[cueNum];
    G.text(cue, 'white', 50, w/2, h/2 + 270, 'center', w - 100);
  }

  getCueNum(exercise, currentPhase, secs) {
    const total = exercise.cues.length
    const repSecLength = this.REP_TIMES[currentPhase]
    const perCue = repSecLength / total;
    let currentCue = Math.floor((repSecLength - secs) / repSecLength * total);
    if (currentCue > total-1) currentCue = total-1;
    if (currentCue < 0) currentCue = 0;
    return currentCue
  }

  switch() {
    // Over time
    if (this.animation.sinceStart > this.REP_TIMES[this.phases[this.state.phase]] * 1000) {
      this.animation.startTime = Date.now();
      this.state.current++;
    }
    let currentPhase = this.phases[this.state.phase]
    // Over top
    if (this.state.current > this.state[currentPhase].length - 1) {
      this.state.phase++;
      this.state.current = 0;
      currentPhase = this.phases[this.state.phase]
      if (this.state.phase > this.phases.length - 1) {
        this.state.phase = 0;
      }
      if (this.state.phase < 0) {
        this.state.phase = this.phases.length - 1;
        this.state.current = this.state[currentPhase].length - 1;
      }
    }
    // Under bottom
    if (this.state.current < 0) {
      this.state.phase--;
      if (this.state.phase > this.phases.length) this.state.phase = 0;
      if (this.state.phase < 0) this.state.phase = this.phases.length - 1;
      currentPhase = this.phases[this.state.phase];
      this.state.current = this.state[currentPhase].length - 1;
    }
  }

  drawDebugging(reader) {
    const now = new Date();
    const time = `${now.getHours()}:${now.getMinutes()}:${now.getSeconds()}`;
    const fpsInfo = `${this.animation.stop ? "PAUSED -" : "PLAYING -"} INPUT: ${this.animation.fps} FPS: ${this.animation.currentFPS} | COUNT: ${this.animation.frameCount} | TIMER: ${(this.animation.sinceStart/1000).toFixed()} |TIME: ${time}`;
    this.debugger.fpsInfo(fpsInfo);
    const ex = reader.toArray();
    ex.map(e => {
      this.addForce(e, GRAVITY);
      this.move(e);
      this.debugger.draw(e);
    })
  }

  loopFPS(fps, maintainTime) {
    cancelAnimationFrame(this.animation.id);
    this.animation.fps = fps;
    this.animation.fpsInterval = 1000 / this.animation.fps;
    if (!maintainTime) {
      this.animation.frameCount = 0;
      this.animation.then = Date.now();
    }
    else {
       this.animation.frameCount = this.animation.frameCount;
    }
    this.animation.startTime = this.animation.then;
    this.animation.id = requestAnimationFrame(() => this.loop(maintainTime));
  }

  loop(maintainTime) {
    this.animation.now = Date.now();
    if (maintainTime) {
      this.animation.elapsed = 0;
    }
    else {
      this.animation.elapsed = this.animation.now - this.animation.then;
    }
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
