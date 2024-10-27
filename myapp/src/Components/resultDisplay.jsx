const ResultDisplay = ({ result }) => {
  return (
    <div className="result-display">
      <h2 className="result-title">Result</h2>
      <div className="result-value">
        {result !== null
          ? typeof result === "number"
            ? result.toFixed(6)
            : result
          : "-"}
      </div>
    </div>
  );
};

export default ResultDisplay;
