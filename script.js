

gsap.registerPlugin(ScrollTrigger, TextPlugin);
document.body.style.overflow = 'auto';

// ==============================================
// CLASSE DE EFEITO DE TEXTO LÍQUIDO MAGNÉTICO
// ==============================================
class FluidTextEffect {
    constructor(text) {
        this.canvas = document.getElementById('fluid-canvas');
        this.ctx = this.canvas.getContext('2d', { willReadFrequently: true }); 
        this.text = text;
        this.particles = [];
        this.mouse = { x: 0, y: 0, radius: 100 };
        this.width = window.innerWidth;
        this.height = window.innerHeight;
        this.isAnimating = false; 
        
        this.gap = 5; 
        this.particleSize = 1.5;
        this.physics = {
            friction: 0.9,    
            ease: 0.15,       
            repulsion: 4000   
        };

        this.init();
    }

    init() {
        this.resize();
        if (this.width > 0 && this.height > 0) {
            this.createParticles();
            this.typewriteEffect();
        }
        
        window.addEventListener('resize', () => {
            this.resize();
            if (this.width > 0 && this.height > 0) {
                this.createParticles();
                this.particles.forEach(p => p.targetAlpha = 1); 
            }
        });
        
        window.addEventListener('mousemove', (e) => {
            this.mouse.x = e.x;
            this.mouse.y = e.y;
        });

        window.addEventListener('touchmove', (e) => {
            if(e.touches.length > 0) {
                this.mouse.x = e.touches[0].clientX;
                this.mouse.y = e.touches[0].clientY;
            }
        });

        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                const wasAnimating = this.isAnimating;
                this.isAnimating = entry.isIntersecting;
                if(!wasAnimating && this.isAnimating) {
                        this.animate();
                }
            });
        }, { threshold: 0 });
        
        const introSection = document.getElementById('intro');
        if(introSection) observer.observe(introSection);
    }

    resize() {
        this.width = window.innerWidth;
        this.height = window.innerHeight;
        if (this.width === 0) this.width = 1;
        if (this.height === 0) this.height = 1;
        
        this.canvas.width = this.width;
        this.canvas.height = this.height;
    }

    createParticles() {
        if (this.width <= 0 || this.height <= 0) return;

        this.particles = [];
        
        const fontSize = this.width < 768 ? Math.floor(this.width * 0.2) : Math.floor(this.width * 0.18);
        
        this.ctx.font = `900 ${fontSize}px "Playfair Display", serif`;
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';
        
        this.ctx.fillStyle = 'white';
        this.ctx.fillText(this.text, this.width / 2, this.height / 2);

        try {
            const imageData = this.ctx.getImageData(0, 0, this.width, this.height);
            const data = imageData.data;

            for (let y = 0; y < this.height; y += this.gap) {
                for (let x = 0; x < this.width; x += this.gap) {
                    const index = (y * this.width + x) * 4;
                    const alpha = data[index + 3];
                    
                    if (alpha > 128) {
                        this.particles.push(new Particle(this, x, y));
                    }
                }
            }
        } catch (e) {
            console.error("Erro ao ler dados do canvas:", e);
        }
    }

    typewriteEffect() {
        this.particles.sort((a, b) => a.originX - b.originX);
        const totalParticles = this.particles.length;
        const textLength = this.text.length; 
        const particlesPerLetter = Math.floor(totalParticles / textLength);
        
        for (let i = 0; i < textLength; i++) {
            setTimeout(() => {
                const start = i * particlesPerLetter;
                const end = (i === textLength - 1) ? totalParticles : (i + 1) * particlesPerLetter;
                for (let j = start; j < end; j++) {
                    if (this.particles[j]) {
                        this.particles[j].targetAlpha = 1;
                    }
                }
            }, i * 300); 
        }
    }

    animate() {
        if(!this.isAnimating) return; 

        this.ctx.clearRect(0, 0, this.width, this.height);
        
        this.particles.forEach(particle => {
            particle.update();
            particle.draw();
        });

        requestAnimationFrame(() => this.animate());
    }
}

class Particle {
    constructor(effect, x, y) {
        this.effect = effect;
        this.x = x; 
        this.y = y;
        this.originX = x;
        this.originY = y;
        this.vx = 0;
        this.vy = 0;
        this.size = effect.particleSize;
        this.color = Math.random() > 0.98 ? '#D4AF37' : '#FFFFFF'; 
        this.currentAlpha = 0; 
        this.targetAlpha = 0;  
        this.angle = Math.random() * Math.PI * 2;
    }

