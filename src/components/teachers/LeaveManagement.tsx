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
import { Plus, Check, X, Calendar, Clock } from 'lucide-react';
import { toast } from 'sonner';

interface Teacher {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
}

interface Leave {
  id: string;
  teacher_id: string;
  leave_type: string;
  start_date: string;
  end_date: string;
  days_requested: number;
  reason: string | null;
  status: string;
  approved_by: string | null;
  approved_at: string | null;
  created_at: string;
  teacher: Teacher;
  approver?: Teacher;
}

interface LeaveManagementProps {
  canManage: boolean;
}

export default function LeaveManagement({ canManage }: LeaveManagementProps) {
  const { profile } = useAuth();
  const [leaves, setLeaves] = useState<Leave[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    teacher_id: '',
    leave_type: 'annual' as 'sick' | 'personal' | 'professional' | 'maternity' | 'annual',
    start_date: '',
    end_date: '',
    reason: '',
  });

  // For teachers, show only their leaves
  const isTeacher = profile?.role === 'teacher';

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      let query = supabase
        .from('teacher_leaves')
        .select(`
          *,
          teacher:profiles!teacher_leaves_teacher_id_fkey(id, first_name, last_name, email),
          approver:profiles!teacher_leaves_approved_by_fkey(id, first_name, last_name, email)
        `)
        .order('created_at', { ascending: false });

      // If user is a teacher, only show their leaves
      if (isTeacher) {
        query = query.eq('teacher_id', profile?.id);
      }

      const { data: leaveData, error: leaveError } = await query;

      if (leaveError) {
        console.error('Error fetching leaves:', leaveError);
        toast.error('Failed to load leave requests');
      } else {
        setLeaves(leaveData || []);
      }

      // Fetch teachers for dropdown (only for non-teacher users)
      if (!isTeacher) {
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
      }
    } catch (error) {
      console.error('Error:', error);
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const calculateDays = (startDate: string, endDate: string) => {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffTime = Math.abs(end.getTime() - start.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!profile?.tenant_id) {
      toast.error('No tenant information found');
      return;
    }

    if (!formData.start_date || !formData.end_date) {
      toast.error('Please select both start and end dates');
      return;
    }

    const days = calculateDays(formData.start_date, formData.end_date);

    try {
      const leaveData = {
        tenant_id: profile.tenant_id,
        teacher_id: isTeacher ? profile.id : formData.teacher_id,
        leave_type: formData.leave_type,
        start_date: formData.start_date,
        end_date: formData.end_date,
        days_requested: days,
        reason: formData.reason || null,
        status: 'pending',
      };

      const { error } = await supabase
        .from('teacher_leaves')
        .insert([leaveData]);

      if (error) throw error;
      toast.success('Leave request submitted successfully');
      setIsDialogOpen(false);
      resetForm();
      fetchData();
    } catch (error: any) {
      console.error('Error submitting leave:', error);
      toast.error('Failed to submit leave request');
    }
  };

  const resetForm = () => {
    setFormData({
      teacher_id: '',
      leave_type: 'annual',
      start_date: '',
      end_date: '',
      reason: '',
    });
  };

  const handleApproval = async (leaveId: string, action: 'approved' | 'rejected') => {
    try {
      const { error } = await supabase
        .from('teacher_leaves')
        .update({
          status: action,
          approved_by: profile?.id,
          approved_at: new Date().toISOString(),
        })
        .eq('id', leaveId);

      if (error) throw error;
      toast.success(`Leave request ${action} successfully`);
      fetchData();
    } catch (error: any) {
      console.error('Error updating leave status:', error);
      toast.error('Failed to update leave status');
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved':
        return 'bg-green-100 text-green-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getLeaveTypeBadge = (type: string) => {
    const colors = {
      sick: 'bg-red-100 text-red-800',
      personal: 'bg-blue-100 text-blue-800',
      professional: 'bg-purple-100 text-purple-800',
      maternity: 'bg-pink-100 text-pink-800',
      annual: 'bg-green-100 text-green-800',
    };
    return colors[type as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  if (loading) {
    return <div>Loading leave management...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Leave Management</h3>
          <p className="text-sm text-muted-foreground">
            {isTeacher ? 'Manage your leave requests' : 'Manage teacher leave requests'}
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              {isTeacher ? 'Request Leave' : 'Add Leave Request'}
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>
                {isTeacher ? 'Request Leave' : 'Add Leave Request'}
              </DialogTitle>
              <DialogDescription>
                Submit a new leave request with details and dates.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              {!isTeacher && (
                <div className="space-y-2">
                  <Label htmlFor="teacher_id">Teacher</Label>
                  <Select
                    value={formData.teacher_id}
                    onValueChange={(value) => setFormData({ ...formData, teacher_id: value })}
                    required
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
              )}
              <div className="space-y-2">
                <Label htmlFor="leave_type">Leave Type</Label>
                <Select
                  value={formData.leave_type}
                  onValueChange={(value: any) => setFormData({ ...formData, leave_type: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="annual">Annual Leave</SelectItem>
                    <SelectItem value="sick">Sick Leave</SelectItem>
                    <SelectItem value="personal">Personal Leave</SelectItem>
                    <SelectItem value="professional">Professional Development</SelectItem>
                    <SelectItem value="maternity">Maternity Leave</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="start_date">Start Date</Label>
                  <Input
                    id="start_date"
                    type="date"
                    value={formData.start_date}
                    onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="end_date">End Date</Label>
                  <Input
                    id="end_date"
                    type="date"
                    value={formData.end_date}
                    onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                    required
                  />
                </div>
              </div>
              {formData.start_date && formData.end_date && (
                <div className="text-sm text-muted-foreground">
                  Total days: {calculateDays(formData.start_date, formData.end_date)}
                </div>
              )}
              <div className="space-y-2">
                <Label htmlFor="reason">Reason (Optional)</Label>
                <Textarea
                  id="reason"
                  value={formData.reason}
                  onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                  placeholder="Provide additional details about your leave request..."
                  rows={3}
                />
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit">
                  Submit Request
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {leaves.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-8">
            <Calendar className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No leave requests found</h3>
            <p className="text-sm text-muted-foreground text-center mb-4">
              {isTeacher ? 'You have no leave requests.' : 'No leave requests have been submitted.'}
            </p>
            <Button onClick={() => setIsDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              {isTeacher ? 'Request Leave' : 'Add Leave Request'}
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Leave Requests ({leaves.length})</CardTitle>
            <CardDescription>
              {isTeacher ? 'Your leave requests' : 'All teacher leave requests'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  {!isTeacher && <TableHead>Teacher</TableHead>}
                  <TableHead>Type</TableHead>
                  <TableHead>Duration</TableHead>
                  <TableHead>Days</TableHead>
                  <TableHead>Reason</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Submitted</TableHead>
                  {canManage && <TableHead>Actions</TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {leaves.map((leave) => (
                  <TableRow key={leave.id}>
                    {!isTeacher && (
                      <TableCell className="font-medium">
                        {leave.teacher.first_name} {leave.teacher.last_name}
                      </TableCell>
                    )}
                    <TableCell>
                      <Badge className={getLeaveTypeBadge(leave.leave_type)}>
                        {leave.leave_type}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        <div>{new Date(leave.start_date).toLocaleDateString()}</div>
                        <div className="text-muted-foreground">
                          to {new Date(leave.end_date).toLocaleDateString()}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center">
                        <Clock className="h-3 w-3 mr-1" />
                        {leave.days_requested}
                      </div>
                    </TableCell>
                    <TableCell className="max-w-xs">
                      <p className="truncate text-sm">
                        {leave.reason || 'No reason provided'}
                      </p>
                    </TableCell>
                    <TableCell>
                      <Badge className={getStatusBadge(leave.status)}>
                        {leave.status}
                      </Badge>
                      {leave.approved_at && (
                        <div className="text-xs text-muted-foreground mt-1">
                          {new Date(leave.approved_at).toLocaleDateString()}
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      {new Date(leave.created_at).toLocaleDateString()}
                    </TableCell>
                    {canManage && leave.status === 'pending' && (
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleApproval(leave.id, 'approved')}
                            className="text-green-600 hover:text-green-700"
                          >
                            <Check className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleApproval(leave.id, 'rejected')}
                            className="text-red-600 hover:text-red-700"
                          >
                            <X className="h-4 w-4" />
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