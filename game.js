// Blood Ruby Empire - Core Game Engine
// Kashmir Valley Mining Simulator with Real Ruby Rewards

// Game State
let gameState = {
    rubiesMined: 0,
    bloodTokens: 100,
    miningPower: 1,
    landOwned: 0,
    wallet: null,
    playerPosition: { x: 0, y: 0, z: 0 }
};

// Three.js Scene Setup
let scene, camera, renderer, terrain, rubies = [];
let clock = new THREE.Clock();

// Solana Connection
const SOLANA_NETWORK = 'devnet'; // Change to mainnet-beta for production
let connection, walletAdapter;

// Initialize Game
function initGame() {
    // Setup Three.js
    scene = new THREE.Scene();
    scene.fog = new THREE.Fog(0x1a0000, 10, 100);
    
    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.set(0, 5, 10);
    
    renderer = new THREE.WebGLRenderer({ 
        canvas: document.getElementById('gameCanvas'),
        antialias: true 
    });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.shadowMap.enabled = true;
    
    // Lighting - Kashmir Valley Ambiance
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
    scene.add(ambientLight);
    
    const sunLight = new THREE.DirectionalLight(0xffd700, 0.8);
    sunLight.position.set(50, 50, 50);
    sunLight.castShadow = true;
    scene.add(sunLight);
    
    // Create Kashmir Valley Terrain
    createTerrain();
    
    // Spawn Initial Rubies
    spawnRubies(20);
    
    // Setup Controls
    setupControls();
    
    // Hide loading, show HUD
    document.getElementById('loading').style.display = 'none';
    document.getElementById('hud').style.display = 'block';
    document.getElementById('leaderboard').style.display = 'block';
    
    // Start game loop
    animate();
    
    // Initialize Solana
    initSolana();
}

// Create 3D Terrain (Kashmir Valley)
function createTerrain() {
    const geometry = new THREE.PlaneGeometry(100, 100, 50, 50);
    const vertices = geometry.attributes.position.array;
    
    // Generate mountainous terrain
    for (let i = 0; i < vertices.length; i += 3) {
        const x = vertices[i];
        const y = vertices[i + 1];
        vertices[i + 2] = Math.sin(x * 0.1) * Math.cos(y * 0.1) * 3 + Math.random() * 2;
    }
    
    geometry.computeVertexNormals();
    
    const material = new THREE.MeshStandardMaterial({ 
        color: 0x2d5016,
        roughness: 0.8,
        metalness: 0.2
    });
    
    terrain = new THREE.Mesh(geometry, material);
    terrain.rotation.x = -Math.PI / 2;
    terrain.receiveShadow = true;
    scene.add(terrain);
    
    // Add rocks
    for (let i = 0; i < 30; i++) {
        const rockGeo = new THREE.DodecahedronGeometry(Math.random() * 0.5 + 0.3);
        const rockMat = new THREE.MeshStandardMaterial({ color: 0x4a4a4a });
        const rock = new THREE.Mesh(rockGeo, rockMat);
        rock.position.set(
            Math.random() * 80 - 40,
            0.5,
            Math.random() * 80 - 40
        );
        rock.castShadow = true;
        scene.add(rock);
    }
}

// Spawn Ruby Deposits
function spawnRubies(count) {
    const rubyTypes = [
        { name: 'Common', color: 0xff6b6b, rarity: 0.6, value: 1 },
        { name: 'Rare', color: 0xff0000, rarity: 0.25, value: 5 },
        { name: 'Epic', color: 0xcc0000, rarity: 0.1, value: 20 },
        { name: 'Legendary Pigeon Blood', color: 0x8b0000, rarity: 0.05, value: 100 }
    ];
    
    for (let i = 0; i < count; i++) {
        const rand = Math.random();
        let rubyType = rubyTypes[0];
        
        if (rand < 0.05) rubyType = rubyTypes[3];
        else if (rand < 0.15) rubyType = rubyTypes[2];
        else if (rand < 0.4) rubyType = rubyTypes[1];
        
        const geometry = new THREE.OctahedronGeometry(0.3);
        const material = new THREE.MeshStandardMaterial({ 
            color: rubyType.color,
            emissive: rubyType.color,
            emissiveIntensity: 0.5,
            metalness: 0.8,
            roughness: 0.2
        });
        
        const ruby = new THREE.Mesh(geometry, material);
        ruby.position.set(
            Math.random() * 80 - 40,
            0.5,
            Math.random() * 80 - 40
        );
        ruby.userData = { type: rubyType.name, value: rubyType.value };
        ruby.castShadow = true;
        
        // Floating animation
        ruby.userData.floatOffset = Math.random() * Math.PI * 2;
        
        scene.add(ruby);
        rubies.push(ruby);
    }
}

