import { TodoItem } from '@/components/TodoItem';
import { store$ } from '@/core/state';
import { use$ } from '@legendapp/state/react';

interface TodoListProps {
    idUser: string;
}

export const TodoList = ({ idUser }: TodoListProps) => {
    const user$ = store$.user[idUser];
    const todos = use$(user$.todosSorted);

    console.log('2 - TodoList');

    return todos.map((todo) => <TodoItem key={todo.id} todo$={user$.todos[todo.id]} />);
};
