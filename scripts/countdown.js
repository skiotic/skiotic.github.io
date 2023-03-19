// TODO: Support making custom units in the UI.
window.addEventListener("load", () => {
  let supportsIDB = !!window.indexedDB;

  class CountdownsV1 {
    // v1 methods go here
  }

  class CountdownsV2 {
    // v2 methods go here
  }

  function makeEnum(...props) {
    const e = {};
    for (let i = 0; i < props.length; ++i) {
      e[e[props[i]] = i] = props[i];
    }
    return e;
  }
  const commonLabelsEnum = makeEnum(
    'S',     // seconds
    'SM',    // seconds, minutes
    'SMH',   // seconds, minutes, hours
    'SMHD',  // seconds, minutes, hours, days
    'SMHDY', // seconds, minutes, hours, days, years
  );
  const commonLabelsObjects = [
    [
      {"label":"second"}
    ],
    [
      {"label":"second","radix":60},
      {"label":"minute"}
    ],
    [
      {"label":"second","radix":60},
      {"label":"minute","radix":60},
      {"label":"hour"}
    ],
    [
      {"label":"second","radix":60},
      {"label":"minute","radix":60},
      {"label":"hour","radix":24},
      {"label":"day"}
    ],
    [
      {"label":"second","radix":60},
      {"label":"minute","radix":60},
      {"label":"hour","radix":24},
      {"label":"day","radix":365},
      {"label":"year"}
    ]
  ];

  class CountdownUtil {
    constructor(countdownObj, templateUnitsArr = null) {
      Object.defineProperty(this, 'T_COUNTDOWN', {
        enumerable: false,
        writable: false,
        value: Math.trunc(countdownObj.timestamp)
      });
      this.timeLabels = templateUnitsArr ?? countdownObj.labels;
      this.data = countdownObj;
    }

    curRelativeTimeInSecs() {
      const curTime = Math.trunc(new Date().getTime()/1000);
      return this.T_COUNTDOWN-curTime;
    }

    getFormattedTime(t = this.curRelativeTimeInSecs()) {
      let isPast = false;
      function plur(n, obj) {
        const isArray = Array.isArray(obj.label);
        return n != 1
          ? (isArray ? obj.label[1] : 's')
          : (isArray ? obj.label[0] : '');
      }
      const timeFormat = (num) => {
        if (num < 0) {
          isPast = true;
          num = -num;
        }
        const digits = new Array(this.timeLabels.length-1);
        for (let i = 0; i < digits.length; ++i) {
          digits[i] = (num % this.timeLabels[i].radix);
          num = Math.floor(num / this.timeLabels[i].radix);
        }
        digits.push(num);
        return digits;
      }
      const f = timeFormat(t);
      let finalStr = '';
      for (let i = this.timeLabels.length-1; i >= 0; i--) {
        let timeLabel = this.timeLabels[i].label;
        timeLabel = Array.isArray(timeLabel) ? '' : timeLabel;
        const p = plur(f[i], this.timeLabels[i]);
        finalStr += `<span style="text-align: center">${f[i]} ${timeLabel + p} ${i == 0 && isPast ? 'ago' : ''}</span>`;
      }
      return finalStr;
    }
  }

  function sanitize(str) {
    str = str.replace(/,/g, '&#44;');
    str = str.replace(/~/g, '&#126;');
    str = str.replace(/</g, '&#60;');
    str = str.replace(/>/g, '&#62;');
    str = str.replace(/\*/g, '&#42;');
    str = str.replace(/\|/g, '&#124;');
    str = str.replace(/%/g, '&#37;');
    return str;
  }

  // TODO: Return array of countdown objects when retrieving instead from now on.
  function getIDBCountdowns() {}
  function setIDBCountdowns(countdowns) {}
  function localStorageToIDB() {}
  function saveV2ToLocalStorage() {}

  // TODO: Add flag in new localStorage version to know its not old format.
  function isV1Fmt() {}
  function v1ObjFmtToV2(obj) {
    //
    return obj;
  }

  function getV1Countdowns() {
    const countdownValue = localStorage.getItem('countdowns');
    if (countdownValue === null || countdownValue === '') return;
    const countdowns = [];
    const countdownValueArr = countdownValue.split('%');

    for (const key of countdownValueArr) {
      const [label, timestamp, timeLabelsStr] = key.split('*', 3);
      const countdownObj = {
        label: label,
        timestamp: parseInt(timestamp),
        labels: []
      };

      const checkForEnum = timeLabelsStr.match(/^(?:<)([^<>]+)(?:>)$/);
      let labelsArr = null;
      if (checkForEnum) {
        countdownObj.labels = checkForEnum[1];
        labelsArr = commonLabelsObjects[commonLabelsEnum[countdownObj.labels]];
      } else {
        for (const objStr of timeLabelsStr.split('|')) {
          // label:radix|~labelSingular,labelPlural:radix
          let resultObj = {};
          if (objStr.startsWith('~')) {
            const tempObjArr = objStr.slice(1).split(':', 2);
            const tempLabelArr = tempObjArr[0].split(',', 2);
            tempLabelArr[0] = sanitize(tempLabelArr[0]);
            tempLabelArr[1] = sanitize(tempLabelArr[1]);

            resultObj['label'] = tempLabelArr;
            resultObj['radix'] = sanitize(tempObjArr[1]);
          } else {
            const tempObjArr = objStr.split(':', 2);
            resultObj['label'] = sanitize(tempObjArr[0]);
            resultObj['radix'] = sanitize(tempObjArr[1]);
          }
          countdownObj.labels.push(resultObj);
        }
      }
      countdownObj.label = sanitize(countdownObj.label);
      const countdownUtil = new CountdownUtil(countdownObj, labelsArr);
      countdowns.push(countdownUtil);
    }
    return countdowns;
  }

  /*
    countdowns: {
      label: string,
      timestamp: number,
      labels: {
        label: string | string[],
        radix: number,
      }[] | string
    }[]
  */
  /* WIP Serialization format:
    countdowns: {
      label: string,
      timestamp: number,
      units: {
        label: { s: string, p: string | null },
        radix: number,
      }[] | number
    }[]
  */
  // TODO: Convert this to using IndexedDB, with localStorage functions as a fallback.
  function saveCountdowns(countdowns) {
    if (countdowns.length === 0) {
      localStorage.setItem('countdowns', '');
      return;
    };
    const keyArr = [];
    for (const countdown of countdowns) {
      const mainLabel = countdown.data.label;
      let labelObjInfo = null;
      if (Array.isArray(countdown.data.labels)) {
        labelObjInfo = [];
        for (let i = 0; i < countdown.data.labels.length; ++i) {
          if (Array.isArray(countdown.data.labels[i].label)) {
            labelObjInfo.push(`~${
              countdown.data.labels[i].label[0]
            },${
              countdown.data.labels[i].label[1]
            }:${countdown.data.labels[i].radix}`);
          } else {
            labelObjInfo.push(`${countdown.data.labels[i].label}:${countdown.data.labels[i].radix}`);
          }
        }
      } else {
        labelObjInfo = `<${countdown.data.labels}>`;
      }
      keyArr.push(`${mainLabel}*${countdown.data.timestamp}*${labelObjInfo.join?.('|') ?? labelObjInfo}`);
    }
    const keyStr = keyArr.join('%');
    localStorage.setItem('countdowns', keyStr);
    //countdownName*timestamp*label:radix|~labelSingular,labelPlural:radix%countdownName*timestamp*<ENUM>
    return keyStr;
  }

  function main() {
    const countdowns = getV1Countdowns() ?? [];
    let curInterval = null;
    const addCountdownBtn = document.querySelector('#add-countdown');
    const countdownCont = document.querySelector('#countdown-cont');
    const contentBody = document.querySelector('#content-body');

    function newCountdown(index) {
      const countdownObj = countdowns[index];
      const countdownInterface = document.createElement('div');
      countdownInterface.style.border = '3px solid black';
      countdownInterface.style.borderRadius = '3px';
      countdownInterface.style.width = '75%';
      countdownInterface.style.margin = '10px auto';
      countdownInterface.innerHTML += `<p style="overflow: auto; margin: 10px 0 0 0; font-size: 23px; font-weight: 600;">${countdownObj.data.label}<button class="delete-counter" style="color: black; float: right;">x</button></p>`;
      countdownInterface.innerHTML += `<p class="count-formatted">${countdownObj.getFormattedTime()}</p>`;

      const deleteBtn = countdownInterface.querySelector('.delete-counter');
      deleteBtn.addEventListener('click', () => {
        const willDelete = window.confirm('Are you sure about deleting this countdown?');
        if (!willDelete) return;

        countdownCont.removeChild(countdownInterface);
        countdowns.splice(index, 1);
        saveCountdowns(countdowns);
        newInterval();
      });
      countdownCont.appendChild(countdownInterface);
    }
    function newInterval() {
      if (curInterval !== null) clearInterval(curInterval);
      const countdownContChildren = document.querySelectorAll('#countdown-cont > *');
      if (countdowns.length === 0 || countdownContChildren.length === 0) {
        countdownCont.style.display = 'none';
        return;
      }
      countdownCont.style.display = 'block';

      curInterval = setInterval(() => {
        for (let i = 0; i < countdownContChildren.length; ++i) {
          const timeElem = countdownContChildren[i].querySelector('.count-formatted');
          timeElem.innerHTML = countdowns[i].getFormattedTime();
        }
      }, 1000);
    }
    const countdownInputElem = document.createElement('div');
    countdownInputElem.style.display = 'none';
    countdownInputElem.style.flexDirection = 'column';
    countdownInputElem.style.margin = '30px auto';
    countdownInputElem.style.width = '40%';
    countdownInputElem.style.padding = '5px 25px 25px 25px';
    countdownInputElem.style.backgroundColor = '#bbbbbb88';
    countdownInputElem.style.borderRadius = '7px';
    countdownInputElem.innerHTML += `
    <span style="text-align: left; margin: 20px 0 25px 0;">
      <label>Name: </label><input id="main-label-input"></input>
      <button id="input-exit-btn" style="color: black; float: right;">x</button>
    </span>
    <span style="text-align: left; margin-bottom: 25px;">
      <label>Countdown date: </label>
      <input type="datetime-local" id="time-add" />
    </span>
    <span style="text-align: left; margin-bottom: 25px;">
      <label>Time units: </label>
      <select id="unit-selection">
        <option value="S">Seconds</option>
        <option value="SM">Seconds, Minutes</option>
        <option value="SMH">Seconds, Minutes, Hours</option>
        <option value="SMHD" selected>Secs, Mins, Hrs, Days</option>
        <option value="SMHDY">Secs, Mins, Hrs, Days, Years</option>
      </select>
    </span>
    <button id="countdown-confirm" style="color:black; width: 12em; margin: 0 auto;">Add new countdown</button>
    `.trim();

    const exitBtn = countdownInputElem.querySelector('#input-exit-btn');
    const labelInput = countdownInputElem.querySelector('#main-label-input');
    const timeInput = countdownInputElem.querySelector('#time-add');
    const countdownConfirm = countdownInputElem.querySelector('#countdown-confirm');
    const unitSelection = countdownInputElem.querySelector('#unit-selection');

    function clearInput() {
      timeInput.value = null;
      labelInput.value = null;
      addCountdownBtn.style.display = 'block';
      countdownInputElem.style.display = 'none';
    }

    exitBtn.addEventListener('click', () => {
      clearInput();
      if (countdowns.length > 0) {
        countdownCont.style.display = 'block';
      }
    });
    countdownConfirm.addEventListener('click', () => {
      const timestamp = Math.trunc(new Date(timeInput.value).getTime() / 1000);
      if (isNaN(timestamp)) return;
      const unitSelectIndex = commonLabelsEnum[unitSelection.value] ?? 3;
      const timeLabelArr = commonLabelsObjects[unitSelectIndex];

      const countdownObj = {
        label: sanitize(labelInput.value),
        timestamp: timestamp,
        labels: commonLabelsEnum[unitSelectIndex]
      };
      const countdownUtil = new CountdownUtil(countdownObj, timeLabelArr);

      newCountdown(countdowns.push(countdownUtil)-1);
      clearInput();
      saveCountdowns(countdowns);
      newInterval();
    });

    function showCountdownInput() {
      addCountdownBtn.style.display = 'none';
      countdownCont.style.display = 'none';
      countdownInputElem.style.display = 'flex';
    }
    contentBody.appendChild(countdownInputElem);
    for (let i = 0; i < countdowns.length; ++i) newCountdown(i);
    addCountdownBtn.addEventListener('click', showCountdownInput);
    if (countdowns.length > 0) newInterval();
  }
  main();
});
