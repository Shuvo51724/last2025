import { useState, useEffect, useMemo } from "react";
import { Assignment } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import DashboardHeader from "@/components/DashboardHeader";
import Footer from "@/components/Footer";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { 
  ClipboardList, 
  Plus, 
  Edit, 
  Trash2, 
  Eye, 
  Clock, 
  User, 
  Calendar,
  Paperclip,
  X,
  Filter,
  AlertCircle,
  FileText,
  Download
} from "lucide-react";
import { format } from "date-fns";

type PriorityType = "low" | "medium" | "high";
type StatusType = "pending" | "ongoing" | "completed";

const PRIORITY_COLORS = {
  low: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300",
  medium: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300",
  high: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300",
};

const STATUS_COLORS = {
  pending: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300",
  ongoing: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300",
  completed: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
};

export default function AssignmentPage() {
  const { toast } = useToast();
  const { user, userRole, hasPermission } = useAuth();
  
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [showDialog, setShowDialog] = useState(false);
  const [viewMode, setViewMode] = useState<"add" | "edit" | "view">("add");
  const [selectedAssignment, setSelectedAssignment] = useState<Assignment | null>(null);
  
  const [formData, setFormData] = useState({
    title: "",
    category: "",
    description: "",
    date: new Date().toISOString().slice(0, 10),
    time: "09:00",
    assignedTo: "",
    priority: "medium" as PriorityType,
    status: "pending" as StatusType,
  });

  const [attachments, setAttachments] = useState<Array<{ name: string; data: string; type: string }>>([]);
  const [filterStatus, setFilterStatus] = useState<StatusType | "all">("all");
  const [filterPriority, setFilterPriority] = useState<PriorityType | "all">("all");
  const [searchQuery, setSearchQuery] = useState("");

  const canAdd = userRole === "admin" || (userRole === "superModerator" && hasPermission("canAddAssignment"));
  const canEdit = userRole === "admin" || (userRole === "superModerator" && hasPermission("canEditAssignment"));
  const canDelete = userRole === "admin" || (userRole === "superModerator" && hasPermission("canDeleteAssignment"));

  useEffect(() => {
    const stored = localStorage.getItem("dob_assignments");
    if (stored) {
      setAssignments(JSON.parse(stored));
    }
  }, []);

  const saveAssignments = (data: Assignment[]) => {
    localStorage.setItem("dob_assignments", JSON.stringify(data));
    setAssignments(data);
  };

  const handleAddAssignment = () => {
    if (!canAdd) {
      toast({
        title: "Permission Denied",
        description: "You don't have permission to add assignments",
        variant: "destructive",
      });
      return;
    }

    if (!formData.title || !formData.category || !formData.assignedTo) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    const newAssignment: Assignment = {
      id: crypto.randomUUID(),
      title: formData.title,
      category: formData.category,
      description: formData.description,
      date: formData.date,
      time: formData.time,
      assignedTo: formData.assignedTo,
      priority: formData.priority,
      status: formData.status,
      attachments: attachments,
      createdBy: user?.name || user?.userId || "Unknown",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    saveAssignments([...assignments, newAssignment]);
    resetForm();
    setShowDialog(false);

    toast({
      title: "Assignment Created",
      description: "The assignment has been created successfully",
    });
  };

  const handleEditAssignment = () => {
    if (!canEdit || !selectedAssignment) {
      toast({
        title: "Permission Denied",
        description: "You don't have permission to edit assignments",
        variant: "destructive",
      });
      return;
    }

    if (!formData.title || !formData.category || !formData.assignedTo) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    const updatedAssignment: Assignment = {
      ...selectedAssignment,
      title: formData.title,
      category: formData.category,
      description: formData.description,
      date: formData.date,
      time: formData.time,
      assignedTo: formData.assignedTo,
      priority: formData.priority,
      status: formData.status,
      attachments: attachments,
      updatedAt: new Date().toISOString(),
    };

    const updated = assignments.map(a => a.id === selectedAssignment.id ? updatedAssignment : a);
    saveAssignments(updated);
    resetForm();
    setShowDialog(false);

    toast({
      title: "Assignment Updated",
      description: "The assignment has been updated successfully",
    });
  };

  const handleDeleteAssignment = (assignment: Assignment) => {
    if (!canDelete) {
      toast({
        title: "Permission Denied",
        description: "You don't have permission to delete assignments",
        variant: "destructive",
      });
      return;
    }

    const updated = assignments.filter(a => a.id !== assignment.id);
    saveAssignments(updated);

    toast({
      title: "Assignment Deleted",
      description: "The assignment has been deleted successfully",
    });
  };

  const openAddDialog = () => {
    if (!canAdd) {
      toast({
        title: "Permission Denied",
        description: "You don't have permission to add assignments",
        variant: "destructive",
      });
      return;
    }
    resetForm();
    setViewMode("add");
    setShowDialog(true);
  };

  const openEditDialog = (assignment: Assignment) => {
    if (!canEdit) {
      toast({
        title: "Permission Denied",
        description: "You don't have permission to edit assignments",
        variant: "destructive",
      });
      return;
    }
    setSelectedAssignment(assignment);
    setFormData({
      title: assignment.title,
      category: assignment.category,
      description: assignment.description || "",
      date: assignment.date,
      time: assignment.time,
      assignedTo: assignment.assignedTo,
      priority: assignment.priority,
      status: assignment.status,
    });
    setAttachments(assignment.attachments || []);
    setViewMode("edit");
    setShowDialog(true);
  };

  const openViewDialog = (assignment: Assignment) => {
    setSelectedAssignment(assignment);
    setFormData({
      title: assignment.title,
      category: assignment.category,
      description: assignment.description || "",
      date: assignment.date,
      time: assignment.time,
      assignedTo: assignment.assignedTo,
      priority: assignment.priority,
      status: assignment.status,
    });
    setAttachments(assignment.attachments || []);
    setViewMode("view");
    setShowDialog(true);
  };

  const resetForm = () => {
    setFormData({
      title: "",
      category: "",
      description: "",
      date: new Date().toISOString().slice(0, 10),
      time: "09:00",
      assignedTo: "",
      priority: "medium",
      status: "pending",
    });
    setAttachments([]);
    setSelectedAssignment(null);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    const newAttachments: Array<{ name: string; data: string; type: string }> = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: "File Too Large",
          description: `${file.name} exceeds 5MB limit`,
          variant: "destructive",
        });
        continue;
      }

      const reader = new FileReader();
      const fileData = await new Promise<string>((resolve) => {
        reader.onload = () => resolve(reader.result as string);
        reader.readAsDataURL(file);
      });

      newAttachments.push({
        name: file.name,
        data: fileData,
        type: file.type,
      });
    }

    setAttachments([...attachments, ...newAttachments]);
    e.target.value = "";
  };

  const removeAttachment = (index: number) => {
    setAttachments(attachments.filter((_, i) => i !== index));
  };

  const downloadAttachment = (attachment: { name: string; data: string; type: string }) => {
    const link = document.createElement("a");
    link.href = attachment.data;
    link.download = attachment.name;
    link.click();
  };

  const filteredAssignments = useMemo(() => {
    return assignments.filter(assignment => {
      const matchesStatus = filterStatus === "all" || assignment.status === filterStatus;
      const matchesPriority = filterPriority === "all" || assignment.priority === filterPriority;
      const matchesSearch = !searchQuery || 
        assignment.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        assignment.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
        assignment.assignedTo.toLowerCase().includes(searchQuery.toLowerCase());
      
      return matchesStatus && matchesPriority && matchesSearch;
    });
  }, [assignments, filterStatus, filterPriority, searchQuery]);

  const statsCounts = useMemo(() => {
    return {
      total: assignments.length,
      pending: assignments.filter(a => a.status === "pending").length,
      ongoing: assignments.filter(a => a.status === "ongoing").length,
      completed: assignments.filter(a => a.status === "completed").length,
      highPriority: assignments.filter(a => a.priority === "high").length,
    };
  }, [assignments]);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <DashboardHeader />
      <div className="w-full px-4 md:px-6 py-6 flex-1">
        <div className="max-w-7xl mx-auto space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <ClipboardList className="w-7 h-7 text-primary" />
                <h1 className="text-3xl font-bold text-foreground">Assignments</h1>
              </div>
              <p className="text-sm text-muted-foreground">
                Manage assignments, track progress, and monitor deadlines
              </p>
            </div>
            {canAdd && (
              <Button onClick={openAddDialog} className="gap-2">
                <Plus className="w-4 h-4" />
                New Assignment
              </Button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">Total</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{statsCounts.total}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">Pending</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-gray-600">{statsCounts.pending}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">Ongoing</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-600">{statsCounts.ongoing}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">Completed</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">{statsCounts.completed}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">High Priority</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-600">{statsCounts.highPriority}</div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Filter className="w-5 h-5" />
                Filters & Search
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Search</Label>
                  <Input
                    placeholder="Search by title, category, or assigned to..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Status</Label>
                  <Select value={filterStatus} onValueChange={(value: StatusType | "all") => setFilterStatus(value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Statuses</SelectItem>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="ongoing">Ongoing</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Priority</Label>
                  <Select value={filterPriority} onValueChange={(value: PriorityType | "all") => setFilterPriority(value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Priorities</SelectItem>
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              {(filterStatus !== "all" || filterPriority !== "all" || searchQuery) && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setFilterStatus("all");
                    setFilterPriority("all");
                    setSearchQuery("");
                  }}
                  className="gap-2"
                >
                  <X className="w-4 h-4" />
                  Clear Filters
                </Button>
              )}
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredAssignments.length === 0 ? (
              <Card className="col-span-full">
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <AlertCircle className="w-12 h-12 text-muted-foreground mb-4" />
                  <p className="text-lg font-medium text-muted-foreground">No assignments found</p>
                  <p className="text-sm text-muted-foreground">
                    {searchQuery || filterStatus !== "all" || filterPriority !== "all"
                      ? "Try adjusting your filters"
                      : canAdd ? "Create your first assignment to get started" : "No assignments have been created yet"}
                  </p>
                </CardContent>
              </Card>
            ) : (
              filteredAssignments.map((assignment) => (
                <Card key={assignment.id} className="hover:shadow-lg transition-shadow">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between gap-2">
                      <CardTitle className="text-lg line-clamp-2">{assignment.title}</CardTitle>
                      <Badge className={PRIORITY_COLORS[assignment.priority]}>
                        {assignment.priority.toUpperCase()}
                      </Badge>
                    </div>
                    <CardDescription className="line-clamp-1">{assignment.category}</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {assignment.description && (
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {assignment.description}
                      </p>
                    )}
                    
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <User className="w-4 h-4" />
                        <span>Assigned to: <span className="font-medium text-foreground">{assignment.assignedTo}</span></span>
                      </div>
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Calendar className="w-4 h-4" />
                        <span>{format(new Date(assignment.date), "MMM dd, yyyy")}</span>
                      </div>
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Clock className="w-4 h-4" />
                        <span>{assignment.time}</span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-2">
                      <Badge className={STATUS_COLORS[assignment.status]}>
                        {assignment.status.toUpperCase()}
                      </Badge>
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => openViewDialog(assignment)}
                          title="View Details"
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                        {canEdit && (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => openEditDialog(assignment)}
                            title="Edit"
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                        )}
                        {canDelete && (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDeleteAssignment(assignment)}
                            title="Delete"
                          >
                            <Trash2 className="w-4 h-4 text-destructive" />
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </div>
      </div>

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {viewMode === "add" && "Create New Assignment"}
              {viewMode === "edit" && "Edit Assignment"}
              {viewMode === "view" && "Assignment Details"}
            </DialogTitle>
            <DialogDescription>
              {viewMode === "add" && "Fill in the details below to create a new assignment"}
              {viewMode === "edit" && "Update the assignment details"}
              {viewMode === "view" && "View assignment information"}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Assignment Title *</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="Enter assignment title"
                disabled={viewMode === "view"}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="category">Category *</Label>
              <Input
                id="category"
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                placeholder="e.g., Design, Development, Content"
                disabled={viewMode === "view"}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Enter assignment description"
                rows={4}
                disabled={viewMode === "view"}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="date">Date *</Label>
                <Input
                  id="date"
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  disabled={viewMode === "view"}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="time">Time *</Label>
                <Input
                  id="time"
                  type="time"
                  value={formData.time}
                  onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                  disabled={viewMode === "view"}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="assignedTo">Assigned To *</Label>
              <Input
                id="assignedTo"
                value={formData.assignedTo}
                onChange={(e) => setFormData({ ...formData, assignedTo: e.target.value })}
                placeholder="Enter name or team"
                disabled={viewMode === "view"}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="priority">Priority *</Label>
                <Select
                  value={formData.priority}
                  onValueChange={(value: PriorityType) => setFormData({ ...formData, priority: value })}
                  disabled={viewMode === "view"}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="status">Status *</Label>
                <Select
                  value={formData.status}
                  onValueChange={(value: StatusType) => setFormData({ ...formData, status: value })}
                  disabled={viewMode === "view"}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="ongoing">Ongoing</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Attachments</Label>
              {viewMode !== "view" && (
                <div className="space-y-2">
                  <Input
                    type="file"
                    multiple
                    onChange={handleFileUpload}
                    accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.txt"
                    className="cursor-pointer"
                  />
                  <p className="text-xs text-muted-foreground">
                    Max file size: 5MB. Supported: Images, PDF, Documents
                  </p>
                </div>
              )}
              {attachments.length > 0 && (
                <div className="space-y-2 mt-3">
                  {attachments.map((attachment, index) => (
                    <div key={index} className="flex items-center justify-between p-2 border rounded-md bg-muted/50">
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        <FileText className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                        <span className="text-sm truncate">{attachment.name}</span>
                      </div>
                      <div className="flex items-center gap-1 flex-shrink-0">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => downloadAttachment(attachment)}
                          title="Download"
                        >
                          <Download className="w-4 h-4" />
                        </Button>
                        {viewMode !== "view" && (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => removeAttachment(index)}
                            title="Remove"
                          >
                            <X className="w-4 h-4 text-destructive" />
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {viewMode === "view" && selectedAssignment && (
              <div className="space-y-2 pt-4 border-t">
                <p className="text-sm text-muted-foreground">
                  Created by: <span className="font-medium text-foreground">{selectedAssignment.createdBy}</span>
                </p>
                <p className="text-sm text-muted-foreground">
                  Created at: <span className="font-medium text-foreground">{format(new Date(selectedAssignment.createdAt), "MMM dd, yyyy HH:mm")}</span>
                </p>
                <p className="text-sm text-muted-foreground">
                  Last updated: <span className="font-medium text-foreground">{format(new Date(selectedAssignment.updatedAt), "MMM dd, yyyy HH:mm")}</span>
                </p>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDialog(false)}>
              {viewMode === "view" ? "Close" : "Cancel"}
            </Button>
            {viewMode === "add" && (
              <Button onClick={handleAddAssignment}>Create Assignment</Button>
            )}
            {viewMode === "edit" && (
              <Button onClick={handleEditAssignment}>Update Assignment</Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Footer />
    </div>
  );
}
