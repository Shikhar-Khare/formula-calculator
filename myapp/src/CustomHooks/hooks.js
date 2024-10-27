import { useState, useEffect } from "react";
import {
  tokenize,
  parse,
  evaluate,
  convertToLatex,
} from "../utils/formulaUtils";

export const useFormulaCalculator = () => {
  const [formula, setFormula] = useState("");
  const [variables, setVariables] = useState({});
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  const [latexFormula, setLatexFormula] = useState("");

  const evaluateFormula = (formula, variables) => {
    if (!formula.trim()) {
      setResult(null);
      setError("");
      return null;
    }

    try {
      const tokens = tokenize(formula);
      const ast = parse(tokens);
      const calculatedResult = evaluate(ast, variables);

      if (isNaN(calculatedResult)) {
        setError("Invalid Expression");
        return "Invalid Expression";
      }

      setError("");
      return calculatedResult;
    } catch (error) {
      console.error("Evaluation error:", error);
      setError(error.message || "Invalid Formula");
      return error.message || "Invalid Formula";
    }
  };

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
  };

  const handleFormulaChange = (newFormula) => {
    setFormula(newFormula);
    setLatexFormula(convertToLatex(newFormula));
    updateVariables(newFormula);
  };

  const handleVariableChange = (key, value) => {
    const updatedVariables = { ...variables, [key]: parseFloat(value) || 0 };
    setVariables(updatedVariables);
    const calculatedResult = evaluateFormula(formula, updatedVariables);
    setResult(calculatedResult);
  };

  // Initial evaluation
  useEffect(() => {
    if (formula) {
      updateVariables(formula);
    }
  }, []);

  return {
    formula,
    variables,
    result,
    error,
    latexFormula,
    handleFormulaChange,
    handleVariableChange,
  };
};
// hooks/useSavedFormulas.js

export const useSavedFormulas = () => {
  const [savedFormulas, setSavedFormulas] = useState([]);
  const [isListOpen, setIsListOpen] = useState(false);

  useEffect(() => {
    const savedFormulasList =
      JSON.parse(localStorage.getItem("savedFormulas")) || [];
    savedFormulasList.length && setSavedFormulas(savedFormulasList);
  }, []);

  useEffect(() => {
    localStorage.setItem("savedFormulas", JSON.stringify(savedFormulas));
  }, [savedFormulas]);

  const handleSaveFormula = (formula) => {
    if (formula && !savedFormulas.includes(formula)) {
      setSavedFormulas([...savedFormulas, formula]);
    }
  };

  const handleDeleteFormula = (formulaToDelete) => {
    setSavedFormulas(savedFormulas.filter((f) => f !== formulaToDelete));
  };

  return {
    savedFormulas,
    isListOpen,
    setIsListOpen,
    handleSaveFormula,
    handleDeleteFormula,
  };
};

// components/ErrorDisplay.js
export const ErrorDisplay = ({ error }) => {
  if (!error) return null;

  return (
    <div className="error-display">
      <p className="error-message">{error}</p>
    </div>
  );
};
