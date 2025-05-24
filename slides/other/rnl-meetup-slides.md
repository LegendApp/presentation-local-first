---
theme: default
highlighter: shiki
transition: none
mdc: true
defaults:
    layout: center
    transition: view-transition
---

# Two way binding everything

### <span className="text-gray">into a fast local-first sync engine with Legend State</span>

<div class="absolute bottom-16">
  <div>Jay Meistrich</div>
  <div class="pt-1">🦋 @jayz.us</div>
  <div class="pt-1">&nbsp;𝕏 @jmeistrich</div>
  <div class="text-gray pt-1">React Native London - Nov 7, 2024</div>
</div>

<!--
Hi, I'm Jay.
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
I make Legend, a local-first productivity app that combines documents, calendars, and a built in browser. Some users have hundreds of documents with millions of items so it has really intense performance requirements.
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
I'm also working on Bravely, a platform for mental health therapists and clinics. It has strong security and privacy needs since it's private mental health data.
-->

---

<div>
    <img src="/media/legend-state.png" />
</div>

<!--
And I open sourced the core shared between both of them, the state and sync engine.
-->

---

# Holy Grail App {.inline-block.view-transition-holy-grail}

1. Extremely fast
2. Loads instantly
3. Realtime sync
4. Works offline
5. Resilient to network errors
6. Low bandwidth usage

<!--
Today I want to talk to you about how to build the best possible apps.

I think we can all agree that this describes the best possible app experience. An app that's fast, works offline, syncs in realtime, and never shows you error messages.
-->

---

# Local First &nbsp; &nbsp; &nbsp;&nbsp;&nbsp;&nbsp;{.inline-block.view-transition-holy-grail}

1. Extremely fast
2. Loads instantly
3. Realtime sync
4. Works offline
5. Resilient to network errors
6. Low bandwidth usage

<!--
It turns out that's what people call "local first". Here's a little demo of what that looks like.
-->

---

<video src="/media/legend-demo.mp4" autoplay muted class="h-[540px] rounded-lg"></video>

<!--
I have a desktop app and an Android app syncing in realtime.

I can turn off wifi and keep working, edit some stuff, add some stuff.

Add some stuff in the Android app.

I can restart the desktop app and it still works offline, add some more stuff.

Then I go back online and everything syncs up.
-->

---

# Local-first is hard 😱

<!--
I've been making local first apps for 10 years and it's really hard. There's a lot of weird edge cases, merge conflicts, potential for data loss.

Having a ton of data locally stretches performance, and it requires a different kind of architecture.

So after building new sync engines from scratch a bunch of times I found what I think is the best architecture to solve all of that.
-->

---

# Fine-grained two way binding

<!--
Two way binding. Now that probably sounds crazy so

2. I'll start from the top with the fine-grained bit.
-->

---

# Fine-grained <span class="opacity-30">two way binding</span>

<!--
Two way binding. Now that probably sounds crazy so

2. I'll start from the top with the fine-grained bit.
-->

---

## Signals

````md magic-move
```ts
interface Signal<T> {
    get: () => T;
    set: (value: T) => void;
    onChange: (callback: (value: T) => void) => void;
}
```

```ts
interface Signal<T> {
    get: () => T;
    set: (value: T) => void;
    onChange: (callback: (value: T) => void) => void;
}

const name$ = signal('');

name$.onChange((value) => {
    // Do something with new value
});

name$.set('Annyong');
```

```tsx
interface Signal<T> {
    get: () => T;
    set: (value: T) => void;
    onChange: (callback: (value: T) => void) => void;
}

const name$ = signal('');

const Component = () => {
    const name = use$(name$);

    return <Text>{name}</Text>;
};
```
````

<!--
You've probably heard about the new hotness Signals. But it's actually a pretty old concept.

It's basically a value that you can get and set, but you can also listen for changes.

2. And when a signal changes you can do something with the new value.

3. The easy example is you might want a component to re-render whenever the value changes.
-->

---

## Observable

