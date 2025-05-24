---
theme: default
highlighter: shiki
transition: none
mdc: true
defaults:
    layout: center
    transition: slide-up
---

# Three words that will make your apps better

<div class="absolute bottom-16">
  <div>Jay Meistrich</div>
  <div class="pt-2">@jmeistrich</div>
  <div class="text-gray pt-2">SD DEVx - July 9, 2024</div>
</div>

<!--
Hi, I'm Jay. I have three words for you to make your apps better. But first.
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

Some documents can get up to 100,000 items, and it can have multiple documents open at once.

So there's a lot of optimization in there to keep it fast.
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
I'm also working on Bravely, a platform for therapists to run their practice and collaborate with their clients.

They're very different but they have a lot in common - they should feel as fast as a local app, should never block users with spinners, and should sync perfectly.

So I built a state and sync library to do that for both apps. And I learned a lot about how to make great apps along the way.
-->

---

# Legend-State

````md magic-move
```jsx
// Observable objects
const state$ = observable({ user: { name: 'Annyong' } });

// Set any value
state$.user.name.set('Hello');

// Observer component re-renders on changes
const UserName = observer(() => {
    const name = state$.user.name.get();

    return (
        <>
            <div>Hello {name}</div>
            <Reactive.input $value={state$.user.name} />
        </>
    );
});
```

```jsx{1-2}
// Observable objects
const state$ = observable({ user: { name: 'Annyong' }})

// Set any value
state$.user.name.set('Hello')

// Observer component re-renders on changes
const UserName = observer(() => {
    const name = state$.user.name.get()

    return (
        <>
            <div>Hello {name}</div>
            <Reactive.input $value={state$.user.name} />
        </>
    )
})
```

```jsx{4-5}
// Observable objects
const state$ = observable({ user: { name: 'Annyong' }})

// Set any value
state$.user.name.set('Hello')

// Observer component re-renders on changes
const UserName = observer(() => {
    const name = state$.user.name.get()

    return (
        <>
            <div>Hello {name}</div>
            <Reactive.input $value={state$.user.name} />
        </>
    )
})
```

```jsx{7-9}
// Observable objects
const state$ = observable({ user: { name: 'Annyong' }})

// Set any value
state$.user.name.set('Hello')

// Observer component re-renders on changes
const UserName = observer(() => {
    const name = state$.user.name.get()

    return (
        <>
            <div>Hello {name}</div>
            <Reactive.input $value={state$.user.name} />
        </>
    )
})
```

```jsx{14}
// Observable objects
const state$ = observable({ user: { name: 'Annyong' }})

// Set any value
state$.user.name.set('Hello')

// Observer component re-renders on changes
const UserName = observer(() => {
    const name = state$.user.name.get()

    return (
        <>
            <div>Hello {name}</div>
            <Reactive.input $value={state$.user.name} />
        </>
    )
})
```
````

<!--
Legend-State is all about observables. It's conceptually similar to MobX, or you could think of it as Signals or Runes with hierarchy.

1. You can create an observable from a primitive, an object, an array, whatever you want.

2. Then you can just set any value anywhere.

3. If you get() inside an observer, the observer will re-run whenever it changes. So by getting name I'm telling this component to re-render whenever name changes.

4. This is a special Reactive component - just give it an observable value and it two-way binds to it.

5. So that brings me to the three words to make your apps better.
-->

---

# Render less, less often

<!--
"Render less, less often". And yes, that's three different words.
-->

---

````md magic-move
```jsx
// React is unoptimized by default

const UserName = () => {
    const [name, setName] = useState('');

    return <input value={name} onChange={(e) => setName(e.target.value)} />;
};

export function App() {
    return (
        <div>
            <UserName />
        </div>
    );
}
```

```jsx
// Use state in siblings?

const Profile = () => {
    return <h1>Name is {name}</h1>;
};

const UserName = () => {
    const [name, setName] = useState('');

    return <input value={name} onChange={(e) => setName(e.target.value)} />;
};

export function App() {
    return (
        <div>
            <UserName />
            <Profile />
        </div>
    );
}
```

```jsx
// Lift state up: perf problem 😱

const Profile = ({ name }) => {
    return <h1>Name is {name}</h1>;
};

const UserName = ({ name, setName }) => {
    return <input value={name} onChange={(e) => setName(e.target.value)} />;
};

export function App() {
    const [name, setName] = useState('');

    return (
        <div>
            <UserName name={name} setName={setName} />
            <Profile name={name} />
        </div>
    );
}
```

