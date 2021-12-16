# babel-plugin-mutable-react-state

> (WIP) Use mutable variable declarations as state in react

[![Test](https://github.com/barelyhuman/babel-plugin-mutable-react-state/actions/workflows/test.yml/badge.svg)](https://github.com/barelyhuman/babel-plugin-mutable-react-state/actions/workflows/test.yml)

**UNSTABLE**
**The plugin is still under development so isn't recommended for production**

## Caveats (for now)

- Doesn't support pragma right now
- Update Expressions aren't supported (eg: variableName++) on numbers won't work.

## Install

The plugin assumes you already have `jsx` enabled on babel or are using `preset-react` in your setup.

```sh
npm i babel-plugin-mutable-react-state
# or
yarn add babel-plugin-mutable-react-state
```

```jsonc
// .babelrc
[
  {
    "plugins": ["babel-plugin-mutable-react-state"]
  }
]
```

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

 ↓ ↓ ↓ ↓ ↓ ↓

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
