/* Configure aqui o link único do checkout. Ex.: https://seu-checkout.com */
const CHECKOUT_URL = '';

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

document.querySelectorAll('.faq').forEach(item => item.addEventListener('toggle', () => {
  if (item.open) document.querySelectorAll('.faq').forEach(other => {
    if (other !== item) other.open = false;
  });
}));
