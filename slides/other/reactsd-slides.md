---
theme: default
highlighter: shiki
transition: none
mdc: true
defaults:
  layout: center
  transition: slide-up
---

# High performance local-first

# apps with Legend State

### <span className="text-gray">+ The wild things Proxy can do</span>

<div class="absolute bottom-16">
  <div>Jay Meistrich</div>
  <div class="pt-1">@jmeistrich</div>
  <div class="text-gray pt-1">SDJS React - August 14, 2024</div>
</div>

<!--
Hi, I'm Jay. I'm going to show you how state libraries work, some wild stuff you can do with Proxy, and how to make local first apps.

It's is going to be pretty technical, so I'd like to make this more of a conversation. If I fly through something too fast please interrupt me to ask for more details. I'll try to look for raised hands or just yell "Question" any time.

But first a bit about me.
-->

---

<div>
    <img src="/media/ea.png">
</div>

<!-- I started my career as a game developer, working on a Nintendo Wii game at EA Games -->

---

<div>
    <img src="/media/ms.png">
</div>

<!--
Then I went to Microsoft and worked on Windows 7, Windows 8, Windows Phone, Xbox, and Surface. Then I got into web development in 2011, React in 2015, and React Native in 2017. So I've been deep in React land for a while.
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

Clinics have dozens of therapists, each with dozens of clients, all managing appointments and session notes and invoices.
-->

---

# Holy Grail App {.inline-block.view-transition-holy-grail}

1. Extremely fast
2. Loads instantly
3. Works offline
4. Resilient to network errors
5. Low bandwidth usage

<!--
So when we started Bravely we wanted to have the holy grail app experience. An app that's extremely fast and just works, and never loses data even on bad networks.
-->

---

# Local First &nbsp; &nbsp; &nbsp;&nbsp;&nbsp;&nbsp;{.inline-block.view-transition-holy-grail}

1. Extremely fast
2. Loads instantly
3. Works offline
4. Resilient to network errors
5. Low bandwidth usage

<!--

And it turns out that's basically what local first is.

I already had a signal based state system that I built for Legend in 2015, but I wanted to make it faster and more modern.

I'd been optimizing performance for a long time and found that too many re-renders was usually the main bottleneck, and that's caused directly by state.

So I tried to figure out how to build the fatest possible state system.
-->

---

# <span class="questionBox">?</span>

<!--
I blacked out for a week. I have no memory of that week but git shows that I tried 18 different approaches. I tried dozens of state libraries, studied their source, and ran a bunch of benchmarks, looking for the fastest and nicest solution.

So I'll tell you how other state libraries work and the pitfalls I found.
-->

---

## When to re-render?

```js
function Component() {
  const [state, setState] = useState({ name: "" });

  return <div>{state.name}</div>;
}
```

<!--
The main problem to solve is how to know when to re-render.

The useState hook is easy, we set a new state and it re-renders.
-->

---

### ❌ Immutable

```js
setState({ ...props, name: "Annyong" });
```

<br />

1. Lots of cloning
2. Garbage collection freezes

<!--
But that actually has a big problem.

It uses strict equality checking to know if state changed. So we have to create an entirely new object.

But that's terrible for performance because it's constantly creating new memory and garbage collecting it. And garbage collecting freezes the app. So we want to avoid immutability.
-->

---

### ❌ useStore

````md magic-move
```js
const store = { user: { name: "Annyong" } };

function Component() {
  const { user } = useStoreContext();

  return <div>{user.name}</div>;
}
```

```js
const store = { user: { name: "Annyong" } };

function Component() {
  const { user } = useStore(store);

  return <div>{user.name}</div>;
}
```
````

1. Not fine-grained

<!--
The other builtin is context. But using context for state has a big problem: whenever anything changes it re-renders every subscriber.

1. Some state libraries use a similar pattern, subscribing to a whole store for changes. And it has the same problem: using one store or one context will get very slow as your app scales.

These are fine for small, rarely changing, or rarely consumed state. But if you're putting a lot of state in context, it's going to re-render a ton and you're going to have a bad time.
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

So we want our updates to be more fine-grained.
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

1. No hierarchy

<!--
The cool new solution is Signals, which have a value function or property. When you get the value it tracks that it was accessed, to re-render when it changes.

But signals don't support children in objects at all. They're great for primitive values but can't track discreet child property access. So we can't really use signals for a big global store.

So we need some kind of hierarchical signal.
-->

---

### ❌ defineProperty

````md magic-move
```js
const user = { name: "Annyong" };

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

### ❌ Proxy

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

1. Recreate when changed

<!--
The more modern equivalent of that is Proxy. It can intercept any property access for tracking, so we don't have to specifically wrap each field.

It's not as slow as defineProperty but it has the same problem that we have to re-wrap with Proxy when setting a new value.
-->

---

### ❌ Snapshot Proxy

```js
function useSnapshot(state) {
  return new Proxy(state, {
    get(target, key) {
      trackAccess(user, key);
      return target[key];
    },
  });
}

