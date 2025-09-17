import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  Users, 
  GraduationCap, 
  BookOpen, 
  DollarSign, 
  UserCheck, 
  Calendar,
  TrendingUp,
  AlertCircle,
  CheckCircle,
  Clock
} from "lucide-react";

const Dashboard = () => {
  const stats = [
    {
      title: "Total Students",
      value: "2,847",
      change: "+12%",
      icon: <Users className="h-6 w-6" />,
      trend: "up"
    },
    {
      title: "Active Teachers",
      value: "156",
      change: "+3%",
      icon: <GraduationCap className="h-6 w-6" />,
      trend: "up"
    },
    {
      title: "Courses",
      value: "89",
      change: "+5%",
      icon: <BookOpen className="h-6 w-6" />,
      trend: "up"
    },
    {
      title: "Fee Collection",
      value: "$1.2M",
      change: "+8%",
      icon: <DollarSign className="h-6 w-6" />,
      trend: "up"
    }
  ];

  const recentActivities = [
    {
      action: "New student enrollment",
      user: "Sarah Johnson",
      time: "2 minutes ago",
      type: "success"
    },
    {
      action: "Grade submission",
      user: "Dr. Michael Brown",
      time: "15 minutes ago",
      type: "info"
    },
    {
      action: "Fee payment received",
      user: "Parent Portal",
      time: "1 hour ago",
      type: "success"
    },
    {
      action: "Attendance marked",
      user: "Class 10A",
      time: "2 hours ago",
      type: "info"
    }
  ];

  const alerts = [
    {
      message: "5 students have overdue fees",
      type: "warning",
      priority: "high"
    },
    {
      message: "Library book return reminder needed",
      type: "info",
      priority: "medium"
    },
    {
      message: "Exam schedule published successfully",
      type: "success",
      priority: "low"
    }
  ];

  return (
    <section className="py-24 bg-muted/30">
      <div className="container mx-auto px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-6">
            <span className="text-gradient">Intelligent</span> Dashboard Overview
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Get real-time insights into your school's performance with comprehensive 
            analytics and actionable data visualizations.
          </p>
        </div>

        {/* Dashboard Preview */}
        <div className="max-w-7xl mx-auto">
          {/* Header Bar */}
          <div className="bg-card rounded-t-xl border-b p-6 flex items-center justify-between">
            <div>
              <h3 className="text-2xl font-bold">Greenwood High School</h3>
              <p className="text-muted-foreground">Academic Year 2024-25</p>
            </div>
            <Badge variant="secondary" className="text-sm px-4 py-2">
              <UserCheck className="h-4 w-4 mr-2" />
              Admin Dashboard
            </Badge>
          </div>

          {/* Stats Grid */}
          <div className="bg-card border-b p-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {stats.map((stat, index) => (
                <div key={index} className="bg-background rounded-lg p-6 shadow-soft">
                  <div className="flex items-center justify-between">
                    <div className="text-education-blue">
                      {stat.icon}
                    </div>
                    <Badge variant={stat.trend === 'up' ? 'default' : 'secondary'} className="text-xs">
                      <TrendingUp className="h-3 w-3 mr-1" />
                      {stat.change}
                    </Badge>
                  </div>
                  <div className="mt-4">
                    <div className="text-2xl font-bold">{stat.value}</div>
                    <div className="text-sm text-muted-foreground">{stat.title}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Main Content Area */}
          <div className="bg-card rounded-b-xl p-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Recent Activities */}
              <Card className="lg:col-span-2">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Clock className="h-5 w-5" />
                    Recent Activities
                  </CardTitle>
                  <CardDescription>
                    Latest actions across your school system
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {recentActivities.map((activity, index) => (
                      <div key={index} className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                        <div className={`w-2 h-2 rounded-full ${
                          activity.type === 'success' ? 'bg-education-green' : 'bg-education-blue'
                        }`} />
                        <div className="flex-1">
                          <div className="font-medium">{activity.action}</div>
                          <div className="text-sm text-muted-foreground">by {activity.user}</div>
                        </div>
                        <div className="text-xs text-muted-foreground">{activity.time}</div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Alerts & Notifications */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <AlertCircle className="h-5 w-5" />
                    Alerts
                  </CardTitle>
                  <CardDescription>
                    Important notifications requiring attention
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {alerts.map((alert, index) => (
                      <div key={index} className="p-3 rounded-lg border">
                        <div className="flex items-start gap-2">
                          <div className={`mt-0.5 ${
                            alert.type === 'warning' ? 'text-education-orange' :
                            alert.type === 'success' ? 'text-education-green' : 'text-education-blue'
                          }`}>
                            {alert.type === 'warning' ? <AlertCircle className="h-4 w-4" /> :
                             alert.type === 'success' ? <CheckCircle className="h-4 w-4" /> :
                             <Clock className="h-4 w-4" />}
                          </div>
                          <div className="flex-1">
                            <div className="text-sm font-medium">{alert.message}</div>
                            <Badge variant="outline" className="text-xs mt-1">
                              {alert.priority} priority
                            </Badge>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Bottom Action Bar */}
            <div className="mt-6 flex flex-wrap gap-3">
              <Button className="gradient-primary">
                <Calendar className="mr-2 h-4 w-4" />
                Schedule Event
              </Button>
              <Button variant="outline">
                <Users className="mr-2 h-4 w-4" />
                Add Student
              </Button>
              <Button variant="outline">
                <BookOpen className="mr-2 h-4 w-4" />
                Create Course
              </Button>
              <Button variant="outline">
                <TrendingUp className="mr-2 h-4 w-4" />
                View Reports
              </Button>
            </div>
          </div>
        </div>

        {/* CTA */}
        <div className="text-center mt-16">
          <p className="text-lg text-muted-foreground mb-6">
            Experience the power of comprehensive school management
          </p>
          <Button size="lg" className="gradient-primary px-8 py-6 text-lg">
            Try Interactive Demo
          </Button>
        </div>
      </div>
    </section>
  );
};

export default Dashboard;