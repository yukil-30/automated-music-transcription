"use client"

import { useCallback } from "react"
import { useDropzone } from "react-dropzone"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Upload, FileAudio, Loader2, Settings2 } from "lucide-react"
import { cn } from "@/lib/utils"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"

interface AudioUploaderProps {
  onUpload: (file: File) => void
  isProcessing: boolean
  audioFile: File | null
  instruments: string[]
  selectedInstrument: string
  onInstrumentChange: (instrument: string) => void
  simplifyRhythm: boolean
  onSimplifyChange: (simplify: boolean) => void
}

export function AudioUploader({
  onUpload,
  isProcessing,
  audioFile,
  instruments,
  selectedInstrument,
  onInstrumentChange,
  simplifyRhythm,
  onSimplifyChange,
}: AudioUploaderProps) {
  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      if (acceptedFiles.length > 0) {
        onUpload(acceptedFiles[0])
      }
    },
    [onUpload],
  )

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "audio/wav": [".wav"],
      "audio/mpeg": [".mp3"],
    },
    maxFiles: 1,
    disabled: isProcessing,
  })

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-foreground">Upload Audio File</h2>
        <p className="text-sm text-muted-foreground">Support for .wav and .mp3 files</p>
      </div>

      <div className="space-y-4 rounded-lg border border-border bg-muted/30 p-4">
        <div className="flex items-center gap-2 text-sm font-medium text-foreground">
          <Settings2 className="size-4" />
          Transcription Settings
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="instrument">Instrument</Label>
            <Select value={selectedInstrument} onValueChange={onInstrumentChange} disabled={isProcessing}>
              <SelectTrigger id="instrument">
                <SelectValue placeholder="Select instrument" />
              </SelectTrigger>
              <SelectContent>
                {instruments.map((instrument) => (
                  <SelectItem key={instrument} value={instrument}>
                    {instrument}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center justify-between space-x-2 rounded-lg border border-border bg-background p-4">
            <Label htmlFor="simplify" className="cursor-pointer">
              <span className="text-sm font-medium">Simplify Rhythm</span>
              <p className="text-xs text-muted-foreground">Round note durations</p>
            </Label>
            <Switch id="simplify" checked={simplifyRhythm} onCheckedChange={onSimplifyChange} disabled={isProcessing} />
          </div>
        </div>
      </div>

      <div
        {...getRootProps()}
        className={cn(
          "flex flex-col items-center justify-center gap-4 rounded-lg border-2 border-dashed p-12 transition-colors cursor-pointer",
          isDragActive ? "border-primary bg-primary/5" : "border-border hover:border-primary/50",
          isProcessing && "cursor-not-allowed opacity-50",
        )}
      >
        <input {...getInputProps()} />

        {isProcessing ? (
          <>
            <Loader2 className="size-12 animate-spin text-primary" />
            <p className="text-sm font-medium text-foreground">Processing audio file...</p>
            <p className="text-xs text-muted-foreground">AI is transcribing your music</p>
          </>
        ) : audioFile ? (
          <>
            <FileAudio className="size-12 text-primary" />
            <p className="text-sm font-medium text-foreground">{audioFile.name}</p>
            <p className="text-xs text-muted-foreground">Click or drag to replace</p>
          </>
        ) : (
          <>
            <Upload className="size-12 text-muted-foreground" />
            <div className="text-center">
              <p className="text-sm font-medium text-foreground">Drop your audio file here</p>
              <p className="text-xs text-muted-foreground">or click to browse</p>
            </div>
            <Button variant="secondary" size="sm">
              Choose File
            </Button>
          </>
        )}
      </div>

      {audioFile && !isProcessing && (
        <div className="flex items-center gap-2 rounded-lg bg-muted p-3">
          <FileAudio className="size-5 text-primary" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-foreground truncate">{audioFile.name}</p>
            <p className="text-xs text-muted-foreground">{(audioFile.size / 1024 / 1024).toFixed(2)} MB</p>
          </div>
        </div>
      )}
    </div>
  )
}
