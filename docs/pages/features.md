<section id="features" class="container">
      <h2 class="my-1">Features</h2>
      <p class="my-1">
        Basically a list of things that <strong>do work</strong> instead of the
        one's that don't, which you can find in the list of
        <a
          class="link"
          href="https://github.com/barelyhuman/babel-plugin-mutable-react-state/issues/4"
          >Caveats</a
        >
      </p>
      <ul>
        <li>
          Numeric Assignments (<code>$count+=1</code>,<code>$count-=1</code>)
        </li>
        <li>
          Numeric Updates (<code>$count++</code>,<code>$count--</code>)
          <small class="text-accent">Added in: v0.0.2</small>
        </li>
        <li>
          State Functions <small class="text-accent">Added in: v0.0.2</small>
        </li>
        <li>
          Dependent Updates <small class="text-accent">Added in: v0.0.2</small>
        </li>
      </ul>
      <p>I'd say a visual example would actually help a lot of people.</p>

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

    // will set the state to whatever
    $count = "Hello World";

    // will use the provided function to get the latest state aka the return value of the function
    // `x` here is the currentState
    $count = (x) => x + 1 - (2 * 4) / 100;
  };

  return <>{$count}</>;
}
```