const user = { name: "Annyong" };

function Component() {
  const { name } = useSnapshot(user);
}
```

1. Creating new Proxies during render
2. Hook for each state object

<!--
Another common approach is to have a hook which creates a Proxy to track access.

But then that hook is recreating new Proxies all the time, and that gets slow with large stores.
-->

---

### ❌ Hacking React

```js
import { __SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED as Internals } from "react";

const dispatcher = Internals.ReactCurrentDispatcher.current;

const user = { name: "Annyong" };
const user$ = new Proxy(user, {
  get(target, key) {
    const component = getActiveComponentFromDispatcher();
    trackAccess(component, user, key);
    return target[key];
  },
});
```

1. Unreliable
2. Broken by React update

<!--
We could go a little crazy and hack up React's internals to know which component is currently rendering.

Then we don't need any hooks, because state access is tracked automatically. I tried this, and it was really cool and worked in development, but it was super unreliable in production. And an update to React could easily break it, so that's a no-go.

?? &nbsp;&nbsp;&nbsp;&nbsp;   So how are we, any questions so far?
-->

---

# ✅ Virtual Proxy

<!-- The solution I ended up with after all that is what I'm calling a Virtual Proxy. -->

---

<div>
    <img src="/media/perfchart.png" class="h-[560px]">
</div>

<!--
It's faster than every other state library by a wide margin. It's even faster than vanilla JS in some benchmarks.

The column on the left is using Legend State's array optimizations, where array reordering only re-renders the elements that changed, and it can skip re-rendering and reconciling the whole array.
-->

---

### Local First

```js
const messages$ = observable(
  syncedKeel({
    list: listMessages,
    create: createMessage,
    update: updateMessage,
    delete: deleteMessage,
    // Persist data and pending changes locally
    persist: { name: "messages", retrySync: true },
    // Retry on error
    retry: { infinite: true, backoff: "exponential" },
    // Sync only diffs
    changesSince: "last-sync",
  })
);
```

<!--
And it makes it super easy to make a local-first app with any backend. This is all the code we need to build a local-first chatroom that works fully offline.-->

---

# Virtual Proxy

<!-- But first I'll tell you how cool Proxy is, and how a virtual proxy works. -->

---

````md magic-move
```ts
// A basic proxy

const user = { name: "Annyong" };

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

const user = { name: "Annyong" };

const user$ = new Proxy(
  {},
  {
    get(_, key) {
      trackAccess(user, key);
      return user[key];
    },
  }
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

```jsx
// An observable virtual proxy
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

const Profile = observer(() => {
    const value = user$.name.get()

    return (
        <div>Name is {value}</div>
    )
})
```
````

<!--
Normally we'd Proxy an object to track property access. So by accessing name within that observe at the bottom, it knows to re-run itself when name changes. But the Proxy can actually return anything.

2. So we could Proxy any random object but still return the value from user. That's actually totally fine and does exactly the same thing.

3. But if we put a parent and key in that object, it becomes a directed graph. Each child Proxy represents a child in the user object. It's not actually the user object, but it acts like it is.

4. Then we can have a get function that tracks and returns the actual value at that node.

5. And that's basically how Legend State works. Observer components track all get() calls and re-render when those values change. &nbsp;&nbsp;?? &nbsp;&nbsp;&nbsp;   Any questions before I go on?
 -->

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

## Fine grained rendering

<div>
    <video src="/media/finegrained.mp4" autoplay loop muted class="rounded"></video>
</div>

<!-- And that lets us do really fine-grained rendering.

We can see why that's good with some flashing boxes every time an element renders.

In the regular React version on the left, every time count changes, everything re-renders.

In the observable version on the right, it re-renders only the tiniest element that actually changed.
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

---

## CRUD plugin

```js
const messages$ = observable(
  syncedCrud({
    list: listMessages,
    create: createMessage,
    update: updateMessage,
    delete: deleteMessage,
    updatePartial: true,
  })
);
```

<!--
But since we know the details of every value that's changing, we can specifically track when rows are added, updated, or deleted. We even know which fields in a row changed, so it can send partial updates. The syncedCrud plugin has all that logic in it.
-->

---

## Supabase plugin

```js
const messages$ = observable(
  syncedSupabase({
    supabase,
    collection: "messages",
    // Filter by room
    filter: (select) => select.eq("room_id", roomId),
    // Realtime filter by room
    realtime: { filter: `room_id=eq.${roomId}` },
  })
);
```

<!--
And we have more plugins like this Supabase plugin. It's built on the crud plugin which does most of the work, so it just has a few things specific to Supabase.

And since plugins are small it's easy to make lot of them. We already have plugins for Keel, Firebase, and a React Query plugin, and we're planning to add tons more.

But of course I haven't gotten to the key ingredient for local-first yet, local.
-->

---

## Persistence

````md magic-move
```js
const messages$ = observable(
  syncedFetch({
    get: `https://myapi/messages`,
    set: "https://myapi/message",
    persist: {
      name: "messages",
      plugin: ObservablePersistLocalStorage,
    },
  })
);
```

```ts
const messages$ = observable(
  syncedFetch({
    get: ({ lastSync }) => `https://myapi/messages?after=${lastSync + 1}`,
    set: "https://myapi/message",
    persist: {
      name: "messages",
      plugin: ObservablePersistLocalStorage,
    },
    mode: "append",
    fieldUpdated: "updatedAt",
    changesSince: "last-sync",
  })
);
```

```ts
const messages$ = observable(
  syncedFetch({
    get: ({ lastSync }) => `https://myapi/messages?after=${lastSync + 1}`,
    set: "https://myapi/message",
    persist: {
      name: "messages",
      plugin: ObservablePersistLocalStorage,
      retrySync: true,
    },
    fieldUpdated: "updatedAt",
    changesSince: "last-sync",
    retry: { infinite: true, backoff: "exponential" },
  })
);
```
````

<!--
We have persist plugins for web and React Native. We just give it a plugin and table name, and it will cache everything. But that will do a full sync every time, which isn't ideal.

1. So it has an option to just query for messages after the last sync. Then instead of syncing thousands of messages we sync only the new ones.

3. And let's just add in offline retries and error handling too. That makes it cache all pending changes and keep retrying until they succeed. That makes our app work offline and gracefully handle sync errors.
-->

---

<div>
    <img src="/media/noconnection.png" className="h-[200px]" />
</div>

<!--
You never have to tell your users oh no we can't connect to the server, or that changes failed to save. We have the data in the cache, and all changes are persisted through reloads to sync whenever they can.

And you have never to synchronize your UI state with your remote state. Because
-->

---

## Local state = Remote state

````md magic-move
```js
const profile$ = observable(
  syncedFetch({
    get: `https://myapi/me`,
    set: "https://myapi/updateUser",
    // ...
  })
);

