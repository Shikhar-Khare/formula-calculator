import React, { useState, useEffect } from "react";
import Latex from "react-latex-next";
import "katex/dist/katex.min.css";

const tokenize = (formula) => {
  const tokens = [];
  let current = "";
  let i = 0;

  while (i < formula.length) {
    const char = formula[i];

    // Handle whitespace
    if (/\s/.test(char)) {
      if (current) {
        tokens.push(current);
        current = "";
      }
      i++;
      continue;
    }

    // Handle operators and parentheses
    if ("+-*/^()".includes(char)) {
      if (current) {
        tokens.push(current);
        current = "";
      }
      tokens.push(char);
      i++;
      continue;
    }

    // Look ahead for 'log' or 'ln' functions
    if (char === "l") {
      if (formula.substring(i, i + 2) === "ln") {
        if (current) {
          tokens.push(current);
          current = "";
        }
        tokens.push("ln");
        i += 2;
        continue;
      }
      if (formula.substring(i, i + 3) === "log") {
        if (current) {
          tokens.push(current);
          current = "";
        }
        tokens.push("log");
        i += 3;
        continue;
      }
    }

    current += char;
    i++;
  }

  if (current) {
    tokens.push(current);
  }

  return tokens;
};

const parse = (tokens) => {
  let position = 0;

  const parseNumber = () => {
    const token = tokens[position];
    if (!token) return null;
    const num = parseFloat(token);
    if (!isNaN(num)) {
      position++;
      return { type: "number", value: num };
    }
    return null;
  };

  const parseVariable = () => {
    const token = tokens[position];
    if (!token) return null;
    if (/^[a-zA-Z]$/.test(token)) {
      position++;
      return { type: "variable", name: token };
    }
    return null;
  };

  const parseFunction = () => {
    const token = tokens[position];
    if (!token) return null;

    if (token === "ln" || token === "log") {
      position++; // consume function name
      if (tokens[position] !== "(") {
        throw new Error(`Missing opening parenthesis after ${token}`);
      }
      position++; // consume '('
      const arg = parseExpression();
      if (tokens[position] !== ")") {
        throw new Error(`Missing closing parenthesis after ${token} argument`);
      }
      position++; // consume ')'
      return {
        type: "function",
        name: token,
        argument: arg,
      };
    }
    return null;
  };

  const parseFactor = () => {
    if (tokens[position] === "(") {
      position++; // consume '('
      const expr = parseExpression();
      if (tokens[position] === ")") {
        position++; // consume ')'
        return expr;
      }
      throw new Error("Missing closing parenthesis");
    }

    return parseFunction() || parseNumber() || parseVariable();
  };

  const parsePower = () => {
    let left = parseFactor();

    while (tokens[position] === "^") {
      position++; // consume '^'
      const right = parsePower(); // right-associative
      left = {
        type: "operator",
        operator: "^",
        left,
        right,
      };
    }

    return left;
  };

  const parseTerm = () => {
    let left = parsePower();

    while (tokens[position] === "*" || tokens[position] === "/") {
      const operator = tokens[position];
      position++; // consume operator
      const right = parsePower();
      left = {
        type: "operator",
        operator,
        left,
        right,
      };
    }

    return left;
  };

  const parseExpression = () => {
    let left = parseTerm();

    while (tokens[position] === "+" || tokens[position] === "-") {
      const operator = tokens[position];
      position++; // consume operator
      const right = parseTerm();
      left = {
        type: "operator",
        operator,
        left,
        right,
      };
    }

    return left;
  };

  return parseExpression();
};

const evaluate = (ast, variables) => {
  if (!ast) return 0;

  const MAX_SAFE_RESULT = 1e308;

  const checkValue = (value) => {
    if (!isFinite(value)) {
      throw new Error("Maximum value reached: Result is too large");
    }
    if (Math.abs(value) > MAX_SAFE_RESULT) {
      throw new Error(
        "Maximum value reached: Result exceeds safe calculation limit"
      );
    }
    return value;
  };

  try {
    switch (ast.type) {
      case "number":
        return checkValue(ast.value);
      case "variable":
        return checkValue(variables[ast.name] || 0);
      case "function":
        const argValue = evaluate(ast.argument, variables);
        if (argValue <= 0) {
          throw new Error(`Cannot compute logarithm of ${argValue}`);
        }
        switch (ast.name) {
          case "ln":
            return checkValue(Math.log(argValue));
          case "log":
            return checkValue(Math.log10(argValue));
          default:
            throw new Error(`Unknown function: ${ast.name}`);
        }
      case "operator":
        const left = evaluate(ast.left, variables);
        const right = evaluate(ast.right, variables);

        let result;
        switch (ast.operator) {
          case "+":
            result = left + right;
            break;
          case "-":
            result = left - right;
            break;
          case "*":
            result = left * right;
            break;
          case "/":
            if (right === 0) {
              throw new Error("Division by zero");
            }
            result = left / right;
            break;
          case "^":
            if (right > 1000) {
              throw new Error("Maximum value reached: Exponent too large");
            }
            if (Math.abs(left) > 1e154 && right > 2) {
              throw new Error(
                "Maximum value reached: Base value too large for exponentiation"
              );
            }
            result = Math.pow(left, right);
            break;
          default:
            return NaN;
        }
        return checkValue(result);
      default:
        return NaN;
    }
  } catch (error) {
    throw error;
  }
};

const astToLatex = (ast) => {
  if (!ast) return "";

  switch (ast.type) {
    case "number":
      return ast.value.toString();
    case "variable":
      return ast.name;
    case "function":
      const arg = astToLatex(ast.argument);
      switch (ast.name) {
        case "ln":
          return `\\ln(${arg})`;
        case "log":
          return `\\log_{10}(${arg})`;
        default:
          return "";
      }
    case "operator":
      const left = astToLatex(ast.left);
      const right = astToLatex(ast.right);
      switch (ast.operator) {
        case "+":
          return `${left} + ${right}`;
        case "-":
          return `${left} - ${right}`;
        case "*":
          return `${left} \\cdot ${right}`;
        case "/":
          return `\\frac{${left}}{${right}}`;
        case "^":
          const needsParens = ast.left.type === "operator";
          const leftPart = needsParens ? `\\left(${left}\\right)` : left;
          return `${leftPart}^{${right}}`;
        default:
          return "";
      }
    default:
      return "";
  }
};

const evaluateFormula = (formula, variables) => {
  try {
    const tokens = tokenize(formula);
    const ast = parse(tokens);
    const result = evaluate(ast, variables);
    return isNaN(result) ? "Invalid Expression" : result;
  } catch (error) {
    console.error("Evaluation error:", error);
    return error.message || "Invalid Formula";
  }
};

const convertToLatex = (input) => {
  if (!input) return "";
  try {
    const tokens = tokenize(input);
    const ast = parse(tokens);
    return astToLatex(ast);
  } catch (error) {
    console.error("LaTeX conversion error:", error);
    return input;
  }
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
    setError(typeof calculatedResult === "string" ? calculatedResult : "");
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
    setError(typeof calculatedResult === "string" ? calculatedResult : "");
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
              placeholder="e.g., x^(a+b)^z"
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

        <div className="support-info text-sm text-gray-600 mt-2">
          <p>
            Supports: Basic arithmetic operations (+, -, *, /), exponents (^),
            and parentheses. Nested exponents like x^(a+b)^z are supported.
            Maximum safe calculation limits apply.
          </p>
        </div>
      </div>
    </div>
  );
}

export default App;
