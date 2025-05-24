# Module 2: Advanced State Management

## Goal

Master advanced Legend State concepts including computed values, reactive components, and efficient data structures.

# Exercise 1: Computed State and Shallow Listeners

> [!NOTE]
> Checkout this branch as a starting point
>
> `git checkout 2-1`

We'll learn about computed observables and side effects in Legend State. We'll create a computed value for incomplete todos and use it to update the UI and document title. And we'll see the difference with shallow listeners.

## Your Tasks

- Create a computed observable for incomplete todos count
- Update the tab badge to show incomplete count
- Add web-specific document title updates
- Optimize TodoList rendering with shallow listening

## Changes

### 1. Add Computed State

Create a derived state value that automatically calculates the number of incomplete todos. This computed observable will update automatically whenever the todos array changes or todos are marked as complete.

File: `expo-app/core/state.ts`

```diff
 import { Todo } from '@/core/keelClient';
 import { observable } from '@legendapp/state';

 export const todos$ = observable<Todo[]>([]);
+export const numIncompleteTodos$ = observable(() => todos$.get().filter((todo) => !todo.completed).length);
```

### 2. Update Tab Badge

Use the computed incomplete todos count to update the UI and document title. This demonstrates how to use computed values in the UI and how to create platform-specific side effects.

File: `expo-app/app/(tabs)/_layout.tsx`

```diff
 import { Colors } from '@/constants/Colors';
-import { todos$ } from '@/core/state';
+import { numIncompleteTodos$ } from '@/core/state';
 import { useColorScheme } from '@/hooks/useColorScheme';
 import { TabBarIcon } from '@/ui/TabBarIcon';
-import { use$ } from '@legendapp/state/react';
+import { use$, useObserve } from '@legendapp/state/react';
 import { Tabs } from 'expo-router';
 import React from 'react';
+import { Platform } from 'react-native';

 export default function TabLayout() {
     const colorScheme = useColorScheme();

-    const todos = use$(todos$);
+    const numIncompleteTodos = use$(numIncompleteTodos$);
+
+    if (Platform.OS === 'web') {
+        useObserve(() => {
+            document.title = `Todos (${numIncompleteTodos$.get()})`;
+        });
+    }

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
-                    tabBarBadge: todos.length,
+                    tabBarBadge: numIncompleteTodos || undefined,
                 }}
             />
         </Tabs>
     );
 }
```

### 3. Optimize TodoList Rendering

Improve performance by preventing unnecessary re-renders of the TodoList component. The `shallow: true` option means the component will only re-render when a todo is added or removed, not when individual todos are updated.

File: `expo-app/components/TodoList.tsx`

```diff
 interface TodoListProps {}

 export const TodoList = ({}: TodoListProps) => {
-    const todos = use$(todos$);
+    const todos = use$(todos$, { shallow: true });

     console.log('2 - TodoList');
```

# Exercise 2: Reactive Components

> [!NOTE]
> Checkout this branch as a starting point
>
> `git checkout 2-2`

We'll learn about Legend State's reactive components and how they can simplify our state code by directly binding observables to component props.

## Your Tasks

- Enable reactive components support for React Native
- Convert TextInput to use direct observable binding
- Create and use a reactive checkbox component
- Update styles to use reactive props

## Tips

- Use the `$` prefix for reactive components
- The `reactive()` helper creates custom reactive components
- Direct bindings eliminate need for change handlers
- Check render counts for performance verification

## Hint

Creating custom reactive components is pretty advanced, but for this example we want a reactive checkbox, so this is what you'll want to add to make a two-way bindable checkbox component. This makes the `value` prop take an Observable.

```ts
const ReactiveCheckbox = reactive(Checkbox, ["value"], {
  value: { handler: "onValueChange", getValue: (value: boolean) => value },
});
```

## Changes

### 1. Enable Reactive React Native Components

This lets you use the reactive components, such as `$.TextInput` so that you can bind props directly observables. It adds the types for all built-in React Native components as children of the `$` component.

File: `expo-app/app/_layout.tsx`

```diff
 import { Stack } from 'expo-router';
 import * as SplashScreen from 'expo-splash-screen';
 import { useEffect } from 'react';
 import 'react-native-reanimated';
 import { useColorScheme } from '@/hooks/useColorScheme';
+import { enableReactNativeComponents } from '@legendapp/state/config/enableReactNativeComponents';
+
+enableReactNativeComponents();
```

### 2. Update NewTodo Component

Simplify the input handling by using reactive components and direct observable binding.

File: `expo-app/components/NewTodo.tsx`

```diff
 import { generateId } from '@/core/generateId';
 import { Todo } from '@/core/keelClient';
 import { todos$ } from '@/core/state';
-import { use$, useObservable } from '@legendapp/state/react';
-import { NativeSyntheticEvent, StyleSheet, TextInput, TextInputSubmitEditingEventData } from 'react-native';
+import { $, useObservable } from '@legendapp/state/react';
+import { StyleSheet } from 'react-native';

 interface NewTodoProps {
     idUser: string;
 }

 export const NewTodo = ({ idUser }: NewTodoProps) => {
     const text$ = useObservable('');
-    const text = use$(text$);

-    const handleSubmitEditing = ({ nativeEvent: { text } }: NativeSyntheticEvent<TextInputSubmitEditingEventData>) => {
+    const handleSubmitEditing = () => {
+        addTodo(text$.get());
         text$.set('');
-        addTodo(text);
     };

     return (
-        <TextInput
-            value={text}
-            onChangeText={(text) => text$.set(text)}
+        <$.TextInput
+            $value={text$}
             onSubmitEditing={handleSubmitEditing}
             placeholder="What do you want to do?"
             style={styles.input}
         />
     );
 };
```

