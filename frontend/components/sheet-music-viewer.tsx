"use client"

import { useEffect, useRef, useState } from "react"
import { Button } from "@/components/ui/button"
import { Download, Loader2 } from "lucide-react"

interface SheetMusicViewerProps {
  musicXML: string
  currentTime: number
  isPlaying: boolean
}

export function SheetMusicViewer({ musicXML, currentTime, isPlaying }: SheetMusicViewerProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const osmdRef = useRef<any>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!containerRef.current || !musicXML) return

    const loadAndRenderMusicXML = async () => {
      setIsLoading(true)
      setError(null)

      try {
        // Dynamic import to avoid SSR issues
        const { OpenSheetMusicDisplay } = await import("opensheetmusicdisplay")

        // Clear previous content
        if (containerRef.current) {
          containerRef.current.innerHTML = ""
        }

        // Create new OSMD instance
        osmdRef.current = new OpenSheetMusicDisplay(containerRef.current, {
          autoResize: true,
          backend: "svg",
          drawTitle: true,
          drawComposer: true,
          drawCredits: true,
        })

        console.log("[v0] Loading MusicXML:", musicXML.substring(0, 200))

        // Load and render the MusicXML
        await osmdRef.current.load(musicXML)
        await osmdRef.current.render()

        console.log("[v0] MusicXML rendered successfully")
        setIsLoading(false)
      } catch (err) {
        console.error("[v0] Error rendering MusicXML:", err)
        setError(err instanceof Error ? err.message : "Failed to render sheet music")
        setIsLoading(false)
      }
    }

    loadAndRenderMusicXML()

    // Cleanup
    return () => {
      if (osmdRef.current) {
        osmdRef.current = null
      }
    }
  }, [musicXML])

  const handleDownload = () => {
    const blob = new Blob([musicXML], { type: "application/xml" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = "sheet-music.musicxml"
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-foreground">Sheet Music Preview</h2>
          <p className="text-sm text-muted-foreground">Generated notation from your audio</p>
        </div>
        <Button onClick={handleDownload} variant="outline" size="sm">
          <Download className="mr-2 size-4" />
          Download MusicXML
        </Button>
      </div>

      <div className="min-h-[400px] rounded-lg bg-white p-8 shadow-inner overflow-auto">
        {isLoading && (
          <div className="flex flex-col items-center justify-center gap-4 text-center h-[400px]">
            <Loader2 className="size-12 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">Rendering sheet music...</p>
          </div>
        )}

        {error && (
          <div className="flex flex-col items-center justify-center gap-4 text-center h-[400px]">
            <div className="rounded-lg bg-destructive/10 p-4 text-destructive">
              <p className="font-medium">Error rendering sheet music</p>
              <p className="text-sm mt-1">{error}</p>
            </div>
          </div>
        )}

        <div ref={containerRef} className={isLoading || error ? "hidden" : ""} />
      </div>
    </div>
  )
}
