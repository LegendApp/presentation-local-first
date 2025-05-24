---
theme: default
highlighter: shiki
transition: none
mdc: true
defaults:
  layout: center
  transition: slide-up
---

## onChange

```ts
const user$ = observable({ name: "Annyong" });

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

So it can notify only the nodes that actually changed with the exact details of the change.
-->

---

## Two way binding

```jsx
const user$ = observable({ name: "Annyong" });

const Profile = () => {
  return <Reactive.input $value={user$.name} />;
};
```

<!--
We can also do nice two-way bindings.

Reactive components re-render themselves when an observable changes, and assign back to it when the input changes, so we don't need any event handlers or anything.

That gives us a really nice developer experience and great performance. But here's where the virtual proxy gets weird, and really cool.
-->

---

## Computed Observables

````md magic-move
```js
const user$ = observable({
  fname: "Annyong",
  lname: "Bluth",
});

user$.name.get(); // 'Annyong'
```

```js
const user$ = observable({
  fname: "Annyong",
  lname: "Bluth",
  name: () => user$.fname.get() + " " + user$.lname.get(),
});

user$.name.get(); // 'Annyong Bluth'
```
````

<!--
Because the Proxy is virtual and not actually wrapping the raw data, it could be anything. A child could just be data in an object.

1. But it can also be a function that computes a value. So we can make computed observables with just a function.
-->

---

## Lookup table

```ts
const users$ = observable({
  id1: { name: "Annyong" },
  id2: { name: "Buster" },
});

const userNames$ = observable((id) => user$[id].name);

userNames$["id1"].get(); // 'Annyong'
userNames$["id1"].set("Hello");
```

<!--
Or we could just create a totally new object. We can make a lookup table that takes a key and points into a different observable.

Then that child is two-way bound into the users$ object.

This works well because computeds are lazy. So it creates new virtual proxies dynamically as we use them. And that laziness allows something interesting...
-->

---

## Promise

````md magic-move
```js
const messages$ = observable(() =>
  fetch("https://myapi/messages").then((response) => response.json())
);

messages.get(); // Triggers the fetch
```

```js
const messages$ = observable(() =>
  fetch("https://myapi/messages").then((response) => response.json())
);

const Messages = observer(function Messages() {
  // Triggers fetch and re-runs when complete
  const messages = messages$.get() || [];

  return <List>{messages.map(MessageRow)}</List>;
});
```

```js
const messages$ = observable(
  syncedFetch({
    get: "https://myapi/messages",
  })
);

const Messages = observer(function Messages() {
  // Triggers fetch and re-runs when complete
  const messages = messages$.get() || [];

  return <List>{messages.map(MessageRow)}</List>;
});
```

```js
const messages$ = observable(
  syncedFetch({
    get: "https://myapi/messages",
    set: "https://myapi/message",
  })
);

const Messages = observer(function Messages() {
  // Triggers fetch and re-runs when complete
  const messages = messages$.get() || [];

  const onClickSend = () => {
    messages$["messageId"].set({
      id: "messageId",
      sender: "Annyong",
      text: "Hello",
      date: Date.now(),
    });
  };

  return (
    <>
      <List>{messages.map(MessageRow)}</List>
      <Button onClick={onClickSend}>Send</Button>
    </>
  );
});
```
````

<!-- An observable could point at the result of a Promise. Since it's lazy, it doesn't do anything at first. Calling get() triggers the fetch and updates itself when it resolves.

1. So then if we get() within a component, it will just re-render itself itself when data comes in. And then our component is bound to the server data, which is cool.

2. But fetching is more complicated than that, so we can make a sync plugin to wrap the complexity.

3. And that plugin can track its changes, to send them back to a server and do a two-way sync. So now we have an observable that is purely defined by server data, and is actually two-way bound to the server.
-->
