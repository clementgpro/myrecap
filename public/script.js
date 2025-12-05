/**
 * SPOTIFY WRAPPED-STYLE SCROLL EXPERIENCE
 * =========================================
 * A minimal vanilla JS implementation for a mobile-first scroll story
 * with password protection and Google Drive-hosted media.
 */

// ========================================
// CONFIGURATION
// ========================================

const CONFIG = {
    PASSWORD: 'moncadeau', // Change this to your desired password
    SESSION_KEY: 'wrapped_authenticated',
    RECAP_JSON_PATH: 'recap.json'
};

// ========================================
// DOM ELEMENTS
// ========================================

const elements = {
    passwordScreen: document.getElementById('password-screen'),
    passwordForm: document.getElementById('password-form'),
    passwordInput: document.getElementById('password-input'),
    passwordError: document.getElementById('password-error'),
    wrappedContent: document.getElementById('wrapped-content'),
    slidesContainer: document.getElementById('slides-container'),
    loading: document.getElementById('loading'),
    loadingText: document.getElementById('loading-text'),
    loadingProgressBar: document.getElementById('loading-progress-bar'),
    progressFill: document.getElementById('progress-fill'),
    navHint: document.getElementById('nav-hint')
};

// ========================================
// PASSWORD AUTHENTICATION
// ========================================

/**
 * Check if user is already authenticated in this session
 */
function checkAuthentication() {
    const isAuthenticated = sessionStorage.getItem(CONFIG.SESSION_KEY);

    if (isAuthenticated === 'true') {
        hidePasswordScreen();
        loadRecap();
    } else {
        showPasswordScreen();
    }
}

/**
 * Handle password form submission
 */
elements.passwordForm.addEventListener('submit', (e) => {
    e.preventDefault();

    const enteredPassword = elements.passwordInput.value.trim();

    if (enteredPassword === CONFIG.PASSWORD) {
        // Correct password
        sessionStorage.setItem(CONFIG.SESSION_KEY, 'true');
        hidePasswordScreen();
        loadRecap();
        elements.passwordError.textContent = '';
        elements.passwordError.classList.remove('show');
    } else {
        // Incorrect password
        showError('Mot de passe incorrect. Réessayez.');
        elements.passwordInput.value = '';
        elements.passwordInput.focus();

        // Shake animation
        elements.passwordForm.style.animation = 'none';
        setTimeout(() => {
            elements.passwordForm.style.animation = 'shake 0.5s';
        }, 10);
    }
});

// Add shake animation dynamically
const style = document.createElement('style');
style.textContent = `
    @keyframes shake {
        0%, 100% { transform: translateX(0); }
        25% { transform: translateX(-10px); }
        75% { transform: translateX(10px); }
    }
`;
document.head.appendChild(style);

function showPasswordScreen() {
    elements.passwordScreen.classList.remove('hidden');
    elements.wrappedContent.classList.add('hidden');
}

function hidePasswordScreen() {
    elements.passwordScreen.classList.add('hidden');
}

function showError(message) {
    elements.passwordError.textContent = message;
    elements.passwordError.classList.add('show');
}

// ========================================
// MEDIA PRELOADING SYSTEM
// ========================================

/**
 * Preload a single image
 * @param {string} src - Image URL
 * @returns {Promise} Resolves when image is loaded
 */
function preloadImage(src) {
    return new Promise((resolve, reject) => {
        const img = new Image();

        img.onload = () => {
            console.log(`✅ Image loaded: ${src.substring(0, 50)}...`);
            resolve(img);
        };

        img.onerror = (error) => {
            console.warn(`⚠️ Image failed to load: ${src.substring(0, 50)}...`);
            // Resolve anyway to not block the entire loading process
            resolve(null);
        };

        img.src = src;
    });
}

/**
 * Preload a single video
 * @param {string} src - Video URL
 * @returns {Promise} Resolves when video metadata and initial data are loaded
 */
function preloadVideo(src) {
    return new Promise((resolve, reject) => {
        const video = document.createElement('video');
        video.preload = 'auto';
        video.muted = true;

        // Listen for the loadeddata event (enough data to start playing)
        video.addEventListener('loadeddata', () => {
            console.log(`✅ Video loaded: ${src.substring(0, 50)}...`);
            resolve(video);
        }, { once: true });

        video.addEventListener('error', (error) => {
            console.warn(`⚠️ Video failed to load: ${src.substring(0, 50)}...`);
            // Resolve anyway to not block the entire loading process
            resolve(null);
        }, { once: true });

        // Set source and start loading
        video.src = src;
        video.load();
    });
}

