const URL = "./model/";
let model, webcam, labelContainer, maxPredictions;
let currentMode = 'webcam';

async function loadModel() {
    model = await tmImage.load(URL + "model.json", URL + "metadata.json");
    maxPredictions = model.getTotalClasses();
    labelContainer = document.getElementById("label-container");
    
    labelContainer.innerHTML = ""; // Clear existing
    for (let i = 0; i < maxPredictions; i++) {
        const item = document.createElement("div");
        item.className = "prediction-item";
        item.innerHTML = `
            <div class="class-label">
                <span>${model.getClassLabels()[i]}</span>
                <span class="pct-text">0%</span>
            </div>
            <div class="progress-bar-container">
                <div class="progress-bar"></div>
            </div>
        `;
        labelContainer.appendChild(item);
    }
}

async function initWebcam() {
    if (webcam) await webcam.stop();
    webcam = new tmImage.Webcam(400, 400, true);
    await webcam.setup();
    await webcam.play();
    document.getElementById("webcam-container").innerHTML = "";
    document.getElementById("webcam-container").appendChild(webcam.canvas);
    document.getElementById("uploadedImageCanvas").style.display = "none";
    currentMode = 'webcam';
    window.requestAnimationFrame(loop);
}

async function loop() {
    if (currentMode === 'webcam') {
        webcam.update();
        await predict(webcam.canvas);
        window.requestAnimationFrame(loop);
    }
}

async function handleImageUpload(event) {
    const reader = new FileReader();
    reader.onload = e => {
        const img = new Image();
        img.onload = async () => {
            const canvas = document.getElementById("uploadedImageCanvas");
            const ctx = canvas.getContext("2d");
            canvas.width = 400;
            canvas.height = 400;
            ctx.drawImage(img, 0, 0, 400, 400);
            canvas.style.display = "block";
            document.getElementById("webcam-container").innerHTML = "";
            currentMode = 'image';
            await predict(canvas);
        };
        img.src = e.target.result;
    };
    reader.readAsDataURL(event.target.files[0]);
}

async function predict(input) {
    const prediction = await model.predict(input);
    for (let i = 0; i < maxPredictions; i++) {
        const pct = (prediction[i].probability * 100).toFixed(0) + "%";
        const item = labelContainer.childNodes[i];
        item.querySelector(".pct-text").innerText = pct;
        const bar = item.querySelector(".progress-bar");
        bar.style.width = pct;
        
        // Warna dinamik
        const color = prediction[i].probability > 0.6 ? "#39ff14" : (prediction[i].probability > 0.3 ? "#00f2ff" : "#ff2d55");
        bar.style.backgroundColor = color;
        bar.style.color = color;
    }
}

window.onload = loadModel;
