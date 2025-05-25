---
theme: default
highlighter: shiki
transition: none
mdc: true
defaults:
    layout: center
    transition: view-transition
---

# Legend State

# Client state => Local First sync engine

<div class="absolute bottom-16 gap-y-2 flex flex-col">
  <div>Jay Meistrich</div>
  <div class="flex gap-x-5">
    <div>𝕏 @jmeistrich</div>
    <div>🦋 @jayz.us</div>
  </div>
  <div class="text-gray">Local First Conference - May 26, 2025</div>
</div>

<!--
Hi, I'm Jay! I'm here to talk about Legend State and how to build local-first apps with any backend.

Who here has built local-first apps before? And keep your hands up if you rolled your own solution.

Ok very interesting! Well let's talk state.
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
First a bit about me - I make Legend, a local-first productivity app that combines documents, calendars, and a built in browser.

Some users have millions of items that need to be filtered and sorted as you type, so performance and sync are critical.
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
I'm also working on Bravely, a platform for mental health therapists to run their practice and collaborate with their clients.

Healthcare data has intense security and privacy requirements, plus it needs to work reliably in poor network conditions. So local-first is essential.
-->

---

# Sync engine architecture

1. Local app state
2. Server app state
3. Sync engine coordinating local <-> remote

<!--
Building local-first apps usually means managing three things: your app state, the data from the server, and then a whole sync engine on top.

But what if your state management could handle the sync for you?
-->

---

# Legend State architecture

1. State that syncs itself

<!--
That's what Legend State does. Let me show you how.
-->

---

## Observables

```ts
import { observable } from '@legendapp/state'

// Observable objects
const user$ = observable({
    name: 'Jay',
    email: 'jay@legendapp.com',
    settings: {
        theme: 'dark',
        notifications: true
    }
})

// Or individual atoms
const theme$ = observable('dark')
```

<!--
Legend State uses observables. Some call this concept signals. I think of observables as signals with hierarchy.

You can create observables from any data structure - objects, arrays, primitives. The $ suffix is just a convention to indicate it's an observable.
-->

---

## Getting and Setting

```ts
const user$ = observable({
    name: 'Jay',
    email: 'jay@legendapp.com',
    settings: { theme: 'dark' }
    tags: ['admin']
})

// Get returns the raw data
user$.name.get() // 'Jay'

// Set updates the value
user$.name.set('John')

// Works with nested objects
user$.settings.theme.set('light')

// No immutables needed
user$.tags.push('developer')
```

<!--
The API is pretty simple - get() to read, set() to write. There's no weird immutable logic, no actions or reducers. Just direct manipulation.

And this works for any level of nesting.
-->

---

## Dynamic Proxies

```ts
const user$ = observable({
    settings: {
        theme: 'dark'
    }
    tags: ['admin']
}) // Proxy

const settings$ = user$.settings // Proxy
const theme$ = settings$.theme // Proxy
```

<!--
As you dot through an object it creates a Proxy for each child dynamically. It doesn't modify the data at all - an observable is a Proxy that wraps the raw data with functions for change tracking.
-->

---

## Fine-Grained Reactivity

```tsx
import { observable } from '@legendapp/state'
import { useSelector } from '@legendapp/state/react'

const user$ = observable({
    name: 'Jay',
    email: 'jay@legendapp.com'
})

function Profile() {
    // useSelector tracks this value and re-renders when it changes
    const name = useSelector(user$.name)

    return (
        <div>
            <h1>Hello {name}</h1>
            <input
                value={name}
                onChange={e => user$.name.set(e.target.value)}
            />
        </div>
    )
}
```

<!--
In React, useSelector tracks the observable and automatically re-renders when it changes.

This is a key difference from useState or other state libraries. Each useSelector call tracks only the specific data it accesses.

So when email changes, components only using user.name won't re-render. This granular tracking is great for performance.
-->

---

## Fine-Grained Reactivity

```tsx
import { observable } from '@legendapp/state'
import { Memo, $React } from '@legendapp/state/react'

const user$ = observable({
    name: 'Jay',
    email: 'jay@legendapp.com'
})

function Profile() {
    return (
        <div>
            <h1>Hello <Memo>{user$.name}</Memo></h1>

            <$React.input $value={user$.name} />
        </div>
    )
}
```

<!--
But even better for performance is for the component to not re-render at all. We can use this Memo component to make a tiny element that re-renders itself whenever name changes. And we can two-way bind this input directly to the the observable, so we don't have to re-render the whole component when the input changes.
-->

