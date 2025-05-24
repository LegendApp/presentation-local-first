# Module 3: Backend Integration & Multi-User Support

## Goal

Integrate the application with a backend service, add persistence, and implement multi-user support with proper access controls.

# Exercise 1: Persistent State

> [!NOTE]
> Checkout this branch as a starting point
>
> `git checkout 3-1`

We'll add persistence to our application state using Legend State's persistence plugins. This will allow our todos and user data to survive app restarts.

## Your Tasks

- Persist user state with the idUser
- Persist todos state
- Remove handling AsyncStorage with a hook

## Changes

### 1. Update State Configuration

First we'll add persistence to the `todos$` observable as well as adding a persisted `user$` observable with the unique id.

File: `expo-app/core/state.ts`

```diff
 import { Todo } from '@/core/keelClient';
-import { observable } from '@legendapp/state';
+import { observable, syncState, when } from '@legendapp/state';
+import { generateId } from '@/core/generateId';
+import { observablePersistAsyncStorage } from '@legendapp/state/persist-plugins/async-storage';
+import { synced } from '@legendapp/state/sync';
+import AsyncStorage from '@react-native-async-storage/async-storage';

-export const todos$ = observable<Record<string, Todo>>({});
+// Setup AsyncStorage plugin with the specific implementation
+const pluginAsyncStorage = observablePersistAsyncStorage({
+    AsyncStorage,
+});
+
+// Setup user$
+export const user$ = observable<{ id: string }>(
+    synced({
+        initial: {},
+        persist: {
+            plugin: pluginAsyncStorage,
+            name: 'user',
+        },
+    }),
+);
+
+// If persist loads without an id, generate one.
+when(syncState(user$).isPersistLoaded, () => {
+    if (!user$.id.peek()) {
+        user$.id.set(generateId());
+    }
+});
+
+// Setup todos$
+export const todos$ = observable<Record<string, Todo>>(
+    synced({
+        initial: {},
+        persist: {
+            plugin: pluginAsyncStorage,
+            name: 'todos',
+        },
+    }),
+);
```

### 2. Simplify HomeScreen Component

Now that `user$` is persisted in `state.ts` we can remove the useAsyncStorage hook and use the global state.

File: `expo-app/app/(tabs)/index.tsx`

```diff
 import { Todos } from '@/components/Todos';
-import { generateId } from '@/core/generateId';
-import { use$, useObservable } from '@legendapp/state/react';
-import { useAsyncStorage } from '@react-native-async-storage/async-storage';
-import { useMemo } from 'react';
+import { user$ } from '@/core/state';
+import { use$ } from '@legendapp/state/react';
 import { ScrollView, StyleSheet } from 'react-native';
 import { SafeAreaView } from 'react-native-safe-area-context';

 export default function HomeScreen() {
-    const { getItem, setItem } = useAsyncStorage('my_id');
-
-    // Create observable for id
-    const id$ = useObservable<string | null>(null);
-    // Get raw value of id$
-    const id = use$(id$);
-
-    // get id from async storage or create it
-    useMemo(() => {
-        getItem().then((id) => {
-            if (id) {
-                id$.set(id);
-            } else {
-                const newId = generateId();
-                setItem(newId);
-                id$.set(newId);
-            }
-        });
-    }, []);
+    const id = use$(user$.id);
```

# Exercise 2: Backend Integration

> [!NOTE]
> Checkout this branch as a starting point
>
> `git checkout 3-2`

We'll integrate our application with a Keel backend using Legend State's sync plugins. This will enable synchronization between our local state and the server.

## Your Tasks

- Configure Keel API client with backend URL
- Enable backend sync for todos with CRUD operations
- Simplify todo creation to work with backend
- Add offline persistence with sync support

## Changes

### 1. Configure Backend Integration

Set up Keel integration to sync todos with a server.

File: `expo-app/core/state.ts`

```diff
 import { generateId } from '@/core/generateId';
-import { Todo } from '@/core/keelClient';
+import { APIClient, Todo } from '@/core/keelClient';
 import { observable, syncState, when } from '@legendapp/state';
 import { observablePersistAsyncStorage } from '@legendapp/state/persist-plugins/async-storage';
 import { synced } from '@legendapp/state/sync';
+import { syncedKeel } from '@legendapp/state/sync-plugins/keel';
 import AsyncStorage from '@react-native-async-storage/async-storage';

+// Setup Keel
+const keel = new APIClient({
+    baseUrl: 'https://staging-keel-demos-cGUFmA.keelapps.xyz/api',
+});
+
+const { queries, mutations } = keel.api;
+
 // Setup todos$
 export const todos$ = observable<Record<string, Todo>>(
-    synced({
-        initial: {},
+    syncedKeel({
+        client: keel,
+        initial: {} as Record<string, Todo>,
+        list: () => queries.listTodos({ where: { idUser: { equals: user$.id.get() } } }),
+        create: mutations.createTodo,
+        update: mutations.updateTodo,
+        delete: mutations.deleteTodo,
+        requireAuth: false,
+        waitFor: user$.id,
+        as: 'object',
         persist: {
             plugin: pluginAsyncStorage,
             name: 'todos',
```

