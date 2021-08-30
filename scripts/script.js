window.addEventListener('load', function() {
    let pageSetup = function() {
        const prefix = "#pages:";
    
        let insertContent = function(hash, content, headScript = null) {
            const contentArea = document.querySelector('#content-body');

            if (
                window.location.hash == (prefix + hash) ||
                (window.location.hash == "" && hash == "")
            ) {
                contentArea.innerHTML = content;
                headScript != null ? headScript() : null;
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
            "images-to-xmp", 
            `<div style="margin-top: 20%;">
              <p style="margin: 10px auto; text-align: center; text-indent: 0;">
                <span style="color: #422f95;">Convert image files to the XPM format!:</span> 
                <input id="upload" type="file">
              </p>
            </div>`,
            imageToXPMsrc
        );
    }
    pageSetup();
    window.addEventListener('hashchange', pageSetup);
});

function imageToXPMsrc() {
    let alphaThreshold;
    let imgCount = 0;
    let charsPerPixel = 1;
    let asciiSet = ".+@#$%&*=-;>,\')!~{]^\/(_:<[}|1234567890abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");

    let imageDataToXMPString = function(image) {
        let pixelHexArray = [];
        let colorPalette = [];
        let hexAsciiMap = new Map(); // Map<colorHex, asciiChars>

        alphaThreshold = parseInt(
        alphaThreshold ?
            confirm("Use the current alpha threshold [" + alphaThreshold + "]?") ?
            alphaThreshold
            : prompt("Set the alpha threshold value [0-255]:\n")
        : prompt("Set the alpha threshold value [0-255]:\n")
        );

        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");
        canvas.width = image.naturalWidth;
        canvas.height = image.naturalHeight;
        ctx.imageSmoothingEnabled = false;

        ctx.drawImage(image, 0, 0);
        
        let imageData = ctx.getImageData(0, 0, image.naturalWidth, image.naturalHeight);

        // Pulling out RGB components and pushing them as hex strings, accounting for alphaThreshold.
        for (let i = 0; i < imageData.data.length; i += 4) {
        let alpha = imageData.data[i + 3] / 255;
        pixelHexArray.push(
            imageData.data[i + 3] < alphaThreshold ?
            "None"
            : RGBToHex(
            imageData.data[i + 0] * alpha,
            imageData.data[i + 1] * alpha,
            imageData.data[i + 2] * alpha
            )
        );
        }
        // To filter for first occurance of a color.
        for (let i = 0; i < pixelHexArray.length; i++) {
        let amountOfHex = colorPalette.filter(value => value == pixelHexArray[i]).length;
        if (amountOfHex === 0) colorPalette.push(pixelHexArray[i]);
        }

        // Set amount of chars per pixel according to how many colors are used.
        charsPerPixel = Math.ceil(baseLog(asciiSet.length, colorPalette.length));
        
        let XMPString = `
        /* XPM */\nstatic char * xpm_image_${imgCount++}[] = {\n"${image.naturalWidth} ${image.naturalHeight} ${colorPalette.length} ${charsPerPixel}",\n`

        for (let i = 0; i < colorPalette.length; i++) {
        hexAsciiMap.set(colorPalette[i], getAsciiPerPixel(i));
        XMPString += `\"${getAsciiPerPixel(i)} c ${colorPalette[i]}\",\n`;
        }

        for (let i = 0; i < (image.naturalWidth * image.naturalHeight); i++) {
        let modWidth = i % image.naturalWidth;
        XMPString += `${
            (modWidth == 0 || i == 0) ? "\"" : ""
            }${
            hexAsciiMap.get(pixelHexArray[i])
            }${
            modWidth != (image.naturalWidth - 1) || i == 0 ?
                ""
                : i != (image.naturalWidth * image.naturalHeight) - 1 ?
                "\",\n"
            : "\""}`;
        }
        return (XMPString + "}").trim();
    }

    let baseLog = function(x, y) {
        return (Math.log(y) / Math.log(x));
    }

    let toBaseArray = function(number, radix) {
        let digitArray = [];
        let quotient = number;
        
        if (radix <= 1) {
        for (let i = 0; i < number; i++) {
            digitArray.push(1);
        }
        return digitArray;
        }
        while (true) {
        let currQuotient = Math.trunc(quotient / radix);
        if (currQuotient < radix) {
            digitArray.push(quotient % radix);
            digitArray.push(currQuotient);
            break;
        };
        digitArray.push(quotient % radix);
        quotient = currQuotient;
        }
        return digitArray;
    }

    let getAsciiPerPixel = function(index) {
        let chars = new Array(charsPerPixel).fill(0);
        let baseArray = toBaseArray(index, asciiSet.length);
        for (let i = 0; i < charsPerPixel; i++) {
        chars[i] = (baseArray[i] ? asciiSet[baseArray[i]] : asciiSet[0]);
        }
        chars.reverse();
        return chars.join("");
    }

    let RGBToHex = function(red, green, blue) {
        red = red.toString(16);
        green = green.toString(16);
        blue = blue.toString(16);
        return "#" + new String(
        (red.length === 1 ? `0${red}` : Number("0x" + red) > 255 ? "ff" : red) +
        (green.length === 1 ? `0${green}` : Number("0x" + green) > 255 ? "ff" : green) +
        (blue.length === 1 ? `0${blue}` : Number("0x" + blue) > 255 ? "ff" : blue)
        );
    }

    let stringToXPMFile = function(string) {
        let file = new File([new Blob([string])], "image", {type: "image/x-xpixmap"});
        let a = document.createElement("a");
        let objURL = (URL || webkitURL).createObjectURL(file);
        a.href =  objURL;
        a.download = "xpm-image.xpm";
        a.click();
        (URL || webkitURL).revokeObjectURL(objURL);
        a.remove();
    }

    let upload = function(input) {
        let file = input.files[0];
        let reader = new FileReader();
        reader.addEventListener("load", _ => {
            let image = new Image();
            image.src = reader.result;
            image.onload = function() {stringToXPMFile(imageDataToXMPString(image))};
            input.value = null;
        });
        reader.readAsDataURL(file);
    }
    
    document.querySelector("#upload").onchange = e => upload(e.target);
}