import { gsap } from 'gsap';

export function createStoryCard() {
    const overlay = document.createElement('div');
    overlay.className = 'story-card-overlay hidden';
    overlay.innerHTML = `
    <div class="story-card">
      <div class="story-card__eyebrow">Путешествие</div>
      <h2 class="story-card__title"></h2>
      <p class="story-card__text"></p>
      <div class="story-card__media"></div>
      <button class="story-card__button">Продолжить</button>
    </div>
  `;

    document.body.appendChild(overlay);

    const card = overlay.querySelector('.story-card');
    const title = overlay.querySelector('.story-card__title');
    const text = overlay.querySelector('.story-card__text');
    const media = overlay.querySelector('.story-card__media');
    const button = overlay.querySelector('.story-card__button');
    const eyebrow = overlay.querySelector('.story-card__eyebrow');

    function show({ title: nextTitle, text: nextText, media: nextMedia, buttonLabel = 'Продолжить', onContinue, accent = '#6d7cff' }) {
        title.textContent = nextTitle;
        text.textContent = nextText;
        media.innerHTML = nextMedia || '<div class="story-card__placeholder">✦</div>';
        button.textContent = buttonLabel;
        eyebrow.style.color = accent;
        card.style.borderColor = accent;
        card.style.boxShadow = `0 0 30px ${accent}55`;

        overlay.classList.remove('hidden');
        gsap.fromTo(
            card, { y: 40, opacity: 0, scale: 0.96 }, { y: 0, opacity: 1, scale: 1, duration: 0.8, ease: 'power3.out' }
        );

        button.onclick = () => {
            gsap.to(card, {
                y: 30,
                opacity: 0,
                scale: 0.96,
                duration: 0.45,
                ease: 'power2.in',
                onComplete: () => {
                    overlay.classList.add('hidden');
                    if (typeof onContinue === 'function') onContinue();
                }
            });
        };
    }

    function showMemoryPoints(items, onSelect) {
        const points = document.createElement('div');
        points.className = 'memory-points';
        points.innerHTML = items
            .map((item, index) => `
        <button class="memory-point" data-index="${index}" style="--delay:${index * 0.12}s">
          <span>${item.label}</span>
        </button>
      `)
            .join('');
        document.body.appendChild(points);

        points.querySelectorAll('.memory-point').forEach((button) => {
            button.addEventListener('click', () => {
                const index = Number(button.dataset.index);
                if (typeof onSelect === 'function') onSelect(items[index]);
            });
        });

        gsap.fromTo(points.children, { opacity: 0, y: 20 }, { opacity: 1, y: 0, stagger: 0.1, duration: 0.6, ease: 'power3.out' });

        return points;
    }

    function removeMemoryPoints(points) {
        if (points) {
            points.remove();
        }
    }

    function hide() {
        overlay.classList.add('hidden');
    }

    return { show, hide, showMemoryPoints, removeMemoryPoints };
}