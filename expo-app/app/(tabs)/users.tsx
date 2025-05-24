import { store$ } from '@/core/state';
import { use$ } from '@legendapp/state/react';
import { Link } from 'expo-router';
import { ScrollView, StyleSheet, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

function UsersList() {
    const users = use$(store$.users);
    const usersArr = Object.values(users || {});

    return usersArr.map((user) => (
        <Link key={user.id} href={`/user/${user.id}`} style={styles.user}>
            {user.id}
        </Link>
    ));
}

export default function Users() {
    console.log('7 - Users screen');

    return (
        <SafeAreaView style={styles.container}>
            <ScrollView style={styles.scrollView}>
                <Text style={styles.heading}>Users</Text>
                <UsersList />
            </ScrollView>
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
    heading: {
        fontSize: 24,
        fontWeight: 'bold',
        textAlign: 'center',
        paddingVertical: 16,
    },
    user: {
        borderRadius: 8,
        marginBottom: 8,
        backgroundColor: '#fff',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        elevation: 5,
        padding: 16,
    },
});
