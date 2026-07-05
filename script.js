on
{
  "html": "<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>3D Endless Runner - XROGA</title>
    <style>
        body { margin: 0; overflow: hidden; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; }
        #info {
            position: absolute;
            top: 20px;
            left: 20px;
            color: white;
            font-size: 24px;
            font-weight: bold;
            text-shadow: 2px 2px 4px rgba(0,0,0,0.8);
            z-index: 10;
            pointer-events: none;
        }
        #coin-counter {
            position: absolute;
            top: 20px;
            right: 20px;
            color: gold;
            font-size: 28px;
            font-weight: bold;
            text-shadow: 2px 2px 4px rgba(0,0,0,0.8);
            z-index: 10;
            pointer-events: none;
        }
        #game-over {
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            color: white;
            font-size: 48px;
            font-weight: bold;
            text-shadow: 3px 3px 6px rgba(0,0,0,0.9);
            z-index: 20;
            display: none;
            text-align: center;
            background: rgba(0,0,0,0.7);
            padding: 30px 50px;
            border-radius: 20px;
            border: 3px solid #ff4444;
        }
        #game-over button {
            margin-top: 20px;
            padding: 15px 40px;
            font-size: 24px;
            background: #ff4444;
            color: white;
            border: none;
            border-radius: 10px;
            cursor: pointer;
            font-weight: bold;
        }
        #game-over button:hover {
            background: #ff6666;
        }
        #start-screen {
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            color: white;
            font-size: 36px;
            font-weight: bold;
            text-shadow: 3px 3px 6px rgba(0,0,0,0.9);
            z-index: 20;
            text-align: center;
            background: rgba(0,0,0,0.6);
            padding: 40px 60px;
            border-radius: 20px;
            border: 3px solid #00ff88;
        }
        #start-screen button {
            margin-top: 20px;
            padding: 15px 40px;
            font-size: 24px;
            background: #00ff88;
            color: black;
            border: none;
            border-radius: 10px;
            cursor: pointer;
            font-weight: bold;
        }
        #start-screen button:hover {
            background: #33ffaa;
        }
        .controls-hint {
            position: absolute;
            bottom: 30px;
            left: 50%;
            transform: translateX(-50%);
            color: rgba(255,255,255,0.6);
            font-size: 16px;
            z-index: 10;
            text-shadow: 1px 1px 2px rgba(0,0,0,0.8);
            background: rgba(0,0,0,0.4);
            padding: 8px 20px;
            border-radius: 20px;
        }
    </style>
