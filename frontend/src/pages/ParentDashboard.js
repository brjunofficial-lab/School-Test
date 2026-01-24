import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { api } from '@/App';
import { toast } from 'sonner';
import { Users, TrendingUp, BookOpen, LogOut, Award } from 'lucide-react';
import { motion } from 'framer-motion';

export default function ParentDashboard({ user }) {
  const navigate = useNavigate();
  const [analytics, setAnalytics] = useState(null);
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, [user]);

  const fetchData = async () => {
    try {
      const [analyticsRes, resultsRes] = await Promise.all([
        api.get(`/analytics/student/${user?.id}`),
        api.get(`/results/student/${user?.id}`)
      ]);
      setAnalytics(analyticsRes.data);
      setResults(resultsRes.data);
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-teal-50">
      <nav className="bg-white border-b border-slate-200">
        <div className="px-4 md:px-8 py-4 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-heading font-bold text-slate-900">Parent Dashboard</h1>
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
                <div className="w-10 h-10 rounded-lg bg-amber-100 flex items-center justify-center">
                  <Award className="h-5 w-5 text-amber-600" />
                </div>
                <span className="text-sm text-slate-600">School Rank</span>
              </div>
              <p className="text-3xl font-heading font-bold text-slate-900">N/A</p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm"
            >
              <div className="flex items-center gap-3 mb-2">
                <span className="text-sm text-slate-600">State Rank</span>
              </div>
              <p className="text-3xl font-heading font-bold text-slate-900">N/A</p>
            </motion.div>
          </div>

          <Card className="shadow-lg" data-testid="recent-results-card">
            <CardHeader>
              <CardTitle className="text-2xl font-heading font-bold">Recent Test Results</CardTitle>
            </CardHeader>
            <CardContent>
              {results.length === 0 ? (
                <p className="text-center text-slate-500 py-8">No test results yet</p>
              ) : (
                <div className="space-y-4">
                  {results.slice(0, 10).map((result) => (
                    <motion.div
                      key={result.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="flex items-center justify-between p-4 bg-slate-50 rounded-lg"
                      data-testid={`result-item-${result.id}`}
                    >
                      <div>
                        <p className="font-semibold text-slate-900">Test ID: {result.test_id.slice(0, 8)}</p>
                        <p className="text-sm text-slate-600">
                          {new Date(result.submitted_at).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-heading font-bold text-slate-900">
                          {result.total_score.toFixed(1)}/{result.max_score}
                        </p>
                        <p className="text-sm text-slate-600">
                          {((result.total_score / result.max_score) * 100).toFixed(1)}%
                        </p>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="shadow-lg mt-6">
            <CardHeader>
              <CardTitle className="text-2xl font-heading font-bold">Child Information</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-slate-600">Name</p>
                  <p className="font-semibold text-slate-900">{user?.name}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-600">Nickname</p>
                  <p className="font-semibold text-slate-900">{user?.nickname}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-600">Class</p>
                  <p className="font-semibold text-slate-900">{user?.class_name || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-600">Section</p>
                  <p className="font-semibold text-slate-900">{user?.section || 'N/A'}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}