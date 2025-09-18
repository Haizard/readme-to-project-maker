-- Create academic levels and subject types enums
CREATE TYPE academic_level AS ENUM ('Primary', 'O-Level', 'A-Level', 'University');
CREATE TYPE subject_type AS ENUM ('Core', 'Optional', 'Combination');

-- Create courses table
CREATE TABLE public.courses (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    course_code VARCHAR(20) NOT NULL,
    course_name VARCHAR(255) NOT NULL,
    description TEXT,
    credits INTEGER DEFAULT 0,
    academic_level academic_level NOT NULL DEFAULT 'O-Level',
    status TEXT DEFAULT 'active',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    created_by UUID REFERENCES auth.users(id),
    updated_by UUID REFERENCES auth.users(id),
    UNIQUE(tenant_id, course_code)
);

-- Create subjects table
CREATE TABLE public.subjects (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    subject_name VARCHAR(255) NOT NULL,
    subject_code VARCHAR(20),
    subject_level academic_level NOT NULL DEFAULT 'O-Level',
    subject_type subject_type NOT NULL DEFAULT 'Core',
    description TEXT,
    credits INTEGER DEFAULT 0,
    status TEXT DEFAULT 'active',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    created_by UUID REFERENCES auth.users(id),
    updated_by UUID REFERENCES auth.users(id),
    UNIQUE(tenant_id, subject_name, subject_level)
);

-- Create course-subject relationship table
CREATE TABLE public.course_subjects (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
    subject_id UUID NOT NULL REFERENCES public.subjects(id) ON DELETE CASCADE,
    is_required BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE(tenant_id, course_id, subject_id)
);

-- Create teacher-subject assignment table
CREATE TABLE public.teacher_subjects (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    teacher_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    subject_id UUID NOT NULL REFERENCES public.subjects(id) ON DELETE CASCADE,
    assigned_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    assigned_by UUID REFERENCES public.profiles(id),
    UNIQUE(tenant_id, teacher_id, subject_id)
);

-- Create academic years table
CREATE TABLE public.academic_years (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    year_name VARCHAR(50) NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    is_current BOOLEAN DEFAULT false,
    status TEXT DEFAULT 'active',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    created_by UUID REFERENCES public.profiles(id),
    updated_by UUID REFERENCES public.profiles(id),
    UNIQUE(tenant_id, year_name)
);

-- Enable Row Level Security on all tables
ALTER TABLE public.courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subjects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.course_subjects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.teacher_subjects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.academic_years ENABLE ROW LEVEL SECURITY;

-- RLS Policies for courses
CREATE POLICY "Super admins can view all courses" ON public.courses
    FOR SELECT USING (get_current_user_role() = 'super_admin'::app_role);

CREATE POLICY "Tenant admins can manage their courses" ON public.courses
    FOR ALL USING (
        get_current_user_role() = 'tenant_admin'::app_role 
        AND tenant_id = get_current_user_tenant()
    );

CREATE POLICY "Teachers can view tenant courses" ON public.courses
    FOR SELECT USING (
        get_current_user_role() IN ('teacher'::app_role, 'staff'::app_role) 
        AND tenant_id = get_current_user_tenant()
    );

CREATE POLICY "Students can view tenant courses" ON public.courses
    FOR SELECT USING (
        get_current_user_role() = 'student'::app_role 
        AND tenant_id = get_current_user_tenant()
    );

-- RLS Policies for subjects
CREATE POLICY "Super admins can view all subjects" ON public.subjects
    FOR SELECT USING (get_current_user_role() = 'super_admin'::app_role);

CREATE POLICY "Tenant admins can manage their subjects" ON public.subjects
    FOR ALL USING (
        get_current_user_role() = 'tenant_admin'::app_role 
        AND tenant_id = get_current_user_tenant()
    );

CREATE POLICY "Teachers can view tenant subjects" ON public.subjects
    FOR SELECT USING (
        get_current_user_role() IN ('teacher'::app_role, 'staff'::app_role) 
        AND tenant_id = get_current_user_tenant()
    );

CREATE POLICY "Students can view tenant subjects" ON public.subjects
    FOR SELECT USING (
        get_current_user_role() = 'student'::app_role 
        AND tenant_id = get_current_user_tenant()
    );

-- RLS Policies for course_subjects
CREATE POLICY "Super admins can view all course_subjects" ON public.course_subjects
    FOR SELECT USING (get_current_user_role() = 'super_admin'::app_role);

CREATE POLICY "Tenant admins can manage course_subjects" ON public.course_subjects
    FOR ALL USING (
        get_current_user_role() = 'tenant_admin'::app_role 
        AND tenant_id = get_current_user_tenant()
    );

CREATE POLICY "Users can view tenant course_subjects" ON public.course_subjects
    FOR SELECT USING (tenant_id = get_current_user_tenant());

-- RLS Policies for teacher_subjects
CREATE POLICY "Super admins can view all teacher_subjects" ON public.teacher_subjects
    FOR SELECT USING (get_current_user_role() = 'super_admin'::app_role);

CREATE POLICY "Tenant admins can manage teacher_subjects" ON public.teacher_subjects
    FOR ALL USING (
        get_current_user_role() = 'tenant_admin'::app_role 
        AND tenant_id = get_current_user_tenant()
    );

CREATE POLICY "Teachers can view their assignments" ON public.teacher_subjects
    FOR SELECT USING (
        get_current_user_role() = 'teacher'::app_role 
        AND teacher_id = auth.uid()
    );

-- RLS Policies for academic_years
CREATE POLICY "Super admins can view all academic_years" ON public.academic_years
    FOR SELECT USING (get_current_user_role() = 'super_admin'::app_role);

CREATE POLICY "Tenant admins can manage academic_years" ON public.academic_years
    FOR ALL USING (
        get_current_user_role() = 'tenant_admin'::app_role 
        AND tenant_id = get_current_user_tenant()
    );

CREATE POLICY "Users can view tenant academic_years" ON public.academic_years
    FOR SELECT USING (tenant_id = get_current_user_tenant());

-- Create updated_at triggers
CREATE TRIGGER update_courses_updated_at
    BEFORE UPDATE ON public.courses
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_subjects_updated_at
    BEFORE UPDATE ON public.subjects
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_academic_years_updated_at
    BEFORE UPDATE ON public.academic_years
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- Create indexes for better performance
CREATE INDEX idx_courses_tenant_id ON public.courses(tenant_id);
CREATE INDEX idx_subjects_tenant_id ON public.subjects(tenant_id);
CREATE INDEX idx_course_subjects_tenant_id ON public.course_subjects(tenant_id);
CREATE INDEX idx_teacher_subjects_tenant_id ON public.teacher_subjects(tenant_id);
CREATE INDEX idx_academic_years_tenant_id ON public.academic_years(tenant_id);

CREATE INDEX idx_courses_academic_level ON public.courses(academic_level);
CREATE INDEX idx_subjects_level_type ON public.subjects(subject_level, subject_type);
CREATE INDEX idx_teacher_subjects_teacher_id ON public.teacher_subjects(teacher_id);
CREATE INDEX idx_academic_years_current ON public.academic_years(is_current) WHERE is_current = true;