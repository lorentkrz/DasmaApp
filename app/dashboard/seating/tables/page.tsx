import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { ArrowLeft, Plus, MoreHorizontal, Edit, Trash2, Users } from "lucide-react"
import Link from "next/link"

export default async function TablesPage() {
  const supabase = await createClient()

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()
  if (error || !user) {
    redirect("/auth/login")
  }

  // Get user's current wedding
  const { data: weddings } = await supabase
    .from("weddings")
    .select("*")
    .eq("owner_id", user.id)
    .order("created_at", { ascending: false })
    .limit(1)

  if (!weddings || weddings.length === 0) {
    redirect("/dashboard/weddings/new")
  }

  const currentWedding = weddings[0]

  // Fetch tables and guest assignments
  const [{ data: tables }, { data: guests }] = await Promise.all([
    supabase.from("wedding_tables").select("*").eq("wedding_id", currentWedding.id).order("table_number"),
    supabase.from("guests").select("id, table_assignment").eq("wedding_id", currentWedding.id),
  ])

  // Calculate occupancy for each table
  const getTableOccupancy = (tableId: string) => {
    return guests?.filter((g) => g.table_assignment === tableId).length || 0
  }

  const tableTypeColors = {
    round: "bg-blue-100 text-blue-800 border-blue-200",
    rectangular: "bg-green-100 text-green-800 border-green-200",
    square: "bg-purple-100 text-purple-800 border-purple-200",
  }

  return (
    <div className="container mx-auto px-6 py-8">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/dashboard/seating">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Seating Chart
          </Link>
        </Button>
      </div>

      <div className="flex flex-col md:flex-row md:items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold mb-2">Table Management</h1>
          <p className="text-muted-foreground">Manage tables for your wedding reception</p>
        </div>
        <Button asChild>
          <Link href="/dashboard/seating/tables/new">
            <Plus className="h-4 w-4 mr-2" />
            Add Table
          </Link>
        </Button>
      </div>

      {/* Tables List */}
      <Card>
        <CardHeader>
          <CardTitle>Reception Tables</CardTitle>
          <CardDescription>All tables for your wedding reception</CardDescription>
        </CardHeader>
        <CardContent>
          {tables && tables.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Table Number</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Capacity</TableHead>
                  <TableHead>Occupancy</TableHead>
                  <TableHead>Notes</TableHead>
                  <TableHead className="w-12"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {tables.map((table) => {
                  const occupancy = getTableOccupancy(table.id)
                  const occupancyRate = occupancy / table.capacity

                  return (
                    <TableRow key={table.id}>
                      <TableCell className="font-medium">{table.table_number}</TableCell>
                      <TableCell>{table.table_name || "-"}</TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={tableTypeColors[table.table_type as keyof typeof tableTypeColors]}
                        >
                          {table.table_type}
                        </Badge>
                      </TableCell>
                      <TableCell>{table.capacity}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <span>
                            {occupancy}/{table.capacity}
                          </span>
                          <Badge
                            variant="outline"
                            className={
                              occupancyRate >= 1
                                ? "bg-green-100 text-green-800 border-green-200"
                                : occupancyRate > 0
                                  ? "bg-amber-100 text-amber-800 border-amber-200"
                                  : "bg-gray-100 text-gray-800 border-gray-200"
                            }
                          >
                            {occupancyRate >= 1 ? "Full" : occupancyRate > 0 ? "Partial" : "Empty"}
                          </Badge>
                        </div>
                      </TableCell>
                      <TableCell className="max-w-32 truncate">{table.notes || "-"}</TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem asChild>
                              <Link href={`/dashboard/seating/tables/${table.id}/edit`}>
                                <Edit className="h-4 w-4 mr-2" />
                                Edit
                              </Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem className="text-destructive focus:text-destructive">
                              <Trash2 className="h-4 w-4 mr-2" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-12">
              <Users className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
              <h3 className="text-lg font-medium mb-2">No tables yet</h3>
              <p className="text-muted-foreground mb-4">Create your first table to start planning your seating chart</p>
              <Button asChild>
                <Link href="/dashboard/seating/tables/new">
                  <Plus className="h-4 w-4 mr-2" />
                  Add First Table
                </Link>
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
