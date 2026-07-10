import { gsap } from "gsap";

const music = new Audio(`${import.meta.env.BASE_URL}audio/music.mp3`);

music.preload = "auto";
music.loop = true;
music.volume = 0;

let musicButton = null;

export function createIntro(startCallback) {

    const intro = document.createElement("div");

    intro.id = "intro";

    intro.innerHTML = `
        <div class="intro-content">

            <h1 class="title">For My Beloved ❤️</h1>

            <p class="subtitle">
                Every star has its day to shine. Today is the birthday of the brightest one. ✨
            </p>

            <button id="startJourney">
                Начать путешествие
            </button>

        </div>
    `;

    document.body.appendChild(intro);

    gsap.from(".title", {
        y: 80,
        opacity: 0,
        duration: 1.5
    });

    gsap.from(".subtitle", {
        y: 40,
        opacity: 0,
        duration: 1.5,
        delay: 0.5
    });

    // gsap.from("#startJourney", {
    //     scale: 0,
    //     opacity: 0,
    //     duration: 1,
    //     delay: 1.2
    // });

    document.getElementById("startJourney").onclick = () => {

        music.currentTime = 0;

        music.play().catch((err) => {
            console.log(err);
        });

        createMusicButton();

        gsap.to(music, {
            volume: 0.4,
            duration: 3,
            ease: "power2.out"
        });

        gsap.to(intro, {
            opacity: 0,
            duration: 1.5,
            onComplete: () => {

                intro.remove();

                startCallback();

            }
        });

    };

}

function createMusicButton() {

    musicButton = document.createElement("button");

    musicButton.className = "music-button";

    musicButton.innerHTML = `
        <i data-lucide="volume-2"></i>
    `;

    document.body.appendChild(musicButton);

    lucide.createIcons();

    musicButton.onclick = () => {

        if (music.muted) {

            music.muted = false;

            musicButton.innerHTML = `
                <i data-lucide="volume-2"></i>
            `;

        } else {

            music.muted = true;

            musicButton.innerHTML = `
                <i data-lucide="volume-x"></i>
            `;

        }

        lucide.createIcons();

    };

}