````md magic-move
```ts
interface Observable<T> {
    get: () => T;
    set: (value: T) => void;
    onChange: (callback: (value: T) => void) => void;
}

const name$ = observable('');
name$.onChange(({ value }) => {
    // Do something with new value
});
name$.set('Annyong');
```

```ts
interface Observable<T> {
    get: () => T;
    set: (value: T) => void;
    onChange: (callback: (value: T) => void) => void;
    [K: string]: Observable<T<K>>;
}

const user$ = observable({ profile: { name: '' } });
user$.profile.name.onChange(({ value, changes }) => {
    // Do something with new value
});
user$.profile.name.set('Annyong');
```

```ts
interface Observable<T> {
    get: () => T;
    set: (value: T) => void;
    onChange: (callback: (value: T) => void) => void;
    [K: string]: Observable<T<K>>;
}

const user$ = observable({ profile: { name: '' } });
user$.profile.name.onChange(({ value, changes }) => {
    // changes:
    [
        {
            path: [],
            valueAtPath: 'Annyong',
            prevAtPath: 'Hello',
        },
    ];
});
user$.profile.name.set('Annyong');
```

```ts
interface Observable<T> {
    get: () => T;
    set: (value: T) => void;
    onChange: (callback: (value: T) => void) => void;
    [K: string]: Observable<T<K>>;
}

const user$ = observable({ profile: { name: '' } });
user$.onChange(({ value, changes }) => {
    // changes:
    [
        {
            path: ['profile', 'name'],
            valueAtPath: 'Annyong',
            prevAtPath: 'Hello',
        },
    ];
});
user$.profile.name.set('Annyong');
```
````

<!--
Legend State has Observables which are basically Signals but

2. with hierarchy. So you can make any object observable, and set and listen anywhere in it.

3. And the important part is that it comes with an array of exactly what changed.

4. So a listener at the root of an observable knows exactly what child changed and how.
-->

---

# Virtual Proxy

````md magic-move
```jsx
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
```

```jsx
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
    user$.name // Proxy('Annyong')
})
```

```ts
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

```jsx
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
    const value = use$(user$.name)

    return (
        <div>Name is {value}</div>
    )
})
```
````

<!--
This works using what I'm calling a Virtual Proxy.

Using JavaScript's Proxy feature. It has the same shape as a target object and intercepts property access. So if I'm accessing a child it returns a Proxy to the child, but if I call get() it tracks the access.

2. So if I access the name child I get a proxy to the name.

3. If I call get() on it then I get the raw value, and it tells the observer to re-run when it changes.

4. And I can have an observing React component that re-renders whenever it changes.

5. Or we have a hook for compatibility with React Compiler.
-->

---

## Fine-grained reactivity

```tsx
const user$ = observable({ profile: { name: '', email: '' }, settings: {} });

function UserName() {
    const userName = use$(user$.profile.name);

    return <Text>{userName}</Text>;
}
```

<!--
So with this we can heavily optimize rendering. If you get a value deep in an observable it listens to only that node for changes.

So if something changes off in the settings or the user's email it doesn't matter. This component only re-renders when name changes.
-->

---

## Fine-grained reactivity

<div class="text-xl">

1. 🔥 Performance
2. 🤘 Better DX

</div>

<!--
And that gives us much better performance, but it also gives us a better developer experience. We don't need to manually specify dependencies and memoize things. It knows what changed and optimizes itself.

And that brings us to two-way binding.
-->

---

## Two way binding&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;

<div class="text-xl">

1. 🔥 Performance
2. 🤘 Better DX

</div>

<!--
Which also gives us better performance and developer experience.
-->

---

## Two way binding = Controlled inputs

````md magic-move
```tsx
function UserName() {
    // Re-renders on every keystroke
    const [name, setName] = useState('');

    return <TextInput value={name} onChangeText={setName} />;
}
```

```tsx
function Settings() {
    // Re-renders on every keystroke
    const [name, setName] = useState('');

    return (
        <View>
            <Text>{name}</Text>
            <UserName name={name} setName={setName} />
        </View>
    );
}

