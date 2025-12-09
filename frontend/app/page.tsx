// "use client"

// import { useState, useEffect } from "react"
// import { Card } from "@/components/ui/card"
// import { AudioUploader } from "@/components/audio-uploader"
// import { SheetMusicViewer } from "@/components/sheet-music-viewer"
// import { PianoKeyboard } from "@/components/piano-keyboard"
// import { Music2 } from "lucide-react"
// import { VirtualPiano } from "@/components/virtual-piano"

// const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://127.0.0.1:5000"

// const ScorePlayer = dynamic(() => import('../components/score-player'), {
//   ssr: false,
//   loading: () => <div className="p-10">Loading Piano Engine...</div>
// });

// export default function MusicTranscriptionPage() {
//   const [audioFile, setAudioFile] = useState<File | null>(null)
//   const [musicXML, setMusicXML] = useState<string | null>(null)
//   const [isProcessing, setIsProcessing] = useState(false)
//   const [currentTime, setCurrentTime] = useState(0)
//   const [isPlaying, setIsPlaying] = useState(false)
//   const [instruments, setInstruments] = useState<string[]>([])
//   const [selectedInstrument, setSelectedInstrument] = useState<string>("Piano (C)")
//   const [simplifyRhythm, setSimplifyRhythm] = useState<boolean>(true)
//   const [error, setError] = useState<string | null>(null)

//   useEffect(() => {
//     fetch(`${BACKEND_URL}/api/instruments`)
//       .then((res) => res.json())
//       .then((data) => {
//         setInstruments(data)
//         if (data.length > 0) {
//           setSelectedInstrument(data[0])
//         }
//       })
//       .catch((err) => {
//         console.error("[v0] Failed to fetch instruments:", err)
//         setError("Unable to connect to transcription service. Make sure the Flask backend is running on port 5000.")
//       })
//   }, [])

//   const handleAudioUpload = async (file: File) => {
//     setAudioFile(file)
//     setIsProcessing(true)
//     setError(null)

//     try {
//       // Create FormData to send file and parameters
//       const formData = new FormData()
//       formData.append("file", file)
//       formData.append("instrument", selectedInstrument)
//       formData.append("simplify", simplifyRhythm.toString())

//       const response = await fetch(`${BACKEND_URL}/api/transcribe`, {
//         method: "POST",
//         body: formData,
//       })

//       if (!response.ok) {
//         const errorData = await response.json()
//         throw new Error(errorData.error || "Transcription failed")
//       }

//       const data = await response.json()

//       if (data.status === "success" && data.musicxml) {
//         setMusicXML(data.musicxml)
//       } else {
//         throw new Error("Invalid response from server")
//       }
//     } catch (err) {
//       console.error("[v0] Transcription error:", err)
//       setError(err instanceof Error ? err.message : "An error occurred during transcription")
//     } finally {
//       setIsProcessing(false)
//     }
//   }

//   return (
//     <div className="min-h-screen bg-background">
//       <header className="border-b border-border bg-card">
//         <div className="container mx-auto px-4 py-4">
//           <div className="flex items-center gap-3">
//             <div className="flex size-10 items-center justify-center rounded-lg bg-primary">
//               <Music2 className="size-6 text-primary-foreground" />
//             </div>
//             <div>
//               <h1 className="text-2xl font-bold text-foreground">Audio to Sheet Music</h1>
//               <p className="text-sm text-muted-foreground">Convert your audio files to sheet music notation</p>
//             </div>
//           </div>
//         </div>
//       </header>

//       <main className="container mx-auto px-4 py-8">
//         <div className="grid gap-6 lg:grid-cols-1">
//           {error && (
//             <div className="rounded-lg bg-destructive/10 border border-destructive/50 p-4">
//               <p className="text-sm font-medium text-destructive">{error}</p>
//             </div>
//           )}

//           {/* Audio Upload Section */}
//           <Card className="p-6">
//             <AudioUploader
//               onUpload={handleAudioUpload}
//               isProcessing={isProcessing}
//               audioFile={audioFile}
//               instruments={instruments}
//               selectedInstrument={selectedInstrument}
//               onInstrumentChange={setSelectedInstrument}
//               simplifyRhythm={simplifyRhythm}
//               onSimplifyChange={setSimplifyRhythm}
//             />
//           </Card>

//           {/* Sheet Music and Keyboard Section */}
//           {musicXML && (
//             <>
//               <Card className="p-6">
//                 <SheetMusicViewer musicXML={musicXML} currentTime={currentTime} isPlaying={isPlaying} />
//               </Card>

//               <Card className="p-6">
//                 <PianoKeyboard
//                   currentTime={currentTime}
//                   isPlaying={isPlaying}
//                   onTimeUpdate={setCurrentTime}
//                   onPlayStateChange={setIsPlaying}
//                   audioFile={audioFile}
//                 />
//               </Card>
//               <Card className="p-6">

