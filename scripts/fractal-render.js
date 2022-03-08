// POI = Point of Interest
// TODO: Solve the object discrepancy between the config saved to a POI, and the POI that is rendered.
// TODO: Make the canvas rendering use 4 workers.
// TODO: Interpolate the frames between switching POIs.

window.addEventListener('load', function() {
  const tau = Math.PI * 2;

  var saveCount = 0;// Amount of images saved from fractal canvas
  const width = 1017;// Canvas width
  const height = 1000;// Canvas height
  var zoom = 0.4;

  const midpoint = {
    x: Math.ceil(width/2),
    y: Math.ceil(height/2)
  };

  const config = {
    iterations: 200, // Amount of iterations
    zoom: 0.4, // Zooming
    shiftX: 0, // Shifting the view center
    shiftY: 0,
    rPhase: -0.2,
    gPhase: 0,
    bPhase: 0.1,
    rFreq: 0.2,
    gFreq: 0.2,
    bFreq: 0.2
  };

  const defaultConfig = Object.freeze({
    iterations: 200,
    zoom: 0.4,
    shiftX: 0,
    shiftY: 0,
    rPhase: -0.2,
    gPhase: 0,
    bPhase: 0.1,
    rFreq: 0.2,
    gFreq: 0.2,
    bFreq: 0.2
  });

  const phaseFreqMinMax = Object.freeze({
    phase: {min: -0.5, max: 0.5},
    freq: {min: 0, max: 15}
  });

  const fracalEnums = Object.freeze({
    MANDELBROT: 0,
    BURNING_SHIP: 1
  });

  function clamp(value, min, max) {
    if (value < min) return min;
    if (value > max) return max;
    return value;
  }

  function cyclicClamp(value, min, max) {
    if (value < min) return max;
    if (value > max) return min;
    return value;
  }

  var mouseX = 0, mouseY = 0;
  const base = document.querySelector('#canvas-base');
  const overlay = document.querySelector('#canvas-overlay');
  const saveBtn = document.querySelector("#btn");
  const baseCtx = base.getContext('2d', {alpha: false});
  const overlayCtx = overlay.getContext('2d');

  var curCoords = {
    x: ((mouseX-midpoint.x)/height)/config.zoom + config.shiftX,
    y: ((mouseY-midpoint.y)/height)/config.zoom + config.shiftY
  };

  base.width = width;
  base.height = height;
  overlay.width = width;
  overlay.height = height;
  var downloads = 0;
  var curFractal = fracalEnums.MANDELBROT;

  let poiArrPos = 0;
  const poiArray = [];

  const elemValueMap = {
    "iter": "iterations",
    "zoom": "zoom",
    "x-coord": "shiftX",
    "y-coord": "shiftY",
    "red-phase": "rPhase",
    "green-phase": "gPhase",
    "blue-phase": "bPhase",
    "red-weight": "rFreq",
    "green-weight": "gFreq",
    "blue-weight": "bFreq"
  };
  
  class Utils {
    //
  }
  
  class State {
    // TODO: Add global vars/consts here.
  };

  class Input {
    static fieldElems = document.querySelectorAll("#input-group input, #input-group select");

    static assignFieldValues() {
      Input.fieldElems.forEach(elem => {
        if (elem.id === "select-fract") {
          elem.value = curFractal.toString();
        } else {
          elem.value = config[elemValueMap[elem.id]];
        }
      });
    }

    static setToDefault() {
      Object.keys(config).forEach(propname => {
        config[propname] = defaultConfig[propname];
      });
      Input.fieldElems.forEach(elem => {
        elem.setAttribute("title", config[elemValueMap[elem.id]]);
      });
      Input.assignFieldValues();
      window.requestAnimationFrame(Draw.fLoading);
    }

    static insertInputs() {
      Input.fieldElems.forEach(elem => {
        if (elem.id === "select-fract") {
          curFractal = parseInt(elem.value);
        } else {
          config[elemValueMap[elem.id]] = parseFloat(elem.value) ?? config[elemValueMap[elem.id]];
        }
      });
      window.requestAnimationFrame(Draw.fLoading);
    }
  }

  class POI {
    static getFile(e) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onload = () => {
        POI.setList(JSON.parse(reader.result)['list']);
        e.target.files = null;
      };
      reader.readAsText(file);
    }

    static saveFile() {
      const jsonStr = JSON.stringify({list: poiArray});
      const blob = new Blob([jsonStr]);
  
      let a = document.createElement("a");
      let jsonURL = (URL ?? webkitURL).createObjectURL(
        new File([blob], "fractal-POIs", {type: "text/json"})
      );
      a.href = jsonURL;
      a.style.display = "none";
      a.download = "fractal-POIs.json";
      a.click();
      (URL ?? webkitURL).revokeObjectURL(jsonURL);
      a.remove();
    }

    static setPOIList(poiParsedList) {
      clearPOIArray();
      for (let i = 0; i < poiParsedList.length; i++) {
        const poiObj = cleanPOIObj(poiParsedList[i]);
        poiArray.push(poiObj);
      }
      loadPOIArrayElem(poiArrPos = 0);
      assignValues();
      drawLoading();
    }

    // Type checking POI element input.
    static cleanObj(obj) {
      console.log('Before:', obj); // debug
      let {
        fractal = fracalEnums.MANDELBROT,
        iters = config.iterations,
        zoom = config.zoom,
        x = config.shiftX,
        y = config.shiftY,
        rphase = config.rPhase,
        gphase = config.gPhase,
        bphase = config.bPhase,
        rfreq = config.rFreq,
        gfreq = config.gFreq,
        bfreq = config.bFreq,
      } = obj;

      console.log('After:', obj); // debug

      if (!Number.isInteger(fractal)) {
        fractal = fracalEnums.MANDELBROT;
      }
      if (!Number.isInteger(iters)) {
        iters = config.iterations;
      }
      if (typeof zoom !== "number") {
        zoom = config.zoom;
      }
      if (typeof x !== "number") x = config.shiftX;
      if (typeof y !== "number") y = config.shiftY;
      if (typeof rphase !== "number") {
        rphase = config.rPhase;
      }
      if (typeof gphase !== "number") {
        gphase = config.gPhase;
      }
      if (typeof bphase !== "number") {
        bphase = config.bPhase;
      }
      if (typeof rfreq !== "number") {
        rfreq = config.rFreq;
      }
      if (typeof gfreq !== "number") {
        gfreq = config.gFreq;
      }
      if (typeof bfreq !== "number") {
        bfreq = config.gFreq;
      }

      return {
        x, y,
        fractal: clamp(fractal, 0, fractalMethods.length-1),
        iters: clamp(iters, 1, Infinity), 
        zoom: clamp(zoom, 0.001, Infinity),
        rphase: clamp(rphase, phaseFreqMinMax.phase.min, phaseFreqMinMax.phase.max),
        gphase: clamp(bphase, phaseFreqMinMax.phase.min, phaseFreqMinMax.phase.max),
        bphase: clamp(gphase, phaseFreqMinMax.phase.min, phaseFreqMinMax.phase.max),
        rfreq: clamp(rfreq, phaseFreqMinMax.freq.min, phaseFreqMinMax.freq.max),
        gfreq: clamp(gfreq, phaseFreqMinMax.freq.min, phaseFreqMinMax.freq.max),
        bfreq: clamp(gfreq, phaseFreqMinMax.freq.min, phaseFreqMinMax.freq.max),
      }
    }

    static addElemFromConfig() {
      const newPoiObj = {
        fractal: curFractal,
        iters: config.iterations,
        zoom: config.zoom,
        x: config.shiftX,
        y: config.shiftY,
        rphase: config.rPhase,
        gphase: config.gPhase,
        bphase: config.bPhase,
        rfreq: config.rFreq,
        gfreq: config.gFreq,
        bfreq: config.bFreq,
      };
      poiArray.push(newPoiObj);
    }
  
    static cutElement(i) {
      return poiArray.splice(i, 1);
    }
  
    static clearArray() {
      while (poiArray.length > 0) {
        poiArray.pop();
      }
    }
  
    static loadArrayElem(i) {
      const curPoiObj = poiArray[i];
      curFractal = curPoiObj.fractal;
      config.iterations = curPoiObj.iters;
      config.zoom = curPoiObj.zoom;
      config.shiftX = curPoiObj.x;
      config.shiftY = curPoiObj.y;
      config.rPhase = curPoiObj.rphase;
      config.gPhase = curPoiObj.gphase;
      config.bPhase = curPoiObj.bphase;
      config.rFreq = curPoiObj.rfreq;
      config.gFreq = curPoiObj.gfreq;
      config.bFreq = curPoiObj.bfreq;
    }
  
    static goToElement(i) {
      poiArrPos = cyclicClamp(poiArrPos+i, 0, poiArray.length-1);
      POI.loadArrayElem(poiArrPos);
      Draw.fLoading();
    }
  }

  const fractalWorkerURL = "../scripts/workers/fractal-gen.worker.js";

  class Fractal {
    static workers = Object.freeze([
      new Worker(fractalWorkerURL),
      new Worker(fractalWorkerURL),
      new Worker(fractalWorkerURL),
      new Worker(fractalWorkerURL),
    ]);

    static waitForWorkerData() {
      const workerEvents = new EventTarget();
      const endEvt = new Event("end");
      return new Promise((resolve, reject) => {
        for (const worker of Fractal.workers) {
          worker.postMessage({ready: true});
        }
        const workerData = [];
        workerEvents.addEventListener("end",
          () => resolve(workerData), {once: true});
        for (const worker of Fractal.workers) {
          worker.addEventListener('message', e => {
            workerData.push(e.data);
            if (workerData.length >= Fractal.workers.length) {
              workerEvents.dispatchEvent(endEvt);
            }
          });
        }
      });
    }

    static async makefractal(curConfig = config) {
      const data = await Fractal.calcWorkerFrame(curConfig);
      Draw.fractalQueue.pushBack(data);
      window.requestAnimationFrame(Draw.base);
    }

    static async fractalInterpol(newConfig, frames = 30) {
      const frameCache = new Queue();
      const interConfig = config;
      for (let i = 0; i < frames; i++) {
        for (const key in interConfig) {
          let value;
          const a = config[key],
                b = newConfig[key];
          if (key == "zoom") {
            value = a * Math.pow(b/a, i/frames);
          } else {
            const diff = a - b;
            value = b + (diff/2) + (diff/2) *
            Math.cos(Math.PI * (i/frames));
          }

          interConfig[key] = value;
        }
        frameCache.pushBack(
          await Fractal.calcWorkerFrame(interConfig));
      }
      for (const elem of frameCache) {
        Draw.fractalQueue.pushBack(elem);
      }
      Draw.fractalQueue.pushBack(await Fractal.calcWorkerFrame(newConfig));
      window.requestAnimationFrame(Draw.base);
    }

    static calcWorkerFrame(curConfig) {
      return new Promise(async (resolve, reject) => {
        baseCtx.clearRect(0, 0, base.width, base.height);
        const bufferLength = 4 * base.width * base.height;
        const combinedBuffer = new Uint8ClampedArray(bufferLength);
        for (let i = 0; i < Fractal.workers.length; i++) {
          const worker = Fractal.workers[i];
          worker.postMessage({
            ready: false,
            position: i,
            bufferLength: Math.floor(bufferLength / Fractal.workers.length),
            width,
            height,
            midpoint,
            curFractal,
            curConfig
          });
        }
        const workerResults = await Fractal.waitForWorkerData();
        for (const {position, buffer} of workerResults) {
          for (let i = 0; i < buffer.length; i++) {
            combinedBuffer[buffer.length*position + i] = buffer[i];
          }
        }
        resolve(combinedBuffer);
      });
    }
    
    static checkStable(length2, amount, limit2, curConfig = config) {
      if (length2 < limit2) {
        return [0, 0, 0];
      }
      let scalar = Math.log(1 + Math.max(0, amount - Math.log2(Math.log2(length2))));
      return [
        127 - 127 * Math.cos(tau * (curConfig.rFreq * scalar + ccurConfigonfig.rPhase)),
        127 - 127 * Math.cos(tau * (curConfig.gFreq * scalar + curConfig.gPhase)),
        127 - 127 * Math.cos(tau * (curConfig.bFreq * scalar + curConfig.bPhase))
      ];
    }
  }

  class Draw {
    static fractalQueue = new Queue();

    static base() {
      if (Draw.fractalQueue.isEmpty) return;

      const drawnImage = new ImageData(
        Draw.fractalQueue.popFront(), base.width, base.height);

      baseCtx.putImageData(drawnImage, 0, 0);
      if (!Draw.fractalQueue.isEmpty) {
        window.requestAnimationFrame(Draw.base);
      }
    }

    static overlay() {
      overlayCtx.clearRect(0, 0, width, height);

      const xCoord = "x: " + curCoords.x.toFixed(16);
      const yCoord = "y: " + curCoords.y.toFixed(16);
  
      overlayCtx.fillStyle = "#000000cc";
      overlayCtx.fillRect(15, 16, 240, 65);
      overlayCtx.font = "18px sans-serif";
      overlayCtx.fillStyle = "#ffffff";
      overlayCtx.fillText(xCoord, 30, 40);
      overlayCtx.fillText(yCoord, 30, 70);
    }

    static fLoading() {
      Input.assignFieldValues();
      baseCtx.font = "40px sans-serif";
      baseCtx.fillStyle = "#ffffff88";
      baseCtx.fillRect(0, 0, base.width, base.height);
      baseCtx.fillStyle = "#333333";
      baseCtx.fillText("Loading...", midpoint.x - 100, midpoint.y - 8);
      Fractal.makefractal();
    }
  }

  document.addEventListener('mousemove', e => {
    mouseX = e.clientX - overlay.getBoundingClientRect().left;
    mouseY = e.clientY - overlay.getBoundingClientRect().top;
    curCoords = {
      x: ((mouseX - midpoint.x)/height)/config.zoom + config.shiftX,
      y: ((mouseY - midpoint.y)/height)/config.zoom + config.shiftY
    };

    window.requestAnimationFrame(Draw.overlay);
  });

  Input.fieldElems.forEach(elem => {
    elem.addEventListener("change", () => {
      elem.setAttribute("title", elem.value);
    });
  });

  document.querySelector("#poi-list").addEventListener("change", POI.getFile);
  document.querySelector("#add-poi").addEventListener("click", POI.addElemFromConfig);
  document.querySelector("#clear-pois").addEventListener("click", POI.clearArray);
  document.querySelector("#download-pois").addEventListener("click", POI.saveFile);
  document.querySelector("#prev-poi").addEventListener("click", () => POI.goToElement(-1));
  document.querySelector("#next-poi").addEventListener("click", () => POI.goToElement(1));

  document.querySelector("#changes-btn").addEventListener("click", Input.insertInputs);
  document.querySelector("#default-btn").addEventListener("click", Input.setToDefault);

  window.addEventListener('keyup', k => {
    k.preventDefault();
    const char = k.key.toLowerCase();
    if (char == "u") {
      config.shiftX = curCoords.x;
      config.shiftY = curCoords.y;
      config.zoom *= 2;
    } else if (char == "o") {
      config.shiftX = curCoords.x;
      config.shiftY = curCoords.y;
      config.zoom *= 0.5;
    } else {
      if (char == "l") {
        config.shiftX += 0.25 / config.zoom;
      } else if (char == "i") {
        config.shiftY -= 0.25 / config.zoom;
      } else if (char == "j") {
        config.shiftX -= 0.25 / config.zoom;
      } else if (char == "k") {
        config.shiftY += 0.25 / config.zoom;
      }
    }
    window.requestAnimationFrame(Draw.fLoading);
  });

  saveBtn.addEventListener("click", () => {
    let a = document.createElement("a");
    let canvasURL = base.toDataURL('image/png');
    a.href =  canvasURL;
    a.style.display = "none";
    a.download = "fractal-img-" + downloads;
    a.click();
    (URL ?? webkitURL).revokeObjectURL(canvasURL);
    a.remove();
    downloads++;
  });
  
  Input.setToDefault();
  window.requestAnimationFrame(Draw.base);
});