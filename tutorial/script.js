document.addEventListener('DOMContentLoaded', () => {
    /* ==========================================================
       0. BOOTSTRAP CAROUSEL STEPPER & NAVIGATION CONTROLLER
    ========================================================== */
    const carouselEl = document.getElementById('tutorialCarousel');
    const tutorialCarousel = new bootstrap.Carousel(carouselEl, {
        interval: false,
        wrap: false,
        keyboard: false // Custom keyboard handler below avoids conflicts with inputs
    });

    const stepPills = document.querySelectorAll('.step-pill');
    const topStepCounter = document.getElementById('topStepCounter');
    const progressBar = document.getElementById('tutorialProgressBar');
    const prevSlideBtn = document.getElementById('prevSlideBtn');
    const nextSlideBtn = document.getElementById('nextSlideBtn');
    const bottomSlideTitle = document.getElementById('bottomSlideTitle');

    const slideTitles = [
        "01. Welcome & Overview",
        "1: Mars Planetary Facts",
        "2: Mars Mission History",
        "3: Anatomy of Korolev Crater",
    ];
    const totalSlides = slideTitles.length;
    let activeSlideIndex = 0;

    function syncStepperUI(index) {
        activeSlideIndex = index;
        const stepNum = index + 1;
        const pct = Math.round((stepNum / totalSlides) * 100);

        // Update top badge & progress bar
        topStepCounter.textContent = `Step ${stepNum - 1} of ${totalSlides - 1}`;
        progressBar.style.width = `${pct}%`;
        progressBar.setAttribute('aria-valuenow', pct);
        bottomSlideTitle.textContent = slideTitles[index];

        // Update stepper pills
        stepPills.forEach((pill, idx) => {
            pill.classList.toggle('active', idx === index);
            pill.classList.toggle('completed', idx < index);
        });

        // Update Previous button state
        prevSlideBtn.disabled = index === 0;

        // Update Next button state & label
        if (index === totalSlides - 1) {
            nextSlideBtn.innerHTML = `<i class="bi bi-check2-circle me-1"></i> Start Exploring`;
        } else {
            nextSlideBtn.innerHTML = `Next <i class="bi bi-arrow-right ms-1"></i>`;
        }

        // Scroll window back to top smoothly on slide change
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    // Listen to Bootstrap's slide event
    carouselEl.addEventListener('slide.bs.carousel', (e) => {
        syncStepperUI(e.to);
    });

    // Clickable top stepper pills
    stepPills.forEach((pill) => {
        pill.addEventListener('click', () => {
            const targetStep = parseInt(pill.getAttribute('data-step'), 10);
            tutorialCarousel.to(targetStep);
        });
    });

    // Bottom Previous / Next buttons
    prevSlideBtn.addEventListener('click', () => {
        if (activeSlideIndex > 0) {
            tutorialCarousel.prev();
        }
    });

    nextSlideBtn.addEventListener('click', () => {
        if (activeSlideIndex < totalSlides - 1) {
            tutorialCarousel.next();
        } else {
            smoothNavigate("./../main.html");
        }
    });

    // Keyboard Left / Right arrow support (ignore when typing in input fields)
    document.addEventListener('keydown', (e) => {
        const tag = document.activeElement.tagName.toLowerCase();
        if (tag === 'input' || tag === 'textarea') return;

        if (e.key === 'ArrowRight' && activeSlideIndex < totalSlides - 1) {
            tutorialCarousel.next();
        } else if (e.key === 'ArrowLeft' && activeSlideIndex > 0) {
            tutorialCarousel.prev();
        }
    });

    /* ==========================================================
       1. MODULE 1: INTERACTIVE MARS WEIGHT CALCULATOR
    ========================================================== */
    const weightInput = document.getElementById('earthWeightInput');
    const weightSlider = document.getElementById('earthWeightSlider');
    const toggleUnitBtn = document.getElementById('toggleUnitBtn');
    const unitLabel = document.getElementById('unitLabel');
    const marsWeightOutput = document.getElementById('marsWeightOutput');
    const marsUnitOutput = document.getElementById('marsUnitOutput');

    let isMetric = false;
    const MARS_GRAVITY_FACTOR = 0.38;

    function updateMarsWeight(val) {
        const numericVal = Math.max(0, parseFloat(val) || 0);
        const marsVal = (numericVal * MARS_GRAVITY_FACTOR).toFixed(1);
        marsWeightOutput.textContent = marsVal;
    }

    weightInput.addEventListener('input', (e) => {
        const val = e.target.value;
        if (val <= 400 && val >= 20) {
            weightSlider.value = val;
        }
        updateMarsWeight(val);
    });

    weightSlider.addEventListener('input', (e) => {
        weightInput.value = e.target.value;
        updateMarsWeight(e.target.value);
    });

    toggleUnitBtn.addEventListener('click', () => {
        let currentVal = parseFloat(weightInput.value) || 150;
        if (!isMetric) {
            currentVal = Math.round(currentVal * 0.453592);
            isMetric = true;
            unitLabel.textContent = 'kg';
            marsUnitOutput.textContent = 'kg';
            toggleUnitBtn.textContent = 'Switch to lbs';
            weightSlider.max = 200;
        } else {
            currentVal = Math.round(currentVal / 0.453592);
            isMetric = false;
            unitLabel.textContent = 'lbs';
            marsUnitOutput.textContent = 'lbs';
            toggleUnitBtn.textContent = 'Switch to kg';
            weightSlider.max = 400;
        }
        weightInput.value = currentVal;
        weightSlider.value = Math.min(weightSlider.max, currentVal);
        updateMarsWeight(currentVal);
    });

});

document.addEventListener('DOMContentLoaded', () => {
    const marsRoverImage = document.getElementById('marsRoverImage');
    const marsRoverImageCaption = document.getElementById('marsRoverImageCaption');
    if (!marsRoverImage || !marsRoverImageCaption) return;

    loadLatestMarsRoverImage(marsRoverImage, marsRoverImageCaption).catch(error => {
        console.error('Unable to load NASA Mars rover imagery:', error);
        marsRoverImage.alt = 'Rotating Mars animation shown because NASA rover imagery is unavailable';
        marsRoverImageCaption.textContent = 'NASA rover imagery is unavailable right now; showing the local Mars animation.';
    });
});

async function loadLatestMarsRoverImage(image, caption) {
    const currentYear = new Date().getUTCFullYear();
    const firstYear = currentYear - 5;
    const missions = ['Curiosity', 'Perseverance'];
    const collections = await Promise.all(missions.map(async mission => {
        try {
            const params = new URLSearchParams({
                q: `${mission} Mars rover`,
                media_type: 'image',
                year_start: String(firstYear),
                year_end: String(currentYear),
                page_size: '100'
            });
            const response = await fetch(`https://images-api.nasa.gov/search?${params.toString()}`);
            if (!response.ok) {
                throw new Error(`NASA Images API returned HTTP ${response.status}.`);
            }
            const result = await response.json();
            return result.collection && Array.isArray(result.collection.items)
                ? result.collection.items
                : [];
        } catch (error) {
            console.error(`Unable to search NASA's archive for ${mission}:`, error);
            return [];
        }
    }));

    const candidates = collections.flat().filter(item => {
        if (!item || !Array.isArray(item.data) || !item.data.length) return false;
        const metadata = item.data[0];
        const text = `${metadata.title || ''} ${metadata.description || ''}`;
        return metadata.center === 'JPL' && /\b(Curiosity|Perseverance)\b/i.test(text);
    }).sort((a, b) => Date.parse(b.data[0].date_created) - Date.parse(a.data[0].date_created));

    const latest = candidates[0];
    if (!latest) {
        throw new Error('No recent Curiosity or Perseverance images were found in the NASA archive.');
    }

    const metadata = latest.data[0];
    const imageLinks = (latest.links || []).filter(link =>
        link.render === 'image' && typeof link.href === 'string'
    );
    imageLinks.sort((a, b) =>
        Math.abs((a.width || 1280) - 1280) - Math.abs((b.width || 1280) - 1280)
    );
    if (!imageLinks.length) {
        throw new Error('The NASA archive entry has no image rendition.');
    }

    const imageUrl = new URL(imageLinks[0].href);
    if (imageUrl.protocol !== 'https:' || imageUrl.hostname !== 'images-assets.nasa.gov') {
        throw new Error('The NASA archive returned an unexpected image host.');
    }

    await new Promise((resolve, reject) => {
        const preview = new Image();
        preview.onload = resolve;
        preview.onerror = () => reject(new Error('The NASA image could not be loaded.'));
        preview.src = imageUrl.href;
    });

    image.src = imageUrl.href;
    image.alt = `NASA Mars rover image: ${metadata.title || 'rover view'}`;

    const date = metadata.date_created
        ? new Date(metadata.date_created).toLocaleDateString(undefined, {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            timeZone: 'UTC'
        })
        : 'date unavailable';
    const credit = metadata.secondary_creator || metadata.photographer || 'NASA/JPL-Caltech';
    caption.textContent = `Latest available archive image: ${metadata.title || 'Mars rover image'} — ${credit}; NASA archive entry: ${date}. `;

    const sourceLink = document.createElement('a');
    sourceLink.href = `https://images.nasa.gov/details/${encodeURIComponent(metadata.nasa_id)}`;
    sourceLink.target = '_blank';
    sourceLink.rel = 'noopener noreferrer';
    sourceLink.textContent = 'View on NASA Images';
    caption.append(sourceLink);
}

document.querySelectorAll('.image-link').forEach(link => {
    link.addEventListener('click', function (e) {
        e.preventDefault();

        const img = this.querySelector('img');

        img.classList.add('zooming');

        setTimeout(() => {
            window.location.href = this.href;
        }, 700);
    });
});

function smoothNavigate(url) {
    document.body.classList.add('fade-out');

    setTimeout(() => {
        window.location.href = url;
    }, 600);
}
document.querySelectorAll('.smooth-link').forEach(link => {
    link.addEventListener('click', function (e) {
        e.preventDefault();
        smoothNavigate(this.href);
    });
});

window.addEventListener('pageshow', () => {
    document.body.classList.remove('fade-out');
});