```jsx
// memo: fix perf 👍

const Profile = memo(({ name }) => {
    return <h1>Name is {name}</h1>;
});

const UserName = memo(({ name, setName }) => {
    return <input value={name} onChange={(e) => setName(e.target.value)} />;
});

export function App() {
    const [name, setName] = useState('');

    return (
        <div>
            <UserName name={name} setName={setName} />
            <Profile name={name} />
        </div>
    );
}
```

```jsx
// object prop: everything sucks 😱

const Profile = memo(({ user }) => {
    return <h1>Name is {user.name}</h1>;
});

const UserName = memo(({ user, setUser }) => {
    return <input value={user.name} onChange={(e) => setUser({ ...user, name: e.target.value })} />;
});

export function App() {
    const [user, setUser] = useState({ name: '' });

    return (
        <div>
            <UserName user={user} setUser={setUser} />
            <Profile user={user} />
        </div>
    );
}
```

```jsx{13}
// object prop: everything sucks 😱

const Profile = memo(({ user }) => {
    return (
        <h1>Name is {user.name}</h1>
    )
})

const UserName = memo(({ user, setUser }) => {
  return (
      <input
        value={user.name}
        onChange={e => setUser({ ...user, name: e.target.value })} />

  )
})

export function App() {
  const [user, setUser] = useState({ name: '' })

  return (
    <div>
      <UserName user={user} setUser={setUser} />
      <Profile user={user} />
    </div>
  )
}
```
````

<!--
So let's look at a common problem in React. We have state in a component, all good.

1. But then what if we want to reuse the state in a sibling component?

2. We have to lift the state up to the parent. And now we have a performance problem. Whenever we set the name it re-renders the whole app, including all child components.

3. So we wrap components in memo, and it's all fixed!

4. But then what if we have an object instead of a primitive?

5. Now setting requires cloning a new user object, and that goes through all the memos because it's not strictly equal, and re-renders everything again.
-->

---

### Legend-State: Fine-grained rendering 👍

```jsx
const Profile = observer(({ user$ }) => {
    return <h1>Name is {user$.name.get()}</h1>;
});

const UserName = ({ user$ }) => {
    return <Reactive.input $value={user.name} />;
};

export function App() {
    const user$ = useObservable({ name: '' });

    return (
        <div>
            <UserName user$={user$} />
            <Profile user$={user$} />
        </div>
    );
}
```

<!--
So let's look at the Legend-State way. This might seem familiar if you've used signals, or MobX, or Svelte, or Solid.

Profile observes name so it re-renders when name changes, but the app doesn't need to. And UserName doesn't re-render at all because the reactive input re-renders itself.
-->

---

<div>
    <video src="/media/finegrained.mov" autoplay loop muted class="h-[600px] rounded"></video>
</div>

<!--
This is what it looks like in practice, with a flashing box every time an element renders: in the unoptimized React version on the left, every time count changes, everything re-renders.

In the observable version on the right, it re-renders only the tiniest element that actually changed.
-->

---

<div>
    <img src="/media/perfchart.png" class="h-[560px]">
</div>

<!--
This along with a lot of other optimizations is how Legend-State is significantly faster than other React state libraries and even vanilla React.

And that brings me to the three words that will make your apps better.
-->

---
transition: view-transition
---

# Write less code {.inline-block.view-transition-less-code}

<!--
Write less code
-->

---

# Writing less code is better {.inline-block.view-transition-less-code}

<v-clicks>

1. Smaller surface area for errors
2. Smaller bundle
3. Faster
4. Faster

</v-clicks>

<!--
It might surprise you, but writing less code is better.

1. You're less likely to create bugs.

2. Less code makes the bundle smaller.

3. Doing less work makes apps faster.

4. And doing less work makes you faster.
-->

---

### Reactive inputs

```jsx
function ReactState() {
    const [name, setName] = useState('');

    return <input value={name} onChange={(e) => setName(e.target.value)} />;
}
```

<div class="text-center">
    vs.
</div>

```jsx
function LegendState() {
    const name$ = useObservable('');

    return <Reactive.input $value={name$} />;
}
```

<!--
So I'll show you some examples of Legend-State reducing boilerplate code.

The reactive components two-way bind to observables, so you don't need all the event handlers.
-->

---

### No more deps arrays

```jsx
function SetTitle() {
    const [name, setName] = useState('');
    useEffect(() => {
        document.title = `Hello ${name}`;
    }, [name]);

    return <input value={name} onChange={(e) => setName(e.target.value)} />;
}
```

