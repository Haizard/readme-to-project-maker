import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Plus, Edit, Eye, Phone, Mail, MapPin, Calendar, User } from 'lucide-react';
import { toast } from 'sonner';

interface Teacher {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string | null;
  avatar_url: string | null;
  status: string;
  last_login: string | null;
  created_at: string;
  metadata: any;
}

interface TeacherProfilesProps {
  canManage: boolean;
}

export default function TeacherProfiles({ canManage }: TeacherProfilesProps) {
  const { profile } = useAuth();
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [viewingTeacher, setViewingTeacher] = useState<Teacher | null>(null);
  const [editingTeacher, setEditingTeacher] = useState<Teacher | null>(null);
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    metadata: {
      date_of_birth: '',
      gender: '',
      nationality: '',
      address: '',
      emergency_contact: '',
      employment_date: '',
      employee_id: '',
      department: '',
      specialization: ''
    }
  });

  useEffect(() => {
    fetchTeachers();
  }, []);

  const fetchTeachers = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('role', 'teacher')
        .eq('status', 'active')
        .order('first_name');

      if (error) {
        console.error('Error fetching teachers:', error);
        toast.error('Failed to load teachers');
        return;
      }

      setTeachers(data || []);
    } catch (error) {
      console.error('Error:', error);
      toast.error('Failed to load teachers');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!profile?.tenant_id) {
      toast.error('No tenant information found');
      return;
    }

    try {
      const teacherData = {
        ...formData,
        tenant_id: profile.tenant_id,
        role: 'teacher' as const,
        status: 'active'
      };

      if (editingTeacher) {
        const { error } = await supabase
          .from('profiles')
          .update(teacherData)
          .eq('id', editingTeacher.id);

        if (error) throw error;
        toast.success('Teacher profile updated successfully');
      } else {
        // For creating new teachers, they would need to be created through auth signup
        toast.info('New teacher accounts must be created through the user registration process');
        return;
      }

      setIsDialogOpen(false);
      setEditingTeacher(null);
      resetForm();
      fetchTeachers();
    } catch (error: any) {
      console.error('Error saving teacher:', error);
      toast.error(error.message || 'Failed to save teacher profile');
    }
  };

  const resetForm = () => {
    setFormData({
      first_name: '',
      last_name: '',
      email: '',
      phone: '',
      metadata: {
        date_of_birth: '',
        gender: '',
        nationality: '',
        address: '',
        emergency_contact: '',
        employment_date: '',
        employee_id: '',
        department: '',
        specialization: ''
      }
    });
  };

  const handleEdit = (teacher: Teacher) => {
    setEditingTeacher(teacher);
    setFormData({
      first_name: teacher.first_name,
      last_name: teacher.last_name,
      email: teacher.email,
      phone: teacher.phone || '',
      metadata: {
        date_of_birth: teacher.metadata?.date_of_birth || '',
        gender: teacher.metadata?.gender || '',
        nationality: teacher.metadata?.nationality || '',
        address: teacher.metadata?.address || '',
        emergency_contact: teacher.metadata?.emergency_contact || '',
        employment_date: teacher.metadata?.employment_date || '',
        employee_id: teacher.metadata?.employee_id || '',
        department: teacher.metadata?.department || '',
        specialization: teacher.metadata?.specialization || ''
      }
    });
    setIsDialogOpen(true);
  };

  const handleView = (teacher: Teacher) => {
    setViewingTeacher(teacher);
  };

  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
  };

  if (loading) {
    return <div>Loading teacher profiles...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Teacher Profiles</h3>
          <p className="text-sm text-muted-foreground">
            Manage teacher profiles and personal information
          </p>
        </div>
      </div>

      {teachers.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-8">
            <User className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No teachers found</h3>
            <p className="text-sm text-muted-foreground text-center mb-4">
              Teachers need to be created through the user registration process.
            </p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Teaching Staff ({teachers.length})</CardTitle>
            <CardDescription>
              All active teachers in your school
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Teacher</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead>Department</TableHead>
                  <TableHead>Employment Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {teachers.map((teacher) => (
                  <TableRow key={teacher.id}>
                    <TableCell>
                      <div className="flex items-center space-x-3">
                        <Avatar>
                          <AvatarImage src={teacher.avatar_url || ''} />
                          <AvatarFallback>
                            {getInitials(teacher.first_name, teacher.last_name)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="font-medium">
                            {teacher.first_name} {teacher.last_name}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            ID: {teacher.metadata?.employee_id || 'N/A'}
                          </div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <div className="flex items-center text-sm">
                          <Mail className="h-3 w-3 mr-1" />
                          {teacher.email}
                        </div>
                        {teacher.phone && (
                          <div className="flex items-center text-sm text-muted-foreground">
                            <Phone className="h-3 w-3 mr-1" />
                            {teacher.phone}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <div className="text-sm font-medium">
                          {teacher.metadata?.department || 'Not specified'}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {teacher.metadata?.specialization || 'General'}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      {teacher.metadata?.employment_date ? (
                        <div className="flex items-center text-sm">
                          <Calendar className="h-3 w-3 mr-1" />
                          {new Date(teacher.metadata.employment_date).toLocaleDateString()}
                        </div>
                      ) : (
                        <span className="text-muted-foreground">Not specified</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant={teacher.status === 'active' ? 'default' : 'secondary'}>
                        {teacher.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleView(teacher)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        {canManage && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEdit(teacher)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Teacher Profile</DialogTitle>
            <DialogDescription>
              Update teacher profile information and personal details.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="first_name">First Name</Label>
                <Input
                  id="first_name"
                  value={formData.first_name}
                  onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="last_name">Last Name</Label>
                <Input
                  id="last_name"
                  value={formData.last_name}
                  onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                  required
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Phone</Label>
                <Input
                  id="phone"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="employee_id">Employee ID</Label>
                <Input
                  id="employee_id"
                  value={formData.metadata.employee_id}
                  onChange={(e) => setFormData({ 
                    ...formData, 
                    metadata: { ...formData.metadata, employee_id: e.target.value }
                  })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="department">Department</Label>
                <Input
                  id="department"
                  value={formData.metadata.department}
                  onChange={(e) => setFormData({ 
                    ...formData, 
                    metadata: { ...formData.metadata, department: e.target.value }
                  })}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="specialization">Specialization</Label>
              <Input
                id="specialization"
                value={formData.metadata.specialization}
                onChange={(e) => setFormData({ 
                  ...formData, 
                  metadata: { ...formData.metadata, specialization: e.target.value }
                })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="address">Address</Label>
              <Textarea
                id="address"
                value={formData.metadata.address}
                onChange={(e) => setFormData({ 
                  ...formData, 
                  metadata: { ...formData.metadata, address: e.target.value }
                })}
                rows={2}
              />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit">
                Update Profile
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* View Dialog */}
      <Dialog open={!!viewingTeacher} onOpenChange={() => setViewingTeacher(null)}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Teacher Profile</DialogTitle>
          </DialogHeader>
          {viewingTeacher && (
            <div className="space-y-4">
              <div className="flex items-center space-x-4">
                <Avatar className="h-16 w-16">
                  <AvatarImage src={viewingTeacher.avatar_url || ''} />
                  <AvatarFallback className="text-lg">
                    {getInitials(viewingTeacher.first_name, viewingTeacher.last_name)}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="text-lg font-semibold">
                    {viewingTeacher.first_name} {viewingTeacher.last_name}
                  </h3>
                  <p className="text-muted-foreground">
                    {viewingTeacher.metadata?.department || 'Teacher'}
                  </p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium">Email</Label>
                  <p className="text-sm">{viewingTeacher.email}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Phone</Label>
                  <p className="text-sm">{viewingTeacher.phone || 'Not provided'}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Employee ID</Label>
                  <p className="text-sm">{viewingTeacher.metadata?.employee_id || 'Not assigned'}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Specialization</Label>
                  <p className="text-sm">{viewingTeacher.metadata?.specialization || 'General'}</p>
                </div>
              </div>
              {viewingTeacher.metadata?.address && (
                <div>
                  <Label className="text-sm font-medium">Address</Label>
                  <p className="text-sm">{viewingTeacher.metadata.address}</p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}