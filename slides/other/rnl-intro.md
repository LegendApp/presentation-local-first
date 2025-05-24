---
theme: default
highlighter: shiki
transition: none
mdc: true
defaults:
    layout: center
    transition: view-transition
---

# Building high performance local-first

# apps with Legend State

<div class="absolute bottom-16">
  <div>Jay Meistrich</div>
  <div class="pt-1">@jmeistrich</div>
  <div class="text-gray pt-1">React Native London - Nov 14, 2024</div>
</div>

<!--
Hi I'm Jay!

I'm here to talk to you about performance, sync engines, and Legend State.

Who here has used Legend State before?

Would you consider yourself new or advanced? Keep your hands raised if advanced.

Feel free to raise your hand at any time or yell out Question if I don't see you.

First a bit about me and an intro and history of Legend State.
-->

---

<div>
    <img src="/media/ea.png">
</div>

<!--
I started my career as a game developer, working in C++ on a Nintendo Wii game at EA Games. I learned a lot about performance with the constrained processing of the Wii.
-->

---

<div>
    <img src="/media/ms.png">
</div>

<!--
Then I went to Microsoft and worked on Windows 7, Windows 8, Windows Phone, Xbox, Kinect, and Surface. I learned about the crazy performance requirements of developing OS code and also did some some computer vision and communicating directly with hardware.

Then I got into web development in 2011, React in 2015, and React Native in 2017. So I've been deep in React land for a while. In JavaScript do performance... differently.
-->

---

<div>
    <div>
        <img src="/media/legendlogo.png" class="h-16 mx-auto mb-4">
    </div>
    <div>
        <video src="/media/Legend App Together.mp4" autoplay loop muted class="h-[400px] rounded"></video>
    </div>
</div>

<!--
I make Legend, a local-first productivity app that combines documents, calendars, and a built in browser.

Some users have millions of items that need to be filtered and sorted as you type, so I'm constantly trying to squeeze out the best possible performance.
-->

---

<div>
    <div>
        <img src="/media/bravely-logo-white.png" class="h-12 mx-auto mb-4">
    </div>
    <p />
    <div>
        <img src="/media/bravely.png"  class="h-[400px] rounded"></img>
    </div>
</div>

<!--
I'm also working on Bravely, a platform for therapists to run their practice and collaborate with their clients. It also has a ton of data.

Clinics have dozens of therapists, each with dozens of clients, all managing appointments and session notes and invoices. And healthcare data has some really intense security and privacy requirements.
-->

---

# Holy Grail App {.inline-block.view-transition-holy-grail}

1. Extremely fast
2. Loads instantly
3. Works offline
4. Resilient to network errors
5. Low bandwidth usage

<!--
When we started Legend we wanted to have the holy grail app experience. An app that's extremely fast and just works, and never loses data even on bad networks. That was in 2013 and that was normal for desktop apps but very unusual and hard on web. Then a few years ago the concept took on a new name.
-->

---

# Local First &nbsp; &nbsp; &nbsp;&nbsp;&nbsp;&nbsp;{.inline-block.view-transition-holy-grail}

1. Extremely fast
2. Loads instantly
3. Works offline
4. Resilient to network errors
5. Low bandwidth usage

<!--
Local first! So it turns out that's what we were doing the whole time.

And when we started Bravely we wanted it to have all of those same qualities, so I took everything I learned from Legend and looked at rebuilding the state and sync engine in the cleanest and most optimized way.
-->

---

# <span class="questionBox">?</span>

<!--
I blacked out for a week. I have no memory of that week but git shows that I tried 18 different approaches. I tried dozens of state libraries and sync engines, studied their source, and ran a bunch of benchmarks, and built a bunch of prototypes.

One day while lying on my floor I figured out that both optimal performance and a powerful sync engine could be solved by the same thing.
-->

---

# Fine grained reactivity

<!--
Fine grained reactivity in state.

If we can track exactly what state is changing, then we can optimize our React components to render less often. And knowing exactly what state is changing enables a powerful local-first sync engine.

So that's what we'll discuss today. Why state is the most important part of apps, how to optimize performance with state, and how to build a local first sync engine.
-->