    update() {
        if (this.currentAlpha < this.targetAlpha) {
            this.currentAlpha += 0.05;
            if(this.currentAlpha > 1) this.currentAlpha = 1;
        }

        if (this.currentAlpha < 0.01) return;

        const dx = this.effect.mouse.x - this.x;
        const dy = this.effect.mouse.y - this.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        const force = -this.effect.physics.repulsion / (distance * distance);
        const maxDistance = this.effect.mouse.radius;
        
        let forceDirectionX = dx / distance;
        let forceDirectionY = dy / distance;

        if (distance < maxDistance) {
            this.vx += forceDirectionX * force;
            this.vy += forceDirectionY * force;
        }

        const wave = Math.sin(Date.now() * 0.002 + this.originY * 0.01) * 2; 
        const homeX = this.originX;
        const homeY = this.originY + wave; 

        this.vx += (homeX - this.x) * this.effect.physics.ease;
        this.vy += (homeY - this.y) * this.effect.physics.ease;

        this.vx *= this.effect.physics.friction;
        this.vy *= this.effect.physics.friction;

        this.x += this.vx;
        this.y += this.vy;
    }

    draw() {
        if (this.currentAlpha < 0.01) return;
        this.effect.ctx.save();
        this.effect.ctx.globalAlpha = this.currentAlpha;
        this.effect.ctx.fillStyle = this.color;
        this.effect.ctx.fillRect(this.x, this.y, this.size, this.size);
        this.effect.ctx.restore();
    }
}

document.fonts.ready.then(function () {
    const effect = new FluidTextEffect('UBERABA');
    setTimeout(() => {
        const hint = document.querySelector('.scroll-hint');
        if(hint) hint.style.opacity = '1';
    }, 2000);
});

// --- PARTÍCULAS ---
const introParticles = document.getElementById('intro-particles');
function createParticles() {
    if(!introParticles) return;
    const particleCount = 30;
    for (let i = 0; i < particleCount; i++) {
        const particle = document.createElement('div');
        particle.classList.add('particle');
        const size = Math.random() * 4 + 2;
        particle.style.width = `${size}px`;
        particle.style.height = `${size}px`;
        particle.style.left = `${Math.random() * 100}%`;
        particle.style.top = `${Math.random() * 100}%`;
        particle.style.animationDuration = `${Math.random() * 10 + 10}s`;
        particle.style.animationDelay = `${Math.random() * 5}s`;
        introParticles.appendChild(particle);
    }
}
createParticles();

// --- LENIS SCROLL ---
const lenis = new Lenis({ duration: 1.2, easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)), smooth: true });
lenis.on('scroll', ScrollTrigger.update);
gsap.ticker.add((time) => lenis.raf(time * 1000));
gsap.ticker.lagSmoothing(0);

// --- HISTORY ---
const historyCards = gsap.utils.toArray(".history-card");
const scrollTween = gsap.to(historyCards, {
    xPercent: -100 * (historyCards.length - 1), ease: "none",
    scrollTrigger: { trigger: "#history", pin: true, scrub: 1, end: "+=6000", 
    onUpdate: (self) => {
        const progress = self.progress;
        const activeIndex = Math.round(progress * (historyCards.length - 1));
        historyCards.forEach((card, i) => { if(i === activeIndex) card.classList.add('active'); else card.classList.remove('active'); });
    }}
});
historyCards.forEach(card => {
    gsap.from(card.querySelector('.history-content'), {
        y: 100, opacity: 0, duration: 1,
        scrollTrigger: { trigger: card, containerAnimation: scrollTween, start: "left center", toggleActions: "play none none reverse" }
    });
});

// --- STATS ---
function initStatsAnimations() {
    const countElements = document.querySelectorAll('.count-up');
    const densityGrid = document.getElementById('density-grid');
    if(densityGrid) {
        for(let i = 0; i < 100; i++) { let cell = document.createElement('div'); cell.classList.add('density-cell'); densityGrid.appendChild(cell); }
        ScrollTrigger.create({
            trigger: "#stats", start: "top 60%",
            onEnter: () => {
                countElements.forEach(el => {
                    const targetValue = parseFloat(el.getAttribute('data-value'));
                    const isFloat = el.getAttribute('data-format') === 'float';
                    let obj = { val: 0 };
                    gsap.to(obj, { val: targetValue, duration: 2.5, ease: "power3.out", onUpdate: () => { el.innerText = isFloat ? obj.val.toFixed(2).replace('.', ',') : Math.floor(obj.val).toLocaleString('pt-BR'); }});
                });
                const cells = Array.from(document.querySelectorAll('.density-cell'));
                const shuffled = cells.sort(() => 0.5 - Math.random());
                gsap.to(shuffled.slice(0, 75), { backgroundColor: "#fff", opacity: 1, scale: 1, duration: 0.8, stagger: { amount: 1, from: "random" }, ease: "back.out(1.7)" });
            }
        });
    }
}
initStatsAnimations();