### 2. Update Todo Creation

Keel adds `createdAt` and `updatedAt` in the backend, so we can simplify todo creation by using `assign` and removing those fields.

File: `expo-app/components/NewTodo.tsx`

```diff
 import { generateId } from '@/core/generateId';
-import { Todo } from '@/core/keelClient';
 import { todos$ } from '@/core/state';
 import { $, useObservable } from '@legendapp/state/react';
 import { StyleSheet } from 'react-native';

 export const NewTodo = ({ idUser }: NewTodoProps) => {
     const text$ = useObservable('');

     const addTodo = (text: string) => {
         const id = generateId();
-        todos$[id].set({
+        todos$[id].assign({
             id,
             text,
             idUser: idUser,
             completed: false,
-            createdAt: new Date(),
-            updatedAt: new Date(),
-        } as Todo);
+        });
     };
```

# Exercise 3: Global store and lookup tables

> [!NOTE]
> Checkout this branch as a starting point
>
> `git checkout 3-3`

We'll reorganize our state into a structured store with user-specific data and computed values. This demonstrates how to create a more scalable and maintainable state architecture.

## Your Tasks

- Create a centralized store configuration
- Set up user-specific state slices with lookup tables
- Move computed values into user-specific store sections
- Update components to use the new store structure

## Changes

### 1. Create Structured Store

Replace individual observables with a structured store that includes user-specific data. This uses Legend-State's "Lookup table" feature to treat `user` as an object indexed by a key, which returns an child with its own user-specific synced and computed observables.

File: `expo-app/core/state.ts`

```diff
-export const todos$ = observable<Record<string, Todo>>(
-    syncedKeel({
-        client: keel,
-        initial: {} as Record<string, Todo>,
-        list: () => queries.listTodos({ where: { idUser: { equals: user$.id.get() } } }),
+const sync = configureSynced(syncedKeel, {
+    client: keel,
+    persist: {
+        plugin: pluginAsyncStorage,
+    },
+    requireAuth: false,
+    waitFor: user$.id,
+    as: 'object',
+});
+
+export const store$ = observable({
+    users: sync({
+        list: () => queries.listUsers(),
+        persist: {
+            name: 'users',
+        },
+    }),
+    user: (idUser: string) => ({
+        todos: sync({
+            initial: {} as Record<string, Todo>,
+            list: () => queries.listTodos({ where: { idUser: { equals: idUser } } }),
+            create: mutations.createTodo,
+            update: mutations.updateTodo,
+            delete: mutations.deleteTodo,
+            persist: {
+                name: 'todos' + idUser,
+            },
+        }),
+        todosSorted: (): Todo[] =>
+            Object.values(store$.user[idUser].todos.get()).sort((A, B) => +A.createdAt - +B.createdAt),
+        numIncompleteTodos: () =>
+            Object.values(store$.user[idUser].todos.get()).filter((todo) => !todo.completed).length,
+    }),
+});
```

### 2. Update NewTodo Component

Update todo creation to use the user-specific store slice.

File: `expo-app/components/NewTodo.tsx`

```diff
 import { generateId } from '@/core/generateId';
-import { todos$ } from '@/core/state';
+import { store$ } from '@/core/state';
 import { $, useObservable } from '@legendapp/state/react';
 import { StyleSheet } from 'react-native';

 export const NewTodo = ({ idUser }: NewTodoProps) => {
     const text$ = useObservable('');

     const addTodo = (text: string) => {
         const id = generateId();
-        todos$[id].assign({
+        store$.user[idUser].todos[id].assign({
             id,
             text,
             idUser: idUser,
             completed: false,
         });
     };
```

### 3. Update TodoList Component

Modify components to access the new store structure. The TodoList will now take an `idUser` so that it could show todo lists from different users.

File: `expo-app/components/TodoList.tsx`

```diff
 import { TodoItem } from '@/components/TodoItem';
-import { todos$, todosSorted$ } from '@/core/state';
+import { store$ } from '@/core/state';
 import { use$ } from '@legendapp/state/react';

-interface TodoListProps {}
+interface TodoListProps {
+    idUser: string;
+}

-export const TodoList = ({}: TodoListProps) => {
-    const todos = use$(todosSorted$, { shallow: true });
+export const TodoList = ({ idUser }: TodoListProps) => {
+    const user$ = store$.user[idUser];
+    const todos = use$(user$.todosSorted);

-    return todos.map((todo) => <TodoItem key={todo.id} todo$={todos$[todo.id]} />);
+    return todos.map((todo) => <TodoItem key={todo.id} todo$={user$.todos[todo.id]} />);
```

