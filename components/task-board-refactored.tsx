"use client"

import type React from "react"
import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { StandardDropdown } from "@/components/ui/standard-dropdown"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { 
  Search, 
  Filter, 
  Calendar, 
  AlertCircle, 
  CheckCircle2, 
  Clock, 
  Plus,
  Edit,
  Trash2,
  Star,
  Flag,
  User,
  ChevronRight,
  Heart,
  Sparkles,
  CheckSquare,
  Circle,
  Square,
  AlertTriangle,
  Timer,
  CalendarClock,
  Users,
  FileText
} from "lucide-react"
import { format } from "date-fns"
import { createClient } from "@/lib/supabase/client"
import { TaskAddModal } from "@/components/task-add-modal"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useToast } from "@/hooks/use-toast"

interface TaskBoardProps {
  boards: any[]
  tasks: any[]
  weddingId: string
}

const priorityOptions = [
  { label: "Të gjitha", value: "all" },
  { label: "Urgjente", value: "urgent" },
  { label: "Të larta", value: "high" },
  { label: "Mesatare", value: "medium" },
  { label: "Të ulëta", value: "low" }
]

export function TaskBoardRefactored({ boards, tasks, weddingId }: TaskBoardProps) {
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedPriority, setSelectedPriority] = useState("all")
  const [selectedView, setSelectedView] = useState("kanban")
  const [draggedTask, setDraggedTask] = useState<any>(null)
  const [renamingBoardId, setRenamingBoardId] = useState<string | null>(null)
  const [tempBoardName, setTempBoardName] = useState("")
  const [showAddModal, setShowAddModal] = useState(false)
  const [selectedBoardForAdd, setSelectedBoardForAdd] = useState<string | null>(null)
  
  const supabase = createClient()
  const router = useRouter()
  const { toast } = useToast()

  // Debug logging
  console.log('=== TASK BOARD DEBUG ===')
  console.log('Boards count:', boards?.length || 0)
  console.log('Tasks count:', tasks?.length || 0)
  console.log('Boards:', boards)
  console.log('Tasks:', tasks)
  console.log('Wedding ID:', weddingId)

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

  const tasksByBoard = boards.map((board) => {
    const boardTasks = filteredTasks.filter((t) => t.board_id === board.id)
    return { ...board, tasks: boardTasks, count: boardTasks.length }
  })

  const getPriorityBadge = (priority: string) => {
    const configs: Record<"urgent" | "high" | "medium" | "low", { label: string; className: string; icon: React.ReactNode }> = {
      urgent: { 
        label: "Urgjente", 
        className: "bg-red-100 text-red-800 border-red-200",
        icon: <AlertCircle className="h-3 w-3" />
      },
      high: { 
        label: "E lartë", 
        className: "bg-orange-100 text-orange-800 border-orange-200",
        icon: <Flag className="h-3 w-3" />
      },
      medium: { 
        label: "Mesatare", 
        className: "bg-yellow-100 text-yellow-800 border-yellow-200",
        icon: <Star className="h-3 w-3" />
      },
      low: { 
        label: "E ulët", 
        className: "bg-green-100 text-green-800 border-green-200",
        icon: <Circle className="h-3 w-3" />
      }
    }

    const allowed = ["urgent", "high", "medium", "low"] as const
    const isAllowed = (p: string): p is typeof allowed[number] => (allowed as readonly string[]).includes(p)
    const config = isAllowed(priority)
      ? configs[priority]
      : { label: priority, className: "bg-gray-100 text-gray-800", icon: null }
    
    return (
      <Badge className={`${config.className} flex items-center gap-1`}>
        {config.icon}
        {config.label}
      </Badge>
    )
  }

  const getBoardColor = (position: number) => {
    const colors = [
      "bg-gradient-to-br from-slate-50 to-gray-100",
      "bg-gradient-to-br from-blue-50 to-indigo-100", 
      "bg-gradient-to-br from-amber-50 to-yellow-100",
      "bg-gradient-to-br from-emerald-50 to-green-100"
    ]
    return colors[position - 1] || colors[0]
  }

  const getBoardIcon = (position: number) => {
    const icons = [
      <Square className="h-4 w-4" />,
      <Clock className="h-4 w-4" />,
      <AlertTriangle className="h-4 w-4" />,
      <CheckCircle2 className="h-4 w-4" />
    ]
    return icons[position - 1] || icons[0]
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
      const maxPos = Math.max(0, ...filteredTasks.filter((t) => t.board_id === targetBoardId).map((t) => t.position || 0))
      const nextPos = (isFinite(maxPos) ? maxPos : 0) + 1
      const { error } = await supabase
        .from("tasks")
        .update({ board_id: targetBoardId, position: nextPos })
        .eq("id", draggedTask.id)

      if (error) throw error

      toast({
        title: "Detyrë u zhvendos!",
        description: "Statusi i detyrës u përditësua me sukses."
      })
      
      router.refresh()
    } catch (error) {
      console.error("Error updating task status:", error)
      toast({
        title: "Gabim!",
        description: "Nuk u arrit të përditësohej statusi i detyrës.",
        variant: "destructive"
      })
    } finally {
      setDraggedTask(null)
    }
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
      const ids: string[] = Array.isArray(board.ids) && board.ids.length ? board.ids : [board.id]
      const { error } = await supabase.from("task_boards").update({ name: tempBoardName }).in("id", ids)
      if (error) throw error
      
      toast({
        title: "Bordi u riemërua!",
        description: `Bordi u riemërua në "${tempBoardName}"`
      })
      
      router.refresh()
    } catch (e) {
      console.error("Rename board error", e)
      toast({
        title: "Gabim!",
        description: "Nuk u arrit të riemërohej bordi.",
        variant: "destructive"
      })
    } finally {
      setRenamingBoardId(null)
    }
  }

  const isOverdue = (dueDate: string) => {
    return dueDate && new Date(dueDate) < new Date()
  }

  const deleteTask = async (taskId: string) => {
    try {
      const { error } = await supabase
        .from("tasks")
        .delete()
        .eq("id", taskId)
        
      if (error) throw error
      
      toast({
        title: "Detyrë u fshi!",
        description: "Detyra u largua nga lista."
      })
      
      router.refresh()
    } catch (error) {
      console.error("Error deleting task:", error)
      toast({
        title: "Gabim!",
        description: "Nuk u arrit të fshihej detyra.",
        variant: "destructive"
      })
    }
  }

  // Calculate stats
  const totalTasks = tasks.length
  const completedTasks = tasks.filter(t => {
    const doneBoard = boards.find(b => b.name.toLowerCase().includes('done') || b.name.toLowerCase().includes('përfunduar'))
    return doneBoard && t.board_id === doneBoard.id
  }).length

  return (
    <div className="space-y-6">
      {/* Glass Header */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-[color:var(--text-2025)] dark:text-[color:var(--text-dark)]">Detyrat e Dasmës</h1>
            <p className="text-sm text-[color:var(--muted-2025)] dark:text-[color:var(--muted-dark)] mt-1">
              Organizoni dhe ndiqni detyrat për dasmën tuaj
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant={selectedView === "kanban" ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedView("kanban")}
              className="rounded-r-none"
            >
              Kanban
            </Button>
            <Button
              variant={selectedView === "list" ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedView("list")}
              className="rounded-l-none"
            >
              Listë
            </Button>
            <Button asChild className="bg-gradient-to-r from-rose-500 to-pink-600 hover:from-rose-600 hover:to-pink-700 text-white border-0">
              <Link href="/dashboard/tasks/new">
                <Plus className="h-4 w-4 mr-2" />
                Shto Detyrë
              </Link>
            </Button>
          </div>
        </div>

        {/* Quick Filters */}
        <div className="flex gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Kërko detyra..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <StandardDropdown
            value={selectedPriority}
            onValueChange={(value) => setSelectedPriority(Array.isArray(value) ? value[0] : value)}
            options={priorityOptions}
            placeholder="Prioriteti"
            className="w-48"
          />
        </div>
      </div>

      {/* Task Board View */}
      {selectedView === "kanban" ? (
        <div className="flex gap-4 overflow-x-auto pb-4">
          {tasksByBoard.map((column, index) => (
            <div
              key={column.id}
              className="flex-shrink-0 w-[320px] flex flex-col"
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, column.id)}
            >
              {/* Glass Column Header */}
              <div className="glass rounded-lg p-4 mb-4 border border-white/20 dark:border-white/10 shadow-[var(--shadow-sm)]">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-white/80 rounded-lg flex items-center justify-center shadow">
                      {getBoardIcon(column.position)}
                    </div>
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
                        className="h-8 text-sm font-semibold"
                      />
                    ) : (
                      <button
                        onClick={() => startRenaming(column)}
                        className="text-left hover:opacity-80 transition-opacity"
                      >
                        <h3 className="font-semibold text-gray-800">{column.name}</h3>
                      </button>
                    )}
                  </div>
                  <Badge variant="secondary" className="bg-white/60">
                    {column.count}
                  </Badge>
                </div>
              </div>

              {/* Tasks in Column */}
              <div className="space-y-3 flex-1">
                {column.tasks.map((task: any) => (
                  <div
                    key={task.id}
                    draggable
                    onDragStart={(e) => handleDragStart(e, task)}
                    className="glass rounded-lg p-4 border border-white/20 dark:border-white/10 shadow-[var(--shadow-sm)] hover:shadow-[var(--shadow-md)] transition-all duration-[var(--duration-fast)] cursor-move"
                  >
                    <div className="space-y-3">
                      <div className="flex items-start justify-between gap-2">
                        <h4 className="font-medium text-gray-900 flex-1">{task.title}</h4>
                        {task.priority && getPriorityBadge(task.priority)}
                      </div>
                      
                      {task.description && (
                        <p className="text-sm text-gray-600 line-clamp-2">{task.description}</p>
                      )}
                      
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 text-xs text-gray-500">
                          {task.due_date && (
                            <div className={`flex items-center gap-1 ${isOverdue(task.due_date) ? 'text-red-600' : ''}`}>
                              <Calendar className="h-3 w-3" />
                              {new Date(task.due_date).toLocaleDateString('sq-AL')}
                            </div>
                          )}
                          {task.assigned_to && (
                            <div className="flex items-center gap-1">
                              <User className="h-3 w-3" />
                              {task.assigned_to}
                            </div>
                          )}
                        </div>
                        <div className="flex items-center gap-1">
                          <Link href={`/dashboard/tasks/${task.id}/edit`}>
                            <Button size="sm" variant="ghost" className="text-xs px-2">
                              Edit
                            </Button>
                          </Link>
                          <Button 
                            size="sm" 
                            variant="ghost" 
                            className="text-xs px-2 text-red-600 hover:text-red-700"
                            onClick={() => deleteTask(task.id)}
                          >
                            Delete
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
                
                {/* Add Task Button */}
                <Button
                  variant="outline"
                  className="w-full border-dashed hover:border-solid hover:bg-gray-50"
                  onClick={() => {
                    setSelectedBoardForAdd(column.id)
                    setShowAddModal(true)
                  }}
                >
                  + Shto Detyrë
                </Button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* List View */
        <Card className="bg-white/90 backdrop-blur-sm border-0 shadow-xl">
          <CardContent className="p-0">
            <div className="divide-y">
              {filteredTasks.map((task) => {
                const board = boards.find(b => b.id === task.board_id)
                return (
                  <div key={task.id} className="p-4 hover:bg-gray-50 transition-colors">
                    <div className="flex items-center justify-between">
                      <div className="flex-1 space-y-1">
                        <div className="flex items-center gap-3">
                          <h4 className="font-medium text-gray-900">{task.title}</h4>
                          <Badge variant="outline" className="text-xs">
                            {board?.name}
                          </Badge>
                          {task.priority && getPriorityBadge(task.priority)}
                        </div>
                        {task.description && (
                          <p className="text-sm text-gray-600">{task.description}</p>
                        )}
                        <div className="flex items-center gap-4 text-xs text-gray-500">
                          {task.due_date && (
                            <div className={`flex items-center gap-1 ${isOverdue(task.due_date) ? 'text-red-600' : ''}`} suppressHydrationWarning>
                              <Calendar className="h-3 w-3" />
                              {new Date(task.due_date).toLocaleDateString('sq-AL')}
                            </div>
                          )}
                          {task.assigned_to && (
                            <div className="flex items-center gap-1">
                              <User className="h-3 w-3" />
                              {task.assigned_to}
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Link href={`/dashboard/tasks/${task.id}/edit`}>
                          <Button size="sm" variant="outline">
                            <Edit className="h-4 w-4 mr-1" />
                            Edito
                          </Button>
                        </Link>
                        <Button 
                          size="sm" 
                          variant="ghost" 
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                          onClick={() => deleteTask(task.id)}
                        >
                          Delete
                        </Button>
                      </div>
                    </div>
                  </div>
                )
              })}
              
              {filteredTasks.length === 0 && (
                <div className="text-center py-12">
                  <CheckSquare className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                  <p className="text-gray-500">Nuk ka detyra për të shfaqur</p>
                  <Button asChild className="mt-4" variant="outline">
                    <Link href="/dashboard/tasks/new">
                      <Plus className="h-4 w-4 mr-2" />
                      Shto Detyrën e Parë
                    </Link>
                  </Button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Add Task Modal */}
      {showAddModal && (
        <TaskAddModal
          weddingId={weddingId}
          boardId={selectedBoardForAdd || undefined}
          open={showAddModal}
          onOpenChange={setShowAddModal}
        />
      )}
    </div>
  )
}
