document.addEventListener('DOMContentLoaded', function () {
            const bubblesContainer = document.querySelector('.bubbles-container');
            const numberOfBubbles = 25;

            for (let i = 0; i < numberOfBubbles; i++) {
                const bubble = document.createElement('div');
                bubble.classList.add('bubble');
                const size = Math.random() * 80 + 20;
                const left = Math.random() * 100;
                bubble.style.width = `${size}px`;
                bubble.style.height = `${size}px`;
                bubble.style.left = `${left}%`;
                const duration = Math.random() * 15 + 10;
                bubble.style.animationDuration = `${duration}s`;
                const delay = Math.random() * 7;
                bubble.style.animationDelay = `${delay}s`;
                bubblesContainer.appendChild(bubble);
            }
        });

    (function () {
        const LOCAL_STORAGE_KEY = 'mentalMovieData_v1';
        const THEME_STORAGE_KEY = 'mentalMovieTheme_v1';
        const MAX_FILE_MB = 5;
        const MAX_FILE_BYTES = MAX_FILE_MB * 1024 * 1024;

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
        const downloadAllJsonBtn = document.getElementById('download-all-json-btn');
        const downloadJsonBtn = document.getElementById('download-json-btn');
        const themeSelect = document.getElementById('theme-select');
        const modal = document.getElementById('image-modal');
        const modalImg = document.getElementById('modal-img');

        const playMovieModalBtn = document.getElementById('pelicula-mental');
        const carouselOverlay = document.getElementById('carousel-overlay');
        const carouselSlidesContainer = document.getElementById('carousel-slides-container');
        const carouselCloseBtn = document.getElementById('carousel-close');
        
        let currentSlideIndex = 0;
        let slides = [];
        let carouselInterval = null; // Para controlar el ciclo automático

        let currentData = null;
        let currentAudio = null;

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
                if (e.name === 'QuotaExceededError' || (e.code && (e.code === 22 || e.code === 1014))) {
                    //alert('¡Error al guardar! El almacenamiento del navegador está lleno. Esto suele ocurrir si los archivos de audio o las imágenes son muy grandes. Intenta usar archivos más pequeños o menos imágenes.');
                } else {
                    //alert('No se pudo guardar la película mental. Ocurrió un error inesperado.');
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

        // ---------- RENDERIZADO DE LA "PELÍCULA" (FUNCIÓN CORREGIDA) ----------
        function renderMovie(data) {
            if (!data) return;
            movieTitle.textContent = data.title || 'Sin título';
            movieDescription.textContent = data.description || '';
            movieUserName.textContent = data.userName || 'Anónimo';
            movieUserAge.textContent = data.userAge || '—';
            movieGoal2.textContent = data.goals?.['2y'] || 'Sin definir';
            movieGoal5.textContent = data.goals?.['5y'] || 'Sin definir';
            movieGoal10.textContent = data.goals?.['10y'] || 'Sin definir';

            // audio
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
                    audio.play().catch(() => { /* autoplay bloqueado */ });
                } catch (e) {
                    console.warn('No se pudo preparar audio', e);
                }
            }

            // galería
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
                // LA LÍNEA PROBLEMÁTICA HA SIDO ELIMINADA DE AQUÍ
            } else {
                movieImageGallery.innerHTML = '<p class="muted">No hay imágenes añadidas.</p>';
            }

            // tareas
            renderTasks(data.tasks || []);

            // mostrar pantalla película
            showScreen(movieScreen);
        }

        function renderTasks(tasks) {
            taskListEl.innerHTML = '';
            tasks = tasks || [];
            tasks.forEach((task, index) => {
                const li = document.createElement('li');
                li.className = task.completed ? 'completed' : '';
                const checkbox = document.createElement('input');
                checkbox.type = 'checkbox';
                checkbox.checked = !!task.completed;
                checkbox.setAttribute('aria-label', 'Marcar tarea ' + task.text);
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
                li.appendChild(checkbox);
                li.appendChild(span);
                li.appendChild(btnDel);
                taskListEl.appendChild(li);
            });
            updateProgress(tasks);
        }

        function updateProgress(tasks) {
            const completed = tasks.filter(t => t.completed).length;
            const total = tasks.length;
            const percentage = total === 0 ? 0 : Math.round((completed / total) * 100);
            progressBar.style.width = percentage + '%';
            progressText.textContent = completed + ' de ' + total + ' tareas completadas (' + percentage + '%)';
        }

        function onTaskToggle(e) {
            const idx = Number(e.target.dataset.index);
            if (!currentData || !Array.isArray(currentData.tasks) || !currentData.tasks[idx]) return;
            currentData.tasks[idx].completed = e.target.checked;
            saveToLocalStorage(currentData);
            renderTasks(currentData.tasks);
        }
        function onTaskDelete(e) {
            const idx = Number(e.target.dataset.index);
            if (!currentData || !Array.isArray(currentData.tasks)) return;
            currentData.tasks.splice(idx, 1);
            saveToLocalStorage(currentData);
            renderTasks(currentData.tasks);
        }

        startBtn.addEventListener('click', () => showScreen(formScreen));

        audioUpload.addEventListener('change', async (ev) => {
            const file = ev.target.files[0];
            if (!file) return;
            if (file.size > MAX_FILE_BYTES) {
                alert('El archivo supera el límite de ' + MAX_FILE_MB + ' MB. Elige otro archivo.');
                audioUpload.value = '';
                return;
            }
            try {
                const dataUrl = await fileToDataUrl(file);
                if (!currentData) currentData = {};
                currentData.audioDataUrl = dataUrl;
            } catch (e) { console.error(e); alert('Error al procesar el audio.'); }
        });

        imageUpload.addEventListener('change', async (ev) => {
            const files = Array.from(ev.target.files || []);
            if (!files.length) return;
            const validFiles = files.filter(f => f.size <= MAX_FILE_BYTES);
            const skipped = files.length - validFiles.length;
            if (skipped > 0) {
                alert('Se han omitido ' + skipped + ' archivos que excedían el límite de ' + MAX_FILE_MB + ' MB.');
            }
            if (!validFiles.length) { imageUpload.value = ''; return; }
            imagePreviewContainer.innerHTML = 'Cargando...';
            try {
                const dataUrls = await Promise.all(validFiles.map(fileToDataUrl));
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
                alert('Por favor, completa los campos ¡Nombre y Título son obligatorios!'); return;
            }
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
                audioDataUrl: (currentData && currentData.audioDataUrl) ? currentData.audioDataUrl : null,
                imageDataUrls: (currentData && currentData.imageDataUrls) ? currentData.imageDataUrls : [],
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
            if (!currentData) currentData = { tasks: [] };
            currentData.tasks = currentData.tasks || [];
            currentData.tasks.push({ text, completed: false });
            saveToLocalStorage(currentData);
            renderTasks(currentData.tasks);
            newTaskInput.value = '';
        });

        function openImageModal(url) {
            modal.classList.add('active');
            modal.setAttribute('aria-hidden', 'false');
            modalImg.src = url;
        }
        modal.addEventListener('click', () => {
            modal.classList.remove('active');
            modal.setAttribute('aria-hidden', 'true');
            modalImg.src = '';
        });

        exportPdfBtn.addEventListener('click', () => window.print());

        deleteMovieBtn.addEventListener('click', () => {
            if (!confirm('¿Seguro que deseas eliminar tu película mental? Esta acción no se puede deshacer.')) return;
            removeFromLocalStorage();
            currentData = null;
            imagePreviewContainer.innerHTML = '';
            movieImageGallery.innerHTML = '';
            movieAudioPlayer.innerHTML = '';
            taskListEl.innerHTML = '';
            progressBar.style.width = '0%';
            progressText.textContent = '';
            showScreen(welcomeScreen);
        });

        

        // ---------- LÓGICA DEL CARRUSEL AUTOMÁTICO ----------
        function createTextSlide(title, content) {
            const slide = document.createElement('div');
            slide.className = 'carousel-slide';
            // Escapar HTML para evitar problemas de inyección
            const safeContent = document.createElement('div');
            safeContent.textContent = content;
            slide.innerHTML = '<div class="slide-title">' + title + '</div><div class="slide-content">' + safeContent.innerHTML.replace(/\n/g, '<br>') + '</div>';
            return slide;
        }

        function buildCarousel() {
            carouselSlidesContainer.innerHTML = '';
            slides = [];

            if (currentData) {
                if(currentData.title) slides.push(createTextSlide('El Título de tu Película', currentData.title));
                if(currentData.description) slides.push(createTextSlide('Tu Visión', currentData.description));
                if(currentData.userName) slides.push(createTextSlide('Creada por', currentData.userName));
                if(currentData.goals['2y']) slides.push(createTextSlide('Metas a 2 Años', currentData.goals['2y']));
                if(currentData.goals['5y']) slides.push(createTextSlide('Metas a 5 Años', currentData.goals['5y']));
                if(currentData.goals['10y']) slides.push(createTextSlide('Metas a 10 Años', currentData.goals['10y']));

                currentData.imageDataUrls.forEach(url => {
                    const slide = document.createElement('div');
                    slide.className = 'carousel-slide';
                    slide.innerHTML = '<img src="' + url + '" alt="Imagen de tu película mental">';
                    slides.push(slide);
                });
            }

            if(slides.length === 0){
                slides.push(createTextSlide('Película Mental Vacía', 'Aún no has añadido contenido. ¡Crea tu película para empezar!'));
            }

            const quoteSlide = document.createElement('div');
            quoteSlide.className = 'carousel-slide carousel-quote-slide';
            quoteSlide.innerHTML = '<h2>Tu Futuro es Tuyo</h2><p>Nunca dejes de soñar. Cada paso que das hoy está construyendo la realidad que deseas mañana.</p>';
            slides.push(quoteSlide);
            slides.push(quoteSlide);
            
            // Añadir todas las diapositivas al DOM
            slides.forEach(slide => carouselSlidesContainer.appendChild(slide));
        }

        function showSlide(index) {
            slides.forEach((slide, i) => {
                slide.classList.toggle('active', i === index);
            });
        }
        
        function openCarousel() {
            buildCarousel();
            currentSlideIndex = 0;
            showSlide(currentSlideIndex);
            carouselOverlay.classList.add('active');
            
            // Iniciar el ciclo automático
            if(carouselInterval) clearInterval(carouselInterval); // Limpiar por si acaso
            carouselInterval = setInterval(() => {
                currentSlideIndex = (currentSlideIndex + 1) % slides.length;
                showSlide(currentSlideIndex);
            }, 5000); // 5000 ms = 5 segundos

            if (currentAudio && currentAudio.paused) {
                currentAudio.play().catch(e => console.log("La reproducción automática fue bloqueada por el navegador."));
            }
        }

        function closeCarousel() {
            carouselOverlay.classList.remove('active');
            // Detener el ciclo automático al cerrar
            clearInterval(carouselInterval);
            carouselInterval = null;
        }

        playMovieModalBtn.addEventListener('click', openCarousel);
        carouselCloseBtn.addEventListener('click', closeCarousel);
        carouselOverlay.addEventListener('click', (e) => {
            if (e.target === carouselOverlay) closeCarousel();
        });
        
        // ---------- TEMA Y INICIALIZACIÓN ----------
        themeSelect.addEventListener('change', (e) => {
            const val = e.target.value;
            document.documentElement.setAttribute('data-theme', val);
            localStorage.setItem(THEME_STORAGE_KEY, val);
        });
        function applySavedTheme() {
            const saved = localStorage.getItem(THEME_STORAGE_KEY) || 'light';
            document.documentElement.setAttribute('data-theme', saved);
            themeSelect.value = saved;
        }

        function initializeApp() {
            applySavedTheme();
            const saved = loadFromLocalStorage();
            if (saved) {
                currentData = saved;
                document.getElementById('user-name').value = saved.userName || '';
                document.getElementById('user-age').value = saved.userAge || '';
                document.getElementById('form-title').value = saved.title || '';
                document.getElementById('form-description').value = saved.description || '';
                document.getElementById('goal-2y').value = saved.goals?.['2y'] || '';
                document.getElementById('goal-5y').value = saved.goals?.['5y'] || '';
                document.getElementById('goal-10y').value = saved.goals?.['10y'] || '';
                if (saved.imageDataUrls && saved.imageDataUrls.length) renderImagePreviews(saved.imageDataUrls);
                renderMovie(saved);
            } else {
                showScreen(welcomeScreen);
            }
        }

        initializeApp();

        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                if (modal.classList.contains('active')) modal.click();
                if (carouselOverlay.classList.contains('active')) closeCarousel();
            }
        });

        
        const changeAudioBtn = document.getElementById('change-audio-btn');
        const audioUpdater = document.getElementById('audio-updater');
        const addImagesBtn = document.getElementById('add-images-btn');
        const imageUpdater = document.getElementById('image-updater');
        const generateReflectionBtn = document.getElementById('generate-reflection-btn');
        const reflectionBox = document.getElementById('reflection-box');

        /**
         * Inicializa los botones para cambiar música y añadir imágenes después de crear la película.
         */
        function initializeEditableComponents() {
            // Lógica para cambiar la música
            changeAudioBtn.addEventListener('click', () => audioUpdater.click());
            audioUpdater.addEventListener('change', async (event) => {
                const file = event.target.files[0];
                if (!file || !currentData) return;

                if (file.size > MAX_FILE_BYTES) {
                    alert(`El archivo de audio supera el límite de ${MAX_FILE_MB} MB.`);
                    audioUpdater.value = '';
                    return;
                }
                try {
                    const dataUrl = await fileToDataUrl(file);
                    currentData.audioDataUrl = dataUrl;
                    saveToLocalStorage(currentData);
                    renderMovie(currentData); // Volvemos a renderizar para que se actualice el reproductor.
                    alert('¡Música actualizada con éxito!');
                } catch (e) {
                    alert('Hubo un error al procesar el nuevo audio.');
                }
            });

            // Lógica para añadir más imágenes
            addImagesBtn.addEventListener('click', () => imageUpdater.click());
            imageUpdater.addEventListener('change', async (event) => {
                const files = Array.from(event.target.files);
                if (!files.length || !currentData) return;

                // Validar tamaño de los nuevos archivos
                for (const f of files) {
                    if (f.size > MAX_FILE_BYTES) {
                        alert(`La imagen "${f.name}" supera el límite de ${MAX_FILE_MB}MB y no se añadirá.`);
                        imageUpdater.value = '';
                        return;
                    }
                }
                
                try {
                    const dataUrls = await Promise.all(files.map(fileToDataUrl));
                    currentData.imageDataUrls = (currentData.imageDataUrls || []).concat(dataUrls);
                    saveToLocalStorage(currentData);
                    renderMovie(currentData); // Re-renderizar para mostrar la galería actualizada.
                    alert(`¡Se añadieron ${files.length} imagen(es) nuevas!`);
                } catch(e) {
                     alert('Hubo un error al procesar las nuevas imágenes.');
                } finally {
                    imageUpdater.value = ''; // Limpiar el input para poder subir los mismos archivos de nuevo
                }
            });
        }
        
        /**
         * Inicializa el panel de inspiración con las reflexiones.
         */
        function initializeInspirationPanel() {
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
                // Bucle simple para evitar mostrar la misma reflexión dos veces seguidas
                do {
                    randomIndex = Math.floor(Math.random() * reflections.length);
                } while (reflections.length > 1 && randomIndex === lastReflectionIndex);
                
                lastReflectionIndex = randomIndex;
                const selectedReflection = reflections[randomIndex];

                // Añadir animación de entrada
                reflectionBox.classList.remove('animate_animated', 'animate_fadeIn');
                void reflectionBox.offsetWidth; // Forzar reflow

                reflectionBox.textContent = selectedReflection;
                reflectionBox.classList.add('animate_animated', 'animate_fadeIn');
            });
        }

        // --- LLAMADAS A LAS NUEVAS FUNCIONES DE INICIALIZACIÓN ---
        initializeEditableComponents();
        initializeInspirationPanel();
    })();