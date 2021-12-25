import * as t from '@babel/types'

interface ToModifyVariableI {
  raw: string
  simplified: string
}

export default function toMutableTransformer() {
  const toMod: ToModifyVariableI[] = []
  return {
    visitor: {
      FunctionDeclaration(path: any) {
        transformToStateByScope(path, toMod)
      },
      ArrowFunctionExpression(path: any) {
        transformToStateByScope(path, toMod)
      },
    },
  }
}

function transformToStateByScope(path: any, toMod: ToModifyVariableI[]) {
  // TODO: check if the returned values are of the form `React.createElement`
  // NOTE: can avoid the above one since custom hooks won't be able to use this

  Object.keys(path.scope.bindings).forEach((binding) => {
    if (/^\$/.test(binding)) {
      // add to list of identifiers to compare and replace
      // (not using scope replace to avoid shadow variables being replaced)
      const normName = normalizeName(binding)
      toMod.push({
        raw: binding,
        simplified: normName,
      })
    }
  })

  // nested traverse to avoid replacing bindings of anything other than what's in this
  // function. To prevent creating state hooks outside a function
  path.traverse({
    Identifier({node}: {node: t.Identifier}) {
      if (isReactiveIdentifier(node.name, toMod)) {
        node.name = normalizeName(node.name)
      }
    },
    VariableDeclaration({node}: {node: t.VariableDeclaration}) {
      transformReactiveDeclarations(node, toMod, path)
    },
    ExpressionStatement(expressionPath: any) {
      const node: t.ExpressionStatement = expressionPath.node
      const replacedStateExpression = transformAssignmentExpression(
        node,
        toMod,
        expressionPath
      )
      transformUpdateExpression(node, toMod)

      // HACK: any identifier inside the replace expression that is reactive to change itself to
      // the substate name so $a => a => _prevState
      if (replacedStateExpression) {
        const {subStateIdentifier, normName} = replacedStateExpression
        replaceIdentifiers(expressionPath, normName, subStateIdentifier.name)
      }
    },
  })
}

function transformReactiveDeclarations(
  node: t.VariableDeclaration,
  toMod: ToModifyVariableI[],
  path: any
) {
  for (let i = 0; i < node.declarations.length; i += 1) {
    const declaration = node.declarations[i]

    if (
      !(
        t.isIdentifier(declaration.id) &&
        isReactiveIdentifier(declaration.id.name, toMod)
      )
    ) {
      continue
    }

    // change to const if it's `let` by any chance
    node.kind = 'const'

    const normName = normalizeName(declaration.id.name)
    const setterName = getSetterName(normName)

    // convert to `const [x,setX] = React.useState()`
    node.declarations[i] = t.variableDeclarator(
      t.arrayPattern([t.identifier(normName), t.identifier(setterName)]),
      t.callExpression(
        t.memberExpression(t.identifier('React'), t.identifier('useState')),
        declaration.init ? [declaration.init] : []
      )
    )

    // fallback to replace missed instances of the variable
    path.scope.rename(declaration.id.name, normName)
  }
}

function transformAssignmentExpression(
  node: t.ExpressionStatement,
  toMod: ToModifyVariableI[],
  path: any
) {
  if (!t.isAssignmentExpression(node.expression)) {
    return
  }
  //HACK: forced to assignment expression for now, will need to switch to a `switch`
  // statement when working with both Assignment(=,+=,-=,etc) and Update expressions(++,--,**,etc)
  const expression: t.AssignmentExpression = node.expression

  if (!t.isIdentifier(expression.left)) {
    return
  }

  if (!isReactiveIdentifier(expression.left.name, toMod)) {
    return
  }

  const normName = normalizeName(expression.left.name)
  const setterName = getSetterName(normName)

  const subStateIdentifier: t.Identifier =
    path.scope.generateUidIdentifier('prevState')

  let params: any = {}

  switch (expression.operator) {
    case '=': {
      params = expression.right
      break
    }

    case '+=': {
      params = t.binaryExpression('+', subStateIdentifier, expression.right)
      break
    }

    case '-=': {
      params = t.binaryExpression('-', subStateIdentifier, expression.right)
      break
    }

    case '/=': {
      params = t.binaryExpression('/', subStateIdentifier, expression.right)

      break
    }

    case '*=': {
      params = t.binaryExpression('*', subStateIdentifier, expression.right)
      break
    }
    default: {
      params = []
    }
  }

  let arrowExpression = params
  if (!t.isArrowFunctionExpression(params)) {
    arrowExpression = t.arrowFunctionExpression([subStateIdentifier], params)
  }

  node.expression = t.callExpression(t.identifier(setterName), [
    arrowExpression,
  ])

  return {subStateIdentifier, normName, setterName}
}

function transformUpdateExpression(
  node: t.ExpressionStatement,
  toMod: ToModifyVariableI[]
) {
  if (!t.isUpdateExpression(node.expression)) {
    return
  }

  const expression: t.UpdateExpression = node.expression

  if (!t.isIdentifier(expression.argument)) {
    return
  }

  if (!isReactiveIdentifier(expression.argument.name, toMod)) {
    return
  }

  const normName = normalizeName(expression.argument.name)
  const setterName = getSetterName(normName)

  let callArgs: t.Expression[]

  switch (expression.operator) {
    case '++': {
      callArgs = [
        t.binaryExpression('+', t.identifier(normName), t.numericLiteral(1)),
      ]
      break
    }
    case '--': {
      callArgs = [
        t.binaryExpression('-', t.identifier(normName), t.numericLiteral(1)),
      ]
      break
    }
  }

  node.expression = t.callExpression(t.identifier(setterName), callArgs)
}

function isReactiveIdentifier(idName: string, modMap: ToModifyVariableI[]) {
  return (
    modMap.findIndex((x) => x.raw === idName || x.simplified === idName) > -1
  )
}

function getSetterName(normalizedName: string) {
  return (
    'set' + normalizedName.charAt(0).toUpperCase() + normalizedName.slice(1)
  )
}

function normalizeName(n: string) {
  return n.replace(/\$/, '')
}

function replaceIdentifiers(path: any, toCompare: string, replaceWith: string) {
  return path.traverse({
    Identifier({node}: {node: t.Identifier}) {
      if (node.name === toCompare) {
        node.name = replaceWith
      }
    },
  })
}