//                 <ScorePlayer xmlUrl="/assets/sheet_music_example.xml" />
//                 <PianoKeyboard
//                   currentTime={currentTime}
//                   isPlaying={isPlaying}
//                   onTimeUpdate={setCurrentTime}
//                   onPlayStateChange={setIsPlaying}
//                   audioFile={audioFile}
//                 />
//               </Card>
//             </>
//           )}
//         </div>
//       </main>
//     </div>
//   )
// }


"use client"

import { useState, useEffect } from "react"
import dynamic from 'next/dynamic'
import { Card } from "@/components/ui/card"
import { AudioUploader } from "@/components/audio-uploader"
import { Music2 } from "lucide-react"

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://127.0.0.1:5328"

// Dynamically import ScorePlayer to avoid SSR issues with OSMD
const ScorePlayer = dynamic(() => import('../components/score-player'), {
  ssr: false,
  loading: () => <div className="p-10 text-center">Loading Music Engine...</div>
});

export default function MusicTranscriptionPage() {
  const [audioFile, setAudioFile] = useState<File | null>(null)
  
  // This holds the XML STRING from the backend
  const [musicXML, setMusicXML] = useState<string | null>(null) 
  
  const [isProcessing, setIsProcessing] = useState(false)
  const [instruments, setInstruments] = useState<string[]>([])
  const [selectedInstrument, setSelectedInstrument] = useState<string>("Piano (C)")
  const [simplifyRhythm, setSimplifyRhythm] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetch(`${BACKEND_URL}/api/instruments`)
      .then((res) => res.json())
      .then((data) => {
        setInstruments(data)
        if (data.length > 0) {
          setSelectedInstrument(data[0])
        }
      })
      .catch((err) => {
        console.error("Failed to fetch instruments:", err)
        setError("Unable to connect to transcription service.")
      })
  }, [])

  const handleAudioUpload = async (file: File) => {
    setAudioFile(file)
    setIsProcessing(true)
    setError(null)
    setMusicXML(null) // Reset previous score

    try {
      const formData = new FormData()
      formData.append("file", file)
      formData.append("instrument", selectedInstrument)
      formData.append("simplify", simplifyRhythm.toString())

      const response = await fetch(`${BACKEND_URL}/api/transcribe`, {
        method: "POST",
        body: formData,
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Transcription failed")
      }

      const data = await response.json()

      if (data.status === "success" && data.musicxml) {
        // Store the raw XML string
        setMusicXML(data.musicxml)
      } else {
        throw new Error("Invalid response from server")
      }
    } catch (err) {
      console.error("Transcription error:", err)
      setError(err instanceof Error ? err.message : "An error occurred during transcription")
    } finally {
      setIsProcessing(false)
    }
  }

  // If we have XML, show the player in a full-screen-like mode
  if (musicXML) {
    return (
      <div className="h-screen w-screen flex flex-col bg-white overflow-hidden">
        {/* Header with file info and back button */}
        <div className="border-b border-gray-200 bg-gray-50 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Music2 className="w-6 h-6 text-primary" />
            <div>
              <h1 className="text-lg font-bold text-foreground">
                {audioFile?.name || 'Sheet Music'}
              </h1>
              <p className="text-xs text-muted-foreground">
                {selectedInstrument} • {simplifyRhythm ? 'Simplified' : 'Full rhythm'}
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              setMusicXML(null)
              setAudioFile(null)
            }}
            className="px-4 py-2 rounded text-sm font-medium text-foreground hover:bg-gray-200 transition-colors"
          >
            ← Back to Upload
          </button>
        </div>

        {/* Main content area with score player */}
        <div className="flex-1 overflow-hidden">
          <ScorePlayer xmlData={musicXML} />
        </div>
      </div>
    )
  }

  // Upload interface
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <header className="border-b border-border bg-white shadow-sm">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center gap-3">
            <div className="flex size-12 items-center justify-center rounded-lg bg-primary">
              <Music2 className="size-7 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-foreground">Audio to Sheet Music</h1>
              <p className="text-sm text-muted-foreground">Convert your audio files to interactive sheet music</p>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-12">
        <div className="max-w-2xl mx-auto">
          {error && (
            <div className="rounded-lg bg-destructive/10 border border-destructive/50 p-4 mb-6">
              <p className="text-sm font-medium text-destructive">{error}</p>
            </div>
          )}

          <Card className="p-8 shadow-lg">
            <AudioUploader
              onUpload={handleAudioUpload}
              isProcessing={isProcessing}
              audioFile={audioFile}
              instruments={instruments}
              selectedInstrument={selectedInstrument}
              onInstrumentChange={setSelectedInstrument}
              simplifyRhythm={simplifyRhythm}
              onSimplifyChange={setSimplifyRhythm}
            />
          </Card>
        </div>
      </main>
    </div>
  )
}