// --- DINO ---
const dinoTitle = document.querySelector('.dino-title');
const dinoHero = document.querySelector('#dino-hero');
if(dinoHero && dinoTitle) {
    gsap.to(dinoTitle, { scale: 1.05, repeat: -1, yoyo: true, duration: 4, ease: "sine.inOut" });
    dinoHero.addEventListener('mousemove', (e) => {
        const xPos = (e.clientX / window.innerWidth - 0.5) * 30;
        const yPos = (e.clientY / window.innerHeight - 0.5) * 30;
        gsap.to(dinoTitle, { x: -xPos, y: -yPos, duration: 1, ease: "power2.out" });
    });
    gsap.to(dinoTitle, { scale: 5, opacity: 0, ease: "power2.in", scrollTrigger: { trigger: "#dino-hero", start: "top top", end: "bottom top", scrub: 1 } });
}
document.querySelectorAll('.reveal-up').forEach(el => {
    gsap.from(el, { y: 100, opacity: 0, duration: 1.2, ease: "power3.out", scrollTrigger: { trigger: el, start: "top 85%", toggleActions: "play none none reverse" } });
});

// --- MUSEU CARROSSEL (Faster, Infinite Loop, No Pause) ---
const track = document.querySelector('.gallery-track');
if(track) {
    const itemsToClone = track.innerHTML;
    // Clonando mais vezes para garantir um loop suave em telas muito largas
    track.innerHTML += itemsToClone + itemsToClone + itemsToClone; 
    
    // Velocidade reduzida (Duration maior = mais devagar)
    // Ease linear para loop constante
    gsap.to(track, { 
        xPercent: -50, 
        ease: "none", 
        duration: 45, // Aumentado para ficar mais devagar conforme solicitado
        repeat: -1 
    });
    
    // Removemos o evento de pause ao passar o mouse, conforme solicitado
}

// --- ZEBU HERO ---
const zebuHero = document.querySelector('#zebu-hero');
if(zebuHero) {
    const tlGold = gsap.timeline({ scrollTrigger: { trigger: "#zebu-hero", start: "top bottom", end: "center center", scrub: 1 } });
    tlGold.to(".zebu-gold-title", { backgroundSize: "100% 100%", ease: "none", duration: 2 })
    .to(".zebu-bg-img", { filter: "brightness(1)", scale: 1, duration: 2, ease: "power2.out" }, "<");

    const subtitleEl = document.querySelector('.zebu-subtitle');
    const text = subtitleEl.textContent;
    subtitleEl.textContent = '';
    subtitleEl.style.opacity = 1;
    text.split('').forEach(char => {
        const span = document.createElement('span');
        span.textContent = char;
        span.className = 'letter-span';
        subtitleEl.appendChild(span);
    });

    ScrollTrigger.create({
        trigger: "#zebu-hero", start: "center center",
        onEnter: () => {
            gsap.to(".letter-span", { opacity: 1, duration: 0.05, stagger: 0.03, ease: "none" });
        }
    });
}

// --- ABCZ SECTION (UPDATED - Logic for image/video hover removed) ---
const abczSection = document.querySelector('#abcz-history');
if(abczSection) {
    // Just text animation since video is always playing
    gsap.from(".abcz-content", { 
        y: 50, 
        opacity: 0, 
        duration: 1.2, 
        ease: "power3.out",
        scrollTrigger: { trigger: "#abcz-history", start: "top 70%", toggleActions: "play none none reverse" } 
    });
          
    // Typewriter Effect
    gsap.to("#abcz-typewriter", {
        text: "Uma história de inovação que começou no coração do Brasil.",
        duration: 3,
        ease: "none",
        scrollTrigger: {
            trigger: "#abcz-typewriter",
            start: "top 80%",
            toggleActions: "play none none reverse"
        }
    });
}