</head>
<body>
    <div id="info">🏃 Score: <span id="score">0</span></div>
    <div id="coin-counter">🪙 <span id="coins">0</span></div>
    <div id="game-over">
        💀 GAME OVER 💀<br>
        <span style="font-size: 28px;">Score: <span id="final-score">0</span></span><br>
        <button onclick="restartGame()">🔄 Play Again</button>
    </div>
    <div id="start-screen">
        🏃 3D RUNNER<br>
        <span style="font-size: 20px;">Collect coins • Avoid obstacles</span><br>
        <button onclick="startGame()">▶ START</button>
    </div>
    <div class="controls-hint">⬅⬆➡ or A W D • Space to Jump</div>

    <!-- Three.js CDN -->
    <script src="https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js"><\/script>

    <script>
        // ============================================================
        // SCENE SETUP
        // ============================================================
        const scene = new THREE.Scene();
        scene.background = new THREE.Color(0x87CEEB);
        scene.fog = new THREE.Fog(0x87CEEB, 30, 60);

        const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 100);
        camera.position.set(0, 6, -10);
        camera.lookAt(0, 1, 5);

        const renderer = new THREE.WebGLRenderer({ antialias: true });
        renderer.setSize(window.innerWidth, window.innerHeight);
        renderer.shadowMap.enabled = true;
        renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        document.body.appendChild(renderer.domElement);

        // ============================================================
        // LIGHTING
        // ============================================================
        const ambientLight = new THREE.AmbientLight(0x404060, 0.6);
        scene.add(ambientLight);

        const dirLight = new THREE.DirectionalLight(0xffeedd, 1.2);
        dirLight.position.set(10, 20, 10);
        dirLight.castShadow = true;
        dirLight.shadow.mapSize.width = 1024;
        dirLight.shadow.mapSize.height = 1024;
        scene.add(dirLight);

        const fillLight = new THREE.DirectionalLight(0x4488ff, 0.4);
        fillLight.position.set(-10, 5, -10);
        scene.add(fillLight);

        // ============================================================
        // GROUND / ROAD
        // ============================================================
        const groundGeo = new THREE.PlaneGeometry(30, 200);
        const groundMat = new THREE.MeshStandardMaterial({ 
            color: 0x2a2a2a,
            roughness: 0.8,
            metalness: 0.2
        });
        const ground = new THREE.Mesh(groundGeo, groundMat);
        ground.rotation.x = -Math.PI / 2;
        ground.position.set(0, -0.1, 50);
        ground.receiveShadow = true;
        scene.add(ground);

        // Lane markings
        const laneMat = new THREE.MeshStandardMaterial({ color: 0xffffff, emissive: 0x444444 });
        for (let z = -10; z < 110; z += 4) {
            for (let x = -1; x <= 1; x += 2) {
                const mark = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.05, 1.5), laneMat);
                mark.position.set(x * 2, 0.01, z);
                scene.add(mark);
            }
        }

        // Lane divider lines
        const dividerMat = new THREE.MeshStandardMaterial({ color: 0xffff00, emissive: 0x332200 });
        for (let z = -10; z < 110; z += 3) {
            const div = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.05, 1), dividerMat);
            div.position.set(-1, 0.01, z);
            scene.add(div);
            const div2 = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.05, 1), dividerMat);
            div2.position.set(1, 0.01, z);
            scene.add(div2);
        }

        // ============================================================
        // PLAYER (Human Runner)
        // ============================================================
        const playerGroup = new THREE.Group();
        playerGroup.position.set(0, 0.5, 0);

        // Body
        const bodyMat = new THREE.MeshStandardMaterial({ color: 0x3366ff, roughness: 0.3 });
        const body = new THREE.Mesh(new THREE.BoxGeometry(0.8, 1.0, 0.5), bodyMat);
        body.position.y = 0.5;
        body.castShadow = true;
        playerGroup.add(body);

        // Head
        const headMat = new THREE.MeshStandardMaterial({ color: 0xffcc99, roughness: 0.4 });
        const head = new THREE.Mesh(new THREE.SphereGeometry(0.35, 16, 16), headMat);
        head.position.y = 1.3;
        head.castShadow = true;
        playerGroup.add(head);

        // Eyes
        const eyeMat = new THREE.MeshStandardMaterial({ color: 0x000000 });
        const eye1 = new THREE.Mesh(new THREE.SphereGeometry(0.06, 8, 8), eyeMat);
        eye1.position.set(-0.12, 1.4, 0.3);
        playerGroup.add(eye1);
        const eye2 = new THREE.Mesh(new THREE.SphereGeometry(0.06, 8, 8), eyeMat);
        eye2.position.set(0.12, 1.4, 0.3);
        playerGroup.add(eye2);

        // Arms
        const armMat = new THREE.MeshStandardMaterial({ color: 0xffcc99, roughness: 0.4 });
        const leftArm = new THREE.Mesh(new THREE.BoxGeometry(0.15, 0.7, 0.15), armMat);
        leftArm.position.set(-0.6, 0.6, 0);
        leftArm.castShadow = true;
        playerGroup.add(leftArm);

        const rightArm = new THREE.Mesh(new THREE.BoxGeometry(0.15, 0.7, 0.15), armMat);
        rightArm.position.set(0.6, 0.6, 0);
        rightArm.castShadow = true;
        playerGroup.add(rightArm);

        // Legs
        const legMat = new THREE.MeshStandardMaterial({ color: 0x2244aa, roughness: 0.5 });
        const leftLeg = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.6, 0.2), legMat);
        leftLeg.position.set(-0.25, 0.0, 0);
        leftLeg.castShadow = true;
        playerGroup.add(leftLeg);

        const rightLeg = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.6, 0.2), legMat);
        rightLeg.position.set(0.25, 0.0, 0);
        rightLeg.castShadow = true;
        playerGroup.add(rightLeg);

        scene.add(playerGroup);

        // ============================================================
        // GAME STATE
        // ============================================================
        let gameState = 'start';
        let score = 0;
        let coinsCollected = 0;
        let currentLane = 1;
        let targetX = 0;
        let playerVelocityY = 0;
        let isJumping = false;
        let gameSpeed = 12;
        let maxSpeed = 30;
        let speedIncrement = 0.005;

        const gravity = -25;
        const jumpForce = 9;
        const groundY = 0.5;

        let obstacles = [];
        let coins = [];
        let spawnTimer = 0;
        let coinSpawnTimer = 0;

        const keys = { left: false, right: false, space: false };

        // ============================================================
        // INPUT HANDLING
        // ============================================================
        document.addEventListener('keydown', (e) => {
            if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') {
                keys.left = true;
                if (gameState === 'playing') {
                    currentLane = Math.max(0, currentLane - 1);
                }
            }
            if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') {
                keys.right = true;
                if (gameState === 'playing') {
                    currentLane = Math.min(2, currentLane + 1);
                }
            }
            if (e.key === ' ' || e.key === 'Space') {
                e.preventDefault();
                if (gameState === 'playing' && !isJumping) {
                    playerVelocityY = jumpForce;
                    isJumping = true;
                }
            }
        });

        document.addEventListener('keyup', (e) => {
            if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') keys.left = false;
            if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') keys.right = false;
        });

        // ============================================================
        // SPAWN FUNCTIONS
        // ============================================================
        function spawnObstacle() {
            const lane = Math.floor(Math.random() * 3);
            const xPos = (lane - 1) * 2;
            
            const type = Math.floor(Math.random() * 3);
            let obstacle;
            
            if (type === 0) {
                const mat = new THREE.MeshStandardMaterial({ color: 0xff4444, roughness: 0.6 });
                obstacle = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.8, 0.8), mat);
                obstacle.position.set(xPos, 0.4, 80);
            } else if (type === 1) {
                const mat = new THREE.MeshStandardMaterial({ color: 0xff8800, roughness: 0.5 });
                obstacle = new THREE.Mesh(new THREE.BoxGeometry(0.7, 1.5, 0.7), mat);
                obstacle.position.set(xPos, 0.75, 80);
            } else {
                const group = new THREE.Group();
                const mat1 = new THREE.MeshStandardMaterial({ color: 0x44ff44, roughness: 0.5 });
                const mat2 = new THREE.MeshStandardMaterial({ color: 0x44aaff, roughness: 0.5 });
                const box1 = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.5, 0.8), mat1);
                box1.position.y = 0.25;
                group.add(box1);
                const box2 = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.5, 0.6), mat2);
                box2.position.y = 0.75;
                group.add(box2);
                group.position.set(xPos, 0, 80);
                obstacle = group;
            }
            
            obstacle.userData = { lane: lane, active: true };
            scene.add(obstacle);
            obstacles.push(obstacle);
        }

        function spawnCoin() {
            const lane = Math.floor(Math.random() * 3);
            const xPos = (lane - 1) * 2;
            
            const coinMat = new THREE.MeshStandardMaterial({ 
                color: 0xffd700, 
                emissive: 0xaa8800,
                emissiveIntensity: 0.3,
                metalness: 0.8,
                roughness: 0.2
            });
            const coin = new THREE.Mesh(new THREE.TorusGeometry(0.3, 0.1, 12, 20), coinMat);
            coin.position.set(xPos, 0.8, 80);
            coin.rotation.x = Math.PI / 2;
            coin.userData = { lane: lane, active: true, spin: 0 };
            scene.add(coin);
            coins.push(coin);
        }

        // ============================================================
        // GAME FUNCTIONS
        // ============================================================
        function startGame() {
            document.getElementById('start-screen').style.display = 'none';
            gameState = 'playing';
        }

        function gameOver() {
            gameState = 'gameover';
            document.getElementById('final-score').textContent = score;
            document.getElementById('game-over').style.display = 'block';
        }

        function restartGame() {
            // Remove all obstacles and coins
            obstacles.forEach(obs => scene.remove(obs));
            coins.forEach(coin => scene.remove(coin));
            obstacles = [];
            coins = [];
            
            // Reset player
            playerGroup.position.set(0, 0.5, 0);
            currentLane = 1;
            targetX = 0;
            playerVelocityY = 0;
            isJumping = false;
            
            // Reset game state
            score = 0;
            coinsCollected = 0;
            gameSpeed = 12;
            spawnTimer = 0;
            coinSpawnTimer = 0;
            
            document.getElementById('score').textContent = '0';
            document.getElementById('coins').textContent = '0';
            document.getElementById('game-over').style.display = 'none';
            
            gameState = 'playing';
        }

        // ============================================================
        // COLLISION DETECTION
        // ============================================================
        function checkCollision(playerPos, objPos, threshold) {
            const dx = playerPos.x - objPos.x;
            const dz = playerPos.z - objPos.z;
            return Math.abs(dx) < threshold && Math.abs(dz) < threshold;
        }

        // ============================================================
        // GAME LOOP
        // ============================================================
        function animate() {
            requestAnimationFrame(animate);

            if (gameState === 'playing') {
                // Update speed
                gameSpeed = Math.min(maxSpeed, gameSpeed + speedIncrement);
                
                // Player lane movement
                targetX = (currentLane - 1) * 2;
                playerGroup.position.x += (targetX - playerGroup.position.x) * 0.1;
                
                // Jump physics
                if (isJumping) {
                    playerVelocityY += gravity * 0.016;
                    playerGroup.position.y += playerVelocityY * 0.016;
                    
                    if (playerGroup.position.y <= groundY) {
                        playerGroup.position.y = groundY;
                        playerVelocityY = 0;
                        isJumping = false;
                    }
                }
                
                // Running animation
                const time = Date.now() * 0.01;
                const armSwing = Math.sin(time * 2) * 0.3;
                const legSwing = Math.sin(time * 2) * 0.3;
                
                playerGroup.children.forEach(child => {
                    if (child === leftArm) child.rotation.x = armSwing;
                    if (child === rightArm) child.rotation.x = -armSwing;
                    if (child === leftLeg) child.rotation.x = -legSwing;
                    if (child === rightLeg) child.rotation.x = legSwing;
                });
                
                // Spawn obstacles
                spawnTimer += 0.016;
                if (spawnTimer > 2.0 / (gameSpeed / 10)) {
                    spawnObstacle();
                    spawnTimer = 0;
                }
                
                // Spawn coins
                coinSpawnTimer += 0.016;
                if (coinSpawnTimer > 1.5 / (gameSpeed / 10)) {
                    spawnCoin();
                    coinSpawnTimer = 0;
                }
                
                // Move obstacles and coins toward player
                const playerZ = playerGroup.position.z;
                
                for (let i = obstacles.length - 1; i >= 0; i--) {
                    const obs = obstacles[i];
                    obs.position.z -= gameSpeed * 0.016;
                    
                    // Check collision with player
                    if (checkCollision(playerGroup.position, obs.position, 1.2)) {
                        if (!isJumping || playerGroup.position.y < 1.0) {
                            gameOver();
                        }
                    }
                    
                    // Remove if behind player
                    if (obs.position.z < playerZ - 10) {
                        scene.remove(obs);
                        obstacles.splice(i, 1);
                    }
                }
                
                for (let i = coins.length - 1; i >= 0; i--) {
                    const coin = coins[i];
                    coin.position.z -= gameSpeed * 0.016;
                    coin.rotation.z += 0.05;
                    
                    // Check collection
                    if (checkCollision(playerGroup.position, coin.position, 1.0)) {
                        scene.remove(coin);
                        coins.splice(i, 1);
                        coinsCollected++;
                        score += 10;
                        document.getElementById('score').textContent = score;
                        document.getElementById('coins').textContent = coinsCollected;
                        continue;
                    }
                    
                    // Remove if behind player
                    if (coin.position.z < playerZ - 10) {
                        scene.remove(coin);
                        coins.splice(i, 1);
                    }
                }
                
                // Update score over time
                score += 0.1;
                document.getElementById('score').textContent = Math.floor(score);
            }

            // Camera follows player
            camera.position.x = playerGroup.position.x * 0.3;
            camera.lookAt(playerGroup.position.x * 0.5, 1, playerGroup.position.z + 5);

            renderer.render(scene, camera);
        }

        // ============================================================
        // WINDOW RESIZE
        // ============================================================
        window.addEventListener('resize', () => {
            camera.aspect = window.innerWidth / window.innerHeight;
            camera.updateProjectionMatrix();
            renderer.setSize(window.innerWidth, window.innerHeight);
        });

        // ============================================================
        // START
        // ============================================================
        animate();
    <\/script>
</body>
</html>",
  "css": "",
  "js": ""
}