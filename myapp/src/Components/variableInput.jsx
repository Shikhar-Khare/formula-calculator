const VariablesInput = ({ variables, onVariableChange }) => {
  if (Object.keys(variables).length === 0) return null;

  return (
    <div className="variables-input">
      <h2 className="variables-title">Variables</h2>
      <div className="variables-grid">
        {Object.keys(variables).map((variable) => (
          <div key={variable} className="variable-item">
            <label className="variable-label">{variable}:</label>
            <input
              type="number"
              value={variables[variable]}
              onChange={(e) => onVariableChange(variable, e.target.value)}
              className="variable-input"
            />
          </div>
        ))}
      </div>
    </div>
  );
};

export default VariablesInput;
