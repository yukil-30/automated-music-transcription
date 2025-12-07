# backend/app.py
import os
import tempfile
from flask import Flask, request, jsonify
from flask_cors import CORS
from core import audio_to_midi, generate_musicxml
from constants import INSTRUMENT_SETTINGS

app = Flask(__name__)
CORS(app) # Allow Next.js to communicate with this

@app.route('/api/instruments', methods=['GET'])
def get_instruments():
    return jsonify(list(INSTRUMENT_SETTINGS.keys()))

@app.route('/api/transcribe', methods=['POST'])
def transcribe():
    # 1. Validation
    if 'file' not in request.files:
        return jsonify({"error": "No file uploaded"}), 400
        
    file = request.files['file']
    if file.filename == '':
        return jsonify({"error": "No file selected"}), 400

    # 2. Parse Inputs
    instrument_name = request.form.get('instrument', 'Piano (C)')
    simplify_rhythm = request.form.get('simplify', 'true').lower() == 'true'
    
    settings = INSTRUMENT_SETTINGS.get(instrument_name, INSTRUMENT_SETTINGS["Piano (C)"])

    # 3. Save Temp Audio
    with tempfile.NamedTemporaryFile(delete=False, suffix=os.path.splitext(file.filename)[1]) as tmp_audio:
        file.save(tmp_audio.name)
        tmp_audio_path = tmp_audio.name

    try:
        # 4. Processing Pipeline
        midi_data = audio_to_midi(tmp_audio_path)
        
        if not midi_data:
            raise Exception("AI failed to transcribe audio")

        xml_string = generate_musicxml(
            midi_data, 
            trans_semitones=settings["semitones"], 
            is_mono=settings["single_note"], 
            simplify=simplify_rhythm
        )

        # 5. Response
        # We send the raw XML string. React can parse this string directly.
        return jsonify({
            "status": "success",
            "musicxml": xml_string
        })

    except Exception as e:
        return jsonify({"error": str(e)}), 500
        
    finally:
        if os.path.exists(tmp_audio_path):
            os.remove(tmp_audio_path)

if __name__ == '__main__':
    app.run(debug=True, port=5000)