<div class="text-center">
    vs.
</div>

```jsx
function SetTitle() {
    const name$ = useObservable('');
    useObserve(() => {
        document.title = `Hello ${name$.get()}`;
    });

    return <Reactive.input $value={name$} />;
}
```

<!--
Observing hooks track dependencies that you get() so they don't need manual dependency arrays.

So you can stop using useMemo and useEffect, which are error prone and just annoying.
-->

---

### No immutables

```jsx
function UserName() {
    const [user, setUser] = useState({ fname: '', lname: '' });

    return (
        <input value={user.fname} onChange={(e) => setUser({ ...user, fname: e.target.value })} />
    );
}
```

<div class="text-center">
    vs.
</div>

```jsx
function UserName() {
    const user$ = useObservable({ fname: '', lname: '' });

    return <input value={user$.fname.get$()} onChange={(e) => user$.fname.set(e.target.value)} />;
}
```

<!--
Legend-State knows exactly what values you're changing, so it doesn't need immutability for comparisons.

It's a lot easier to write, and easier to read, to set a property directly rather than to clone an object with a spread.

It's also much better for performance. Cloning objects creates new memory which then need to be garbage collected.
-->

---

### Syncing boilerplate

```jsx
function UserName() {
    const [user, setUser] = useState({ fname: '', lname: '' });
    const [isSaving, setSaving] = useState(false);

    useEffect(() => {
        (async () => {
            const result = await fetch('https://my.website.com/api');
            setUser(result.data);
        })();
    }, []);

    useEffect(() => {
        (async () => {
            setSaving(true);
            await fetch('https://my.website.com/api', {
                method: 'POST',
                data: JSON.stringify(user),
            });
            setSaving(false);
        })();
    }, [user]);

    return <input value={fname} onChange={(e) => setUser({ ...user, fname: e.target.value })} />;
}
```

<!--
Even doing basic sync in React is complex.

You have an effect to get the data, and an effect to update the server when it changes.

But then you'll want to show some status while it's saving, handle errors, retry on failures.

Maybe you want to persist data locally too.

It'll get huge.
-->

---

## Use a sync library

-   TanStack Query
-   SWR
-   Apollo
-   tRPC
-   React Server Components
-   useOptimistic hook

<!--
So if you're going to have sync code in React then you should probably use a library to do it, because there's so many edge cases to cover.

But I don't think you should have sync code in React. Why is why...
-->

---

# Observables sync themselves

<!--
Observables sync themselves
-->

---

## Normal sync

1. On event (click, input)
2. Send data to server
3. Wait and spin
4. Save remote state back into UI state

<div class="text-center mt-12">
    <img src="/media/loader.gif" class="h-12 mx-auto" >
</div>

<!--
In a regular web app when you make a change you send it to the server, wait for the server to respond, and then update the local state with the server response.

And you get a lot of spinners.
-->

---

### Sync with Query

```jsx {*}{class:'!children:text-[6px] !children-leading-1'}
function Todos() {
    // Access the client
    const queryClient = useQueryClient();

    // Queries
    const query = useQuery({
        queryKey: ['todos'],
        queryFn: async () => {
            const response = await fetch('https://url.to.get');
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            return response.json();
        },
    });

    // Mutations
    const mutation = useMutation({
        mutationFn: (newTodo) => {
            return fetch('https://url.to.set', { method: 'POST', body: JSON.stringify(newTodo) });
        },
        onSuccess: () => {
            // Invalidate and refetch
            queryClient.invalidateQueries({ queryKey: ['todos'] });
        },
    });

    const onClick = () => {
        mutation.mutate({
            id: Date.now(),
            title: 'Do Laundry',
        });
    };

    return (
        <div>
            <ul>
                {query.data?.map((todo) => (
                    <li key={todo.id}>{todo.title}</li>
                ))}
            </ul>
            <button onClick={onClick}>Add Todo</button>
        </div>
    );
}
```

<!--
Let's look at how you'd do it in Query. This is the quick start example.

It's so long I had to shrink the font.
-->

---

### Sync with Query

```jsx
function Todos() {
    ...

    // Mutations
    const mutation = useMutation({
        mutationFn: (newTodo) => {
            return fetch(
                'https://url.to.set',
                { method: 'POST', body: JSON.stringify(newTodo) }
            )
        },
        onSuccess: () => {
            // Invalidate and refetch
            queryClient.invalidateQueries({ queryKey: ['todos'] })
        },
    })

    const onClick = () => {
        mutation.mutate({
            id: Date.now(),
            title: 'Do Laundry',
        })
    }

    ...
}
```

