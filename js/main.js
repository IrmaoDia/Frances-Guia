/* Configure aqui o link único do checkout. Ex.: https://seu-checkout.com */
const CHECKOUT_URL = 'https://pay.hotmart.com/H107900929R?off=1evf6xho&checkoutMode=10';

document.querySelectorAll('[data-checkout]').forEach(link => {
  if (CHECKOUT_URL) link.href = CHECKOUT_URL;
  else link.addEventListener('click', () => {
    document.querySelector('#checkout-message').hidden = false;
  });
});

const carousel = document.querySelector('.carousel');
const viewport = carousel.querySelector('.carousel-window');
const track = carousel.querySelector('.carousel-track');
const slides = [...track.children];
const videos = slides.map(slide => slide.querySelector('video'));
const dots = document.querySelector('.carousel-dots');
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
let current = 0;
let visible = false;
let scrollFrame = 0;
let wheelUntil = 0;

function loadVideo(video) {
  const source = video.querySelector('source[data-src]');
  if (!source) return;
  source.src = source.dataset.src;
  source.removeAttribute('data-src');
  video.preload = 'metadata';
  video.load();
}
function previewVideo(video) {
  video.pause();
  video.muted = true;
  video.loop = true;
  video.controls = false;
  video.closest('.testimonial-video').classList.remove('is-listening');
}

function syncPlayback() {
  videos.forEach((video, i) => {
    const active = i === current && visible && !document.hidden;
    if (!active) previewVideo(video);
    else video.play().catch(() => {
      // The listen button also starts playback if autoplay is unavailable.
    });
  });
}

function updateSlide(index) {
  current = index;
  loadVideo(videos[current]);
  slides.forEach((slide, i) => {
    slide.setAttribute('aria-hidden', String(i !== current));
    slide.inert = i !== current;
  });
  [...dots.children].forEach((dot, i) => dot.setAttribute('aria-current', String(i === current)));
  document.querySelector('.carousel-status').textContent = `Témoignage ${current + 1} sur ${slides.length}`;
  syncPlayback();
}

function showSlide(index) {
  const next = Math.max(0, Math.min(index, slides.length - 1));
  viewport.scrollTo({ left: next * viewport.clientWidth, behavior: reducedMotion.matches ? 'instant' : 'smooth' });
}

slides.forEach((slide, i) => {
  const video = videos[i];
  previewVideo(video);
  slide.querySelector('.testimonial-listen').addEventListener('click', () => {
    video.currentTime = 0;
    video.muted = false;
    video.loop = false;
    video.controls = true;
    slide.querySelector('.testimonial-video').classList.add('is-listening');
    video.play().catch(() => previewVideo(video));
  });
  video.addEventListener('ended', () => {
    previewVideo(video);
    syncPlayback();
  });
  const dot = document.createElement('button');
  dot.type = 'button';
  dot.setAttribute('aria-label', `Afficher le témoignage ${i + 1}`);
  dot.addEventListener('click', () => showSlide(i));
  dots.append(dot);
});
carousel.querySelector('.previous').addEventListener('click', () => showSlide(current - 1));
carousel.querySelector('.next').addEventListener('click', () => showSlide(current + 1));
carousel.addEventListener('keydown', event => {
  if (event.target.tagName === 'VIDEO') return;
  if (event.key === 'ArrowRight') { event.preventDefault(); showSlide(current + 1); }
  if (event.key === 'ArrowLeft') { event.preventDefault(); showSlide(current - 1); }
});
viewport.addEventListener('scroll', () => {
  cancelAnimationFrame(scrollFrame);
  scrollFrame = requestAnimationFrame(() => {
    const index = Math.round(viewport.scrollLeft / viewport.clientWidth);
    if (index !== current) updateSlide(index);
  });
}, { passive: true });
// Horizontal gestures use native scrolling; the mouse wheel advances one video.
viewport.addEventListener('wheel', event => {
  if (event.ctrlKey || Math.abs(event.deltaX) >= Math.abs(event.deltaY) || Math.abs(event.deltaY) < 4) return;
  if (Date.now() < wheelUntil) { event.preventDefault(); return; }
  const next = current + (event.deltaY > 0 ? 1 : -1);
  if (next < 0 || next >= slides.length) return;
  event.preventDefault();
  wheelUntil = Date.now() + 650;
  showSlide(next);
}, { passive: false });
new IntersectionObserver(entries => {
  visible = entries[0].isIntersecting && entries[0].intersectionRatio >= 0.35;
  syncPlayback();
}, { threshold: [0, 0.35] }).observe(viewport);
document.addEventListener('visibilitychange', syncPlayback);
new ResizeObserver(() => {
  viewport.scrollTo({ left: current * viewport.clientWidth, behavior: 'instant' });
}).observe(viewport);
updateSlide(0);