---

<div>
    <video src="/media/finegrained.mp4" autoplay loop muted class="h-[600px] rounded"></video>
</div>

<!-- This is what it looks like in practice, with a flashing box every time an element renders: in the normal React version on the left, every time count changes, everything re-renders.

In the observable version on the right, it re-renders only the tiniest element that actually changed.
-->

---

<div>
    <img src="/media/perfchart.png" class="h-[560px]">
</div>

<!-- This along with a lot of other optimizations is how Legend-State is significantly faster than other React state libraries and even vanilla React.

But this isn't the performance first conference, so let's focus on how this enables a sync engine.
-->

---

## Computed Observables

```ts
const state$ = observable({
    fname: 'Annyong',
    lname: 'Bluth',
    // Any child can be computed
    name: () => state$.fname.get() + ' ' + state$.lname.get(),
})
// Or it could be separate
const name$ = observable(() => state$.fname.get() + ' ' + state$.lname.get())

// Get the value of a computed observble
const name = state$.name.get()
```

<!--
Because an observable node is a Proxy that doesn't touch the raw data, it could actually point to anything. A child could just be data in an object.

But it can also be a function that lazily computes a value when accessed. So we can make computed observables with just a function.
-->

---

## Lookup table

```ts
const store$ = observable({
    users: {
        id1: { name: "Annyong" },
        id2: { name: "Buster" },
    },
    // Lookup table by id
    userNames: (id: string) => store$.users[id].name
})

store$.userNames["id1"].get() // 'Annyong'
store$.userNames["id1"].set("Hello")
```

<!--
Or we could just create a totally new object. We can make a lookup table that takes a key and points into a different observable.

Then that child is two-way bound into the users$ object.

This works well because computeds are lazy. So it creates new virtual proxies for each child dynamically as we access them. And that laziness allows something interesting...
-->

---

## Promise

````md magic-move
```js
const messages$ = observable(() =>
    fetch('https://myapi/messages').then((response) => response.json()),
)

messages.get() // Triggers the fetch
```

```js
const messages$ = observable(() =>
    fetch('https://myapi/messages').then((response) => response.json()),
)

function Messages() {
    // Triggers fetch and re-runs when complete
    const messages = useSelector(messages$) || []

    return <List>{messages.map(MessageRow)}</List>
}
```

```js
const messages$ = observable(
    syncedFetch({
        get: 'https://myapi/messages',
    }),
)

function Messages() {
    // Triggers fetch and re-runs when complete
    const messages = useSelector(messages$) || []

    return <List>{messages.map(MessageRow)}</List>
}
```

```js
const messages$ = observable(
    syncedFetch({
        get: 'https://myapi/messages',
        set: 'https://myapi/message',
    }),
)

function Messages() {
    // Triggers fetch and re-runs when complete
    const messages = useSelector(messages$) || []
    const onClickSend = () => {
        messages$['messageId'].set({
            id: 'messageId',
            sender: 'Annyong',
            text: 'Hello',
        })
    }
    return (
        <>
            <List>{messages.map(MessageRow)}</List>
            <Button onClick={onClickSend}>Send</Button>
        </>
    )
}
```
````

<!--
An observable could point at the result of a Promise. Since it's lazy, it doesn't do anything until you get() it, which triggers the fetch and updates itself when it resolves.

1. So then if we use that observable in a component, it will just re-render itself itself when data comes in. And then our component is bound to the server data, which is cool.

2. But fetching is more complicated than that, so we can make a sync plugin to wrap the complexity.

3. And that plugin can track its changes, to send them back to a server and do a two-way sync. So now we have an observable that is purely defined by server data, and is actually two-way bound to the server.
-->

---

## onChange metadata

```ts
const user$ = observable({
    profile: { name: 'Jay', email: 'jay@legendapp.com' },
    settings: { theme: 'dark', notifications: true }
})

user$.onChange(({ value, changes }) => {
    changes.forEach(change => {
        const { path, valueAtPath, prevAtPath } = change
        // ...
    })
})

// When you do this:
user$.profile.name.set('John')
// onChange fires with:
// path: ['profile', 'name'], valueAtPath: 'John', prevAtPath: 'Jay'
```

<!--
And that's where it gets interesting for local-first apps. Legend State doesn't just know that something changed - it knows exactly what changed, where, and how.

Every change includes the exact path that changed, the new value, and the previous value.

This granular change tracking is what makes Legend State perfect for a sync engine, because we can cache the changes metadata, and we can use it for determining what to sync.
-->

