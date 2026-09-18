# 🗺️ Top-Down Game Engine (TypeScript + React)

A modern 2D top-down RPG / adventure game engine prototype built with **React 19**, **TypeScript**, **HTML5 Canvas**, and **Vite**.

[![React](https://img.shields.io/badge/React-19.2-61DAFB?logo=react&logoColor=black)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-6.0-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-8.3-646CFF?logo=vite&logoColor=white)](https://vitejs.dev/)
[![Bun](https://img.shields.io/badge/Bun-Ready-FBF0DF?logo=bun&logoColor=black)](https://bun.sh/)
[![License](https://img.shields.io/badge/license-MIT-green.svg)](LICENSE)

---

## 📖 Overview

This project is a lightweight foundation for 2D top-down games. It combines the declarative lifecycle of React with direct, high-performance HTML5 2D Canvas rendering and an optimized `requestAnimationFrame` game loop.

---

## ✨ Features

- 🎮 **Direct 2D Canvas Engine**: Renders a fixed `1024x576` 16:9 canvas viewport inside React with zero unnecessary DOM overhead.
- 🔄 **Continuous Game Loop**: Driven by `requestAnimationFrame` for smooth frame rates and input response.
- 🗺️ **World & Terrain Rendering**: Supports custom background maps and terrain textures.
- 🏃 **Directional Sprite Sheets**: Modular sprite loading with support for multi-frame directional animations (`playerDown`, `playerUp`, `playerLeft`, `playerRight`).
- ⌨️ **Responsive Keyboard Input**: Real-time multi-key tracking for fluid character movement (WASD).
- ⚡ **Ultra-Fast Tooling**: Powered by Vite and React Compiler with native Bun support.

---

## 🕹️ Controls

| Key | Action |
|:---:|:---|
| <kbd>W</kbd> | Move Up |
| <kbd>A</kbd> | Move Left |
| <kbd>S</kbd> | Move Down |
| <kbd>D</kbd> | Move Right |

---

## 📁 Project Structure

```text
topDown_Map/
├── public/                     # Static game assets
│   ├── BackgroundTerrain.png  # World terrain / map graphic
│   ├── playerDown.png         # Downward walking sprite sheet
│   ├── playerUp.png           # Upward walking sprite sheet
│   ├── playerLeft.png         # Leftward walking sprite sheet
│   ├── playerRight.png        # Rightward walking sprite sheet
│   ├── favicon.svg            # Site icon
│   └── icons.svg
├── src/
│   ├── assets/                # Additional game graphics and SVGs
│   ├── App.tsx                # Game canvas, loop, sprite rendering, and input listeners
│   ├── App.css                # App-level styling
│   ├── index.css              # Global styling & reset rules
│   └── main.tsx               # React DOM entry point
├── index.html                 # HTML template
├── package.json               # Dependencies and scripts
├── tsconfig.json              # TypeScript configuration
└── vite.config.ts             # Vite configuration
```

---

## 🚀 Getting Started

### Prerequisites

Ensure you have either [Bun](https://bun.sh/) or [Node.js](https://nodejs.org/) (v18+) installed on your machine.

### Installation

Clone the repository and install dependencies:

```bash
# Clone repository
git clone https://github.com/Lakshyakumar266/topDown-game-ts.git
cd topDown-game-ts

# Install dependencies using Bun (recommended)
bun install

# Or install using npm
npm install
```

### Running the Development Server

Start the local Vite development server with Hot Module Replacement (HMR):

```bash
# Using Bun
bun run dev

# Or using npm
npm run dev
```

Navigate to `http://localhost:5173` in your browser to play and preview.

### Building for Production

Compile TypeScript and build the optimized production assets:

```bash
# Using Bun
bun run build

# Or using npm
npm run build
```

To preview the production build locally:

```bash
bun run preview
# or: npm run preview
```

---

## 🧠 Architecture & Mechanics

### Canvas & Game Loop Lifecycle
The canvas lifecycle is managed through React's `useRef` and `useEffect`:
- **Canvas Initialisation**: Grabs the `2d` rendering context and initializes the frame size (`1024x576`).
- **Game Loop**: Executes through `requestAnimationFrame(gameLoop)`, ensuring rendering synchronizes with the display refresh rate.
- **Cleanup**: Removes event listeners on component unmount to prevent memory leaks.

### Sprite Animation Slicing
Sprites are rendered using Canvas `drawImage()` with sub-rectangle slicing:
```typescript
ctx.drawImage(
  PlayerImage,
  0, 0,                                         // Source x, y
  PlayerImage.width / 4, PlayerImage.height,     // Source width, height (single frame)
  canvas.width / 2 - PlayerImage.width / 4,      // Destination x (center)
  canvas.height / 2 - PlayerImage.height / 2,    // Destination y (center)
  PlayerImage.width / 4, PlayerImage.height      // Destination width, height
);
```

---

## 🗺️ Roadmap

- [ ] **Player Movement**: Translate map/player coordinates based on active key states.
- [ ] **Animation Cycle**: Increment animation frame counters to cycle through sprite walk frames.
- [ ] **Camera System**: Implement viewport offset / camera follow system for expansive maps.
- [ ] **Collision Detection**: Add tile-based or bounding-box collision detection layers.
- [ ] **Interactive Entities**: Add NPCs, dialogue triggers, and collectible items.
- [ ] **Audio System**: Background music and dynamic sound effects.

---

## 📄 License

This project is licensed under the [MIT License](LICENSE).
