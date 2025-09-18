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
import { Plus, Edit, Star, Award, TrendingUp } from 'lucide-react';
import { toast } from 'sonner';

interface Teacher {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
}

interface AcademicYear {
  id: string;
  year_name: string;
}

interface Evaluation {
  id: string;
  teacher_id: string;
  evaluator_id: string;
  evaluation_period: string;
  academic_year_id: string | null;
  overall_rating: number | null;
  teaching_effectiveness: number | null;
  classroom_management: number | null;
  professional_development: number | null;
  comments: string | null;
  recommendations: string | null;
  status: string;
  created_at: string;
  teacher: Teacher;
  evaluator: Teacher;
  academic_year?: AcademicYear;
}

interface PerformanceEvaluationsProps {
  canManage: boolean;
}

export default function PerformanceEvaluations({ canManage }: PerformanceEvaluationsProps) {
  const { profile } = useAuth();
  const [evaluations, setEvaluations] = useState<Evaluation[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [academicYears, setAcademicYears] = useState<AcademicYear[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingEvaluation, setEditingEvaluation] = useState<Evaluation | null>(null);
  const [formData, setFormData] = useState({
    teacher_id: '',
    evaluation_period: 'term_1' as 'term_1' | 'term_2' | 'annual',
    academic_year_id: '',
    overall_rating: 5,
    teaching_effectiveness: 5,
    classroom_management: 5,
    professional_development: 5,
    comments: '',
    recommendations: '',
  });

  // For teachers, show only their evaluations
  const isTeacher = profile?.role === 'teacher';

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      let query = supabase
        .from('teacher_evaluations')
        .select(`
          *,
          teacher:profiles!teacher_evaluations_teacher_id_fkey(id, first_name, last_name, email),
          evaluator:profiles!teacher_evaluations_evaluator_id_fkey(id, first_name, last_name, email),
          academic_year:academic_years(id, year_name)
        `)
        .order('created_at', { ascending: false });

      // If user is a teacher, only show their evaluations
      if (isTeacher) {
        query = query.eq('teacher_id', profile?.id);
      }

      const { data: evaluationData, error: evaluationError } = await query;

      if (evaluationError) {
        console.error('Error fetching evaluations:', evaluationError);
        toast.error('Failed to load performance evaluations');
      } else {
        setEvaluations(evaluationData || []);
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

      // Fetch academic years
      const { data: yearData, error: yearError } = await supabase
        .from('academic_years')
        .select('id, year_name')
        .eq('status', 'active')
        .order('year_name', { ascending: false });

      if (yearError) {
        console.error('Error fetching academic years:', yearError);
      } else {
        setAcademicYears(yearData || []);
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
      const evaluationData = {
        tenant_id: profile.tenant_id,
        teacher_id: formData.teacher_id,
        evaluator_id: profile.id,
        evaluation_period: formData.evaluation_period,
        academic_year_id: formData.academic_year_id || null,
        overall_rating: formData.overall_rating,
        teaching_effectiveness: formData.teaching_effectiveness,
        classroom_management: formData.classroom_management,
        professional_development: formData.professional_development,
        comments: formData.comments || null,
        recommendations: formData.recommendations || null,
        status: 'completed',
      };

      if (editingEvaluation) {
        const { error } = await supabase
          .from('teacher_evaluations')
          .update(evaluationData)
          .eq('id', editingEvaluation.id);

        if (error) throw error;
        toast.success('Evaluation updated successfully');
      } else {
        const { error } = await supabase
          .from('teacher_evaluations')
          .insert([evaluationData]);

        if (error) throw error;
        toast.success('Evaluation created successfully');
      }

      setIsDialogOpen(false);
      setEditingEvaluation(null);
      resetForm();
      fetchData();
    } catch (error: any) {
      console.error('Error saving evaluation:', error);
      toast.error('Failed to save evaluation');
    }
  };

  const resetForm = () => {
    setFormData({
      teacher_id: '',
      evaluation_period: 'term_1',
      academic_year_id: '',
      overall_rating: 5,
      teaching_effectiveness: 5,
      classroom_management: 5,
      professional_development: 5,
      comments: '',
      recommendations: '',
    });
  };

  const handleEdit = (evaluation: Evaluation) => {
    setEditingEvaluation(evaluation);
    setFormData({
      teacher_id: evaluation.teacher_id,
      evaluation_period: evaluation.evaluation_period as any,
      academic_year_id: evaluation.academic_year_id || '',
      overall_rating: evaluation.overall_rating || 5,
      teaching_effectiveness: evaluation.teaching_effectiveness || 5,
      classroom_management: evaluation.classroom_management || 5,
      professional_development: evaluation.professional_development || 5,
      comments: evaluation.comments || '',
      recommendations: evaluation.recommendations || '',
    });
    setIsDialogOpen(true);
  };

  const getRatingStars = (rating: number | null) => {
    if (!rating) return <span className="text-muted-foreground">Not rated</span>;
    
    return (
      <div className="flex items-center">
        {[...Array(5)].map((_, i) => (
          <Star
            key={i}
            className={`h-4 w-4 ${
              i < rating
                ? 'text-yellow-400 fill-current'
                : 'text-gray-300'
            }`}
          />
        ))}
        <span className="ml-2 text-sm">{rating}/5</span>
      </div>
    );
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'reviewed':
        return 'bg-blue-100 text-blue-800';
      case 'draft':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getPeriodBadge = (period: string) => {
    const colors = {
      term_1: 'bg-blue-100 text-blue-800',
      term_2: 'bg-purple-100 text-purple-800',
      annual: 'bg-green-100 text-green-800',
    };
    return colors[period as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  if (loading) {
    return <div>Loading performance evaluations...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Performance Evaluations</h3>
          <p className="text-sm text-muted-foreground">
            {isTeacher ? 'Your performance evaluations' : 'Manage teacher performance evaluations'}
          </p>
        </div>
        {canManage && (
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                New Evaluation
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>
                  {editingEvaluation ? 'Edit Evaluation' : 'Create Performance Evaluation'}
                </DialogTitle>
                <DialogDescription>
                  Evaluate teacher performance across various criteria.
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="teacher_id">Teacher</Label>
                    <Select
                      value={formData.teacher_id}
                      onValueChange={(value) => setFormData({ ...formData, teacher_id: value })}
                      disabled={!!editingEvaluation}
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
                  <div className="space-y-2">
                    <Label htmlFor="evaluation_period">Period</Label>
                    <Select
                      value={formData.evaluation_period}
                      onValueChange={(value: any) => setFormData({ ...formData, evaluation_period: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="term_1">Term 1</SelectItem>
                        <SelectItem value="term_2">Term 2</SelectItem>
                        <SelectItem value="annual">Annual</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="academic_year_id">Academic Year</Label>
                  <Select
                    value={formData.academic_year_id}
                    onValueChange={(value) => setFormData({ ...formData, academic_year_id: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select academic year" />
                    </SelectTrigger>
                    <SelectContent>
                      {academicYears.map((year) => (
                        <SelectItem key={year.id} value={year.id}>
                          {year.year_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-4">
                  <h4 className="font-medium">Rating Criteria (1-5 scale)</h4>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Overall Rating</Label>
                      <Select
                        value={formData.overall_rating.toString()}
                        onValueChange={(value) => setFormData({ ...formData, overall_rating: parseInt(value) })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {[1, 2, 3, 4, 5].map((rating) => (
                            <SelectItem key={rating} value={rating.toString()}>
                              {rating} - {rating === 1 ? 'Poor' : rating === 2 ? 'Below Average' : rating === 3 ? 'Average' : rating === 4 ? 'Good' : 'Excellent'}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="space-y-2">
                      <Label>Teaching Effectiveness</Label>
                      <Select
                        value={formData.teaching_effectiveness.toString()}
                        onValueChange={(value) => setFormData({ ...formData, teaching_effectiveness: parseInt(value) })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {[1, 2, 3, 4, 5].map((rating) => (
                            <SelectItem key={rating} value={rating.toString()}>
                              {rating} - {rating === 1 ? 'Poor' : rating === 2 ? 'Below Average' : rating === 3 ? 'Average' : rating === 4 ? 'Good' : 'Excellent'}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="space-y-2">
                      <Label>Classroom Management</Label>
                      <Select
                        value={formData.classroom_management.toString()}
                        onValueChange={(value) => setFormData({ ...formData, classroom_management: parseInt(value) })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {[1, 2, 3, 4, 5].map((rating) => (
                            <SelectItem key={rating} value={rating.toString()}>
                              {rating} - {rating === 1 ? 'Poor' : rating === 2 ? 'Below Average' : rating === 3 ? 'Average' : rating === 4 ? 'Good' : 'Excellent'}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="space-y-2">
                      <Label>Professional Development</Label>
                      <Select
                        value={formData.professional_development.toString()}
                        onValueChange={(value) => setFormData({ ...formData, professional_development: parseInt(value) })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {[1, 2, 3, 4, 5].map((rating) => (
                            <SelectItem key={rating} value={rating.toString()}>
                              {rating} - {rating === 1 ? 'Poor' : rating === 2 ? 'Below Average' : rating === 3 ? 'Average' : rating === 4 ? 'Good' : 'Excellent'}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="comments">Comments</Label>
                  <Textarea
                    id="comments"
                    value={formData.comments}
                    onChange={(e) => setFormData({ ...formData, comments: e.target.value })}
                    placeholder="Overall comments about performance..."
                    rows={3}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="recommendations">Recommendations</Label>
                  <Textarea
                    id="recommendations"
                    value={formData.recommendations}
                    onChange={(e) => setFormData({ ...formData, recommendations: e.target.value })}
                    placeholder="Recommendations for improvement..."
                    rows={3}
                  />
                </div>

                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit">
                    {editingEvaluation ? 'Update Evaluation' : 'Create Evaluation'}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {evaluations.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-8">
            <Award className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No evaluations found</h3>
            <p className="text-sm text-muted-foreground text-center mb-4">
              {isTeacher ? 'You have no performance evaluations yet.' : 'No performance evaluations have been created.'}
            </p>
            {canManage && (
              <Button onClick={() => setIsDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Create First Evaluation
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Performance Evaluations ({evaluations.length})</CardTitle>
            <CardDescription>
              {isTeacher ? 'Your performance evaluations' : 'Teacher performance evaluations'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  {!isTeacher && <TableHead>Teacher</TableHead>}
                  <TableHead>Period</TableHead>
                  <TableHead>Academic Year</TableHead>
                  <TableHead>Overall Rating</TableHead>
                  <TableHead>Teaching</TableHead>
                  <TableHead>Management</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Evaluator</TableHead>
                  {canManage && <TableHead>Actions</TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {evaluations.map((evaluation) => (
                  <TableRow key={evaluation.id}>
                    {!isTeacher && (
                      <TableCell className="font-medium">
                        {evaluation.teacher.first_name} {evaluation.teacher.last_name}
                      </TableCell>
                    )}
                    <TableCell>
                      <Badge className={getPeriodBadge(evaluation.evaluation_period)}>
                        {evaluation.evaluation_period.replace('_', ' ')}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {evaluation.academic_year?.year_name || 'Not specified'}
                    </TableCell>
                    <TableCell>
                      {getRatingStars(evaluation.overall_rating)}
                    </TableCell>
                    <TableCell>
                      {getRatingStars(evaluation.teaching_effectiveness)}
                    </TableCell>
                    <TableCell>
                      {getRatingStars(evaluation.classroom_management)}
                    </TableCell>
                    <TableCell>
                      <Badge className={getStatusBadge(evaluation.status)}>
                        {evaluation.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {evaluation.evaluator.first_name} {evaluation.evaluator.last_name}
                    </TableCell>
                    {canManage && (
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEdit(evaluation)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
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