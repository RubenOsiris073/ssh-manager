"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Search, X, ChevronUp, ChevronDown } from "lucide-react"

interface TerminalSearchProps {
  isOpen: boolean
  onClose: () => void
  history: Array<{ content: string; type: string }>
  onHighlight: (indices: number[]) => void
}

export function TerminalSearch({ isOpen, onClose, history, onHighlight }: TerminalSearchProps) {
  const [searchTerm, setSearchTerm] = useState("")
  const [currentMatch, setCurrentMatch] = useState(0)
  const [matches, setMatches] = useState<number[]>([])

  useEffect(() => {
    if (!searchTerm.trim()) {
      setMatches([])
      onHighlight([])
      return
    }

    const foundMatches: number[] = []
    history.forEach((entry, index) => {
      if (entry.content.toLowerCase().includes(searchTerm.toLowerCase())) {
        foundMatches.push(index)
      }
    })

    setMatches(foundMatches)
    setCurrentMatch(0)
    onHighlight(foundMatches)
  }, [searchTerm, history, onHighlight])

  const handleNext = () => {
    if (matches.length > 0) {
      setCurrentMatch((prev) => (prev + 1) % matches.length)
    }
  }

  const handlePrevious = () => {
    if (matches.length > 0) {
      setCurrentMatch((prev) => (prev - 1 + matches.length) % matches.length)
    }
  }

  if (!isOpen) return null

  return (
    <div className="absolute top-2 right-2 bg-card border border-border rounded-lg p-3 shadow-lg z-10 min-w-80">
      <div className="flex items-center gap-2 mb-2">
        <Search className="h-4 w-4 text-muted-foreground" />
        <Input
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Search terminal history..."
          className="flex-1 h-8"
          autoFocus
        />
        <Button size="sm" variant="ghost" onClick={onClose} className="h-8 w-8 p-0">
          <X className="h-4 w-4" />
        </Button>
      </div>

      {matches.length > 0 && (
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>
            {currentMatch + 1} of {matches.length} matches
          </span>
          <div className="flex gap-1">
            <Button size="sm" variant="ghost" onClick={handlePrevious} className="h-6 w-6 p-0">
              <ChevronUp className="h-3 w-3" />
            </Button>
            <Button size="sm" variant="ghost" onClick={handleNext} className="h-6 w-6 p-0">
              <ChevronDown className="h-3 w-3" />
            </Button>
          </div>
        </div>
      )}

      {searchTerm && matches.length === 0 && <div className="text-sm text-muted-foreground">No matches found</div>}
    </div>
  )
}
