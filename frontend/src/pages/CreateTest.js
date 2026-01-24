import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { api } from '@/App';
import { toast } from 'sonner';
import { Plus, Trash2, ArrowLeft } from 'lucide-react';
import { motion } from 'framer-motion';

export default function CreateTest({ user }) {
  const navigate = useNavigate();
  const [subjects, setSubjects] = useState([]);
  const [formData, setFormData] = useState({
    title: '',
    subject_id: '',
    class_name: '',
    test_type: 'chapter',
    duration_minutes: 60,
    total_marks: 0,
    questions: []
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchSubjects();
  }, []);

  const fetchSubjects = async () => {
    try {
      const response = await api.get('/subjects');
      setSubjects(response.data);
    } catch (error) {
      toast.error('Failed to load subjects');
    }
  };

  const addQuestion = () => {
    setFormData({
      ...formData,
      questions: [
        ...formData.questions,
        {
          question_text: '',
          question_type: 'mcq',
          options: ['', '', '', ''],
          correct_answer: '',
          marks: 1,
          match_pairs: {}
        }
      ]
    });
  };

  const removeQuestion = (index) => {
    const newQuestions = formData.questions.filter((_, i) => i !== index);
    setFormData({ ...formData, questions: newQuestions });
  };

  const updateQuestion = (index, field, value) => {
    const newQuestions = [...formData.questions];
    newQuestions[index] = { ...newQuestions[index], [field]: value };
    setFormData({ ...formData, questions: newQuestions });
  };

  const updateOption = (qIndex, optIndex, value) => {
    const newQuestions = [...formData.questions];
    const newOptions = [...newQuestions[qIndex].options];
    newOptions[optIndex] = value;
    newQuestions[qIndex] = { ...newQuestions[qIndex], options: newOptions };
    setFormData({ ...formData, questions: newQuestions });
  };

  const calculateTotalMarks = () => {
    return formData.questions.reduce((sum, q) => sum + (parseInt(q.marks) || 0), 0);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (formData.questions.length === 0) {
      toast.error('Please add at least one question');
      return;
    }

    const totalMarks = calculateTotalMarks();
    setLoading(true);

    try {
      await api.post('/tests', {
        ...formData,
        total_marks: totalMarks
      });
      toast.success('Test created successfully!');
      navigate('/teacher/dashboard');
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to create test');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-teal-50">
      <nav className="bg-white border-b border-slate-200">
        <div className="px-4 md:px-8 py-4 flex justify-between items-center">
          <Button 
            variant="ghost" 
            onClick={() => navigate('/teacher/dashboard')}
            data-testid="back-btn"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Button>
        </div>
      </nav>

      <div className="px-4 md:px-8 py-8">
        <div className="max-w-4xl mx-auto">
          <Card className="shadow-lg mb-6" data-testid="test-details-card">
            <CardHeader>
              <CardTitle className="text-2xl font-heading font-bold">Create New Test</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="title">Test Title</Label>
                    <Input
                      id="title"
                      placeholder="Enter test title"
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      required
                      data-testid="title-input"
                      className="rounded-lg"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="class_name">Class</Label>
                    <Input
                      id="class_name"
                      placeholder="e.g., 10th"
                      value={formData.class_name}
                      onChange={(e) => setFormData({ ...formData, class_name: e.target.value })}
                      required
                      data-testid="class-input"
                      className="rounded-lg"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="test_type">Test Type</Label>
                    <Select 
                      value={formData.test_type} 
                      onValueChange={(value) => setFormData({ ...formData, test_type: value })}
                    >
                      <SelectTrigger data-testid="test-type-select" className="rounded-lg">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="chapter">Chapter-wise</SelectItem>
                        <SelectItem value="syllabus">Syllabus-based</SelectItem>
                        <SelectItem value="weekly">Weekly</SelectItem>
                        <SelectItem value="quarterly">Quarterly</SelectItem>
                        <SelectItem value="half_yearly">Half-yearly</SelectItem>
                        <SelectItem value="yearly">Yearly</SelectItem>
                        <SelectItem value="monthly_special">Monthly Special</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="duration">Duration (minutes)</Label>
                    <Input
                      id="duration"
                      type="number"
                      min="1"
                      value={formData.duration_minutes}
                      onChange={(e) => setFormData({ ...formData, duration_minutes: parseInt(e.target.value) })}
                      required
                      data-testid="duration-input"
                      className="rounded-lg"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="subject">Subject (Optional)</Label>
                  <Select 
                    value={formData.subject_id} 
                    onValueChange={(value) => setFormData({ ...formData, subject_id: value })}
                  >
                    <SelectTrigger className="rounded-lg">
                      <SelectValue placeholder="Select a subject" />
                    </SelectTrigger>
                    <SelectContent>
                      {subjects.map((subject) => (
                        <SelectItem key={subject.id} value={subject.id}>
                          {subject.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="border-t pt-6">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-xl font-heading font-bold text-slate-900">Questions</h3>
                    <Button
                      type="button"
                      onClick={addQuestion}
                      data-testid="add-question-btn"
                      className="rounded-full"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Add Question
                    </Button>
                  </div>

                  {formData.questions.length === 0 ? (
                    <p className="text-center text-slate-500 py-8">No questions added yet</p>
                  ) : (
                    <div className="space-y-6">
                      {formData.questions.map((question, qIndex) => (
                        <motion.div
                          key={qIndex}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="bg-slate-50 rounded-lg p-6 border border-slate-200"
                          data-testid={`question-${qIndex}`}
                        >
                          <div className="flex justify-between items-start mb-4">
                            <h4 className="font-heading font-semibold text-slate-900">Question {qIndex + 1}</h4>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => removeQuestion(qIndex)}
                              data-testid={`remove-question-${qIndex}`}
                            >
                              <Trash2 className="h-4 w-4 text-red-600" />
                            </Button>
                          </div>

                          <div className="space-y-4">
                            <div className="space-y-2">
                              <Label>Question Text</Label>
                              <Textarea
                                placeholder="Enter question"
                                value={question.question_text}
                                onChange={(e) => updateQuestion(qIndex, 'question_text', e.target.value)}
                                required
                                className="rounded-lg"
                              />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                              <div className="space-y-2">
                                <Label>Question Type</Label>
                                <Select 
                                  value={question.question_type} 
                                  onValueChange={(value) => updateQuestion(qIndex, 'question_type', value)}
                                >
                                  <SelectTrigger className="rounded-lg">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="mcq">MCQ</SelectItem>
                                    <SelectItem value="fill_blank">Fill in the Blank</SelectItem>
                                    <SelectItem value="short">Short Answer</SelectItem>
                                    <SelectItem value="long">Long Answer</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>

                              <div className="space-y-2">
                                <Label>Marks</Label>
                                <Input
                                  type="number"
                                  min="1"
                                  value={question.marks}
                                  onChange={(e) => updateQuestion(qIndex, 'marks', parseInt(e.target.value))}
                                  required
                                  className="rounded-lg"
                                />
                              </div>
                            </div>

                            {question.question_type === 'mcq' && (
                              <div className="space-y-3">
                                <Label>Options</Label>
                                {question.options.map((option, oIndex) => (
                                  <Input
                                    key={oIndex}
                                    placeholder={`Option ${oIndex + 1}`}
                                    value={option}
                                    onChange={(e) => updateOption(qIndex, oIndex, e.target.value)}
                                    className="rounded-lg"
                                  />
                                ))}
                              </div>
                            )}

                            <div className="space-y-2">
                              <Label>Correct Answer</Label>
                              {question.question_type === 'mcq' ? (
                                <Select 
                                  value={question.correct_answer} 
                                  onValueChange={(value) => updateQuestion(qIndex, 'correct_answer', value)}
                                >
                                  <SelectTrigger className="rounded-lg">
                                    <SelectValue placeholder="Select correct option" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {question.options.map((option, idx) => (
                                      <SelectItem key={idx} value={option}>
                                        {option || `Option ${idx + 1}`}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              ) : (
                                <Textarea
                                  placeholder="Enter correct answer or key points"
                                  value={question.correct_answer}
                                  onChange={(e) => updateQuestion(qIndex, 'correct_answer', e.target.value)}
                                  className="rounded-lg"
                                />
                              )}
                            </div>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  )}

                  {formData.questions.length > 0 && (
                    <div className="mt-6 p-4 bg-indigo-50 rounded-lg">
                      <div className="flex justify-between items-center">
                        <span className="font-semibold text-slate-900">Total Marks:</span>
                        <span className="text-2xl font-heading font-bold text-indigo-600">
                          {calculateTotalMarks()}
                        </span>
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex justify-end gap-3 pt-6 border-t">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => navigate('/teacher/dashboard')}
                    className="rounded-full"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={loading}
                    data-testid="create-test-submit-btn"
                    className="rounded-full px-8 font-semibold shadow-lg shadow-indigo-500/20 hover:shadow-indigo-500/40 transition-all active:scale-95"
                  >
                    {loading ? 'Creating...' : 'Create Test'}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}