# Crimson Lane

A DotA 1-style MOBA game built from scratch using HTML5 Canvas and Three.js.

## Features

- **5 Playable Heroes**: Lich, Sniper, Dragon Knight, Shadow Fiend, Windrunner
- **3 Lanes**: Top, Middle, Bottom
- **Lane Creeps**: Melee, Ranged, Cannon, and Mega Creeps
- **18 Towers**: 3 tiers x 3 lanes (6 per side)
- **6 Barracks**: One for each lane
- **AI Bots**: Easy, Normal, and Hard difficulty levels
- **Mobile Controls**: Touch joystick and action buttons
- **Audio SFX**: Web Audio API generated sounds
- **Localization**: English and Vietnamese support

## Project Structure

```
.
├── index.html              # Main game HTML
├── README.md               # This file
├── docs/                   # Documentation
├── js/                     # Game modules
│   ├── main.js             # Game loop and UI logic
│   ├── constants.js        # Game constants and formulas
│   ├── state.js            # Global state management
│   ├── scene.js            # Three.js setup
│   ├── map.js              # Map generation
│   ├── hero-models.js      # Shared hero materials
│   ├── animations.js       # Animation system
│   ├── combat.js           # Damage and combat logic
│   ├── skills.js           # Skill system
│   ├── creeps.js           # Lane creeps
│   ├── towers.js           # Towers and barracks
│   ├── ai.js               # Bot AI system
│   ├── items.js            # Item system
│   ├── hud.js              # UI HUD
│   ├── controls.js         # Input system
│   ├── audio.js            # Sound effects
│   ├── particles.js        # Particle effects
│   ├── i18n.js             # Localization
│   ├── heroes.js           # Hero registry
│   └── heroes/
│       ├── _template.js    # Hero base class
│       ├── lich.js         # Lich hero
│       ├── sniper.js       # Sniper hero
│       ├── dragonKnight.js # Dragon Knight hero
│       ├── shadowFiend.js  # Shadow Fiend hero
│       └── windrunner.js   # Windrunner hero
├── locales/                # Localization files
│   ├── en.json
│   └── vi.json
└── tests/
    └── combat-formulas.test.js
```

## Controls

### Desktop
- **WASD** or **Arrow Keys**: Move hero
- **Q, W, E, R**: Cast skills
- **Click**: Move to position
- **Click on enemy**: Attack

### Mobile
- **Left Joystick**: Move hero
- **Attack Button**: Auto-attack
- **Jump Button**: Jump

## Game Mechanics

### Damage Formula
```
damage * (100 / (100 + armor * 6))
```

### Respawn Time
```
5 + (level - 1) * 2 seconds
```

### XP Rewards
- Hero Kill: 150 + (level × 25)
- Melee Creep: 40 XP
- Ranged Creep: 20 XP

### Gold Rewards
- Hero Kill: 100 + (level × 25)
- Melee Creep: 18 Gold
- Ranged Creep: 12 Gold

## Running the Game

1. Open `index.html` in a modern web browser
2. The game will start automatically

## Development

### Building from Source
```bash
# No build step required - the game runs directly from source files
```

### Adding a New Hero
1. Create `js/heroes/{hero-name}.js`
2. Extend the `Hero` base class
3. Implement `buildModel()`, `getSkillTemplates()`, and `executeSkill()`
4. Add the hero to `HERO_REGISTRY` in `js/heroes.js`

## License

Copyright © 2025 Monk Journey Team. All Rights Reserved.

This project is proprietary and confidential. Unauthorized reproduction, distribution, or disclosure is prohibited. No license, express or implied, to any intellectual property rights is granted by this document.

See the [LICENSE](LICENSE) file for full details.

