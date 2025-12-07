// utils/musicHelpers.ts
import { Pitch } from "opensheetmusicdisplay";

export const getStandardPitch = (pitch: Pitch): string => {
  // OSMD FundamentalNote: 0=C, 1=D, 2=E, 3=F, 4=G, 5=A, 6=B
  const notes = ["C", "D", "E", "F", "G", "A", "B"];
  
  const step = notes[pitch.FundamentalNote];
  let accidental = "";

  const halfTones = pitch.AccidentalHalfTones;

  // Handle sharps and flats
  if (halfTones === 1) accidental = "#";
  else if (halfTones === -1) accidental = "b"; // Tone.js prefers 'b'
  else if (halfTones === 2) accidental = "##"; // Double sharp (rare)
  else if (halfTones === -2) accidental = "bb"; // Double flat (rare)

  // Calculate Octave (OSMD usually provides standard scientific octave)
  const octave = pitch.Octave;

  return `${step}${accidental}${octave}`;
};