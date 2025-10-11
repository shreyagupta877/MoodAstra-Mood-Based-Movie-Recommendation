import os
import json
import logging
from flask import Flask, render_template, request, jsonify, redirect, url_for
from voice_mood.detect import detect_mood_from_voice_input
from voice_mood.utils import mood_to_genres

# Set up logging
logging.basicConfig(level=logging.DEBUG)

app = Flask(__name__)
app.secret_key = os.environ.get("SESSION_SECRET", "your-secret-key-here")

# Load movie database
def load_movies():
    try:
        with open('data/movies_db.json', 'r', encoding='utf-8') as f:
            return json.load(f)
    except FileNotFoundError:
        logging.error("Movie database not found")
        return []

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/recommend_movies')
def recommend_movies():
    mood = request.args.get('mood', '').strip()
    
    if not mood:
        return jsonify([])
    
    logging.debug(f"Received mood: {mood}")
    
    # Detect mood from the input
    detected_mood = detect_mood_from_voice_input(mood)
    logging.debug(f"Detected mood: {detected_mood}")
    
    # Get movie genres for this mood
    target_genres = mood_to_genres(detected_mood)
    logging.debug(f"Target genres: {target_genres}")
    
    # Load movies and filter by mood/genre
    movies = load_movies()
    recommendations = []
    
    for movie in movies:
        # Check if movie genres match target genres
        movie_genres = movie.get('genres', [])
        if any(genre in target_genres for genre in movie_genres):
            recommendations.append(movie)
    
    # Limit to 8 recommendations
    recommendations = recommendations[:8]
    
    logging.debug(f"Found {len(recommendations)} recommendations")
    return jsonify(recommendations)

@app.route('/detect_emotion_voice', methods=['POST'])
def detect_emotion_voice():
    data = request.get_json()
    voice_input = data.get('voice_input', '')
    
    if not voice_input:
        return jsonify({'error': 'No voice input provided'}), 400
    
    emotion = detect_mood_from_voice_input(voice_input)
    return jsonify({'emotion': emotion})

@app.route('/movie/<title>')
def movie_detail(title):
    movies = load_movies()
    movie = next((m for m in movies if m['title'].lower() == title.lower()), None)
    
    if not movie:
        return redirect(url_for('index'))
    
    return render_template('movie_detail.html', movie=movie)

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)
