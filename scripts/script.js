let pageChange = false;
window.addEventListener('load', function() {
  (() => {
    let json;
    const req = new XMLHttpRequest();
    req.open("GET", "/scripts/data.json", true);
    req.onreadystatechange = () => {
      if (req.readyState === XMLHttpRequest.DONE) {
        if (req.status === 0 || (req.status >= 200 && req.status < 400)) {
          json = JSON.parse(req.responseText);
          let linkArea = document.querySelector("#sidebar-text");
          linkArea.innerHTML += json["links"].join("<br>");
        } else {
          throw new Error("Request unsuccessful");
        }
      }
    };
    req.send();
  })();

  const homeBtn = document.querySelector("#home-btn");
  
  homeBtn.addEventListener('click', () => window.location.assign("/"));

  let isIndexPage = function() {
    return window.location.pathname === "/" || window.location.pathname.endsWith("skiotic.github.io\/index.html");
  }

  if (!isIndexPage()) return;

  const tempglobal = {};

  let addTempProp = function(key, value) {
    Object.defineProperty(tempglobal, key, {
      'configurable': true,
      'enumerable': true,
      'value': value
    });
    return tempglobal[key];
  }

  let deleteTempProp = function(key) {
    return delete tempglobal[key];
  }

  let addAudioPlayer = function(src) {
    if (!tempglobal?.['players']) {
      addTempProp('players', []);
    }
    return tempglobal['players'][tempglobal['players'].push(new Audio(src)) - 1];
  }

  const pageMap = new Map();

  pageMap.set(
    "",
    [`<h2>Hello! This site is under construction. Have some Lorem Ipsum!</h2>
    <p>Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Tincidunt id aliquet risus feugiat in ante metus dictum at. Eget sit amet tellus cras adipiscing enim eu turpis. Bibendum ut tristique et egestas. Urna neque viverra justo nec. Odio ut sem nulla pharetra diam sit amet nisl. Justo nec ultrices dui sapien. Ultrices mi tempus imperdiet nulla malesuada pellentesque elit. Mattis vulputate enim nulla aliquet porttitor lacus. Dictumst quisque sagittis purus sit amet volutpat consequat. Faucibus turpis in eu mi bibendum neque egestas congue.
    </p><p>
    Aenean pharetra magna ac placerat vestibulum lectus mauris ultrices. Purus sit amet luctus venenatis lectus magna fringilla. Malesuada pellentesque elit eget gravida cum sociis natoque penatibus et. Nunc sed blandit libero volutpat sed cras ornare arcu. In arcu cursus euismod quis viverra nibh cras pulvinar. Mi tempus imperdiet nulla malesuada pellentesque. Leo in vitae turpis massa sed elementum. Sit amet consectetur adipiscing elit duis tristique sollicitudin nibh sit. Quisque egestas diam in arcu cursus euismod quis viverra nibh. Et malesuada fames ac turpis. Viverra nam libero justo laoreet sit amet. Pharetra massa massa ultricies mi quis hendrerit dolor magna eget.
    </p><p>
    Nisi lacus sed viverra tellus in hac. Turpis massa tincidunt dui ut ornare lectus sit. Vel fringilla est ullamcorper eget nulla facilisi etiam dignissim diam. Consectetur a erat nam at lectus urna duis convallis convallis. Dapibus ultrices in iaculis nunc sed augue lacus. Vel fringilla est ullamcorper eget nulla facilisi etiam dignissim diam. Egestas sed sed risus pretium quam vulputate. Id donec ultrices tincidunt arcu non sodales neque. Eget gravida cum sociis natoque penatibus et magnis dis parturient. Dui id ornare arcu odio ut sem nulla.
    </p><p>
    Amet cursus sit amet dictum. Velit euismod in pellentesque massa placerat duis ultricies. Donec massa sapien faucibus et molestie. Morbi tristique senectus et netus. Sit amet est placerat in. Nec ultrices dui sapien eget. Lorem ipsum dolor sit amet consectetur. Nulla aliquet porttitor lacus luctus accumsan tortor posuere ac. Velit euismod in pellentesque massa placerat. Bibendum enim facilisis gravida neque. Vestibulum morbi blandit cursus risus at ultrices. Aenean pharetra magna ac placerat vestibulum lectus.
    </p><p>
    Vestibulum sed arcu non odio euismod lacinia at quis risus. Quam nulla porttitor massa id. Dui faucibus in ornare quam. Amet risus nullam eget felis eget nunc lobortis mattis. Sit amet nulla facilisi morbi tempus iaculis urna id. Feugiat pretium nibh ipsum consequat nisl vel pretium. Arcu bibendum at varius vel pharetra vel turpis nunc eget. Donec enim diam vulputate ut. Nunc vel risus commodo viverra maecenas. Et odio pellentesque diam volutpat commodo. Ac tincidunt vitae semper quis lectus nulla at volutpat diam.</p>`.trim()]
  );

  pageMap.set(
    "sometext",
    [`<div id="cont-sometext" style="background-color: black; width: 100%; height: 100%; position: relative">
      <img style="border: none;" id="some-img" src="./assets/some-text.gif">
      <p id="some-text" style="color: white; font-size: 5em; z-index: 10; position: absolute; top: 160px; left: 30%; transform: rotate(-20deg); max-width: 500px;">Oh. you lose.</p>
    </div>
    `.trim(),
    () => {
      const newStyle = addTempProp('style', document.createElement('style'));
      newStyle.innerHTML = `
        #some-img {
          z-index: 5;
          animation-duration: 4s;
          animation-name: thething;
        }
        @keyframes thething {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }
        #some-text {
          animation-duration: 2s;
          animation-name: athing;
        }
        @keyframes athing {
          from {
            top: 100px;
            left: 50%;
            max-width: 350px;
            font-size: 3em;
            transform: rotate(15deg);
          }
          to {
            top: 160px;
            left: 30%;
            max-width: 500px;
            font-size: 5em;
            transform: rotate(-20deg);
          }
        }`.trim();
      document.head.appendChild(newStyle);

      let player = addAudioPlayer('./assets/some-text.mp3');
      player.load();
      player.loop = true;
      player.addEventListener('canplaythrough', () => {
        player.play().catch(() => {// if autoplaying is disabled
          const container = document.querySelector('#cont-sometext');
          const btn = addTempProp('btn', document.createElement('button'));
          btn.innerHTML = "CLICK TO PLAY THE TUNE.";
          btn.style.zIndex = "100";
          btn.style.position = "absolute";
          btn.style.bottom = "30px";
          btn.style.width = "250px";
          btn.style.height = "80px";
          btn.style.fontSize = "22px";
          btn.style.left = `${(container.clientWidth / 2) - (parseFloat(btn.style.width) / 2)}px`;
          btn.style.color = "#222222";
          btn.style.backgroundColor = "#ee4455";
          btn.onclick = function() {
            player.play();
            container.removeChild(btn);
            deleteTempProp('btn');
          };
          container.appendChild(btn);
        });
      });
    }, () => {
      document.head.removeChild(tempglobal['style']);
    }]
  );

  pageMap.set(
    "devlog-1",
    [`<h2>Log Sept-18-2021</h2>
    <p>
      Future plans for this site and method of posts:
      <ul style=\"font-family: sans-serif;\">
        <li>Change post insertion to use a map instead</li>
        <li>Improve the responsiveness of the website</li>
        <li>Make the fractal viewer to be mobile-friendly</li>
      </ul>
    </p>
    `.trim()]
  );

  pageMap.set(
    "thethe",
    [`the the the the the the the the the the the the the
    the the the the the the the the the the the the the
    the the the the the the the the the the the the the
    the the the the the the the the the the the the the
    the the the the the the the the the the the the the
    the the the the the the the the the the the the the
    the the the the the the the the the the the the the
    the the the the the the the the the the the the the
    the the the the the the the the the the the the the
    the the the the the the the the the the the the the
    the the the the the the the the the the the the the
    the the the the the the the the the the the the the
    the the the the the the the the the the the the the
    the the the the the the the the the the the the the
    the the the the the the the the the the the the the
    the the the the the the the the the the the the the
    the the the the the the the the the the the the the
    the the the the the the the the the the the the the
    the the the the the the the the the the the the the
    the the the the the the the the the the the the the
    the the the the the the the the the the the the the
    the the the the the the the the the the the the the
    `.trim()]
  );

  pageMap.set(
    "zharka",
    ['YOU DONT DESERVE THIS.']
    // [`<h2>Information About Źārkā Conlang</h2>
    // <p>IPA Charset: &#0060;æ, b, ʒ, d, e, f, g, h, i, k, l, m, n, o, p, r, ɚ, s, t, v, w, y, z, ɑ, ɪ, ə, ʊ, ʏ, θ, ð, ʃ, tʃ, ŋ, χ&#0062;</p>
    // <p>Latin-based Orthography: &#0060;a, b, ź, d, e, f, g, h, k, l, m, n, o, p, r, ë, s, t, v, w, y, z, ā, ē, u, ú, ü, þ, ð, ş, c, ŋ, x&#0062;</p>
    // <p>Written Script:</p>
    // <img src=\"./assets/alebazana.png\">
    // `.trim()]
  );

  let pageSetup = function() {
    const prefix = "#content:";
    pageChange = false;
  
    let insertContent = function(content, initCallback = null, destructCallback = null) {
      const contentArea = document.querySelector('#content-body');
      contentArea.innerHTML = content;
      tempglobal.initCallback = initCallback;
      tempglobal.destruct = destructCallback;
      tempglobal.initCallback?.();
    }

    let hash = window.location.hash;
    let hashTitle = hash.substring(prefix.length);
    let content = pageMap.get(hashTitle);

    if (content === undefined) {// Defaulting to blank hash if hash in map is undefined
      content = pageMap.get("");
      hashTitle = "";
      hash = "";
    }

    if (
      content && (
        hash.substring(0, prefix.length) === prefix || (hash === "" && hashTitle === "")
      )
    ) {
      insertContent(...content);
    }
  }
  pageSetup();
  window.addEventListener('hashchange', () => {
    pageChange = true;
    tempglobal.destruct?.();
    if (tempglobal?.['players']) {
      // Pauses audio players to be freed up for garbage collection when Audio constructor is deleted
      for (const player of tempglobal['players']) {
        player.pause();
      }
    }
    for (const key in tempglobal) {
      delete tempglobal[key];
    }
    pageSetup();
  });
});