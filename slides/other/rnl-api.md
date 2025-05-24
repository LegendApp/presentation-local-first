---
theme: default
highlighter: shiki
transition: none
mdc: true
defaults:
    layout: center
    transition: view-transition
---

# Using Legend State

<div class="absolute bottom-16">
  <div>Jay Meistrich</div>
  <div class="pt-1">🦋 @jayz.us</div>
  <div class="pt-1">&nbsp;𝕏 @jmeistrich</div>
  <div class="text-gray pt-1">React Native London - Nov 14, 2024</div>
</div>

<!--
I'll run through the API as an intro or quick refresher. It's gotten a lot better in version 3 so if you were using version 2 some things are different.
-->

---

## Observable

```ts
import { observable } from '@legendapp/state';

// Observable objects
const state$ = observable({
    fname: 'Annyong',
    lname: 'Bluth',
});

// Or small individual atoms
const fname$ = observable('Annyong');
```

<!--
Object or atom
-->

---

## Observing

```ts
const state$ = observable({
    fname: 'Annyong',
    lname: 'Bluth',
});

observe(() => {
    // Tracks
    const fname = state$.fname.get();

    // Does not track
    const fname = state$.fname.peek();
});
```

<!--
Observers track all gets
-->

---

## Setting

```ts
const state$ = observable({
    fname: 'Annyong',
    lname: 'Bluth',
    arr: ['banana'],
});

// Set
sate$.fname.set('Hello');

state$.assign({
    fname: 'Hello',
});

state$.arr.push('chocolate');
```

<br />

<div class="text-2xl">❌ No immutables!</div>

<!--
Set with set

Assign is like Object.assign

Normal array functions

No immutables!
-->

---

## React

```tsx
import { observable } from '@legendapp/state';
import { use$ } from '@legendapp/state/react';

const state$ = observable({
    fname: 'Annyong',
    lname: 'Bluth',
    name: () => state$.fname.get() + ' ' + state$.lname.get(),
});

function Component() {
    // use$ to get value and track it
    const name = use$(state$.name);

    return <Text>{name}</Text>;
}
```

<!--
For those of you who have used Legend State before, this will look different. I'm actually in the process now of changing usage in React to favor this use$ hook, so I'm encouraging using that now.

It's the same as useSelector but fewer characters.

The previous method of observer components tracking all get() calls wasn't compatible with the React Compiler. It memoizes all function calls so that would break our state.

So we'll use use$ instead, which is the same number of characters :). And observer will still be useful to optimize all use$ calls into a single actual hook, though I left it out of this workshop for simplicity.
-->

---

## React Local state

```tsx
import { use$, useObservable } from '@legendapp/state/react';

function Component() {
    const state$ = useObservable({
        fname: 'Annyong',
        lname: 'Bluth',
        name: () => state$.fname.get() + ' ' + state$.lname.get(),
    });

    const name = use$(state$.name);

    return <Text>{name}</Text>;
}
```

<!--
To create an observable as local state within a component we use useObservable.
-->

---

## Computed observables

```ts
const state$ = observable({
    fname: 'Annyong',
    lname: 'Bluth',
    // Any child can be computed
    name: () => state$.fname.get() + ' ' + state$.lname.get(),
});
const name = state$.name.get();

// Create separate computeds
const name$ = observable(() => state$.fname.get() + ' ' + state$.lname.get());
const name = name$.get();
```

<!--
And there's a couple more advanced features we'll go over in the workshop.

Because the Proxy is virtual and not actually wrapping the raw data, it could be anything. A child could just be data in an object.

But it can also be a function that computes a value. So we can make computed observables with just a function.

As child or separate
-->

---

## Lookup table

```ts
const users$ = observable({
    id1: { name: 'Annyong' },
    id2: { name: 'Buster' },
});

const userNames$ = observable((id: string) => user$[id].name);

userNames$['id1'].get(); // 'Annyong'
userNames$['id1'].set('Hello');
```

<!--
Or we could just create a totally new object. If an observable is a function that takes a single parameter, it's treated as a lookup table. So in this example it that takes a key and points into a different observable.

This works well because computeds are lazy. So it creates new virtual proxies dynamically as we use them. And that laziness allows something interesting...
-->

---

## Promise

````md magic-move
```js
const messages$ = observable(() =>
    fetch('https://myapi/messages').then((response) => response.json()),
);

messages.get(); // Triggers the fetch
```

```js
const messages$ = observable(() =>
    fetch('https://myapi/messages').then((response) => response.json()),
);

function Messages() {
    // Triggers fetch and re-runs when complete
    const messages = use$(messages$) || [];

    return <List>{messages.map(MessageRow)}</List>;
}
```

```js
const messages$ = observable(
    syncedFetch({
        get: 'https://myapi/messages',
    }),
);

function Messages() {
    // Triggers fetch and re-runs when complete
    const messages = use$(messages$) || [];

    return <List>{messages.map(MessageRow)}</List>;
}
```

```js
const messages$ = observable(
    syncedFetch({
        get: 'https://myapi/messages',
        set: 'https://myapi/message',
    }),
);

function Messages() {
    // Triggers fetch and re-runs when complete
    const messages = use$(messages$) || [];
    const onClickSend = () => {
        messages$['messageId'].set({
            id: 'messageId',
            sender: 'Annyong',
            text: 'Hello',
        });
    };
    return (
        <>
            <List>{messages.map(MessageRow)}</List>
            <Button onClick={onClickSend}>Send</Button>
        </>
    );
}
```
````

<!--
An observable could point at the result of a Promise. Since it's lazy, it doesn't do anything at first. Calling get() triggers the fetch and updates itself when it resolves.

1. So then if we use that observable in a component, it will just re-render itself itself when data comes in. And then our component is bound to the server data, which is cool.

2. But fetching is more complicated than that, so we can have  a sync plugin to wrap the complexity.

3. And that plugin can track its changes, to send them back to a server and do a two-way sync. So now we have an observable that is purely defined by server data, and is actually two-way bound to the server.
-->

---

# <span class="questionBox">?</span>

<!--
So with that I think it's time to get into the workshop and build an app!

Any questions?
-->
