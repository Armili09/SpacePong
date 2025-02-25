class Game {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');

        // Set initial canvas size
        this.canvas.width = Math.min(800, window.innerWidth - 20);
        this.canvas.height = this.canvas.width * 0.6;

        // Game objects - initialize after canvas size is set
        this.paddle1 = { 
            x: 30, 
            y: this.canvas.height/2, 
            width: 10, 
            height: 100, 
            speed: 0 
        };
        this.paddle2 = { 
            x: this.canvas.width - 30, 
            y: this.canvas.height/2, 
            width: 10, 
            height: 100, 
            speed: 0 
        };
        this.ball = { 
            x: this.canvas.width/2, 
            y: this.canvas.height/2, 
            size: 10, 
            speedX: 5, 
            speedY: 5 
        };

        // Systems
        this.particles = new ParticleSystem(this.canvas, this.ctx);
        this.starfield = new Starfield(this.canvas, this.ctx);

        // Game state
        this.score = { player1: 0, player2: 0 };
        this.winningScore = 5;
        this.isPaused = false;

        // Sound setup
        this.setupSound();

        // Input handling
        this.keys = {};
        this.lastPausePress = 0;
        window.addEventListener('keydown', e => {
            this.keys[e.key] = true;
            if (e.key === 'p' || e.key === 'P') {
                // Add debounce to prevent multiple toggles
                const now = Date.now();
                if (now - this.lastPausePress > 200) {
                    this.isPaused = !this.isPaused;
                    this.lastPausePress = now;
                }
            }
        });
        window.addEventListener('keyup', e => this.keys[e.key] = false);
        window.addEventListener('resize', () => this.resize());

        // Start game loop
        this.lastTime = 0;
        this.accumulator = 0;
        this.timestep = 1000/60;
        requestAnimationFrame(time => this.gameLoop(time));
    }

    setupSound() {
        this.synth = new Tone.Synth().toDestination();
        this.synth.volume.value = -10;
    }

    resize() {
        this.canvas.width = Math.min(800, window.innerWidth - 20);
        this.canvas.height = this.canvas.width * 0.6;
        // Update paddle positions after resize
        this.paddle2.x = this.canvas.width - 30;
        this.paddle1.x = 30;
    }

    update() {
        if (this.isPaused) return;

        // Paddle movement
        if (this.keys['w']) this.paddle1.speed = -8;
        else if (this.keys['s']) this.paddle1.speed = 8;
        else this.paddle1.speed = 0;

        if (this.keys['ArrowUp']) this.paddle2.speed = -8;
        else if (this.keys['ArrowDown']) this.paddle2.speed = 8;
        else this.paddle2.speed = 0;

        // Update paddle positions
        this.paddle1.y += this.paddle1.speed;
        this.paddle2.y += this.paddle2.speed;

        // Constrain paddles
        this.paddle1.y = Math.max(this.paddle1.height/2, Math.min(this.canvas.height - this.paddle1.height/2, this.paddle1.y));
        this.paddle2.y = Math.max(this.paddle2.height/2, Math.min(this.canvas.height - this.paddle2.height/2, this.paddle2.y));

        // Ball movement
        this.ball.x += this.ball.speedX;
        this.ball.y += this.ball.speedY;

        // Ball collision with top and bottom
        if (this.ball.y <= this.ball.size || this.ball.y >= this.canvas.height - this.ball.size) {
            this.ball.speedY *= -1;
            this.synth.triggerAttackRelease('C4', '32n');
            this.particles.createParticles(this.ball.x, this.ball.y, '0, 255, 255', 10);
        }

        // Ball collision with paddles
        if (this.checkPaddleCollision(this.paddle1) || this.checkPaddleCollision(this.paddle2)) {
            this.ball.speedX *= -1.1; // Increase speed slightly
            this.synth.triggerAttackRelease('E4', '32n');
            this.particles.createParticles(this.ball.x, this.ball.y, '0, 255, 255', 20);
        }

        // Score points
        if (this.ball.x < 0) {
            this.score.player2++;
            this.resetBall();
        } else if (this.ball.x > this.canvas.width) {
            this.score.player1++;
            this.resetBall();
        }

        // Check for winner
        if (this.score.player1 >= this.winningScore || this.score.player2 >= this.winningScore) {
            document.getElementById('winMessage').classList.remove('hidden');
        }

        // Update particles and starfield
        this.particles.update();
        this.starfield.update();
    }

    checkPaddleCollision(paddle) {
        return this.ball.x + this.ball.size > paddle.x - paddle.width/2 && 
               this.ball.x - this.ball.size < paddle.x + paddle.width/2 &&
               this.ball.y + this.ball.size > paddle.y - paddle.height/2 &&
               this.ball.y - this.ball.size < paddle.y + paddle.height/2;
    }

    resetBall() {
        this.ball.x = this.canvas.width/2;
        this.ball.y = this.canvas.height/2;
        this.ball.speedX = (Math.random() > 0.5 ? 5 : -5);
        this.ball.speedY = (Math.random() * 6) - 3;
        document.getElementById('player1Score').textContent = this.score.player1;
        document.getElementById('player2Score').textContent = this.score.player2;
    }

    draw() {
        // Clear canvas
        this.ctx.fillStyle = '#000';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        // Draw starfield
        this.starfield.draw();

        // Draw center line
        this.ctx.setLineDash([5, 15]);
        this.ctx.beginPath();
        this.ctx.moveTo(this.canvas.width/2, 0);
        this.ctx.lineTo(this.canvas.width/2, this.canvas.height);
        this.ctx.strokeStyle = 'rgba(0, 255, 255, 0.2)';
        this.ctx.stroke();
        this.ctx.setLineDash([]);

        // Draw game objects
        this.ctx.fillStyle = '#0ff';
        this.ctx.shadowBlur = 10;
        this.ctx.shadowColor = '#0ff';


        this.ctx.fillRect(
            this.paddle1.x - this.paddle1.width/2,
            this.paddle1.y - this.paddle1.height/2,
            this.paddle1.width,
            this.paddle1.height
        );

        this.ctx.fillRect(
            this.paddle2.x - this.paddle2.width/2,
            this.paddle2.y - this.paddle2.height/2,
            this.paddle2.width,
            this.paddle2.height
        );

        // Draw ball
        this.ctx.beginPath();
        this.ctx.arc(this.ball.x, this.ball.y, this.ball.size, 0, Math.PI * 2);
        this.ctx.fill();

        // Draw particles
        this.particles.draw();

        // Draw pause message if game is paused
        if (this.isPaused) {
            this.ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
            this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

            this.ctx.font = '48px Orbitron';
            this.ctx.fillStyle = '#0ff';
            this.ctx.textAlign = 'center';
            this.ctx.fillText('PAUSED', this.canvas.width/2, this.canvas.height/2);

            this.ctx.font = '24px Orbitron';
            this.ctx.fillText('Press P to resume', this.canvas.width/2, this.canvas.height/2 + 40);
        }

        this.ctx.shadowBlur = 0;
    }

    gameLoop(currentTime) {
        if (!this.lastTime) this.lastTime = currentTime;
        let deltaTime = currentTime - this.lastTime;
        this.lastTime = currentTime;

        this.accumulator += deltaTime;

        while (this.accumulator >= this.timestep) {
            this.update();
            this.accumulator -= this.timestep;
        }

        this.draw();
        requestAnimationFrame(time => this.gameLoop(time));
    }
}

function resetGame() {
    document.getElementById('winMessage').classList.add('hidden');
    game = new Game();
}

let game = new Game();