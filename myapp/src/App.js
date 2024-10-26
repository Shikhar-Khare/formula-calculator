import React, { useState, useEffect } from "react";
import Latex from "react-latex-next";
import "katex/dist/katex.min.css";
import "./index.css";

const evaluateFormula = (formula, variables) => {
  try {
    const replacedFormula = formula.replace(
      /[a-zA-Z]/g,
      (match) => variables[match] || 0
    );
    const result = new Function(`return ${replacedFormula}`)();
    return isNaN(result) ? "Invalid Expression" : result;
  } catch (error) {
    return "Invalid Formula";
  }
};

const convertToLatex = (input) => {
  if (!input) return "";

  // Removing all spaces first
  let formula = input.replace(/\s+/g, "");

  // Replacing multiplication operator
  formula = formula.replace(/\*/g, "\\cdot ");

  // Handling exponents
  formula = formula.replace(/\^(\d+)/g, "^{$1}");
  formula = formula.replace(/\^([a-zA-Z])/g, "^{$1}");

  // Handling parentheses
  formula = formula.replace(/\(/g, "\\left(");
  formula = formula.replace(/\)/g, "\\right)");

  // Handling spaces around operators
  formula = formula.replace(/\+/g, " + ");
  formula = formula.replace(/(?<!^)\s*-\s*/g, " - ");

  return formula;
};

function App() {
  const [formula, setFormula] = useState("");
  const [variables, setVariables] = useState({});
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  const [latexFormula, setLatexFormula] = useState("");

  const handleFormulaChange = (e) => {
    const newFormula = e.target.value;
    setFormula(newFormula);
    const latex = convertToLatex(newFormula);
    setLatexFormula(latex);

    const matchedVariables = [...new Set(newFormula.match(/[a-zA-Z]/g) || [])];
    const newVariables = {};
    matchedVariables.forEach(
      (variable) => (newVariables[variable] = variables[variable] || 0)
    );
    setVariables(newVariables);
  };

  const handleVariableChange = (key, value) => {
    const updatedVariables = { ...variables, [key]: parseFloat(value) || 0 };
    setVariables(updatedVariables);
  };

  useEffect(() => {
    if (formula) {
      const calculatedResult = evaluateFormula(formula, variables);
      setResult(calculatedResult);
      setError(
        calculatedResult === "Invalid Formula" ? "Invalid formula entered" : ""
      );
    }
  }, [formula, variables]);

  return (
    <div className="app-container">
      <div className="calculator-card">
        <h1 className="title">Dynamic Formula Calculator</h1>

        {/* Formula Input */}
        <div className="input-group">
          <label className="label">Enter Formula</label>
          <input
            type="text"
            placeholder="e.g., a^2 + b*c"
            value={formula}
            onChange={handleFormulaChange}
            className="input-field"
          />
        </div>

        {/* LaTeX Preview */}
        <div className="latex-preview">
          <h2 className="preview-title">LaTeX Preview</h2>
          <div className="latex-output">
            {latexFormula && <Latex>{"$" + latexFormula + "$"}</Latex>}
          </div>
        </div>

        {/* Variables Input */}
        {Object.keys(variables).length > 0 && (
          <div className="variables-input">
            <h2 className="variables-title">Variables</h2>
            <div className="variables-grid">
              {Object.keys(variables).map((variable) => (
                <div key={variable} className="variable-item">
                  <label className="variable-label">{variable}:</label>
                  <input
                    type="number"
                    value={variables[variable]}
                    onChange={(e) =>
                      handleVariableChange(variable, e.target.value)
                    }
                    className="variable-input"
                  />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Result Display */}
        <div className="result-display">
          <h2 className="result-title">Result</h2>
          <div className="result-value">{result !== null ? result : "-"}</div>
        </div>

        {/* Error Display */}
        {error && (
          <div className="error-display">
            <p className="error-message">{error}</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
