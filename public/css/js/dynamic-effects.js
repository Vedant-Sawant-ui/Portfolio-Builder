function initThemeEffect(themeName) {
    console.log("Initializing effect for:", themeName);
    
    // 1. Cleanup existing canvases
    const existingCanvas = document.getElementById('effect-canvas');
    if(existingCanvas) existingCanvas.remove();

    // 2. Route to the correct effect
    if (themeName === 'dynamic_codeverse') {
        createStarfield();
    } else if (themeName === 'dynamic_terminal') {
        createMatrixRain();
    } else if (themeName === 'dynamic_neural') {
        createNeuralNetwork();
    } 
    // Note: 'dynamic_liquid' and 'dynamic_cybergrid' are handled purely by CSS 
    // in master-themes.css for better performance.
}

// --- EFFECT 1: STARFIELD (Codeverse) ---
function createStarfield() {
    const canvas = createCanvas();
    const ctx = canvas.getContext('2d');
    let width = canvas.width = window.innerWidth;
    let height = canvas.height = window.innerHeight;

    const stars = Array(200).fill().map(() => ({
        x: Math.random() * width,
        y: Math.random() * height,
        size: Math.random() * 2,
        speed: Math.random() * 0.5
    }));

    function animate() {
        ctx.clearRect(0, 0, width, height);
        ctx.fillStyle = 'white';
        stars.forEach(star => {
            star.y += star.speed;
            if(star.y > height) star.y = 0;
            ctx.beginPath();
            ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
            ctx.fill();
        });
        requestAnimationFrame(animate);
    }
    animate();
}

// --- EFFECT 2: MATRIX RAIN (Terminal) ---
function createMatrixRain() {
    const canvas = createCanvas();
    canvas.style.opacity = '0.15';
    const ctx = canvas.getContext('2d');
    let width = canvas.width = window.innerWidth;
    let height = canvas.height = window.innerHeight;

    const cols = Math.floor(width / 20);
    const ypos = Array(cols).fill(0);

    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, width, height);

    function matrix() {
        ctx.fillStyle = '#0001';
        ctx.fillRect(0, 0, width, height);
        ctx.fillStyle = '#0f0';
        ctx.font = '15pt monospace';

        ypos.forEach((y, ind) => {
            const text = String.fromCharCode(Math.random() * 128);
            const x = ind * 20;
            ctx.fillText(text, x, y);
            if (y > 100 + Math.random() * 10000) ypos[ind] = 0;
            else ypos[ind] = y + 20;
        });
        requestAnimationFrame(matrix);
    }
    matrix();
}

// --- EFFECT 3: NEURAL NETWORK (Neural Nexus) ---
function createNeuralNetwork() {
    const canvas = createCanvas();
    canvas.style.opacity = '0.3';
    const ctx = canvas.getContext('2d');
    let width = canvas.width = window.innerWidth;
    let height = canvas.height = window.innerHeight;

    // Create particles
    const particles = Array(80).fill().map(() => ({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * 2,
        vy: (Math.random() - 0.5) * 2
    }));

    function animate() {
        ctx.clearRect(0, 0, width, height);
        
        // Update and draw particles
        ctx.fillStyle = '#00e5ff';
        ctx.strokeStyle = '#00e5ff';
        
        particles.forEach((p, i) => {
            p.x += p.vx;
            p.y += p.vy;

            // Bounce off walls
            if(p.x < 0 || p.x > width) p.vx *= -1;
            if(p.y < 0 || p.y > height) p.vy *= -1;

            ctx.beginPath();
            ctx.arc(p.x, p.y, 2, 0, Math.PI * 2);
            ctx.fill();

            // Connect nearby particles
            particles.slice(i + 1).forEach(p2 => {
                const dx = p.x - p2.x;
                const dy = p.y - p2.y;
                const dist = Math.sqrt(dx*dx + dy*dy);
                if(dist < 150) {
                    ctx.beginPath();
                    ctx.moveTo(p.x, p.y);
                    ctx.lineTo(p2.x, p2.y);
                    ctx.globalAlpha = 1 - (dist / 150);
                    ctx.stroke();
                    ctx.globalAlpha = 1;
                }
            });
        });
        requestAnimationFrame(animate);
    }
    animate();
}

// Helper to create the canvas element
function createCanvas() {
    const canvas = document.createElement('canvas');
    canvas.id = 'effect-canvas';
    canvas.style.position = 'fixed';
    canvas.style.top = '0';
    canvas.style.left = '0';
    canvas.style.width = '100%';
    canvas.style.height = '100%';
    canvas.style.zIndex = '0'; // Behind content
    canvas.style.pointerEvents = 'none';
    document.body.prepend(canvas);
    return canvas;
}