/**
 * SET x HARDLINE NUTRITION PRESENTATION CONTROLLER
 * Ultra-smooth slide engine, cinematic particles, Web Audio API sound fx, and interactive calculators
 */

// Sound Engine using Web Audio API (Zero external MP3 dependencies)
class AudioEngine {
  constructor() {
    this.ctx = null;
    this.enabled = true;
  }

  init() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      this.ctx = new AudioCtx();
    }
  }

  playWhoosh() {
    if (!this.enabled) return;
    this.init();
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    // Frequency drop for smooth cinematic whoosh
    osc.frequency.setValueAtTime(140, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(45, this.ctx.currentTime + 0.35);

    gain.gain.setValueAtTime(0.08, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.35);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start();
    osc.stop(this.ctx.currentTime + 0.35);
  }

  playClick() {
    if (!this.enabled) return;
    this.init();
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(800, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(400, this.ctx.currentTime + 0.05);

    gain.gain.setValueAtTime(0.05, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.05);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start();
    osc.stop(this.ctx.currentTime + 0.05);
  }
}

// Particle Canvas for ambient energy
class ParticleCanvas {
  constructor(canvasId) {
    this.canvas = document.getElementById(canvasId);
    if (!this.canvas) return;
    this.ctx = this.canvas.getContext('2d');
    this.particles = [];
    this.resize();
    this.initParticles();
    window.addEventListener('resize', () => this.resize());
    this.animate();
  }

  resize() {
    this.width = this.canvas.width = window.innerWidth;
    this.height = this.canvas.height = window.innerHeight;
  }

  initParticles() {
    const count = Math.floor(window.innerWidth / 35);
    this.particles = [];
    for (let i = 0; i < count; i++) {
      this.particles.push({
        x: Math.random() * this.width,
        y: Math.random() * this.height,
        size: Math.random() * 2 + 0.5,
        speedY: -(Math.random() * 0.4 + 0.1),
        speedX: (Math.random() - 0.5) * 0.2,
        alpha: Math.random() * 0.4 + 0.1,
      });
    }
  }

  animate() {
    this.ctx.clearRect(0, 0, this.width, this.height);
    this.particles.forEach((p) => {
      p.y += p.speedY;
      p.x += p.speedX;

      if (p.y < 0) {
        p.y = this.height;
        p.x = Math.random() * this.width;
      }

      this.ctx.fillStyle = `rgba(227, 6, 19, ${p.alpha})`;
      this.ctx.beginPath();
      this.ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      this.ctx.fill();
    });

    requestAnimationFrame(() => this.animate());
  }
}

// Deck Master Controller
const Deck = {
  currentSlide: 1,
  totalSlides: 12,
  isTransitioning: false,
  autoplayInterval: null,
  isAutoplay: false,
  audio: new AudioEngine(),

  init() {
    this.slides = document.querySelectorAll('.slide-section');
    this.totalSlides = this.slides.length;

    document.getElementById('total-slides-num').textContent = String(this.totalSlides).padStart(2, '0');

    this.buildDotsNav();
    this.bindEvents();
    this.goToSlide(1, false);

    // Initialize Particles
    new ParticleCanvas('particles-canvas');

    // Initialize Lucide Icons
    if (window.lucide) {
      window.lucide.createIcons();
    }
  },

  buildDotsNav() {
    const nav = document.getElementById('dots-nav');
    nav.innerHTML = '';

    this.slides.forEach((slide, index) => {
      const slideNum = index + 1;
      const title = slide.getAttribute('data-title') || `Slayt ${slideNum}`;

      const dot = document.createElement('div');
      dot.className = `dot-item ${slideNum === 1 ? 'active' : ''}`;
      dot.setAttribute('data-target', slideNum);
      dot.innerHTML = `
        <span class="dot-tooltip">${String(slideNum).padStart(2, '0')}. ${title}</span>
        <span class="dot-indicator"></span>
      `;

      dot.addEventListener('click', () => {
        this.goToSlide(slideNum);
      });

      nav.appendChild(dot);
    });
  },

  updateHUD() {
    // Current Slide Number
    document.getElementById('current-slide-num').textContent = String(this.currentSlide).padStart(2, '0');

    // Progress Bar
    const percent = (this.currentSlide / this.totalSlides) * 100;
    document.getElementById('progress-bar').style.width = `${percent}%`;

    // Dots Active State
    const dots = document.querySelectorAll('.dot-item');
    dots.forEach((dot, index) => {
      if (index + 1 === this.currentSlide) {
        dot.classList.add('active');
      } else {
        dot.classList.remove('active');
      }
    });

    // Animate counters if on Slide 10
    if (this.currentSlide === 10) {
      this.animateCounters();
    }
  },

  goToSlide(num, playSound = true) {
    if (num < 1 || num > this.totalSlides) return;
    if (num === this.currentSlide && this.slides[num - 1].classList.contains('active')) return;

    this.isTransitioning = true;
    if (playSound) {
      this.audio.playWhoosh();
    }

    const prevIndex = this.currentSlide - 1;
    const nextIndex = num - 1;

    this.slides.forEach((slide, idx) => {
      if (idx === nextIndex) {
        slide.classList.remove('prev-slide');
        slide.classList.add('active');
      } else if (idx < nextIndex) {
        slide.classList.remove('active');
        slide.classList.add('prev-slide');
      } else {
        slide.classList.remove('active', 'prev-slide');
      }
    });

    this.currentSlide = num;
    this.updateHUD();

    setTimeout(() => {
      this.isTransitioning = false;
    }, 700);
  },

  next() {
    if (this.currentSlide < this.totalSlides) {
      this.goToSlide(this.currentSlide + 1);
    } else if (this.isAutoplay) {
      this.goToSlide(1);
    }
  },

  prev() {
    if (this.currentSlide > 1) {
      this.goToSlide(this.currentSlide - 1);
    }
  },

  toggleAutoplay() {
    const btn = document.getElementById('btn-autoplay');
    this.isAutoplay = !this.isAutoplay;

    if (this.isAutoplay) {
      btn.classList.add('active');
      btn.innerHTML = '<i data-lucide="pause" class="w-4 h-4 text-hardline-red"></i>';
      this.autoplayInterval = setInterval(() => {
        this.next();
      }, 7000); // 7 seconds per slide
    } else {
      btn.classList.remove('active');
      btn.innerHTML = '<i data-lucide="play" class="w-4 h-4 text-gray-300"></i>';
      clearInterval(this.autoplayInterval);
    }

    if (window.lucide) window.lucide.createIcons();
    this.audio.playClick();
  },

  toggleSound() {
    const btn = document.getElementById('btn-sound');
    this.audio.enabled = !this.audio.enabled;

    if (this.audio.enabled) {
      btn.classList.remove('active');
      btn.innerHTML = '<i data-lucide="volume-2" class="w-4 h-4 text-gray-300"></i>';
      this.audio.playClick();
    } else {
      btn.classList.add('active');
      btn.innerHTML = '<i data-lucide="volume-x" class="w-4 h-4 text-red-500"></i>';
    }

    if (window.lucide) window.lucide.createIcons();
  },

  toggleFullscreen() {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen().catch(() => {});
      }
    }
    this.audio.playClick();
  },

  animateCounters() {
    const counters = document.querySelectorAll('.slide-section[data-slide="10"] .counter');
    counters.forEach((counter) => {
      const target = +counter.getAttribute('data-target');
      let count = 0;
      const step = Math.ceil(target / 45);

      const update = () => {
        count += step;
        if (count < target) {
          counter.textContent = count.toLocaleString('tr-TR');
          requestAnimationFrame(update);
        } else {
          counter.textContent = target.toLocaleString('tr-TR') + '+';
        }
      };
      update();
    });
  },

  bindEvents() {
    // Buttons
    document.getElementById('btn-next').addEventListener('click', () => {
      this.next();
      this.audio.playClick();
    });

    document.getElementById('btn-prev').addEventListener('click', () => {
      this.prev();
      this.audio.playClick();
    });

    document.getElementById('btn-autoplay').addEventListener('click', () => this.toggleAutoplay());
    document.getElementById('btn-sound').addEventListener('click', () => this.toggleSound());
    document.getElementById('btn-fullscreen').addEventListener('click', () => this.toggleFullscreen());

    // Keyboard Navigation
    window.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowDown' || e.key === 'ArrowRight' || e.key === ' ' || e.key === 'PageDown') {
        e.preventDefault();
        this.next();
      } else if (e.key === 'ArrowUp' || e.key === 'ArrowLeft' || e.key === 'PageUp') {
        e.preventDefault();
        this.prev();
      } else if (e.key === 'Home') {
        e.preventDefault();
        this.goToSlide(1);
      } else if (e.key === 'End') {
        e.preventDefault();
        this.goToSlide(this.totalSlides);
      } else if (e.key.toLowerCase() === 'f') {
        this.toggleFullscreen();
      } else if (e.key.toLowerCase() === 'm') {
        this.toggleSound();
      }
    });

    // Smooth Debounced Wheel Navigation
    let wheelTimeout = null;
    window.addEventListener('wheel', (e) => {
      if (this.isTransitioning) return;
      if (wheelTimeout) return;

      wheelTimeout = setTimeout(() => {
        wheelTimeout = null;
      }, 500);

      if (e.deltaY > 25) {
        this.next();
      } else if (e.deltaY < -25) {
        this.prev();
      }
    }, { passive: true });

    // Touch Swipe Navigation
    let touchStartY = 0;
    let touchStartX = 0;

    window.addEventListener('touchstart', (e) => {
      touchStartY = e.touches[0].clientY;
      touchStartX = e.touches[0].clientX;
    }, { passive: true });

    window.addEventListener('touchend', (e) => {
      if (this.isTransitioning) return;
      const touchEndY = e.changedTouches[0].clientY;
      const touchEndX = e.changedTouches[0].clientX;

      const diffY = touchStartY - touchEndY;
      const diffX = touchStartX - touchEndX;

      if (Math.abs(diffY) > Math.abs(diffX) && Math.abs(diffY) > 40) {
        if (diffY > 0) this.next();
        else this.prev();
      }
    }, { passive: true });

    // Interactive Slider on Slide 10 (Etki Simülasyonu)
    const scaleSlider = document.getElementById('scale-slider');
    const scaleLabel = document.getElementById('calc-scale-label');

    if (scaleSlider) {
      const scaleData = [
        { label: '1X Pilot Kampüs Başlangıcı (Hedeflenen: 2.500 Sampling)', sampling: 2500, reach: 8000, qr: 1200, impressions: 65000 },
        { label: '2X Genişletilmiş Kampüs (Hedeflenen: 4.500 Sampling)', sampling: 4500, reach: 14000, qr: 2200, impressions: 120000 },
        { label: '3X SET Fest Ana Festivali (Hedeflenen: 7.500 Sampling)', sampling: 7500, reach: 22000, qr: 3800, impressions: 240000 },
        { label: '4X Bölgesel 2 Şehir & Şenlik (Hedeflenen: 12.000 Sampling)', sampling: 12000, reach: 35000, qr: 6000, impressions: 450000 },
        { label: '5X Sezonluk Ulusal Hedef (Zamanla Kademeli Büyüyen)', sampling: 20000, reach: 60000, qr: 10000, impressions: 750000 }
      ];

      scaleSlider.addEventListener('input', (e) => {
        const val = parseInt(e.target.value);
        const item = scaleData[val - 1];
        scaleLabel.textContent = item.label;

        const counters = document.querySelectorAll('.slide-section[data-slide="10"] .counter');
        if (counters.length >= 4) {
          counters[0].textContent = item.sampling.toLocaleString('tr-TR') + '+';
          counters[1].textContent = item.reach.toLocaleString('tr-TR') + '+';
          counters[2].textContent = item.qr.toLocaleString('tr-TR') + '+';
          counters[3].textContent = item.impressions.toLocaleString('tr-TR') + '+';
        }
      });
    }

    // Modal Image Preview
    const modal = document.getElementById('image-modal');
    const modalImg = document.getElementById('modal-img');
    const modalCaption = document.getElementById('modal-caption');
    const modalClose = document.getElementById('modal-close');

    document.querySelectorAll('img').forEach((img) => {
      img.addEventListener('click', () => {
        if (modal && img.src && !img.closest('header')) {
          modalImg.src = img.src;
          modalCaption.textContent = img.alt || 'Görsel Detayı';
          modal.classList.remove('opacity-0', 'pointer-events-none');
          modal.classList.add('opacity-100', 'pointer-events-auto');
          this.audio.playClick();
        }
      });
    });

    if (modalClose) {
      modalClose.addEventListener('click', () => {
        modal.classList.add('opacity-0', 'pointer-events-none');
        modal.classList.remove('opacity-100', 'pointer-events-auto');
        this.audio.playClick();
      });
    }

    if (modal) {
      modal.addEventListener('click', (e) => {
        if (e.target === modal) {
          modal.classList.add('opacity-0', 'pointer-events-none');
          modal.classList.remove('opacity-100', 'pointer-events-auto');
        }
      });
    }
  }
};

// Bootstrap on DOM Ready
document.addEventListener('DOMContentLoaded', () => {
  Deck.init();
});
