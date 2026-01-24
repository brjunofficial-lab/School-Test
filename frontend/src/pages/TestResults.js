import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { api } from '@/App';
import { toast } from 'sonner';
import { ArrowLeft, FileText, CheckCircle, XCircle } from 'lucide-react';
import { motion } from 'framer-motion';

export default function TestResults({ user }) {
  const navigate = useNavigate();
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchResults();
  }, [user]);

  const fetchResults = async () => {
    try {
      const response = await api.get(`/results/student/${user?.id}`);
      setResults(response.data);
    } catch (error) {
      toast.error('Failed to load results');
    } finally {
      setLoading(false);
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
          <Button 
            variant="ghost" 
            onClick={() => navigate('/student/dashboard')}
            data-testid="back-btn"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Button>
        </div>
      </nav>

      <div className="px-4 md:px-8 py-8">
        <div className="max-w-6xl mx-auto">
          <Card className="shadow-lg" data-testid="results-card">
            <CardHeader>
              <CardTitle className="text-2xl font-heading font-bold">My Test Results</CardTitle>
            </CardHeader>
            <CardContent>
              {results.length === 0 ? (
                <p className="text-center text-slate-500 py-8">No test results yet</p>
              ) : (
                <div className="space-y-4">
                  {results.map((result, idx) => (
                    <ResultCard key={result.id} result={result} index={idx} />
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

function ResultCard({ result, index }) {
  const [expanded, setExpanded] = useState(false);
  const percentage = (result.total_score / result.max_score) * 100;
  const passed = percentage >= 40;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm hover:shadow-md transition-all"
      data-testid={`result-card-${result.id}`}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <h3 className="font-heading font-semibold text-lg text-slate-900">
              Test ID: {result.test_id.slice(0, 8)}
            </h3>
            {passed ? (
              <span className="px-3 py-1 bg-teal-100 text-teal-700 text-xs font-semibold rounded-full flex items-center gap-1">
                <CheckCircle className="h-3 w-3" />
                Passed
              </span>
            ) : (
              <span className="px-3 py-1 bg-red-100 text-red-700 text-xs font-semibold rounded-full flex items-center gap-1">
                <XCircle className="h-3 w-3" />
                Failed
              </span>
            )}
          </div>
          <p className="text-sm text-slate-600">
            Submitted: {new Date(result.submitted_at).toLocaleString()}
          </p>
        </div>

        <div className="text-right">
          <div className="text-3xl font-heading font-bold text-slate-900 mb-1">
            {result.total_score.toFixed(1)}
            <span className="text-lg text-slate-600">/{result.max_score}</span>
          </div>
          <p className="text-sm font-semibold" style={{ color: passed ? '#0D9488' : '#EF4444' }}>
            {percentage.toFixed(1)}%
          </p>
        </div>
      </div>

      <div className="mt-4 pt-4 border-t border-slate-200">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setExpanded(!expanded)}
          data-testid={`toggle-details-${result.id}`}
          className="text-indigo-600 hover:text-indigo-700"
        >
          {expanded ? 'Hide Details' : 'View Details'}
        </Button>
      </div>

      {expanded && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          className="mt-4 pt-4 border-t border-slate-200"
        >
          <h4 className="font-heading font-semibold text-slate-900 mb-3">Answer Details</h4>
          <div className="space-y-3">
            {result.answers.map((answer, idx) => (
              <div key={idx} className="bg-slate-50 rounded-lg p-4">
                <p className="text-sm font-semibold text-slate-900 mb-2">Question {idx + 1}</p>
                {answer.selected_option && (
                  <p className="text-sm text-slate-700">
                    <span className="font-medium">Selected:</span> {answer.selected_option}
                  </p>
                )}
                {answer.answer_text && (
                  <p className="text-sm text-slate-700">
                    <span className="font-medium">Answer:</span> {answer.answer_text}
                  </p>
                )}
                {answer.ocr_text && (
                  <div className="mt-2">
                    <p className="text-xs font-medium text-teal-600 mb-1">OCR Extracted Text:</p>
                    <p className="text-sm text-slate-600 bg-teal-50 p-2 rounded">{answer.ocr_text}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </motion.div>
      )}
    </motion.div>
  );
}