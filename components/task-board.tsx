"use client"

import type React from "react"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Search, Filter, Calendar, AlertCircle, CheckCircle2, Clock, Plus } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { TaskAddModal } from "@/components/task-add-modal"
import Link from "next/link"

interface TaskBoardProps {
  boards: any[]
  tasks: any[]
  weddingId?: string
}

export function TaskBoard({ boards, tasks, weddingId }: TaskBoardProps) {
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedPriority, setSelectedPriority] = useState("all")
  const [draggedTask, setDraggedTask] = useState<any>(null)
  const [renamingBoardId, setRenamingBoardId] = useState<string | null>(null)
  const [tempBoardName, setTempBoardName] = useState("")
  const supabase = createClient()

  const filteredTasks = tasks.filter((task) => {
    const matchesSearch =
      task.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      task.description?.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesPriority = selectedPriority === "all" || task.priority === selectedPriority
    return matchesSearch && matchesPriority
  })

  // Use boards directly without grouping to avoid duplicates
  const tasksByBoard = boards.map((board) => {
    const boardTasks = filteredTasks.filter((t) => t.board_id === board.id)
    return { ...board, tasks: boardTasks, count: boardTasks.length }
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
    <div className="space-y-6">
      {/* Enhanced Search and Filter */}
      <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-xl rounded-2xl">
        <CardContent className="py-4">
          <div className="flex items-center gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 h-5 w-5" />
              <Input
                placeholder="Kërko detyra..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 h-12 text-sm bg-white/70 border-slate-200 rounded-xl focus:ring-2 focus:ring-slate-300 focus:border-slate-300"
              />
            </div>
            <div className="flex items-center gap-3 text-sm">
              <Filter className="h-5 w-5 text-slate-400" />
              <select
                value={selectedPriority}
                onChange={(e) => setSelectedPriority(e.target.value)}
                className="px-4 py-3 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-slate-300 bg-white/70"
              >
                <option value="all">Të gjitha</option>
                <option value="urgent">Urgjente</option>
                <option value="high">Të larta</option>
                <option value="medium">Mesatare</option>
                <option value="low">Të ulëta</option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Enhanced Task Board */}
      <div className="flex gap-6 overflow-x-auto pb-4 pr-4" style={{ scrollbarWidth: "thin" }}>
        {tasksByBoard.map((column) => (
          <div
            key={column.id}
            className="flex-shrink-0 w-[280px] sm:w-[300px] flex flex-col"
            onDragOver={handleDragOver}
            onDrop={(e) => handleDrop(e, column.id)}
          >
            {/* Enhanced Column Header */}
            <Card
              className={`bg-white/90 backdrop-blur-sm border-0 shadow-lg rounded-2xl ${getBoardAccent(column.color)}`}
              style={{ borderTopColor: column.color || undefined }}
            >
              <CardHeader className="py-4 sticky top-0 bg-gradient-to-r from-white/95 to-gray-50/95 z-10 rounded-t-2xl">
                <div className="flex items-center justify-between gap-3">
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
                      className="h-8 text-sm rounded-xl"
                    />
                  ) : (
                    <button
                      className="text-left flex items-center gap-2"
                      onClick={() => startRenaming(column)}
                      title="Click to rename"
                    >
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: column.color || '#6b7280' }}></div>
                      <CardTitle className="text-sm font-bold text-gray-800 tracking-tight">
                        {column.name === 'To Do' ? 'Për t\'u bërë' :
                         column.name === 'In Progress' ? 'Në proces' :
                         column.name === 'Review' ? 'Rishikim' :
                         column.name === 'Done' ? 'Përfunduar' : column.name}
                      </CardTitle>
                    </button>
                  )}
                  <Badge variant="outline" className="bg-gradient-to-r from-slate-100 to-gray-100 text-slate-700 border-slate-200 font-bold">
                    {column.count}
                  </Badge>
                </div>
              </CardHeader>
            </Card>

            {/* Enhanced Tasks */}
            <div className="space-y-3 mt-4 overflow-y-auto pr-2 max-h-[70vh]" style={{ scrollbarWidth: "thin" }}>
              {column.tasks.map((task: any) => (
                <Card
                  key={task.id}
                  className="bg-white/90 backdrop-blur-sm border-0 shadow-lg hover:shadow-xl transition-all cursor-move rounded-xl transform hover:scale-[1.02]"
                  draggable
                  onDragStart={(e) => handleDragStart(e, task)}
                >
                  <CardContent className="p-4">
                    <div className="space-y-3">
                      {/* Enhanced Task Header */}
                      <div className="flex items-start justify-between gap-2">
                        <h3 className="font-semibold text-sm text-gray-800 line-clamp-2 leading-relaxed">{task.title}</h3>
                        <div className="flex items-center gap-1">
                          <Badge variant="outline" className={`${getPriorityColor(task.priority)} text-xs font-medium border-0`}>
                            {task.priority === 'urgent' ? 'Urgjente' : 
                             task.priority === 'high' ? 'E lartë' :
                             task.priority === 'medium' ? 'Mesatare' :
                             task.priority === 'low' ? 'E ulët' : 'Mesatare'}
                          </Badge>
                        </div>
                      </div>

                      {/* Enhanced Task Description */}
                      {task.description && (
                        <p className="text-xs text-gray-600 line-clamp-2 bg-gray-50 px-3 py-2 rounded-lg">
                          {task.description}
                        </p>
                      )}

                      {/* Enhanced Task Footer */}
                      <div className="flex items-center justify-between text-xs">
                        {task.due_date && (
                          <div className={`flex items-center gap-2 px-2 py-1 rounded-lg ${
                            isOverdue(task.due_date) 
                              ? "bg-red-50 text-red-700" 
                              : "bg-blue-50 text-blue-700"
                          }`}>
                            <Calendar className="h-3 w-3" />
                            <span>{new Date(task.due_date).toLocaleDateString('sq-AL')}</span>
                          </div>
                        )}
                      </div>

                      {/* Enhanced Overdue Warning */}
                      {task.due_date && isOverdue(task.due_date) && (
                        <div className="flex items-center gap-2 text-red-600 text-xs bg-red-50 px-3 py-2 rounded-lg">
                          <AlertCircle className="h-4 w-4" />
                          <span className="font-medium">Vonuar!</span>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}

              {/* Enhanced Add Task Button */}
              {weddingId && (
                <TaskAddModal 
                  boardId={column.id} 
                  boardName={column.name}
                  weddingId={weddingId}
                />
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
