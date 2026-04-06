interface QuestionCardProps {
  question: string;
  number: number;
  total: number;
}

export default function QuestionCard({ question, number, total }: QuestionCardProps) {
  return (
    <div className="question-card">
      <div className="question-header">
        <span className="question-number">Question {number} of {total}</span>
      </div>
      <p className="question-text">{question}</p>
    </div>
  );
}