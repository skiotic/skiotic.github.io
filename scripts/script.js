let pageChange;
window.addEventListener('load', function() {
    let pageSetup = function() {
        const prefix = "#pages:";
        pageChange = false;
    
        let insertContent = function(hash, content, callback = null) {
            const contentArea = document.querySelector('#content-body');

            if (
                window.location.hash == (prefix + hash) ||
                (window.location.hash == "" && hash == "" && window.location.href.endsWith("index.html"))
            ) {
                contentArea.innerHTML = content;
                callback != null ? callback() : null;
            }
        }
    
        const homeBtn = document.querySelector("#home-btn");
    
        homeBtn.addEventListener('click', () => window.location.assign("https://skiotic.github.io"));
    
        insertContent(
            "",
            `<h2>Hello! This site is under construction. Have some Lorem Ipsum!</h2>
            <p>Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Tincidunt id aliquet risus feugiat in ante metus dictum at. Eget sit amet tellus cras adipiscing enim eu turpis. Bibendum ut tristique et egestas. Urna neque viverra justo nec. Odio ut sem nulla pharetra diam sit amet nisl. Justo nec ultrices dui sapien. Ultrices mi tempus imperdiet nulla malesuada pellentesque elit. Mattis vulputate enim nulla aliquet porttitor lacus. Dictumst quisque sagittis purus sit amet volutpat consequat. Faucibus turpis in eu mi bibendum neque egestas congue.
            </p><p>
            Aenean pharetra magna ac placerat vestibulum lectus mauris ultrices. Purus sit amet luctus venenatis lectus magna fringilla. Malesuada pellentesque elit eget gravida cum sociis natoque penatibus et. Nunc sed blandit libero volutpat sed cras ornare arcu. In arcu cursus euismod quis viverra nibh cras pulvinar. Mi tempus imperdiet nulla malesuada pellentesque. Leo in vitae turpis massa sed elementum. Sit amet consectetur adipiscing elit duis tristique sollicitudin nibh sit. Quisque egestas diam in arcu cursus euismod quis viverra nibh. Et malesuada fames ac turpis. Viverra nam libero justo laoreet sit amet. Pharetra massa massa ultricies mi quis hendrerit dolor magna eget.
            </p><p>
            Nisi lacus sed viverra tellus in hac. Turpis massa tincidunt dui ut ornare lectus sit. Vel fringilla est ullamcorper eget nulla facilisi etiam dignissim diam. Consectetur a erat nam at lectus urna duis convallis convallis. Dapibus ultrices in iaculis nunc sed augue lacus. Vel fringilla est ullamcorper eget nulla facilisi etiam dignissim diam. Egestas sed sed risus pretium quam vulputate. Id donec ultrices tincidunt arcu non sodales neque. Eget gravida cum sociis natoque penatibus et magnis dis parturient. Dui id ornare arcu odio ut sem nulla.
            </p><p>
            Amet cursus sit amet dictum. Velit euismod in pellentesque massa placerat duis ultricies. Donec massa sapien faucibus et molestie. Morbi tristique senectus et netus. Sit amet est placerat in. Nec ultrices dui sapien eget. Lorem ipsum dolor sit amet consectetur. Nulla aliquet porttitor lacus luctus accumsan tortor posuere ac. Velit euismod in pellentesque massa placerat. Bibendum enim facilisis gravida neque. Vestibulum morbi blandit cursus risus at ultrices. Aenean pharetra magna ac placerat vestibulum lectus.
            </p><p>
            Vestibulum sed arcu non odio euismod lacinia at quis risus. Quam nulla porttitor massa id. Dui faucibus in ornare quam. Amet risus nullam eget felis eget nunc lobortis mattis. Sit amet nulla facilisi morbi tempus iaculis urna id. Feugiat pretium nibh ipsum consequat nisl vel pretium. Arcu bibendum at varius vel pharetra vel turpis nunc eget. Donec enim diam vulputate ut. Nunc vel risus commodo viverra maecenas. Et odio pellentesque diam volutpat commodo. Ac tincidunt vitae semper quis lectus nulla at volutpat diam.</p>`.trim()
        );

        insertContent(
            "sometext",
            `<div style="background-color: black; width: 100%; height: 100%; position: relative">
                <img style="border: none;" id="some-img" src="./assets/some-text.gif">
                <p id="some-text" style="color: white; font-size: 5em; z-index: 10; position: absolute; top: 160px; left: 30%; transform: rotate(-20deg); max-width: 500px;">Oh. you lose.</p>
            </div>
            `.trim()
        );
    }
    pageSetup();
    window.addEventListener('hashchange', () => {
        pageChange = true;

        pageSetup();
    });
});