// --- ELITE GENETICS (UPDATED for Hologram Effect) ---
const eliteSection = document.querySelector('#elite-genetics');
if(eliteSection) {
    // Entrance Animation for Cards
    gsap.from(".elite-card", {
        y: 100, opacity: 0, rotationX: 45, stagger: 0.2, duration: 1.5, ease: "power4.out",
        scrollTrigger: { trigger: "#elite-genetics", start: "top 60%", toggleActions: "play none none reverse" }
    });

    const cards = document.querySelectorAll('.elite-card');
    cards.forEach(card => {
        // 3D Tilt Logic REMOVED here to allow CSS to handle the "Hologram Platform" flatten effect.
        // The CSS handles the rotation and translation on hover now.
        
        // Video Background Logic (Kept intact)
        card.addEventListener('mouseenter', () => {
            const videoId = card.getAttribute('data-video');
            const targetVideo = document.getElementById(videoId);
            if (targetVideo) {
                // Hide all videos first
                document.querySelectorAll('.elite-bg-video').forEach(vid => vid.style.opacity = 0);
                
                // Show target video
                targetVideo.style.opacity = 1;
                targetVideo.play().catch(e => console.log('Autoplay block or error', e));
            }
        });

        card.addEventListener('mouseleave', () => {
            // Hide all videos to return to default pattern
            document.querySelectorAll('.elite-bg-video').forEach(vid => vid.style.opacity = 0);
        });
    });
}

// --- VACA DE MILHÕES (Interaction) ---
const cowMillionSection = document.getElementById('cow-million');
const spotlight = document.querySelector('.million-spotlight');
const silhouette = document.querySelector('.cow-silhouette');
const revealBtn = document.querySelector('.million-btn');
const cowSectionContainer = document.querySelector('.million-visual-container');

if(cowMillionSection && spotlight) {
    // Spotlight Following Mouse
    cowMillionSection.addEventListener('mousemove', (e) => {
        const rect = cowMillionSection.getBoundingClientRect();
        const x = ((e.clientX - rect.left) / rect.width) * 100;
        const y = ((e.clientY - rect.top) / rect.height) * 100;
        
        gsap.to(spotlight, {
            background: `radial-gradient(circle at ${x}% ${y}%, rgba(212,175,55,0.25) 0%, transparent 40%)`,
            duration: 0.5
        });
    });

    // Button Reveal Logic
    revealBtn.addEventListener('click', () => {
        cowSectionContainer.classList.add('cow-revealed');
        revealBtn.textContent = "Valor Revelado";
        revealBtn.style.pointerEvents = "none";
        revealBtn.style.borderColor = "transparent";
        revealBtn.style.color = "#fff";
        
        // Particle Explosion Effect (Simulated via GSAP on generic elements)
        // Creating temp particles
        for(let i=0; i<50; i++) {
            const p = document.createElement('div');
            p.style.position = 'absolute';
            p.style.left = '50%';
            p.style.top = '50%';
            p.style.width = '5px';
            p.style.height = '5px';
            p.style.background = '#D4AF37';
            p.style.borderRadius = '50%';
            p.style.pointerEvents = 'none';
            cowSectionContainer.appendChild(p);
            
            const angle = Math.random() * Math.PI * 2;
            const velocity = Math.random() * 200 + 50;
            
            gsap.to(p, {
                x: Math.cos(angle) * velocity,
                y: Math.sin(angle) * velocity,
                opacity: 0,
                duration: 1,
                onComplete: () => p.remove()
            });
        }
    });
}


// --- HQ SECTION (ABCZ HOVER) ---
const hqSection = document.querySelector('#hq-section');
const abczHoverTarget = document.getElementById('abcz-hover-target');
const hqAbczBg = document.getElementById('hq-abcz-bg');

if(hqSection) {
    gsap.to('.hq-bg', { y: '20%', ease: 'none', scrollTrigger: { trigger: '#hq-section', start: 'top bottom', end: 'bottom top', scrub: true } });
    const tlHQ = gsap.timeline({ scrollTrigger: { trigger: '#hq-section', start: 'top 60%', toggleActions: "play none none reverse" } });
    tlHQ.from(".hq-title", { y: 100, opacity: 0, duration: 1.5, ease: "power4.out" })
        .from(".hq-subtitle-wrapper", { scaleX: 0, duration: 1, ease: "expo.out" }, "-=1")
        .from(".hq-subtitle", { opacity: 0, duration: 1 }, "-=0.5")
        .from(".hq-coords", { opacity: 0, x: 20, duration: 1 }, "-=0.8");

    // Hover Interaction
    if(abczHoverTarget && hqAbczBg) {
        abczHoverTarget.addEventListener('mouseenter', () => {
            hqAbczBg.style.opacity = '1';
        });
        abczHoverTarget.addEventListener('mouseleave', () => {
            hqAbczBg.style.opacity = '0';
        });
    }
}

// ==============================================
// NOVA SEÇÃO: GENETICS HUB (MACRO & MICRO)
// ==============================================

const geneticsMacro = document.getElementById('genetics-macro');
const geneticsMicro = document.getElementById('genetics-micro');

