# Module 4: Local-First

## Goal

Implement advanced synchronization features and data migration capabilities to create a robust offline-first application with seamless updates.

# Exercise 1: Offline First configuration

> [!NOTE]
> Checkout this branch as a starting point
>
> `git checkout 4-1`

We'll enhance our sync configuration with advanced features like retry logic, merge strategies, and incremental updates. This will improve offline support and sync efficiency.

## Your Tasks

- Configure retrying on errors
- Enable incremental sync with changesSince
- Support partial queries

## Changes

### 1. Enhance Sync Configuration

Update the sync configuration with advanced options for better offline support and sync efficiency.

File: `expo-app/core/state.ts`

```diff
 import { observable, syncState, when } from '@legendapp/state';
 import { observablePersistAsyncStorage } from '@legendapp/state/persist-plugins/async-storage';
 import { configureSynced, synced } from '@legendapp/state/sync';
-import { syncedKeel } from '@legendapp/state/sync-plugins/keel';
+import { KeelListParams, syncedKeel } from '@legendapp/state/sync-plugins/keel';
 import AsyncStorage from '@react-native-async-storage/async-storage';

 const sync = configureSynced(syncedKeel, {
     client: keel,
     persist: {
         plugin: pluginAsyncStorage,
+        retrySync: true,
     },
     requireAuth: false,
     waitFor: user$.id,
     as: 'object',
+    retry: {
+        infinite: true,
+    },
+    mode: 'merge',
+    changesSince: 'last-sync',
 });

 export const store$ = observable({
     users: sync({
-        list: () => queries.listUsers(),
+        list: ({ where: { updatedAt } }) => queries.listUsers({ updatedAt: updatedAt?.after }),
         persist: {
             name: 'users',
         },
     }),
     user: (idUser: string) => ({
         todos: sync({
             initial: {} as Record<string, Todo>,
-            list: () => queries.listTodos({ where: { idUser: { equals: idUser } } }),
+            list: ({ where }: KeelListParams) => queries.listTodos({ where: { ...where, idUser: { equals: idUser } } }),
             create: mutations.createTodo,
             update: mutations.updateTodo,
             delete: mutations.deleteTodo,
```

# Exercise 2: Data Migration and Version Control

> [!NOTE]
> Checkout this branch as a starting point
>
> `git checkout 4-2`

We'll add server version checking and data migration capabilities to handle schema changes and ensure backward compatibility.

If the app version is too old we want to prevent it from syncing until it's updated. We can use this mechanism to force updates in case of significant bugs in old versions or schema changes in the backend.

## Your Tasks

- Add server version checking and sync blocking
- Support local data transformation on schema changes

## Changes

### 1. Check server required version

Check the required version on the server and if the local app is too old don't let it sync.

File: `expo-app/core/state.ts`

```diff
 import { generateId } from '@/core/generateId';
-import { APIClient, Todo } from '@/core/keelClient';
+import { APIClient, Priority, ServerStatus, Todo } from '@/core/keelClient';
 import { observable, syncState, when } from '@legendapp/state';

 const { queries, mutations } = keel.api;

+const serverStatus$ = observable<ServerStatus>(
+    syncedKeel({
+        client: keel,
+        get: queries.getServerStatus,
+        requireAuth: false,
+        retry: {
+            infinite: true,
+        },
+    }),
+);
+
+const isServerVersionSupported = () => {
+    const minVersion = serverStatus$.minimumVersion.get();
+    return minVersion >= 0 && minVersion <= 1;
+};
```

### 2. Update Sync Configuration

If the version is too old, prevent syncing.

```diff
 const sync = configureSynced(syncedKeel, {
     client: keel,
     persist: {
         plugin: pluginAsyncStorage,
         retrySync: true,
     },
     requireAuth: false,
-    waitFor: user$.id,
+    waitFor: () => user$.id.get() && isServerVersionSupported(),
     as: 'object',
     retry: {
         infinite: true,
     },
```

### 3. Add Data Migration

Add transformation logic for handling schema changes. A new client update may load old user data and need to update it to match the shape expected by the server.

```diff
             persist: {
                 name: 'todos' + idUser,
+                transform: {
+                    load(value: Record<string, Todo>, method) {
+                        if (method === 'get') {
+                            Object.values(value).forEach((todo) => {
+                                if (todo.oldIsPriority) {
+                                    todo.newPriority = todo.oldIsPriority ? Priority.High : Priority.None;
+                                    delete (todo as Partial<Todo>).oldIsPriority;
+                                }
+                            });
+                        }
+                        return value;
+                    },
+                },
             },
         }),
```

## See the final result

> [!NOTE]
> Checkout this branch to see the result after this change
>
> `git checkout 4-3`

## Everything is broken!

Sync is now disabled (on purpose). If you change the minimum version to `2` you will get back to syncing again.

```diff
const isServerVersionSupported = () => {
    const minVersion = serverStatus$.minimumVersion.get();
-    return minVersion >= 0 && minVersion <= 1;
+    return minVersion >= 0 && minVersion <= 2;
};
```