/**
 * Preload all media assets from slides data
 * @param {Array} slides - Array of slide objects
 * @returns {Promise} Resolves when all assets are preloaded
 */
async function preloadAllMedia(slides) {
    console.log(`📦 Starting preload of ${slides.length} media assets...`);

    let loadedCount = 0;
    const totalCount = slides.length;

    // Update initial progress
    updateLoadingProgress(0, totalCount);

    // Create an array of preload promises with progress tracking
    const preloadPromises = slides.map((slide, index) => {
        const loadPromise = slide.type === 'image'
            ? preloadImage(slide.src)
            : slide.type === 'video'
            ? preloadVideo(slide.src)
            : Promise.resolve(null);

        // Update progress after each asset loads
        return loadPromise.then(result => {
            loadedCount++;
            updateLoadingProgress(loadedCount, totalCount);
            console.log(`📊 Progress: ${loadedCount}/${totalCount}`);
            return result;
        });
    });

    // Wait for all assets to be preloaded
    try {
        await Promise.all(preloadPromises);
        console.log('✅ All media assets preloaded successfully!');
    } catch (error) {
        console.error('Error during preloading:', error);
        // Continue anyway - some assets may have loaded
    }
}

/**
 * Update the loading progress bar and text
 * @param {number} loaded - Number of assets loaded
 * @param {number} total - Total number of assets
 */
function updateLoadingProgress(loaded, total) {
    const percentage = Math.round((loaded / total) * 100);

    if (elements.loadingProgressBar) {
        elements.loadingProgressBar.style.width = `${percentage}%`;
    }

    if (elements.loadingText) {
        if (loaded === 0) {
            elements.loadingText.textContent = 'Chargement...';
        } else if (loaded < total) {
            elements.loadingText.textContent = `Chargement ${loaded}/${total} médias...`;
        } else {
            elements.loadingText.textContent = 'Préparation...';
        }
    }
}

// ========================================
// LOADING RECAP DATA
// ========================================

/**
 * Load and parse the recap.json file, preload all assets, then display content
 */
async function loadRecap() {
    showLoading();

    try {
        // Step 1: Fetch recap.json
        console.log('📄 Fetching recap.json...');
        const response = await fetch(CONFIG.RECAP_JSON_PATH);

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const slides = await response.json();

        if (!Array.isArray(slides) || slides.length === 0) {
            throw new Error('Invalid recap data: expected non-empty array');
        }

        console.log(`✅ Recap data loaded: ${slides.length} slides`);

        // Step 2: Preload all media assets BEFORE rendering
        await preloadAllMedia(slides);

        // Step 3: Render slides (now that assets are preloaded)
        console.log('🎨 Rendering slides...');
        renderSlides(slides);

        // Step 4: Initialize scroll handlers and animations
        initScrollHandlers();

        // Step 5: Hide loading screen and show content
        hideLoading();
        showWrappedContent();

        console.log('🎉 Wrapped experience ready!');

    } catch (error) {
        console.error('Error loading recap:', error);
        hideLoading();
        alert('Erreur lors du chargement du récap. Veuillez réessayer.');
    }
}

function showLoading() {
    elements.loading.classList.remove('hidden');
}

function hideLoading() {
    elements.loading.classList.add('hidden');
}

function showWrappedContent() {
    elements.wrappedContent.classList.remove('hidden');
}

// ========================================
// RENDERING SLIDES
// ========================================

/**
 * Create HTML for all slides and inject into the DOM
 * @param {Array} slides - Array of slide objects from recap.json
 */
function renderSlides(slides) {
    const slidesHTML = slides.map((slide, index) => createSlideHTML(slide, index)).join('');
    elements.slidesContainer.innerHTML = slidesHTML;

    // Setup videos to autoplay when in view
    setupVideoAutoplay();
}

/**
 * Create HTML for a single slide
 * @param {Object} slide - Slide object with type, src, and text
 * @param {number} index - Slide index
 */
function createSlideHTML(slide, index) {
    const mediaHTML = slide.type === 'video'
        ? createVideoHTML(slide.src, index)
        : createImageHTML(slide.src, index);

    return `
        <div class="slide" data-slide-index="${index}">
            ${mediaHTML}
            <div class="slide-overlay"></div>
            <div class="slide-content" data-animate>
                <p class="slide-text">${escapeHTML(slide.text)}</p>
            </div>
        </div>
    `;
}

