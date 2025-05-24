# Module 1: Introduction to Legend State

## Goal

Learn the fundamentals of Legend State by converting a React application from traditional useState hooks to Legend State observables.

# Exercise 0: Get up and running

> [!NOTE]
> Checkout this branch as a starting point
>
> `git checkout 1-1`

For the full experience, try to have the app running on both your phone/simulator and your browser. However, you can still do the entire workshop if you can only get one of these working.

1. Run npm install
2. Run npx expo start
3. Scan the QR Code on Expo Go on your phone, or press i to open in the iOS simulator.
4. Press w to run in your web browser.

# Exercise 1: Converting to Legend State Observables

> [!NOTE]
> Checkout this branch as a starting point
>
> `git checkout 1-1`

We'll convert a React application from using `useState` to Legend State observables. This introduces the basic concepts of observables and how they replace traditional React state management.

## Your Tasks

- Find components using `useState` and replace them with `useObservable` and `use$`
- Update state setters to use `.set()`
- Use built-in array methods on observable arrays
- Remove all immutability

## Tips

- Import `useObservable` and `use$` from `'@legendapp/state/react'`
- Observable arrays work like normal arrays
- Use `peek()` when reading values you don't want to subscribe to

## Changes

### 1. Convert User ID Management

Update the HomeScreen component to use an observable for the user ID instead of useState.

File: `expo-app/app/(tabs)/index.tsx`

```diff
 import { Todos } from '@/components/Todos';
 import { generateId } from '@/core/generateId';
+import { use$, useObservable } from '@legendapp/state/react';
 import { useAsyncStorage } from '@react-native-async-storage/async-storage';
-import { useMemo, useState } from 'react';
+import { useMemo } from 'react';
 import { ScrollView, StyleSheet } from 'react-native';
 import { SafeAreaView } from 'react-native-safe-area-context';

 export default function HomeScreen() {
     const { getItem, setItem } = useAsyncStorage('my_id');
-    const [id, setId] = useState<string | null>(null);
+
+    // Create observable for id
+    const id$ = useObservable<string | null>(null);
+    // Get raw value of id$
+    const id = use$(id$);

     // get id from async storage or create it
     useMemo(() => {
         getItem().then((id) => {
             if (id) {
-                setId(id);
+                id$.set(id);
             } else {
                 const newId = generateId();
                 setItem(newId);
-                setId(newId);
+                id$.set(newId);
             }
         });
     }, []);
```

> See the `1b` branch for the full solution.

### 2. Convert Text Input State

The NewTodo component now uses an observable for the input text state, showing how to handle form input with observables.

File: `expo-app/components/NewTodo.tsx`

```diff
-import { useState } from 'react';
+import { use$, useObservable } from '@legendapp/state/react';
 import { NativeSyntheticEvent, StyleSheet, TextInput, TextInputSubmitEditingEventData } from 'react-native';

 interface NewTodoProps {
     addTodo: (text: string) => void;
 }

 export const NewTodo = ({ addTodo }: NewTodoProps) => {
-    const [text, setText] = useState('');
+    const text$ = useObservable('');
+    const text = use$(text$);

     const handleSubmitEditing = ({ nativeEvent: { text } }: NativeSyntheticEvent<TextInputSubmitEditingEventData>) => {
-        setText('');
+        text$.set('');
         addTodo(text);
     };

     return (
         <TextInput
             value={text}
-            onChangeText={(text) => setText(text)}
+            onChangeText={(text) => text$.set(text)}
             onSubmitEditing={handleSubmitEditing}
             placeholder="What do you want to do?"
             style={styles.input}
         />
     );
 };
```

File: `expo-app/components/Todos.tsx`

### 3. Convert Todos Array Management

The Todos component now uses an observable array, demonstrating more complex state management with observables.

```diff
 import { NewTodo } from '@/components/NewTodo';
 import { TodoList } from '@/components/TodoList';
 import { generateId } from '@/core/generateId';
 import { Todo } from '@/core/keelClient';
-import { useState } from 'react';
+import { use$, useObservable } from '@legendapp/state/react';
 import { StyleSheet, Text, View } from 'react-native';

 interface TodosProps {
     idUser: string;
 }

 export function Todos(props: TodosProps) {
-    const [todos, setTodos] = useState<Todo[]>([]);
+    // Create observable array of todos
+    const todos$ = useObservable<Todo[]>([]);
+    // Get raw value of todos$ and subscribe to changes
+    const todos = use$(todos$);
+
     const addTodo = (text: string) => {
-        setTodos([
-            ...todos,
-            {
-                id: generateId(),
-                text,
-                idUser: props.idUser,
-                completed: false,
-                createdAt: new Date(),
-                updatedAt: new Date(),
-            } as Todo,
-        ]);
+        todos$.push({
+            id: generateId(),
+            text,
+            idUser: props.idUser,
+            completed: false,
+            createdAt: new Date(),
+            updatedAt: new Date(),
+        } as Todo);
     };
     const updateTodo = (todo: Todo) => {
-        setTodos(todos.map((t) => (t.id === todo.id ? todo : t)));
+        // Find index of todo in todos$
+        const idx = todos$.peek().findIndex((t) => t.id === todo.id);
+        // Update todo observable at index
+        todos$[idx].set(todo);
     };
     const deleteTodo = (id: string) => {
-        setTodos(todos.filter((t) => t.id !== id));
+        // Find index of todo in todos$
+        const idx = todos$.peek().findIndex((t) => t.id === id);
+        // Remove todo from todos$ by index
+        todos$.splice(idx, 1);
     };
```

