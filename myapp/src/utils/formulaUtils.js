/**
 * Tokenizes a mathematical formula string into an array of tokens
 */
export const tokenize = (formula) => {
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

/**
 * Parses an array of tokens into an Abstract Syntax Tree (AST)
 */
export const parse = (tokens) => {
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

/**
 * Evaluates an AST with given variable values
 */
export const evaluate = (ast, variables) => {
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

/**
 * Converts an AST to LaTeX notation
 */
export const astToLatex = (ast) => {
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

/**
 * Converts a formula string to LaTeX notation
 */
export const convertToLatex = (input) => {
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