function UserName({ name, setName }) {
    // Re-renders on every keystroke
    return <TextInput value={name} onChangeText={setName} />;
}
```
````

<!--
You're probably already familiar with two-way binding. It's basically what React calls controlled inputs. The change handler sets the state and it re-renders with the new state.

2. The problem with this though is when sharing state with a sibling component, you need to lift up the state to pass it back down. So now the outer component owns the state, and the name changing re-renders everything all the way down.
-->

---

## Fine-grained two-way binding

````md magic-move
```tsx
function Settings() {
    // Re-renders on every keystroke
    const [name, setName] = useState('');

    return (
        <View>
            <Text>{name}</Text>
            <UserName name={name} setName={setName} />
        </View>
    );
}

function UserName({ name, setName }) {
    // Re-renders on every keystroke
    return <TextInput value={name} onChangeText={setName} />;
}
```

```tsx
function Settings() {
    // Never re-renders
    const name$ = useObservable('');

    return (
        <View>
            <Reactive.Text>{name$}</Reactive.Text>
            <UserName name$={name$} />
        </View>
    );
}

function UserName({ name$ }) {
    // Never re-renders
    return <Reactive.TextInput $value={name$} />;
}
```
````

<!--
But fine-grained reactivity makes this a lot better.

2. We can change it to an observable and two-way bind it to a reactive input, which manages the change handler and sets the observable. Now the input re-renders itself and the component doesn't need to.

And when we want to use it in a sibling we can just pass the observable around, and bind to it. Now our components don't ever re-render because the reactive components handle it.
-->

---

# Inverted React model

<div class="text-xl pt-2">

❌ &nbsp; State provider re-renders

✅ &nbsp; State consumer re-renders

</div>

<!--
This basically inverts React's rendering model. Instead of state hooks triggering re-renders, the consumers re-render when the value they care about changes.

That results in much smaller re-renders in fewer components.
-->

---

# Render less, less often

<div class="text-xl">

1. 🔥 Performance

<v-clicks>

2. 🤘 Better DX

</v-clicks>

</div>

<!--
Which is a big performance win. Rendering does a bunch of work, and components often do a bunch of their own computations while rendering. So the best optimization is just to do less work.

2. But this isn't a performance talk. So let's talk about what else two-way binding can do for us.
-->

---

## Two-way bind to forms

```tsx
function App() {
    // Never re-renders
    const state$ = useObservable({ user: { name: '', email: '' }})

    const onPressSubmit = () => {
        const user = state$.user.get()
        validate(user)
        submit(user)
    }

    return (
        <Form>
            <Label>Name</Label>
            <Reactive.TextInput $value={user$.name} />
            <Label>Email</Label>
            <Reactive.TextInput $value={user$.email} />
            <Button onPress={onPressSubmit}>
        </Form>
    );
}
```

<!--
We can easily two-way bind observables to forms. Just bind inputs to observables and submit the value when you press the button.

This has great performance because the whole form never re-renders, just the inputs themselves. But it's also just less cumbersome and less code.
-->

---

## Two-way bind to URL

````md magic-move
```tsx
function SearchPage() {
    // Re-renders on every change
    const { search } = useGlobalSearchParams();

    const onSearchChange = (search) => {
        router.setParams({ search });
    };

    return (
        <View>
            <TextInput value={search} onChange={onSearchChange} />
            <SearcResults search={search} />
        </View>
    );
}
```

```tsx
function SearchPage() {
    // Re-renders on every change
    const { search } = useGlobalSearchParams();

    const onSearchChange = (search) => {
        router.setParams({ search });
    };

    return (
        <View>
            <TextInput value={search} onChange={onSearchChange} />
            <SearcResults search={search} />
        </View>
    );
}

function ProfilePage() {
    // Re-renders on every change
    const { user } = useGlobalSearchParams();

    return <Text>{user}</Text>;
}
```

```tsx
function SearchPage() {
    // Never re-renders
    const { search: search$ } = useGlobalSearchParams$();

    return (
        <View>
            <Reactive.TextInput $value={search$} />
            <SearcResults search$={search$} />
        </View>
    );
}