# Exercise 2: Passing Observable References

> [!NOTE]
> Checkout this branch as a starting point
>
> `git checkout 1-2`

You'll learn how to pass observable references between components, eliminating prop drilling and simplifying state management.

## Your Tasks

- Find places where you're passing state and update functions as props and pass observable references instead
- Components should directly read and modify state
- Use built-in observable methods like `.set()` and `.delete()`

## Tips

- Use the `Observable` type for proper TypeScript support
- Observable arrays can be used like normal arrays
- The `.delete()` method on arrays removes from the array

## Changes

### 1. Update NewTodo Component

Instead of receiving an `addTodo` function prop, the component now receives the todos observable directly. This allows it to push new items directly to the array without prop drilling.

File: `expo-app/components/NewTodo.tsx`

```diff
+ import { generateId } from '@/core/generateId';
+ import { Todo } from '@/core/keelClient';
+ import { Observable } from '@legendapp/state';

interface NewTodoProps {
-   addTodo: (text: string) => void;
+   idUser: string;
+   todos$: Observable<Todo[]>;
}

- export const NewTodo = ({ addTodo }: NewTodoProps) => {
+ export const NewTodo = ({ idUser, todos$ }: NewTodoProps) => {
    const text$ = useObservable('');
    const text = use$(text$);

+   const addTodo = (text: string) => {
+       todos$.push({
+           id: generateId(),
+           text,
+           idUser: idUser,
+           completed: false,
+           createdAt: new Date(),
+           updatedAt: new Date(),
+       } as Todo);
+   };
```

### 2. Update TodoItem Component

Instead of receiving update and delete function props, the component now receives a reference to its specific todo observable. This allows direct manipulation of the todo's properties.

File: `expo-app/components/TodoItem.tsx`

```diff
+ import { Observable } from '@legendapp/state';
+ import { use$ } from '@legendapp/state/react';

- export const TodoItem = ({
-     todo,
-     updateTodo,
-     deleteTodo,
- }: {
-     todo: Todo;
-     updateTodo: (todo: Todo) => void;
-     deleteTodo: (id: string) => void;
- }) => {
+ export const TodoItem = ({ todo$ }: { todo$: Observable<Todo> }) => {
+     const todo = use$(todo$);
      const completed = todo.completed;

      const onToggle = () => {
-         updateTodo({ ...todo, completed: !todo.completed });
+         todo$.completed.set((completed) => !completed);
      };
      const onChangeText = (text: string) => {
-         updateTodo({ ...todo, text });
+         todo$.text.set(text);
      };
      const onPressDelete = () => {
-         deleteTodo(todo.id);
+         todo$.delete();
      };
```

### 3. Update TodoList Component

The TodoList now receives the todos observable array and passes individual todo observables to each TodoItem. This creates a direct connection between each item and its state.

File: `expo-app/components/TodoList.tsx`

```diff
+ import { Observable } from '@legendapp/state';
+ import { use$ } from '@legendapp/state/react';

interface TodoListProps {
-   todos: Todo[];
-   updateTodo: (todo: Todo) => void;
-   deleteTodo: (id: string) => void;
+   todos$: Observable<Todo[]>;
}

- export const TodoList = ({ todos, updateTodo, deleteTodo }: TodoListProps) => {
+ export const TodoList = ({ todos$ }: TodoListProps) => {
+     const todos = use$(todos$);

-     return todos.map((todo) => <TodoItem key={todo.id} todo={todo} updateTodo={updateTodo} deleteTodo={deleteTodo} />);
+     return todos.map((todo, i) => <TodoItem key={todo.id} todo$={todos$[i]} />);
```

### 4. Simplify Todos Component

The root component is greatly simplified as it no longer needs to manage state update functions. It just creates and passes the observable.

File: `expo-app/components/Todos.tsx`

