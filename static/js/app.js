class BollywoodMoodRecommender {
    constructor() {
        this.recognition = null;
        this.isListening = false;
        this.initializeElements();
        this.setupEventListeners();
        this.initializeSpeechRecognition();
    }

    initializeElements() {
        this.micBtn = document.getElementById('micBtn');
        this.voiceStatus = document.getElementById('voiceStatus');
        this.loadingSpinner = document.getElementById('loadingSpinner');
        this.moodDisplay = document.getElementById('moodDisplay');
        this.detectedMood = document.getElementById('detectedMood');
        this.moviesContainer = document.getElementById('moviesContainer');
        this.moviesList = document.getElementById('moviesList');
    }

    setupEventListeners() {
        this.micBtn.addEventListener('click', () => this.toggleListening());
    }

    initializeSpeechRecognition() {
        if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
            this.showError('Speech recognition is not supported in your browser. Please use Chrome or Edge.');
            return;
        }

        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        this.recognition = new SpeechRecognition();
        
        this.recognition.continuous = false;
        this.recognition.interimResults = false;
        this.recognition.lang = 'en-US';

        this.recognition.onstart = () => {
            this.isListening = true;
            this.micBtn.classList.add('listening');
            this.voiceStatus.textContent = 'Listening... Tell us your mood!';
            this.voiceStatus.classList.add('listening');
        };

        this.recognition.onresult = (event) => {
            const transcript = event.results[0][0].transcript;
            this.processVoiceInput(transcript);
        };

        this.recognition.onerror = (event) => {
            console.error('Speech recognition error:', event.error);
            this.stopListening();
            
            let errorMessage = 'Speech recognition failed. ';
            switch(event.error) {
                case 'no-speech':
                    errorMessage += 'No speech detected. Please try again.';
                    break;
                case 'audio-capture':
                    errorMessage += 'Microphone access denied or not available.';
                    break;
                case 'not-allowed':
                    errorMessage += 'Please allow microphone access and try again.';
                    break;
                default:
                    errorMessage += 'Please try again.';
            }
            
            this.showError(errorMessage);
        };

        this.recognition.onend = () => {
            this.stopListening();
        };
    }

    toggleListening() {
        if (this.isListening) {
            this.recognition.stop();
        } else {
            this.startListening();
        }
    }

    startListening() {
        if (!this.recognition) {
            this.showError('Speech recognition not available');
            return;
        }

        try {
            this.recognition.start();
        } catch (error) {
            console.error('Error starting recognition:', error);
            this.showError('Failed to start speech recognition');
        }
    }

    stopListening() {
        this.isListening = false;
        this.micBtn.classList.remove('listening');
        this.voiceStatus.classList.remove('listening');
        this.voiceStatus.textContent = 'Ready to listen...';
    }

    async processVoiceInput(transcript) {
        this.voiceStatus.textContent = `Detected: "${transcript}"`;
        this.showLoading(true);

        try {
            // Get movie recommendations
            const response = await fetch(`/recommend_movies?mood=${encodeURIComponent(transcript)}`);
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const movies = await response.json();
            this.displayMovies(movies, transcript);
            
            // Announce results with text-to-speech
            this.announceResults(movies.length, transcript);
            
        } catch (error) {
            console.error('Error fetching recommendations:', error);
            this.showError('Failed to get movie recommendations. Please try again.');
        } finally {
            this.showLoading(false);
        }
    }

    displayMovies(movies, originalInput) {
        // Extract mood from the original input for display
        const mood = this.extractMoodFromInput(originalInput);
        
        // Show detected mood
        this.detectedMood.textContent = mood;
        this.moodDisplay.classList.remove('d-none');
        this.moodDisplay.classList.add('fade-in-up');

        // Clear previous results
        this.moviesList.innerHTML = '';

        if (movies.length === 0) {
            this.moviesList.innerHTML = `
                <div class="col-12 text-center">
                    <div class="alert alert-info">
                        <h4>No movies found for "${originalInput}"</h4>
                        <p>Try describing your mood differently, like "happy", "sad", "romantic", or "excited".</p>
                    </div>
                </div>
            `;
            return;
        }

        // Display movie cards
        movies.forEach((movie, index) => {
            const movieCard = this.createMovieCard(movie, index);
            this.moviesList.appendChild(movieCard);
        });

        // Smooth scroll to results
        this.moviesContainer.scrollIntoView({ behavior: 'smooth' });
    }

    createMovieCard(movie, index) {
        const col = document.createElement('div');
        col.className = 'col-lg-3 col-md-4 col-sm-6 fade-in';
        col.style.animationDelay = `${index * 0.1}s`;

        const genreBadges = movie.genres.map(genre => 
            `<span class="badge">${genre}</span>`
        ).join('');

        col.innerHTML = `
            <div class="movie-card h-100">
                <img src="${movie.poster}" alt="${movie.title}" class="card-img-top">
                <div class="card-body d-flex flex-column">
                    <h5 class="card-title">${movie.title}</h5>
                    <div class="movie-info mb-3">
                        <span class="badge year-badge">${movie.year}</span>
                        <div class="rating">⭐ ${movie.rating}/10</div>
                        <div class="genres mt-2">${genreBadges}</div>
                    </div>
                    <p class="card-text flex-grow-1">${this.truncateText(movie.description, 100)}</p>
                    <button class="btn-details mt-auto" onclick="app.showMovieDetails(${JSON.stringify(movie).replace(/"/g, '&quot;')})">
                        View Details
                    </button>
                </div>
            </div>
        `;

        return col;
    }

    showMovieDetails(movie) {
    const modal = new bootstrap.Modal(document.getElementById('movieModal'));
    
    document.getElementById('movieModalTitle').textContent = movie.title;
    document.getElementById('modalPoster').src = movie.poster;
    document.getElementById('modalTitle').textContent = movie.title;
    document.getElementById('modalYear').textContent = movie.year;
    document.getElementById('modalRating').textContent = movie.rating;
    document.getElementById('modalGenres').textContent = movie.genres.join(', ');
    document.getElementById('modalDescription').textContent = movie.description;
    
    const trailerContainer = document.getElementById('modalTrailer');
    trailerContainer.innerHTML = '';

    if (movie.trailer) {
        trailerContainer.innerHTML += `
            <p><strong>Watch Trailer:</strong> 
                <a href="${movie.trailer}" target="_blank" rel="noopener noreferrer">Ready to see!</a>
            </p>
        `;
    } else {
        trailerContainer.innerHTML += `<p><strong>Watch Trailer:</strong> No trailer available</p>`;
    }
    
    if (movie.watch_link) {
        trailerContainer.innerHTML += `
            <p><strong>Watch Movie:</strong> 
                <a href="${movie.watch_link}" target="_blank" rel="noopener noreferrer">Start Your Movie Experience!</a>
            </p>
        `;
    } else {
        trailerContainer.innerHTML += `<p><strong>Watch Movie:</strong> Not available</p>`;
    }

    modal.show();

    // Text-to-speech for movie details
    this.speakMovieDetails(movie);
}


    speakMovieDetails(movie) {
        if ('speechSynthesis' in window) {
            const text = `${movie.title}. Released in ${movie.year}. Rating: ${movie.rating} out of 10. ${movie.description}`;
            const utterance = new SpeechSynthesisUtterance(text);
            utterance.rate = 0.9;
            utterance.pitch = 1;
            utterance.volume = 0.8;

            const voices = speechSynthesis.getVoices();
            const femaleVoice = voices.find(voice => 
                voice.name.toLowerCase().includes('female') || 
                voice.name.toLowerCase().includes('zira') ||
                voice.gender === 'female'
            );
            
            if (femaleVoice) {
                utterance.voice = femaleVoice;
            }

            speechSynthesis.speak(utterance);
        }
    }

    announceResults(count, mood) {
        if ('speechSynthesis' in window) {
            let message;
            if (count === 0) {
                message = `Sorry, I couldn't find any movies for ${mood}. Try describing your mood differently.`;
            } else {
                message = `Great! I found ${count} perfect ${mood} movies for you. Check them out!`;
            }

            const utterance = new SpeechSynthesisUtterance(message);
            utterance.rate = 1;
            utterance.pitch = 1.1;
            utterance.volume = 0.9;

            const voices = speechSynthesis.getVoices();
            const femaleVoice = voices.find(voice => 
                voice.name.toLowerCase().includes('female') || 
                voice.name.toLowerCase().includes('zira') ||
                voice.gender === 'female'
            );
            
            if (femaleVoice) {
                utterance.voice = femaleVoice;
            }

            setTimeout(() => {
                speechSynthesis.speak(utterance);
            }, 500);
        }
    }

    extractMoodFromInput(input) {
        const moodKeywords = {
            'happy': ['happy', 'joy', 'excited', 'fun', 'cheerful', 'great', 'amazing', 'wonderful'],
            'sad': ['sad', 'depressed', 'crying', 'emotional', 'down', 'upset', 'hurt'],
            'romantic': ['romantic', 'love', 'date', 'valentine', 'sweet', 'heart'],
            'angry': ['angry', 'furious', 'mad', 'annoyed', 'rage', 'frustrated'],
            'bored': ['bored', 'dull', 'lazy', 'tired', 'nothing'],
            'inspired': ['motivated', 'inspired', 'hope', 'success', 'goal'],
            'relaxed': ['relaxed', 'calm', 'peaceful', 'chill', 'zen'],
            'thrilled': ['thrilled', 'adventure', 'exciting', 'action', 'adrenaline'],
            'scared': ['scary', 'horror', 'fear', 'frightened', 'afraid']
        };

        const lowercaseInput = input.toLowerCase();
        
        for (const [mood, keywords] of Object.entries(moodKeywords)) {
            if (keywords.some(keyword => lowercaseInput.includes(keyword))) {
                return mood;
            }
        }
        
        return 'happy'; // Default mood
    }

    showLoading(show) {
        if (show) {
            this.loadingSpinner.classList.remove('d-none');
        } else {
            this.loadingSpinner.classList.add('d-none');
        }
    }

    showError(message) {
        this.voiceStatus.textContent = `❌ ${message}`;
        this.voiceStatus.style.color = '#e94560';
        
        setTimeout(() => {
            this.voiceStatus.textContent = 'Ready to listen...';
            this.voiceStatus.style.color = '';
        }, 5000);
    }

    truncateText(text, length) {
        if (text.length <= length) return text;
        return text.substring(0, length) + '...';
    }
}

// Initialize the application
let app;
document.addEventListener('DOMContentLoaded', () => {
    app = new BollywoodMoodRecommender();
    
    // Welcome message
    if ('speechSynthesis' in window) {
        const welcomeMessage = "Welcome to MoodAstra - Bollywood Mood Recommender! Click the microphone and tell me your mood to get personalized movie suggestions.";
        const utterance = new SpeechSynthesisUtterance(welcomeMessage);
        utterance.rate = 1;
        utterance.pitch = 1.1;
        utterance.volume = 0.8;

        setTimeout(() => {
            speechSynthesis.speak(utterance);
        }, 1000);
    }
});
