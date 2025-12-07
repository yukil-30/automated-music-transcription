"use client"

import { useEffect, useRef, useState } from "react"
import { Button } from "@/components/ui/button"
import { Play, Pause, RotateCcw } from "lucide-react"
import { cn } from "@/lib/utils"

interface PianoKeyboardProps {
  currentTime: number
  isPlaying: boolean
  onTimeUpdate: (time: number) => void
  onPlayStateChange: (playing: boolean) => void
  audioFile: File | null
}

// Piano key notes from C3 to C5 (2 octaves)
const PIANO_KEYS = [
  { note: "C", octave: 3, isBlack: false },
  { note: "C#", octave: 3, isBlack: true },
  { note: "D", octave: 3, isBlack: false },
  { note: "D#", octave: 3, isBlack: true },
  { note: "E", octave: 3, isBlack: false },
  { note: "F", octave: 3, isBlack: false },
  { note: "F#", octave: 3, isBlack: true },
  { note: "G", octave: 3, isBlack: false },
  { note: "G#", octave: 3, isBlack: true },
  { note: "A", octave: 3, isBlack: false },
  { note: "A#", octave: 3, isBlack: true },
  { note: "B", octave: 3, isBlack: false },
  { note: "C", octave: 4, isBlack: false },
  { note: "C#", octave: 4, isBlack: true },
  { note: "D", octave: 4, isBlack: false },
  { note: "D#", octave: 4, isBlack: true },
  { note: "E", octave: 4, isBlack: false },
  { note: "F", octave: 4, isBlack: false },
  { note: "F#", octave: 4, isBlack: true },
  { note: "G", octave: 4, isBlack: false },
  { note: "G#", octave: 4, isBlack: true },
  { note: "A", octave: 4, isBlack: false },
  { note: "A#", octave: 4, isBlack: true },
  { note: "B", octave: 4, isBlack: false },
  { note: "C", octave: 5, isBlack: false },
]

// Mock notes sequence (in a real app, this would come from MusicXML parsing)
const MOCK_NOTES = [
  { note: "C", octave: 4, time: 0, duration: 1 },
  { note: "D", octave: 4, time: 1, duration: 1 },
  { note: "E", octave: 4, time: 2, duration: 1 },
  { note: "F", octave: 4, time: 3, duration: 1 },
]

export function PianoKeyboard({
  currentTime,
  isPlaying,
  onTimeUpdate,
  onPlayStateChange,
  audioFile,
}: PianoKeyboardProps) {
  const [activeKeys, setActiveKeys] = useState<Set<string>>(new Set())
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const animationRef = useRef<number>()

  useEffect(() => {
    if (audioFile) {
      const audio = new Audio(URL.createObjectURL(audioFile))
      audioRef.current = audio

      return () => {
        URL.revokeObjectURL(audio.src)
      }
    }
  }, [audioFile])

  useEffect(() => {
    if (isPlaying) {
      const startTime = Date.now() - currentTime * 1000

      const animate = () => {
        const elapsed = (Date.now() - startTime) / 1000
        onTimeUpdate(elapsed)

        // Update active keys based on current time
        const active = new Set<string>()
        MOCK_NOTES.forEach((mockNote) => {
          if (elapsed >= mockNote.time && elapsed < mockNote.time + mockNote.duration) {
            active.add(`${mockNote.note}${mockNote.octave}`)
          }
        })
        setActiveKeys(active)

        // Stop at the end
        if (elapsed < 4) {
          animationRef.current = requestAnimationFrame(animate)
        } else {
          onPlayStateChange(false)
          onTimeUpdate(0)
          setActiveKeys(new Set())
        }
      }

      animationRef.current = requestAnimationFrame(animate)

      // Play audio if available
      if (audioRef.current) {
        audioRef.current.currentTime = currentTime
        audioRef.current.play()
      }

      return () => {
        if (animationRef.current) {
          cancelAnimationFrame(animationRef.current)
        }
        if (audioRef.current) {
          audioRef.current.pause()
        }
      }
    } else {
      if (audioRef.current) {
        audioRef.current.pause()
      }
    }
  }, [isPlaying, currentTime, onTimeUpdate, onPlayStateChange])

  const handlePlayPause = () => {
    onPlayStateChange(!isPlaying)
  }

  const handleReset = () => {
    onPlayStateChange(false)
    onTimeUpdate(0)
    setActiveKeys(new Set())
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-foreground">Interactive Piano</h2>
          <p className="text-sm text-muted-foreground">Watch the keys light up as the music plays</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={handleReset} variant="outline" size="sm">
            <RotateCcw className="mr-2 size-4" />
            Reset
          </Button>
          <Button onClick={handlePlayPause} size="sm">
            {isPlaying ? (
              <>
                <Pause className="mr-2 size-4" />
                Pause
              </>
            ) : (
              <>
                <Play className="mr-2 size-4" />
                Play
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Piano Keyboard */}
      <div className="overflow-x-auto">
        <div className="relative inline-flex h-48 min-w-full">
          {PIANO_KEYS.map((key, index) => {
            const keyId = `${key.note}${key.octave}`
            const isActive = activeKeys.has(keyId)

            if (key.isBlack) {
              return (
                <div
                  key={keyId}
                  className={cn(
                    "absolute w-10 h-28 rounded-b-md border-2 border-foreground/20 transition-all duration-100 z-10 shadow-lg",
                    isActive ? "bg-accent scale-95" : "bg-foreground hover:bg-foreground/80",
                  )}
                  style={{
                    left: `${(index - 0.35) * 3}rem`,
                  }}
                >
                  <div className="absolute bottom-2 left-1/2 -translate-x-1/2 text-[10px] font-medium text-background">
                    {key.note}
                  </div>
                </div>
              )
            }

            return (
              <div
                key={keyId}
                className={cn(
                  "relative w-12 h-48 rounded-b-lg border-2 border-border transition-all duration-100",
                  isActive ? "bg-accent scale-95 border-accent" : "bg-card hover:bg-muted",
                )}
              >
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-xs font-medium text-muted-foreground">
                  {key.note}
                  {key.octave}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Progress Bar */}
      <div className="space-y-2">
        <div className="h-2 w-full overflow-hidden rounded-full bg-secondary">
          <div
            className="h-full bg-primary transition-all duration-100"
            style={{ width: `${(currentTime / 4) * 100}%` }}
          />
        </div>
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>{currentTime.toFixed(1)}s</span>
          <span>4.0s</span>
        </div>
      </div>
    </div>
  )
}