<!--
Let's look at just the mutation part. On click you mutate which sends a POST to the server and waits. When that succeeds it re-runs the GET from the server again and waits again. When all that is done, it updates the local state.
-->

---

### useOptimistic

<style>
    .slidev-code-wrapper {
        width: 800px;
    }
</style>

```jsx
function Todos({ todos, sendTodo }) {
    const formRef = useRef();
    async function formAction(formData) {
        addOptimisticTodo(formData.get('title'));
        formRef.current.reset();
        await sendTodo(formData);
    }
    const [optimisticTodos, addOptimisticTodo] = useOptimistic(Todos, (state, newTodo) => [
        ...state,
        { text: newTodo, sending: true },
    ]);

    return (
        <>
            {optimisticTodos.map((todo, index) => (
                <div key={index}>
                    {todo.text}
                    {!!todo.sending && <small> (Sending...)</small>}
                </div>
            ))}
            <form action={formAction} ref={formRef}>
                <input type="text" name="title" />
                <button type="submit">Add todo</button>
            </form>
        </>
    );
}
```

<!--
Optimistic updating is a way to solve that waiting. Let's look at useOptimistic in React 19.

The idea is that before sending to the server you create a local copy, then when sync succeeds it replaces it with the server version.

But I find this very confusing. I have to manage both the local state and the remote data. And there's just a lot of code here.
-->

---

## Sync with Legend-State

<v-clicks>

1. Update observable
2. Observable syncs itself

</v-clicks>

<!--
So the way Legend-State does it is

1. You update an observable
2. And it syncs itself.
-->

---

### Sync with Legend-State

````md magic-move
```jsx
function Todos() {
    const todos$ = useObservable(() => syncedFetch({
        get: 'https://myserver/api/getTodos',
        set: 'https://myserver/api/setTodos'
    }))

    // Activate the fetch
    const todos = todos$.get()

    const onClick = () => {
        const id = Date.now()
        // Trigger the set
        todos$[id].set({
            id: Date.now(),
            title: 'Do Laundry',
        })
    }

    ...
}
```

```jsx{2-5}
function Todos() {
    const todos$ = useObservable(() => syncedFetch({
        get: 'https://myserver/api/getTodos',
        set: 'https://myserver/api/setTodos'
    }))

    // Activate the fetch
    const todos = todos$.get()

    const onClick = () => {
        const id = Date.now()
        // Trigger the set
        todos$[id].set({
            id: Date.now(),
            title: 'Do Laundry',
        })
    }

    ...
}
```

```jsx {7-8}
function Todos() {
    const todos$ = useObservable(() => syncedFetch({
        get: 'https://myserver/api/getTodos',
        set: 'https://myserver/api/setTodos'
    }))

    // Activate the fetch
    const todos = todos$.get()

    const onClick = () => {
        const id = Date.now()
        // Trigger the set
        todos$[id].set({
            id: Date.now(),
            title: 'Do Laundry',
        })
    }

    ...
}
```

```jsx{10-17}
function Todos() {
    const todos$ = useObservable(() => syncedFetch({
        get: 'https://myserver/api/getTodos',
        set: 'https://myserver/api/setTodos'
    }))

    // Activate the fetch
    const todos = todos$.get()

    const onClick = () => {
        const id = Date.now()
        // Trigger the set
        todos$[id].set({
            id: Date.now(),
            title: 'Do Laundry',
        })
    }

    ...
}
```

```jsx
function Todos() {
    const todos$ = useObservable(() =>
        syncedFetch({
            get: 'https://myserver/api/getTodos',
            set: 'https://myserver/api/setTodos',
        }),
    );

    // Activate the fetch
    const todos = todos$.get();

    const onClick = () => {
        const id = Date.now();
        // Trigger the set
        todos$[id].set({
            id: Date.now(),
            title: 'Do Laundry',
        });
    };

    return <For each={todos$} item={Todo} />;
}
```

```jsx
const todos$ = observable(() =>
    syncedFetch({
        get: 'https://myserver/api/getTodos',
        set: 'https://myserver/api/setTodos',
    }),
);

function Todos() {
    // Activate the fetch
    const todos = todos$.get();

    const onClick = () => {
        const id = Date.now();
        // Trigger the set
        todos$[id].set({
            id: Date.now(),
            title: 'Do Laundry',
        });
    };

    return <For each={todos$} item={Todo} />;
}
```
````

<!--
This is what that looks like.

