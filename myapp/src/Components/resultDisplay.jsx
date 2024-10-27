const ResultDisplay = ({ result }) => {
  const formatResult = (value) => {
    if (value === null) return "-";
    if (typeof value === "number") {
      // Handle very small or very large numbers
      if (Math.abs(value) < 0.000001 || Math.abs(value) > 999999) {
        return value.toExponential(6);
      }
      return value.toFixed(6);
    }
    return value; // Return error messages as-is
  };

  return (
    <div className="result-display">
      <h2 className="result-title">Result</h2>
      <div className="result-value">{formatResult(result)}</div>
    </div>
  );
};

export default ResultDisplay;
