import React, { useState, useEffect } from "react";
import Latex from "react-latex-next";
import "katex/dist/katex.min.css";

const evaluateFormula = (formula, variables) => {
  try {
    let processedFormula = formula;
    Object.keys(variables).forEach((variable) => {
      const regex = new RegExp(`\\b${variable}\\b`, "g");
      processedFormula = processedFormula.replace(regex, variables[variable]);
    });

    const evaluateExpression = (expr) => {
      expr = expr.replace(/\s+/g, "");
      let parenthesesMatch = /\(([^()]+)\)/.exec(expr);
      while (parenthesesMatch) {
        const result = evaluateBasicExpression(parenthesesMatch[1]);
        expr =
          expr.substring(0, parenthesesMatch.index) +
          result +
          expr.substring(parenthesesMatch.index + parenthesesMatch[0].length);
        parenthesesMatch = /\(([^()]+)\)/.exec(expr);
      }
      return evaluateBasicExpression(expr);
    };

    const evaluateBasicExpression = (expr) => {
      while (expr.match(/(-?\d*\.?\d+)\^(-?\d*\.?\d+)/)) {
        expr = expr.replace(/(-?\d*\.?\d+)\^(-?\d*\.?\d+)/g, (_, base, exp) =>
          Math.pow(parseFloat(base), parseFloat(exp))
        );
      }
      while (expr.match(/(-?\d*\.?\d+)([*/])(-?\d*\.?\d+)/)) {
        expr = expr.replace(
          /(-?\d*\.?\d+)([*/])(-?\d*\.?\d+)/g,
          (_, a, op, b) => (op === "*" ? a * b : b === 0 ? NaN : a / b)
        );
      }
      while (expr.match(/(-?\d*\.?\d+)([+-])(-?\d*\.?\d+)/)) {
        expr = expr.replace(
          /(-?\d*\.?\d+)([+-])(-?\d*\.?\d+)/g,
          (_, a, op, b) =>
            op === "+" ? parseFloat(a) + parseFloat(b) : parseFloat(a) - b
        );
      }
      return /^-?\d*\.?\d+$/.test(expr) ? parseFloat(expr) : NaN;
    };

    const result = evaluateExpression(processedFormula);
    return isNaN(result) || !isFinite(result) ? "Invalid Expression" : result;
  } catch (error) {
    console.error("Evaluation error:", error);
    return "Invalid Formula";
  }
};

const convertToLatex = (input) => {
  if (!input) return "";
  let formula = input.replace(/\s+/g, "");
  formula = formula.replace(/\^([a-zA-Z\d])/g, "^{$1}");
  formula = formula.replace(/\^[\(]([^)]+)[\)]/g, (_, group) => {
    const convertedGroup = group.replace(
      /([a-zA-Z])_([a-zA-Z\d]+)/g,
      "$1_{$2}"
    );
    return `^{${convertedGroup}}`;
  });
  formula = formula.replace(/([a-zA-Z])_([a-zA-Z\d]+)/g, "$1_{$2}");
  formula = formula.replace(/\*/g, "\\cdot ");
  formula = formula.replace(/\//g, "\\div ");
  formula = formula.replace(/\(/g, "\\left(");
  formula = formula.replace(/\)/g, "\\right)");
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
  const [savedFormulas, setSavedFormulas] = useState([]);
  const [isListOpen, setIsListOpen] = useState(false);

  useEffect(() => {
    const savedFormula = localStorage.getItem("formula");
    const savedFormulasList =
      JSON.parse(localStorage.getItem("savedFormulas")) || [];

    if (savedFormula) {
      setFormula(savedFormula);
      setLatexFormula(convertToLatex(savedFormula));
      updateVariables(savedFormula);
    }

    setSavedFormulas(savedFormulasList);
  }, []);

  useEffect(() => {
    localStorage.setItem("formula", formula);
  }, [formula]);

  useEffect(() => {
    localStorage.setItem("savedFormulas", JSON.stringify(savedFormulas));
  }, [savedFormulas]);

  const updateVariables = (newFormula) => {
    const variableRegex = /\b[a-zA-Z]\b/g;
    const matchedVariables = [
      ...new Set(newFormula.match(variableRegex) || []),
    ];
    const newVariables = {};
    matchedVariables.forEach(
      (variable) => (newVariables[variable] = variables[variable] || 0)
    );
    setVariables(newVariables);
    const calculatedResult = evaluateFormula(newFormula, newVariables);
    setResult(calculatedResult);
    setError(
      calculatedResult === "Invalid Formula" ? "Invalid formula entered" : ""
    );
  };

  const handleFormulaChange = (e) => {
    const newFormula = e.target.value;
    setFormula(newFormula);
    setLatexFormula(convertToLatex(newFormula));
    updateVariables(newFormula);
  };

  const handleVariableChange = (key, value) => {
    const updatedVariables = { ...variables, [key]: parseFloat(value) || 0 };
    setVariables(updatedVariables);
    const calculatedResult = evaluateFormula(formula, updatedVariables);
    setResult(calculatedResult);
    setError(
      calculatedResult === "Invalid Formula" ? "Invalid formula entered" : ""
    );
  };

  const handleSaveFormula = () => {
    if (formula && !savedFormulas.includes(formula)) {
      setSavedFormulas([...savedFormulas, formula]);
    }
  };

  const handleLoadFormula = (selectedFormula) => {
    setFormula(selectedFormula);
    setLatexFormula(convertToLatex(selectedFormula));
    updateVariables(selectedFormula);
    setIsListOpen(false);
  };

  const handleDeleteFormula = (formulaToDelete, event) => {
    event.stopPropagation();
    setSavedFormulas(savedFormulas.filter((f) => f !== formulaToDelete));
  };

  return (
    <div className="app-container">
      <div className="calculator-card">
        <h1 className="title">Simple Formula Calculator</h1>

        <div className="input-group">
          <label className="label">Enter Formula</label>
          <div className="formula-input-container">
            <input
              type="text"
              placeholder="e.g., (x + y)^2 * z"
              value={formula}
              onChange={handleFormulaChange}
              className="input-field"
            />
            <button
              onClick={handleSaveFormula}
              className="save-button"
              disabled={!formula || savedFormulas.includes(formula)}
            >
              Save
            </button>
          </div>
        </div>

        <div className="saved-formulas">
          <button
            className="toggle-list-button"
            onClick={() => setIsListOpen(!isListOpen)}
          >
            {isListOpen ? "Hide Saved Formulas" : "Show Saved Formulas"}
          </button>

          {isListOpen && (
            <div className="formulas-list">
              {savedFormulas.length === 0 ? (
                <div className="no-formulas">No saved formulas</div>
              ) : (
                savedFormulas.map((savedFormula, index) => (
                  <div
                    key={index}
                    className="formula-item"
                    onClick={() => handleLoadFormula(savedFormula)}
                  >
                    <div className="formula-latex">
                      <Latex>{"$" + convertToLatex(savedFormula) + "$"}</Latex>
                    </div>
                    <button
                      className="delete-button"
                      onClick={(e) => handleDeleteFormula(savedFormula, e)}
                    >
                      ×
                    </button>
                  </div>
                ))
              )}
            </div>
          )}
        </div>

        <div className="support-info text-sm text-gray-600 mt-2">
          <p>
            Supports: Basic arithmetic operations (+, -, *, /), exponents (^),
            and parentheses
          </p>
        </div>

        <div className="latex-preview">
          <h2 className="preview-title">LaTeX Preview</h2>
          <div className="latex-output">
            {latexFormula && <Latex>{"$" + latexFormula + "$"}</Latex>}
          </div>
        </div>

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
