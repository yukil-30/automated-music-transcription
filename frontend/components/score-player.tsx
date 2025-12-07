// // components/ScorePlayer.tsx
// import React, { useEffect, useRef, useState } from 'react';
// import { OpenSheetMusicDisplay } from 'opensheetmusicdisplay';
// import * as Tone from 'tone';
// import { VirtualPiano } from './VirtualPiano'; // Ensure this path is correct
// import { getStandardPitch } from '../utils/musicHelpers'; // Ensure this path is correct

// interface ScorePlayerProps {
//   xmlData: string | null; // Changed from xmlUrl to xmlData
// }

// const ScorePlayer: React.FC<ScorePlayerProps> = ({ xmlData }) => {
//   const containerRef = useRef<HTMLDivElement>(null);
//   const osmdRef = useRef<OpenSheetMusicDisplay | null>(null);
  
//   const [isPlaying, setIsPlaying] = useState<boolean>(false);
//   const [activeNotes, setActiveNotes] = useState<string[]>([]);
//   const [isReady, setIsReady] = useState<boolean>(false);

//   // Initialize OSMD when xmlData changes
//   useEffect(() => {
//     if (!containerRef.current || !xmlData) return;

//     const setupOsmd = async () => {
//       // Clear previous container content to prevent duplicates
//       containerRef.current!.innerHTML = '';
//       setIsReady(false);

//       const osmd = new OpenSheetMusicDisplay(containerRef.current!, {
//         autoResize: true,
//         backend: "svg",
//         drawingParameters: "compacttight",
//         drawPartNames: false,
//       });

//       try {
//         // load() accepts both URLs and raw XML strings automatically
//         await osmd.load(xmlData);
//         osmd.render();
//         osmdRef.current = osmd;
//         setIsReady(true);
//       } catch (e) {
//         console.error("OSMD Load Error:", e);
//       }
//     };

//     setupOsmd();
//   }, [xmlData]);

//   const playScore = async () => {
//     if (!osmdRef.current) return;
    
//     await Tone.start();
//     const synth = new Tone.PolySynth(Tone.Synth).toDestination();

//     const cursor = osmdRef.current.cursor;
//     cursor.show();
//     cursor.reset();
    
//     setIsPlaying(true);

//     const bpm = 100;
//     const beatDuration = 60 / bpm; 

//     const step = () => {
//       if (cursor.EndOfSheet) {
//         setIsPlaying(false);
//         setActiveNotes([]);
//         cursor.hide();
//         return;
//       }

//       const notes = cursor.NotesUnderCursor();
//       const pitchesToPlay: string[] = [];
//       let maxDuration = 0;

//       notes.forEach((note) => {
//         if (note.pitch) {
//             const pitchStr = getStandardPitch(note.pitch);
//             pitchesToPlay.push(pitchStr);
//             if (note.Length.RealValue > maxDuration) {
//                 maxDuration = note.Length.RealValue;
//             }
//         }
//       });

//       setActiveNotes(pitchesToPlay);

//       // Duration math: RealValue 1.0 = Whole Note = 4 beats
//       // Therefore RealValue * 4 = Total Beats
//       const timeToHold = maxDuration * 4 * beatDuration;
      
//       synth.triggerAttackRelease(pitchesToPlay, timeToHold);

//       cursor.next();

//       const stepDelayMs = timeToHold * 1000;

//       setTimeout(() => setActiveNotes([]), stepDelayMs * 0.9);
      
//       // If the user clicked stop or component unmounted, stop loop
//       if (osmdRef.current) {
//         setTimeout(step, stepDelayMs);
//       }
//     };

//     step();
//   };

//   return (
//     <div className="flex flex-col relative">
//       {/* Controls */}
//       <div className="mb-4 flex gap-4 items-center">
//         <button 
//           onClick={playScore} 
//           disabled={!isReady || isPlaying}
//           className={`px-4 py-2 rounded text-white font-bold transition-all
//             ${isPlaying 
//               ? 'bg-gray-400 cursor-not-allowed' 
//               : 'bg-primary hover:bg-primary/90'}`}
//         >
//           {isPlaying ? 'Playing...' : 'Play Generated Music'}
//         </button>
//         {!isReady && xmlData && <span className="text-sm text-muted-foreground">Rendering Score...</span>}
//       </div>

//       {/* Sheet Music Container */}
//       <div 
//         ref={containerRef} 
//         className="w-full overflow-auto bg-white min-h-[400px] p-4 rounded-lg border" 
//       />