```diff
- export function Todos(props: TodosProps) {
+ export function Todos({ idUser }: TodosProps) {
    // Create observable array of todos
    const todos$ = useObservable<Todo[]>([]);
-   const todos = use$(todos$);

-   // Remove all the handler functions as they're now handled in child components
-   const addTodo = (text: string) => { ... };
-   const updateTodo = (todo: Todo) => { ... };
-   const deleteTodo = (id: string) => { ... };

    return (
        <View>
            <Text style={styles.heading}>Todos$</Text>
-           <NewTodo addTodo={addTodo} />
-           <TodoList todos={todos} updateTodo={updateTodo} deleteTodo={deleteTodo} />
+           <NewTodo idUser={idUser} todos$={todos$} />
+           <TodoList todos$={todos$} />
        </View>
    );
}
```

# Exercise 3: Global State

> [!NOTE]
> Checkout this branch as a starting point
>
> `git checkout 1-3`

We'll move our todos state to a global store using Legend State. This demonstrates how to share state across components without prop drilling or context providers.

> Some apps may want to move state up into a context instead, but for simplicity we'll do global state here. Since observables are stable references they're safe to put in context without triggering re-renders.

## Your Tasks

- Create a global state file with a todos observable
- Remove local state from the Todos component
- Update components to use the global todos state
- Remove unnecessary props between components
- Add a tab badge using the global state

## Changes

### 1. Create Global State File

First, we'll create a new file to hold our global state:

File: `expo-app/core/state.ts`

```diff
// New file: expo-app/core/state.ts
+import { Todo } from '@/core/keelClient';
+import { observable } from '@legendapp/state';
+
+export const todos$ = observable<Todo[]>([]);
```

### 2. Update Todos Component

Remove local state management and simplify the component:

File: `expo-app/components/Todos.tsx`

```diff
 import { NewTodo } from '@/components/NewTodo';
 import { TodoList } from '@/components/TodoList';
-import { Todo } from '@/core/keelClient';
-import { useObservable } from '@legendapp/state/react';
 import { StyleSheet, Text, View } from 'react-native';

 interface TodosProps {
     idUser: string;
 }

 export function Todos({ idUser }: TodosProps) {
-    // Create observable array of todos
-    const todos$ = useObservable<Todo[]>([]);
-
     return (
         <View>
             <Text style={styles.heading}>Todos$</Text>
-            <NewTodo idUser={idUser} todos$={todos$} />
-            <TodoList todos$={todos$} />
+            <NewTodo idUser={idUser} />
+            <TodoList />
         </View>
     );
 }
```

### 3. Update NewTodo Component

Use global todos$ instead of passed prop:

File: `expo-app/components/NewTodo.tsx`

```diff
 import { generateId } from '@/core/generateId';
 import { Todo } from '@/core/keelClient';
-import { Observable } from '@legendapp/state';
+import { todos$ } from '@/core/state';
 import { use$, useObservable } from '@legendapp/state/react';

 interface NewTodoProps {
     idUser: string;
-    todos$: Observable<Todo[]>;
 }

-export const NewTodo = ({ idUser, todos$ }: NewTodoProps) => {
+export const NewTodo = ({ idUser }: NewTodoProps) => {
     // ... rest of component remains the same
```

### 4. Update TodoList Component

Simplify props and use global todos$:

File: `expo-app/components/TodoList.tsx`

```diff
 import { TodoItem } from '@/components/TodoItem';
-import { Todo } from '@/core/keelClient';
-import { Observable } from '@legendapp/state';
+import { todos$ } from '@/core/state';
 import { use$ } from '@legendapp/state/react';

-interface TodoListProps {
-    todos$: Observable<Todo[]>;
-}
+interface TodoListProps {}

-export const TodoList = ({ todos$ }: TodoListProps) => {
+export const TodoList = ({}: TodoListProps) => {
```

### 5. Add Tab Badge

Use global todos$ to show count in tab bar:

File: `expo-app/app/(tabs)/_layout.tsx`

```diff
 import { Colors } from '@/constants/Colors';
+import { todos$ } from '@/core/state';
 import { useColorScheme } from '@/hooks/useColorScheme';
 import { TabBarIcon } from '@/ui/TabBarIcon';
+import { use$ } from '@legendapp/state/react';
 import { Tabs } from 'expo-router';

 export default function TabLayout() {
     const colorScheme = useColorScheme();
+    const todos = use$(todos$);

     return (
         <Tabs
             screenOptions={{
                 // ... other options
             }}>
             <Tabs.Screen
                 name="index"
                 options={{
                     title: 'Home',
                     tabBarIcon: ({ color, focused }) => (
                         <TabBarIcon name={focused ? 'home' : 'home-outline'} color={color} />
                     ),
+                    tabBarBadge: todos.length,
                 }}
             />
         </Tabs>
     );
 }
```
