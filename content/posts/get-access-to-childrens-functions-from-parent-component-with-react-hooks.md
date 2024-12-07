---
title: Get Access To Children's Functions from Parent Component with React Hooks
created_at: 2020-08-01T22:55:11.659Z
updated_at: ""
published: true
category_slug: technical
tags:
  - React
cover_image: /uploads/images/useimperativehandle.png
description: |
  One way to expose Children Components in React.
---
Generally, this is **not** the way to go about handling things in React. Usually what you want to do is hoist the states and the functions to the parent and pass data down as props ([Lifting State Up](https://reactjs.org/docs/lifting-state-up.html)).

But if you must expose an imperative method on a child component, you can use `refs`. Remember this is an escape hatch and usually indicates a better design is available.

# The Problem

In this example we will create a simple counter application with the 2 individual counters. It will update the total count value (sum of the 2 counter values) only when the user clicks on the `Update Counter` button. To give an illustration, [this](https://htv0z.csb.app/) is what we are going to build.

In case the above link no longer works:

![Preview Counter App](https://i.postimg.cc/prKj4tBr/Counter.png)

Let's start with creating a basic counter component, which is very simple.

```js title="In src/components/Counter.js" showLineNumbers
import React, { useState } from "react";

function Counter() {
  const [count, setCount] = useState(0);

  function increaseCounter() {
    setCount(count + 1);
  }

  function decreaseCounter() {
    setCount(count - 1);
  }

  function getCount() {
    return count;
  }

  return (
    <div>
      <h2>Child Count: {count}</h2>
      <button type="button" onClick={increaseCounter}>
        Increase +
      </button>
      <button type="button" onClick={decreaseCounter}>
        Decrease -
      </button>
    </div>
  );
}

export default Counter;
```

Now, the problem is that we need to get access to the states of the children to sum the value of the counters, which currently are only available in the children.

# `useImperativeHandle` to the rescue

To achieve what we are building, there are different approaches, but in this case, we will be using [**`useRef`**](https://reactjs.org/docs/hooks-reference.html#useref), [**`forwardRef`**](https://reactjs.org/docs/react-api.html#reactforwardref) and [**`useImperativeHandle`**](https://reactjs.org/docs/hooks-reference.html#useimperativehandle).

To begin, we need to pass a `ref` from the parent to the children component. So that we can access to the children properties from the outside.

```js {3,7} title="In src/components/Counter.js" showLineNumbers
import React, { useState } from "react";

function Counter(props, ref) {
  // ... Rest
}

export default forwardRef(Counter);
```

Then, we will create this function in the child component.

```js title="In src/components/Counter.js" showLineNumbers
function getCount() {
  return count;
}
```

Obviously, it's a simple function which returns the current `count` state of the component. We will need to access to this function in the parent to get the value it returns. This is where `useImperativeHandle` comes to play.

```js title="In src/components/Counter.js" showLineNumbers
useImperativeHandle(ref, () => {
  return {
    getCount: getCount
  };
});
```

Then in the parent component, we can reach `getCount` function appealing to `ref.current`

```js title="In src/App.js" showLineNumbers
import React, { useState, useRef } from "react";
import Counter from "./components/Counter";

function App() {
  const [totalCount, setTotalCount] = useState(0);
  const counterOne = useRef(null);
  const counterTwo = useRef(null);

  function updateCounter() {
    const counterOneCount = counterOne.current.getCount();
    const counterTwoCount = counterTwo.current.getCount();

    setTotalCount(counterOneCount + counterTwoCount);
  }

  return (
    <div className="App">
      <h1>Total Count: {totalCount}</h1>
      <button type="button" onClick={updateCounter}>
        Update Counter
      </button>
      <hr />
      <Counter ref={counterOne} />
      <hr />
      <Counter ref={counterTwo} />
    </div>
  );
}
```

That's it, now everytime we click the `Update Counter` button, it will update the total count value base on the current count of the 2 counters.

[Here](https://codesandbox.io/embed/restless-meadow-htv0z?fontsize=14&hidenavigation=1&theme=dark) is a working CodeSandbox for the example.

To sum it up, we use `useRef` which returns a mutable `ref` object whose `.current` property is initialized to the passed argument. The returned object will persist for the full lifetime of the component. Now, the function `getCount` is initialized in `.current` property of `ref` thanks to the help of `useImperativeHandle`. So that the function can be called from the parent component where its `ref` has been passed down to the child component by using `forwardRef`.
