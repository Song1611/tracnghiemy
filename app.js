const { useState, useEffect } = React;

function App() {
    const [quizData, setQuizData] = useState(null);
    const [questionsData, setQuestionsData] = useState(null);
    const [selectedCategory, setSelectedCategory] = useState(null);
    const [currentQuestions, setCurrentQuestions] = useState([]);
    const [answers, setAnswers] = useState({});
    const [textInputs, setTextInputs] = useState({});
    const [submittedAnswers, setSubmittedAnswers] = useState({});
    const [showMobilePopup, setShowMobilePopup] = useState(false);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        Promise.all([
            fetch('quiz_data.json').then(r => r.json()),
            fetch('questions_full.json').then(r => r.json())
        ]).then(([quiz, questions]) => {
            setQuizData(quiz);
            setQuestionsData(questions);
            setLoading(false);
        });
    }, []);

    const handleCategorySelect = (category) => {
        setSelectedCategory(category);
        const questions = questionsData.questions.filter(
            q => q.id >= category.startQuestion && q.id <= category.endQuestion
        );
        setCurrentQuestions(questions);
        setAnswers({});
        setTextInputs({});
        setSubmittedAnswers({});
    };

    const handleAnswerSelect = (questionId, selectedOption) => {
        setAnswers(prev => ({
            ...prev,
            [questionId]: selectedOption
        }));
    };

    const getCorrectAnswersCount = () => {
        return Object.entries(answers).filter(([qId, answer]) => {
            return quizData.questions[qId] === answer;
        }).length;
    };

    const isCorrect = (questionId, option) => {
        if (!answers[questionId]) return null;
        const correctAnswer = quizData.questions[questionId.toString()];
        if (answers[questionId] === option) {
            return option === correctAnswer ? 'correct' : 'incorrect';
        }
        return null;
    };

    const isTextAnswer = (question) => {
        return !question.options || Object.keys(question.options).length === 0;
    };

    const checkTextAnswer = (questionId) => {
        if (!submittedAnswers[questionId]) return null;
        const correctAnswer = quizData.questions[questionId.toString()];
        const userAnswer = answers[questionId].trim().toLowerCase();
        const correct = correctAnswer.toLowerCase();
        return userAnswer === correct ? 'correct' : 'incorrect';
    };

    const handleTextInputChange = (questionId, value) => {
        setTextInputs(prev => ({
            ...prev,
            [questionId]: value
        }));
    };

    const handleTextSubmit = (questionId) => {
        const value = textInputs[questionId] || '';
        if (value.trim()) {
            setAnswers(prev => ({
                ...prev,
                [questionId]: value
            }));
            setSubmittedAnswers(prev => ({
                ...prev,
                [questionId]: true
            }));
        }
    };

    const handleTextRetry = (questionId) => {
        setTextInputs(prev => ({
            ...prev,
            [questionId]: ''
        }));
        setSubmittedAnswers(prev => ({
            ...prev,
            [questionId]: false
        }));
    };

    const handleTextKeyPress = (e, questionId) => {
        if (e.key === 'Enter') {
            handleTextSubmit(questionId);
        }
    };

    if (loading) {
        return <div className="container"><div className="header"><h1>Đang tải...</h1></div></div>;
    }

    if (!selectedCategory) {
        return (
            <div className="container">
                <div className="header">
                    <h1>🎓 Trắc Nghiệm Giải Phẫu</h1>
                    <p>Chọn phần bạn muốn luyện tập</p>
                </div>
                <div className="category-selection">
                    <h2>Chọn Chủ Đề</h2>
                    <div className="category-grid">
                        {quizData.categories.map(category => (
                            <button
                                key={category.id}
                                className="category-card"
                                onClick={() => handleCategorySelect(category)}
                            >
                                <h3>{category.name}</h3>
                                <p>{category.description}</p>
                                <p>📝 {category.totalQuestions} câu hỏi</p>
                            </button>
                        ))}
                    </div>
                </div>
            </div>
        );
    }

    const correctCount = getCorrectAnswersCount();
    const totalAnswered = Object.keys(answers).length;

    return (
        <div className="container">
            <div className="header">
                <h1>🎓 {selectedCategory.name}</h1>
            </div>
            <div className="quiz-layout">
                <div className="quiz-container">
                    {currentQuestions.map((question) => (
                    <div key={question.id} className="question-card">
                        <div className="question-text">
                            <span className="question-number">Câu {question.id}: </span> 
                            <span dangerouslySetInnerHTML={{__html: question.question.replace(/\n/g, '<br/>')}} />
                        </div>
                        
                        {question.image && (
                            <div className="question-image">
                                <img src={`images/${question.image}.png`} alt={`Câu ${question.id}`} />
                            </div>
                        )}

                        {isTextAnswer(question) ? (
                            <div className="text-answer-container">
                                <div className="text-input-wrapper">
                                    <input
                                        type="text"
                                        className={`text-answer-input ${checkTextAnswer(question.id) || ''}`}
                                        placeholder="Nhập câu trả lời của bạn..."
                                        value={textInputs[question.id] || ''}
                                        onChange={(e) => handleTextInputChange(question.id, e.target.value)}
                                        onKeyDown={(e) => handleTextKeyPress(e, question.id)}
                                        disabled={submittedAnswers[question.id] && checkTextAnswer(question.id) === 'correct'}
                                    />
                                    {!submittedAnswers[question.id] ? (
                                        <button 
                                            className="submit-btn"
                                            onClick={() => handleTextSubmit(question.id)}
                                        >
                                            Xác nhận
                                        </button>
                                    ) : checkTextAnswer(question.id) === 'incorrect' && (
                                        <button 
                                            className="retry-btn"
                                            onClick={() => handleTextRetry(question.id)}
                                        >
                                            Thử lại
                                        </button>
                                    )}
                                </div>
                                {submittedAnswers[question.id] && (
                                    <div className={`answer-feedback ${checkTextAnswer(question.id)}`}>
                                        {checkTextAnswer(question.id) === 'correct' ? '✓ Đúng!' : `✗ Sai! Đáp án đúng: ${quizData.questions[question.id.toString()]}`}
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className="options-grid">
                                {Object.entries(question.options).map(([key, value]) => {
                                    const correctAnswer = quizData.questions[question.id.toString()];
                                    const isSelected = answers[question.id] === key;
                                    const isCorrectOption = key === correctAnswer;
                                    const showCorrect = answers[question.id] && isCorrectOption;
                                    const showIncorrect = isSelected && !isCorrectOption;

                                    return (
                                        <button
                                            key={key}
                                            className={`option-btn ${showCorrect ? 'correct' : ''} ${showIncorrect ? 'incorrect' : ''}`}
                                            onClick={() => handleAnswerSelect(question.id, key)}
                                        >
                                            <div className="option-content">
                                                <div className="option-text">
                                                    <strong>{key}.</strong> 
                                                    <span dangerouslySetInnerHTML={{__html: value.replace(/\n/g, '<br/>')}} />
                                                </div>
                                                
                                                {showCorrect && (
                                                    <div className="option-label correct-label">
                                                        <span className="label-icon">✓</span>
                                                        <span className="label-text">Câu trả lời chính xác</span>
                                                    </div>
                                                )}
                                                
                                                {showIncorrect && (
                                                    <div className="option-label incorrect-label">
                                                        <span className="label-icon">✗</span>
                                                        <span className="label-text">Chưa đúng lắm!</span>
                                                    </div>
                                                )}
                                            </div>
                                        </button>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                ))}
                </div>

                <div className="sidebar">
                    <div className="sidebar-content">
                        <h3>Thông Tin</h3>
                        
                        <div className="sidebar-stats">
                            <div className="stat-item">
                                <div className="stat-label">Tổng câu hỏi</div>
                                <div className="stat-value">{currentQuestions.length}</div>
                            </div>
                            
                            <div className="stat-item">
                                <div className="stat-label">Đã làm</div>
                                <div className="stat-value">{totalAnswered}</div>
                            </div>
                            
                            <div className="stat-item highlight">
                                <div className="stat-label">Số câu đúng</div>
                                <div className="stat-value correct">{correctCount}</div>
                            </div>
                        </div>

                        {totalAnswered > 0 && (
                            <div className="sidebar-score">
                                <div className="score-label">Tỷ lệ đúng</div>
                                <div className="score-percentage">
                                    {((correctCount/totalAnswered)*100).toFixed(1)}%
                                </div>
                                <div className="score-fraction">
                                    {correctCount}/{totalAnswered}
                                </div>
                            </div>
                        )}

                        <button className="sidebar-back-btn" onClick={() => setSelectedCategory(null)}>
                            ← Quay lại chọn chủ đề
                        </button>
                    </div>
                </div>

                {/* Mobile Floating Button & Popup */}
                <button className="floating-info-btn" onClick={() => setShowMobilePopup(true)}>
                    📊
                </button>

                {showMobilePopup && (
                    <>
                        <div className="popup-overlay" onClick={() => setShowMobilePopup(false)}></div>
                        <div className="mobile-popup">
                            <div className="popup-header">
                                <h3>📊 Thông Tin</h3>
                                <button className="popup-close" onClick={() => setShowMobilePopup(false)}>✕</button>
                            </div>
                            
                            <div className="popup-stats">
                                <div className="popup-stat-item">
                                    <div className="popup-stat-label">Tổng câu hỏi</div>
                                    <div className="popup-stat-value">{currentQuestions.length}</div>
                                </div>
                                
                                <div className="popup-stat-item">
                                    <div className="popup-stat-label">Đã làm</div>
                                    <div className="popup-stat-value">{totalAnswered}</div>
                                </div>
                                
                                <div className="popup-stat-item highlight">
                                    <div className="popup-stat-label">Số câu đúng</div>
                                    <div className="popup-stat-value correct">{correctCount}</div>
                                </div>
                            </div>

                            {totalAnswered > 0 && (
                                <div className="popup-score">
                                    <div className="popup-score-label">Tỷ lệ đúng</div>
                                    <div className="popup-score-percentage">
                                        {((correctCount/totalAnswered)*100).toFixed(1)}%
                                    </div>
                                    <div className="popup-score-fraction">
                                        {correctCount}/{totalAnswered}
                                    </div>
                                </div>
                            )}

                            <button className="popup-back-btn" onClick={() => setSelectedCategory(null)}>
                                ← Quay lại chọn chủ đề
                            </button>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}

ReactDOM.render(<App />, document.getElementById('root'));
