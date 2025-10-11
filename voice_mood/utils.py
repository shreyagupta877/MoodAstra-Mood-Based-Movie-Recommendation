def clean_voice_text(text):
    """Clean and prepare voice input text for mood extraction."""
    return text.lower().strip()

def extract_mood_from_text(text):
    """Extract mood keyword from cleaned voice input."""
    text = text.lower()
    mood_keywords = {
        "happy": ["happy", "joy", "excited", "fun", "cheerful", "great", "amazing", "wonderful", "fantastic", "good"],
        "sad": ["sad", "depressed", "crying", "emotional", "alone", "down", "upset", "hurt", "broken"],
        "romantic": ["romantic", "love", "date", "valentine", "sweet", "heart", "couple", "romance"],
        "angry": ["angry", "furious", "mad", "annoyed", "rage", "irritated", "frustrated", "pissed"],
        "bored": ["bored", "dull", "lazy", "tired", "sleepy", "nothing", "boring"],
        "inspired": ["motivated", "inspired", "hope", "success", "goal", "achieve", "dream", "ambition"],
        "relaxed": ["relaxed", "calm", "peaceful", "meditate", "soothing", "chill", "zen", "quiet"],
        "thrilled": ["thrilled", "adventure", "exciting", "wild", "action", "adrenaline", "intense"],
        "scared": ["scary", "horror", "ghost", "fear", "haunted", "frightened", "terrified", "afraid"]
    }

    for mood, keywords in mood_keywords.items():
        for word in keywords:
            if word in text:
                return mood
    return "happy"  # Default to happy if no mood detected

def mood_to_genres(mood):
    """Map detected mood to appropriate movie genres."""
    mood_genre_map = {
        "happy": ["Comedy", "Family", "Romance", "Musical"],
        "sad": ["Drama", "Romance", "Family"],
        "romantic": ["Romance", "Drama", "Musical"],
        "angry": ["Action", "Thriller", "Crime"],
        "bored": ["Adventure", "Comedy", "Action", "Thriller"],
        "inspired": ["Drama", "Biography", "Sports"],
        "relaxed": ["Family", "Comedy", "Romance"],
        "thrilled": ["Action", "Thriller", "Adventure", "Crime"],
        "scared": ["Thriller", "Crime", "Action"],
        "neutral": ["Drama", "Comedy", "Romance"]
    }
    return mood_genre_map.get(mood, ["Comedy", "Drama"])
