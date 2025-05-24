import { generateId } from '@/core/generateId';
import { APIClient, Todo } from '@/core/keelClient';
import { observable, syncState, when } from '@legendapp/state';
import { observablePersistAsyncStorage } from '@legendapp/state/persist-plugins/async-storage';
import { configureSynced, synced } from '@legendapp/state/sync';
import { KeelListParams, syncedKeel } from '@legendapp/state/sync-plugins/keel';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Setup AsyncStorage plugin with the specific implementation
const pluginAsyncStorage = observablePersistAsyncStorage({
    AsyncStorage,
});

const getUserFromUrl = () => {
    if (typeof window?.location !== 'undefined') {
        const searchParams = new URLSearchParams(window.location.search);
        const param = searchParams.get('idUser');
        return param ? { id: searchParams.get('idUser') } : null;
    }
    return null;
};

// Setup user$
export const user$ = observable<{ id: string }>(
    () =>
        getUserFromUrl() ||
        synced({
            initial: {},
            persist: {
                plugin: pluginAsyncStorage,
                name: 'user',
            },
        }),
);

// If persist loads without an id, generate one.
when(syncState(user$).isPersistLoaded, () => {
    if (!user$.id.peek()) {
        user$.id.set(generateId());
    }
});

// Setup Keel
const keel = new APIClient({
    baseUrl: 'https://staging-keel-demos-cGUFmA.keelapps.xyz/api',
});

const { queries, mutations } = keel.api;

// Setup todos$
const sync = configureSynced(syncedKeel, {
    client: keel,
    persist: {
        plugin: pluginAsyncStorage,
        retrySync: true,
    },
    requireAuth: false,
    waitFor: user$.id,
    as: 'object',
    retry: {
        infinite: true,
    },
    mode: 'merge',
    changesSince: 'last-sync',
});

export const store$ = observable({
    users: sync({
        list: ({ where: { updatedAt } }) => queries.listUsers({ updatedAt: updatedAt?.after }),
        persist: {
            name: 'users',
        },
    }),
    user: (idUser: string) => ({
        todos: sync({
            initial: {} as Record<string, Todo>,
            list: ({ where }: KeelListParams) => queries.listTodos({ where: { ...where, idUser: { equals: idUser } } }),
            create: mutations.createTodo,
            update: mutations.updateTodo,
            delete: mutations.deleteTodo,
            persist: {
                name: 'todos' + idUser,
            },
        }),
        todosSorted: (): Todo[] =>
            Object.values(store$.user[idUser].todos.get()).sort((A, B) => +A.createdAt - +B.createdAt),
        numIncompleteTodos: () =>
            Object.values(store$.user[idUser].todos.get()).filter((todo) => !todo.completed).length,
    }),
});
