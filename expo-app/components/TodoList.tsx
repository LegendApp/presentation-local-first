import { TodoItem } from '@/components/TodoItem';
import { store$ } from '@/core/state';
import { use$ } from '@legendapp/state/react';

interface TodoListProps {
    idUser: string;
}

export const TodoList = ({ idUser }: TodoListProps) => {
    const user$ = store$.user[idUser];

    // Get the sorted array of todos from the store
    const todos = use$(user$.todosSorted);

    console.log('2 - TodoList');

    // Pass todo$ observable to TodoItem
    return todos.map((todo) => <TodoItem key={todo.id} todo$={user$.todos[todo.id]} />);
};
