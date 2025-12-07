from basic_pitch import ICASSP_2022_MODEL_PATH
from basic_pitch.inference import predict
import music21
import os
import tempfile

# -- 1. Raw Audio to MIDI --
def audio_to_midi(audio_path):
    try:
        model_output, midi_data, note_events = predict(
            audio_path, 
            ICASSP_2022_MODEL_PATH, 
            onset_threshold=0.6,    
            frame_threshold=0.4,
            minimum_note_length=100.0, 
        )
        return midi_data
    except Exception as e:
        print(f"Inference Error: {e}")
        return None
    

# --- 2. Cleaning Logic (Music21) ---
def clean_engraving(score, grid_size=0.25):
    """
    Quantizes notes, removes overlaps, and handles gap filling
    to ensure the resulting MusicXML looks "professional".
    """
    all_notes = []
    
    # Flatten structure
    for element in score.flat.notes:
        if isinstance(element, music21.chord.Chord):
            # Take top note of chord
            pitch = element.sortAscending().pitches[-1]
            n = music21.note.Note(pitch)
            n.offset = element.offset
            n.duration = element.duration
            all_notes.append(n)
        else:
            all_notes.append(element)

    if not all_notes:
        return score

    all_notes.sort(key=lambda x: x.offset)
    
    clean_stream = music21.stream.Score()
    part = music21.stream.Part()
    
    for i in range(len(all_notes)):
        current_n = all_notes[i]
        
        # Quantize Start
        quantized_offset = round(current_n.offset / grid_size) * grid_size
        current_n.offset = quantized_offset
        
        # Handle Last Note
        if i == len(all_notes) - 1:
            q_dur = round(current_n.quarterLength / grid_size) * grid_size
            current_n.quarterLength = max(grid_size, q_dur)
            part.insert(current_n.offset, current_n)
            break

        # Look Ahead to fix gaps/overlaps
        next_n = all_notes[i+1]
        next_offset_quant = round(next_n.offset / grid_size) * grid_size
        
        gap = next_offset_quant - current_n.offset
        
        if gap <= 0: continue # Skip overlaps
        
        # Smart Duration
        natural_end = current_n.offset + current_n.quarterLength
        if (next_offset_quant - natural_end) < 1.0: 
            current_n.quarterLength = gap # Legato
        else:
            q_dur = round(current_n.quarterLength / grid_size) * grid_size
            current_n.quarterLength = min(q_dur, gap)

        part.insert(current_n.offset, current_n)

    clean_stream.insert(0, part)
    return clean_stream

# --- 3. Pipeline Orchestration ---
def generate_musicxml(midi_data, trans_semitones, is_mono, simplify):
    # Create temp file paths
    with tempfile.NamedTemporaryFile(suffix=".musicxml", delete=False) as tmp_xml:
        output_xml_path = tmp_xml.name
    
    with tempfile.NamedTemporaryFile(suffix=".mid", delete=False) as tmp_midi:
        midi_data.write(tmp_midi.name)
        score = music21.converter.parse(tmp_midi.name)

    # Transpose
    if trans_semitones != 0:
        score = score.transpose(music21.interval.Interval(trans_semitones))

    # Clean
    grid_size = 0.5 if simplify else 0.25
    if is_mono:
        score = clean_engraving(score, grid_size=grid_size)
    
    # Metadata setup
    if score.parts:
        p = score.parts[0]
    else:
        p = score
    p.insert(0, music21.meter.TimeSignature('4/4'))
    p.insert(0, p.analyze('key'))
    
    # Generate Notation
    score.makeNotation(inPlace=True)
    score.stripTies(inPlace=True)
    
    # Write to temp file
    score.write('musicxml', fp=output_xml_path)
    
    # Read content to string
    with open(output_xml_path, 'r') as f:
        xml_content = f.read()

    # Cleanup
    os.remove(tmp_midi.name)
    os.remove(output_xml_path)
    
    return xml_content