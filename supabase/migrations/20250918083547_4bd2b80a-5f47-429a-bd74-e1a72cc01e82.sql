-- Create class/section management table
CREATE TABLE public.classes (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    class_name VARCHAR(100) NOT NULL,
    class_level academic_level NOT NULL DEFAULT 'O-Level',
    section VARCHAR(10),
    academic_year_id UUID REFERENCES public.academic_years(id),
    capacity INTEGER DEFAULT 30,
    status TEXT DEFAULT 'active',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    created_by UUID REFERENCES public.profiles(id),
    updated_by UUID REFERENCES public.profiles(id),
    UNIQUE(tenant_id, class_name, section, academic_year_id)
);

-- Create teacher qualifications table
CREATE TABLE public.teacher_qualifications (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    teacher_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    qualification_type VARCHAR(50) NOT NULL, -- 'degree', 'certificate', 'license', 'training'
    qualification_name VARCHAR(255) NOT NULL,
    institution VARCHAR(255),
    year_obtained INTEGER,
    expiry_date DATE,
    certificate_number VARCHAR(100),
    status TEXT DEFAULT 'active',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create teacher-class assignments table
CREATE TABLE public.teacher_classes (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    teacher_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    class_id UUID NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
    assignment_type VARCHAR(20) NOT NULL DEFAULT 'subject_teacher', -- 'class_teacher', 'subject_teacher'
    subject_id UUID REFERENCES public.subjects(id),
    assigned_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    assigned_by UUID REFERENCES public.profiles(id),
    UNIQUE(tenant_id, teacher_id, class_id, subject_id)
);

-- Create teacher leave management table
CREATE TABLE public.teacher_leaves (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    teacher_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    leave_type VARCHAR(50) NOT NULL, -- 'sick', 'personal', 'professional', 'maternity', 'annual'
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    days_requested INTEGER NOT NULL,
    reason TEXT,
    status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'approved', 'rejected'
    approved_by UUID REFERENCES public.profiles(id),
    approved_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create teacher performance evaluations table
CREATE TABLE public.teacher_evaluations (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    teacher_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    evaluator_id UUID NOT NULL REFERENCES public.profiles(id),
    evaluation_period VARCHAR(50) NOT NULL, -- 'term_1', 'term_2', 'annual'
    academic_year_id UUID REFERENCES public.academic_years(id),
    overall_rating INTEGER CHECK (overall_rating >= 1 AND overall_rating <= 5),
    teaching_effectiveness INTEGER CHECK (teaching_effectiveness >= 1 AND teaching_effectiveness <= 5),
    classroom_management INTEGER CHECK (classroom_management >= 1 AND classroom_management <= 5),
    professional_development INTEGER CHECK (professional_development >= 1 AND professional_development <= 5),
    comments TEXT,
    recommendations TEXT,
    status VARCHAR(20) DEFAULT 'draft', -- 'draft', 'completed', 'reviewed'
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security on all tables
ALTER TABLE public.classes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.teacher_qualifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.teacher_classes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.teacher_leaves ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.teacher_evaluations ENABLE ROW LEVEL SECURITY;

-- RLS Policies for classes
CREATE POLICY "Super admins can view all classes" ON public.classes
    FOR SELECT USING (get_current_user_role() = 'super_admin'::app_role);

CREATE POLICY "Tenant admins can manage their classes" ON public.classes
    FOR ALL USING (
        get_current_user_role() = 'tenant_admin'::app_role 
        AND tenant_id = get_current_user_tenant()
    );

CREATE POLICY "Teachers can view tenant classes" ON public.classes
    FOR SELECT USING (
        get_current_user_role() IN ('teacher'::app_role, 'staff'::app_role) 
        AND tenant_id = get_current_user_tenant()
    );

-- RLS Policies for teacher_qualifications
CREATE POLICY "Super admins can view all qualifications" ON public.teacher_qualifications
    FOR SELECT USING (get_current_user_role() = 'super_admin'::app_role);

CREATE POLICY "Tenant admins can manage qualifications" ON public.teacher_qualifications
    FOR ALL USING (
        get_current_user_role() = 'tenant_admin'::app_role 
        AND tenant_id = get_current_user_tenant()
    );

CREATE POLICY "Teachers can view their qualifications" ON public.teacher_qualifications
    FOR SELECT USING (
        get_current_user_role() = 'teacher'::app_role 
        AND teacher_id = auth.uid()
    );

-- RLS Policies for teacher_classes
CREATE POLICY "Super admins can view all teacher_classes" ON public.teacher_classes
    FOR SELECT USING (get_current_user_role() = 'super_admin'::app_role);

CREATE POLICY "Tenant admins can manage teacher_classes" ON public.teacher_classes
    FOR ALL USING (
        get_current_user_role() = 'tenant_admin'::app_role 
        AND tenant_id = get_current_user_tenant()
    );

CREATE POLICY "Teachers can view their class assignments" ON public.teacher_classes
    FOR SELECT USING (
        get_current_user_role() = 'teacher'::app_role 
        AND teacher_id = auth.uid()
    );

-- RLS Policies for teacher_leaves
CREATE POLICY "Super admins can view all leaves" ON public.teacher_leaves
    FOR SELECT USING (get_current_user_role() = 'super_admin'::app_role);

CREATE POLICY "Tenant admins can manage leaves" ON public.teacher_leaves
    FOR ALL USING (
        get_current_user_role() = 'tenant_admin'::app_role 
        AND tenant_id = get_current_user_tenant()
    );

CREATE POLICY "Teachers can manage their leaves" ON public.teacher_leaves
    FOR ALL USING (
        get_current_user_role() = 'teacher'::app_role 
        AND teacher_id = auth.uid()
    );

-- RLS Policies for teacher_evaluations
CREATE POLICY "Super admins can view all evaluations" ON public.teacher_evaluations
    FOR SELECT USING (get_current_user_role() = 'super_admin'::app_role);

CREATE POLICY "Tenant admins can manage evaluations" ON public.teacher_evaluations
    FOR ALL USING (
        get_current_user_role() = 'tenant_admin'::app_role 
        AND tenant_id = get_current_user_tenant()
    );

CREATE POLICY "Teachers can view their evaluations" ON public.teacher_evaluations
    FOR SELECT USING (
        get_current_user_role() = 'teacher'::app_role 
        AND teacher_id = auth.uid()
    );

-- Create updated_at triggers
CREATE TRIGGER update_classes_updated_at
    BEFORE UPDATE ON public.classes
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_teacher_qualifications_updated_at
    BEFORE UPDATE ON public.teacher_qualifications
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_teacher_leaves_updated_at
    BEFORE UPDATE ON public.teacher_leaves
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_teacher_evaluations_updated_at
    BEFORE UPDATE ON public.teacher_evaluations
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- Create indexes for better performance
CREATE INDEX idx_classes_tenant_id ON public.classes(tenant_id);
CREATE INDEX idx_teacher_qualifications_tenant_id ON public.teacher_qualifications(tenant_id);
CREATE INDEX idx_teacher_qualifications_teacher_id ON public.teacher_qualifications(teacher_id);
CREATE INDEX idx_teacher_classes_tenant_id ON public.teacher_classes(tenant_id);
CREATE INDEX idx_teacher_classes_teacher_id ON public.teacher_classes(teacher_id);
CREATE INDEX idx_teacher_leaves_tenant_id ON public.teacher_leaves(tenant_id);
CREATE INDEX idx_teacher_leaves_teacher_id ON public.teacher_leaves(teacher_id);
CREATE INDEX idx_teacher_evaluations_tenant_id ON public.teacher_evaluations(tenant_id);
CREATE INDEX idx_teacher_evaluations_teacher_id ON public.teacher_evaluations(teacher_id);

CREATE INDEX idx_classes_level ON public.classes(class_level);
CREATE INDEX idx_teacher_leaves_status ON public.teacher_leaves(status);
CREATE INDEX idx_teacher_evaluations_period ON public.teacher_evaluations(evaluation_period);