/**
 * Create HTML for an image element
 */
function createImageHTML(src, index) {
    return `
        <img 
            class="slide-media" 
            src="${escapeHTML(src)}" 
            alt="Slide ${index + 1}"
            loading="lazy"
        >
    `;
}

/**
 * Create HTML for a video element
 */
function createVideoHTML(src, index) {
    return `
        <video 
            class="slide-media" 
            src="${escapeHTML(src)}"
            playsinline
            muted
            loop
            data-video-index="${index}"
        ></video>
    `;
}

/**
 * Escape HTML to prevent XSS attacks
 */
function escapeHTML(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
}

// ========================================
// INTERSECTION OBSERVER FOR ANIMATIONS
// ========================================

/**
 * Setup IntersectionObserver to animate text when slides come into view
 */
function initScrollHandlers() {
    // Animate text content
    const observerOptions = {
        root: elements.slidesContainer,
        threshold: 0.5,
        rootMargin: '0px'
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
            }
        });
    }, observerOptions);

    // Observe all elements with data-animate attribute
    const animatedElements = elements.slidesContainer.querySelectorAll('[data-animate]');
    animatedElements.forEach(el => observer.observe(el));

    // Update progress bar on scroll
    elements.slidesContainer.addEventListener('scroll', updateProgress);

    // Hide navigation hint after first scroll
    let hasScrolled = false;
    elements.slidesContainer.addEventListener('scroll', () => {
        if (!hasScrolled) {
            hasScrolled = true;
            elements.navHint.classList.add('hidden');
        }
    }, { once: true });
}

/**
 * Update progress bar based on scroll position
 */
function updateProgress() {
    const container = elements.slidesContainer;
    const scrollHeight = container.scrollHeight - container.clientHeight;
    const scrolled = container.scrollTop;
    const progress = (scrolled / scrollHeight) * 100;

    elements.progressFill.style.width = `${Math.min(progress, 100)}%`;
}

// ========================================
// VIDEO AUTOPLAY MANAGEMENT
// ========================================

/**
 * Setup IntersectionObserver for video autoplay
 * Videos play when 50% visible and pause when out of view
 */
function setupVideoAutoplay() {
    const videos = elements.slidesContainer.querySelectorAll('video');

    const videoObserverOptions = {
        root: elements.slidesContainer,
        threshold: 0.5
    };

    const videoObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            const video = entry.target;

            if (entry.isIntersecting) {
                // Play video when in view
                video.play().catch(err => {
                    console.log('Video autoplay prevented:', err);
                });
            } else {
                // Pause video when out of view
                video.pause();
            }
        });
    }, videoObserverOptions);

    videos.forEach(video => videoObserver.observe(video));
}

// ========================================
// INITIALIZATION
// ========================================

/**
 * Initialize the application when DOM is ready
 */
document.addEventListener('DOMContentLoaded', () => {
    checkAuthentication();
});

// ========================================
// HELPER COMMENTS FOR GOOGLE DRIVE LINKS
// ========================================

/**
 * HOW TO GET GOOGLE DRIVE DIRECT LINKS
 * =====================================
 *
 * 1. Upload your image/video to Google Drive
 *
 * 2. Right-click the file → Share → Change to "Anyone with the link"
 *
 * 3. Copy the sharing link. It looks like:
 *    https://drive.google.com/file/d/1ABC123xyz456/view?usp=sharing
 *
 * 4. Extract the FILE_ID (the part between /d/ and /view):
 *    FILE_ID = 1ABC123xyz456
 *
 * 5. For IMAGES, use this format in recap.json:
 *    https://drive.google.com/uc?export=view&id=FILE_ID
 *
 * 6. For VIDEOS, use this format in recap.json:
 *    https://drive.google.com/uc?export=download&id=FILE_ID
 *
 * EXAMPLE:
 * --------
 * Original link: https://drive.google.com/file/d/1ABC123xyz456/view?usp=sharing
 * FILE_ID: 1ABC123xyz456
 *
 * For image: https://drive.google.com/uc?export=view&id=1ABC123xyz456
 * For video: https://drive.google.com/uc?export=download&id=1ABC123xyz456
 *
 * NOTE: Large videos may not work well with Google Drive direct links.
 * Consider using a CDN or video hosting service for videos > 100MB.
 */

