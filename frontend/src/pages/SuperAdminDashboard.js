import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { api } from '@/App';
import { toast } from 'sonner';
import { Users, BookOpen, FileText, Upload, LogOut, Shield, TrendingUp } from 'lucide-react';
import { motion } from 'framer-motion';

export default function SuperAdminDashboard({ user }) {
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [userFilter, setUserFilter] = useState({ role: '', is_active: null });
  const [pagination, setPagination] = useState({ skip: 0, limit: 50 });
  const [totalUsers, setTotalUsers] = useState(0);

  useEffect(() => {
    if (user?.role !== 'super_admin') {
      toast.error('Access denied. Super admin only.');
      navigate('/');
      return;
    }
    fetchData();
  }, [user, pagination, userFilter]);

  const fetchData = async () => {
    try {
      const [statsRes, usersRes] = await Promise.all([
        api.get('/admin/stats'),
        api.get(`/admin/users?skip=${pagination.skip}&limit=${pagination.limit}${userFilter.role ? `&role=${userFilter.role}` : ''}${userFilter.is_active !== null ? `&is_active=${userFilter.is_active}` : ''}`)
      ]);
      setStats(statsRes.data);
      setUsers(usersRes.data.users);
      setTotalUsers(usersRes.data.total);
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

  const toggleUserStatus = async (userId, currentStatus) => {
    try {
      await api.patch(`/admin/users/${userId}`, {
        is_active: !currentStatus
      });
      toast.success(`User ${!currentStatus ? 'activated' : 'deactivated'}`);
      fetchData();
    } catch (error) {
      toast.error('Failed to update user status');
    }
  };

  const resetPassword = async (userId) => {
    const newPassword = prompt('Enter new password (min 8 characters):');
    if (!newPassword || newPassword.length < 8) {
      toast.error('Password must be at least 8 characters');
      return;
    }

    try {
      await api.patch(`/admin/users/${userId}`, {
        password: newPassword
      });
      toast.success('Password reset successfully');
    } catch (error) {
      toast.error('Failed to reset password');
    }
  };

  const handleBulkUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const subject = prompt('Enter subject name:');
    const className = prompt('Enter class name (e.g., 10th):');
    
    if (!subject || !className) {
      toast.error('Subject and class name are required');
      return;
    }

    const formData = new FormData();
    formData.append('file', file);
    formData.append('subject', subject);
    formData.append('class_name', className);

    try {
      toast.loading('Uploading questions...');
      const response = await api.post('/admin/questions/bulk-upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      toast.success(response.data.message);
      fetchMasterQuestions();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Upload failed');
    }
  };

  const fetchMasterQuestions = async () => {
    try {
      const response = await api.get('/admin/questions/master-bank?limit=100');
      setQuestions(response.data.questions);
    } catch (error) {
      toast.error('Failed to load master questions');
    }
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
          <div className="flex items-center gap-3">
            <Shield className="h-6 w-6 text-indigo-600" />
            <div>
              <h1 className="text-2xl font-heading font-bold text-slate-900">Super Admin Console</h1>
              <p className="text-sm text-slate-600">Welcome, {user?.nickname}</p>
            </div>
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
          {/* Stats Overview */}
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
            <StatCard icon={Users} label="Students" value={stats?.total_students || 0} color="indigo" />
            <StatCard icon={Users} label="Teachers" value={stats?.total_teachers || 0} color="teal" />
            <StatCard icon={BookOpen} label="Tests" value={stats?.total_tests || 0} color="amber" />
            <StatCard icon={FileText} label="Submissions" value={stats?.total_submissions || 0} color="purple" />
            <StatCard icon={TrendingUp} label="Active Users" value={stats?.active_users || 0} color="green" />
            <StatCard icon={BookOpen} label="Question Bank" value={stats?.master_questions || 0} color="rose" />
          </div>

          {/* Main Tabs */}
          <Card className="shadow-lg" data-testid="admin-tabs">
            <CardContent className="pt-6">
              <Tabs defaultValue="users" className="w-full">
                <TabsList className="w-full justify-start flex-wrap h-auto gap-2">
                  <TabsTrigger value="users">User Management</TabsTrigger>
                  <TabsTrigger value="questions">Master Question Bank</TabsTrigger>
                  <TabsTrigger value="upload">Bulk Upload</TabsTrigger>
                </TabsList>

                {/* User Management Tab */}
                <TabsContent value="users" className="space-y-4 mt-6">
                  <div className="flex gap-4 mb-4">
                    <select 
                      className="px-4 py-2 border rounded-lg"
                      value={userFilter.role}
                      onChange={(e) => setUserFilter({ ...userFilter, role: e.target.value })}
                    >
                      <option value="">All Roles</option>
                      <option value="student">Students</option>
                      <option value="teacher">Teachers</option>
                      <option value="parent">Parents</option>
                    </select>
                    <select 
                      className="px-4 py-2 border rounded-lg"
                      value={userFilter.is_active === null ? '' : userFilter.is_active}
                      onChange={(e) => setUserFilter({ ...userFilter, is_active: e.target.value === '' ? null : e.target.value === 'true' })}
                    >
                      <option value="">All Status</option>
                      <option value="true">Active</option>
                      <option value="false">Inactive</option>
                    </select>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full" data-testid="users-table">
                      <thead className="bg-slate-50">
                        <tr>
                          <th className="px-4 py-3 text-left text-sm font-semibold text-slate-900">Name</th>
                          <th className="px-4 py-3 text-left text-sm font-semibold text-slate-900">Email</th>
                          <th className="px-4 py-3 text-left text-sm font-semibold text-slate-900">Role</th>
                          <th className="px-4 py-3 text-left text-sm font-semibold text-slate-900">Status</th>
                          <th className="px-4 py-3 text-left text-sm font-semibold text-slate-900">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {users.map((u) => (
                          <tr key={u.id} className="border-t">
                            <td className="px-4 py-3 text-sm">{u.name}</td>
                            <td className="px-4 py-3 text-sm">{u.email}</td>
                            <td className="px-4 py-3 text-sm">
                              <span className="px-2 py-1 bg-indigo-100 text-indigo-700 rounded-full text-xs">
                                {u.role}
                              </span>
                            </td>
                            <td className="px-4 py-3">
                              <Switch 
                                checked={u.is_active}
                                onCheckedChange={() => toggleUserStatus(u.id, u.is_active)}
                                data-testid={`toggle-${u.id}`}
                              />
                            </td>
                            <td className="px-4 py-3">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => resetPassword(u.id)}
                                data-testid={`reset-pwd-${u.id}`}
                              >
                                Reset Password
                              </Button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  <div className="flex justify-between items-center mt-4">
                    <p className="text-sm text-slate-600">Total: {totalUsers} users</p>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        disabled={pagination.skip === 0}
                        onClick={() => setPagination({ ...pagination, skip: Math.max(0, pagination.skip - pagination.limit) })}
                      >
                        Previous
                      </Button>
                      <Button
                        variant="outline"
                        disabled={pagination.skip + pagination.limit >= totalUsers}
                        onClick={() => setPagination({ ...pagination, skip: pagination.skip + pagination.limit })}
                      >
                        Next
                      </Button>
                    </div>
                  </div>
                </TabsContent>

                {/* Master Question Bank Tab */}
                <TabsContent value="questions" className="space-y-4 mt-6">
                  <Button onClick={fetchMasterQuestions} data-testid="load-questions-btn">
                    Load Questions
                  </Button>
                  
                  {questions.length > 0 ? (
                    <div className="space-y-3">
                      {questions.map((q) => (
                        <div key={q.id} className="p-4 bg-slate-50 rounded-lg border">
                          <div className="flex justify-between items-start">
                            <div className="flex-1">
                              <p className="font-semibold text-slate-900">{q.question_text}</p>
                              <div className="flex gap-2 mt-2">
                                <span className="px-2 py-1 bg-indigo-100 text-indigo-700 rounded text-xs">
                                  {q.subject}
                                </span>
                                <span className="px-2 py-1 bg-teal-100 text-teal-700 rounded text-xs">
                                  {q.class_name}
                                </span>
                                <span className="px-2 py-1 bg-amber-100 text-amber-700 rounded text-xs">
                                  {q.difficulty}
                                </span>
                              </div>
                            </div>
                            <span className="text-sm font-semibold text-slate-700">{q.marks} marks</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-center text-slate-500 py-8">Click "Load Questions" to view master bank</p>
                  )}
                </TabsContent>

                {/* Bulk Upload Tab */}
                <TabsContent value="upload" className="space-y-4 mt-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>Bulk Upload Questions</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <Label>Upload CSV or Excel File</Label>
                        <p className="text-sm text-slate-600 mb-3">
                          Required columns: question_text, question_type, correct_answer, marks, difficulty (optional), options (for MCQ)
                        </p>
                        <Input
                          type="file"
                          accept=".csv,.xlsx,.xls"
                          onChange={handleBulkUpload}
                          data-testid="bulk-upload-input"
                        />
                      </div>
                      
                      <div className="p-4 bg-slate-50 rounded-lg">
                        <h4 className="font-semibold mb-2">Sample CSV Format:</h4>
                        <pre className="text-xs bg-white p-3 rounded border overflow-x-auto">
{`question_text,question_type,correct_answer,marks,difficulty,options
"What is 2+2?",mcq,4,2,easy,"[2,3,4,5]"
"Explain photosynthesis",short,"Process of converting light to energy",5,medium,`}
                        </pre>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

function StatCard({ icon: Icon, label, value, color }) {
  const colorClasses = {
    indigo: 'bg-indigo-100 text-indigo-600',
    teal: 'bg-teal-100 text-teal-600',
    amber: 'bg-amber-100 text-amber-600',
    purple: 'bg-purple-100 text-purple-600',
    green: 'bg-green-100 text-green-600',
    rose: 'bg-rose-100 text-rose-600'
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-2xl border border-slate-100 p-4 shadow-sm"
    >
      <div className={`w-10 h-10 rounded-lg ${colorClasses[color]} flex items-center justify-center mb-2`}>
        <Icon className="h-5 w-5" />
      </div>
      <p className="text-xs text-slate-600 mb-1">{label}</p>
      <p className="text-2xl font-heading font-bold text-slate-900">{value}</p>
    </motion.div>
  );
}