### 4. Update Todos Component

And pass the isUser down to the `TodoList`.

File: `expo-app/components/Todos.tsx`

```diff
export function Todos({ idUser }: TodosProps) {
    console.log('1 - Todos');

    return (
        <View>
            <Text style={styles.heading}>Todos$</Text>
            <NewTodo idUser={idUser} />
-           <TodoList />
+           <TodoList idUser={idUser} />
        </View>
    );
}
```

### 5. Update Layout Component

The Home tab should display only our incomplete todos, not from any other user

File: `expo-app/app/(tabs)/_layout.tsx`

```diff
 import { Colors } from '@/constants/Colors';
-import { numIncompleteTodos$ } from '@/core/state';
+import { store$, user$ } from '@/core/state';

 export default function TabLayout() {
     const colorScheme = useColorScheme();

+    const idMe = use$(user$.id);
+    const numIncompleteTodos$ = store$.user[idMe].numIncompleteTodos;
     const numIncompleteTodos = use$(numIncompleteTodos$);
```

# Exercise 4: Multi-User Support

> [!NOTE]
> Checkout this branch as a starting point
>
> `git checkout 3-4`

We'll add support for viewing other users' todos. This demonstrates how to work with a hierarchy of observables and sync them on demand.

## Your Tasks

- Add permission control with isSelf flag
- Create a users list view with navigation
- Implement user detail screen with todos
- Update components for read-only access
- Connect user navigation to the store

## Changes

### 1. Update Todos Component

First let's make sure that only the Todos component on our homescreen can add todos.

File: `expo-app/components/Todos.tsx`

```diff
 interface TodosProps {
     idUser: string;
+    isSelf: boolean;
 }

-export function Todos({ idUser }: TodosProps) {
+export function Todos({ idUser, isSelf }: TodosProps) {
     console.log('1 - Todos');

     return (
         <View>
             <Text style={styles.heading}>Todos$</Text>
-            <NewTodo idUser={idUser} />
+            {isSelf && <NewTodo idUser={idUser} />}
             <TodoList idUser={idUser} />
         </View>
     );
```

File: `expo-app/app/(tabs)/index.tsx`

```diff
     return (
         <SafeAreaView style={styles.container}>
-            <ScrollView style={styles.scrollView}>{id && <Todos idUser={id} />}</ScrollView>
+            <ScrollView style={styles.scrollView}>{id && <Todos idUser={id} isSelf />}</ScrollView>
         </SafeAreaView>
     );
```

### 2. Implement Users List

Connect users list to store and implement user links.

File: `expo-app/app/(tabs)/users.tsx`

```diff
-import { users$ } from '@/core/state';
+import { store$ } from '@/core/state';
 import { use$ } from '@legendapp/state/react';
-import { ScrollView, StyleSheet, Text } from 'react-native';
 import { Link } from 'expo-router';
+import { ScrollView, StyleSheet, Text } from 'react-native';
 import { SafeAreaView } from 'react-native-safe-area-context';

 function UsersList() {
-    const usersArr: any[] = [];
+    const users = use$(store$.users);
+    const usersArr = Object.values(users || {});

     return usersArr.map((user) => (
         <Link key={user.id} href={`/user/${user.id}`} style={styles.user}>
```

### 3. Create User Detail Screen

Implement individual user todo view.

File: `expo-app/app/user/[idUser].tsx`

```diff
+import { Todos } from '@/components/Todos';
 import { useLocalSearchParams } from 'expo-router';
+import { ScrollView, StyleSheet } from 'react-native';
+import { SafeAreaView } from 'react-native-safe-area-context';

-import { Text } from 'react-native';
+export default function User() {
+    const { idUser } = useLocalSearchParams<{ idUser: string }>();

-export default function Page() {
-    const { idUser } = useLocalSearchParams();
+    console.log('8 - User screen');

-    return <Text>User: {idUser}</Text>;
+    return (
+        <SafeAreaView style={styles.container}>
+            <ScrollView style={styles.scrollView}>
+                <Todos key={idUser} idUser={idUser} isSelf={false} />
+            </ScrollView>
+        </SafeAreaView>
+    );
 }
+
+const styles = StyleSheet.create({
+    container: {
+        flex: 1,
+    },
+    scrollView: {
+        paddingHorizontal: 16,
+    },
+    heading: {
+        fontSize: 24,
+        fontWeight: 'bold',
+        textAlign: 'center',
+        paddingBottom: 16,
+    },
+    user: {
+        borderRadius: 8,
+        marginBottom: 8,
+        backgroundColor: '#fff',
+        shadowColor: '#000',
+        shadowOffset: { width: 0, height: 2 },
+        shadowOpacity: 0.25,
+        elevation: 5,
+        padding: 16,
+    }
+});
```
