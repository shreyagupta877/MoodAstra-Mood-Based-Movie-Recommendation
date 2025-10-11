from voice_mood.utils import clean_voice_text, extract_mood_from_text

def detect_mood_from_voice_input(voice_input):
    """
    Detect mood from raw voice input string.
    """
    cleaned_text = clean_voice_text(voice_input)
    detected_mood = extract_mood_from_text(cleaned_text)
    return detected_mood