---

## Plan

1. How state works and affects performance
2. React State => Legend State
3. Performance
4. Sync
5. Local-first

<!--
So I'll talk to you for a bit about how state works affects performance, then we'll convert an app to use Legend State. Then we'll explore getting the best performance out of your apps, and how to build a sync engine. Then we'll go into why local-first is hard and requires thinking a bit differently, and how to do it with Legend State.

So first, the most important thing to focus on to make your apps really fast is actually really simple.
-->

---

## Render less, less often

<!--
Just do less work. Rendering is very expensive. It involves creating a bunch of memory creating all the elements and rendering them to a virtual DOM, then reconciling and diffing the virtual DOM against the previous state, then rendering native views.

Your code might also do a bunch of computations while rendering, but that's actually usually much less than the render itself.

So the best optimization is just to do smaller renders less often. And what causes re-renders? State changing.

So I'll show you how each way of doing state works and how they affect re-rendering and performance.
-->

---

## When to re-render?

```js
function Component() {
    const [state, setState] = useState({ name: '' });

    return <Text>{state.name}</Text>;
}
```

<!--
The main problem to solve is how to know when to re-render.

The useState hook is easy, we set a new state and it re-renders.
-->

---

### ❌ Immutable

````md magic-move
```js
const state = useState({ name: 'Hello', other: {} });

setState({ ...state, name: 'Annyong' });
```

```js
const state = useState({ name: 'Hello', array: ['banana'] });

setState({ ...state, name: 'Annyong' });
```

```js
const array = useState(['banana']);

setState([...array, 'chocolate']);
```
````

<br />

1. Lots of cloning
2. Garbage collection freezes

<!--
But that actually has a big problem.

It uses strict equality checking to know if state changed. So we have to create an entirely new object.

2. And it can get weird if you depend on children changing. Since this spreads the state it keeps the same array reference so it's unchanged. That might be what you want? Or you might need a deep clone. It's confusing.

3. It's also silly with arrays. You just want to push an element but you have to create a whole new array with one new element.

But that's terrible for performance because it's constantly creating new memory and garbage collecting it. And garbage collecting freezes the app. So we want to avoid immutability.

And it's a super blunt instrument, changing anything in the state will re-render.
-->

---

## ❌ useReducer

```js
const [state, dispatch] = useReducer(reducer, initialArg, init?)
```

<br />

1. <span class="text-2xl">WAT 😱</span>

<!--
The other builtin for state is useReducer. But what even is it? It's super confusing. And it has basically all of the same issues as useState so we don't need to get into it.
-->

---

## ❌ Context

```tsx
const store = { user: { name: 'Annyong' }, settings: {} };

function Component() {
    const { user } = useStoreContext();

    return <Text>{user.name}</Text>;
}
```

<br />

1. Not fine-grained

<!--
And then we have context. Context has a big problem: whenever anything changes it re-renders every subscriber. So if settings changes, this component will re-render even though it doesn't use settings.
-->

---

## ❌ Context Heck

```js
function App() {
    return (
        <UserContext.Provider>
            <SettingsContext.Provider>
                <MessagesContext.Provider>
                    <ProfileContext.Provider>
                        <Main />
                    </ProfileContext.Provider>
                </MessagesContext.Provider>
            </SettingsContext.Provider>
        </UserContext.Provider>
    );
}
```

<br />

1. <span class="text-4xl">😱</span>

<!--
The solution to that is to split into multiple contexts, but that gets terrible too.
-->

---

## ❌ useStore

```tsx
const store = { user: { name: 'Annyong' }, settings: {} };

function Component() {
    const { user } = useStore(store);

    return <Text>{user.name}</Text>;
}
```

<br />

1. Not fine-grained

<!--
Some state libraries use a similar pattern, subscribing to a whole store for changes. And it has the same problem: using one store or one context will get very slow as your app scales.

These are fine for small, rarely changing, or rarely consumed state. But if you're putting a lot of state in context, it's going to re-render a ton and you're going to have a bad time.

So we want more fine-grained updates
-->

---

### ❌ Signals

