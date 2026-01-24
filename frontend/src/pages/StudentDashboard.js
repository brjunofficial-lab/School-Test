import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { api } from '@/App';
import { toast } from 'sonner';
import { BookOpen, Clock, FileText, TrendingUp, LogOut } from 'lucide-react';
import { motion } from 'framer-motion';

export default function StudentDashboard({ user }) {
  const navigate = useNavigate();
  const [tests, setTests] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, [user]);

  const fetchData = async () => {
    try {
      const [testsRes, analyticsRes] = await Promise.all([
        api.get(`/tests?class_name=${user?.class_name || ''}`),
        api.get(`/analytics/student/${user?.id}`)
      ]);
      setTests(testsRes.data);
      setAnalytics(analyticsRes.data);
    } catch (error) {
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('userRole');
    navigate('/login');
  };

  const testsByType = {
    chapter: tests.filter(t => t.test_type === 'chapter'),
    syllabus: tests.filter(t => t.test_type === 'syllabus'),
    weekly: tests.filter(t => t.test_type === 'weekly'),
    quarterly: tests.filter(t => t.test_type === 'quarterly'),
    half_yearly: tests.filter(t => t.test_type === 'half_yearly'),
    yearly: tests.filter(t => t.test_type === 'yearly'),
    monthly_special: tests.filter(t => t.test_type === 'monthly_special'),
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-teal-50">
      <nav className="bg-white border-b border-slate-200">
        <div className="px-4 md:px-8 py-4 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-heading font-bold text-slate-900">Welcome, {user?.nickname}!</h1>
            <p className="text-sm text-slate-600">Student Code: {user?.student_code}</p>
          </div>
          <div className="flex gap-3">
            <Button 
              variant="ghost" 
              onClick={() => navigate('/student/results')}
              data-testid="view-results-btn"
            >
              <FileText className="h-4 w-4 mr-2" />
              My Results
            </Button>
            <Button 
              variant="ghost" 
              onClick={handleLogout}
              data-testid="logout-btn"
            >
              <LogOut className="h-4 w-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>
      </nav>

      <div className="px-4 md:px-8 py-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm"
              data-testid="total-tests-card"
            >
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-lg bg-indigo-100 flex items-center justify-center">
                  <BookOpen className="h-5 w-5 text-indigo-600" />
                </div>
                <span className="text-sm text-slate-600">Total Tests</span>
              </div>
              <p className="text-3xl font-heading font-bold text-slate-900">{analytics?.total_tests || 0}</p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm"
              data-testid="average-score-card"
            >
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-lg bg-teal-100 flex items-center justify-center">
                  <TrendingUp className="h-5 w-5 text-teal-600" />
                </div>
                <span className="text-sm text-slate-600">Average Score</span>
              </div>
              <p className="text-3xl font-heading font-bold text-slate-900">{analytics?.average_score?.toFixed(1) || 0}%</p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm"
            >
              <div className="flex items-center gap-3 mb-2">
                <span className="text-sm text-slate-600">Class</span>
              </div>
              <p className="text-3xl font-heading font-bold text-slate-900">{user?.class_name || 'N/A'}</p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm"
            >
              <div className="flex items-center gap-3 mb-2">
                <span className="text-sm text-slate-600">Section</span>
              </div>
              <p className="text-3xl font-heading font-bold text-slate-900">{user?.section || 'N/A'}</p>
            </motion.div>
          </div>

          <Card className="shadow-lg" data-testid="tests-section">
            <CardHeader>
              <CardTitle className="text-2xl font-heading font-bold">Available Tests</CardTitle>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="all" className="w-full">
                <TabsList className="w-full justify-start flex-wrap h-auto gap-2">
                  <TabsTrigger value="all">All Tests</TabsTrigger>
                  <TabsTrigger value="chapter">Chapter-wise</TabsTrigger>
                  <TabsTrigger value="syllabus">Syllabus-based</TabsTrigger>
                  <TabsTrigger value="weekly">Weekly</TabsTrigger>
                  <TabsTrigger value="quarterly">Quarterly</TabsTrigger>
                  <TabsTrigger value="half_yearly">Half-yearly</TabsTrigger>
                  <TabsTrigger value="yearly">Yearly</TabsTrigger>
                  <TabsTrigger value="monthly_special">Monthly Special</TabsTrigger>
                </TabsList>

                <TabsContent value="all" className="space-y-4 mt-6">
                  {tests.length === 0 ? (
                    <p className="text-center text-slate-500 py-8">No tests available</p>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {tests.map((test, idx) => (
                        <TestCard key={test.id} test={test} navigate={navigate} />
                      ))}
                    </div>
                  )}
                </TabsContent>

                {Object.entries(testsByType).map(([type, typeTests]) => (
                  <TabsContent key={type} value={type} className="space-y-4 mt-6">
                    {typeTests.length === 0 ? (
                      <p className="text-center text-slate-500 py-8">No {type.replace('_', ' ')} tests available</p>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {typeTests.map((test) => (
                          <TestCard key={test.id} test={test} navigate={navigate} />
                        ))}
                      </div>
                    )}
                  </TabsContent>
                ))}
              </Tabs>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

function TestCard({ test, navigate }) {
  return (
    <motion.div
      whileHover={{ y: -4 }}
      className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm hover:shadow-md transition-all cursor-pointer"
      onClick={() => navigate(`/student/test/${test.id}`)}
      data-testid={`test-card-${test.id}`}
    >
      <div className="flex items-start justify-between mb-3">
        <h3 className="font-heading font-semibold text-lg text-slate-900 line-clamp-2">{test.title}</h3>
        <span className="px-3 py-1 bg-indigo-100 text-indigo-700 text-xs font-semibold rounded-full">
          {test.test_type.replace('_', ' ')}
        </span>
      </div>
      <div className="flex items-center gap-4 text-sm text-slate-600">
        <div className="flex items-center gap-1">
          <Clock className="h-4 w-4" />
          <span>{test.duration_minutes} min</span>
        </div>
        <div className="flex items-center gap-1">
          <FileText className="h-4 w-4" />
          <span>{test.questions.length} questions</span>
        </div>
      </div>
      <div className="mt-4 pt-4 border-t border-slate-100">
        <div className="flex justify-between items-center">
          <span className="text-sm text-slate-600">Total Marks</span>
          <span className="font-heading font-bold text-slate-900">{test.total_marks}</span>
        </div>
      </div>
      <Button className="w-full mt-4 rounded-full" data-testid={`start-test-${test.id}`}>
        Start Test
      </Button>
    </motion.div>
  );
}