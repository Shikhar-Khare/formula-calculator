const ErrorDisplay = ({ error }) => {
  if (!error) return null;

  return (
    <div className="error-display">
      <p className="error-message">{error}</p>
    </div>
  );
};

export default ErrorDisplay;
