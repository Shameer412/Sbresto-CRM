import React, { useState } from 'react';
import { CheckCircle, AlertCircle, Send, Loader, ArrowLeft } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';

export default function DynamicFormRenderer() {
  const location = useLocation();
  const navigate = useNavigate();
  
  // Get survey data from navigation state
  const surveyData = location.state?.surveyData;
  
  const [formResponses, setFormResponses] = useState({});
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  // Handle input changes for any question type
  const handleInputChange = (questionId, value) => {
    setFormResponses({
      ...formResponses,
      [questionId]: value
    });
    // Clear error when user starts typing
    if (errors[questionId]) {
      setErrors({
        ...errors,
        [questionId]: null
      });
    }
  };

  // Handle checkbox changes (multiple selections)
  const handleCheckboxChange = (questionId, optionValue, isChecked) => {
    const currentSelections = formResponses[questionId] || [];
    let newSelections;

    if (isChecked) {
      newSelections = [...currentSelections, optionValue];
    } else {
      newSelections = currentSelections.filter(item => item !== optionValue);
    }

    setFormResponses({
      ...formResponses,
      [questionId]: newSelections
    });

    if (errors[questionId]) {
      setErrors({
        ...errors,
        [questionId]: null
      });
    }
  };

  // Validate form before submission
  const validateForm = () => {
    const newErrors = {};
    let isValid = true;

    surveyData.questions.forEach(question => {
      if (question.required) {
        const response = formResponses[question.id];
        
        if (!response || 
            (Array.isArray(response) && response.length === 0) || 
            (typeof response === 'string' && response.trim() === '')) {
          newErrors[question.id] = 'This field is required';
          isValid = false;
        }
      }
    });

    setErrors(newErrors);
    return isValid;
  };

  // Handle form submission
  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (validateForm()) {
      setIsSubmitting(true);
      
      // Simulate API call
      setTimeout(() => {
        const submissionData = {
          surveyTitle: surveyData.title,
          surveyDescription: surveyData.description,
          responses: formResponses,
          submittedAt: new Date().toISOString()
        };
        
        console.log('Form Submitted:', submissionData);
        setIsSubmitting(false);
        setIsSubmitted(true);
      }, 1500);
    }
  };

  // Reset form
  const handleReset = () => {
    setFormResponses({});
    setErrors({});
    setIsSubmitted(false);
  };

  // Go back to builder
  const goBackToBuilder = () => {
    navigate('/');
  };

  // Render different question types
  const renderQuestion = (question, index) => {
    const hasError = errors[question.id];
    const errorClass = hasError ? 'border-red-500 ring-red-100' : 'border-gray-300';

    switch (question.type) {
      case 'text':
        return (
          <input
            type="text"
            value={formResponses[question.id] || ''}
            onChange={(e) => handleInputChange(question.id, e.target.value)}
            placeholder={question.placeholder || 'Your answer'}
            className={`w-full px-4 py-3 border-2 ${errorClass} rounded-xl focus:ring-4 focus:ring-blue-100 focus:border-blue-500 outline-none transition-all duration-300`}
            required={question.required}
          />
        );

      case 'textarea':
        return (
          <textarea
            value={formResponses[question.id] || ''}
            onChange={(e) => handleInputChange(question.id, e.target.value)}
            placeholder={question.placeholder || 'Your detailed answer'}
            rows="5"
            className={`w-full px-4 py-3 border-2 ${errorClass} rounded-xl focus:ring-4 focus:ring-blue-100 focus:border-blue-500 outline-none resize-none transition-all duration-300`}
            required={question.required}
          />
        );

      case 'multiple-choice':
        return (
          <div className="space-y-3">
            {question.options.map((option, optionIndex) => (
              <label 
                key={optionIndex} 
                className={`flex items-center gap-3 p-4 bg-gray-50 rounded-xl hover:bg-blue-50 cursor-pointer transition-all duration-300 border-2 ${
                  formResponses[question.id] === option 
                    ? 'border-blue-500 bg-blue-50' 
                    : hasError 
                    ? 'border-red-200' 
                    : 'border-transparent'
                } hover:border-blue-300`}
              >
                <input
                  type="radio"
                  name={`question-${question.id}`}
                  value={option}
                  checked={formResponses[question.id] === option}
                  onChange={(e) => handleInputChange(question.id, e.target.value)}
                  className="w-5 h-5 text-blue-600 border-2 border-gray-300 focus:ring-2 focus:ring-blue-500"
                  required={question.required}
                />
                <span className="text-gray-700 flex-1">{option}</span>
              </label>
            ))}
          </div>
        );

      case 'checkbox':
        return (
          <div className="space-y-3">
            {question.options.map((option, optionIndex) => {
              const isChecked = (formResponses[question.id] || []).includes(option);
              return (
                <label 
                  key={optionIndex} 
                  className={`flex items-center gap-3 p-4 bg-gray-50 rounded-xl hover:bg-blue-50 cursor-pointer transition-all duration-300 border-2 ${
                    isChecked 
                      ? 'border-blue-500 bg-blue-50' 
                      : hasError 
                      ? 'border-red-200' 
                      : 'border-transparent'
                  } hover:border-blue-300`}
                >
                  <input
                    type="checkbox"
                    checked={isChecked}
                    onChange={(e) => handleCheckboxChange(question.id, option, e.target.checked)}
                    className="w-5 h-5 text-blue-600 border-2 border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                  />
                  <span className="text-gray-700 flex-1">{option}</span>
                </label>
              );
            })}
          </div>
        );

      case 'dropdown':
        return (
          <select 
            value={formResponses[question.id] || ''}
            onChange={(e) => handleInputChange(question.id, e.target.value)}
            className={`w-full px-4 py-3 border-2 ${errorClass} rounded-xl focus:ring-4 focus:ring-blue-100 focus:border-blue-500 outline-none transition-all duration-300 cursor-pointer bg-white`}
            required={question.required}
          >
            <option value="">Select an option</option>
            {question.options.map((option, optionIndex) => (
              <option key={optionIndex} value={option}>
                {option}
              </option>
            ))}
          </select>
        );

      case 'rating':
        return (
          <div className="flex gap-3 flex-wrap">
            {[1, 2, 3, 4, 5].map((rating) => (
              <button
                key={rating}
                type="button"
                onClick={() => handleInputChange(question.id, rating)}
                className={`w-14 h-14 text-3xl rounded-xl transition-all duration-300 transform hover:scale-110 ${
                  formResponses[question.id] >= rating 
                    ? 'bg-yellow-100 border-2 border-yellow-400 scale-105' 
                    : hasError
                    ? 'bg-red-50 border-2 border-red-200'
                    : 'bg-gray-100 border-2 border-gray-200 hover:border-yellow-300'
                }`}
              >
                {formResponses[question.id] >= rating ? '⭐' : '☆'}
              </button>
            ))}
            {formResponses[question.id] && (
              <span className="flex items-center ml-2 text-gray-600 font-medium">
                {formResponses[question.id]} / 5
              </span>
            )}
          </div>
        );

      default:
        return (
          <input
            type="text"
            value={formResponses[question.id] || ''}
            onChange={(e) => handleInputChange(question.id, e.target.value)}
            placeholder="Your answer"
            className={`w-full px-4 py-3 border-2 ${errorClass} rounded-xl focus:ring-4 focus:ring-blue-100 focus:border-blue-500 outline-none transition-all duration-300`}
          />
        );
    }
  };

  // If no survey data provided via route
  if (!surveyData || !surveyData.questions || surveyData.questions.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl shadow-2xl p-12 max-w-md text-center border border-blue-100">
          <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <AlertCircle className="text-gray-400" size={40} />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-3">No Survey Data</h2>
          <p className="text-gray-600 mb-6">
            Please create a survey first using the survey builder.
          </p>
          <button
            onClick={goBackToBuilder}
            className="bg-blue-600 text-white font-semibold py-3 px-6 rounded-xl hover:bg-blue-700 transition-colors flex items-center justify-center gap-2 mx-auto"
          >
            <ArrowLeft size={20} />
            Go to Survey Builder
          </button>
        </div>
      </div>
    );
  }

  // Success screen after submission
  if (isSubmitted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl shadow-2xl p-12 max-w-2xl text-center border border-green-100 animate-fade-in">
          <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6 animate-bounce">
            <CheckCircle className="text-green-600" size={48} />
          </div>
          <h2 className="text-4xl font-bold text-gray-900 mb-4">Thank You!</h2>
          <p className="text-xl text-gray-600 mb-8">
            Your response has been submitted successfully.
          </p>
          <div className="bg-gray-50 rounded-2xl p-6 mb-8">
            <h3 className="font-semibold text-gray-900 mb-4">Your Responses Summary:</h3>
            <div className="space-y-2 text-left">
              {surveyData.questions.map((question, index) => (
                <div key={question.id} className="pb-3 border-b border-gray-200 last:border-0">
                  <p className="text-sm text-gray-600 mb-1">Q{index + 1}: {question.question}</p>
                  <p className="text-gray-900 font-medium">
                    {Array.isArray(formResponses[question.id]) 
                      ? formResponses[question.id].join(', ') 
                      : formResponses[question.id] || 'Not answered'}
                  </p>
                </div>
              ))}
            </div>
          </div>
          <div className="flex gap-4 justify-center">
            <button
              onClick={handleReset}
              className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold py-3 px-8 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
            >
              Submit Another Response
            </button>
            <button
              onClick={goBackToBuilder}
              className="bg-gray-600 text-white font-semibold py-3 px-8 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 flex items-center gap-2"
            >
              <ArrowLeft size={18} />
              Back to Builder
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Main form rendering
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 py-12 px-4">
      {/* Back button */}
      <div className="max-w-4xl mx-auto mb-6">
        <button
          onClick={goBackToBuilder}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-800 font-medium transition-colors"
        >
          <ArrowLeft size={20} />
          Back to Survey Builder
        </button>
      </div>

      {/* Animated Background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 -left-20 w-96 h-96 bg-blue-200 rounded-full blur-3xl opacity-30 animate-pulse"></div>
        <div className="absolute bottom-20 -right-20 w-96 h-96 bg-purple-200 rounded-full blur-3xl opacity-30 animate-pulse" style={{ animationDelay: '1s' }}></div>
      </div>

      <div className="max-w-4xl mx-auto relative z-10">
        {/* Form Header */}
        <div className="bg-white/90 backdrop-blur-sm rounded-3xl shadow-2xl p-8 md:p-12 mb-8 border border-indigo-100">
          <div className="text-center mb-8">
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              {surveyData.title || 'Survey Form'}
            </h1>
            {surveyData.description && (
              <p className="text-lg text-gray-600 leading-relaxed max-w-2xl mx-auto">
                {surveyData.description}
              </p>
            )}
          </div>

          {/* Required fields notice */}
          {surveyData.questions.some(q => q.required) && (
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex items-center gap-3">
              <AlertCircle className="text-blue-600" size={20} />
              <p className="text-sm text-blue-800">
                <span className="text-red-500 font-bold">*</span> indicates required fields
              </p>
            </div>
          )}
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {surveyData.questions.map((question, index) => (
            <div 
              key={question.id}
              className="bg-white/90 backdrop-blur-sm rounded-3xl shadow-xl p-6 md:p-8 border border-indigo-100 transform hover:shadow-2xl transition-all duration-300"
            >
              {/* Question Header */}
              <div className="flex items-start gap-4 mb-5">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center text-white font-bold text-lg shadow-lg flex-shrink-0">
                  {index + 1}
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">
                    {question.question || 'Untitled Question'}
                    {question.required && <span className="text-red-500 ml-2">*</span>}
                  </h3>
                  <p className="text-sm text-gray-500">
                    {question.type === 'text' && '📝 Short answer'}
                    {question.type === 'textarea' && '📄 Long answer'}
                    {question.type === 'multiple-choice' && '🔘 Select one option'}
                    {question.type === 'checkbox' && '☑️ Select multiple options'}
                    {question.type === 'dropdown' && '📋 Choose from dropdown'}
                    {question.type === 'rating' && '⭐ Rate from 1 to 5'}
                  </p>
                </div>
              </div>

              {/* Question Input */}
              <div className="mb-3">
                {renderQuestion(question, index)}
              </div>

              {/* Error Message */}
              {errors[question.id] && (
                <div className="flex items-center gap-2 text-red-600 text-sm mt-2 animate-shake">
                  <AlertCircle size={16} />
                  <span>{errors[question.id]}</span>
                </div>
              )}
            </div>
          ))}

          {/* Submit Button */}
          <div className="bg-white/90 backdrop-blur-sm rounded-3xl shadow-xl p-6 border border-indigo-100">
            <button
              type="submit"
              disabled={isSubmitting}
              className={`w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold py-4 px-8 rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 flex items-center justify-center gap-3 transform hover:scale-[1.02] ${
                isSubmitting ? 'opacity-75 cursor-not-allowed' : ''
              }`}
            >
              {isSubmitting ? (
                <>
                  <Loader className="animate-spin" size={24} />
                  <span className="text-lg">Submitting...</span>
                </>
              ) : (
                <>
                  <Send size={24} />
                  <span className="text-lg">Submit Survey</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      <style jsx>{`
        @keyframes fade-in {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-5px); }
          75% { transform: translateX(5px); }
        }

        .animate-fade-in {
          animation: fade-in 0.6s ease-out;
        }

        .animate-shake {
          animation: shake 0.3s ease-in-out;
        }
      `}</style>
    </div>
  );
}