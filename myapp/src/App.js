import React, { useState } from "react";
import Latex from "react-latex-next";
import "katex/dist/katex.min.css";

const evaluateFormula = (formula, variables) => {
  try {
    // Replace variables with their values
    let processedFormula = formula;
    Object.keys(variables).forEach((variable) => {
      const regex = new RegExp(`\\b${variable}\\b`, "g");
      processedFormula = processedFormula.replace(regex, variables[variable]);
    });

    const evaluateExpression = (expr) => {
      // Remove spaces
      expr = expr.replace(/\s+/g, "");

      // Find innermost parentheses and evaluate them first
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
      // Handle exponents
      while (expr.match(/(-?\d*\.?\d+)\^(-?\d*\.?\d+)/)) {
        expr = expr.replace(/(-?\d*\.?\d+)\^(-?\d*\.?\d+)/g, (_, base, exp) =>
          Math.pow(parseFloat(base), parseFloat(exp))
        );
      }

      // Handle multiplication and division
      while (expr.match(/(-?\d*\.?\d+)([*/])(-?\d*\.?\d+)/)) {
        expr = expr.replace(
          /(-?\d*\.?\d+)([*/])(-?\d*\.?\d+)/g,
          (_, a, op, b) => {
            a = parseFloat(a);
            b = parseFloat(b);
            return op === "*" ? a * b : b === 0 ? NaN : a / b;
          }
        );
      }

      // Handle addition and subtraction
      while (expr.match(/(-?\d*\.?\d+)([+-])(-?\d*\.?\d+)/)) {
        expr = expr.replace(
          /(-?\d*\.?\d+)([+-])(-?\d*\.?\d+)/g,
          (_, a, op, b) => {
            return op === "+"
              ? parseFloat(a) + parseFloat(b)
              : parseFloat(a) - parseFloat(b);
          }
        );
      }

      // If the expression is just a number, return it
      if (/^-?\d*\.?\d+$/.test(expr)) {
        return parseFloat(expr);
      }

      return NaN;
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

  // Remove spaces
  let formula = input.replace(/\s+/g, "");

  // Handle simple exponents
  formula = formula.replace(/\^([a-zA-Z\d])/g, "^{$1}");

  // Handle complex exponents with subscripts inside parentheses
  formula = formula.replace(/\^[\(]([^)]+)[\)]/g, (_, group) => {
    const convertedGroup = group.replace(
      /([a-zA-Z])_([a-zA-Z\d]+)/g,
      "$1_{$2}"
    );
    return `^{${convertedGroup}}`;
  });

  // Handle simple subscripts
  formula = formula.replace(/([a-zA-Z])_([a-zA-Z\d]+)/g, "$1_{$2}");

  // Replace operators
  formula = formula.replace(/\*/g, "\\cdot ");
  formula = formula.replace(/\//g, "\\div ");

  // Handle parentheses
  formula = formula.replace(/\(/g, "\\left(");
  formula = formula.replace(/\)/g, "\\right)");

  // Add spaces around operators
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
    setLatexFormula(convertToLatex(newFormula));

    // Extract variables
    const variableRegex = /\b[a-zA-Z]\b/g;
    const matchedVariables = [
      ...new Set(newFormula.match(variableRegex) || []),
    ];

    const newVariables = {};
    matchedVariables.forEach(
      (variable) => (newVariables[variable] = variables[variable] || 0)
    );
    setVariables(newVariables);

    // Calculate result
    const calculatedResult = evaluateFormula(newFormula, newVariables);
    setResult(calculatedResult);
    setError(
      calculatedResult === "Invalid Formula" ? "Invalid formula entered" : ""
    );
  };

  const handleVariableChange = (key, value) => {
    const updatedVariables = { ...variables, [key]: parseFloat(value) || 0 };
    setVariables(updatedVariables);

    // Recalculate result when variables change
    const calculatedResult = evaluateFormula(formula, updatedVariables);
    setResult(calculatedResult);
    setError(
      calculatedResult === "Invalid Formula" ? "Invalid formula entered" : ""
    );
  };

  return (
    <div className="app-container">
      <div className="calculator-card">
        <h1 className="title">Simple Formula Calculator</h1>

        <div className="input-group">
          <label className="label">Enter Formula</label>
          <input
            type="text"
            placeholder="e.g., (x + y)^2 * z"
            value={formula}
            onChange={handleFormulaChange}
            className="input-field"
          />
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
