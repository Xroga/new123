on
{
  "html": "<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0, user-scalable=no">
    <title>XROGA Endless Runner</title>
    <style>
        body {
            margin: 0;
            overflow: hidden;
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
        }
        #score {
            position: absolute;
            top: 20px;
            left: 50%;
            transform: translateX(-50%);
            color: white;
            font-size: 32px;
            font-weight: bold;
            text-shadow: 2px 2px 4px rgba(0,0,0,0.5);
            z-index: 10;
            pointer-events: none;
            background: rgba(0,0,0,0.3);
            padding: 8px 24px;
            border-radius: 20px;
            backdrop-filter: blur(4px);
        }
        #gameOver {
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            display: none;
            justify-content: center;
            align-items: center;
            flex-direction: column;
            background: rgba(0,0,0,0.7);
            z-index: 20;
            color: white;
        }
        #gameOver h1 {
            font-size: 64px;
            margin: 0;
            text-shadow: 0 0 20px rgba(255,0,0,0.5);
        }
        #gameOver p {
            font-size: 24px;
            margin-top: 20px;
            opacity: 0.9;
        }
        #restartHint {
            position: absolute;
            bottom: 40px;
            left: 50%;
            transform: translateX(-50%);
            color: rgba(255,255,255,0.6);
            font-size: 18px;
            z-index: 10;
            pointer-events: none;
        }
    </style>