// Setup Mouse/Touch Controls
function setupControls() {
    const canvas = document.getElementById('gameCanvas');
    
    canvas.addEventListener('click', (event) => {
        const mouse = new THREE.Vector2(
            (event.clientX / window.innerWidth) * 2 - 1,
            -(event.clientY / window.innerHeight) * 2 + 1
        );
        
        const raycaster = new THREE.Raycaster();
        raycaster.setFromCamera(mouse, camera);
        
        const intersects = raycaster.intersectObjects(rubies);
        
        if (intersects.length > 0) {
            mineRuby(intersects[0].object);
        }
    });
    
    // Camera rotation with mouse
    let isDragging = false;
    let previousMousePosition = { x: 0, y: 0 };
    
    canvas.addEventListener('mousedown', () => isDragging = true);
    canvas.addEventListener('mouseup', () => isDragging = false);
    canvas.addEventListener('mousemove', (event) => {
        if (isDragging) {
            const deltaX = event.clientX - previousMousePosition.x;
            camera.rotation.y += deltaX * 0.005;
        }
        previousMousePosition = { x: event.clientX, y: event.clientY };
    });
}

// Mine Ruby
function mineRuby(ruby) {
    const value = ruby.userData.value * gameState.miningPower;
    gameState.rubiesMined += value;
    gameState.bloodTokens += value * 10;
    
    // Visual effect
    ruby.material.emissiveIntensity = 2;
    setTimeout(() => {
        scene.remove(ruby);
        rubies = rubies.filter(r => r !== ruby);
        
        // Respawn new ruby
        spawnRubies(1);
    }, 200);
    
    updateHUD();
    
    // Check for legendary ruby
    if (ruby.userData.type === 'Legendary Pigeon Blood') {
        alert('🩸 LEGENDARY PIGEON BLOOD MINED! You can redeem a REAL ruby!');
    }
}

// Upgrade Mining Tool
function upgradeTool() {
    const cost = 50 * gameState.miningPower;
    if (gameState.bloodTokens >= cost) {
        gameState.bloodTokens -= cost;
        gameState.miningPower += 0.5;
        updateHUD();
    } else {
        alert('Not enough $BLOOD tokens!');
    }
}

// Update HUD
function updateHUD() {
    document.getElementById('ruby-count').textContent = Math.floor(gameState.rubiesMined);
    document.getElementById('blood-tokens').textContent = Math.floor(gameState.bloodTokens);
    document.getElementById('mining-power').textContent = gameState.miningPower.toFixed(1) + 'x';
    document.getElementById('land-owned').textContent = gameState.landOwned;
}

// Animation Loop
function animate() {
    requestAnimationFrame(animate);
    
    const delta = clock.getDelta();
    
    // Animate rubies (floating effect)
    rubies.forEach(ruby => {
        ruby.rotation.y += delta;
        ruby.position.y = 0.5 + Math.sin(Date.now() * 0.001 + ruby.userData.floatOffset) * 0.2;
    });
    
    renderer.render(scene, camera);
}

// Solana Wallet Integration
function initSolana() {
    connection = new solanaWeb3.Connection(
        solanaWeb3.clusterApiUrl(SOLANA_NETWORK),
        'confirmed'
    );
}

async function connectWallet() {
    try {
        const { solana } = window;
        
        if (!solana || !solana.isPhantom) {
            alert('Please install Phantom Wallet: https://phantom.app/');
            return;
        }
        
        const response = await solana.connect();
        gameState.wallet = response.publicKey.toString();
        
        document.getElementById('connectBtn').textContent = 
            '✅ ' + gameState.wallet.substring(0, 4) + '...' + gameState.wallet.substring(gameState.wallet.length - 4);
        
        // Check if user owns land NFTs
        checkLandOwnership();
        
    } catch (err) {
        console.error('Wallet connection failed:', err);
    }
}

async function checkLandOwnership() {
    // TODO: Query Solana for NFTs owned by wallet
    // For now, mock data
    gameState.landOwned = Math.floor(Math.random() * 5);
    updateHUD();
}

// Window Resize Handler
window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});

// Start Game
window.addEventListener('load', initGame);