if (geneticsMacro && geneticsMicro) {

    // 1. Animação da "Life Line" (Linha conectora)
    gsap.to(".genetic-line", {
        height: "100%",
        ease: "none",
        scrollTrigger: {
            trigger: "#genetics-macro",
            start: "top center",
            end: "bottom center",
            scrub: 1
        }
    });

    // 2. Animação dos Títulos e Cards do MACRO
    const revealGenetics = document.querySelectorAll('.reveal-genetics');
    gsap.from(revealGenetics, {
        y: 50, opacity: 0, duration: 1, stagger: 0.2, ease: "power2.out",
        scrollTrigger: { trigger: "#genetics-macro", start: "top 70%" }
    });

    const macroCards = document.querySelectorAll('.reveal-macro-card');
    macroCards.forEach((card, i) => {
        gsap.from(card, {
            y: 100, 
            opacity: 0, 
            scale: 0.9,
            duration: 1, 
            ease: "power3.out",
            scrollTrigger: {
                trigger: card,
                start: "top 80%",
                toggleActions: "play none none reverse"
            }
        });
    });

    // 3. Efeito de "Microscópio" (Focus) no MICRO
    const microCards = document.querySelectorAll('.micro-blur-effect');
    
    microCards.forEach((card) => {
        ScrollTrigger.create({
            trigger: card,
            start: "top 75%", // Quando o card entra 75% da tela
            onEnter: () => {
                card.classList.add('micro-focused');
            },
            onLeaveBack: () => {
                card.classList.remove('micro-focused');
            }
        });
    });
}

// --- CIA SECTION SCRIPTS ---
const ciaSection = document.querySelector('#cia-experience');
if(ciaSection) {
    gsap.to('.cia-giant-text', {
        xPercent: 15, 
        ease: "none",
        scrollTrigger: {
            trigger: '#cia-experience',
            start: "top bottom",
            end: "bottom top",
            scrub: true
        }
    });

    gsap.to('.cia-spotlights', {
        rotation: 360,
        ease: "none",
        duration: 60,
        repeat: -1
    });

    const ciaCards = document.querySelectorAll('.cia-card');
    const defaultBg = document.getElementById('cia-default-bg');
    
    ciaCards.forEach(card => {
        const bgId = card.getAttribute('data-bg');
        const targetBg = document.getElementById(bgId);
        
        if(targetBg) {
            card.addEventListener('mouseenter', () => {
                defaultBg.style.opacity = '0.2';
                document.querySelectorAll('.cia-bg-layer').forEach(bg => bg.style.opacity = '0');
                targetBg.style.opacity = '0.4'; 
            });
            
            card.addEventListener('mouseleave', () => {
                defaultBg.style.opacity = '1';
                targetBg.style.opacity = '0';
            });
        }
    });
}

// --- CIDADE UNIVERSITÁRIA (28k Students Counter) ---
const studentCounter = document.getElementById('student-counter');
if(studentCounter) {
    ScrollTrigger.create({
        trigger: ".student-counter-container",
        start: "top 80%",
        once: true,
        onEnter: () => {
            let obj = { val: 0 };
            gsap.to(obj, {
                val: 28000, // Updated to 28000 as requested
                duration: 2.5,
                ease: "power2.out",
                onUpdate: () => {
                    studentCounter.innerText = Math.floor(obj.val).toLocaleString('pt-BR');
                }
            });
        }
    });
}


// --- MEMORIAL ---
const memorialSection = document.getElementById('chico-memorial');
const darknessLayer = document.getElementById('darkness-layer');
const toggleBtn = document.getElementById('light-toggle');
let isLightOn = false;

if (memorialSection) {
    memorialSection.addEventListener('mousemove', (e) => {
        if(window.innerWidth > 768 && !isLightOn) {
            const rect = memorialSection.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            memorialSection.style.setProperty('--cursor-x', `${x}px`);
            memorialSection.style.setProperty('--cursor-y', `${y}px`);
        }
    });
    toggleBtn.addEventListener('click', () => {
        isLightOn = !isLightOn;
        if(isLightOn) {
            darknessLayer.style.opacity = '0';
            toggleBtn.textContent = "Acender Escuridão";
            document.getElementById('glow-cursor').style.opacity = '0';
        } else {
            darknessLayer.style.opacity = '1';
            toggleBtn.textContent = "Apagar Luzes";
            document.getElementById('glow-cursor').style.opacity = '1';
        }
    });
    gsap.from(".memorial-title", { y: 50, opacity: 0, duration: 2, ease: "power2.out", scrollTrigger: { trigger: "#chico-memorial", start: "top 60%" } });
}

