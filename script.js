document.addEventListener('DOMContentLoaded', function () {
    const bubblesContainer = document.querySelector('.bubbles-container');
    const numberOfBubbles = 25;

    for (let i = 0; i < numberOfBubbles; i++) {
        const bubble = document.createElement('div');
        bubble.classList.add('bubble');
        const size = Math.random() * 80 + 20; // Tamaño entre 20px y 100px
        bubble.style.width = `${size}px`;
        bubble.style.height = `${size}px`;
        bubble.style.left = `${Math.random() * 100}%`; // Posición horizontal aleatoria
        const duration = Math.random() * 15 + 10; // Duración de animación entre 10s y 25s
        bubble.style.animationDuration = `${duration}s`;
        const delay = Math.random() * 7; // Retraso de animación entre 0s y 7s
        bubble.style.animationDelay = `${delay}s`;
        bubblesContainer.appendChild(bubble);
    }
});

(function () {
    // ---------- CONSTANTES Y CONFIGURACIÓN ----------
    const LOCAL_STORAGE_KEY = 'mentalMovieData_v1';
    const THEME_STORAGE_KEY = 'mentalMovieTheme_v1';
    const MAX_FILE_MB = 5;
    const MAX_FILE_BYTES = MAX_FILE_MB * 1024 * 1024;

    // --- DEFINICIÓN DE RECURSOS PREDETERMINADOS ---
    const PRESET_IMAGES = [
        './assets/imagenes-default/img1.jpg', './assets/imagenes-default/img2.webp', './assets/imagenes-default/img3.jpg',
        './assets/imagenes-default/img4.webp', './assets/imagenes-default/img5.jpg', './assets/imagenes-default/img6.png',
        './assets/imagenes-default/img7.jpg', './assets/imagenes-default/img8.jpg', './assets/imagenes-default/img9.jpg',
        './assets/imagenes-default/img10.jpg'
    ];

    // ---------- ELEMENTOS DEL DOM ----------
    const welcomeScreen = document.getElementById('welcome-screen');
    const formScreen = document.getElementById('form-screen');
    const movieScreen = document.getElementById('movie-screen');
    const startBtn = document.getElementById('start-btn');
    const movieForm = document.getElementById('movie-form');
    const audioUpload = document.getElementById('audio-upload');
    const imageUpload = document.getElementById('image-upload');
    const imagePreviewContainer = document.getElementById('image-preview-container');

    const movieTitle = document.getElementById('movie-title');
    const movieDescription = document.getElementById('movie-description');
    const movieUserName = document.getElementById('movie-user-name');
    const movieUserAge = document.getElementById('movie-user-age');
    const movieGoal2 = document.getElementById('movie-goal-2y');
    const movieGoal5 = document.getElementById('movie-goal-5y');
    const movieGoal10 = document.getElementById('movie-goal-10y');
    const movieImageGallery = document.getElementById('movie-image-gallery');
    const movieAudioPlayer = document.getElementById('movie-audio-player');

    const newTaskForm = document.getElementById('new-task-form');
    const newTaskInput = document.getElementById('new-task-input');
    const taskListEl = document.getElementById('task-list');
    const progressBar = document.getElementById('progress-bar');
    const progressText = document.getElementById('progress-text');

    const exportPdfBtn = document.getElementById('export-pdf-btn');
    const deleteMovieBtn = document.getElementById('delete-movie-btn');
    const themeSelect = document.getElementById('theme-select');
    const modal = document.getElementById('image-modal');
    const modalImg = document.getElementById('modal-img');

    const playMovieModalBtn = document.getElementById('pelicula-mental');
    const carouselOverlay = document.getElementById('carousel-overlay');
    const carouselSlidesContainer = document.getElementById('carousel-slides-container');
    const carouselCloseBtn = document.getElementById('carousel-close');
    
    const achievementOverlay = document.getElementById('achievement-overlay');

    // ---------- ESTADO DE LA APLICACIÓN ----------
    let currentSlideIndex = 0;
    let slides = [];
    let carouselInterval = null;
    let currentData = null;
    let currentAudio = null;

    // ---------- UTILIDADES ----------
    function fileToDataUrl(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onerror = () => reject(new Error('Error leyendo el archivo'));
            reader.onload = () => resolve(reader.result);
            reader.readAsDataURL(file);
        });
    }

    function saveToLocalStorage(data) {
        try {
            localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(data));
        } catch (e) {
            console.error('Error guardando en localStorage', e);
            if (e.name === 'QuotaExceededError') {
               // alert('¡Error al guardar! El almacenamiento del navegador está lleno. Esto suele ocurrir si los archivos de audio o las imágenes son muy grandes. Intenta usar archivos más pequeños.');
            } else {
               // alert('No se pudo guardar la película mental. Ocurrió un error inesperado.');
            }
        }
    }

    function loadFromLocalStorage() {
        try {
            const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
            return raw ? JSON.parse(raw) : null;
        } catch (e) {
            console.error('Error leyendo localStorage', e);
            return null;
        }
    }

    function removeFromLocalStorage() {
        localStorage.removeItem(LOCAL_STORAGE_KEY);
    }

    function showScreen(screenEl) {
        [welcomeScreen, formScreen, movieScreen].forEach(s => s.classList.remove('active'));
        screenEl.classList.add('active');
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    // ---------- RENDERIZADO PRINCIPAL ----------
    function renderMovie(data) {
        if (!data) return;
        movieTitle.textContent = data.title || 'Sin título';
        movieDescription.textContent = data.description || '';
        movieUserName.textContent = data.userName || 'Anónimo';
        movieUserAge.textContent = data.userAge || '—';
        movieGoal2.textContent = data.goals?.['2y'] || 'Sin definir';
        movieGoal5.textContent = data.goals?.['5y'] || 'Sin definir';
        movieGoal10.textContent = data.goals?.['10y'] || 'Sin definir';

        movieAudioPlayer.innerHTML = '';
        if (data.audioDataUrl) {
            try {
                if (currentAudio) {
                    currentAudio.pause();
                    currentAudio.src = '';
                    currentAudio = null;
                }
                const audio = document.createElement('audio');
                audio.src = data.audioDataUrl;
                audio.controls = true;
                audio.loop = true;
                audio.setAttribute('aria-label', 'Reproductor de música de fondo');
                movieAudioPlayer.appendChild(audio);
                currentAudio = audio;
                audio.play().catch(() => {});
            } catch (e) {
                console.warn('No se pudo preparar audio', e);
            }
        }

        movieImageGallery.innerHTML = '';
        if (data.imageDataUrls && data.imageDataUrls.length) {
            data.imageDataUrls.forEach((url, i) => {
                const img = document.createElement('img');
                img.src = url;
                img.alt = `Imagen ${i + 1}`;
                img.tabIndex = 0;
                img.addEventListener('click', () => openImageModal(url));
                img.addEventListener('keydown', (ev) => { if (ev.key === 'Enter') openImageModal(url); });
                movieImageGallery.appendChild(img);
            });
        } else {
            movieImageGallery.innerHTML = '<p class="muted">No hay imágenes añadidas.</p>';
        }

        renderTasks(data.tasks || []);
        showScreen(movieScreen);
    }

    // ---------- GESTIÓN DE TAREAS ----------
    // REEMPLAZA ESTA FUNCIÓN COMPLETA
    function renderTasks(tasks) {
        taskListEl.innerHTML = '';
        tasks = tasks || [];
        tasks.forEach((task, index) => {
            const li = document.createElement('li');
            li.className = task.completed ? 'completed' : '';

            // Contenedor principal para checkbox, texto y botón de borrar
            const taskMain = document.createElement('div');
            taskMain.className = 'task-main';

            const checkbox = document.createElement('input');
            checkbox.type = 'checkbox';
            checkbox.checked = !!task.completed;
            checkbox.dataset.index = index;

            const span = document.createElement('span');
            span.className = 'task-text';
            span.textContent = task.text;

            const btnDel = document.createElement('button');
            btnDel.className = 'delete-task';
            btnDel.innerHTML = '&times;';
            btnDel.title = 'Eliminar tarea';
            btnDel.dataset.index = index;

            checkbox.addEventListener('change', onTaskToggle);
            btnDel.addEventListener('click', onTaskDelete);

            taskMain.appendChild(checkbox);
            taskMain.appendChild(span);
            taskMain.appendChild(btnDel);
            li.appendChild(taskMain);

            // Contenedor para detalles (fecha y notas), solo si existen
            if (task.dueDate || task.notes) {
                const detailsDiv = document.createElement('div');
                detailsDiv.className = 'task-details';

                if (task.dueDate) {
                    const dateSpan = document.createElement('span');
                    dateSpan.className = 'task-due-date';
                    
                    // Lógica para resaltar tareas vencidas
                    const taskDate = new Date(task.dueDate + 'T23:59:59'); // Considera el final del día
                    const today = new Date();

                    if (taskDate < today && !task.completed) {
                        dateSpan.classList.add('overdue');
                    }
                    
                    // Formateamos la fecha a un formato local legible
                    dateSpan.textContent = `Vence: ${new Date(task.dueDate + 'T00:00:00').toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' })}`;
                    detailsDiv.appendChild(dateSpan);
                }

                if (task.notes) {
                    const notesSpan = document.createElement('span');
                    notesSpan.className = 'task-notes';
                    notesSpan.textContent = `Notas: ${task.notes}`;
                    detailsDiv.appendChild(notesSpan);
                }
                li.appendChild(detailsDiv);
            }
            
            taskListEl.appendChild(li);
        });
        updateProgress(tasks);
    }

    function updateProgress(tasks) {
        tasks = tasks || [];
        const completed = tasks.filter(t => t.completed).length;
        const total = tasks.length;
        const percentage = total === 0 ? 0 : Math.round((completed / total) * 100); // Se esperaba ';'
        progressBar.style.width = `${percentage}%`;
        progressText.textContent = `${completed} de ${total} tareas completed (${percentage}%)`;
    }

    function onTaskToggle(e) {
        const idx = Number(e.target.dataset.index);
        if (!currentData || !Array.isArray(currentData.tasks) || !currentData.tasks[idx]) return;
        
        const taskItem = e.target.closest('li');
        const taskText = taskItem.querySelector('.task-text').textContent;

        currentData.tasks[idx].completed = e.target.checked;
        saveToLocalStorage(currentData);
        renderTasks(currentData.tasks);

        if (e.target.checked) {
            showAchievement(taskText);
        }
    }

    function onTaskDelete(e) {
        const idx = Number(e.target.dataset.index);
        if (!currentData || !Array.isArray(currentData.tasks)) return;
        currentData.tasks.splice(idx, 1);
        saveToLocalStorage(currentData);
        renderTasks(currentData.tasks);
    }

    // ---------- MANEJO DEL FORMULARIO ----------
    startBtn.addEventListener('click', () => showScreen(formScreen));

    audioUpload.addEventListener('change', async (ev) => {
        const file = ev.target.files[0];
        if (!file) return;
        if (file.size > MAX_FILE_BYTES) {
            alert(`El archivo supera el límite de ${MAX_FILE_MB} MB.`);
            audioUpload.value = '';
            return;
        }
        try {
            const dataUrl = await fileToDataUrl(file);
            if (!currentData) currentData = {};
            currentData.audioDataUrl = dataUrl;
            // Deseleccionar botones predeterminados
            document.querySelectorAll('.preset-audio-btn.selected').forEach(btn => btn.classList.remove('selected'));
        } catch (e) { console.error(e); alert('Error al procesar el audio.'); }
    });

    imageUpload.addEventListener('change', async (ev) => {
        const files = Array.from(ev.target.files || []);
        if (!files.length) return;
        for (const f of files) {
            if (f.size > MAX_FILE_BYTES) {
                alert(`El archivo "${f.name}" supera ${MAX_FILE_MB} MB y no se añadirá.`);
                return;
            }
        }
        imagePreviewContainer.innerHTML = 'Cargando...';
        try {
            const dataUrls = await Promise.all(files.map(fileToDataUrl));
            if (!currentData) currentData = {};
            currentData.imageDataUrls = (currentData.imageDataUrls || []).concat(dataUrls);
            renderImagePreviews(currentData.imageDataUrls);
        } catch (e) { console.error(e); alert('Error al procesar las imágenes.'); }
        finally { imageUpload.value = ''; }
    });

    function renderImagePreviews(urls) {
        imagePreviewContainer.innerHTML = '';
        urls = urls || [];
        urls.forEach(url => {
            const img = document.createElement('img');
            img.src = url;
            img.alt = 'Previsualización';
            img.addEventListener('click', () => openImageModal(url));
            imagePreviewContainer.appendChild(img);
        });
    }

    movieForm.addEventListener('submit', async (ev) => {
        ev.preventDefault();
        const name = document.getElementById('user-name').value.trim();
        const title = document.getElementById('form-title').value.trim();
        if (!name || !title) {
            alert('Por favor, completa los campos ¡Nombre y Título son obligatorios!');
            return;
        }

        let selectedAudioUrl = currentData?.audioDataUrl || null;
        if (!selectedAudioUrl) {
            const selectedBtn = document.querySelector('.preset-audio-btn.selected');
            if (selectedBtn) {
                selectedAudioUrl = selectedBtn.dataset.src;
            }
        }

        let selectedImageUrls = currentData?.imageDataUrls || [];
        const presetImages = document.querySelectorAll('.preset-image-gallery img.selected');
        presetImages.forEach(img => {
            if (!selectedImageUrls.includes(img.dataset.src)) {
                selectedImageUrls.push(img.dataset.src);
            }
        });

        const data = {
            userName: name,
            userAge: document.getElementById('user-age').value || '',
            title: title,
            description: document.getElementById('form-description').value || '',
            goals: {
                '2y': document.getElementById('goal-2y').value || '',
                '5y': document.getElementById('goal-5y').value || '',
                '10y': document.getElementById('goal-10y').value || ''
            },
            audioDataUrl: selectedAudioUrl,
            imageDataUrls: selectedImageUrls,
            tasks: (currentData && currentData.tasks) ? currentData.tasks : []
        };
        currentData = data;
        saveToLocalStorage(currentData);
        renderMovie(currentData);
    });

    newTaskForm.addEventListener('submit', (ev) => {
        ev.preventDefault();
        const text = newTaskInput.value.trim();
        if (!text) return;

        // Obtenemos los nuevos valores
        const dueDate = document.getElementById('new-task-date').value;
        const notes = document.getElementById('new-task-notes').value.trim();

        if (!currentData) currentData = { tasks: [] };
        currentData.tasks = currentData.tasks || [];
        
        // Guardamos el nuevo objeto de tarea con toda la información
        currentData.tasks.push({ text, completed: false, dueDate, notes });
        
        saveToLocalStorage(currentData);
        renderTasks(currentData.tasks);
        
        // Limpia todos los campos del formulario de tareas a la vez
        newTaskForm.reset(); 
    });

    // ---------- MODALES Y CONTROLES GENERALES ----------
    function openImageModal(url) {
        modal.classList.add('active');
        modalImg.src = url;
    }
    modal.addEventListener('click', () => {
        modal.classList.remove('active');
        modalImg.src = '';
    });

    exportPdfBtn.addEventListener('click', () => window.print());

    deleteMovieBtn.addEventListener('click', () => {
        if (!confirm('¿Seguro que deseas eliminar tu película mental? Esta acción no se puede deshacer.')) return;
        if (currentAudio) {
            currentAudio.pause(); // Detiene la reproducción inmediatamente
            currentAudio.src = ''; // Libera el archivo de la memoria del reproductor
            currentAudio = null;   // Elimina la referencia al objeto de audio
        }
        removeFromLocalStorage();
        currentData = null;
        // Limpiar toda la UI
        movieForm.reset();
        imagePreviewContainer.innerHTML = '';
        document.querySelectorAll('.preset-audio-btn.selected, .preset-image-gallery img.selected').forEach(el => el.classList.remove('selected'));
        showScreen(welcomeScreen);
    });

    // ---------- LÓGICA DEL CARRUSEL AUTOMÁTICO ----------
    function createTextSlide(title, content) {
        const slide = document.createElement('div');
        slide.className = 'carousel-slide';
        const safeContent = document.createElement('div');
        safeContent.textContent = content;
        slide.innerHTML = `<div class="slide-title">${title}</div><div class="slide-content">${safeContent.innerHTML.replace(/\n/g, '<br>')}</div>`;
        return slide;
    }

    function buildCarousel() {
            carouselSlidesContainer.innerHTML = '';
            slides = [];
    
            if (currentData) {
                if (currentData.title) slides.push(createTextSlide('El Título de tu Película', currentData.title));
                if (currentData.description) slides.push(createTextSlide('Tu Visión', currentData.description));
                if (currentData.userName) slides.push(createTextSlide('Creada por', currentData.userName));
                if (currentData.goals?.['2y']) slides.push(createTextSlide('Metas a 2 Años', currentData.goals['2y']));
                if (currentData.goals?.['5y']) slides.push(createTextSlide('Metas a 5 Años', currentData.goals['5y']));
                if (currentData.goals?.['10y']) slides.push(createTextSlide('Metas a 10 Años', currentData.goals['10y']));
    
                if (currentData.imageDataUrls && currentData.imageDataUrls.length > 0) {
                    currentData.imageDataUrls.forEach(url => {
                        const slide = document.createElement('div');
                        slide.className = 'carousel-slide';
                        slide.innerHTML = `<img src="${url}" alt="Imagen de tu película mental">`;
                        slides.push(slide);
                    });
                }
            }
    
            if (slides.length === 0) {
                slides.push(createTextSlide('Película Mental Vacía', 'Aún no has añadido contenido.'));
            }
    
            const quoteSlide = document.createElement('div');
            quoteSlide.className = 'carousel-slide carousel-quote-slide';
            quoteSlide.innerHTML = `<h2>Tu Futuro es Tuyo</h2><p>Nunca dejes de soñar. Cada paso que das hoy está construyendo la realidad que deseas mañana.</p>`;
            slides.push(quoteSlide);
            
            slides.forEach(slide => carouselSlidesContainer.appendChild(slide));
        }

    function showSlide(index) {
        slides.forEach((slide, i) => {
            slide.classList.toggle('active', i === index);
        });
    }
    
    function openCarousel() {
        buildCarousel();
        if (slides.length === 0) return;
        currentSlideIndex = 0;
        showSlide(currentSlideIndex);
        carouselOverlay.classList.add('active');
        
        if (carouselInterval) clearInterval(carouselInterval);
        carouselInterval = setInterval(() => {
            currentSlideIndex = (currentSlideIndex + 1) % slides.length;
            showSlide(currentSlideIndex);
        }, 5000);

        if (currentAudio && currentAudio.paused) {
            currentAudio.play().catch(() => {});
        }
    }

    function closeCarousel() {
        carouselOverlay.classList.remove('active');
        clearInterval(carouselInterval);
        carouselInterval = null;
    }

    playMovieModalBtn.addEventListener('click', openCarousel);
    carouselCloseBtn.addEventListener('click', closeCarousel);
    carouselOverlay.addEventListener('click', (e) => {
        if (e.target === carouselOverlay) closeCarousel();
    });
    
    // ---------- SISTEMA DE LOGROS / HITOS ----------
    function showAchievement(taskText) {
        const achievementTextEl = document.getElementById('achievement-text');
        achievementTextEl.textContent = `¡Felicidades! Has completado: "${taskText}"`;
        achievementOverlay.classList.add('active');
 
        setTimeout(() => {
            achievementOverlay.classList.remove('active');
        }, 4000);
    }

    // ---------- INICIALIZACIÓN DE FUNCIONALIDADES NUEVAS ----------
    function initializePresetSelectors() {
        const presetAudioBtns = document.querySelectorAll('.preset-audio-btn');
        const presetImageGallery = document.getElementById('preset-image-gallery');

        PRESET_IMAGES.forEach(src => {
            const img = document.createElement('img');
            img.src = src;
            img.dataset.src = src;
            img.alt = "Imagen predeterminada";
            presetImageGallery.appendChild(img);
        });
        const presetImages = presetImageGallery.querySelectorAll('img');

        presetAudioBtns.forEach(button => {
            button.addEventListener('click', () => {
                if (button.classList.contains('selected')) {
                    button.classList.remove('selected');
                    return;
                }
                presetAudioBtns.forEach(btn => btn.classList.remove('selected'));
                button.classList.add('selected');
                audioUpload.value = '';
                if (currentData) currentData.audioDataUrl = null;
            });
        });

        presetImages.forEach(img => {
            img.addEventListener('click', () => {
                img.classList.toggle('selected');
            });
        });
    }

    function initializeMovieNav() {
        const navButtons = document.querySelectorAll('.movie-nav button');
        const moviePanels = document.querySelectorAll('.movie-panel');

        navButtons.forEach(button => {
            button.addEventListener('click', () => {
                const targetPanelId = button.dataset.target;
                const targetPanel = document.getElementById(targetPanelId);

                navButtons.forEach(btn => btn.classList.remove('active'));
                button.classList.add('active');

                moviePanels.forEach(panel => panel.classList.remove('active'));
                
                if (targetPanel) {
                    targetPanel.classList.add('active');
                    targetPanel.classList.remove('animate_animated', 'animate_fadeInUp');
                    void targetPanel.offsetWidth; 
                    targetPanel.classList.add('animate_animated', 'animate_fadeInUp');
                }
            });
        });
    }

    function initializeEditableComponents() {
        const changeAudioBtn = document.getElementById('change-audio-btn');
        const audioUpdater = document.getElementById('audio-updater');
        const addImagesBtn = document.getElementById('add-images-btn');
        const imageUpdater = document.getElementById('image-updater');

        changeAudioBtn.addEventListener('click', () => audioUpdater.click());
        audioUpdater.addEventListener('change', async (event) => {
            const file = event.target.files[0];
            if (!file || !currentData) return;
            if (file.size > MAX_FILE_BYTES) {
                alert(`El archivo de audio supera el límite de ${MAX_FILE_MB} MB.`);
                return;
            }
            try {
                const dataUrl = await fileToDataUrl(file);
                currentData.audioDataUrl = dataUrl;
                saveToLocalStorage(currentData);
                renderMovie(currentData);
                alert('¡Música actualizada con éxito!');
            } catch (e) { alert('Hubo un error al procesar el nuevo audio.'); }
        });

        addImagesBtn.addEventListener('click', () => imageUpdater.click());
        imageUpdater.addEventListener('change', async (event) => {
            const files = Array.from(event.target.files);
            if (!files.length || !currentData) return;
            for (const f of files) {
                if (f.size > MAX_FILE_BYTES) {
                    alert(`La imagen "${f.name}" supera ${MAX_FILE_MB}MB y no se añadirá.`);
                    return;
                }
            }
            try {
                const dataUrls = await Promise.all(files.map(fileToDataUrl));
                currentData.imageDataUrls = (currentData.imageDataUrls || []).concat(dataUrls);
                saveToLocalStorage(currentData);
                renderMovie(currentData); 
                alert(`¡Se añadieron ${files.length} imagen(es) nuevas!`);
            } catch(e) { alert('Hubo un error al procesar las nuevas imágenes.'); }
            finally { imageUpdater.value = ''; }
        });
    }
    
    function initializeInspirationPanel() {
        const generateReflectionBtn = document.getElementById('generate-reflection-btn');
        const reflectionBox = document.getElementById('reflection-box');
        const reflections = [
            "Tu película mental no es solo un sueño; es el guion de tu futuro. Cada día, tienes la oportunidad de filmar una nueva escena. ¡Acción!",
            "La distancia entre tus sueños y la realidad se llama acción. No esperes el momento perfecto, toma el momento y hazlo perfecto.",
            "Recuerda que los grandes robles fueron una vez pequeñas bellotas. Tu gran sueño se construye con las pequeñas acciones que realizas hoy.",
            "No dejes que el ruido de las opiniones ajenas ahogue tu voz interior. Tu visión es única y el mundo está esperando ver tu película. ¡Créetelo!",
            "El universo no conspira a favor de los que solo desean, sino de los que actúan. Tu película mental es el mapa; tus acciones son el combustible. ¡Avanza!"
        ];
        let lastReflectionIndex = -1;
        generateReflectionBtn.addEventListener('click', () => {
            let randomIndex;
            do {
                randomIndex = Math.floor(Math.random() * reflections.length);
            } while (reflections.length > 1 && randomIndex === lastReflectionIndex);
            lastReflectionIndex = randomIndex;
            const selectedReflection = reflections[randomIndex];
            reflectionBox.classList.remove('animate_animated', 'animate_fadeIn');
            void reflectionBox.offsetWidth;
            reflectionBox.textContent = selectedReflection;
            reflectionBox.classList.add('animate_animated', 'animate_fadeIn');
        });
    }

    // ---------- ARRANQUE DE LA APLICACIÓN ----------
    function initializeApp() {
        applySavedTheme();
        initializePresetSelectors();
        initializeMovieNav();
        initializeEditableComponents();
        initializeInspirationPanel();
        initializeVisionCardExporter();

        const saved = loadFromLocalStorage();
        if (saved) {
            currentData = saved;
            renderMovie(saved);
        } else {
            showScreen(welcomeScreen);
        }
    }

    function applySavedTheme() {
        const saved = localStorage.getItem(THEME_STORAGE_KEY) || 'light';
        document.documentElement.setAttribute('data-theme', saved);
        themeSelect.value = saved;
    }

    themeSelect.addEventListener('change', (e) => {
        const val = e.target.value;
        document.documentElement.setAttribute('data-theme', val);
        localStorage.setItem(THEME_STORAGE_KEY, val);
    });

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            if (modal.classList.contains('active')) modal.click();
            if (carouselOverlay.classList.contains('active')) closeCarousel();
        }
    });