```ts
function signal(value) {
    return {
        value: () => {
            trackAccess();
            return value;
        },
    };
}
```

<br />

1. No hierarchy

<!--
The cool new solution is Signals, which have a value function or property. When you get the value it tracks that it was accessed, to re-render when it changes.

But signals don't support children in objects at all. They're great for primitive values but can't track discreet child property access. So we can't really use signals for a big global store.

So we need some kind of hierarchical signal.
-->

---

## ❌ defineProperty

````md magic-move
```js
const user = { name: 'Annyong' };

Object.keys(user).forEach((key) => {
    Object.defineProperty(user, key, {
        get: () => {
            trackAccess(user, key);
            return user._hidden[key];
        },
        set: (newValue) => {
            user._hidden[key] = defineProperties(newValue);
        },
    });
});
```

```js{6}
const user = { name: 'Annyong' }

Object.keys(user).forEach(key => {
    Object.defineProperty(user, key, {
        get: () => {
            trackAccess(user, key)
            return user._hidden[key]
        },
        set: (newValue) => {
            user._hidden[key] = defineProperties(newValue)
        },
    })
})
```

```js{3}
const user = { name: 'Annyong' }

Object.keys(user).forEach(key => {
    Object.defineProperty(user, key, {
        get: () => {
            trackAccess(user, key)
            return user._hidden[key]
        },
        set: (newValue) => {
            user._hidden[key] = defineProperties(newValue)
        },
    })
})
```

```js{10}
const user = { name: 'Annyong' }

Object.keys(user).forEach(key => {
    Object.defineProperty(user, key, {
        get: () => {
            trackAccess(user, key)
            return user._hidden[key]
        },
        set: (newValue) => {
            user._hidden[key] = defineProperties(newValue)
        },
    })
})
```
````

<br />

1. Slow
2. Recreate hidden when changed

<!--
To do that we need to know which specific properties we're accessing.

Some state libraries use defineProperty to intercept property access.

1. So we can track when those properties are accessed.

2. But we have to recursively iterate every key and define a property for it, even if we don't ever use them. And that can be very slow.

2. And when we update it, it needs to rewrap the new value and do all that again.
-->

---

## ❌ Proxy

```js
const user = { profile: { name: 'Annyong' }}

const user$ = new Proxy(
    user,
    {
        get(target, key) {
            trackAccess(user, key)
            return target[key]
        }
        set(target, key, value) {
            target[key] = createProxies(value)
        }
    }
)
```

<br />

1. Recreate when changed

<!--
The more modern equivalent of that is Proxy. It can intercept any property access for tracking, so we don't have to specifically wrap each field.

It's not as slow as defineProperty but it has the same problem that we have to re-wrap with Proxy when setting a new value.
-->

---

## ❌ Snapshot Proxy

```js
function useSnapshot(state) {
    return new Proxy(state, {
        get(target, key) {
            trackAccess(user, key);
            return target[key];
        },
    });
}

const user = { name: 'Annyong' };

function Component() {
    const { name } = useSnapshot(user);
}
```

<br />

1. Creating new Proxies during render
2. Hook for each state object

<!--
Another common approach is to have a hook which creates a Proxy to track access.

But then that hook is creating a whole new tree of Proxies whenever it's called, and that gets slow with large stores.
-->

---

## ❌ Hacking React

```js
import { __SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED as Internals } from 'react';

const dispatcher = Internals.ReactCurrentDispatcher.current;

const user = { name: 'Annyong' };
const user$ = new Proxy(user, {
    get(target, key) {
        const component = getActiveComponentFromDispatcher();
        trackAccess(component, user, key);
        return target[key];
    },
});
```

<br />

1. Unreliable
2. Broken by React update

<!--
We could go a little crazy and hack up React's internals to know which component is currently rendering.

Then we don't need any hooks, because state access is tracked automatically. I tried this, and it was really cool and worked in development, but it was super unreliable in production. And an update to React could easily break it, so that's a no-go.

Most popular state libraries out there use one of those techniques.

?? &nbsp;&nbsp;&nbsp;&nbsp;   So how are we, any questions so far?
-->

---

# ✅ Virtual Proxy

