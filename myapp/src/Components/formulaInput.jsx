const FormulaInput = ({
  formula,
  onFormulaChange,
  onSaveFormula,
  isSaveDisabled,
}) => {
  return (
    <div className="input-group">
      <label className="label">Enter Formula</label>
      <div className="formula-input-container">
        <input
          type="text"
          placeholder="e.g., x^(a+b)^z"
          value={formula}
          onChange={(e) => onFormulaChange(e.target.value)}
          className="input-field"
        />
        <button
          onClick={onSaveFormula}
          className="save-button"
          disabled={isSaveDisabled}
        >
          Save
        </button>
      </div>
    </div>
  );
};

export default FormulaInput;