### 3. Update TodoItem Component

Convert to using reactive components and create a custom reactive checkbox component.

`reactive` makes the Checkbox's `value` prop support two-way binding directly to an observable, and sets up its handler to set the observable.

File: `expo-app/components/TodoItem.tsx`

```diff
 import { Todo } from '@/core/keelClient';
-import { Observable } from '@legendapp/state';
-import { use$ } from '@legendapp/state/react';
 import { Ionicons } from '@expo/vector-icons';
+import { Observable } from '@legendapp/state';
+import { $, reactive } from '@legendapp/state/react';
 import { Checkbox } from 'expo-checkbox';
-import { StyleSheet, TextInput, View } from 'react-native';
+import { StyleSheet } from 'react-native';

+const ReactiveCheckbox = reactive(Checkbox, ['value'], {
+    value: { handler: 'onValueChange', getValue: (value: boolean) => value },
+});

export const TodoItem = ({ todo$ }: { todo$: Observable<Todo> }) => {
-    const onToggle = () => {
-        todo$.completed.set((completed) => !completed);
-    };
-    const onChangeText = (text: string) => {
-        todo$.text.set(text);
-    };
-    const todo = use$(todo$);
-    const completed = todo.completed;

     const onPressDelete = () => {
         todo$.delete();
     };

     return (
-        <View style={[styles.todo, completed && styles.viewDone]}>
+        <$.View $style={() => [styles.todo, todo$.completed.get() && styles.viewDone]}>
-            <TextInput
-                style={[styles.todoText, completed && styles.textDone]}
-                value={todo.text}
-                onChangeText={onChangeText}
+            <$.TextInput
+                $style={() => [styles.todoText, todo$.completed.get() && styles.textDone]}
+                $value={todo$.text}
                 multiline
                 blurOnSubmit
             />
-            <Checkbox value={todo.completed || false} style={styles.checkbox} onValueChange={onToggle} />
+            <ReactiveCheckbox value={todo$.completed} style={styles.checkbox} />
             <Ionicons name="trash" size={24} color="red" style={styles.deleteButton} onPress={onPressDelete} />
-        </View>
+        </$.View>
     );
 };
```

# Exercise 3: Objects vs. arrays

> [!NOTE]
> Checkout this branch as a starting point
>
> `git checkout 2-3`

We'll refactor our todos state to use an object-based approach with IDs as keys, rather than arrays. This enables more efficient updates and better sorting, and prepares us for a better data structure for syncing.

## Your Tasks

- Convert todos state from array to keyed object, accessed by id
- Create computed observable for sorted todos

## Changes

### 1. Update State Structure

Convert the todos state from an array to an object with IDs as keys, and add computed sorting.

File: `expo-app/core/state.ts`

```diff
 import { Todo } from '@/core/keelClient';
 import { observable } from '@legendapp/state';

-export const todos$ = observable<Todo[]>([]);
+export const todos$ = observable<Record<string, Todo>>({});
+

-export const numIncompleteTodos$ = observable(() => todos$.get().filter((todo) => !todo.completed).length);
+// numIncompleteTodos$ helper
+export const numIncompleteTodos$ = observable(
+    () => Object.values(todos$.get()).filter((todo) => !todo.completed).length,
+);

+// A sorted list of todos
+export const todosSorted$ = observable<Todo[]>(() =>
+    Object.values(todos$.get()).sort((A, B) => +A.createdAt - +B.createdAt),
+);
+
```

### 2. Update TodoList Component

Use the new sorted todos computed observable and reference todos by ID. Note that we don't need the array index anymore.

File: `expo-app/components/TodoList.tsx`

```diff
 import { TodoItem } from '@/components/TodoItem';
-import { todos$ } from '@/core/state';
+import { todos$, todosSorted$ } from '@/core/state';
 import { use$ } from '@legendapp/state/react';

 interface TodoListProps {}

 export const TodoList = ({}: TodoListProps) => {
-    const todos = use$(todos$, { shallow: true });
+    const todos = use$(todosSorted$, { shallow: true });

     console.log('2 - TodoList');

-    return todos.map((todo, i) => <TodoItem key={todo.id} todo$={todos$[i]} />);
+    return todos.map((todo) => <TodoItem key={todo.id} todo$={todos$[todo.id]} />);
 };
```

### 3. Update NewTodo Component

Change todo creation to use object-based state updates with IDs as keys.

File: `expo-app/components/NewTodo.tsx`

```diff
 import { generateId } from '@/core/generateId';
 import { Todo } from '@/core/keelClient';
 import { todos$ } from '@/core/state';
 import { $, useObservable } from '@legendapp/state/react';
-import { NativeSyntheticEvent, StyleSheet, TextInputSubmitEditingEventData } from 'react-native';
+import { StyleSheet } from 'react-native';

 export const NewTodo = ({ idUser }: NewTodoProps) => {
     const text$ = useObservable('');

     const addTodo = (text: string) => {
-        todos$.push({
-            id: generateId(),
+        const id = generateId();
+        todos$[id].set({
+            id,
             text,
             idUser: idUser,
             completed: false,
             createdAt: new Date(),
             updatedAt: new Date(),
         } as Todo);
     };
```