<!--
The solution I ended up with after all that is what I'm calling a Virtual Proxy.
-->

---

<div>
    <img src="/media/perfchart.png" class="h-[560px]">
</div>

<!--
It's faster than every other state library by a wide margin. It's even faster than vanilla JS in some benchmarks.

The column on the left is using Legend State's extra fine-grained optimizations to render the smallest possible changes.
-->

---

# Virtual Proxy

<!--
So I'll show you how cool Proxy is, and how a virtual proxy works.
-->

---

````md magic-move
```ts
// A basic proxy

const user = { name: 'Annyong' };

const user$ = new Proxy(user, {
    get(target, key) {
        trackAccess(target, key);
        return target[key];
    },
});

observe(() => {
    user$.name; // 'Annyong'
});
```

```ts
// A virtual proxy

const user = { name: 'Annyong' };

const user$ = new Proxy(
    {},
    {
        get(_, key) {
            trackAccess(user, key);
            return user[key];
        },
    },
);

observe(() => {
    user$.name; // 'Annyong'
});
```

```ts
// A virtual proxy with hierarchy

const user = { name: 'Annyong' }

const user$ = new Proxy(
    { parent: null, key: null},
    {
        get(parent, key) {
            trackAccess(parent, key)
            return new Proxy({ parent, key }, ...)
        }
    }
)

observe(() => {
    user$.name // Proxy('Annyong')
})
```

```ts
// A virtual proxy with hierarchy and get()

const user = { name: 'Annyong' }

const user$ = new Proxy(
    { parent: null, key: null},
    {
        get(parent, key) {
            if (key === 'get') {
                trackAccess(parent, key)
                return () => user[parent.key]
            }
            return new Proxy({ parent, key }, ...)
        }
    }
)

observe(() => {
    user$.name.get() // 'Annyong'
})
```
````

<!--
Normally we'd Proxy an object to track property access. So by accessing name within that observe at the bottom, it knows to re-run itself when name changes. But the Proxy can actually return anything.

2. So we could Proxy any random object but still return the value from user. That's actually totally fine and does exactly the same thing.

3. But if we put a parent and key in that object, it becomes a directed graph. Each child Proxy represents a child in the user object. It's not actually the user object, but it acts like it is.

4. Then we can have a get function that tracks and returns the actual value at that node.

And that's basically how Legend State works. Observers track get() calls and re-render when those values change. &nbsp;&nbsp;?? &nbsp;&nbsp;&nbsp;   Any questions before I go on?
-->

---

## Fine grained rendering

```tsx
const user$ = observable({ fname: 'Annyong', lname: 'Bluth' });

function Component() {
    const fname = useSelector(user$.fname);

    const fname = useSelector(() => user$.fname.get());

    const name = useSelector(() => user$.fname.get() + ' ' + user$.lname.get());

    return <Text>{name}</Text>;
}
```

<!--
So we can be very specific about which fields we access, so that we subscribe to the minimal changes we actually need.

We can use an observable directly, or give it a function to observe all get() calls.
-->

---

## onChange

```ts
const user$ = observable({ name: 'Annyong' });

user$.onChange(({ value, changes }) => {
    changes.forEach((change) => {
        const { path, valueAtPath, prevAtPath } = change;
        // ...
    });
});

interface Change {
    path: string[];
    valueAtPath: any;
    prevAtPath: any;
}
```

<!--
But we have more information than just that it changed. We know the path of the child within the hierarchy and the details of that change.

So it can notify only the nodes that actually changed with the exact details of the change. And that lets us build a whole sync engine on it. But we'll get there later today :).
-->

---

## Fine grained rendering

<div>
    <video src="/media/finegrained.mp4" autoplay loop muted class="rounded"></video>
</div>

<!--
That specific tracking lets us do really fine-grained rendering.

We can see why that's good with some flashing boxes every time an element renders.

In the regular React version on the left, every time count changes, everything re-renders.

In the observable version on the right, it re-renders only the tiniest element that actually changed.
-->

---

# <span class="questionBox">?</span>

<!--
So, any questions so far?

Let's get into building an app with Legend State.
-->