1. First we setup how the observable syncs itself. We bind it to a remote API.

2. When we get() the value, the observable goes and fetches the data and updates itself when it comes in.

3. Then we can just set the observable, and it will go POST the update to the server.

4. So we can render our UI with the observables and let them sync themselves. But actually, I think it should be a global variable in a different file.

5. Now our UI doesn't care about our sync system. Our developers don't even need to know how things sync. They can just work with observables.
-->

---

### Fetch plugin

```js
const state$ = observable(
    syncedFetch({
        get: 'https://url.to.get',
        set: 'https://url.to.set',
        onSaved: (value) => {
            return {
                updatedAt: value.updatedAt,
            };
        },
    }),
);
```

<!--
The sync system uses the observables to know exactly what parts of an object changed to do all the hard sync logic.

We have a set of sync plugins like this fetch one.
-->

---

### CRUD plugin

```js
const messages$ = observable(
    syncedCrud({
        list: listMessages,
        create: createMessage,
        update: updateMessage,
        delete: deleteMessage,
    }),
);
```

<!--
There's also a CRUD plugin which handles listing rows, and determining which rows were created, updated, or deleted. So you can just give it your crud functions and it will do all that for you.
-->

---

### Supabase

```js
const messages$ = observable(
    syncedSupabase({
        supabase,
        collection: 'messages',
        // Filter by room
        filter: (select) => select.eq('room_id', roomId),
        // Realtime filter by room
        realtime: { filter: `room_id=eq.${roomId}` },
    }),
);
```

<!--
And we have more plugins built on top of the crud plugin, like Keel, Firebase, and this Supabase plugin.

You just give it your supabase client and table name, and it syncs everything for you.

And I'm aiming to add a lot more plugins. I had planned to make a PocketBase one after last month's talk but I ran out of time time, but I think we'll do it soon!
-->

---

### Bind UI to server

```jsx
const messages$ = observable(
    syncedSupabase({
        supabase,
        collection: 'messages',
        // Filter by room
        filter: (select) => select.eq('room_id', roomId),
        // Realtime filter by room
        realtime: { filter: `room_id=eq.${roomId}` },
    }),
);

const Message = (message) => {
    return (
        <div>
            <div>{message.sender}</div>
            <div>{message.text}</div>
        </div>
    );
};

const Messages = observer(() => {
    const messages = messages$.get();

    return messages.map(Message);
});
```

<!--
The messages observable syncs itself with Supabase and then we can just work with the messages. None of the components care about Supabase.

I could change the observable to sync with PocketBase instead, and wouldn't have to touch any of the components.

And that brings me to the three words that will make your apps better.
-->

---

# Local First + Sync

<!--
Local first and sync
-->

---

<div>
    <img src="/media/offline.png" />
</div>

<!--
I hate these screens so much! Apps have always worked fine offline, but then somehow over time it all got worse.

If I have my team chat open on a plane I can read all the messages, but I can't reply and I can't change channels. And if I accidentally close the app, it's all gone.

Why? You were just showing it to me! It makes me so mad!
-->

---

## Local first = 🔥 Great apps 🔥

1. Work offline
2. Instant startup
3. Instant updates
4. Lower costs
5. Reliability

<!--
So anyway. Truly great apps work offline. They're fast because they have all the data locally and don't wait for a server.

Since we have all the data cached, we can sync only the latest changes, so there's less server usage and bandwidth costs.

And if our server goes down, the app works fine until it comes back.
-->

---

# Demo

---

## Local first is hard

1. Special data types
    1. OT (Operational Transformation)
    2. CRDTs (Conflict-free Replicated Data Types)
2. Special databases
    1. PowerSync
    2. PouchDB
    3. Replicache
    4. DXOS
    5. ...

<!--
But local first is hard. Caching correctly is hard. Resolving conflicts is hard.

There are some special data types for merging local and remote changes. Google Docs used operational transforms, and the cool new kid on the block is CRDTs. But I'll be honest, I don't understand those at all.

There are also some special databases that help with caching and merging.

But as you can probably guess...
-->

---

## Legend-State does it for you

<!--
Legend State does it for you. All that hard stuff is built into the sync engine so you don't have to deal with it.
-->

---

### Supabase plugin with local-first

````md magic-move
```js
const messages$ = observable(
    syncedSupabase({
        supabase,
        collection: 'messages',
        // Filter by room
        filter: (select) => select.eq('room_id', roomId),
        // Realtime filter by room
        realtime: { filter: `room_id=eq.${roomId}` },
    }),
);
```

