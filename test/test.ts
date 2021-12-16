import test from 'ava'
import {transform} from '@babel/core'
import plugin from '../'

const compile = (code: string) =>
  transform(code, {
    presets: ['@babel/preset-react'],
    plugins: [plugin],
  })

test('Simple Transform', (t) => {
  const code = `
    import * as React from "react"
    
    function Component(){
        let $a = 1;
    
        const onPress = () => {
            $a += 1;
        }
    
        return <div>
            <p>{$a}</p>
            <button onClick={onPress}>Press</button>
        </div>;
    }
    `

  const result = compile(code)
  if (!result) {
    return t.fail()
  }
  t.snapshot(result.code)
})

test('Check Functional Scope', (t) => {
  const code = `
    import * as React from "react"
    
    let $b = 2;

    function Component(){
        let $a = 1;
    
        const onPress = () => {
            $a += 1;
            $b = 3;
        }
    
        return <div>
            <p>{$a}</p>
            <button onClick={onPress}>Press</button>
        </div>;
    }`

  const result = compile(code)
  if (!result) {
    return t.fail()
  }
  t.snapshot(result.code)
})

test('Check Arrow Function Scope', (t) => {
  const code = `
    import * as React from "react";

    let $b = 2;
    
    const Component = () => {
      let $a = 1;
    
      const onPress = () => {
        $a += 1;
        $b = 3;
      };
    
      return (
        <div>
          <p>{$a}</p>
          <button onClick={onPress}>Press</button>
        </div>
      );
    };
    `

  const result = compile(code)
  if (!result) {
    return t.fail()
  }
  t.snapshot(result.code)
})

test('Multi Component Scope', (t) => {
  const code = `
    import * as React from "react";

    let $b = 2;

    const Component = () => {
    let $a = 1;

    const onPress = () => {
        $a += 1;
        $b = 3;
    };

    return (
        <div>
        <p>{$a}</p>
        <button onClick={onPress}>Press</button>
        </div>
    );
    };

    const ComponentTwo = () => {
    let $a = 3;

    const onPress = () => {
        $a = 5;
        $b = 3;
    };

    return (
        <div>
        <p>{$a}</p>
        <button onClick={onPress}>Press</button>
        </div>
    );
    };
`

  const result = compile(code)
  if (!result) {
    return t.fail()
  }
  t.snapshot(result.code)
})
