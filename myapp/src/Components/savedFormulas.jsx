import Latex from "react-latex-next";

const SavedFormulas = ({
  isListOpen,
  setIsListOpen,
  savedFormulas,
  onLoadFormula,
  onDeleteFormula,
  convertToLatex,
}) => {
  return (
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
                onClick={() => onLoadFormula(savedFormula)}
              >
                <div className="formula-latex">
                  <Latex>{"$" + convertToLatex(savedFormula) + "$"}</Latex>
                </div>
                <button
                  className="delete-button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onDeleteFormula(savedFormula);
                  }}
                >
                  ×
                </button>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
};

export default SavedFormulas;
