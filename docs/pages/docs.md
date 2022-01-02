## Documentation

### Getting Started

Just like any other babel plugin, you install it and then add it to your `.babelrc`

```sh
npm i -D babel-plugin-mutable-react-state
# or
yarn add -D babel-plugin-mutable-react-state</pre>
```

```json
// .babelrc
{
  "plugins": ["babel-plugin-mutable-react-state"]
}
```

### Usage

As shown in the visual example in features, the basic usage involves adding a `$` prefix to your state variables.
The plugin will then convert it to a **state value,setter pair**

```js
function Component() {
  let $count = 1
}
// ↓ ↓ ↓

function Component() {
  const [count, setCount] = React.useState(1)
}
```

### Advanced Usage and Workflows

1. You have to realise that this is still a react contextual state and should be treated as one.

```js
function Component() {
  let $text = ''
  let $textLength = 0

  // handle dependent state updates in useEffect
  React.useEffect(() => {
    $textLength = $text.length
  }, [$text])

  return (
    <>
      <textarea
        onChange={(e) => {
          $text = e.target.value
        }}
      />
    </>
  )
}
```

2. The current implementation of the plugin does support **self-dependent** state updates

<small class="text-accent">(Added in: v0.0.2)</small>

```js
function Component() {
  let $text = ''

  const onChange = (e) => {
    // update the value
    $text = e.target.value //=> eg: `hello`
    // convert the new value to upper case
    $text = $text.toUpperCase() //=> HELLO
  }

  return (
    <>
      <textarea onChange={onChange} />
    </>
  )
}
```

3. Working with numbers is simple and works as any mutable number variable

```
function Component() {
  let $count = 1; // declare a reactive variable using the `$` prefix

  const onUpdate = () => {
    // will increment by 2
    $count += 2;

    // will set the count to 2
    $count = 2;

    // will increment by 1
    $count++;

    // will decrement by 1
    $count--;

    // will multiply by 1
    $count *= 2;
  };

  return <>{$count}</>;
}
```

4. There's obviously cases where you'd want to have a custom arrow function handle the state update `setState((prevState)=>{return newState})`. This can be achieved with a simple arrow function assigned to the state variable

```js
/*
 naive , but you can basically do anything,
 as long as you return a new value / new instance 
*/
$name = (prevName) => prevName.toUpperCase()
```