</head>
<body>
    <div id="score">0</div>
    <div id="gameOver">
        <h1>GAME OVER</h1>
        <p>Press R to Restart</p>
    </div>
    <div id="restartHint">← → or swipe to switch lanes</div>

    <script type="importmap">
        {
            "imports": {
                "three": "https://unpkg.com/three@0.160.0/build/three.module.js"
            }
        }
    </script>

    <script type="module">
        import * as THREE from 'three';

        // Setup Scene, Camera, Renderer
        const scene = new THREE.Scene();
        
        // Gradient sky blue background
        const canvas = document.createElement('canvas');
        canvas.width = 2;
        canvas.height = 256;
        const ctx = canvas.getContext('2d');
        const gradient = ctx.createLinearGradient(0, 0, 0, 256);
        gradient.addColorStop(0, '#87CEEB');
        gradient.addColorStop(0.5, '#B0E0E6');
        gradient.addColorStop(1, '#E0F7FA');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, 2, 256);
        const bgTexture = new THREE.CanvasTexture(canvas);
        scene.background = bgTexture;

        const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 100);
        camera.position.set(0, 5, 8);
        camera.lookAt(0, 1, 0);

        const renderer = new THREE.WebGLRenderer({ antialias: true });
        renderer.setSize(window.innerWidth, window.innerHeight);
        renderer.shadowMap.enabled = true;
        renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        document.body.appendChild(renderer.domElement);

        // Lights
        const ambientLight = new THREE.AmbientLight(0x404060, 0.6);
        scene.add(ambientLight);

        const dirLight = new THREE.DirectionalLight(0xffeedd, 1.2);
        dirLight.position.set(5, 12, 8);
        dirLight.castShadow = true;
        dirLight.shadow.mapSize.width = 1024;
        dirLight.shadow.mapSize.height = 1024;
        const d = 15;
        dirLight.shadow.camera.left = -d;
        dirLight.shadow.camera.right = d;
        dirLight.shadow.camera.top = d;
        dirLight.shadow.camera.bottom = -d;
        dirLight.shadow.camera.near = 1;
        dirLight.shadow.camera.far = 25;
        scene.add(dirLight);

        const fillLight = new THREE.DirectionalLight(0x8888ff, 0.3);
        fillLight.position.set(-3, 4, 5);
        scene.add(fillLight);

        // Ground with scrolling grid texture
        const groundCanvas = document.createElement('canvas');
        groundCanvas.width = 256;
        groundCanvas.height = 256;
        const gctx = groundCanvas.getContext('2d');
        
        gctx.fillStyle = '#2a5a3a';
        gctx.fillRect(0, 0, 256, 256);
        
        gctx.strokeStyle = '#4a8a5a';
        gctx.lineWidth = 2;
        const gridSize = 32;
        for (let i = 0; i <= 256; i += gridSize) {
            gctx.beginPath();
            gctx.moveTo(i, 0);
            gctx.lineTo(i, 256);
            gctx.stroke();
            gctx.beginPath();
            gctx.moveTo(0, i);
            gctx.lineTo(256, i);
            gctx.stroke();
        }
        
        gctx.fillStyle = '#6aaa7a';
        for (let x = 0; x <= 256; x += gridSize) {
            for (let y = 0; y <= 256; y += gridSize) {
                gctx.beginPath();
                gctx.arc(x, y, 3, 0, Math.PI * 2);
                gctx.fill();
            }
        }

        const groundTexture = new THREE.CanvasTexture(groundCanvas);
        groundTexture.wrapS = THREE.RepeatWrapping;
        groundTexture.wrapT = THREE.RepeatWrapping;
        groundTexture.repeat.set(8, 20);

        const ground = new THREE.Mesh(
            new THREE.PlaneGeometry(12, 40),
            new THREE.MeshStandardMaterial({ 
                map: groundTexture,
                roughness: 0.8,
                metalness: 0.1
            })
        );
        ground.rotation.x = -Math.PI / 2;
        ground.position.set(0, -0.1, -5);
        ground.receiveShadow = true;
        scene.add(ground);

        // Player Construction
        const playerGroup = new THREE.Group();
        playerGroup.position.set(0, 0.5, 0);

        const headGeo = new THREE.SphereGeometry(0.4, 16, 16);
        const headMat = new THREE.MeshStandardMaterial({ color: 0xffdd44, roughness: 0.3 });
        const head = new THREE.Mesh(headGeo, headMat);
        head.position.y = 1.2;
        head.castShadow = true;
        playerGroup.add(head);

        const torsoGeo = new THREE.BoxGeometry(0.6, 0.8, 0.4);
        const torsoMat = new THREE.MeshStandardMaterial({ color: 0x4488ff, roughness: 0.4 });
        const torso = new THREE.Mesh(torsoGeo, torsoMat);
        torso.position.y = 0.6;
        torso.castShadow = true;
        playerGroup.add(torso);

        const legGeo = new THREE.BoxGeometry(0.2, 0.5, 0.2);
        const legMat = new THREE.MeshStandardMaterial({ color: 0xff4444, roughness: 0.5 });
        const leftLeg = new THREE.Mesh(legGeo, legMat);
        leftLeg.position.set(-0.2, 0.15, 0);
        leftLeg.castShadow = true;
        playerGroup.add(leftLeg);

        const rightLeg = new THREE.Mesh(legGeo.clone(), legMat);
        rightLeg.position.set(0.2, 0.15, 0);
        rightLeg.castShadow = true;
        playerGroup.add(rightLeg);

        const armGeo = new THREE.BoxGeometry(0.15, 0.5, 0.15);
        const armMat = new THREE.MeshStandardMaterial({ color: 0x44aaff, roughness: 0.4 });
        
        const leftArm = new THREE.Mesh(armGeo, armMat);
        leftArm.position.set(-0.5, 0.7, 0);
        leftArm.castShadow = true;
        playerGroup.add(leftArm);

        const rightArm = new THREE.Mesh(armGeo, armMat);
        rightArm.position.set(0.5, 0.7, 0);
        rightArm.castShadow = true;
        playerGroup.add(rightArm);

        scene.add(playerGroup);

        const legs = [leftLeg, rightLeg];

        // Lane switching state
        const LANES = [-2, 0, 2];
        let currentLaneIndex = 1;
        let targetX = 0;
        let currentX = 0;
        const LERP_SPEED = 8;

        // Game state
        let score = 0;
        let gameActive = true;
        let obstacles = [];
        let spawnTimer = 0;
        let nextSpawnTime = 1.0;
        const OBSTACLE_SPEED = 6;
        const SPAWN_Z = -15;
        const DESPAWN_Z = 5;

        // Input handling
        document.addEventListener('keydown', (e) => {
            if (!gameActive && e.key === 'r') {
                resetGame();
                return;
            }
            if (!gameActive) return;
            
            if (e.key === 'ArrowLeft') {
                if (currentLaneIndex > 0) {
                    currentLaneIndex--;
                    targetX = LANES[currentLaneIndex];
                }
            } else if (e.key === 'ArrowRight') {
                if (currentLaneIndex < 2) {
                    currentLaneIndex++;
                    targetX = LANES[currentLaneIndex];
                }
            }
        });

        let touchStartX = 0;
        let touchStartY = 0;
        document.addEventListener('touchstart', (e) => {
            touchStartX = e.touches[0].clientX;
            touchStartY = e.touches[0].clientY;
        }, { passive: true });

        document.addEventListener('touchend', (e) => {
            if (!gameActive) return;
            const touchEndX = e.changedTouches[0].clientX;
            const touchEndY = e.changedTouches[0].clientY;
            const dx = touchEndX - touchStartX;
            const dy = touchEndY - touchStartY;
            
            if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > 30) {
                if (dx < 0 && currentLaneIndex > 0) {
                    currentLaneIndex--;
                    targetX = LANES[currentLaneIndex];
                } else if (dx > 0 && currentLaneIndex < 2) {
                    currentLaneIndex++;
                    targetX = LANES[currentLaneIndex];
                }
            }
        }, { passive: true });

        // Obstacle creation
        function createObstacle() {
            const laneIndex = Math.floor(Math.random() * 3);
            const x = LANES[laneIndex];
            
            const group = new THREE.Group();
            
            const colors = [0xff4444, 0xffaa44, 0x44ff44, 0x4488ff];
            const numBoxes = 3 + Math.floor(Math.random() * 3);
            
            for (let i = 0; i < numBoxes; i++) {
                const boxGeo = new THREE.BoxGeometry(
                    0.7 + Math.random() * 0.3,
                    0.3 + Math.random() * 0.3,
                    0.7 + Math.random() * 0.3
                );
                const boxMat = new THREE.MeshStandardMaterial({ 
                    color: colors[Math.floor(Math.random() * colors.length)],
                    roughness: 0.5,
                    metalness: 0.1
                });
                const box = new THREE.Mesh(boxGeo, boxMat);
                box.position.set(
                    (Math.random() - 0.5) * 0.4,
                    0.3 + i * 0.35 + Math.random() * 0.1,
                    (Math.random() - 0.5) * 0.4
                );
                box.castShadow = true;
                box.receiveShadow = true;
                group.add(box);
            }
            
            group.position.set(x, 0.3, SPAWN_Z);
            scene.add(group);
            
            obstacles.push({
                mesh: group,
                laneIndex: laneIndex,
                x: x,
                width: 0.9,
                height: 1.5,
                depth: 0.9
            });
        }

        // Collision detection
        function checkCollision(playerPos, obstacle) {
            const playerWidth = 0.6;
            const playerHeight = 1.6;
            const playerDepth = 0.4;
            
            const obsPos = obstacle.mesh.position;
            const obsWidth = obstacle.width;
            const obsHeight = obstacle.height;
            const obsDepth = obstacle.depth;
            
            return (
                playerPos.x - playerWidth/2 < obsPos.x + obsWidth/2 &&
                playerPos.x + playerWidth/2 > obsPos.x - obsWidth/2 &&
                playerPos.y - playerHeight/2 < obsPos.y + obsHeight/2 &&
                playerPos.y + playerHeight/2 > obsPos.y - obsHeight/2 &&
                playerPos.z - playerDepth/2 < obsPos.z + obsDepth/2 &&
                playerPos.z + playerDepth/2 > obsPos.z - obsDepth/2
            );
        }

        // Game reset
        function resetGame() {
            obstacles.forEach(obs => {
                scene.remove(obs.mesh);
            });
            obstacles = [];
            
            currentLaneIndex = 1;
            targetX = 0;
            currentX = 0;
            playerGroup.position.x = 0;
            
            score = 0;
            document.getElementById('score').textContent = '0';
            
            gameActive = true;
            spawnTimer = 0;
            nextSpawnTime = 0.5 + Math.random() * 1.5;
            
            document.getElementById('gameOver').style.display = 'none';
        }

        // Animation loop
        const clock = new THREE.Clock();
        let time = 0;

        function animate() {
            const delta = clock.getDelta();
            time += delta;

            if (gameActive) {
                // Update score
                score += delta * 10;
                document.getElementById('score').textContent = Math.floor(score);

                // Smooth lane switching
                currentX += (targetX - currentX) * Math.min(1, LERP_SPEED * delta);
                playerGroup.position.x = currentX;

                // Player bob animation
                const bobY = Math.sin(time * 8) * 0.1;
                playerGroup.position.y = 0.5 + bobY;

                // Leg animation
                const legAngle = Math.sin(time * 8) * 0.4;
                legs[0].rotation.x = legAngle;
                legs[1].rotation.x = -legAngle;

                // Ground texture scrolling
                groundTexture.offset.y += delta * 0.3;

                // Spawn obstacles
                spawnTimer += delta;
                if (spawnTimer >= nextSpawnTime) {
                    createObstacle();
                    spawnTimer = 0;
                    nextSpawnTime = 0.5 + Math.random() * 1.5;
                }

                // Move obstacles and check collisions
                const playerPos = playerGroup.position;
                for (let i = obstacles.length - 1; i >= 0; i--) {
                    const obs = obstacles[i];
                    obs.mesh.position.z += OBSTACLE_SPEED * delta;

                    // Check collision
                    if (checkCollision(playerPos, obs)) {
                        gameActive = false;
                        document.getElementById('gameOver').style.display = 'flex';
                        break;
                    }

                    // Remove if passed behind camera
                    if (obs.mesh.position.z > DESPAWN_Z) {
                        scene.remove(obs.mesh);
                        obstacles.splice(i, 1);
                    }
                }
            }

            renderer.render(scene, camera);
            requestAnimationFrame(animate);
        }

        animate();

        // Handle window resize
        window.addEventListener('resize', () => {
            camera.aspect = window.innerWidth / window.innerHeight;
            camera.updateProjectionMatrix();
            renderer.setSize(window.innerWidth, window.innerHeight);
        });
    </script>
</body>
</html>",
  "css": "",
  "js": ""
}