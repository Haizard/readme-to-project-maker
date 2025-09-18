import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Plus, Edit, Users, Calendar, MoreHorizontal, Trash2 } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { useToast } from '@/hooks/use-toast';
import { ClassStudentAssignment } from './ClassStudentAssignment';
import { ClassScheduleManagement } from './ClassScheduleManagement';

interface Class {
  id: string;
  class_name: string;
  section: string | null;
  class_level: string;
  capacity: number;
  status: string;
  academic_year_id: string | null;
  tenant_id: string;
  created_at: string;
  updated_at: string;
  student_count?: number;
  teacher_count?: number;
}

interface AcademicYear {
  id: string;
  year_name: string;
  is_current: boolean;
}

interface ClassManagementProps {
  canManage: boolean;
}

export default function ClassManagement({ canManage }: ClassManagementProps) {
  const { profile } = useAuth();
  const { toast } = useToast();
  
  const [classes, setClasses] = useState<Class[]>([]);
  const [academicYears, setAcademicYears] = useState<AcademicYear[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedClass, setSelectedClass] = useState<Class | null>(null);
  const [studentAssignmentOpen, setStudentAssignmentOpen] = useState(false);
  const [scheduleManagementOpen, setScheduleManagementOpen] = useState(false);
  
  // Form state
  const [formData, setFormData] = useState({
    class_name: '',
    section: '',
    class_level: 'O-Level' as const,
    capacity: 30,
    academic_year_id: '',
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      // Fetch classes with student and teacher counts
      const { data: classesData, error: classesError } = await supabase
        .from('classes')
        .select(`
          *,
          student_enrollments(count),
          teacher_classes(count)
        `)
        .eq('tenant_id', profile?.tenant_id);

      if (classesError) throw classesError;

      // Process the data to include counts
      const processedClasses = classesData?.map(cls => ({
        ...cls,
        student_count: cls.student_enrollments?.[0]?.count || 0,
        teacher_count: cls.teacher_classes?.[0]?.count || 0,
      })) || [];

      setClasses(processedClasses);

      // Fetch academic years
      const { data: yearsData, error: yearsError } = await supabase
        .from('academic_years')
        .select('*')
        .eq('tenant_id', profile?.tenant_id)
        .order('is_current', { ascending: false });

      if (yearsError) throw yearsError;
      setAcademicYears(yearsData || []);

      // Set current academic year as default
      const currentYear = yearsData?.find(year => year.is_current);
      if (currentYear && !formData.academic_year_id) {
        setFormData(prev => ({ ...prev, academic_year_id: currentYear.id }));
      }

    } catch (error) {
      console.error('Error fetching data:', error);
      toast({
        title: "Error",
        description: "Failed to fetch classes data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      if (selectedClass) {
        // Update existing class
        const { error } = await supabase
          .from('classes')
          .update({
            class_name: formData.class_name,
            section: formData.section || null,
            class_level: formData.class_level,
            capacity: formData.capacity,
            academic_year_id: formData.academic_year_id || null,
            updated_by: profile?.id,
          })
          .eq('id', selectedClass.id)
          .eq('tenant_id', profile?.tenant_id);

        if (error) throw error;

        toast({
          title: "Success",
          description: "Class updated successfully",
        });
        setIsEditDialogOpen(false);
      } else {
        // Create new class
        const { error } = await supabase
          .from('classes')
          .insert({
            class_name: formData.class_name,
            section: formData.section || null,
            class_level: formData.class_level,
            capacity: formData.capacity,
            academic_year_id: formData.academic_year_id || null,
            tenant_id: profile?.tenant_id,
            created_by: profile?.id,
          });

        if (error) throw error;

        toast({
          title: "Success",
          description: "Class created successfully",
        });
        setIsCreateDialogOpen(false);
      }

      resetForm();
      fetchData();
    } catch (error) {
      console.error('Error saving class:', error);
      toast({
        title: "Error",
        description: "Failed to save class",
        variant: "destructive",
      });
    }
  };

  const handleDelete = async (classId: string) => {
    if (!window.confirm('Are you sure you want to delete this class?')) return;

    try {
      const { error } = await supabase
        .from('classes')
        .delete()
        .eq('id', classId)
        .eq('tenant_id', profile?.tenant_id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Class deleted successfully",
      });
      fetchData();
    } catch (error) {
      console.error('Error deleting class:', error);
      toast({
        title: "Error",
        description: "Failed to delete class",
        variant: "destructive",
      });
    }
  };

  const resetForm = () => {
    setFormData({
      class_name: '',
      section: '',
      class_level: 'O-Level',
      capacity: 30,
      academic_year_id: academicYears.find(y => y.is_current)?.id || '',
    });
    setSelectedClass(null);
  };

  const openEditDialog = (cls: Class) => {
    setSelectedClass(cls);
    setFormData({
      class_name: cls.class_name,
      section: cls.section || '',
      class_level: cls.class_level as any,
      capacity: cls.capacity,
      academic_year_id: cls.academic_year_id || '',
    });
    setIsEditDialogOpen(true);
  };

  const getLevelBadgeColor = (level: string) => {
    switch (level) {
      case 'O-Level': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'A-Level': return 'bg-green-100 text-green-800 border-green-200';
      case 'Certificate': return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'Diploma': return 'bg-orange-100 text-orange-800 border-orange-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-muted rounded w-1/3"></div>
          <div className="h-32 bg-muted rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold">Class Management</h2>
          <p className="text-sm text-muted-foreground">
            Organize classes and sections for effective academic delivery
          </p>
        </div>
        {canManage && (
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={resetForm}>
                <Plus className="h-4 w-4 mr-2" />
                Create Class
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New Class</DialogTitle>
                <DialogDescription>
                  Set up a new class with section and capacity details
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="class_name">Class Name</Label>
                  <Input
                    id="class_name"
                    value={formData.class_name}
                    onChange={(e) => setFormData(prev => ({ ...prev, class_name: e.target.value }))}
                    placeholder="e.g., Form 1, Grade 10"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="section">Section (Optional)</Label>
                  <Input
                    id="section"
                    value={formData.section}
                    onChange={(e) => setFormData(prev => ({ ...prev, section: e.target.value }))}
                    placeholder="e.g., A, B, Science"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="class_level">Academic Level</Label>
                  <Select
                    value={formData.class_level}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, class_level: value as any }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="O-Level">O-Level</SelectItem>
                      <SelectItem value="A-Level">A-Level</SelectItem>
                      <SelectItem value="Certificate">Certificate</SelectItem>
                      <SelectItem value="Diploma">Diploma</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="capacity">Class Capacity</Label>
                  <Input
                    id="capacity"
                    type="number"
                    min="1"
                    max="100"
                    value={formData.capacity}
                    onChange={(e) => setFormData(prev => ({ ...prev, capacity: parseInt(e.target.value) }))}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="academic_year">Academic Year</Label>
                  <Select
                    value={formData.academic_year_id}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, academic_year_id: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select academic year" />
                    </SelectTrigger>
                    <SelectContent>
                      {academicYears.map((year) => (
                        <SelectItem key={year.id} value={year.id}>
                          {year.year_name} {year.is_current && '(Current)'}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex justify-end gap-2 pt-4">
                  <Button type="button" variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit">Create Class</Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {/* Classes Table */}
      <Card>
        <CardHeader>
          <CardTitle>Classes Overview</CardTitle>
          <CardDescription>
            {classes.length} classes configured for your school
          </CardDescription>
        </CardHeader>
        <CardContent>
          {classes.length === 0 ? (
            <div className="text-center py-8">
              <div className="text-muted-foreground mb-4">No classes found</div>
              {canManage && (
                <Button onClick={() => setIsCreateDialogOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Create your first class
                </Button>
              )}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Class Name</TableHead>
                  <TableHead>Section</TableHead>
                  <TableHead>Level</TableHead>
                  <TableHead>Capacity</TableHead>
                  <TableHead>Students</TableHead>
                  <TableHead>Teachers</TableHead>
                  <TableHead>Status</TableHead>
                  {canManage && <TableHead>Actions</TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {classes.map((cls) => (
                  <TableRow key={cls.id}>
                    <TableCell className="font-medium">{cls.class_name}</TableCell>
                    <TableCell>{cls.section || '-'}</TableCell>
                    <TableCell>
                      <Badge className={getLevelBadgeColor(cls.class_level)}>
                        {cls.class_level}
                      </Badge>
                    </TableCell>
                    <TableCell>{cls.capacity}</TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {cls.student_count}/{cls.capacity}
                      </Badge>
                    </TableCell>
                    <TableCell>{cls.teacher_count || 0}</TableCell>
                    <TableCell>
                      <Badge variant={cls.status === 'active' ? 'default' : 'secondary'}>
                        {cls.status}
                      </Badge>
                    </TableCell>
                    {canManage && (
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent>
                            <DropdownMenuItem onClick={() => openEditDialog(cls)}>
                              <Edit className="h-4 w-4 mr-2" />
                              Edit Class
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => {
                              setSelectedClass(cls);
                              setStudentAssignmentOpen(true);
                            }}>
                              <Users className="h-4 w-4 mr-2" />
                              Manage Students
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => {
                              setSelectedClass(cls);
                              setScheduleManagementOpen(true);
                            }}>
                              <Calendar className="h-4 w-4 mr-2" />
                              Class Schedule
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              onClick={() => handleDelete(cls.id)}
                              className="text-destructive"
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Delete Class
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    )}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Class</DialogTitle>
            <DialogDescription>
              Update class information and settings
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="edit_class_name">Class Name</Label>
              <Input
                id="edit_class_name"
                value={formData.class_name}
                onChange={(e) => setFormData(prev => ({ ...prev, class_name: e.target.value }))}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit_section">Section</Label>
              <Input
                id="edit_section"
                value={formData.section}
                onChange={(e) => setFormData(prev => ({ ...prev, section: e.target.value }))}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit_class_level">Academic Level</Label>
              <Select
                value={formData.class_level}
                onValueChange={(value) => setFormData(prev => ({ ...prev, class_level: value as any }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="O-Level">O-Level</SelectItem>
                  <SelectItem value="A-Level">A-Level</SelectItem>
                  <SelectItem value="Certificate">Certificate</SelectItem>
                  <SelectItem value="Diploma">Diploma</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit_capacity">Class Capacity</Label>
              <Input
                id="edit_capacity"
                type="number"
                min="1"
                max="100"
                value={formData.capacity}
                onChange={(e) => setFormData(prev => ({ ...prev, capacity: parseInt(e.target.value) }))}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit_academic_year">Academic Year</Label>
              <Select
                value={formData.academic_year_id}
                onValueChange={(value) => setFormData(prev => ({ ...prev, academic_year_id: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {academicYears.map((year) => (
                    <SelectItem key={year.id} value={year.id}>
                      {year.year_name} {year.is_current && '(Current)'}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button type="button" variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit">Update Class</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Student Assignment Dialog */}
      {selectedClass && (
        <ClassStudentAssignment
          classData={selectedClass}
          open={studentAssignmentOpen}
          onOpenChange={setStudentAssignmentOpen}
          onUpdate={fetchData}
        />
      )}

      {/* Schedule Management Dialog */}
      {selectedClass && (
        <ClassScheduleManagement
          classData={selectedClass}
          open={scheduleManagementOpen}
          onOpenChange={setScheduleManagementOpen}
        />
      )}
    </div>
  );
}