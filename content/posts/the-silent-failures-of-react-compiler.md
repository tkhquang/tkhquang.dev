---
title: "The Silent Failures of React Compiler"
created_at: 2026-01-19T00:00:00.000Z
updated_at: ""
published: true
category_slug: technical
tags:
  - React
  - React Compiler
  - ESLint
  - Web Development
cover_image: /uploads/images/blog/the-silent-failures-of-react-compiler.jpg
description: "React Compiler is powerful, but it often fails to optimize silently. A recent team chat sent us down a rabbit hole of discovery, and here's what I found."
---

The other day, a simple question popped up in our team chat that spiraled into a much deeper investigation. We've been using [**React Compiler**](https://react.dev/learn/react-compiler) in our project, a tool that promises to handle memoization automatically, freeing us from the manual toil of `useMemo`, `useCallback`, and `React.memo`.

The conversation started with a coworker asking:

**Coworker A:**
> Since we're already using React Compiler, are manual hooks like `useCallback` really necessary anymore? I'm so used to wrapping every function in `useCallback` out of habit.

**Coworker B:**

> Yeah, I'm not sure. I thought the compiler mostly just replaced `React.memo`. I ran a quick test, and for some reason, my child component still re-renders when the parent's state changes. I have no idea why.

He shared a simple piece of code to demonstrate his test case:

```js title="CompilerTest.jsx" showLineNumbers
const Wrapper = () => {
  const [num, setNum] = useState(1);

  // Coworker B expected this to be auto-memoized,
  // but saw the useEffect in Child re-running.
  const onChange = () => {
    console.log('onChange');
  };

  return (
    <div>
      <Child onChange={onChange} />
      <button onClick={() => setNum(v => v + 1)}>{num}</button>
    </div>
  );
};

const Child = ({ onChange }) => {
  useEffect(() => {
    console.log("onChange changed! I'm re-running when Num changes.");
  }, [onChange]);
};
```

I ran the same test on my end and saw the expected behavior. I replied:

**Me:**

> Nice test. The compiler is definitely supposed to handle `useCallback` automatically, and it's working on my end. The child component *doesn't* re-render when `num` changes, so `onChange` is getting memoized correctly.

**Coworker B:**

> Weird. It keeps failing when I put it into our complex business code.

And that was the "aha!" moment.

**Me:**

> I see. That's the classic issue. It's not that the compiler *can't* do it; it's that it silently *chose not to*. For some reason in your complex component, React Compiler **bailed out** of the optimization. That's the real gotcha with this tool.

This conversation sent our whole team down a rabbit hole. The biggest problem with React Compiler, we learned, is that it **fails silently**. When it encounters code it can't optimize, it just skips that component, falling back to regular React behavior without any warning. Your code still works, but the performance benefits you were counting on are silently gone. A real footgun.

### Making the Silent Failures Loud