const verticalSections = gsap.utils.toArray('section.scrolly-sec');
verticalSections.forEach((section, i) => {
    ScrollTrigger.create({ trigger: section, start: "top top", pin: true, pinSpacing: false, end: "max" });
    if (section.id !== 'intro' && section.id !== 'dino-hero' && section.id !== 'zebu-hero') {
        const elements = section.querySelectorAll('h1, p');
        if(elements.length > 0) {
            gsap.from(elements, { y: 100, opacity: 0, duration: 1.5, ease: "power4.out", stagger: 0.2, scrollTrigger: { trigger: section, start: "top 60%", toggleActions: "play none none reverse" } });
        }
    }
    if(section.querySelector('.bg-img')) {
        gsap.to(section.querySelector('.bg-img'), { yPercent: 15, ease: "none", scrollTrigger: { trigger: section, start: "top bottom", end: "bottom top", scrub: true } });
    }
});

// --- CONTROLE DE ÁUDIO ---
const introAudio = document.getElementById('intro-audio');
function tryPlayAudio() {
    if(!introAudio) return;
    introAudio.volume = 1.0;
    const playPromise = introAudio.play();
    if (playPromise !== undefined) {
        playPromise.catch(error => {
            const startAudio = () => {
                const retryPromise = introAudio.play();
                if (retryPromise !== undefined) retryPromise.catch(e => {});
                window.removeEventListener('click', startAudio);
                window.removeEventListener('keydown', startAudio);
            };
            window.addEventListener('click', startAudio);
            window.addEventListener('keydown', startAudio);
        });
    }
}
tryPlayAudio();

ScrollTrigger.create({
    trigger: "#history", 
    start: "top bottom", 
    end: "center center", 
    scrub: true,         
    onUpdate: (self) => {
        if(introAudio) {
            let vol = 1 - self.progress;
            if (vol < 0) vol = 0;
            if (vol > 1) vol = 1;
            introAudio.volume = vol;
        }
    }
});

// ==============================================================
//  EASTER EGG DO RODAPÉ (CENTRALIZAÇÃO CORRIGIDA)
// ==============================================================
const footerEggContainer = document.getElementById('footer-egg-container');
const footerCityName = document.getElementById('footer-city-name');
const footerEggContent = document.getElementById('footer-egg-content');
const footerSubtitle = document.getElementById('footer-subtitle');

function createRealSmoke(rect) {
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    
    for(let i = 0; i < 40; i++) {
        const puff = document.createElement('div');
        puff.classList.add('smoke-puff');
        document.body.appendChild(puff);

        const size = Math.random() * 30 + 20; 
        
        gsap.set(puff, {
            x: centerX + (Math.random() * 60 - 30), 
            y: centerY + (Math.random() * 20 - 10),
            width: size,
            height: size,
            opacity: Math.random() * 0.4 + 0.1, 
            scale: 0.5
        });

        gsap.to(puff, {
            duration: Math.random() * 1.5 + 1,
            y: centerY - (Math.random() * 100 + 50), 
            x: "+=" + (Math.random() * 100 - 50),        
            scale: Math.random() * 2 + 2,                
            opacity: 0,                               
            ease: "power1.out",
            onComplete: () => puff.remove()
        });
    }
}

if(footerEggContainer) {
    footerEggContainer.addEventListener('click', () => {
        if (window.innerWidth < 1024) return;

        if (footerCityName.style.display === 'none') return;

        const rectTitle = footerCityName.getBoundingClientRect();
        createRealSmoke(rectTitle);
        
        if (footerSubtitle) {
            const rectSubtitle = footerSubtitle.getBoundingClientRect();
            createRealSmoke(rectSubtitle);
        }

        const elementsToHide = [footerCityName];
        if (footerSubtitle) elementsToHide.push(footerSubtitle);

        gsap.to(elementsToHide, {
            duration: 0.8,
            opacity: 0,
            scale: 1.5,        
            filter: "blur(20px)", 
            y: -50,            
            ease: "power2.in",
            onComplete: () => {
                footerCityName.style.display = "none"; 
                if (footerSubtitle) footerSubtitle.style.display = "none";
                
                // Revela APENAS a imagem
                footerEggContent.classList.remove('hidden');
                footerEggContent.classList.add('flex');
                
                gsap.fromTo(footerEggContent, 
                    { opacity: 0, scale: 0.5 },
                    { opacity: 1, scale: 1, duration: 0.8, ease: "back.out(1.7)" }
                );
            }
        });
    });
}

// LOGISTICS HOVER
const cardTiub = document.getElementById('card-tiub');
const cardAirport = document.getElementById('card-airport');
const bgDefault = document.getElementById('logistics-bg-default');
const bgTiub = document.getElementById('logistics-bg-tiub');
const bgAirport = document.getElementById('logistics-bg-airport');