const Profile = observer(function Profile() {
  return <Reactive.input $value={profile$.name} />;
});
```

```js
const profile$ = observable(
  syncedFetch({
    get: `https://myapi/me`,
    set: "https://myapi/updateUser",
    // ...
  })
);

const Profile = observer(function Profile() {
  const isLoaded$ = syncState(profile$).isLoaded;

  if (!isLoaded$.get()) {
    return <Loading />;
  }

  return <Reactive.input $value={profile$.name} />;
});
```

```js
const profile$ = observable(
  syncedFetch({
    get: `https://myapi/me`,
    set: "https://myapi/updateUser",
    // ...
  })
);

const Profile = observer(function Profile() {
  if (profile$.get() === undefined) {
    return <Loading />;
  }

  return <Reactive.input $value={profile$.name} />;
});
```
````

<!--
Observables sync themselves. Legend-State handles all of the hard stuff: syncing, caching, error handling, retrying, conflict resolution. You can just two-way bind an input straight to your server.

1. Of course we need to display a loading screen until we have data. We have a syncState that has all that status.

2. But in local first that's not actually quite right. After the first run we already have the data in the cache, so we don't need to wait for the server. After data is loaded once, it can run instantly.

So that's it. The observable handles its own sync so our UI code doesn't have to know anything about our sync system. It only cares about state and UI.
-->

---

## Benefits of unified state

1. Smaller, less complex components

<v-clicks>

2. Components don't re-render through changing sync states
3. Don't have to manage local and global state libraries
4. UI developers don't need to understand sync system

</v-clicks>

<!--
1. And that's great because we have a lot less code in our components now.

2. We don't have to re-render whenever any sync state changes because it doesn't matter. Components re-render when the individual properties they care about changes.

3. And with one source of truth everything is just better.

4. I taught our designer Tailwind and JSX and now she's writing full components herself, because it's so much easier when she doesn't need to know how our whole sync system works. We now skip the whole Figma step and she designs directly in code, which speeds up development like crazy. And she loves it.

 -->

---

## Benefits of local first

1. Works offline

<v-clicks>

2. Loads instantly
3. Lower costs
4. Reliability

</v-clicks>

<!--
1. It's obviously great to work offline.

2. But also local first apps load instantly because they have all the data cached, and don't wait for a server.

3. And there's less server usage and bandwidth costs because we sync less data.

4. And if our server goes down or a user loses wifi, the app works totally fine and syncs gracefully when it comes back.
-->

---

<div>
    <img src="/media/offline.png" />
</div>

<!--
But most importantly, we don't have to see these stupid screens anymore. If I accidentally close my chat app while offline I shouldn't have to lose everything.
-->

---

# Local first is easy and super fast 😀

<!--
And making local first apps is easy!

I mean it's really hard. But Legend State does all that hard work to make it easy for you. It supports any backend and works on web and mobile.

So there's no reason not to make your apps local first.
-->

---

<div class="bg-white">
    <img src="/media/lastslide.png" class="h-[500px] w-auto"></img>
</div>

<!--
Thanks for listening to all of that!

You can scan this QR code to go to the github repo, or talk to me on Twitter or Discord.

Any questions?
-->
