import { Colors } from '@/constants/Colors';
import { store$, user$ } from '@/core/state';
import { useColorScheme } from '@/hooks/useColorScheme';
import { TabBarIcon } from '@/ui/TabBarIcon';
import { use$, useObserve } from '@legendapp/state/react';
import { Tabs } from 'expo-router';
import React from 'react';
import { Platform } from 'react-native';

export default function TabLayout() {
    const colorScheme = useColorScheme();

    const idMe = use$(user$.id);
    const numIncompleteTodos$ = store$.user[idMe].numIncompleteTodos;
    const numIncompleteTodos = use$(numIncompleteTodos$);

    if (Platform.OS === 'web') {
        useObserve(() => {
            document.title = `Todos (${numIncompleteTodos$.get()})`;
        });
    }

    console.log('5 - TabLayout');

    return (
        <Tabs
            screenOptions={{
                tabBarActiveTintColor: Colors[colorScheme ?? 'light'].tint,
                headerShown: false,
            }}
        >
            <Tabs.Screen
                name="index"
                options={{
                    title: 'Home',
                    tabBarIcon: ({ color, focused }) => (
                        <TabBarIcon name={focused ? 'home' : 'home-outline'} color={color} />
                    ),
                    tabBarBadge: numIncompleteTodos || undefined,
                }}
            />
            <Tabs.Screen
                name="users"
                options={{
                    title: 'Users',
                    tabBarIcon: ({ color, focused }) => (
                        <TabBarIcon name={focused ? 'person' : 'person-outline'} color={color} />
                    ),
                }}
            />
        </Tabs>
    );
}