if (cardTiub && bgTiub) {
    cardTiub.addEventListener('mouseenter', () => {
        bgDefault.style.opacity = '0'; 
        bgTiub.style.opacity = '0.4';  
    });
    cardTiub.addEventListener('mouseleave', () => {
        bgDefault.style.opacity = '0.2'; 
        bgTiub.style.opacity = '0';      
    });
}

if (cardAirport && bgAirport) {
    cardAirport.addEventListener('mouseenter', () => {
        bgDefault.style.opacity = '0';    
        bgAirport.style.opacity = '0.4'; 
    });
    cardAirport.addEventListener('mouseleave', () => {
        bgDefault.style.opacity = '0.2'; 
        bgAirport.style.opacity = '0';    
    });
}

// --- USC ANIMATIONS ---
const uscSection = document.getElementById('usc-experience');
if(uscSection) {
    // Badge Parallax
    const badge = document.querySelector('.usc-parallax-badge');
    if(badge) {
        gsap.to(badge, {
            yPercent: 20,
            ease: "none",
            scrollTrigger: {
                trigger: "#usc-hero",
                start: "top bottom",
                end: "bottom top",
                scrub: 1
            }
        });
    }

    // Reveals
    const reveals = document.querySelectorAll('.reveal-usc');
    reveals.forEach(el => {
        gsap.from(el, {
            y: 50,
            opacity: 0,
            duration: 1,
            ease: "power3.out",
            scrollTrigger: {
                trigger: el,
                start: "top 80%",
                toggleActions: "play none none reverse"
            }
        });
    });
}

// ==============================================
//  ROTA DOS MUSEUS - ANIMAÇÕES
// ==============================================
const museumRoute = document.getElementById('museum-route');
if (museumRoute) {
    
    // 1. Animação do Desenho da Linha (Sinuous Road)
    const path = document.getElementById('museum-path');
    if (path) {
        // Define o comprimento do path para dashoffset animation
        const length = path.getTotalLength();
        
        // Configura o estado inicial (escondido)
        gsap.set(path, { 
            strokeDasharray: length, 
            strokeDashoffset: length 
        });

        // Anima conforme o scroll da seção
        gsap.to(path, {
            strokeDashoffset: 0,
            ease: "none",
            scrollTrigger: {
                trigger: "#museum-route",
                start: "top 70%", // Começa a desenhar um pouco antes
                end: "bottom bottom",
                scrub: 1
            }
        });
    }

    // 2. Reveal dos Itens (Zig Zag)
    const revealLeft = document.querySelectorAll('.reveal-left');
    const revealRight = document.querySelectorAll('.reveal-right');

    revealLeft.forEach(el => {
        gsap.from(el, {
            x: -100,
            opacity: 0,
            duration: 1,
            ease: "power3.out",
            scrollTrigger: {
                trigger: el,
                start: "top 85%",
                toggleActions: "play none none reverse"
            }
        });
    });

    revealRight.forEach(el => {
        gsap.from(el, {
            x: 100,
            opacity: 0,
            duration: 1,
            ease: "power3.out",
            scrollTrigger: {
                trigger: el,
                start: "top 85%",
                toggleActions: "play none none reverse"
            }
        });
    });

    // Reveal Title
    gsap.from(".reveal-museum", {
        y: 50, opacity: 0, duration: 1.2, ease: "power2.out",
        scrollTrigger: { trigger: "#museum-route", start: "top 75%" }
    });
}

// ==============================================
//  MOBILE VIDEO INTERACTION (PRESS & HOLD)
// ==============================================

const previewBtn = document.getElementById('preview-btn');
const mobilePopup = document.getElementById('mobile-preview-popup');
const popupVideo = document.getElementById('mobile-popup-video');
const mobileOverlayLayer = document.getElementById('mobile-overlay-layer');
const mobileContentBox = document.getElementById('mobile-content-box');

