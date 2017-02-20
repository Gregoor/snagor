import React, {Component} from 'react';
import {Enum} from 'enumify';
import Vector from 'wacktor';

const SIZE = 20;

const MOVE_PER_SECOND = 6;

const KEYDOWN = 'keydown';
const RESIZE = 'resize';

class Direction extends Enum {}
Direction.initEnum(['LEFT', 'RIGHT', 'UP', 'DOWN']);

const OFFSETS = {
  [Direction.LEFT]:  new Vector(-1,  0),
  [Direction.UP]:    new Vector( 0, -1),
  [Direction.RIGHT]: new Vector( 1,  0),
  [Direction.DOWN]:  new Vector( 0,  1)
};

class Game extends Component {

  state = {pxSize: 0};

  listeners = [];

  direction;

  componentDidMount() {
    (this.listeners = [
      [RESIZE, this.onResize],
      [KEYDOWN, this.onKey]
    ]).forEach(([eventName, listener]) =>
       window.addEventListener(eventName, listener)
    );
    this.onResize();
    this.loop();
  }

  componentWillUnmount() {
    this.listeners.forEach(([eventName, listener]) =>
      window.removeEventListener(eventName, listener)
    );
  }

  render() {
    const {pxSize} = this.state;
    const canvasStyle = {width: pxSize, height: pxSize};
    return (
      <div ref="root" style={{
        position: 'absolute', top: 0, height: '100%', width: '100%',
        overflow: 'hidden', backgroundColor: 'black', textAlign: 'center'
      }}>
        <div style={{position: 'relative', display: 'inline-block'}}>
          <canvas ref="bgCanvas" style={canvasStyle}/>
          <canvas ref="gameCanvas" style={{
            position: 'absolute', left: 0, top: 0, ...canvasStyle
          }}/>
        </div>
      </div>
    );
  }

  onResize = () => {
    const {root, bgCanvas, gameCanvas} = this.refs;
    const {offsetWidth, offsetHeight} = root;
    const scale  = this.scale  = Math.min(offsetWidth, offsetHeight) / SIZE;
    const pxSize = this.pxSize = this.scale * SIZE;

    this.width = bgCanvas.width = gameCanvas.width =
      this.height = bgCanvas.height = gameCanvas.height =
        pxSize;

    this.setState({pxSize});

    const ctx = bgCanvas.getContext('2d');
    ctx.strokeStyle = '#333332';
    ctx.lineWidth = 3;
    for (let x = 0; x < SIZE + 1; x++) {
      ctx.beginPath();
      ctx.moveTo(x * scale, 0);
      ctx.lineTo(x * scale, SIZE * scale);
      ctx.closePath();
      ctx.stroke();
    }

    for (let y = 0; y < SIZE + 1; y++) {
      ctx.beginPath();
      ctx.moveTo(0, y * scale);
      ctx.lineTo(SIZE * scale, y * scale);
      ctx.closePath();
      ctx.stroke();
    }
  };

  onKey = (event) => {
    this.direction = {
      37: Direction.LEFT,
      38: Direction.UP,
      39: Direction.RIGHT,
      40: Direction.DOWN
    }[event.keyCode];
  };
  
  loop() {
    const center = Math.floor(SIZE / 2);

    let pos = new Vector(center, center);
    let trail = [pos.sub(1, 0), pos.sub(2, 0), pos.sub(3, 0)];
    let lastDirection = Direction.RIGHT;

    let newPos = pos;
    let moveAt = 1;

    let lastTime;

    const ctx = this.refs.gameCanvas.getContext('2d');

    const gameLoop = () => {
      const now = Date.now();
      const delta = now - (lastTime || now) + Number.EPSILON;
      lastTime = now;

      const {direction, scale, pxSize} = this;
      if (moveAt === 1) {

        let offset = OFFSETS[lastDirection];
        if (direction) {
          let newOffset = OFFSETS[direction];
          if (offset.add(newOffset).magSq() > 0) {
            offset = newOffset;
            lastDirection = direction;
          }
        }
        moveAt = 0;
        trail = [pos, ...trail].slice(0, -1);
        pos = newPos;
        newPos = pos.add(offset).clamp(0, SIZE - 1);
        this.direction = null;
      }

      if (moveAt < 1) {
        moveAt = Math.min(1, moveAt + (MOVE_PER_SECOND * delta / 1000));
      }

      ctx.clearRect(0, 0, pxSize, pxSize);
      ctx.fillStyle = 'white';
      const drawCube = ({x, y}) => {
        ctx.fillRect(x, y, scale * 1.03, scale * 1.03);
      };
      const interpolated = [[newPos, pos], [trail[trail.length - 2], trail[trail.length - 1]]];
      for (const [from, to] of interpolated) {
        drawCube(from.mul(moveAt).add(to.mul(1- moveAt)).mul(scale));
      }

      for (const trailPoint of [pos, ...trail.slice(0, -1)]) {
        drawCube(trailPoint.mul(scale));
      }

      requestAnimationFrame(gameLoop);
    };
    gameLoop();
  }

}

export default Game;
