# babel-transform-mutable-react-state

> (WIP) Use mutable variable declarations as state in react

[![Test](https://github.com/barelyhuman/babel-transform-mutable-react-state/actions/workflows/test.yml/badge.svg)](https://github.com/barelyhuman/babel-transform-mutable-react-state/actions/workflows/test.yml)

**UNSTABLE**
**The plugin is still under development so isn't recommended for production**

## Install

TBD

## Usage

You write state with a prefix `$` and that's converted to `useState` accordingly.

```jsx
import * as React from 'react'

function Component() {
	let $a = 1

	const onPress = () => {
		$a += 1
	}

	return (
		<div>
			<p>{$a}</p>
			<button onClick={onPress}>Press</button>
		</div>
	)
}
```

```jsx
import * as React from 'react'

function Component() {
	const [a, setA] = React.useState(1)

	const onPress = () => {
		setA(a + 1)
	}

	return (
		<div>
			<p>{a}</p>
			<button onClick={onPress}>Press</button>
		</div>
	)
}
```

## License

[MIT](/LICENSE)
