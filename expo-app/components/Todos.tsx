import { NewTodo } from '@/components/NewTodo';
import { TodoList } from '@/components/TodoList';
import { StyleSheet, Text, View } from 'react-native';

interface TodosProps {
    idUser: string;
    isSelf: boolean;
}

export function Todos({ idUser, isSelf }: TodosProps) {
    console.log('1 - Todos');

    return (
        <View>
            <Text style={styles.heading}>Todos$</Text>
            <Text style={styles.small}>{idUser}</Text>
            {isSelf && <NewTodo idUser={idUser} />}
            <TodoList idUser={idUser} />
        </View>
    );
}

const styles = StyleSheet.create({
    heading: {
        fontSize: 24,
        fontWeight: 'bold',
        textAlign: 'center',
        paddingTop: 16,
    },
    small: {
        fontSize: 16,
        textAlign: 'center',
        paddingVertical: 16,
    },
});
