// TODO: Consider a CountdownData class to organize.
// TODO: Support making custom units in the UI.
window.addEventListener("load", () => {
  let supportsIDB = 'indexedDB' in window;

  if (!supportsIDB && !('localStorage' in window)) {
    return window.alert(
        `Your browser does not support the storage needed for this app!
Try upgrading your browser, or checking extensions and settings if browser is up to date.`);
  }

  function makeEnum(...props) {
    const e = {};
    for (let i = 0; i < props.length; ++i) {
      e[e[props[i]] = i] = props[i];
    }
    return e;
  }
  const commonUnitsEnum = makeEnum(
    'S',     // seconds
    'SM',    // seconds, minutes
    'SMH',   // seconds, minutes, hours
    'SMHD',  // seconds, minutes, hours, days
    'SMHDY', // seconds, minutes, hours, days, years
  );
  const commonUnitsObjects = [
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

  /* V1 Object Format
  countdowns: {
    label: string,
    timestamp: number,
    labels: {
      label: string | string[],
      radix: number,
    }[] | number (parsed from string)
  }[]
  */

  /* WIP V2 Object format:
    countdowns: {
      id: string, // <dateMsOnStart+countInSession>
      label: string,
      timestamp: number,
      units: {
        label: { singular: string, plural?: string },
        radix: number,
      }[] | number
    }[]
  */

  class CountdownsV1 {
    static getCountdowns() {
      const countdowns = [];
      const countdownValue = window.localStorage.getItem('countdowns');
      if (countdownValue === null || countdownValue === '') {
        return countdowns;
      }
      const countdownValueArr = countdownValue.split('%');
  
      for (const key of countdownValueArr) {
        const [label, timestamp, timeLabelsStr] = key.split('*', 3);
        const countdownObj = {
          label: sanitize(label),
          timestamp: parseInt(timestamp),
          labels: []
        };
  
        const checkForEnum = timeLabelsStr.match(/^(?:<)([^<>]+)(?:>)$/);
        if (checkForEnum) {
          countdownObj.labels = commonUnitsEnum[checkForEnum[1]]; // number
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
        countdowns.push(countdownObj);
      }
      return countdowns;
    }

    static usesV1Fmt() {
      return window.localStorage.getItem('countdowns') !== null;
    }
  }

  class CountdownsV2 {
    /** @type {IDBDatabase | null} */
    static db = null;
    static initDate = Date.now();
    static curObjCount = 0;
    static generateId() {
      return `${CountdownsV2.initDate}+${CountdownsV2.curObjCount}`;
    }

    static async getCountdowns() {
      // First, check if there is already an indexed db (if supported (creating it if able to)),
      // retrieving if there's data. If its the first time, it checks localStorage for data, and
      // then deletes it after transferring it. If using the database isn't available, it falls
      // back to using localStorage.
      if (supportsIDB) {
        try {
          let notInit = true;
          const transferredListener = new EventTarget();
          const dbInit = db => {
            CountdownsV2.onDbInit(db);
            notInit = false;
          };

          CountdownsV2.db = await AsyncIDB.processOpenDb(
            window.indexedDB.open('countdowns', 1), dbInit);

          if (notInit) {
            let countdownsRes = null;
            await AsyncIDB.processTransaction(
              CountdownsV2.db.transaction('countdowns'), async trans => {
                countdownsRes = await AsyncIDB.processRequest(
                    trans.objectStore('countdowns').getAll());
            });
            return countdownsRes;
          }

          const localStorageCountdowns = CountdownsV2.checkInLocalStorage(transferredListener);
          if (localStorageCountdowns.length == 0) {
            return localStorageCountdowns;
          }

          transferredListener.addEventListener(
              'success', () => CountdownsV2.deleteLocalStorage(), { once: true });
          return localStorageCountdowns;
        } catch (err) {
          console.error(err);
        }
      }

      // If IDB not supported/working...
      return CountdownsV2.checkInLocalStorage(null, false);
    }

    static checkInLocalStorage(transferredListener, idbWorking = true) {
      // Check if there is V2 objects in localStorage
      if (CountdownsV2.usesLocalStorageV2Fmt()) {
        const countdowns = CountdownsV2.getLocalStorageCountdowns();
        if (idbWorking) {
          CountdownsV2.tryTransferringToIDB(countdowns)
              .then(_ => transferredListener.dispatchEvent(new Event('success')))
              .catch(_ => CountdownsV2.fallbackSaveLocalStorage(countdowns));
        }
        return countdowns;
      }

      // Or, check if there is V1 objects in localStorage
      if (CountdownsV1.usesV1Fmt()) {
        const countdowns = CountdownsV2.v1ToV2Objects(
            CountdownsV1.getCountdowns());
        if (idbWorking) {
          CountdownsV2.tryTransferringToIDB(countdowns)
              .then(_ => transferredListener.dispatchEvent(new Event('success')))
              .catch(_ => CountdownsV2.fallbackSaveLocalStorage(countdowns));
        }
        return countdowns;
      }

      // If down here, this means it doesn't have any countdowns in localStorage.
      return [];
    }

    static async tryTransferringToIDB(countdowns) {
      await AsyncIDB.processTransaction(
          CountdownsV2.db.transaction('countdowns'), trans => {
            const objectStore = trans.objectStore('countdowns');
            for (const countdown of countdowns) {
              objectStore.add(countdown);
            }
      });
    }

    static async trySavingObjToIDB(countdownObj) {
      await AsyncIDB.processTransaction(
          CountdownsV2.db.transaction('countdowns', 'readwrite'), trans => {
            const objectStore = trans.objectStore('countdowns');
            objectStore.put(countdownObj);
      });
    }

    static async saveCountdown(countdownObj, countdowns) {
      if (supportsIDB) {
        try {
          await CountdownsV2.trySavingObjToIDB(countdownObj);
          return;
        } catch {
          console.error('Issues with saving countdown to indexedDB.\nResorting to localStorage...');
        }
      }
      CountdownsV2.fallbackSaveLocalStorage(countdowns);
    }

    static async deleteCountdown(id, countdowns) {
      if (supportsIDB) {
        try {
          await AsyncIDB.processTransaction(
              CountdownsV2.db.transaction('countdowns', 'readwrite'), trans => {
                trans.objectStore('countdowns').delete(id);
          });
          return;
        } catch (err) {
          console.error(err);
        }
      }
      CountdownsV2.fallbackSaveLocalStorage(countdowns);
    }

    static getLocalStorageCountdowns() {
      const countdowns = [];
      const countdownValue = window.localStorage.getItem('countdowns:v2');
      const countdownValueArr = countdownValue.split('%');

      for (const key of countdownValueArr) {
        const [id, label, timestamp, unitsStr] = key.split('*', 5);
        const newCountdownObj = {
          id, label,
          timestamp: parseInt(timestamp),
          units: [],
        }

        const checkForEnum = unitsStr.match(/^(?:<)([^<>]+)(?:>)$/);
        if (checkForEnum) {
          newCountdownObj.units = parseInt(checkForEnum[1]);
        } else {
          for (const objStr of unitsStr.split('|')) {
            // label:radix|~labelSingular,labelPlural:radix
            let resultObj = {};
            if (objStr.startsWith('~')) {
              const [ labels, radix ] = objStr.slice(1).split(':', 2);
              const [ singular, plural ] = labels.split(',', 2);
              const unitLabelObj = {
                singular: sanitize(singular), 
                plural: sanitize(plural),
              };
  
              resultObj['label'] = unitLabelObj;
              resultObj['radix'] = sanitize(radix);
            } else {
              const [ label, radix ] = objStr.split(':', 2);
              resultObj['label'] = {
                singular: sanitize(label),
              };
              resultObj['radix'] = sanitize(radix);
            }
            newCountdownObj.units.push(resultObj);
          }
        }
        countdowns.push(newCountdownObj);
      }
      return countdowns;
    }

    /** @param {CountdownUtil[] | {id:number,label:string,timestamp:string,units:{label:{singular:string,plural?:string}}[]|number}[]} countdowns */
    static fallbackSaveLocalStorage(countdowns) {
      if (countdowns.length === 0) {
        window.localStorage.setItem('countdowns:v2', '');
        return;
      };
      const countdownStrArr = [];
      for (let countdown of countdowns) {
        if (countdown instanceof CountdownUtil) {
          countdown = countdown.data;
        }

        let unitStrOrArr;
        if (typeof countdown.units == 'number') {
          unitStrOrArr = `<${countdown.units}>`;
        } else {
          unitStrOrArr = [];
          for (const unit of countdown.units) {
            if (unit.label.plural) {
              unitStrOrArr.push(`~${unit.label.singular},${unit.label.plural}:${unit.radix}`);
            } else {
              unitStrOrArr.push(`${unit.label.singular}:${unit.radix}`);
            }
          }
        }
        countdownStrArr.push(`${countdown.id}*${countdown.label}*${countdown.timestamp}*${
            unitStrOrArr.join?.('|') ?? unitStrOrArr}`);
      }
      const countdownStr = countdownStrArr.join('%');
      window.localStorage.setItem('countdowns:v2', countdownStr);
      //id*countdownName*timestamp*label:radix|~labelSingular,labelPlural:radix%id*countdownName*timestamp*<number[enum]>
      return countdownStr;
    }

    static deleteLocalStorage() {
      if (CountdownsV1.usesV1Fmt()) {
        return window.localStorage.removeItem('countdowns');
      }
      if (CountdownsV2.usesLocalStorageV2Fmt()) {
        return window.localStorage.removeItem('countdowns:v2');
      }
    }

    static usesLocalStorageV2Fmt() {
      return window.localStorage.getItem('countdowns:v2') !== null;
    }

    static v1ToV2Objects(v1Countdowns) {
      for (let countdown of v1Countdowns) {
        countdown.id = CountdownsV2.generateId();
        countdown.units = countdown.labels;
        delete countdown.labels;
        if (typeof countdown.units == 'string') {
          countdown.units = commonUnitsEnum[countdown.units];
        }
        const units = countdown.units;
        units.label = typeof units.label == 'number'
            ? { singular: units.label }
            : { singular: units.label[0], plural: units.label[1] };
      }
      return v1Countdowns;
    }

    /**
     * @param {IDBDatabase} db 
     */
    static onDbInit(db) {
      const objectStore = db.createObjectStore(
          'countdowns', { keyPath: 'id' });

      objectStore.createIndex('label', 'label', { unique: false });
      objectStore.createIndex('timestamp', 'timestamp', { unique: false });
      objectStore.createIndex('units', 'units', { unique: false });
    }
  }


  class CountdownUtil {
    /** @param {{ id: number, timestamp: string, units: { label: { singular: string, plural?: string }, radix: number, }[] | number}} countdownObj */
    constructor(countdownObj) {
      Object.defineProperty(this, 'T_COUNTDOWN', {
        enumerable: false,
        writable: false,
        value: Math.trunc(countdownObj.timestamp)
      });
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
      const units = typeof this.data.units == 'number'
          ? commonUnitsObjects[this.data.units]
          : this.data.units;

      const timeFormat = (num) => {
        if (num < 0) {
          isPast = true;
          num = -num;
        }
        const digits = new Array(units.length-1);
        for (let i = 0; i < digits.length; ++i) {
          digits[i] = (num % units[i].radix);
          num = Math.floor(num / units[i].radix);
        }
        digits.push(num);
        return digits;
      }
      const f = timeFormat(t);
      let finalStr = '';
      for (let i = units.length-1; i >= 0; i--) {
        let timeLabel = units[i].label;
        timeLabel = Array.isArray(timeLabel) ? '' : timeLabel;
        const p = plur(f[i], units[i]);
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

  function getV1Countdowns() { return []; } // Depreciated

  function saveV1Countdowns(countdowns) { // Depreciated, repurpose code for CountdownsV2.fallbackSaveLocalStorage.
    if (countdowns.length === 0) {
      window.localStorage.setItem('countdowns', '');
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
    window.localStorage.setItem('countdowns', keyStr);
    //countdownName*timestamp*label:radix|~labelSingular,labelPlural:radix%countdownName*timestamp*<ENUM>
    return keyStr;
  }

  function wrapObjsInUtils(countdowns) {
    for (let i = 0; i < countdowns.length; ++i) {
      countdowns[i] = new CountdownUtil(countdowns[i]);
    }
    return countdowns;
  }

  async function main() {
    const countdowns = wrapObjsInUtils((await CountdownsV2.getCountdowns())
        .sort((first, second) => {
          const [ aDateStr, aCountStr ] = first.id.split('+', 1);
          const [ bDateStr, bCountStr ] = second.id.split('+', 1);
          const aDate = parseInt(aDateStr),
                bDate = parseInt(bDateStr);
          if (aDate == bDate) {
            return parseInt(aCountStr) - parseInt(bCountStr);
          }
          return aDate - bDate;
    }));
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
        CountdownsV2.deleteCountdown(countdowns[index].data.id, countdowns);
        countdowns.splice(index, 1);
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
      const unitSelectIndex = commonUnitsEnum[unitSelection.value] ?? 3;

      const countdownObj = {
        id: CountdownsV2.generateId(),
        label: sanitize(labelInput.value), timestamp,
        units: unitSelectIndex,
      };
      const countdownUtil = new CountdownUtil(countdownObj);

      newCountdown(countdowns.push(countdownUtil)-1);
      clearInput();
      CountdownsV2.saveCountdown(countdownUtil.data, countdowns)
          .catch(err => console.error(err));
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
  main().catch(err => console.error(err));
});
