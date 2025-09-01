"use client"

import type React from "react"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Search, Filter, Calendar, AlertCircle, CheckCircle2, Clock, Plus } from "lucide-react"
import { createBrowserClient } from "@/lib/supabase/client"
import Link from "next/link"

interface TaskBoardProps {
  boards: any[]
  tasks: any[]
}

export function TaskBoard({ boards, tasks }: TaskBoardProps) {
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedPriority, setSelectedPriority] = useState("all")
  const [draggedTask, setDraggedTask] = useState<any>(null)
  const [renamingBoardId, setRenamingBoardId] = useState<string | null>(null)
  const [tempBoardName, setTempBoardName] = useState("")
  const supabase = createBrowserClient()

  const filteredTasks = tasks.filter((task) => {
    const matchesSearch =
      task.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      task.description?.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesPriority = selectedPriority === "all" || task.priority === selectedPriority
    return matchesSearch && matchesPriority
  })

  // Group boards by normalized name (per wedding) and merge their tasks into one column
  const normalize = (s: string) => (s || "").trim().toLowerCase()
  type BoardGroup = { 
    id: string
    name: string
    wedding_id: string
    position?: number
    color?: string | null
    ids: string[]
  }
  const groupsMap = new Map<string, BoardGroup>()
  for (const b of boards) {
    const key = `${b.wedding_id}:${normalize(b.name)}`
    if (!groupsMap.has(key)) {
      groupsMap.set(key, { id: b.id, name: b.name, wedding_id: b.wedding_id, position: b.position, color: b.color, ids: [b.id] })
    } else {
      groupsMap.get(key)!.ids.push(b.id)
    }
  }
  const groupedBoards = Array.from(groupsMap.values()).sort(
    (a, b) => (a.position ?? 0) - (b.position ?? 0)
  )

  const tasksByBoard = groupedBoards.map((group) => {
    const boardTasks = filteredTasks.filter((t) => group.ids.includes(t.board_id))
    return { ...group, tasks: boardTasks, count: boardTasks.length }
  })

  const getPriorityColor = (priority: string) => {
    const colors: { [key: string]: string } = {
      low: "bg-green-100 text-green-800",
      medium: "bg-yellow-100 text-yellow-800",
      high: "bg-orange-100 text-orange-800",
      urgent: "bg-red-100 text-red-800",
    }
    return colors[priority] || "bg-gray-100 text-gray-800"
  }

  const getPriorityDot = (priority: string) => {
    const map: Record<string, string> = {
      urgent: "bg-red-500",
      high: "bg-orange-500",
      medium: "bg-yellow-500",
      low: "bg-green-500",
    }
    return <span className={`inline-block h-2 w-2 rounded-full ${map[priority] || "bg-gray-400"}`} />
  }

  const handleDragStart = (e: React.DragEvent, task: any) => {
    setDraggedTask(task)
    e.dataTransfer.effectAllowed = "move"
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = "move"
  }

  const handleDrop = async (e: React.DragEvent, targetBoardId: string) => {
    e.preventDefault()

    if (!draggedTask || draggedTask.board_id === targetBoardId) {
      setDraggedTask(null)
      return
    }

    try {
      // compute next position at end of target board
      const maxPos = Math.max(0, ...filteredTasks.filter((t) => t.board_id === targetBoardId).map((t) => t.position || 0))
      const nextPos = (isFinite(maxPos) ? maxPos : 0) + 1
      const { error } = await supabase
        .from("tasks")
        .update({ board_id: targetBoardId, position: nextPos })
        .eq("id", draggedTask.id)

      if (error) throw error

      // Update local state
      window.location.reload()
    } catch (error) {
      console.error("Error updating task status:", error)
    } finally {
      setDraggedTask(null)
    }
  }

  const getBoardAccent = (hex?: string | null) => {
    // convert provided hex to a subtle border if available
    return hex ? "border-t-2" : ""
  }

  const startRenaming = (board: any) => {
    setRenamingBoardId(board.id)
    setTempBoardName(board.name)
  }

  const saveBoardName = async (board: any) => {
    if (!tempBoardName || tempBoardName === board.name) {
      setRenamingBoardId(null)
      return
    }
    try {
      // If this column represents a grouped set, update all ids; else just the single id
      const ids: string[] = Array.isArray(board.ids) && board.ids.length ? board.ids : [board.id]
      const { error } = await supabase.from("task_boards").update({ name: tempBoardName }).in("id", ids)
      if (error) throw error
      window.location.reload()
    } catch (e) {
      console.error("Rename board error", e)
    } finally {
      setRenamingBoardId(null)
    }
  }

  const isOverdue = (dueDate: string) => {
    return new Date(dueDate) < new Date() && dueDate
  }

  return (
    <div className="space-y-4">
      {/* Search and Filter */}
      <Card className="border-slate-200">
        <CardContent className="py-3">
          <div className="flex items-center gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Search tasks"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8 h-8 text-sm"
              />
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Filter className="h-4 w-4 text-gray-400" />
              <select
                value={selectedPriority}
                onChange={(e) => setSelectedPriority(e.target.value)}
                className="px-2 py-1.5 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-slate-500"
              >
                <option value="all">All</option>
                <option value="urgent">Urgent</option>
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Task Board */}
      <div className="flex gap-4 overflow-x-auto pb-1 pr-1" style={{ scrollbarWidth: "thin" }}>
        {tasksByBoard.map((column) => (
          <div
            key={column.id}
            className="flex-shrink-0 w-[240px] sm:w-[260px] flex flex-col"
            onDragOver={handleDragOver}
            onDrop={(e) => handleDrop(e, column.id)}
          >
            {/* Column Header */}
            <Card
              className={`border-slate-200 ${getBoardAccent(column.color)}`}
              style={{ borderTopColor: column.color || undefined }}
            >
              <CardHeader className="py-2 sticky top-0 bg-slate-50 z-10 rounded-t-md">
                <div className="flex items-center justify-between gap-2">
                  {renamingBoardId === column.id ? (
                    <Input
                      autoFocus
                      value={tempBoardName}
                      onChange={(e) => setTempBoardName(e.target.value)}
                      onBlur={() => saveBoardName(column)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") saveBoardName(column)
                        if (e.key === "Escape") setRenamingBoardId(null)
                      }}
                      className="h-7 text-sm"
                    />
                  ) : (
                    <button
                      className="text-left"
                      onClick={() => startRenaming(column)}
                      title="Click to rename"
                    >
                      <CardTitle className="text-[13px] font-semibold text-slate-900 tracking-tight">{column.name}</CardTitle>
                    </button>
                  )}
                  <Badge variant="secondary" className="bg-white/60 text-xs">
                    {column.count}
                  </Badge>
                </div>
              </CardHeader>
            </Card>

            {/* Tasks */}
            <div className="space-y-2 mt-2 overflow-y-auto pr-1 max-h-[70vh]" style={{ scrollbarWidth: "thin" }}>
              {column.tasks.map((task: any) => (
                <Card
                  key={task.id}
                  className="border-slate-200 hover:shadow-sm transition-shadow cursor-move"
                  draggable
                  onDragStart={(e) => handleDragStart(e, task)}
                >
                  <CardContent className="p-2.5">
                    <div className="space-y-2">
                      {/* Task Header */}
                      <div className="flex items-start justify-between gap-2">
                        <h3 className="font-medium text-[13px] text-slate-900 line-clamp-2">{task.title}</h3>
                        <div className="flex items-center gap-1">
                          {getPriorityDot(task.priority)}
                        </div>
                      </div>

                      {/* Task Description */}
                      {task.description && <p className="text-xs text-gray-600 line-clamp-2">{task.description}</p>}

                      {/* Task Footer */}
                      <div className="flex items-center justify-end text-[10px] text-gray-500">
                        {task.due_date && (
                          <div className={`flex items-center gap-1 ${isOverdue(task.due_date) ? "text-red-600" : ""}`}>
                            <Calendar className="h-3 w-3" />
                            <span>{new Date(task.due_date).toLocaleDateString()}</span>
                          </div>
                        )}
                      </div>

                      {/* Overdue Warning */}
                      {task.due_date && isOverdue(task.due_date) && (
                        <div className="flex items-center gap-1 text-red-600 text-[10px]">
                          <AlertCircle className="h-3 w-3" />
                          <span>Overdue</span>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}

              {/* Add Task Button (preselect this column) */}
              <Link href={`/dashboard/tasks/new?board=${column.id}`}>
                <Card className="border-dashed border border-slate-300 hover:border-slate-400 transition-colors">
                  <CardContent className="p-2">
                    <div className="flex items-center justify-center gap-2 text-slate-600 hover:text-slate-700 text-xs">
                      <Plus className="h-3 w-3" />
                      <span>Add Task</span>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
