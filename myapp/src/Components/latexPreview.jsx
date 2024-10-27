import Latex from "react-latex-next";
import "katex/dist/katex.min.css";

export const LatexPreview = ({ latexFormula }) => {
  return (
    <div className="latex-preview">
      <h2 className="preview-title">LaTeX Preview</h2>
      <div className="latex-output">
        {latexFormula && <Latex>{"$" + latexFormula + "$"}</Latex>}
      </div>
    </div>
  );
};