---

## Sync engine

```ts
const profile$ = observable(
    synced({
        get: () => getUserProfile(),
        set: ({ value, changes }) => setUserProfile(value)
        persist: {
            plugin: ObservablePersistLocalStorage,
            name: 'profile',
        },
    }),
)
```

<!--
So with all of that information we can build a simple sync engine. We have a synced helper which encapsulates persistence and sync logic.

So we can get the profile from the server, and send it back to the server when we modify it locally. It persists to local storage so on refresh it will use the cached local data immediately. This is all we need for a local first sync engine.
-->

---

### Syncing our data

````md magic-move
```ts
const messages$ = observable(
    synced({
        get: () => server.listAllMessages(),
        set: ({ changes }) => server.updateAllMessages(changes)
        persist: {
            plugin: ObservablePersistLocalStorage,
            name: 'messages',
        },
    }),
)

messages$['messageId'].set({
    id: 'messageId',
    sender: 'Annyong',
    text: 'Hello',
})
```
```ts
const messages$ = observable(
    syncedCrud({
        list: () => server.listAllMessages(),
        create: ({ value }) => server.createMessage(value),
        update: ({ value }) => server.updateMessage(value.id, value),
        delete: ({ value }) => server.deleteMessage(value.id),
        persist: {
            plugin: ObservablePersistLocalStorage,
            name: 'messages',
        },
    }),
)

messages$['messageId'].set({
    id: 'messageId',
    sender: 'Annyong',
    text: 'Hello',
})
```
```ts
const messages$ = observable(
    syncedCrud({
        list: ({ lastSync }) => server.listAllMessages({ after: lastSync }),
        create: ({ value }) => server.createMessage(value),
        update: ({ value }) => server.updateMessage(value.id, value),
        delete: ({ value }) => server.deleteMessage(value.id),
        persist: {
            plugin: ObservablePersistLocalStorage,
            name: 'messages',
            // Cache pending changes to retry after reload
            retrySync: true,
        },
        // Retry sync indefinitely until it succeeds
        retry: { infinite: true, backoff: 'exponential' },
        // Sync partial with only what's changed since last sync
        changesSince: 'last-sync',
        // Field to use for updated timestamps
        fieldUpdatedAt: 'updated_at'
    }),
)

messages$['messageId'].set({
    id: 'messageId',
    sender: 'Annyong',
    text: 'Hello',
})
```
````

<!--
One way to make a sync engine could be to send that changes array to the server, and let it figure out how to apply it to the database.

2. Or we have a syncedCrud plugin which handles all of the crud logic. Just give it your server's crud functions. And the plugin internally figures out which rows were created, updated, or deleted, and produces a diff to send to the server. So if you update the text of a message, it will send a partial update of only the text.

3. And with a few more options we can set up a whole local-first sync engine. It caches all pending changes until they sync successfully, so even after restarting the app it keeps retrying.

It keeps track of the updated timestamps to get only the rows that changed since the last sync, which is a huge bandwidth and processing time saver.
-->


---

## Pending changes

```ts
pending = {
    'users/ABC123/name': {
        previous: 'Hello',
        value: 'Annyong',
    },
    'users/ABC123/email': {
        previous: 'hello@bluths.com',
        value: 'annyong@bluths.com',
    },
}
```

<!--
The key to making all this work is that we know what fields are changing, so the sync engine can cache the pending changes.

We keep track of data pending save until it's successful. So when we restart and come back online, we first receive the latest data from the server, then re-apply any pending changes on top of the newly synced data and if it's still changed it will keep trying to send the update.
-->

---

## Multiple Synced Collections

```tsx
const app$ = observable({
    messages: (roomId) => syncedSupabase({
        supabase,
        collection: 'messages',
        filter: (select) => select.eq('room_id', roomId),
        realtime: { filter: `room_id=eq.${roomId}` },
        persist: { name: 'messages' },
        realtime: true
    }),
    users: syncedSupabase({
        supabase,
        collection: 'users',
        persist: { name: 'users' }
    }),
    // Local-only state mixed in
    ui: {
        sidebarOpen: true,
        currentRoom: roomId
    }
})

const settings$ = observable({
    theme: 'dark'
})
```

<!--
You can mix synced and local-only state in one large observable store, or use as many as you want.

They only sync when first accessed, so you can set up a massive store for tons of different things, and they'll update as you navigate around.

Or if it's better for your app you can observe everything so it's always up to date.
-->

