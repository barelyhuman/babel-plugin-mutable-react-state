import * as t from '@babel/types'

interface ToModifyVariableI {
	raw: string
	simplified: string
}

export default function () {
	const toMod: ToModifyVariableI[] = []
	return {
		visitor: {
			FunctionDeclaration(path: any) {
				Object.keys(path.scope.bindings).forEach((binding) => {
					if (/^\$/.test(binding)) {
						const normName = normalizeName(binding)
						// add to list of identifiers to compare and replace
						// (not using scope replace to avoid shadow variables being replaced)
						toMod.push({
							raw: binding,
							simplified: normName,
						})
					}
				})

				path.traverse({
					Identifier({node}: {node: t.Identifier}) {
						if (isReactiveIdentifier(node.name, toMod)) {
							node.name = normalizeName(node.name)
						}
					},
					VariableDeclaration({node}: {node: t.VariableDeclaration}) {
						for (let i = 0; i < node.declarations.length; i += 1) {
							const declaration = node.declarations[i]

							if (
								!(
									t.isIdentifier(declaration.id) &&
									/^\$/.test(declaration.id.name)
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
								t.arrayPattern([
									t.identifier(normName),
									t.identifier(setterName),
								]),
								t.callExpression(
									t.memberExpression(
										t.identifier('React'),
										t.identifier('useState')
									),
									declaration.init ? [declaration.init] : []
								)
							)
						}
					},
					ExpressionStatement({node}: {node: t.ExpressionStatement}) {
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
									t.binaryExpression(
										'+',
										t.identifier(normName),
										expression.right
									),
								]
								break
							}

							case '-=': {
								callArgs = [
									t.binaryExpression(
										'-',
										t.identifier(normName),
										expression.right
									),
								]
								break
							}

							case '/=': {
								callArgs = [
									t.binaryExpression(
										'/',
										t.identifier(normName),
										expression.right
									),
								]
								break
							}

							case '*=': {
								callArgs = [
									t.binaryExpression(
										'*',
										t.identifier(normName),
										expression.right
									),
								]
								break
							}
							default: {
								callArgs = []
							}
						}

						node.expression = t.callExpression(
							t.identifier(setterName),
							callArgs
						)
					},
				})
			},
		},
	}
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
