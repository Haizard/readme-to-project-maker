import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Plus, Edit, Trash2, GraduationCap } from 'lucide-react';
import { toast } from 'sonner';

interface Subject {
  id: string;
  subject_name: string;
  subject_code: string | null;
  subject_level: 'Primary' | 'O-Level' | 'A-Level' | 'University';
  subject_type: 'Core' | 'Optional' | 'Combination';
  description: string | null;
  credits: number;
  status: string;
  created_at: string;
}

interface SubjectManagementProps {
  canManage: boolean;
}

export default function SubjectManagement({ canManage }: SubjectManagementProps) {
  const { profile } = useAuth();
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingSubject, setEditingSubject] = useState<Subject | null>(null);
  const [formData, setFormData] = useState({
    subject_name: '',
    subject_code: '',
    subject_level: 'O-Level' as 'Primary' | 'O-Level' | 'A-Level' | 'University',
    subject_type: 'Core' as 'Core' | 'Optional' | 'Combination',
    description: '',
    credits: 0,
  });

  useEffect(() => {
    fetchSubjects();
  }, []);

  const fetchSubjects = async () => {
    try {
      const { data, error } = await supabase
        .from('subjects')
        .select('*')
        .eq('status', 'active')
        .order('subject_level', { ascending: true })
        .order('subject_name', { ascending: true });

      if (error) {
        console.error('Error fetching subjects:', error);
        toast.error('Failed to load subjects');
        return;
      }

      setSubjects(data || []);
    } catch (error) {
      console.error('Error:', error);
      toast.error('Failed to load subjects');
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
      const subjectData = {
        ...formData,
        tenant_id: profile.tenant_id,
        created_by: profile.id,
        updated_by: profile.id,
      };

      if (editingSubject) {
        const { error } = await supabase
          .from('subjects')
          .update(subjectData)
          .eq('id', editingSubject.id);

        if (error) throw error;
        toast.success('Subject updated successfully');
      } else {
        const { error } = await supabase
          .from('subjects')
          .insert([subjectData]);

        if (error) throw error;
        toast.success('Subject created successfully');
      }

      setIsDialogOpen(false);
      setEditingSubject(null);
      setFormData({
        subject_name: '',
        subject_code: '',
        subject_level: 'O-Level',
        subject_type: 'Core',
        description: '',
        credits: 0,
      });
      fetchSubjects();
    } catch (error: any) {
      console.error('Error saving subject:', error);
      toast.error(error.message || 'Failed to save subject');
    }
  };

  const handleEdit = (subject: Subject) => {
    setEditingSubject(subject);
    setFormData({
      subject_name: subject.subject_name,
      subject_code: subject.subject_code || '',
      subject_level: subject.subject_level,
      subject_type: subject.subject_type,
      description: subject.description || '',
      credits: subject.credits,
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (subjectId: string) => {
    if (!confirm('Are you sure you want to delete this subject?')) return;

    try {
      const { error } = await supabase
        .from('subjects')
        .update({ status: 'deleted' })
        .eq('id', subjectId);

      if (error) throw error;
      toast.success('Subject deleted successfully');
      fetchSubjects();
    } catch (error: any) {
      console.error('Error deleting subject:', error);
      toast.error('Failed to delete subject');
    }
  };

  const getLevelBadgeColor = (level: string) => {
    switch (level) {
      case 'Primary': return 'bg-blue-100 text-blue-800';
      case 'O-Level': return 'bg-green-100 text-green-800';
      case 'A-Level': return 'bg-purple-100 text-purple-800';
      case 'University': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getTypeBadgeColor = (type: string) => {
    switch (type) {
      case 'Core': return 'bg-red-100 text-red-800';
      case 'Optional': return 'bg-yellow-100 text-yellow-800';
      case 'Combination': return 'bg-indigo-100 text-indigo-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return <div>Loading subjects...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Subject Management</h3>
          <p className="text-sm text-muted-foreground">
            Create and manage subjects with NECTA compliance support
          </p>
        </div>
        {canManage && (
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Add Subject
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle>
                  {editingSubject ? 'Edit Subject' : 'Create New Subject'}
                </DialogTitle>
                <DialogDescription>
                  Configure subject details including level and type for NECTA compliance.
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="subject_name">Subject Name</Label>
                    <Input
                      id="subject_name"
                      value={formData.subject_name}
                      onChange={(e) => setFormData({ ...formData, subject_name: e.target.value })}
                      placeholder="e.g., Mathematics"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="subject_code">Subject Code</Label>
                    <Input
                      id="subject_code"
                      value={formData.subject_code}
                      onChange={(e) => setFormData({ ...formData, subject_code: e.target.value })}
                      placeholder="e.g., MATH"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="subject_level">Academic Level</Label>
                    <Select
                      value={formData.subject_level}
                      onValueChange={(value: any) => setFormData({ ...formData, subject_level: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select level" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Primary">Primary</SelectItem>
                        <SelectItem value="O-Level">O-Level</SelectItem>
                        <SelectItem value="A-Level">A-Level</SelectItem>
                        <SelectItem value="University">University</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="subject_type">Subject Type</Label>
                    <Select
                      value={formData.subject_type}
                      onValueChange={(value: any) => setFormData({ ...formData, subject_type: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Core">Core</SelectItem>
                        <SelectItem value="Optional">Optional</SelectItem>
                        <SelectItem value="Combination">Combination</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="credits">Credits</Label>
                  <Input
                    id="credits"
                    type="number"
                    value={formData.credits}
                    onChange={(e) => setFormData({ ...formData, credits: parseInt(e.target.value) || 0 })}
                    min="0"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Subject description..."
                    rows={3}
                  />
                </div>
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit">
                    {editingSubject ? 'Update Subject' : 'Create Subject'}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {subjects.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-8">
            <GraduationCap className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No subjects found</h3>
            <p className="text-sm text-muted-foreground text-center mb-4">
              Start by creating subjects that align with NECTA standards.
            </p>
            {canManage && (
              <Button onClick={() => setIsDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Create First Subject
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Subjects ({subjects.length})</CardTitle>
            <CardDescription>
              All active subjects organized by level and type
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Subject Name</TableHead>
                  <TableHead>Code</TableHead>
                  <TableHead>Level</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Credits</TableHead>
                  <TableHead>Description</TableHead>
                  {canManage && <TableHead>Actions</TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {subjects.map((subject) => (
                  <TableRow key={subject.id}>
                    <TableCell className="font-medium">{subject.subject_name}</TableCell>
                    <TableCell>{subject.subject_code || '-'}</TableCell>
                    <TableCell>
                      <Badge className={getLevelBadgeColor(subject.subject_level)}>
                        {subject.subject_level}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge className={getTypeBadgeColor(subject.subject_type)}>
                        {subject.subject_type}
                      </Badge>
                    </TableCell>
                    <TableCell>{subject.credits}</TableCell>
                    <TableCell className="max-w-xs truncate">
                      {subject.description || 'No description'}
                    </TableCell>
                    {canManage && (
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEdit(subject)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(subject.id)}
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