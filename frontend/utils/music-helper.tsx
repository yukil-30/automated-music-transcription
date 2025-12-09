// utils/musicHelpers.ts
import { Pitch } from "opensheetmusicdisplay";

// Convert various OSMD Pitch object shapes into a standard note name like "C4" or "G#3".
export const getStandardPitch = (pitch: any): string => {
  const NOTES = ["C", "D", "E", "F", "G", "A", "B"];

  if (!pitch) {
    console.warn('getStandardPitch: missing pitch object');
    return 'C4';
  }

  // Determine step (note letter)
  let step: string | undefined;

  // Common OSMD representation: FundamentalNote (0..6)
  if (typeof pitch.FundamentalNote === 'number') {
    const idx = pitch.FundamentalNote;
    if (idx >= 0 && idx < NOTES.length) step = NOTES[idx];
  }

  // Lowercase or alternative key names
  if (!step && typeof pitch.fundamentalNote === 'number') {
    const idx = pitch.fundamentalNote;
    if (idx >= 0 && idx < NOTES.length) step = NOTES[idx];
  }

  // Some shapes expose the letter directly: Step or step
  if (!step && typeof pitch.Step === 'string' && pitch.Step.length > 0) {
    step = pitch.Step[0].toUpperCase();
  }
  if (!step && typeof pitch.step === 'string' && pitch.step.length > 0) {
    step = pitch.step[0].toUpperCase();
  }

  if (!step) {
    console.warn('getStandardPitch: unknown step for pitch', pitch);
    return 'C4';
  }

  // Determine accidental / alteration (half tones)
  let halfTones = 0;
  if (typeof pitch.AccidentalHalfTones === 'number') halfTones = pitch.AccidentalHalfTones;
  else if (typeof pitch.accidental === 'number') halfTones = pitch.accidental;
  else if (typeof pitch.Alter === 'number') halfTones = pitch.Alter;
  else if (typeof pitch.Alteration === 'number') halfTones = pitch.Alteration;

  let accidental = '';
  if (halfTones > 0) accidental = '#'.repeat(halfTones);
  else if (halfTones < 0) accidental = 'b'.repeat(Math.abs(halfTones));

  // Determine octave
  let octave: number | undefined;
  if (typeof pitch.Octave === 'number') octave = pitch.Octave;
  else if (typeof pitch.octave === 'number') octave = pitch.octave;
  else if (typeof pitch.OctaveNumber === 'number') octave = pitch.OctaveNumber;

  // As a last resort, if a MIDI number is present, convert to octave
  if (octave === undefined && typeof pitch.Midi === 'number') {
    octave = Math.floor(pitch.Midi / 12) - 1; // MIDI -> octave
  } else if (octave === undefined && typeof pitch.midi === 'number') {
    octave = Math.floor(pitch.midi / 12) - 1;
  }

  if (octave === undefined) {
    console.warn('getStandardPitch: missing octave on pitch', pitch, '— defaulting to 4');
    octave = 4;
  }

  const result = `${step}${accidental}${octave}`;

  if (!result || result.includes('undefined')) {
    console.warn('getStandardPitch: produced invalid result', result, 'from', pitch);
    return 'C4';
  }

  return result;
};