//       {/* The Full Screen Piano - Fixed to bottom of Viewport */}
//       {/* Render conditionally so it appears when we have data */}
//       {isReady && <VirtualPiano activeNotes={activeNotes} />}
//     </div>
//   );
// };

// export default ScorePlayer;



// components/ScorePlayer.tsx
import React, { useEffect, useRef, useState } from 'react';
import { OpenSheetMusicDisplay } from 'opensheetmusicdisplay';
import * as Tone from 'tone';
import { VirtualPiano } from './virtual-piano'; // Ensure this path is correct
import { getStandardPitch } from '../utils/music-helper'; // Ensure this path is correct

interface ScorePlayerProps {
  xmlData: string | null; // Changed from xmlUrl to xmlData
}

const ScorePlayer: React.FC<ScorePlayerProps> = ({ xmlData }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const osmdRef = useRef<OpenSheetMusicDisplay | null>(null);
  
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [activeNotes, setActiveNotes] = useState<string[]>([]);
  const [isReady, setIsReady] = useState<boolean>(false);

  // Initialize OSMD when xmlData changes
  useEffect(() => {
    if (!containerRef.current || !xmlData) return;

    const setupOsmd = async () => {
      // Clear previous container content to prevent duplicates
      containerRef.current!.innerHTML = '';
      setIsReady(false);

      const osmd = new OpenSheetMusicDisplay(containerRef.current!, {
        autoResize: true,
        backend: "svg",
        drawingParameters: "compacttight",
        drawPartNames: false,
      });

      try {
        // load() accepts both URLs and raw XML strings automatically
        await osmd.load(xmlData);
        osmd.render();
        osmdRef.current = osmd;
        setIsReady(true);
      } catch (e) {
        console.error("OSMD Load Error:", e);
      }
    };

    setupOsmd();
  }, [xmlData]);

  const playScore = async () => {
    if (!osmdRef.current) return;
    
    await Tone.start();
    const synth = new Tone.PolySynth(Tone.Synth).toDestination();

    const cursor = osmdRef.current.cursor;
    cursor.show();
    cursor.reset();
    
    setIsPlaying(true);

    const bpm = 100;
    const beatDuration = 60 / bpm; 

    const step = () => {
      if (cursor.Iterator.EndReached) {
        setIsPlaying(false);
        setActiveNotes([]);
        cursor.hide();
        return;
      }

      const notes = cursor.NotesUnderCursor();
      const pitchesToPlay: string[] = [];
      let maxDuration = 0;

      notes.forEach((note) => {
        if (note.Pitch) {
            const pitchStr = getStandardPitch(note.Pitch);
            pitchesToPlay.push(pitchStr);
            if (note.Length.RealValue > maxDuration) {
                maxDuration = note.Length.RealValue;
            }
        }
      });

      setActiveNotes(pitchesToPlay);

      // Duration math: RealValue 1.0 = Whole Note = 4 beats
      // Therefore RealValue * 4 = Total Beats
      const timeToHold = maxDuration * 4 * beatDuration;
      
      synth.triggerAttackRelease(pitchesToPlay, timeToHold);

      cursor.next();

      const stepDelayMs = timeToHold * 1000;

      setTimeout(() => setActiveNotes([]), stepDelayMs * 0.9);
      
      // If the user clicked stop or component unmounted, stop loop
      if (osmdRef.current) {
        setTimeout(step, stepDelayMs);
      }
    };

    step();
  };

  return (
    <div className="flex flex-col relative">
      {/* Controls */}
      <div className="mb-4 flex gap-4 items-center">
        <button 
          onClick={playScore} 
          disabled={!isReady || isPlaying}
          className={`px-4 py-2 rounded text-white font-bold transition-all
            ${isPlaying 
              ? 'bg-gray-400 cursor-not-allowed' 
              : 'bg-primary hover:bg-primary/90'}`}
        >
          {isPlaying ? 'Playing...' : 'Play Generated Music'}
        </button>
        {!isReady && xmlData && <span className="text-sm text-muted-foreground">Rendering Score...</span>}
      </div>

      {/* Sheet Music Container */}
      <div 
        ref={containerRef} 
        className="w-full overflow-auto bg-white min-h-[400px] p-4 rounded-lg border" 
      />

      {/* The Full Screen Piano - Fixed to bottom of Viewport */}
      {/* Render conditionally so it appears when we have data */}
      {isReady && <VirtualPiano activeNotes={activeNotes} />}
    </div>
  );
};

export default ScorePlayer;