function ProfilePage() {
    // Never re-renders
    const { user: user$ } = useGlobalSearchParams();

    return <Reactive.Text>{user$.name}</Reactive.Text>;
}
```
````

<!--
Or you often want to react to a router's parameters changing, so you'd use a hook that re-renders when it changes.

2. But this hook re-renders every caller when any param changes, even if it's unrelated. But the profile page shouldn't have to re-render because the search changed.

3. In the Legend State way, the hook just returns an observable and doesn't re-render. So we can bind the search param to the input, and SearchResults can update itself whenever the search changes. The profile doesn't care.
-->

---

## Two-way bind to device APIs

```tsx
const brightness$ = observable(
    synced({
        get: () => Brightness.getBrightnessAsync(),
        set: ({ value }) => Brightness.setBrightnessAsync(value),
        subscribe: ({ update }) => {
            Brightness.addBrightnessListener(({ brightness }) => {
                update(brightness);
            });
        },
    }),
);

function BrightnessSettings() {
    // Never re-renders
    return (
        <View>
            <Reactive.Text>{brightness$}</Reactive.Text>
            <Slider $value={brightness$} />
        </View>
    );
}
```

<!--
We can two-way bind to any external data too. So an observable defines its link to an external API and then your components don't need to know anything about it. Just bind your UI to the brightness and it will sync itself.
-->

---

## Two-way bind to AsyncStorage

````md magic-move
```tsx
const UsernameInput = () => {
    const [username, setUsername] = useState('');

    // Load the username when component mounts
    useEffect(() => {
        (async () => {
            const savedUsername = await AsyncStorage.getItem('username');
            if (savedUsername) {
                setUsername(savedUsername);
            }
        })();
    }, []);

    // Save username whenever it changes
    const onUsernameChange = (newUsername) => {
        setUsername(newUsername);
        AsyncStorage.setItem('username', newUsername);
    };

    return <TextInput value={username} onChangeText={onUsernameChange} />;
};
```

```tsx
const UsernameInput = () => {
    const user$ = useObservable(() =>
        synced({
            persist: {
                plugin: ObservablePersistAsyncStorage,
                name: 'user',
            },
        }),
    );

    return <Reactive.TextInput $value={user$.name} />;
};
```
````

<!--
What if we wanted to save state in a local cache? You have to manage getting it on load and saving it back when it changes.

Plus this has a big problem, AsyncStorage is asynchronous so it will flash with empty text for a couple frames before it loads.

2. In the observable version we have a persistence system to take care of all that. And it has a preload option so there's no delays.
-->

---

## Two-way bind to a server and AsyncStorage

<v-click>

1. Load from AsyncStorage and from server
2. Save changes to AsyncStorage and server
3. Handle sync errors

</v-click>

<v-click>

4. Work offline
5. Cache pending changes
6. Robust retry system
7. Conflict resolution

</v-click>

<!--
Now what if you wanted to cache your data and sync it with a server?

You'd have to

...

And what if you wanted it to work offline? You'd have to

...

It's a lot of stuff. So here's how we'd do that in React.
-->

---

<div>
    <img src="/media/toomuch.gif" class="h-[460px] rounded-xl" />
</div>

<!--
That's just way too much. Without the fine-grained change tracking we can't really do it.
-->

---

## Two-way bind to a server and AsyncStorage

````md magic-move
```tsx
const UsernameInput = () => {
    const username$ = useObservable(() =>
        synced({
            persist: {
                plugin: ObservablePersistAsyncStorage,
                name: username,
            },
        }),
    );

    return <Reactive.TextInput $value={username$} />;
};
```

```tsx
const UsernameInput = ({ userId }) => {
    const user$ = useObservable(() =>
        syncedFetch({
            get: () => `https://myapi/users/${userId}`,
            set: () => `https://myapi/users/${userId}`,
            persist: {
                plugin: ObservablePersistAsyncStorage,
                name: 'user' + userId,
            },
        }),
    );

    return <Reactive.TextInput $value={user$.name} />;
};
```

```tsx
const UsernameInput = ({ userId }) => {
    const user$ = useObservable(() =>
        syncedKeel({
            get: () => getUser(userId),
            create: (value) => createUser(userId, value),
            update: (value) => updateUser(userId, value),
            delete: (value) => deleteUser(value.id),
            persist: {
                plugin: ObservablePersistAsyncStorage,
                name: 'user' + userId,
            },
        }),
    );

    return <Reactive.TextInput $value={user$.name} />;
};
```

```tsx
const UsernameInput = ({ userId }) => {
    const user$ = useObservable(() =>
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
    );

    return <Reactive.TextInput $value={user$.name} />;
};
```
````

<!--
But Legend State makes it easy. If we start with the previous example of persistence.

2. We can use a sync plugin to get and post data to a server as well
3. Or we could have a more complex database with CRUD actions
4. Or we could use Supabase with its client-side SQL queries

Because we know exactly what changes we can figure out which rows need to be created or updated, and even send partial updates with only the changed fields.
-->

---

## Local-first sync engine

```ts
const messages$ = observable((chatId) =>
    syncedCrud({
        list: () => listMessages(chatId),
        create: (value) => addMessage(value),
        update: (value) => editMessage(value),
        delete: (value) => deleteMessage(value.id),
        persist: {
            name: 'messages',
            plugin: ObservablePersistLocalStorage,
            // Cache pending changes to retry after reload
            retrySync: true,
        },
        // Retry sync indefinitely until it succeeds
        retry: { infinite: true, backoff: 'exponential' },
        // Sync partial with only what's changed since last sync
        changesSince: 'last-sync',
    }),
);
```

<!--
And with a few more options we can set up a whole local-first sync engine.

It caches all pending changes until they sync successfully, so even after restarting the app it keeps retrying.

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
};
```

