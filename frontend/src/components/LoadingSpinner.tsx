interface LoadingSpinnerProps {
  isVisible: boolean;
}

export default function LoadingSpinner({ isVisible }: LoadingSpinnerProps) {
  if (!isVisible) return null;

  return (
    <div className="loading">
      <i className="fas fa-spinner"></i>
      <p>Processing games...</p>
      <div className="status">
        This may take a few moments depending on the number of games
      </div>
    </div>
  );
} 