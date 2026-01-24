import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { GraduationCap, Users, BookOpen, TrendingUp, CheckCircle } from 'lucide-react';
import { motion } from 'framer-motion';

export default function Landing({ user }) {
  const navigate = useNavigate();

  const handleGetStarted = () => {
    if (user) {
      if (user.role === 'student') navigate('/student/dashboard');
      else if (user.role === 'parent') navigate('/parent/dashboard');
      else if (user.role === 'teacher') navigate('/teacher/dashboard');
    } else {
      navigate('/signup');
    }
  };

  const features = [
    { icon: BookOpen, title: 'Multiple Test Types', desc: 'MCQ, Fill-in-blanks, Short & Long answers' },
    { icon: Users, title: 'Multi-Role Platform', desc: 'For Students, Parents, and Teachers' },
    { icon: TrendingUp, title: 'Performance Tracking', desc: 'Rankings and detailed analytics' },
    { icon: CheckCircle, title: 'AI Evaluation', desc: 'Smart handwriting recognition & grading' },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-teal-50">
      <nav className="px-4 md:px-8 lg:px-12 py-6">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-2">
            <GraduationCap className="h-8 w-8 text-indigo-600" />
            <span className="text-2xl font-heading font-bold tracking-tight text-slate-900">ExamPrep</span>
          </div>
          <div className="flex gap-3">
            {!user && (
              <>
                <Button 
                  variant="ghost" 
                  onClick={() => navigate('/login')}
                  data-testid="login-btn"
                  className="rounded-full"
                >
                  Login
                </Button>
                <Button 
                  onClick={() => navigate('/signup')}
                  data-testid="signup-btn"
                  className="rounded-full px-8 py-3 font-semibold shadow-lg shadow-indigo-500/20 hover:shadow-indigo-500/40 transition-all active:scale-95"
                >
                  Sign Up
                </Button>
              </>
            )}
            {user && (
              <Button 
                onClick={handleGetStarted}
                data-testid="dashboard-btn"
                className="rounded-full px-8 py-3 font-semibold shadow-lg shadow-indigo-500/20 hover:shadow-indigo-500/40 transition-all active:scale-95"
              >
                Go to Dashboard
              </Button>
            )}
          </div>
        </div>
      </nav>

      <section className="px-4 md:px-8 lg:px-12 py-20">
        <div className="max-w-7xl mx-auto">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-heading font-bold tracking-tight text-slate-900 mb-6">
              Master Your Exams with
              <span className="block text-indigo-600 mt-2">Smart Practice</span>
            </h1>
            <p className="text-lg text-slate-600 max-w-2xl mx-auto mb-8">
              Complete examination platform with AI-powered evaluation, handwriting recognition, and comprehensive performance tracking.
            </p>
            <Button 
              onClick={handleGetStarted}
              data-testid="get-started-btn"
              className="rounded-full px-12 py-6 text-lg font-semibold shadow-lg shadow-indigo-500/20 hover:shadow-indigo-500/40 transition-all active:scale-95"
            >
              Get Started
            </Button>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mt-20">
            {features.map((feature, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: idx * 0.1 }}
                className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm hover:shadow-md transition-all duration-300"
                data-testid={`feature-card-${idx}`}
              >
                <div className="w-12 h-12 rounded-xl bg-indigo-100 flex items-center justify-center mb-4">
                  <feature.icon className="h-6 w-6 text-indigo-600" />
                </div>
                <h3 className="text-lg font-heading font-semibold text-slate-900 mb-2">{feature.title}</h3>
                <p className="text-sm text-slate-600">{feature.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <section className="px-4 md:px-8 lg:px-12 py-20 bg-white/50">
        <div className="max-w-5xl mx-auto text-center">
          <h2 className="text-3xl sm:text-4xl font-heading font-bold tracking-tight text-slate-900 mb-6">
            Who is this for?
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-12">
            <div className="p-8 bg-white rounded-2xl border border-slate-100 shadow-sm">
              <div className="w-16 h-16 mx-auto rounded-full bg-indigo-100 flex items-center justify-center mb-4">
                <GraduationCap className="h-8 w-8 text-indigo-600" />
              </div>
              <h3 className="text-xl font-heading font-bold text-slate-900 mb-3">Students</h3>
              <p className="text-slate-600">Take tests, upload handwritten answers, track your performance</p>
            </div>
            <div className="p-8 bg-white rounded-2xl border border-slate-100 shadow-sm">
              <div className="w-16 h-16 mx-auto rounded-full bg-teal-100 flex items-center justify-center mb-4">
                <Users className="h-8 w-8 text-teal-600" />
              </div>
              <h3 className="text-xl font-heading font-bold text-slate-900 mb-3">Parents</h3>
              <p className="text-slate-600">Monitor your child's progress, view detailed reports and rankings</p>
            </div>
            <div className="p-8 bg-white rounded-2xl border border-slate-100 shadow-sm">
              <div className="w-16 h-16 mx-auto rounded-full bg-amber-100 flex items-center justify-center mb-4">
                <BookOpen className="h-8 w-8 text-amber-600" />
              </div>
              <h3 className="text-xl font-heading font-bold text-slate-900 mb-3">Teachers</h3>
              <p className="text-slate-600">Create tests, grade submissions, manage multiple classes</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}