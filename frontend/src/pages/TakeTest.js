import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { api } from '@/App';
import { toast } from 'sonner';
import { Clock, Upload, Camera, ArrowLeft, Send } from 'lucide-react';
import { motion } from 'framer-motion';

export default function TakeTest({ user }) {
  const { testId } = useParams();
  const navigate = useNavigate();
  const [test, setTest] = useState(null);
  const [answers, setAnswers] = useState([]);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const fileInputRef = useRef(null);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [cameraActive, setCameraActive] = useState(false);

  useEffect(() => {
    fetchTest();
  }, [testId]);

  useEffect(() => {
    if (timeRemaining > 0) {
      const timer = setTimeout(() => setTimeRemaining(timeRemaining - 1), 1000);
      return () => clearTimeout(timer);
    } else if (timeRemaining === 0 && test) {
      handleSubmit();
    }
  }, [timeRemaining, test]);

  const fetchTest = async () => {
    try {
      const response = await api.get(`/tests/${testId}`);
      setTest(response.data);
      setTimeRemaining(response.data.duration_minutes * 60);
      setAnswers(response.data.questions.map(() => ({
        question_index: 0,
        answer_text: '',
        selected_option: '',
        match_pairs: {},
        handwritten_image: null,
        ocr_text: null,
      })));
    } catch (error) {
      toast.error('Failed to load test');
      navigate('/student/dashboard');
    }
  };

  const handleAnswerChange = (index, field, value) => {
    const newAnswers = [...answers];
    newAnswers[index] = { ...newAnswers[index], [field]: value, question_index: index };
    setAnswers(newAnswers);
  };

  const handleFileUpload = async (index, file) => {
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);

    try {
      toast.loading('Processing image...');
      const response = await api.post('/upload-image', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      
      const newAnswers = [...answers];
      newAnswers[index] = {
        ...newAnswers[index],
        handwritten_image: response.data.image_base64,
        ocr_text: response.data.ocr_text,
        question_index: index
      };
      setAnswers(newAnswers);
      toast.success('Image processed successfully!');
    } catch (error) {
      toast.error('Failed to process image');
    }
  };

  const startCamera = async (index) => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
        setCameraActive(true);
      }
    } catch (error) {
      toast.error('Failed to access camera');
    }
  };

  const capturePhoto = async (index) => {
    if (!videoRef.current || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const video = videoRef.current;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(video, 0, 0);

    canvas.toBlob(async (blob) => {
      const file = new File([blob], 'capture.jpg', { type: 'image/jpeg' });
      await handleFileUpload(index, file);
      stopCamera();
    }, 'image/jpeg');
  };

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject;
      stream.getTracks().forEach(track => track.stop());
      videoRef.current.srcObject = null;
      setCameraActive(false);
    }
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      const response = await api.post(`/tests/${testId}/submit`, {
        test_id: testId,
        answers: answers
      });
      toast.success('Test submitted successfully!');
      navigate('/student/results');
    } catch (error) {
      toast.error('Failed to submit test');
    } finally {
      setSubmitting(false);
    }
  };

  if (!test) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const question = test.questions[currentQuestion];

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
            Back
          </Button>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 px-4 py-2 bg-amber-100 rounded-full">
              <Clock className="h-4 w-4 text-amber-600" />
              <span className="font-mono font-bold text-amber-900" data-testid="timer">
                {formatTime(timeRemaining)}
              </span>
            </div>
          </div>
        </div>
      </nav>

      <div className="px-4 md:px-8 py-8">
        <div className="max-w-4xl mx-auto">
          <Card className="shadow-lg mb-6" data-testid="test-info-card">
            <CardHeader>
              <CardTitle className="text-2xl font-heading font-bold">{test.title}</CardTitle>
              <p className="text-slate-600">Question {currentQuestion + 1} of {test.questions.length}</p>
            </CardHeader>
          </Card>

          <Card className="shadow-lg mb-6" data-testid="question-card">
            <CardContent className="pt-6">
              <div className="mb-6">
                <h3 className="text-xl font-heading font-semibold text-slate-900 mb-4">
                  {question.question_text}
                </h3>
                <p className="text-sm text-slate-600">Marks: {question.marks}</p>
              </div>

              {question.question_type === 'mcq' && (
                <RadioGroup
                  value={answers[currentQuestion]?.selected_option || ''}
                  onValueChange={(value) => handleAnswerChange(currentQuestion, 'selected_option', value)}
                  data-testid="mcq-options"
                >
                  {question.options?.map((option, idx) => (
                    <div key={idx} className="flex items-center space-x-2 p-3 bg-slate-50 rounded-lg mb-2">
                      <RadioGroupItem value={option} id={`option-${idx}`} />
                      <Label htmlFor={`option-${idx}`} className="flex-1 cursor-pointer">{option}</Label>
                    </div>
                  ))}
                </RadioGroup>
              )}

              {question.question_type === 'fill_blank' && (
                <Input
                  placeholder="Enter your answer"
                  value={answers[currentQuestion]?.answer_text || ''}
                  onChange={(e) => handleAnswerChange(currentQuestion, 'answer_text', e.target.value)}
                  data-testid="fill-blank-input"
                  className="rounded-lg"
                />
              )}

              {(question.question_type === 'short' || question.question_type === 'long') && (
                <div className="space-y-4">
                  <Textarea
                    placeholder="Type your answer here or upload handwritten answer below"
                    value={answers[currentQuestion]?.answer_text || ''}
                    onChange={(e) => handleAnswerChange(currentQuestion, 'answer_text', e.target.value)}
                    rows={question.question_type === 'long' ? 8 : 4}
                    data-testid="text-answer-input"
                    className="rounded-lg"
                  />

                  <div className="border-t pt-4">
                    <Label className="text-sm font-semibold mb-3 block">Or upload handwritten answer:</Label>
                    <div className="flex gap-3">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => fileInputRef.current?.click()}
                        data-testid="upload-btn"
                        className="rounded-full"
                      >
                        <Upload className="h-4 w-4 mr-2" />
                        Upload Image
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => startCamera(currentQuestion)}
                        data-testid="camera-btn"
                        className="rounded-full"
                      >
                        <Camera className="h-4 w-4 mr-2" />
                        Use Camera
                      </Button>
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        onChange={(e) => handleFileUpload(currentQuestion, e.target.files[0])}
                        className="hidden"
                      />
                    </div>

                    {cameraActive && (
                      <div className="mt-4">
                        <video ref={videoRef} className="w-full max-w-md rounded-lg border" />
                        <canvas ref={canvasRef} className="hidden" />
                        <div className="flex gap-3 mt-3">
                          <Button onClick={() => capturePhoto(currentQuestion)} data-testid="capture-btn">
                            Capture Photo
                          </Button>
                          <Button variant="outline" onClick={stopCamera}>Cancel</Button>
                        </div>
                      </div>
                    )}

                    {answers[currentQuestion]?.ocr_text && (
                      <div className="mt-4 p-4 bg-teal-50 rounded-lg">
                        <p className="text-sm font-semibold text-teal-900 mb-2">Extracted Text:</p>
                        <p className="text-sm text-teal-800">{answers[currentQuestion].ocr_text}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <div className="flex justify-between items-center">
            <Button
              variant="outline"
              onClick={() => setCurrentQuestion(Math.max(0, currentQuestion - 1))}
              disabled={currentQuestion === 0}
              data-testid="prev-btn"
              className="rounded-full"
            >
              Previous
            </Button>
            
            {currentQuestion < test.questions.length - 1 ? (
              <Button
                onClick={() => setCurrentQuestion(currentQuestion + 1)}
                data-testid="next-btn"
                className="rounded-full"
              >
                Next
              </Button>
            ) : (
              <Button
                onClick={handleSubmit}
                disabled={submitting}
                data-testid="submit-test-btn"
                className="rounded-full px-8 font-semibold shadow-lg shadow-teal-500/20 hover:shadow-teal-500/40 transition-all active:scale-95"
              >
                <Send className="h-4 w-4 mr-2" />
                {submitting ? 'Submitting...' : 'Submit Test'}
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}