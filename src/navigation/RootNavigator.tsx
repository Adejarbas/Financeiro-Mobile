/**
 * 🧭 FINANÇAS PRO GOLD - ROOT NAVIGATOR
 * Navegação principal da aplicação
 */

import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { useAuth } from '../context/AuthContext';
import LoginScreen from '../screens/LoginScreen';
import DashboardScreen from '../screens/DashboardScreen';
import { ActivityIndicator, View, StyleSheet } from 'react-native';
import colors from '../theme/colors';
import AppNavigator from './AppNavigator';

const Stack = createStackNavigator();

export default function RootNavigator() {
    const { user, loading } = useAuth();

    // Loading state
    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={colors.gold} />
            </View>
        );
    }

    return (
        <NavigationContainer>
            <Stack.Navigator
                screenOptions={{
                    headerShown: false,
                    cardStyle: { backgroundColor: colors.background },
                }}
            >
                {user ? (
                    // Usuário autenticado - Stack da aplicação (Tabs)
                    <>
                        <Stack.Screen name="App" component={AppNavigator} />
                    </>
                ) : (
                    // Usuário não autenticado - Stack de autenticação
                    <Stack.Screen name="Login" component={LoginScreen} />
                )}
            </Stack.Navigator>
        </NavigationContainer>
    );
}

const styles = StyleSheet.create({
    loadingContainer: {
        flex: 1,
        backgroundColor: colors.background,
        alignItems: 'center',
        justifyContent: 'center',
    },
});
