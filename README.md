# 🎯 Web Aim Trainer

A lightweight, web-based aim training tool designed to help gamers warm up and improve their reflexes before jumping into FPS matches. Built with **Three.js** and WebGL for immersive 3D graphics and responsive gameplay mechanics.

![Screenshot](screenshot.png)

---

## 🚀 Features

- 🎮 **First-Person Shooter Perspective** with mouse tracking.
- 🔫 3D Gun model loaded via GLTF.
- 🎯 Targets spawn at random positions and distances.
- ⏱️ 60-second timed challenge.
- 📊 Real-time **Score**, **Misses**, and **Accuracy** tracking.
- 🧠 Smart hit detection using **Raycasting** and layers.
- 📈 Post-game performance analysis with improvement advice.
- 🌗 Multiple difficulty levels: Easy, Medium, Hard, Insane.

---

## 🧰 Technologies Used

- [**Three.js**](https://threejs.org/) – For 3D rendering and scene management.
- **GLTFLoader** – To load the weapon model (`gun.glb`).
- **JavaScript + HTML + CSS** – Core logic and UI structure.
- **WebGL** – Powered by Three.js for GPU-accelerated rendering.
- **Pointer Lock API** – To enable immersive mouse control.

---

## 🛠️ How It Works

- A 3D scene is rendered using Three.js with a sky-blue background and a flat ground plane.
- A GLTF 3D model of a gun is attached to the camera, giving a first-person perspective.
- Randomly placed spherical targets appear at intervals depending on the difficulty.
- Mouse clicks are captured and processed through **raycasting** to detect hits or misses.
- Targets are removed after a specific lifetime if not hit.
- At the end of 60 seconds, performance stats and improvement tips are displayed.

---

## ⚙️ Installation

1. Clone the repository:

```bash
git clone https://github.com/your-username/aim-trainer.git
```

2. Make sure the folder contains the following files:

```bash
/index.html
/script.js
/style.css
/gun.glb
```

3. Run a local server (e.g., with VS Code Live Server or Python):

```bash
# Python 3.x
python -m http.server
```

4. Open the app in your browser:
```cpp
http://127.0.0.1:8000
```

📁 File Structure

```bash
├── index.html          # Main HTML file
├── style.css           # Styling and layout
├── script.js           # Game logic and Three.js integration
├── gun.glb             # 3D gun model
```

🎮 Controls
* Click to shoot.
* Mouse Movement to aim.
* Esc to exit pointer lock.
* Select difficulty and press Start Game (60s) to begin.

🧠 Future Enhancements
* ML-based sensitivity calibration (in development!).

🙌 Acknowledgments
* Inspired by aim trainers like Aim Lab, Kovaak's, and Valorant's training range.
* 3D assets sourced from open-source GLTF models.

👤 Author

* Aditya Sahasrabuddhe
* MS in Computer Science @ ASU
* Former Dev @ Metrum AI | FPS Gamer | ML + Graphics Enthusiast