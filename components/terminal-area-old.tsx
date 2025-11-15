"use client"

import type React from "react"

import { useState, useEffect, useRef, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Terminal as TerminalIcon, Plus, X, Settings, Maximize2, Minimize2 } from "lucide-react"
import type { SSHConnection } from "./ssh-manager"
import { Terminal } from "./terminal"
import { cn } from "@/lib/utils"

interface TerminalAreaProps {
  connections: SSHConnection[]
  activeConnection: string | null
}

interface TerminalTab {
  id: string
  connectionId: string
  title: string
  isActive: boolean
  status: 'connecting' | 'connected' | 'disconnected' | 'error'
}

export function TerminalArea({ connections, activeConnection }: TerminalAreaProps) {
  const [tabs, setTabs] = useState<TerminalTab[]>([])
  const [activeTab, setActiveTab] = useState<string | null>(null)

  const activeConnectionData = connections.find((c) => c.id === activeConnection)

  // Crear nueva pestaña cuando hay una conexión activa
  useEffect(() => {
    if (activeConnection && activeConnectionData?.status === "connected") {
      setTabs((currentTabs) => {
        const existingTab = currentTabs.find((tab) => tab.connectionId === activeConnection)

        if (!existingTab) {
          const newTabId = `tab-${activeConnection}-${Date.now()}`
          const newTab: TerminalTab = {
            id: newTabId,
            connectionId: activeConnection,
            title: activeConnectionData.name,
            isActive: true,
            status: 'connecting'
          }

          setActiveTab(newTabId)
          return [...currentTabs.map((t) => ({ ...t, isActive: false })), newTab]
        } else {
          setActiveTab(existingTab.id)
          return currentTabs.map((tab) => ({
            ...tab,
            isActive: tab.id === existingTab.id,
          }))
        }
      })
    }
  }, [activeConnection, activeConnectionData?.status, activeConnectionData?.name])

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [currentSession?.history])

  useEffect(() => {
    if (inputRef.current && activeTab) {
      inputRef.current.focus()
    }
  }, [activeTab])

  const handleTabSelect = useCallback(
    (tabId: string) => {
      setTabs((prev) =>
        prev.map((tab) => ({
          ...tab,
          isActive: tab.id === tabId,
        })),
      )

      const tab = tabs.find((t) => t.id === tabId)
      if (tab) {
        const session = sessions.find((s) => s.connectionId === tab.connectionId)
        if (session) {
          setActiveTab(session.id)
        }
      }
    },
    [tabs, sessions],
  )

  const handleTabClose = useCallback(
    (tabId: string) => {
      const tab = tabs.find((t) => t.id === tabId)
      if (!tab) return

      setTabs((currentTabs) => {
        const newTabs = currentTabs.filter((t) => t.id !== tabId)

        setSessions((prev) => prev.filter((s) => s.connectionId !== tab.connectionId))

        if (tab.isActive) {
          if (newTabs.length > 0) {
            const nextTab = newTabs[0]
            setActiveTab(sessions.find((s) => s.connectionId === nextTab.connectionId)?.id || null)
            return newTabs.map((t) => ({
              ...t,
              isActive: t.id === nextTab.id,
            }))
          } else {
            setActiveTab(null)
            return newTabs
          }
        }

        return newTabs
      })
    },
    [tabs, sessions],
  )

  const handleNewTab = useCallback(() => {
    console.log("New tab requested - would show connection selector")
  }, [])

  const handleCommand = useCallback(
    (command: string) => {
      if (!currentSession || !activeConnectionData) return

      setSessions((prev) =>
        prev.map((session) =>
          session.id === currentSession.id
            ? {
                ...session,
                history: [
                  ...session.history,
                  {
                    type: "input",
                    content: `${activeConnectionData.username}@${activeConnectionData.host}:~$ ${command}`,
                    timestamp: new Date(),
                  },
                ],
              }
            : session,
        ),
      )

      setTimeout(
        () => {
          let output = ""

          switch (command.toLowerCase().trim()) {
            case "ls":
              output = "Documents  Downloads  Pictures  Videos  projects  .bashrc  .profile"
              break
            case "pwd":
              output = `/home/${activeConnectionData.username}`
              break
            case "whoami":
              output = activeConnectionData.username
              break
            case "date":
              output = new Date().toString()
              break
            case "uname -a":
              output =
                "Linux server 5.15.0-72-generic #79-Ubuntu SMP Wed Apr 19 08:22:18 UTC 2023 x86_64 x86_64 x86_64 GNU/Linux"
              break
            case "ps aux":
              output = `USER       PID %CPU %MEM    VSZ   RSS TTY      STAT START   TIME COMMAND
root         1  0.0  0.1 168576 11788 ?        Ss   10:00   0:01 /sbin/init
root         2  0.0  0.0      0     0 ?        S    10:00   0:00 [kthreadd]
${activeConnectionData.username}  1234  0.0  0.2  21532  4128 pts/0    Ss   10:30   0:00 -bash`
              break
            case "clear":
              setSessions((prev) =>
                prev.map((session) => (session.id === currentSession.id ? { ...session, history: [] } : session)),
              )
              return
            case "help":
              output = `Available commands:
ls       - List directory contents
pwd      - Print working directory  
whoami   - Display current username
date     - Show current date and time
uname -a - System information
ps aux   - List running processes
clear    - Clear terminal
exit     - Close connection
help     - Show this help message`
              break
            case "exit":
              output = "Connection closed."
              break
            default:
              if (command.trim()) {
                output = `bash: ${command}: command not found`
              }
          }

          if (output) {
            setSessions((prev) =>
              prev.map((session) =>
                session.id === currentSession.id
                  ? {
                      ...session,
                      history: [
                        ...session.history,
                        {
                          type: "output",
                          content: output,
                          timestamp: new Date(),
                        },
                      ],
                    }
                  : session,
              ),
            )
          }
        },
        Math.random() * 500 + 200,
      )
    },
    [currentSession, activeConnectionData],
  )

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter" && currentInput.trim()) {
        handleCommand(currentInput)
        setCurrentInput("")
      }
    },
    [currentInput, handleCommand],
  )

  const handleCloseActiveTab = useCallback(() => {
    const activeTabData = tabs.find((t) => t.isActive)
    if (activeTabData) {
      handleTabClose(activeTabData.id)
    }
  }, [tabs, handleTabClose])

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey) {
        switch (e.key) {
          case "f":
            e.preventDefault()
            setShowSearch(true)
            break
          case "k":
            e.preventDefault()
            setShowFavorites(true)
            break
          case "m":
            e.preventDefault()
            setShowResourceMonitor(!showResourceMonitor)
            break
          case "=":
          case "+":
            e.preventDefault()
            setFontSize((prev) => Math.min(prev + 2, 24))
            break
          case "-":
            e.preventDefault()
            setFontSize((prev) => Math.max(prev - 2, 10))
            break
        }
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [showResourceMonitor])

  if (tabs.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center bg-background">
        <div className="text-center space-y-4">
          <Terminal className="h-16 w-16 text-muted-foreground mx-auto" />
          <div>
            <h2 className="text-xl font-semibold text-foreground mb-2">No Terminal Sessions</h2>
            <p className="text-muted-foreground">Connect to a server to start a terminal session</p>
          </div>
        </div>
      </div>
    )
  }

  if (!currentSession) {
    return (
      <div className="flex-1 flex flex-col bg-background">
        <TerminalTabs
          tabs={tabs}
          connections={connections}
          onTabSelect={handleTabSelect}
          onTabClose={handleTabClose}
          onNewTab={handleNewTab}
        />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center space-y-4">
            <Terminal className="h-16 w-16 text-muted-foreground mx-auto" />
            <div>
              <h2 className="text-xl font-semibold text-foreground mb-2">Session Loading</h2>
              <p className="text-muted-foreground">Preparing terminal session...</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  const sessionConnection = connections.find((c) => c.id === currentSession.connectionId)

  return (
    <div className="flex-1 flex flex-col bg-background relative">
      <TerminalTabs
        tabs={tabs}
        connections={connections}
        onTabSelect={handleTabSelect}
        onTabClose={handleTabClose}
        onNewTab={handleNewTab}
      />

      <div className="bg-card border-b border-border px-4 py-2 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Terminal className="h-4 w-4 text-primary" />
          <span className="font-medium text-card-foreground">{sessionConnection?.name}</span>
          <span className="text-sm text-muted-foreground">
            {sessionConnection?.username}@{sessionConnection?.host}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="ghost"
            className="h-6 w-6 p-0"
            onClick={() => setShowSearch(true)}
            title="Search (Ctrl+F)"
          >
            <Search className="h-3 w-3" />
          </Button>
          <Button
            size="sm"
            variant="ghost"
            className="h-6 w-6 p-0"
            onClick={() => setShowFavorites(true)}
            title="Favorites (Ctrl+K)"
          >
            <Star className="h-3 w-3" />
          </Button>
          <Button
            size="sm"
            variant="ghost"
            className={cn("h-6 w-6 p-0", showResourceMonitor && "bg-accent/20")}
            onClick={() => setShowResourceMonitor(!showResourceMonitor)}
            title="Resource Monitor (Ctrl+M)"
          >
            <Activity className="h-3 w-3" />
          </Button>
          <Button size="sm" variant="ghost" className="h-6 w-6 p-0" title="Font Size">
            <Type className="h-3 w-3" />
          </Button>
          <Button size="sm" variant="ghost" className="h-6 w-6 p-0">
            <Copy className="h-3 w-3" />
          </Button>
          <Button size="sm" variant="ghost" className="h-6 w-6 p-0">
            <Settings className="h-3 w-3" />
          </Button>
          <Button size="sm" variant="ghost" className="h-6 w-6 p-0">
            <Minimize2 className="h-3 w-3" />
          </Button>
          <Button size="sm" variant="ghost" className="h-6 w-6 p-0">
            <Maximize2 className="h-3 w-3" />
          </Button>
          <Button
            size="sm"
            variant="ghost"
            className="h-6 w-6 p-0 text-destructive hover:text-destructive"
            onClick={handleCloseActiveTab}
          >
            <X className="h-3 w-3" />
          </Button>
        </div>
      </div>

      <div className="flex-1 flex flex-col bg-background">
        <ScrollArea className="flex-1 custom-scrollbar" ref={scrollRef}>
          <div className="p-4 font-mono space-y-1" style={{ fontSize: `${fontSize}px` }}>
            {currentSession.history.map((entry, index) => (
              <div
                key={index}
                className={cn(
                  "terminal-output",
                  entry.type === "input" && "text-accent",
                  entry.type === "output" && "text-foreground",
                  entry.type === "system" && "text-muted-foreground italic",
                  highlightedLines.includes(index) && "bg-accent/20",
                )}
              >
                {entry.content}
              </div>
            ))}

            {currentSession && (
              <div className="flex items-center text-accent">
                <span className="mr-2">
                  {sessionConnection?.username}@{sessionConnection?.host}:~$
                </span>
                <Input
                  ref={inputRef}
                  value={currentInput}
                  onChange={(e) => setCurrentInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  className="flex-1 bg-transparent border-none p-0 h-auto font-mono text-foreground focus-visible:ring-0 focus-visible:ring-offset-0"
                  style={{ fontSize: `${fontSize}px` }}
                  placeholder="Type a command..."
                />
                <span className="terminal-cursor ml-1 w-2 h-4 bg-accent"></span>
              </div>
            )}
          </div>
        </ScrollArea>
      </div>

      <TerminalSearch
        isOpen={showSearch}
        onClose={() => setShowSearch(false)}
        history={currentSession.history || []}
        onHighlight={setHighlightedLines}
      />

      <CommandFavorites
        isOpen={showFavorites}
        onClose={() => setShowFavorites(false)}
        onExecuteCommand={(command) => {
          handleCommand(command)
          setShowFavorites(false)
        }}
      />

      <ResourceMonitor connectionId={activeConnection || ""} isVisible={showResourceMonitor} />
    </div>
  )
}
