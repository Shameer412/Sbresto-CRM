import React, { useState } from 'react';
import { Plus, Trash2, GripVertical, Share2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function SurveyBuilder() {
  const [surveyTitle, setSurveyTitle] = useState('');
  const [surveyDescription, setSurveyDescription] = useState('');
  const [questions, setQuestions] = useState([]);
  const navigate = useNavigate();

  const questionTypes = [
    { value: 'text', label: 'Short Text' },
    { value: 'textarea', label: 'Long Text' },
    { value: 'multiple-choice', label: 'Multiple Choice' },
    { value: 'checkbox', label: 'Checkboxes' },
    { value: 'dropdown', label: 'Dropdown' },
    { value: 'rating', label: 'Rating Scale' },
  ];

  const addQuestion = () => {
    const newQuestion = {
      id: Date.now() + Math.random(),
      type: 'text',
      question: '',
      required: false,
      options: ['Option 1', 'Option 2'],
    };
    setQuestions([...questions, newQuestion]);
  };

  const updateQuestion = (id, field, value) => {
    setQuestions(questions.map(q => 
      q.id === id ? { ...q, [field]: value } : q
    ));
  };

  const deleteQuestion = (id) => {
    setQuestions(questions.filter(q => q.id !== id));
  };

  const addOption = (questionId) => {
    setQuestions(questions.map(q => {
      if (q.id === questionId) {
        return {
          ...q,
          options: [...q.options, `Option ${q.options.length + 1}`]
        };
      }
      return q;
    }));
  };

  const updateOption = (questionId, optionIndex, value) => {
    setQuestions(questions.map(q => {
      if (q.id === questionId) {
        const newOptions = [...q.options];
        newOptions[optionIndex] = value;
        return { ...q, options: newOptions };
      }
      return q;
    }));
  };

  const deleteOption = (questionId, optionIndex) => {
    setQuestions(questions.map(q => {
      if (q.id === questionId) {
        return {
          ...q,
          options: q.options.filter((_, index) => index !== optionIndex)
        };
      }
      return q;
    }));
  };

  // Navigate to form with survey data
  const navigateToForm = () => {
    const surveyData = {
      title: surveyTitle,
      description: surveyDescription,
      questions: questions.map(q => ({
        ...q,
        // Ensure each question has proper structure
        placeholder: q.placeholder || '',
        options: q.options || []
      }))
    };

    // Navigate to form page with state
    navigate('/survey-form', { state: { surveyData } });
  };

  // Export data (original functionality)
  const handleExport = () => {
    const surveyData = {
      title: surveyTitle,
      description: surveyDescription,
      questions: questions
    };
    console.log('Survey Data:', surveyData);
    alert('Survey data logged to console! Check the browser console.');
  };

  const needsOptions = (type) => {
    return ['multiple-choice', 'checkbox', 'dropdown'].includes(type);
  };

  const isFormValid = () => {
    return surveyTitle.trim() !== '' && 
           questions.length > 0 && 
           questions.every(q => q.question.trim() !== '');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg p-8 mb-6">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">Survey Builder</h1>
          <p className="text-gray-600 mb-6">Create your custom survey with unlimited questions</p>
          
          <div className="space-y-4 mb-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Survey Title *
              </label>
              <input
                type="text"
                value={surveyTitle}
                onChange={(e) => setSurveyTitle(e.target.value)}
                placeholder="Enter your survey title"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Survey Description
              </label>
              <textarea
                value={surveyDescription}
                onChange={(e) => setSurveyDescription(e.target.value)}
                placeholder="Enter survey description (optional)"
                rows="3"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none resize-none"
              />
            </div>
          </div>
        </div>

        {questions.map((question, index) => (
          <div key={question.id} className="bg-white rounded-lg shadow-md p-6 mb-4">
            <div className="flex items-start gap-3 mb-4">
              <div className="mt-2 text-gray-400 cursor-move">
                <GripVertical size={20} />
              </div>
              
              <div className="flex-1 space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold text-gray-500">
                    Question {index + 1}
                  </span>
                  <button
                    onClick={() => deleteQuestion(question.id)}
                    className="text-red-500 hover:text-red-700 transition-colors"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>

                <input
                  type="text"
                  value={question.question}
                  onChange={(e) => updateQuestion(question.id, 'question', e.target.value)}
                  placeholder="Enter your question"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                />

                <div className="flex flex-wrap gap-4">
                  <div className="flex-1 min-w-48">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Question Type
                    </label>
                    <select
                      value={question.type}
                      onChange={(e) => updateQuestion(question.id, 'type', e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                    >
                      {questionTypes.map(type => (
                        <option key={type.value} value={type.value}>
                          {type.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="flex items-end">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={question.required}
                        onChange={(e) => updateQuestion(question.id, 'required', e.target.checked)}
                        className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                      />
                      <span className="text-sm font-medium text-gray-700">Required</span>
                    </label>
                  </div>
                </div>

                {needsOptions(question.type) && (
                  <div className="space-y-2 mt-4">
                    <label className="block text-sm font-medium text-gray-700">
                      Options
                    </label>
                    {question.options.map((option, optionIndex) => (
                      <div key={optionIndex} className="flex items-center gap-2">
                        <input
                          type="text"
                          value={option}
                          onChange={(e) => updateOption(question.id, optionIndex, e.target.value)}
                          placeholder={`Option ${optionIndex + 1}`}
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                        />
                        {question.options.length > 2 && (
                          <button
                            onClick={() => deleteOption(question.id, optionIndex)}
                            className="text-red-500 hover:text-red-700 transition-colors"
                          >
                            <Trash2 size={16} />
                          </button>
                        )}
                      </div>
                    ))}
                    <button
                      onClick={() => addOption(question.id)}
                      className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                    >
                      + Add Option
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}

        <button
          onClick={addQuestion}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg shadow-md transition-colors flex items-center justify-center gap-2 mb-4"
        >
          <Plus size={20} />
          Add Question
        </button>

        {questions.length > 0 && (
          <div className="space-y-4">
            <button
              onClick={navigateToForm}
              disabled={!isFormValid()}
              className={`w-full font-semibold py-3 px-6 rounded-lg shadow-md transition-colors flex items-center justify-center gap-2 ${
                isFormValid() 
                  ? 'bg-green-600 hover:bg-green-700 text-white' 
                  : 'bg-gray-400 text-gray-200 cursor-not-allowed'
              }`}
            >
              <Share2 size={20} />
              Generate Survey Form
            </button>

            <button
              onClick={handleExport}
              className="w-full bg-gray-600 hover:bg-gray-700 text-white font-semibold py-3 px-6 rounded-lg shadow-md transition-colors"
            >
              Export Survey Data
            </button>
          </div>
        )}

        {questions.length === 0 && (
          <div className="text-center py-12 bg-white rounded-lg shadow-md">
            <p className="text-gray-500 mb-4">No questions yet. Click the button above to add your first question!</p>
          </div>
        )}
      </div>
    </div>
  );
}