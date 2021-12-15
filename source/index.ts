// TODO: remove when converting to plugin
import { parse } from "@babel/parser";
import traverse from "@babel/traverse";
import * as t from "@babel/types";
import generate from "@babel/generator";
// ----

// TODO: remove when converting to plugin
const codeSnippet = `
import * as React from "react";

function Main(){
    let $aBara = 1;

    const handlePress = ()=>{
        $aBara=2
    }

    return <>
        <p>{$aBara}</p>
        <button onPress={handlePress}>Press</button>
    </>
}
`;
// ----

// TODO: remove when converting to plugin
const ast = parse(codeSnippet, {
  sourceType: "module",
  plugins: ["jsx"],
});
// ----

// TODO: move to a single functional scope with check for a react node
const toMod = [];

traverse(ast, {
  Identifier({ node }) {
    if (isReactiveIdentifier(node.name, toMod)) {
      node.name = normalizeName(node.name);
    }
  },
  VariableDeclaration({ node }) {
    for (let i = 0; i < node.declarations.length; i += 1) {
      const declaration = node.declarations[i];

      if (!/^\$/.test(declaration.id.name)) {
        continue;
      }

      const normName = normalizeName(declaration.id.name);
      const setterName = getSetterName(normName);

      toMod.push({
        raw: declaration.id.name,
        simplified: normName,
      });

      node.declarations[i] = {
        type: "VariableDeclarator",
        kind: "const",
        id: {
          type: "ArrayPattern",
          elements: [t.identifier(normName), t.identifier(setterName)],
        },

        init: {
          type: "CallExpression",
          callee: {
            type: "MemberExpression",
            object: t.identifier("React"),
            property: t.identifier("useState"),
          },
          arguments: [declaration.init],
        },
      };
    }
  },
  ExpressionStatement({ node }) {
    const expression = node.expression;

    if (!t.isAssignmentExpression(node.expression)) {
      return;
    }

    if (
      expression.left &&
      t.isIdentifier(expression.left) &&
      !isReactiveIdentifier(expression.left.name, toMod)
    ) {
      return;
    }

    const normName = normalizeName(expression.left.name);
    const setterName = getSetterName(normName);

    let callArgs = [];

    switch (expression.operator) {
      case "=": {
        callArgs = [{ ...expression.right }];
        break;
      }
      case "+=": {
        callArgs = [
          t.binaryExpression("+", t.identifier(normName), expression.right),
        ];
        break;
      }
      case "-=": {
        callArgs = [
          t.binaryExpression("-", t.identifier(normName), expression.right),
        ];
        break;
      }
      case "/=": {
        callArgs = [
          t.binaryExpression("/", t.identifier(normName), expression.right),
        ];
        break;
      }
      case "*=": {
        callArgs = [
          t.binaryExpression("*", t.identifier(normName), expression.right),
        ];
        break;
      }
    }

    node.expression = createCallExpression(setterName, callArgs);
  },
});

function isReactiveIdentifier(idName, modMap) {
  return (
    modMap.findIndex((x) => x.raw === idName || x.simplified === idName) > -1
  );
}

function getSetterName(normalizedName) {
  return (
    "set" + normalizedName.charAt(0).toUpperCase() + normalizedName.slice(1)
  );
}

function normalizeName(n) {
  return String(n).replace(/\$/, "");
}

function createCallExpression(calleeName, args) {
  return {
    type: "CallExpression",
    callee: t.identifier(calleeName),
    arguments: args,
  };
}

// TODO: remove when converting to plugin
const output = generate(ast, {}, codeSnippet);
console.log(
  `
${codeSnippet}

↓ ↓ ↓

${output.code}
`
);
// ----

// TODO: convert to plugin
export default function ({ types: _t }) {
  // plugin contents
  return {
    visitor: {},
  };
}
