# babel-plugin-mutable-react-state

> (WIP) Use mutable variable declarations as state in react

[![Test](https://github.com/barelyhuman/babel-plugin-mutable-react-state/actions/workflows/test.yml/badge.svg)](https://github.com/barelyhuman/babel-plugin-mutable-react-state/actions/workflows/test.yml)

**UNSTABLE**
**The plugin is still under development so isn't recommended for production**

## Caveats (for now)

Check [this issue](https://github.com/barelyhuman/babel-plugin-mutable-react-state/issues/4)


## Notes
- While the caveats exist due to the extensive types of expressions that javascript has, it's recommended that you use a cloned variable and then just assigned the modification to the reactive variable if you plan to use it right now. 
```jsx

function Component(){
  let $text = "";
  
  return <> 
    <input value={$text}  onChange={e=> {
      $text = e.target.value;
      // some code 
      
      // won't work...
      $text = $text.toUpperCase()
    }}/>
  </>
}

// CAN be written as 

function Component(){
  let $text = "";
  
  return <> 
    <input value={$text}  onChange={e=> {
      const val = e.target.value;
      // some code 
      
      // will work...
      $text = val.toUpperCase()
    }}/>
  </>
}

```



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
