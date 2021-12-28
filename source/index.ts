import * as t from '@babel/types'

interface ToModifyVariableI {
  raw: string
  simplified: string
}

export default function () {
  let toMod: ToModifyVariableI[] = []
  return {
    visitor: {
      VariableDeclaration(path: any) {
        toMod = toMod.concat(getReactiveVariablesFromScope(path.scope))
        const {node}: {node: t.VariableDeclaration} = path
        transformReactiveDeclarations(node, toMod, path)
      },
      Identifier(path: any) {
        const {node}: {node: t.Identifier} = path
        if (
          !t.isUpdateExpression(path.parentPath) &&
          !t.isAssignmentExpression(path.parentPath) &&
          !t.isCallExpression(path.parentPath)
        ) {
          if (isReactiveIdentifier(node.name, toMod)) {
            path.replaceWith(getStateTuple(node.name))
          }
        }
      },
      ExpressionStatement({node}: {node: t.ExpressionStatement}) {
        transformAssignmentExpression(node, toMod)
      },
      CallExpression(path: any) {
        if (isReadingReactiveValue(path.node, toMod)) {
          path.replaceWith(getNormalIdentifierFromCall(path.node))
        }
      },
    },
  }
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
    // path.scope.rename(declaration.id.name, normName)
  }
}

function transformAssignmentExpression(
  node: t.ExpressionStatement,
  toMod: ToModifyVariableI[]
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

  let callArgs: t.Expression[]

  switch (expression.operator) {
    case '=': {
      callArgs = [{...expression.right}]
      break
    }

    case '+=': {
      callArgs = [
        t.binaryExpression('+', t.identifier(normName), expression.right),
      ]
      break
    }

    case '-=': {
      callArgs = [
        t.binaryExpression('-', t.identifier(normName), expression.right),
      ]
      break
    }

    case '/=': {
      callArgs = [
        t.binaryExpression('/', t.identifier(normName), expression.right),
      ]
      break
    }

    case '*=': {
      callArgs = [
        t.binaryExpression('*', t.identifier(normName), expression.right),
      ]
      break
    }
    default: {
      callArgs = []
    }
  }

  node.expression = t.callExpression(t.identifier(setterName), callArgs)
}

function isReactiveIdentifier(idName: string, modMap: ToModifyVariableI[]) {
  return modMap.findIndex((x) => x.raw === idName) > -1
}

function getSetterName(normalizedName: string) {
  return (
    'set' + normalizedName.charAt(0).toUpperCase() + normalizedName.slice(1)
  )
}

function normalizeName(n: string) {
  return n.replace(/\$/, '')
}

function getStateTuple(reactiveVaribleName: string) {
  const name = normalizeName(reactiveVaribleName)
  const setter = getSetterName(name)
  return t.arrayExpression([t.identifier(name), t.identifier(setter)])
}

function getNormalIdentifierFromCall(node: t.CallExpression) {
  if (!t.isIdentifier(node.callee)) {
    return
  }

  const name = normalizeName(node.callee.name)
  return t.identifier(name)
}

function isReadingReactiveValue(
  node: t.CallExpression,
  modMap: ToModifyVariableI[]
) {
  if (
    !(
      t.isIdentifier(node.callee) &&
      isReactiveIdentifier(node.callee.name, modMap)
    )
  ) {
    return false
  }
  return true
}

function getReactiveVariablesFromScope(scope: any) {
  const toMod: ToModifyVariableI[] = []
  Object.keys(scope.bindings).forEach((binding) => {
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
  return toMod
}
