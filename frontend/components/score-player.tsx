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
import { VirtualPiano } from './virtual-piano';
import { getStandardPitch } from '../utils/music-helper';
import { Play, Pause, RotateCcw, Download } from 'lucide-react';

interface ScorePlayerProps {
  xmlData: string | null;
}

const ScorePlayer: React.FC<ScorePlayerProps> = ({ xmlData }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const osmdRef = useRef<OpenSheetMusicDisplay | null>(null);
  
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [activeNotes, setActiveNotes] = useState<string[]>([]);
  const [isReady, setIsReady] = useState<boolean>(false);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [totalDuration, setTotalDuration] = useState<number>(0);
  
  const playbackLoopRef = useRef<number | null>(null);
  const startTimeRef = useRef<number>(0);
  const synthRef = useRef<Tone.PolySynth | null>(null);
  const isPlayingRef = useRef<boolean>(false);
  const cursorOverlayRef = useRef<HTMLDivElement | null>(null);
  const transposeOffsetRef = useRef<number>(0); // semitone offset to align first note to middle C

  // Initialize OSMD when xmlData changes
  useEffect(() => {
    if (!containerRef.current || !xmlData) return;

    const setupOsmd = async () => {
      containerRef.current!.innerHTML = '';
      setIsReady(false);
      setCurrentTime(0);
      setActiveNotes([]);

      // Add CSS for cursor styling
      const style = document.createElement('style');
      style.textContent = `
        .osmd-cursor {
          stroke: #FF0000 !important;
          stroke-width: 4px !important;
          opacity: 1 !important;
          fill: none !important;
        }
        .osmd-cursor line {
          stroke: #FF0000 !important;
          stroke-width: 4px !important;
        }
      `;
      document.head.appendChild(style);

      const osmd = new OpenSheetMusicDisplay(containerRef.current!, {
        autoResize: true,
        backend: "svg",
        drawingParameters: "default",
        drawPartNames: false,
        cursorsOptions: [
          {
            type: 0,
            color: "#FF0000",
            alpha: 1,
            follow: false
          }
        ]
      });

      try {
        await osmd.load(xmlData);
        osmd.render();
        osmdRef.current = osmd;

        // After render, replace OSMD cursor contents with a tall vertical line
        try {
          const svg = containerRef.current!.querySelector('svg') as SVGSVGElement | null;
          const svgHeight = svg ? Math.max(600, svg.getBoundingClientRect().height) : 800;
          if (svg) {
            const cursors = svg.querySelectorAll('.osmd-cursor');
            cursors.forEach((c) => {
              // clear existing children
              while (c.firstChild) c.removeChild(c.firstChild);
              // create vertical line that spans the SVG height (relative to cursor group's origin)
              const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
              line.setAttribute('x1', '0');
              line.setAttribute('y1', '0');
              line.setAttribute('x2', '0');
              line.setAttribute('y2', String(svgHeight));
              line.setAttribute('stroke', '#FF0000');
              line.setAttribute('stroke-width', '4');
              line.setAttribute('stroke-linecap', 'round');
              line.setAttribute('fill', 'none');
              c.appendChild(line);
              if (c instanceof SVGElement) {
                c.setAttribute('pointer-events', 'none');
              }
            });
            // Create an absolute overlay cursor for more reliable positioning
            if (containerRef.current && !cursorOverlayRef.current) {
              const overlay = document.createElement('div');
              overlay.style.position = 'absolute';
              overlay.style.top = '0';
              overlay.style.left = '0';
              overlay.style.width = '4px';
              overlay.style.height = '100%';
              overlay.style.background = '#FF2D2D';
              overlay.style.pointerEvents = 'none';
              overlay.style.transform = 'translateX(-9999px)';
              overlay.style.zIndex = '9999';
              // Ensure container wrapper is positioned
              containerRef.current.style.position = containerRef.current.style.position || 'relative';
              containerRef.current.appendChild(overlay);
              cursorOverlayRef.current = overlay;
            }
          }
        } catch (e) {
          console.error('Cursor overlay creation failed', e);
        }

        calculateTotalDuration(osmd);
        setIsReady(true);
      } catch (e) {
        console.error("OSMD Load Error:", e);
      }

      return () => {
        document.head.removeChild(style);
      };
    };

    setupOsmd();
  }, [xmlData]);

  const calculateTotalDuration = (osmd: OpenSheetMusicDisplay) => {
    const cursor = osmd.cursor;
    const bpm = 100;
    const beatDuration = 60 / bpm;
    let totalTime = 0;

    cursor.reset();
    while (!cursor.Iterator.EndReached) {
      const notes = cursor.NotesUnderCursor();
      let maxDuration = 0;

      notes.forEach((note) => {
        if (note.Length && note.Length.RealValue > maxDuration) {
          maxDuration = note.Length.RealValue;
        }
      });

      const timeToHold = maxDuration * 4 * beatDuration;
      totalTime += timeToHold;
      cursor.next();

      // Update overlay cursor position based on OSMD cursor group bbox
      try {
        const svg = containerRef.current!.querySelector('svg') as SVGSVGElement | null;
        const group = svg ? svg.querySelector('.osmd-cursor') as SVGGElement | null : null;
        const overlay = cursorOverlayRef.current;
        if (group && overlay && containerRef.current) {
          const groupRect = group.getBoundingClientRect();
          const containerRect = containerRef.current.getBoundingClientRect();
          const left = groupRect.left - containerRect.left + containerRef.current.scrollLeft;
          overlay.style.transform = `translateX(${left}px)`;
          overlay.style.visibility = 'visible';
        }
      } catch (e) {
        // non-fatal
      }
    }

    setTotalDuration(totalTime);
  };

  const playScore = async () => {
    if (!osmdRef.current) return;
    
    await Tone.start();
    
    if (!synthRef.current) {
      synthRef.current = new Tone.PolySynth(Tone.Synth, {
        oscillator: { type: 'triangle' },
        envelope: { attack: 0.01, decay: 0.2, sustain: 0.5, release: 0.2 },
      }).toDestination();
    }

    const cursor = osmdRef.current.cursor;
    cursor.reset();
    cursor.show();
    
    isPlayingRef.current = true;
    setIsPlaying(true);
    startTimeRef.current = Date.now();
    setCurrentTime(0);

    const bpm = 100;
    const beatDuration = 60 / bpm;

    const playNextNote = () => {
      if (!osmdRef.current || !isPlayingRef.current) {
        return;
      }

      if (cursor.Iterator.EndReached) {
        isPlayingRef.current = false;
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
          try {
            const pitchStr = getStandardPitch(note.Pitch);
            if (pitchStr && pitchStr.length > 1) {
              pitchesToPlay.push(pitchStr);
            }
            if (note.Length && note.Length.RealValue > maxDuration) {
              maxDuration = note.Length.RealValue;
            }
          } catch (e) {
            console.error("Error processing pitch:", e);
          }
        }
      });

      setActiveNotes(pitchesToPlay);

      const timeToHold = Math.max(0.1, maxDuration * 4 * beatDuration);
      
      // Determine transpose offset on first playable note so the first note maps to middle C (MIDI 60)
      if (transposeOffsetRef.current === 0 && pitchesToPlay.length > 0) {
        try {
          const firstMidi = Tone.Frequency(pitchesToPlay[0]).toMidi();
          if (!isNaN(firstMidi)) {
            transposeOffsetRef.current = 60 - firstMidi;
          }
        } catch (e) {
          console.warn('Transpose detection failed', e);
        }
      }

      // Play the notes with transpose applied
      if (synthRef.current && pitchesToPlay.length > 0) {
        try {
          const adjusted = pitchesToPlay.map((p) => {
            try {
              const midi = Tone.Frequency(p).toMidi();
              const midiAdj = Math.round(midi + transposeOffsetRef.current);
              return Tone.Frequency(midiAdj, 'midi').toNote();
            } catch (e) {
              return p;
            }
          });
          synthRef.current.triggerAttackRelease(adjusted, timeToHold);
        } catch (e) {
          console.error("Error triggering synth:", e, "pitches:", pitchesToPlay);
        }
      }

      // Advance OSMD cursor (OSMD will update the cursor group's transform)
      cursor.next();

      // Update overlay cursor position after advancing the cursor
      try {
        const svg = containerRef.current!.querySelector('svg') as SVGSVGElement | null;
        const group = svg ? svg.querySelector('.osmd-cursor') as SVGGElement | null : null;
        const overlay = cursorOverlayRef.current;
        if (group && overlay && containerRef.current) {
          const groupRect = group.getBoundingClientRect();
          const containerRect = containerRef.current.getBoundingClientRect();
          const left = groupRect.left - containerRect.left + containerRef.current.scrollLeft;
          overlay.style.transform = `translateX(${left}px)`;
          overlay.style.visibility = 'visible';
        }
      } catch (e) {
        // non-fatal
      }

      const stepDelayMs = timeToHold * 1000;

      setTimeout(() => {
        setActiveNotes([]);
      }, stepDelayMs * 0.9);

      if (isPlayingRef.current) {
        playbackLoopRef.current = window.setTimeout(playNextNote, stepDelayMs);
      }
    };

    const animationLoop = () => {
      if (isPlayingRef.current) {
        const elapsed = (Date.now() - startTimeRef.current) / 1000;
        setCurrentTime(elapsed);
        playbackLoopRef.current = window.requestAnimationFrame(animationLoop);
      }
    };

    animationLoop();
    playNextNote();
  };

  const handleStop = () => {
    isPlayingRef.current = false;
    setIsPlaying(false);
    setActiveNotes([]);
    setCurrentTime(0);

    if (playbackLoopRef.current) {
      clearTimeout(playbackLoopRef.current);
      cancelAnimationFrame(playbackLoopRef.current);
    }

    if (osmdRef.current) {
      osmdRef.current.cursor.reset();
      osmdRef.current.cursor.hide();
    }

    if (synthRef.current) {
      synthRef.current.dispose();
      synthRef.current = null;
    }
  };

  const handleReset = () => {
    isPlayingRef.current = false;
    setIsPlaying(false);
    setActiveNotes([]);
    setCurrentTime(0);

    if (playbackLoopRef.current) {
      clearTimeout(playbackLoopRef.current);
      cancelAnimationFrame(playbackLoopRef.current);
    }

    if (osmdRef.current) {
      osmdRef.current.cursor.reset();
      osmdRef.current.cursor.hide();
    }

    if (synthRef.current) {
      synthRef.current.dispose();
      synthRef.current = null;
    }
  };

  const handleDownloadXML = () => {
    if (!xmlData) return;
    
    const blob = new Blob([xmlData], { type: 'application/xml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'sheet-music.musicxml';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="h-full w-full flex flex-col bg-white">
      {/* Top Control Bar */}
      <div className="border-b border-gray-200 bg-gray-50 px-6 py-3 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          {/* Play/Pause/Reset Controls */}
          <div className="flex items-center gap-2">
            <button 
              onClick={playScore} 
              disabled={!isReady || isPlaying}
              className={`p-2 rounded-lg transition-all ${
                isPlaying 
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed' 
                  : 'bg-primary text-white hover:bg-primary/90'
              }`}
              title="Play"
            >
              <Play size={20} fill="currentColor" />
            </button>
            
            {isPlaying && (
              <button 
                onClick={handleStop}
                className="p-2 rounded-lg text-white bg-red-500 hover:bg-red-600 transition-all"
                title="Stop"
              >
                <Pause size={20} fill="currentColor" />
              </button>
            )}
            
            <button 
              onClick={handleReset}
              disabled={!isReady}
              className={`p-2 rounded-lg transition-all ${
                !isReady 
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed' 
                  : 'bg-gray-300 text-gray-700 hover:bg-gray-400'
              }`}
              title="Reset"
            >
              <RotateCcw size={20} />
            </button>
          </div>

          {/* Time Display */}
          <div className="flex items-center gap-2 text-sm text-gray-600 ml-4 font-mono">
            <span>{formatTime(currentTime)}</span>
            <span className="text-gray-400">/</span>
            <span>{formatTime(totalDuration)}</span>
          </div>

          {/* Progress Bar */}
          <div className="flex-1 max-w-xs">
            <div className="h-1.5 bg-gray-300 rounded-full overflow-hidden">
              <div
                className="h-full bg-primary transition-all duration-100"
                style={{ width: `${totalDuration > 0 ? (currentTime / totalDuration) * 100 : 0}%` }}
              />
            </div>
          </div>
        </div>

        {/* Right side actions */}
        <button 
          onClick={handleDownloadXML}
          disabled={!isReady}
          className={`p-2 rounded-lg transition-all flex items-center gap-1 text-sm font-medium ${
            !isReady 
              ? 'bg-gray-300 text-gray-500 cursor-not-allowed' 
              : 'bg-green-600 text-white hover:bg-green-700'
          }`}
          title="Download MusicXML"
        >
          <Download size={18} />
          <span className="hidden sm:inline">Download</span>
        </button>
      </div>

      {/* Sheet Music Area - Scrollable */}
      <div className="flex-1 overflow-auto bg-white" style={{ paddingBottom: '220px' }}>
        <div 
          ref={containerRef} 
          className="w-full p-6 bg-white inline-block min-w-full"
          style={{ margin: 0, padding: '24px' }}
        />
        {!isReady && (
          <div className="flex items-center justify-center h-full text-gray-400">
            <p>Loading sheet music...</p>
          </div>
        )}
      </div>

      {/* Virtual Piano at Bottom */}
      {isReady && <VirtualPiano activeNotes={activeNotes} />}
    </div>
  );
};

export default ScorePlayer;