import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Plus, Edit, Trash2, Award, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';

interface Teacher {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
}

interface Qualification {
  id: string;
  teacher_id: string;
  qualification_type: string;
  qualification_name: string;
  institution: string | null;
  year_obtained: number | null;
  expiry_date: string | null;
  certificate_number: string | null;
  status: string;
  teacher: Teacher;
}

interface TeacherQualificationsProps {
  canManage: boolean;
}

export default function TeacherQualifications({ canManage }: TeacherQualificationsProps) {
  const { profile } = useAuth();
  const [qualifications, setQualifications] = useState<Qualification[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingQualification, setEditingQualification] = useState<Qualification | null>(null);
  const [formData, setFormData] = useState({
    teacher_id: '',
    qualification_type: 'degree' as 'degree' | 'certificate' | 'license' | 'training',
    qualification_name: '',
    institution: '',
    year_obtained: '',
    expiry_date: '',
    certificate_number: '',
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      // Fetch qualifications with teacher info
      const { data: qualificationData, error: qualificationError } = await supabase
        .from('teacher_qualifications')
        .select(`
          *,
          teacher:profiles!teacher_qualifications_teacher_id_fkey(id, first_name, last_name, email)
        `)
        .eq('status', 'active')
        .order('created_at', { ascending: false });

      if (qualificationError) {
        console.error('Error fetching qualifications:', qualificationError);
        toast.error('Failed to load teacher qualifications');
      } else {
        setQualifications(qualificationData || []);
      }

      // Fetch teachers for dropdown
      const { data: teacherData, error: teacherError } = await supabase
        .from('profiles')
        .select('id, first_name, last_name, email')
        .eq('role', 'teacher')
        .eq('status', 'active')
        .order('first_name');

      if (teacherError) {
        console.error('Error fetching teachers:', teacherError);
      } else {
        setTeachers(teacherData || []);
      }
    } catch (error) {
      console.error('Error:', error);
      toast.error('Failed to load data');
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
      const qualificationData = {
        ...formData,
        tenant_id: profile.tenant_id,
        year_obtained: formData.year_obtained ? parseInt(formData.year_obtained) : null,
        expiry_date: formData.expiry_date || null,
      };

      if (editingQualification) {
        const { error } = await supabase
          .from('teacher_qualifications')
          .update(qualificationData)
          .eq('id', editingQualification.id);

        if (error) throw error;
        toast.success('Qualification updated successfully');
      } else {
        const { error } = await supabase
          .from('teacher_qualifications')
          .insert([qualificationData]);

        if (error) throw error;
        toast.success('Qualification added successfully');
      }

      setIsDialogOpen(false);
      setEditingQualification(null);
      resetForm();
      fetchData();
    } catch (error: any) {
      console.error('Error saving qualification:', error);
      toast.error(error.message || 'Failed to save qualification');
    }
  };

  const resetForm = () => {
    setFormData({
      teacher_id: '',
      qualification_type: 'degree',
      qualification_name: '',
      institution: '',
      year_obtained: '',
      expiry_date: '',
      certificate_number: '',
    });
  };

  const handleEdit = (qualification: Qualification) => {
    setEditingQualification(qualification);
    setFormData({
      teacher_id: qualification.teacher_id,
      qualification_type: qualification.qualification_type as any,
      qualification_name: qualification.qualification_name,
      institution: qualification.institution || '',
      year_obtained: qualification.year_obtained?.toString() || '',
      expiry_date: qualification.expiry_date || '',
      certificate_number: qualification.certificate_number || '',
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (qualificationId: string) => {
    if (!confirm('Are you sure you want to delete this qualification?')) return;

    try {
      const { error } = await supabase
        .from('teacher_qualifications')
        .update({ status: 'deleted' })
        .eq('id', qualificationId);

      if (error) throw error;
      toast.success('Qualification deleted successfully');
      fetchData();
    } catch (error: any) {
      console.error('Error deleting qualification:', error);
      toast.error('Failed to delete qualification');
    }
  };

  const getQualificationTypeBadge = (type: string) => {
    const colors = {
      degree: 'bg-blue-100 text-blue-800',
      certificate: 'bg-green-100 text-green-800',
      license: 'bg-purple-100 text-purple-800',
      training: 'bg-orange-100 text-orange-800',
    };
    return colors[type as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  const isExpiringSoon = (expiryDate: string | null) => {
    if (!expiryDate) return false;
    const expiry = new Date(expiryDate);
    const today = new Date();
    const monthsUntilExpiry = (expiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24 * 30);
    return monthsUntilExpiry <= 6 && monthsUntilExpiry > 0;
  };

  const isExpired = (expiryDate: string | null) => {
    if (!expiryDate) return false;
    return new Date(expiryDate) < new Date();
  };

  if (loading) {
    return <div>Loading teacher qualifications...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Teacher Qualifications</h3>
          <p className="text-sm text-muted-foreground">
            Manage teacher educational qualifications and certifications
          </p>
        </div>
        {canManage && (
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Add Qualification
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle>
                  {editingQualification ? 'Edit Qualification' : 'Add New Qualification'}
                </DialogTitle>
                <DialogDescription>
                  Add or update teacher qualification information.
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="teacher_id">Teacher</Label>
                  <Select
                    value={formData.teacher_id}
                    onValueChange={(value) => setFormData({ ...formData, teacher_id: value })}
                    disabled={!!editingQualification}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select a teacher" />
                    </SelectTrigger>
                    <SelectContent>
                      {teachers.map((teacher) => (
                        <SelectItem key={teacher.id} value={teacher.id}>
                          {teacher.first_name} {teacher.last_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="qualification_type">Type</Label>
                    <Select
                      value={formData.qualification_type}
                      onValueChange={(value: any) => setFormData({ ...formData, qualification_type: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="degree">Degree</SelectItem>
                        <SelectItem value="certificate">Certificate</SelectItem>
                        <SelectItem value="license">License</SelectItem>
                        <SelectItem value="training">Training</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="year_obtained">Year Obtained</Label>
                    <Input
                      id="year_obtained"
                      type="number"
                      value={formData.year_obtained}
                      onChange={(e) => setFormData({ ...formData, year_obtained: e.target.value })}
                      min="1900"
                      max={new Date().getFullYear()}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="qualification_name">Qualification Name</Label>
                  <Input
                    id="qualification_name"
                    value={formData.qualification_name}
                    onChange={(e) => setFormData({ ...formData, qualification_name: e.target.value })}
                    placeholder="e.g., Bachelor of Education"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="institution">Institution</Label>
                  <Input
                    id="institution"
                    value={formData.institution}
                    onChange={(e) => setFormData({ ...formData, institution: e.target.value })}
                    placeholder="e.g., University of Dar es Salaam"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="certificate_number">Certificate Number</Label>
                    <Input
                      id="certificate_number"
                      value={formData.certificate_number}
                      onChange={(e) => setFormData({ ...formData, certificate_number: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="expiry_date">Expiry Date (if applicable)</Label>
                    <Input
                      id="expiry_date"
                      type="date"
                      value={formData.expiry_date}
                      onChange={(e) => setFormData({ ...formData, expiry_date: e.target.value })}
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit">
                    {editingQualification ? 'Update Qualification' : 'Add Qualification'}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {qualifications.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-8">
            <Award className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No qualifications found</h3>
            <p className="text-sm text-muted-foreground text-center mb-4">
              Start by adding teacher qualifications and certifications.
            </p>
            {canManage && (
              <Button onClick={() => setIsDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Add First Qualification
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Teacher Qualifications ({qualifications.length})</CardTitle>
            <CardDescription>
              Educational qualifications and certifications for all teachers
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Teacher</TableHead>
                  <TableHead>Qualification</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Institution</TableHead>
                  <TableHead>Year</TableHead>
                  <TableHead>Status</TableHead>
                  {canManage && <TableHead>Actions</TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {qualifications.map((qualification) => (
                  <TableRow key={qualification.id}>
                    <TableCell className="font-medium">
                      {qualification.teacher.first_name} {qualification.teacher.last_name}
                    </TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium">{qualification.qualification_name}</div>
                        {qualification.certificate_number && (
                          <div className="text-sm text-muted-foreground">
                            Cert: {qualification.certificate_number}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={getQualificationTypeBadge(qualification.qualification_type)}>
                        {qualification.qualification_type}
                      </Badge>
                    </TableCell>
                    <TableCell>{qualification.institution || 'Not specified'}</TableCell>
                    <TableCell>{qualification.year_obtained || 'N/A'}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {qualification.expiry_date && (
                          <>
                            {isExpired(qualification.expiry_date) ? (
                              <Badge variant="destructive" className="text-xs">
                                Expired
                              </Badge>
                            ) : isExpiringSoon(qualification.expiry_date) ? (
                              <Badge variant="outline" className="text-xs border-yellow-500 text-yellow-700">
                                <AlertTriangle className="h-3 w-3 mr-1" />
                                Expiring Soon
                              </Badge>
                            ) : (
                              <Badge variant="outline" className="text-xs">
                                Valid
                              </Badge>
                            )}
                          </>
                        )}
                        {!qualification.expiry_date && (
                          <Badge variant="outline" className="text-xs">
                            No Expiry
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    {canManage && (
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEdit(qualification)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(qualification.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    )}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}