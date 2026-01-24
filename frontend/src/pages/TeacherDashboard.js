import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { api } from '@/App';
import { toast } from 'sonner';
import { Plus, BookOpen, LogOut, Users } from 'lucide-react';
import { motion } from 'framer-motion';

export default function TeacherDashboard({ user }) {
  const navigate = useNavigate();
  const [tests, setTests] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [testsRes, subjectsRes] = await Promise.all([
        api.get('/tests'),
        api.get('/subjects')
      ]);
      setTests(testsRes.data);
      setSubjects(subjectsRes.data);
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

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  const myTests = tests.filter(t => t.created_by === user?.id);

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-teal-50">
      <nav className="bg-white border-b border-slate-200">
        <div className="px-4 md:px-8 py-4 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-heading font-bold text-slate-900">Teacher Dashboard</h1>
            <p className="text-sm text-slate-600">Welcome, {user?.nickname}</p>
          </div>
          <Button 
            variant="ghost" 
            onClick={handleLogout}
            data-testid="logout-btn"
          >
            <LogOut className="h-4 w-4 mr-2" />
            Logout
          </Button>
        </div>
      </nav>

      <div className="px-4 md:px-8 py-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm"
              data-testid="my-tests-card"
            >
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-lg bg-indigo-100 flex items-center justify-center">
                  <BookOpen className="h-5 w-5 text-indigo-600" />
                </div>
                <span className="text-sm text-slate-600">My Tests</span>
              </div>
              <p className="text-3xl font-heading font-bold text-slate-900">{myTests.length}</p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm"
            >
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-lg bg-teal-100 flex items-center justify-center">
                  <BookOpen className="h-5 w-5 text-teal-600" />
                </div>
                <span className="text-sm text-slate-600">Subjects</span>
              </div>
              <p className="text-3xl font-heading font-bold text-slate-900">{subjects.length}</p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm"
            >
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-lg bg-amber-100 flex items-center justify-center">
                  <Users className="h-5 w-5 text-amber-600" />
                </div>
                <span className="text-sm text-slate-600">School</span>
              </div>
              <p className="text-lg font-heading font-bold text-slate-900">{user?.school || 'N/A'}</p>
            </motion.div>
          </div>

          <Card className="shadow-lg mb-6" data-testid="quick-actions-card">
            <CardHeader>
              <CardTitle className="text-2xl font-heading font-bold">Quick Actions</CardTitle>
            </CardHeader>
            <CardContent>
              <Button 
                onClick={() => navigate('/teacher/create-test')}
                data-testid="create-test-btn"
                className="rounded-full px-8 py-6 font-semibold shadow-lg shadow-indigo-500/20 hover:shadow-indigo-500/40 transition-all active:scale-95"
              >
                <Plus className="h-5 w-5 mr-2" />
                Create New Test
              </Button>
            </CardContent>
          </Card>

          <Card className="shadow-lg" data-testid="my-tests-section">
            <CardHeader>
              <CardTitle className="text-2xl font-heading font-bold">My Tests</CardTitle>
            </CardHeader>
            <CardContent>
              {myTests.length === 0 ? (
                <p className="text-center text-slate-500 py-8">You haven't created any tests yet</p>
              ) : (
                <div className="space-y-4">
                  {myTests.map((test) => (
                    <motion.div
                      key={test.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="flex items-center justify-between p-4 bg-slate-50 rounded-lg"
                      data-testid={`test-item-${test.id}`}
                    >
                      <div>
                        <h3 className="font-heading font-semibold text-slate-900">{test.title}</h3>
                        <p className="text-sm text-slate-600">
                          {test.test_type.replace('_', ' ')} • {test.class_name} • {test.questions.length} questions
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-semibold text-slate-900">{test.total_marks} marks</p>
                        <p className="text-sm text-slate-600">{test.duration_minutes} min</p>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}