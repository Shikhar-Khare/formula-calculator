import React, { useState, useEffect } from "react";
import Latex from "react-latex-next";
import "katex/dist/katex.min.css";
import "./index.css";

// Define mathematical functions and constants
const mathFunctions = {
  sin: (x) => Math.sin((x * Math.PI) / 180), // Convert to radians
  cos: (x) => Math.cos((x * Math.PI) / 180),
  tan: (x) => Math.tan((x * Math.PI) / 180),
  asin: (x) => (Math.asin(x) * 180) / Math.PI, // Convert to degrees
  acos: (x) => (Math.acos(x) * 180) / Math.PI,
  atan: (x) => (Math.atan(x) * 180) / Math.PI,
  log: (x) => (x <= 0 ? NaN : Math.log10(x)),
  ln: (x) => (x <= 0 ? NaN : Math.log(x)),
  sqrt: (x) => (x < 0 ? NaN : Math.sqrt(x)),
  abs: Math.abs,
  exp: Math.exp,
  pi: Math.PI,
  e: Math.E,
};

const evaluateFormula = (formula, variables) => {
  try {
    // First, create a sanitized formula by replacing variables with their values
    let processedFormula = formula;

    // Replace mathematical constants first
    processedFormula = processedFormula
      .replace(/\bpi\b/g, Math.PI)
      .replace(/\be\b/g, Math.E);

    // Replace variables with their values
    Object.keys(variables).forEach((variable) => {
      const regex = new RegExp(`\\b${variable}\\b`, "g");
      processedFormula = processedFormula.replace(regex, variables[variable]);
    });

    // Create a function that will evaluate the expression
    const evaluateExpression = (expr) => {
      // Remove spaces
      expr = expr.replace(/\s+/g, "");

      // Handle nested functions and parentheses
      while (expr.includes("(")) {
        expr = expr.replace(
          /\b(sin|cos|tan|asin|acos|atan|log|ln|sqrt|abs|exp)\((([^()]+)|([^()]*\([^()]+\)[^()]*)+)\)/g,
          (match, func, args) => {
            // Recursively evaluate the arguments
            const evaluatedArgs = evaluateExpression(args);

            // Check if the evaluation was successful
            if (isNaN(evaluatedArgs)) {
              return NaN;
            }

            // Apply the appropriate mathematical function
            const result = mathFunctions[func](evaluatedArgs);
            return isNaN(result) ? NaN : result;
          }
        );

        // Handle remaining parentheses
        expr = expr.replace(/\(([^()]+)\)/g, (match, group) => {
          return evaluateExpression(group);
        });
      }

      // Handle exponents
      while (expr.match(/(-?\d*\.?\d+)\^(-?\d*\.?\d+)/)) {
        expr = expr.replace(
          /(-?\d*\.?\d+)\^(-?\d*\.?\d+)/g,
          (match, base, exp) => {
            return Math.pow(parseFloat(base), parseFloat(exp));
          }
        );
      }

      // Handle multiplication and division
      while (expr.match(/(-?\d*\.?\d+)([*/])(-?\d*\.?\d+)/)) {
        expr = expr.replace(
          /(-?\d*\.?\d+)([*/])(-?\d*\.?\d+)/g,
          (match, a, op, b) => {
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
          (match, a, op, b) => {
            return op === "+"
              ? parseFloat(a) + parseFloat(b)
              : parseFloat(a) - parseFloat(b);
          }
        );
      }

      // Return the final result
      return parseFloat(expr);
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

  // Removing all spaces first
  let formula = input.replace(/\s+/g, "");

  // Handle mathematical constants
  formula = formula.replace(/\bpi\b/g, "\\pi ");
  formula = formula.replace(/\be\b(?![a-zA-Z])/g, "e");

  // Handle mathematical functions
  formula = formula
    .replace(/sin\(/g, "\\sin\\left(")
    .replace(/cos\(/g, "\\cos\\left(")
    .replace(/tan\(/g, "\\tan\\left(")
    .replace(/asin\(/g, "\\arcsin\\left(")
    .replace(/acos\(/g, "\\arccos\\left(")
    .replace(/atan\(/g, "\\arctan\\left(")
    .replace(/log\(/g, "\\log\\left(")
    .replace(/ln\(/g, "\\ln\\left(")
    .replace(/sqrt\(/g, "\\sqrt{")
    .replace(/abs\(/g, "\\left|")
    .replace(/exp\(/g, "\\exp\\left(");

  // Handle special function closings
  formula = formula.replace(/\)(?=[^()*+\-/^]|$)/g, "\\right)");
  formula = formula.replace(/\)(?=\*|\+|-|\/)/g, "\\right)");
  formula = formula.replace(/\)(?=\^)/g, "\\right)");

  // Handle sqrt closing differently
  formula = formula.replace(/\)(?=[\s)*+\-/]|$)/g, (match, offset, string) => {
    if (string.slice(0, offset).includes("\\sqrt{")) {
      return "}";
    }
    return "\\right)";
  });

  // Handle abs closing
  formula = formula.replace(/\)(?=[^()*+\-/^]|$)/g, (match, offset, string) => {
    if (string.slice(0, offset).includes("\\left|")) {
      return "\\right|";
    }
    return "\\right)";
  });

  // Handle complex exponents with subscripts inside parentheses: a^(b_d)
  formula = formula.replace(/\^[\(]([^)]+)[\)]/g, (match, group) => {
    const convertedGroup = group.replace(
      /([a-zA-Z])_([a-zA-Z\d]+)/g,
      "$1_{$2}"
    );
    return `^{${convertedGroup}}`;
  });

  // Handle simple subscripts: b_d
  formula = formula.replace(/([a-zA-Z])_([a-zA-Z\d]+)/g, "$1_{$2}");

  // Handle simple exponents: a^b or a^2
  formula = formula.replace(/\^([a-zA-Z\d])/g, "^{$1}");

  // Replacing multiplication operator
  formula = formula.replace(/\*/g, "\\cdot ");

  // Handling regular parentheses
  formula = formula.replace(/\(/g, "\\left(");
  formula = formula.replace(/\)/g, "\\right)");

  // Handling spaces around operators
  formula = formula.replace(/\+/g, " + ");
  formula = formula.replace(/(?<!^)\s*-\s*/g, " - ");
  formula = formula.replace(/\//g, " \\div ");

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

    // Extract variables, excluding function names and constants
    const functionAndConstantNames = Object.keys(mathFunctions).join("|");
    const variableRegex = new RegExp(
      `\\b(?!(?:${functionAndConstantNames})\\b)[a-zA-Z]\\b`,
      "g"
    );
    const matchedVariables = [
      ...new Set(newFormula.match(variableRegex) || []),
    ];

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
        <h1 className="title">Advanced Formula Calculator</h1>

        {/* Formula Input */}
        <div className="input-group">
          <label className="label">Enter Formula</label>
          <input
            type="text"
            placeholder="e.g., sin(x) + log(y) + sqrt(z^2)"
            value={formula}
            onChange={handleFormulaChange}
            className="input-field"
          />
        </div>

        {/* Support Info */}
        <div className="support-info text-sm text-gray-600 mt-2">
          <p>
            Supported functions: sin, cos, tan, asin, acos, atan, log, ln, sqrt,
            abs, exp
          </p>
          <p>Constants: pi, e</p>
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
          <div className="result-value">
            {result !== null
              ? typeof result === "number"
                ? result.toFixed(6)
                : result
              : "-"}
          </div>
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
