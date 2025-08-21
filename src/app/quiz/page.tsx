'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface Question {
  id: number;
  question: string;
  options: string[];
}

const questions: Question[] = [
  {
    id: 1,
    question: "What's your ideal weekend activity?",
    options: ["Hiking", "Reading", "Party", "Napping"]
  },
  {
    id: 2,
    question: "Pick a snack:",
    options: ["Cheese", "Berries", "Chips", "Sushi"]
  },
  {
    id: 3,
    question: "Your favorite weather:",
    options: ["Sunny", "Rainy", "Snowy", "Cloudy"]
  },
  {
    id: 4,
    question: "If you had a superpower, it would be:",
    options: ["Flying", "Invisibility", "Super strength", "Time travel"]
  },
  {
    id: 5,
    question: "Pick a color:",
    options: ["Blue", "Pink", "Green", "Yellow"]
  },
  {
    id: 6,
    question: "How do you handle stress?",
    options: ["Exercise", "Talk to friends", "Listen to music", "Sleep"]
  },
  {
    id: 7,
    question: "What's your morning vibe?",
    options: ["Energetic", "Calm", "Slow", "Moody"]
  },
  {
    id: 8,
    question: "Pick a travel destination:",
    options: ["Mountains", "Beach", "City", "Forest"]
  }
];

const animals = ["Cat", "Dog", "Rabbit", "Fox", "Owl", "Dolphin", "Panda", "Tiger"];

export default function Quiz() {
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<number[]>([]);
  const [userName, setUserName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();

  useEffect(() => {
    // 從 localStorage 獲取用戶名稱
    const storedUserName = localStorage.getItem('userName');
    if (storedUserName) {
      setUserName(storedUserName);
    } else {
      // 如果沒有用戶名稱，重定向到首頁
      router.push('/');
    }
  }, [router]);

  const handleAnswer = (optionIndex: number) => {
    const newAnswers = [...answers];
    newAnswers[currentQuestion] = optionIndex;
    setAnswers(newAnswers);

    if (currentQuestion < questions.length - 1) {
      // 延遲一下再進入下一題，讓用戶看到選擇效果
      setTimeout(() => {
        setCurrentQuestion(currentQuestion + 1);
      }, 300);
    } else {
      // 最後一題，計算結果
      setIsSubmitting(true);
      const resultIndex = newAnswers.reduce((sum, answer) => sum + answer, 0) % 8;
      const result = animals[resultIndex];
      
      // 將結果存儲到 localStorage
      localStorage.setItem('quizResult', result);
      localStorage.setItem('quizAnswers', JSON.stringify(newAnswers));
      
      // 導航到結果頁面
      setTimeout(() => {
        router.push('/result');
      }, 500);
    }
  };

  const getProgressPercentage = () => {
    return ((currentQuestion + 1) / questions.length) * 100;
  };

  if (!userName) {
    return <div className="min-h-screen bg-gradient-to-br from-pink-100 via-purple-50 to-blue-100 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
        <p className="mt-4 text-gray-600">Loading...</p>
      </div>
    </div>;
  }

  const question = questions[currentQuestion];

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-100 via-purple-50 to-blue-100 p-4">
      <div className="max-w-2xl mx-auto">
        {/* 進度條 */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-medium text-gray-700">
              Question {currentQuestion + 1} of {questions.length}
            </span>
            <span className="text-sm font-medium text-gray-700">
              {Math.round(getProgressPercentage())}%
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-3">
            <div 
              className="bg-gradient-to-r from-pink-500 to-purple-600 h-3 rounded-full transition-all duration-500 ease-out"
              style={{ width: `${getProgressPercentage()}%` }}
            ></div>
          </div>
        </div>

        {/* 問題卡片 */}
        <div className="bg-white rounded-3xl shadow-2xl p-8 mb-8">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">
              {question.question}
            </h2>
            <p className="text-gray-600">
              Hi {userName}! Choose your answer below:
            </p>
          </div>

          {/* 選項 */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {question.options.map((option, index) => (
              <button
                key={index}
                onClick={() => handleAnswer(index)}
                disabled={isSubmitting}
                className="p-6 border-2 border-purple-200 rounded-2xl text-left hover:border-purple-400 hover:bg-purple-50 transform hover:scale-105 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
              >
                <div className="flex items-center">
                  <div className="w-8 h-8 bg-gradient-to-br from-pink-400 to-purple-500 rounded-full flex items-center justify-center text-white font-bold mr-4">
                    {String.fromCharCode(65 + index)}
                  </div>
                  <span className="text-lg font-medium text-gray-800">{option}</span>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* 提交狀態 */}
        {isSubmitting && (
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Calculating your soulpet...</p>
          </div>
        )}
      </div>
    </div>
  );
}

