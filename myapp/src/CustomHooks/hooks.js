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
    setError(typeof calculatedResult === "string" ? calculatedResult : "");
  };

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

export const useSavedFormulas = (initialFormula) => {
  const [savedFormulas, setSavedFormulas] = useState([]);
  const [isListOpen, setIsListOpen] = useState(false);

  useEffect(() => {
    const savedFormulasList =
      JSON.parse(localStorage.getItem("savedFormulas")) || [];
    setSavedFormulas(savedFormulasList);
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