<!--
The key to making all this work is that we know what fields are changing, so the sync engine can cache the pending changes.

So when we restart and come back online, we can re-apply the changes on top of any newly synced data and retry the update again.
-->

---

## Local state == Remote state

```tsx
const store$ = observable({
    user: synced({ ... }),
    chats: synced({ ... }),
});

function App() {
    return (
        <View>
            <Reactive.TextInput $value={store$.user.profile.name} />
            <Messages />
        </View>
    );
}

function Messages({ chatId$ }) {
    const { chatId: chatId$ } = useGlobalSearchParams$();

    const chatId = use$(chatId$);
    const messages = use$(store$.chats[chatId].messages);

    return <View>{messages.map(/* ...*/)}</View>;
}
```

<!--
So with the sync engine built into the observables themselves, in our React components we can just work with state.

We get all the performance benefits of fine-grained reactivity, and our UI components don't have to have any sync code in them.
-->

---

## Benefits of unified state

1. Smaller, less complex components

<v-clicks>

2. Faster app with fewer re-renders
3. Don't have to manage local and global state libraries
4. UI developers don't need to understand sync system

</v-clicks>

<!--
1. And that's great because we have a lot less code in our components now.

2. Re-renders are smaller and less frequent so everything is much faster.

3. And with one source of truth everything is just better.

4. Our designer learned Tailwind and JSX and now she's writing full components herself, which was only possible because so much complexity is removed. She now designs directly in code, which speeds up development like crazy. And we iterate so much faster.
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
1. And local first is great because it's obviously great to work offline.

2. But also apps load instantly because they have all the data cached, and don't wait for a server.

3. And there's less server usage and bandwidth costs because we sync less data.

4. And if our server goes down or wifi goes out, the app works totally fine and syncs gracefully when it comes back.
-->

---

<div>
    <img src="/media/offline.png" />
</div>

<!--
But most importantly, we don't have to see these stupid screens anymore. If I accidentally close my chat app while offline I shouldn't have to lose everything.
-->

---

# Local first is easy 🚀

<!--
And making local first apps is easy!

I mean it's really hard. But Legend State does all that hard work for you. It supports any backend and works on web and mobile.

So it's easy to make your apps local first to give your users a better experience.
-->

---

<div class="bg-white">
    <img src="/media/lastslide.png" class="h-[500px] w-auto"></img>
</div>

<!--
So I hope you'll try Legend State and making your apps local first.

You can scan this QR code to go to the github repo, or talk to me on Bluesky or Twitter.

Any questions?
-->
