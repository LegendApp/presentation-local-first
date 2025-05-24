import { Todos } from '@/components/Todos';
import { user$ } from '@/core/state';
import { use$ } from '@legendapp/state/react';
import { ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function HomeScreen() {
    const id = use$(user$.id);

    console.log('6 - Home screen');

    return (
        <SafeAreaView style={styles.container}>
            <ScrollView style={styles.scrollView}>{id && <Todos idUser={id} isSelf />}</ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    scrollView: {
        paddingHorizontal: 16,
    },
});
