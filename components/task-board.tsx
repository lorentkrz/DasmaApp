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
    const title = (task.title || "").toString()
    const description = (task.description || "").toString()
    const query = (searchTerm || "").toString().toLowerCase()
    const matchesSearch =
      title.toLowerCase().includes(query) ||
      description.toLowerCase().includes(query)
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
      {/* Search and Filter */}
      <Card className="border">
        <CardContent className="py-4">
          <div className="flex items-center gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Kërko detyra..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Filter className="h-4 w-4 text-gray-400" />
              <select
                value={selectedPriority}
                onChange={(e) => setSelectedPriority(e.target.value)}
                className="px-3 py-2 border border-gray-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-gray-200 bg-white"
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

      {/* Task Board */}
      <div className="flex gap-4 overflow-x-auto pb-4 pr-4">
        {tasksByBoard.map((column) => (
          <div
            key={column.id}
            className="flex-shrink-0 w-[280px] flex flex-col"
            onDragOver={handleDragOver}
            onDrop={(e) => handleDrop(e, column.id)}
          >
            {/* Column Header */}
            <Card className="border">
              <CardHeader className="py-3">
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
                      className="h-8 text-sm"
                    />
                  ) : (
                    <button
                      className="text-left flex items-center gap-2"
                      onClick={() => startRenaming(column)}
                      title="Click to rename"
                    >
                      <div className="w-3 h-3 rounded-full bg-gray-400"></div>
                      <CardTitle className="text-sm font-medium text-gray-900">
                        {column.name === 'To Do' ? 'Për t\'u bërë' :
                         column.name === 'In Progress' ? 'Në proces' :
                         column.name === 'Review' ? 'Rishikim' :
                         column.name === 'Done' ? 'Përfunduar' : column.name}
                      </CardTitle>
                    </button>
                  )}
                  <Badge variant="outline" className="bg-gray-50 text-gray-700 border-gray-200">
                    {column.count}
                  </Badge>
                </div>
              </CardHeader>
            </Card>

            {/* Tasks */}
            <div className="space-y-3 mt-3 overflow-y-auto max-h-[70vh]">
              {column.tasks.map((task: any) => (
                <Card
                  key={task.id}
                  className="border hover:shadow-md transition-shadow cursor-move"
                  draggable
                  onDragStart={(e) => handleDragStart(e, task)}
                >
                  <CardContent className="p-3">
                    <div className="space-y-2">
                      {/* Task Header */}
                      <div className="flex items-start justify-between gap-2">
                        <h3 className="font-medium text-sm text-gray-900 line-clamp-2">{task.title}</h3>
                        <Badge variant="outline" className={`${getPriorityColor(task.priority)} text-xs`}>
                          {task.priority === 'urgent' ? 'Urgjente' : 
                           task.priority === 'high' ? 'E lartë' :
                           task.priority === 'medium' ? 'Mesatare' :
                           task.priority === 'low' ? 'E ulët' : 'Mesatare'}
                        </Badge>
                      </div>

                      {/* Task Description */}
                      {task.description && (
                        <p className="text-xs text-gray-600 line-clamp-2 bg-gray-50 px-2 py-1 rounded">
                          {task.description}
                        </p>
                      )}

                      {/* Task Footer */}
                      <div className="flex items-center justify-between text-xs">
                        {task.due_date && (
                          <div className={`flex items-center gap-1 px-2 py-1 rounded ${
                            isOverdue(task.due_date) 
                              ? "bg-red-50 text-red-700" 
                              : "bg-blue-50 text-blue-700"
                          }`}>
                            <Calendar className="h-3 w-3" />
                            <span>{new Date(task.due_date).toLocaleDateString('sq-AL')}</span>
                          </div>
                        )}
                      </div>

                      {/* Overdue Warning */}
                      {task.due_date && isOverdue(task.due_date) && (
                        <div className="flex items-center gap-2 text-red-600 text-xs bg-red-50 px-2 py-1 rounded">
                          <AlertCircle className="h-3 w-3" />
                          <span>Vonuar!</span>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}

              {/* Add Task Button */}
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