After a bit of digging, I realized we weren't flying completely blind. There's a brilliant VSCode extension, [**React Compiler Marker**](https://github.com/blazejkustra/react-compiler-marker), that visually highlights which components the compiler has skipped. After installing it, I was shocked. Our codebase was littered with silently skipped components.

So, how do we catch these skipped optimizations automatically in our build process? It involves setting up two key ESLint rules from two different plugins.

First, you need to install and configure `eslint-plugin-react-compiler` and `eslint-plugin-react-hooks`. Here’s a trimmed-down example of what the relevant parts of a modern `eslint.config.js` (flat config) might look like:

```js title="eslint.config.js (Relevant Parts)" showLineNumbers
import reactHooks from 'eslint-plugin-react-hooks';
import reactCompiler from 'eslint-plugin-react-compiler';
// ... other imports

export default [
  // ... other configs
  {
    files: ['**/*.{ts,tsx}'],
    plugins: {
      'react-hooks': reactHooks,
      'react-compiler': reactCompiler,
    },
    rules: {
      // This is the primary rule that enables the compiler's analysis.
      'react-compiler/react-compiler': 'warn',

      // This is the crucial rule that reports when the compiler bails out.
      'react-hooks/todo': 'warn',

      // ... other rules like exhaustive-deps, etc.
      'react-hooks/rules-of-hooks': 'error',
      'react-hooks/exhaustive-deps': 'warn',
    },
  },
  // ... other configs like Prettier
];
```

The two most important rules here are:

1. **`react-compiler/react-compiler`**: This is the main switch that runs the compiler's analysis over your code.
2. **`react-hooks/todo`**: This is our safety net. It specifically flags components and hooks that the compiler analyzed but had to give up on, which is exactly what we want to catch.

With these rules enabled, we can now enforce optimization on critical components by temporarily overriding the rule to be an error, effectively breaking the build if the compiler skips it.

```js title="Enforce Compilation for a Critical Component" showLineNumbers
// In a critical component, we can demand compilation
/* eslint react-hooks/todo: "error" */
function HighFrequencyTradingUI() {
  // If the compiler bails out on this component, our build will now break.
}

// For a simple, non-critical component, we can disable the warning.
/* eslint-disable react-hooks/todo */
function AboutUsPage() {
  // We don't need peak memoization here.
}
```

### Common Patterns That Cause React Compiler to Bail Out

My research led me to a list of common patterns that cause React Compiler to give up on memoizing a component. Here are the main culprits I found, along with ways to fix them.

#### 1. Mutating Destructured Props

This is a cardinal sin in React anyway. The compiler cannot safely memoize a component that mutates its props, as it can no longer guarantee the output is a pure function of its inputs.

```js {3}#negative title="❌ UserProfile.jsx (Not Optimized)" showLineNumbers
function UserProfile({ user }) {
  // Mutating a prop like this causes the compiler to skip this component.
  user.name = user.name ?? 'Guest';
  return <div>{user.name}</div>;
}
```

The fix is simple: create a new local variable instead of changing the prop itself.

```js {3} title="✅ UserProfile.jsx (Optimized)" showLineNumbers
function UserProfile({ user }) {
  // Create a new variable from the prop.
  const displayName = user.name ?? 'Guest';
  return <div>{displayName}</div>;
}
```

#### 2. Complex `try/catch` Blocks

The compiler's support for `try/catch` is currently very limited. It often bails out if it sees conditionals, ternaries, optional chaining, or a `finally` block.

```js /if/2 /finally/1 title="❌ DataFetchingComponent.jsx (Not Optimized)" showLineNumbers
async function fetchData() {
  setLoading(true);
  try {
    const data = await api.getData();
    // This 'if' statement prevents optimization.
    if (data) {
      setData(data);
    }
  } catch (e) {
    setError(e);
  } finally {
    // A 'finally' block also prevents optimization.
    setLoading(false);
  }
}
```

For conditionals, you can extract the logic into a separate `run` function. For `finally` blocks, you unfortunately have to duplicate the logic for now.

```js {4-9,12,14,18} title="✅ DataFetchingComponent.jsx (Workaround)" showLineNumbers
async function fetchData() {
  setLoading(true);
  // TODO: [React Compiler] Remove run() wrapper when compiler supports complex try/catch
  const run = async () => {
    const data = await api.getData();
    if (data) {
      setData(data);
    }
  };

  try {
    await run();
    // Duplicate finally logic here
    setLoading(false);
  } catch (e) {
    setError(e);
    // And here too... ugly, but it works.
    setLoading(false);
  }
}
```

#### 3. Incompatible Library APIs (like React Hook Form)

Some libraries use patterns the compiler can't memoize. A prime example is `react-hook-form`'s `form.watch()` method, which the compiler warns can lead to stale UI if memoized incorrectly.

```js /watch/3 title="❌ MyForm.jsx (Not Optimized)" showLineNumbers
import { useForm } from 'react-hook-form';

const { watch } = useForm();
// This use of watch() causes the compiler to bail out!
const firstName = watch('firstName');
```

Thankfully, the `react-hook-form` team provides a compiler-friendly alternative: the `useWatch` hook.

```js {5} title="✅ MyForm.jsx (Optimized)" showLineNumbers
import { useForm, useWatch } from 'react-hook-form';

const { control } = useForm();
// This works perfectly with the compiler.
const firstName = useWatch({ control, name: 'firstName' });
```

#### 4. Other Known Offenders

* **JSX Spread Child:** Using `{...children}` is not supported and will prevent memoization. The fix is to use `{children}` directly.
* **`ThisExpression`:** Using the `this` keyword, common in class components. The fix is to refactor to a functional component. It's 2026, after all.
* **Dynamic `import()`:** The compiler needs to know about your modules at build time. Use static `import` statements at the top of the file instead.
* **Type Assertions in Object Literals:** A pattern like `const myObj = { key: value as Type };` will cause a bailout. The fix is easy: assert the type on its own line *before* creating the object.

### A System for Sanity: Documenting Our Workarounds

These fixes are temporary measures. As the compiler improves, we'll want to remove these workarounds. The only way to manage this is to track them rigorously. We've decided on a mandatory comment format for all React Compiler-related hacks:

`// TODO: [React Compiler] <Your description of the workaround>`

This simple prefix makes all our temporary fixes easily searchable, so we can address our technical debt when the time comes.

```js title="Example of Documenting a Workaround" showLineNumbers
// TODO: [React Compiler] Remove duplicated finally logic when it's supported.
try {
  // ...
  setLoading(false);
} catch (e) {
  // ...
  setLoading(false);
}
```

### My Takeaway

This whole investigation was a classic case of "the tool isn't magic." React Compiler is incredibly powerful, but its silent failures can lull you into a false sense of security. By adding the right linter rule and understanding its common bail-out conditions, we've turned an invisible problem into a visible, manageable one. It's another layer of complexity, sure, but the performance gains are worth the vigilance.

---

The deeper you dig, the more you realize that robust engineering is less about shiny new tools and more about understanding their sharp edges.

### References

* [React Compiler - Bailouts & Workarounds Discussion](https://github.com/reactwg/react-compiler/discussions/34)
* [React Compiler and `form.watch` in `react-hook-form`](https://github.com/facebook/react/issues/31532#issuecomment-2474533557)
* [Sanity.io's `run()` wrapper workaround for `try/catch`](https://github.com/sanity-io/sanity/blob/main/packages/sanity/src/core/hooks/useRecordDocumentHistoryEvent.ts#L86C7-L107C8)
* [React Compiler, Silent Failures, and How to Fix Them](https://acusti.ca/blog/2025/12/16/react-compiler-silent-failures-and-how-to-fix-them/)

<style>
  [data-line][data-highlighted-line][data-highlighted-line-id='negative'] {
    background-color: color-mix(
        in srgb,
        var(--tone-3) 25%,
        transparent
      ) !important;
  }

  [data-theme='dark'] [data-highlighted-chars] {
    background-color: color-mix(
        in srgb,
        var(--error) 25%,
        transparent
      ) !important;
  }

  [data-theme='light'] [data-highlighted-chars] {
    background-color: color-mix(
        in srgb,
        var(--tone-3) 25%,
        transparent
      ) !important;
  }
</style>
