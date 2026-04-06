interface ResultCardProps {
  question: string;
  answer: string;
  score: number;
  feedback: string;
  idealAnswer: string;
  index: number;
}

export default function ResultCard({ question, answer, score, feedback, idealAnswer, index }: ResultCardProps) {
  const scoreClass = score >= 7 ? 'good' : score >= 4 ? 'mid' : 'low';
  
  return (
    <div className="result-card">
      <div className="result-header">
        <h3>Question {index + 1}</h3>
        <span className={`score-badge ${scoreClass}`}>{score}/10</span>
      </div>
      <p className="question-text">{question}</p>
      <div className="answer-feedback">
        <p><strong>Your Answer:</strong> {answer}</p>
        <p><strong>Feedback:</strong> {feedback}</p>
        <p className="ideal"><strong>Ideal Answer:</strong> {idealAnswer}</p>
      </div>
    </div>
  );
}