// REEMPLAZA LA FUNCIÓN ANTIGUA COMPLETA CON ESTA VERSIÓN FINAL Y MÓVIL-COMPATIBLE
function initializeVisionCardExporter() {
    const exportBtn = document.getElementById('export-vision-card-btn');
    if (!exportBtn) return;

    // --- NUEVO: Función para detectar si es un dispositivo móvil ---
    function isMobileDevice() {
        return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    }

    exportBtn.addEventListener('click', () => {
        if (!currentData) {
            alert('Crea tu película mental antes de exportar una tarjeta.');
            return;
        }

        const template = document.getElementById('vision-card-template');
        const originalButtonText = exportBtn.textContent;
        const imagesContainer = document.getElementById('card-images');

        // --- PASO 1: Preparar la plantilla y dar feedback ---
        exportBtn.disabled = true;
        exportBtn.textContent = 'Generando...';

        const imageToExport = currentData.imageDataUrls[0];
        if (!imageToExport) {
            alert("Añade al menos una imagen a tu película para generar una tarjeta.");
            exportBtn.disabled = false;
            exportBtn.textContent = originalButtonText;
            return;
        }

        template.innerHTML = `
            <img id="card-bg-image" />
            <div id="card-overlay"></div>
            <div id="card-content">
                <header class="card-header"><h2 id="card-header-title"></h2></header>
                <main class="card-main"><p id="card-main-goal"></p></main>
                <footer class="card-footer"><span class="creator"></span> | <span class="app-name">Generado con Mi Película Mental</span></footer>
            </div>
        `;

        document.querySelector('#card-header-title').textContent = currentData.title || "Mi Gran Sueño";
        document.querySelector('.creator').textContent = `Creado por: ${currentData.userName || "Anónimo"}`;
        document.querySelector('#card-main-goal').textContent = `${currentData.goals['5y'] || currentData.description || 'El futuro es brillante.'}`;

        // --- PASO 2: Cargar la imagen de fondo ---
        const backgroundImageElement = document.querySelector('#card-bg-image');
        const promise = new Promise((resolve, reject) => {
            backgroundImageElement.crossOrigin = "anonymous";
            backgroundImageElement.onload = () => resolve();
            backgroundImageElement.onerror = () => reject(new Error('No se pudo cargar la imagen de fondo.'));
            backgroundImageElement.src = imageToExport;
        });

        // --- PASO 3: Ejecutar html2canvas y aplicar la estrategia correcta ---
        promise.then(() => {
            setTimeout(() => {
                html2canvas(template, { useCORS: true, scale: 2 }).then(canvas => {
                    const imageUrl = canvas.toDataURL('image/png');

                    // ===== LA SOLUCIÓN ESTÁ AQUÍ =====
                    if (isMobileDevice()) {
                        // *Estrategia para Móviles:*
                        // 1. Abrimos una nueva pestaña.
                        const newTab = window.open();
                        // 2. Escribimos en esa pestaña una etiqueta <img> con la imagen generada.
                        newTab.document.write(`<body style="margin:0; background:black;"><img src="${imageUrl}" style="width:100%; height:auto;" /></body>`);
                        // 3. El usuario ahora puede guardar la imagen de forma nativa.
                        
                    } else {
                        // *Estrategia para Escritorio:*
                        // Creamos el enlace y simulamos el clic para descargar.
                        const link = document.createElement('a');
                        link.href = imageUrl;
                        link.download = 'mi-tarjeta-de-vision.png';
                        link.click();
                    }
                    
                }).catch(err => {
                    console.error("Error final en html2canvas:", err);
                    alert("Hubo un error al generar la imagen. Inténtalo de nuevo.");
                }).finally(() => {
                    exportBtn.disabled = false;
                    exportBtn.textContent = originalButtonText;
                    template.innerHTML = '';
                });
            }, 100);
        }).catch(err => {
            console.error("Error crítico al cargar la imagen:", err);
            alert("Hubo un error al cargar la imagen de fondo. Asegúrate de que sea válida.");
            exportBtn.disabled = false;
            exportBtn.textContent = originalButtonText;
        });
    });
}

    initializeApp();
})();