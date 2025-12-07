// // components/VirtualPiano.tsx
// import React, { useMemo } from 'react';

// interface VirtualPianoProps {
//   activeNotes: string[]; // e.g., ["C4", "F#4"]
// }

// interface KeyData {
//   note: string;
//   isSharp: boolean;
//   isActive: boolean;
// }

// export const VirtualPiano: React.FC<VirtualPianoProps> = ({ activeNotes }) => {
//   // Memoize key generation so we don't recalculate on every render
//   const keys = useMemo(() => {
//     const allKeys: KeyData[] = [];
//     const notes = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
    
//     // Standard 88-key piano range: A0 to C8
//     // MIDI numbers: 21 (A0) to 108 (C8)
//     for (let i = 21; i <= 108; i++) {
//       const octave = Math.floor(i / 12) - 1;
//       const noteIndex = i % 12;
//       const noteName = notes[noteIndex];
//       const fullNote = `${noteName}${octave}`;
      
//       allKeys.push({
//         note: fullNote,
//         isSharp: noteName.includes('#'),
//         isActive: false // Will be overridden by props during render map
//       });
//     }
//     return allKeys;
//   }, []);

//   return (
//     <div className="fixed bottom-0 left-0 w-full h-48 bg-gray-900 z-50 flex overflow-hidden border-t-4 border-gray-700">
//       {keys.map((key) => {
//         // Check if this key is currently being played
//         const isActive = activeNotes.includes(key.note);
        
//         return (
//           <div
//             key={key.note}
//             className={`
//               relative flex-grow border border-black rounded-b-md transition-colors duration-75
//               ${key.isSharp 
//                 ? `bg-black h-3/5 -mx-[0.75%] z-10 w-[1.5%] ${isActive ? '!bg-yellow-500' : ''}` 
//                 : `bg-white h-full z-0 ${isActive ? '!bg-blue-400' : ''}`
//               }
//             `}
//           >
//            {/* Optional: Show Note Label on C keys */}
//            {key.note.startsWith('C') && !key.isSharp && (
//              <span className="absolute bottom-2 left-1/2 -translate-x-1/2 text-xs text-gray-500 font-bold">
//                {key.note}
//              </span>
//            )}
//           </div>
//         );
//       })}
//     </div>
//   );
// };

// components/VirtualPiano.tsx
import React, { useMemo } from 'react';

interface VirtualPianoProps {
  activeNotes: string[]; 
}

interface NoteDefinition {
  id: string; // "C4"
  isSharp: boolean;
}

interface PianoKeyGroup {
  white: NoteDefinition;
  black: NoteDefinition | null; // The black key to the immediate right of the white key
}

export const VirtualPiano: React.FC<VirtualPianoProps> = ({ activeNotes }) => {
  
  // 1. GENERATE DATA: Group keys into "White Key + Optional Black Key" pairs
  const keys = useMemo(() => {
    const groupedKeys: PianoKeyGroup[] = [];
    const notes = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
    
    // Iterate standard 88 keys (MIDI 21 to 108)
    for (let i = 21; i <= 108; i++) {
      const octave = Math.floor(i / 12) - 1;
      const noteIndex = i % 12;
      const noteName = notes[noteIndex];
      const fullNote = `${noteName}${octave}`;
      const isSharp = noteName.includes('#');

      if (!isSharp) {
        // It's a white key, start a new group
        groupedKeys.push({
          white: { id: fullNote, isSharp: false },
          black: null
        });
      } else {
        // It's a black key, attach it to the PREVIOUS white key
        const lastGroup = groupedKeys[groupedKeys.length - 1];
        if (lastGroup) {
          lastGroup.black = { id: fullNote, isSharp: true };
        }
      }
    }
    return groupedKeys;
  }, []);

  return (
    <div className="fixed bottom-0 left-0 w-full h-48 bg-gray-900 z-50 flex border-t-4 border-gray-800">
      {keys.map((group, index) => {
        const isWhiteActive = activeNotes.includes(group.white.id);
        const isBlackActive = group.black ? activeNotes.includes(group.black.id) : false;

        return (
          // RENDER WHITE KEY (Main Flex Item)
          <div
            key={group.white.id}
            className={`
              relative flex-grow 
              border-l border-gray-300 first:border-l-0 /* Thin separator lines only */
              rounded-b-sm 
              transition-colors duration-75
              ${isWhiteActive ? '!bg-blue-400' : 'bg-white'}
            `}
          >
            {/* Optional: Label C notes */}
            {group.white.id.startsWith('C') && (
              <span className="absolute bottom-2 left-1/2 -translate-x-1/2 text-xs text-gray-400 font-bold select-none pointer-events-none">
                {group.white.id}
              </span>
            )}

            {/* RENDER BLACK KEY (Overlay) */}
            {/* We position it absolutely on the right edge of the white key */}
            {group.black && (
              <div
                className={`
                  absolute z-10 top-0 -right-[30%] 
                  w-[60%] h-[65%] 
                  rounded-b-sm shadow-md
                  transition-colors duration-75
                  ${isBlackActive 
                    ? '!bg-yellow-500 border border-yellow-600' 
                    : 'bg-black border-x border-b border-gray-800'
                  }
                `}
              >
                {/* Highlight/Reflection for 3D effect */}
                {!isBlackActive && <div className="w-[80%] h-[90%] mx-auto bg-gradient-to-b from-gray-700 to-black opacity-50 rounded-b-sm" />}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};