const guideCarousel = document.querySelector('.guide-carousel');
const guideTrack = guideCarousel.querySelector('.guide-track');
const guideImages = [...guideTrack.children];
const guideDots = guideCarousel.querySelector('.guide-dots');
let guideIndex = 0;
let guideTimer;
const guidePointers = new Set();
let guideTouchX = null;

function scheduleGuide(delay = 4000) {
  clearTimeout(guideTimer);
  if (reducedMotion.matches || document.hidden || guidePointers.size) return;
  guideTimer = setTimeout(() => {
    showGuide(guideIndex + 1);
    scheduleGuide();
  }, delay);
}
function showGuide(index) {
  guideIndex = (index + guideImages.length) % guideImages.length;
  guideTrack.style.transform = `translateX(-${guideIndex * 100}%)`;
  guideImages.forEach((img, i) => img.setAttribute('aria-hidden', String(i !== guideIndex)));
  [...guideDots.children].forEach((dot, i) => dot.setAttribute('aria-current', String(i === guideIndex)));
}
function pauseGuide() { scheduleGuide(10000); }
guideImages.forEach((img, i) => {
  const dot = document.createElement('button');
  dot.type = 'button';
  dot.setAttribute('aria-label', `Afficher l’image ${i + 1}`);
  dot.addEventListener('click', () => { showGuide(i); pauseGuide(); });
  guideDots.append(dot);
});
guideCarousel.querySelector('.guide-previous').addEventListener('click', () => { showGuide(guideIndex - 1); pauseGuide(); });
guideCarousel.querySelector('.guide-next').addEventListener('click', () => { showGuide(guideIndex + 1); pauseGuide(); });
const guideSection = guideCarousel.closest('section');
guideSection.addEventListener('pointerdown', event => {
  guidePointers.add(event.pointerId);
  if (event.target.closest('.guide-window')) guideTouchX = event.clientX;
  clearTimeout(guideTimer);
});
guideSection.addEventListener('pointermove', pauseGuide, { passive: true });
function releaseGuide(event) {
  if (!guidePointers.has(event.pointerId)) return;
  guidePointers.delete(event.pointerId);
  if (event.type === 'pointerup' && guideTouchX !== null && Math.abs(event.clientX - guideTouchX) > 40) {
    showGuide(guideIndex + (event.clientX < guideTouchX ? 1 : -1));
  }
  guideTouchX = null;
  pauseGuide();
}
window.addEventListener('pointerup', releaseGuide);
window.addEventListener('pointercancel', releaseGuide);
guideSection.addEventListener('wheel', pauseGuide, { passive: true });
guideSection.addEventListener('keydown', event => {
  if (guideCarousel.contains(event.target) && ['ArrowRight', 'ArrowLeft'].includes(event.key)) {
    event.preventDefault();
    showGuide(guideIndex + (event.key === 'ArrowRight' ? 1 : -1));
  }
  pauseGuide();
});
document.addEventListener('visibilitychange', pauseGuide);
reducedMotion.addEventListener('change', pauseGuide);
showGuide(0);
scheduleGuide();

document.querySelectorAll('.faq').forEach(item => item.addEventListener('toggle', () => {
  if (item.open) document.querySelectorAll('.faq').forEach(other => {
    if (other !== item) other.open = false;
  });
}));