if (previewBtn && mobilePopup && popupVideo) {
    // Função para ativar o modo "HD"
    const activatePreview = (e) => {
        e.preventDefault(); // Evita comportamento padrão (menu de contexto)
        
        // 1. Esconder a sobreposição escura e o conteúdo
        mobileOverlayLayer.style.opacity = '0';
        mobileContentBox.style.opacity = '0';
        mobileContentBox.style.transform = 'scale(0.9)';

        // 2. Mostrar o popup de vídeo
        mobilePopup.style.opacity = '1';
        mobilePopup.style.pointerEvents = 'auto';
        mobilePopup.style.transform = 'scale(1)';
        
        // 3. Dar play no vídeo (se não estiver tocando)
        popupVideo.play().catch(e => console.log("Autoplay prevented", e));
    };

    // Função para desativar o modo "HD"
    const deactivatePreview = () => {
        // 1. Reverter visibilidade
        mobileOverlayLayer.style.opacity = '1';
        mobileContentBox.style.opacity = '1';
        mobileContentBox.style.transform = 'scale(1)';

        // 2. Esconder popup
        mobilePopup.style.opacity = '0';
        mobilePopup.style.pointerEvents = 'none';
        mobilePopup.style.transform = 'scale(0.9)';
        
        // Opcional: Pausar vídeo para economizar bateria, mas manter o loop pode ser mais fluido visualmente
        // popupVideo.pause(); 
    };

    // Eventos de Touch (Mobile)
    previewBtn.addEventListener('touchstart', activatePreview, { passive: false });
    previewBtn.addEventListener('touchend', deactivatePreview);
    previewBtn.addEventListener('touchcancel', deactivatePreview);

    // Eventos de Mouse (Desktop Debugging)
    previewBtn.addEventListener('mousedown', activatePreview);
    previewBtn.addEventListener('mouseup', deactivatePreview);
    previewBtn.addEventListener('mouseleave', deactivatePreview);
    
    // Prevenir menu de contexto (clique direito/long press) no botão
    previewBtn.addEventListener('contextmenu', (e) => e.preventDefault());
}

// ==============================================
//  ANTHEM MODAL LOGIC
// ==============================================
const anthemModal = document.getElementById('anthem-modal');
const anthemVideoContainer = document.getElementById('anthem-video-container');

function openAnthem() {
    if(anthemModal) {
        anthemModal.classList.remove('hidden');
        // Small delay to allow display:block to render before opacity transition
        setTimeout(() => {
            anthemModal.classList.remove('opacity-0');
        }, 10);
        
        // Inject YouTube Iframe only when opening to save resources
        anthemVideoContainer.innerHTML = `
            <iframe width="100%" height="100%" src="https://www.youtube.com/embed/z_1nIwZ2WuM?autoplay=1&rel=0" title="Hino de Uberaba" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>
        `;
        
        // Pause Intro Audio if playing
        const introAudio = document.getElementById('intro-audio');
        if(introAudio) {
            introAudio.pause();
        }
    }
}

function closeAnthem() {
    if(anthemModal) {
        anthemModal.classList.add('opacity-0');
        setTimeout(() => {
            anthemModal.classList.add('hidden');
            anthemVideoContainer.innerHTML = ''; // Remove iframe to stop video sound
            
            // Resume Intro Audio if desired (Optional)
            /*
            const introAudio = document.getElementById('intro-audio');
            if(introAudio) introAudio.play();
            */
        }, 500); // Match duration-500
    }
}

// ==============================================
//  HISTORY BOOK MODAL LOGIC (NOVO)
// ==============================================
const openBookBtn = document.getElementById('open-history-book-btn');
const historyModal = document.getElementById('history-book-modal');
const closeBookBtn = document.getElementById('close-history-book');
const bookInterface = document.getElementById('book-interface');

if (openBookBtn && historyModal && bookInterface) {
    
    openBookBtn.addEventListener('click', () => {
        // PAUSA O SCROLL PRINCIPAL (LENIS) PARA PERMITIR SCROLL DENTRO DO MODAL
        if(typeof lenis !== 'undefined') lenis.stop(); 

        historyModal.classList.remove('hidden');
        historyModal.classList.remove('pointer-events-none');
        
        // Pequeno delay para garantir que a classe hidden saiu antes da transição de opacidade
        setTimeout(() => {
            historyModal.classList.remove('opacity-0');
            
            // Animação de entrada do livro (Scale Up + Fade In)
            bookInterface.classList.remove('scale-90', 'opacity-0');
            bookInterface.classList.add('scale-100', 'opacity-100');
        }, 50);
    });

    const closeBook = () => {
        // Animação de saída
        bookInterface.classList.remove('scale-100', 'opacity-100');
        bookInterface.classList.add('scale-90', 'opacity-0');
        
        historyModal.classList.add('opacity-0');

        setTimeout(() => {
            historyModal.classList.add('hidden');
            historyModal.classList.add('pointer-events-none');
            
            // RETOMA O SCROLL PRINCIPAL (LENIS)
            if(typeof lenis !== 'undefined') lenis.start();
        }, 700); // Tempo igual ao duration-700 do CSS
    };

    closeBookBtn.addEventListener('click', closeBook);
    
    // Fechar ao clicar fora do livro
    historyModal.addEventListener('click', (e) => {
        if (e.target === historyModal) {
            closeBook();
        }
    });
}