const URL = "./model/";
let model, webcam, labelContainer, maxPredictions;
let currentMode = "webcam";

async function loadModel() {
    model = await tmImage.load(URL + "model.json", URL + "metadata.json");
    maxPredictions = model.getTotalClasses();
    labelContainer = document.getElementById("label-container");
    labelContainer.innerHTML = "";

    model.getClassLabels().forEach(label => {
        const item = document.createElement("div");
        item.className = "prediction-item";
        item.innerHTML = `
            <div class="class-label"><span>${label}</span><span class="pct-text">0%</span></div>
            <div class="progress-bar-container"><div class="progress-bar"></div></div>`;
        labelContainer.appendChild(item);
    });
}

async function initWebcam() {
    if (webcam) await webcam.stop();
    document.getElementById("uploadedImageCanvas").style.display = "none";
    document.getElementById("webcam-container").style.display = "block";

    webcam = new tmImage.Webcam(400, 400, true);
    await webcam.setup();
    await webcam.play();

    document.getElementById("webcam-container").innerHTML = "";
    document.getElementById("webcam-container").appendChild(webcam.canvas);
    currentMode = "webcam";
    window.requestAnimationFrame(loop);
}

async function loop() {
    if (currentMode === "webcam") {
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
            if (webcam) await webcam.stop();
            document.getElementById("webcam-container").style.display = "none";
            const canvas = document.getElementById("uploadedImageCanvas");
            canvas.style.display = "block";
            const ctx = canvas.getContext("2d");
            canvas.width = 400; 
            canvas.height = 400;
            ctx.drawImage(img, 0, 0, 400, 400);
            currentMode = "image";
            await predict(canvas);
        };
        img.src = e.target.result;
    };
    reader.readAsDataURL(event.target.files[0]);
}

async function predict(input) {
    const prediction = await model.predict(input);
    let maskProb = 0, glassesProb = 0, hatProb = 0;

    prediction.forEach((p, i) => {
        const percent = (p.probability * 100).toFixed(0) + "%";
        const item = labelContainer.children[i];
        item.querySelector(".pct-text").innerText = percent;
        item.querySelector(".progress-bar").style.width = percent;

        if (p.className.toLowerCase().includes("mask")) maskProb = p.probability;
        if (p.className.toLowerCase().includes("glasses") || p.className.toLowerCase().includes("spec")) glassesProb = p.probability;
        if (p.className.toLowerCase().includes("hat")) hatProb = p.probability;
    });

    const threshold = 0.35;
    const hasMask = maskProb > threshold;
    const hasGlasses = glassesProb > threshold;
    const hasHat = hatProb > threshold;

    let results = [];
    if (hasMask) results.push("Mask 😷");
    if (hasGlasses) results.push("Glasses 👓");
    if (hasHat) results.push("Hat 🧢");

    document.getElementById("final-status").innerText = 
        results.length > 0 ? "Detected: " + results.join(" + ") : "No Accessories 👤";
}

window.onload = loadModel;
