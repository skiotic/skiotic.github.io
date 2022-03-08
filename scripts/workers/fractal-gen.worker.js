const tau = Math.PI * 2;
const events = new EventTarget();
const readyEvt = new Event("ready");

let isReady = false;

class FractalGen {
  static map = [
    FractalGen.mandelbrot,
    FractalGen.burningShip
  ];

  static mandelbrot(cx, cy, iter) {
    const limit = 1e6;
    const limit2 = limit*limit;
    let x = cx, y = cy;
    let i;
    let length2;
    for (i = 0; i <= iter; i++) {
      let xtemp = x;
      let x2 = x*x;
      let y2 = y*y;
      x = x2 - y2 + cx;
      y = 2*(xtemp*y) + cy;

      length2 = x2 + y2;
      if (length2 > limit2) break;
    }
    return {
      length: length2,
      amount: i,
      limit: limit2
    };
  }

  // burning ship
  static burningShip(cx, cy, iter) {
    const limit = 1e6;
    const limit2 = limit*limit;
    let x = cx, y = cy;
    let i;
    let length2;
    for (i = 0; i <= iter; i++) {
      let xtemp = x;
      let x2 = x*x;
      let y2 = y*y;
      x = x2 - y2 + cx;
      y = 2*Math.abs(xtemp*y) + cy;

      length2 = x2 + y2;
      if (length2 > limit2) break;
    }
    return {
      length: length2,
      amount: i,
      limit: limit2
    };
  }

  static checkStable(length2, amount, limit2, curConfig) {
    if (length2 < limit2) {
      return [0, 0, 0];
    }
    const scalar = Math.log(1 + Math.max(
      0, amount - Math.log2(Math.log2(length2))));

    return [
      127 - 127 * Math.cos(tau * (curConfig.rFreq * scalar + curConfig.rPhase)),
      127 - 127 * Math.cos(tau * (curConfig.gFreq * scalar + curConfig.gPhase)),
      127 - 127 * Math.cos(tau * (curConfig.bFreq * scalar + curConfig.bPhase))
    ];
  }

  static async calcFrame(curFractal, curConfig, position,
    bufferLength, width, height, midpoint) {
      const buffer = new Uint8ClampedArray(bufferLength);
      const pixelAmount = bufferLength/4;
      const arrPos = position * pixelAmount;
      for (let i = arrPos, y = (arrPos/width)-1; i < (arrPos + pixelAmount); i++) {
        let x = i % width;
        if (x == 0) y++;
        const coordsAmount = FractalGen.map[curFractal](
          ((x - midpoint.x)/height)/curConfig.zoom + curConfig.shiftX,
          ((y - midpoint.y)/height)/curConfig.zoom + curConfig.shiftY,
          curConfig.iterations
        );
        const colorArr = FractalGen.checkStable(
          coordsAmount.length,
          coordsAmount.amount,
          coordsAmount.limit,
          curConfig,
        );
        const j = i * 4;
        buffer[ j ] = colorArr[0];
        buffer[j+1] = colorArr[1];
        buffer[j+2] = colorArr[2];
        buffer[j+3] = 255;
      }
      return buffer;
  }
}

function sendOnReady(result) {
  return new Promise((resolve, reject) => {
    events.addEventListener("ready",
      () => resolve(result), {once: true});

    if (isReady) resolve(result);
  });
}

self.addEventListener("message", async e => {
  const {data: {
    ready, position, bufferLength, width, height,
    curConfig, curFractal, midpoint
  }} = e;

  if (ready) {
    events.dispatchEvent(readyEvt);
    isReady = true;
    return;
  }
  const result = await FractalGen.calcFrame(
    curFractal, curConfig, position,
    bufferLength, width, height, midpoint
    );
  self.postMessage({
    position,
    buffer: await sendOnReady(result)
  });
});