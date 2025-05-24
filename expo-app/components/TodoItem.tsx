import { Todo } from '@/core/keelClient';
import { Ionicons } from '@expo/vector-icons';
import { Observable } from '@legendapp/state';
import { $, reactive } from '@legendapp/state/react';
import { Checkbox } from 'expo-checkbox';
import { StyleSheet } from 'react-native';

const ReactiveCheckbox = reactive(Checkbox, ['value'], {
    value: { handler: 'onValueChange', getValue: (value: boolean) => value },
});

export const TodoItem = ({ todo$ }: { todo$: Observable<Todo> }) => {
    const onPressDelete = () => {
        todo$.delete();
    };

    console.log('3 - TodoItem');

    return (
        <$.View $style={() => [styles.todo, todo$.completed.get() && styles.viewDone]}>
            <$.TextInput
                $style={() => [styles.todoText, todo$.completed.get() && styles.textDone]}
                $value={todo$.text}
                multiline
                blurOnSubmit
            />
            <ReactiveCheckbox value={todo$.completed} style={styles.checkbox} />
            <Ionicons name="trash" size={24} color="red" style={styles.deleteButton} onPress={onPressDelete} />
        </$.View>
    );
};

// Styles for the app.
const styles = StyleSheet.create({
    todo: {
        flexDirection: 'row',
        alignItems: 'center',
        borderRadius: 8,
        flex: 1,
        marginBottom: 8,
        backgroundColor: '#fff',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        elevation: 5,
        flexShrink: 1,
    },
    checkbox: {
        borderRadius: 6,
        width: 24,
        height: 24,
        marginHorizontal: 8,
    },
    viewDone: {
        opacity: 0.5,
    },
    textDone: {
        textDecorationLine: 'line-through',
    },
    todoText: {
        padding: 16,
        fontSize: 20,
        flex: 1,
        flexWrap: 'wrap',
        paddingRight: 16,
    },
    deleteButton: {
        paddingHorizontal: 8,
    },
});
