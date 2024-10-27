import React from "react";
import { useFormulaCalculator, useSavedFormulas } from "./CustomHooks/hooks";
import ErrorDisplay from "./Components/errorDisplay";
import FormulaInput from "./Components/formulaInput";
import { LatexPreview } from "./Components/latexPreview";
import SavedFormulas from "./Components/savedFormulas";
import VariablesInput from "./Components/variableInput";
import ResultDisplay from "./Components/resultDisplay";
import { convertToLatex } from "./utils/formulaUtils";

function App() {
  const {
    formula,
    variables,
    result,
    error,
    latexFormula,
    handleFormulaChange,
    handleVariableChange,
  } = useFormulaCalculator();

  const {
    savedFormulas,
    isListOpen,
    setIsListOpen,
    handleSaveFormula,
    handleDeleteFormula,
  } = useSavedFormulas(formula);

  return (
    <div className="app-container">
      <div className="calculator-card">
        <h1 className="title">Simple Formula Calculator</h1>

        <FormulaInput
          formula={formula}
          onFormulaChange={handleFormulaChange}
          onSaveFormula={() => handleSaveFormula(formula)}
          isSaveDisabled={!formula || savedFormulas.includes(formula)}
        />

        <SavedFormulas
          isListOpen={isListOpen}
          setIsListOpen={setIsListOpen}
          savedFormulas={savedFormulas}
          onLoadFormula={handleFormulaChange}
          onDeleteFormula={handleDeleteFormula}
          convertToLatex={convertToLatex}
        />

        <LatexPreview latexFormula={latexFormula} />

        <VariablesInput
          variables={variables}
          onVariableChange={handleVariableChange}
        />

        <ResultDisplay result={result} />

        <ErrorDisplay error={error} />

        <div className="support-info text-sm text-gray-600 mt-2">
          <p>
            Supports: Complex arithmetic operations (+, -, *, /), exponents (^),
            parentheses and logarithms. Nested exponents like x^(a+b)^z are
            supported.
          </p>
        </div>
      </div>
    </div>
  );
}

export default App;