---

## Computed Values

```tsx
const app$ = observable({
    messages: syncedSupabase({...}),
    users: syncedSupabase({...}),

    // Computed from synced data
    unreadCount: () => {
        return app$.messages.get()
            .filter(msg => !msg.read && msg.user_id !== currentUser.id)
            .length
    },

    // Computed user lookup
    messagesBySender: (senderidId: string) => {
        const messages = app$.messages.get()
        return messages.filter(msg => msg.user_id === senderId)
    }
})
```

<!--
And since all of your synced data is in observables, you get all the nice properties of observables like easy computed values

These automatically update when the underlying data changes, whether from local updates or incoming sync changes.
-->

---

## Sync state

```tsx
const messages$ = observable(
    syncedCrud({
        ...,
        onError: (error) => { ... }
    })
)

const { isPersistLoaded,
        isLoaded,
        isPersistEnabled,
        isSyncEnabled,
        isGetting,
        isSetting,
        numPendingGets,
        numPendingSets,
        syncCount } = syncState(messages$).get()
```

<!--
If you want to dsplay loading states or handle errors in the frontend we have a syncState helper to get that those details.
-->

---

## Realtime

```tsx
const messages$ = observable(
    syncedCrud({
        ...,
        subscribe: ({ refresh, update }) => {
            // Firebase
            firebase.onValue('path/to/signal', update)
            // Pusher
            const channel = pusher.subscribe('my-channel')
            channel.bind('my-event', update)
            // WebSocket
            const ws = new WebSocket("ws://server:8080") // Replace with your server's address
            ws.onmessage = (event) => {
                update(event.data)
            }
            // Poll
            setInterval(refresh, 5000)
        }
    })
)
```

<!--
To do local first well you really want to have realtime updates. So syncedCrud has a subscribe parameter to setup a realtime listener or just poll for changes.
-->

---

## Works with any backend

````md magic-move
```ts
const user$ = observable(() =>
    syncedSupabase({
        supabase,
        collection: 'users',
        select: (from) => from.select('id, name'),
        filter: (from) => from.eq('id', userId),
        as: 'value',
        persist: {
            plugin: ObservablePersistAsyncStorage,
            name: 'user' + userId,
        },
    }),
)
```
```tsx
const brightness$ = observable(
    synced({
        get: () => Brightness.getBrightnessAsync(),
        set: ({ value }) => Brightness.setBrightnessAsync(value),
        subscribe: ({ update }) => {
            Brightness.addBrightnessListener(({ brightness }) => {
                update(brightness)
            })
        },
    }),
)

function BrightnessSettings() {
    // Never re-renders
    return (
        <View>
            <$Text>{brightness$}</$Text>
            <Slider $value={brightness$} />
        </View>
    )
}
```
````

<!--
Because the sync engine is in the state, it doesn't actually care what your backend looks like. This is one of the things that makes Legend State cool, that it can work with any backend. We have built-in plugins for Supabase, Firebase, Keel, and React Query. Or you can build your own plugin on top of syncedCrud.

2. Or it doesn't even have to be a server. You could two-way bind your state to anything, liking calling functions across the Electron bridge or using device APIs.
-->

---

## Enhance over time

````md magic-move
```tsx
const todos$ = observable([
    { id: 1, text: 'Learn Legend State', done: false }
])
```
```tsx
const todos$ = observable([
    { id: 1, text: 'Learn Legend State', done: false }
])

// Persist to localStorage
syncObservable(todos$, {
    persist: {
        plugin: ObservablePersistLocalStorage,
        name: 'todos',
    },
})
```
```tsx
// Add persistence
const todos$ = observable([
    { id: 1, text: 'Learn Legend State', done: false }
])

// Sync with Supabase
syncObservable(todos$, syncedSupabase({
    supabase,
    collection: 'todos',
    select: (from) => from.select('id, text, done'),
    filter: (from) => from.eq('id', userId),
    persist: {
        plugin: ObservablePersistAsyncStorage,
        name: 'todos',
    },
}))
```
```tsx
// Change your backend
const todos$ = observable([
    { id: 1, text: 'Learn Legend State', done: false }
])

// Sync with custom backend
syncObservable(todos$, syncedCrud({
    list: () => server.listTodos(),
    create: (value) => server.addTodo(value),
    update: (value) => server.editTodo(value),
    delete: (value) => server.deleteTodo(value.id),
    persist: {
        plugin: ObservablePersistAsyncStorage,
        name: 'todos',
    },
}))
```
````