```js{8-13}
const messages$ = observable(syncedSupabase({
    supabase,
    collection: 'messages',
    // Filter by room
    filter: (select) => select.eq('room_id', roomId),
    // Realtime filter by room
    realtime: { filter: `room_id=eq.${roomId}` },
    // Persist data and pending changes locally
    persist: { name: 'messages', retrySync: true },
    // Retry on error
    retry: { infinite: true, backoff: 'exponential' },
    // Sync only diffs
    changesSince: 'last-sync'
}))
```

```js
const messages$ = observable(
    syncedSupabase({
        supabase,
        collection: 'messages',
        // Filter by room
        filter: (select) => select.eq('room_id', roomId),
        // Realtime filter by room
        realtime: { filter: `room_id=eq.${roomId}` },
        // Persist data and pending changes locally
        persist: { name: 'messages', retrySync: true },
        // Retry on error
        retry: { infinite: true, backoff: 'exponential' },
        // Sync only diffs
        changesSince: 'last-sync',
    }),
);
```

```js
const rooms$ = observable((roomId) => ({
    messages: syncedSupabase({
        supabase,
        collection: 'messages',
        // Filter by room
        filter: (select) => select.eq('room_id', roomId),
        // Realtime filter by room
        realtime: { filter: `room_id=eq.${roomId}` },
        // Persist data and pending changes locally
        persist: { name: 'messages', retrySync: true },
        // Retry on error
        retry: { infinite: true, backoff: 'exponential' },
        // Sync only diffs
        changesSince: 'last-sync'
    }),
    info: syncedSupabase({ ... })
}))

const messages = rooms$['sddevx'].messages.get()
```
````

<!--
Back to that Supabase example from before, we can enable local-first behavior with a few options.

1. Persist it locally, retry pending changes, and  sync only the diffs since the last sync

2. So now with those three lines we get all that sweet local-first action. But you're probably thinking well that's stupid, you didn't define the roomId.

3. Because what we really want here is a lookup table. So when we get a room by id, it immediately loads the cached messages. Then it syncs itself with Supabase and re-renders any updates.
-->

---

### Remote state <span style="font-family: Fira Code">===</span> local state

```jsx
const Message = ({ item$ }) => <div>{item$.text.get()}</div>;

const Messages = ({ roomId }) => {
    const messages$ = rooms$[roomId].messages;
    const newMessage$ = useObservable('');

    const addMessage = () => {
        const id = generateId();
        messages$[id].set({
            id,
            sender: 'myuid',
            text: newMessage$.get(),
        });
        newMessage$.set('');
    };

    return (
        <>
            <For each={messages$} item={Message} />
            <Reactive.input
                $value={newMessage$}
                onKeyDown={(e) => e.key === 'Enter' && addMessage()}
            />
        </>
    );
};
```

<!--
It's just so much easier when local state and remote state are the same thing.

We just get and set observables, and we have a robust local-first app.

And it is very robust. This includes everything I've learned about building Legend as a local-first app since 2015 and Bravely since 2022.

So that brings me to the three words that will make your apps better.
-->

---

# Use Legend-State

<!--
Use Legend State
-->

---

<div class="text-left">
    <h2 class="font-bold !text-left">1. ⚡️ Performance</h2>
    <h4 class="text-gray-400 pt-2">Render less, less often</h4>
    <br /><br />
    <v-click>
        <h2 class="font-bold !text-left">2. ✨ Developer Experience</h2>
        <h4 class="text-gray-400 pt-2">Write less code</h4>
        <br /><br />
    </v-click>
    <v-click>
        <h2 class="font-bold !text-left">3. 🔥 User Experience</h2>
        <h4 class="text-gray-400 pt-2">Local First + Sync</h4>
    </v-click>
</div>

<!--
But for real though, the three things that will make your apps better are good performance, because that makes users happy

1. Developer experience, because you'll build apps faster and with fewer bugs

2. And user experience, because that's what it's all about, delighting users. And users love apps that load quickly and don't make them wait.
-->

---

<div class="bg-white">
    <img src="/media/lastslide.png" class="h-[500px] w-auto"></img>
</div>
<div class="pt-1">
    Made with sli.dev
</div>

<!--
Thanks for listening to all of that!

That was all about the features of version 3 alpha. It's used in production in my two apps, but I'm just giving it some time to gather and fix issues, and write more docs. So hopefully beta will be within a few weeks.

You can scan this QR code to go to the github repo, or talk to me on Twitter or the devx discord.

Any questions?
-->
