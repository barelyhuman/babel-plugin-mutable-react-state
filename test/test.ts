import test from 'ava'
import {transform} from '@babel/core'
import plugin from '../'

const compile = (code: string) =>
	transform(code, {
		presets: ['@babel/preset-react'],
		plugins: [plugin],
	})

test('works', (t) => {
	const code = `
    import * as React from "react"
    
    function Component(){
        let $a = 1;
    
        const onClick = () => {
            $a += 1;
        }
    
        return <div>
            <p>{$a}</p>
            <button onPress={onClick}>Press</button>
        </div>;
    }
    `

	const result = compile(code)
	if (!result) {
		return t.fail()
	}
	t.snapshot(result.code)
})