<!--
And since the sync system lives inside the state, your frontend code doesn't need to know anything about it. It just gets and sets observables. So you can prototype with just local state.

2. And then add persistence to cache it

3. Then use Supabase for quick and easy syncing

4. Then switch it to another provider or your own custom backend. And your app code doesn't care and never has to change.  I actually have done that myself - I changed from a document store using Firebase to a Postgres SQL backend, and didn't need to change the frontend at all.
-->

---

### useOptimistic

```tsx {*}{class:'!children:text-[9px] !children-leading-1'}
function Todos({ todos, sendTodo }) {
    const formRef = useRef()
    function formAction(formData) {
        addOptimisticMessage(formData.get("message"))
        formRef.current.reset()
        startTransition(async () => {
            await sendMessageAction(formData)
        })
    }
    const [optimisticMessages, addOptimisticMessage] = useOptimistic(
        messages,
        (state, newMessage) => [
            {
                text: newMessage,
                sending: true
            },
            ...state,
        ]
    )

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
    )
}
```

<!--
And let's just quickly look at how much easier this is than some alternatives.

React 19 includes a useOptimistic hook.

The idea is that before sending to the server you create a local copy, then when sync succeeds it replaces it with the server version.

But I find this very confusing. I have to manage both the local state and the remote data. And there's just a lot of code here.
-->


---

### Sync with Query

```ts {*}{class:'!children:text-[9px] !children-leading-1'}
const { isPending, isError, data, error } = useQuery({
    queryKey: ['todos'],
    queryFn: fetchTodoList,
  })

const mutation = useMutation({
  mutationFn: updateTodo,
  // When mutate is called:
  onMutate: async (newTodo) => {
    // Cancel any outgoing refetches
    // (so they don't overwrite our optimistic update)
    await queryClient.cancelQueries({ queryKey: ['todos'] })

    // Snapshot the previous value
    const previousTodos = queryClient.getQueryData(['todos'])

    // Optimistically update to the new value
    queryClient.setQueryData(['todos'], (old) => [...old, newTodo])

    // Return a context object with the snapshotted value
    return { previousTodos }
  },
  // If the mutation fails,
  // use the context returned from onMutate to roll back
  onError: (err, newTodo, context) => {
    queryClient.setQueryData(['todos'], context.previousTodos)
  },
  // Always refetch after error or success:
  onSettled: () => queryClient.invalidateQueries({ queryKey: ['todos'] }),
})

const onClick = () => {
    mutation.mutate({ id: new Date(), title: 'Do Laundry' })
}
```

<!--
And let's look at React Query's optimistic mutations example.

You have to first cancel current queries, snapshot the current value, overwrite the internal query cache with the optimistic value, and keep the previous value in case of failure, and manually invalidate previous queries because it changed.
-->

---

## Sync with Legend State

```ts
const todos$ = useObservable(syncedCrud({
    list: fetchTodoList,
    create: ({ value }) => createTodo(value)
    update: ({ value }) => updateTodo(value)
}))

const todos = useSelector(todos$)

const onClick = () => {
    const id = new Date()
    todos$[id].set({
        id,
        title: 'Do Laundry'
    })
}
```

<!--
The Legend State version is just a lot easier. All of that logic is handled internally in the sync engine, and you can just work with the state.
-->

---

# Conclusion

1. Best possible performance
2. Powerful sync engine
3. Backend agnostic
4. Simplest DX

<!--
So wrapping up this intro, I think Legend State is interesting because it gives you the best possible performance in React, and a very powerful backend-agnostic sync engine with simple DX.
 -->

---

# <span class="questionBox mr-4">?</span>

<!--
Any questions before we move on to building some stuff?
-->




---

# Conflict resolution

- Server-side
- Assumes client is not fully aware so should if client wanted to write it should send it to the server to figure it out, and possibly reject it
- Planning to add client-side options

---

# Migration

```ts
const state$ = observable(synced({
    persist: {
        ...,
        transform: {
            load: (value) => {
                // Transform cached data into latest format
                value.newField = value.oldField + 'change'
                delete value.oldField
                return value
            },
            save: (value) => doMySaveTransform(Value),
        }
    },
    transform: {
        load: (value) => doMyLoadTransform(Value),
        save: (value) => doMySaveTransform(Value),
    }
}))
```

---

# Persistence

## Web

- Local Storage
- IndexedDB

## React Native

- AsyncStorage
- mmkv
- sqlite

## Custom
- Make your own :)