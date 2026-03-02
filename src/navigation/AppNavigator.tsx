/**
 * 🧭 FINANÇAS PRO GOLD - APP NAVIGATOR
 * Configuração de Bottom Tab Navigation com Lucide Icons
 */

import React from 'react';
import { Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import {
    Home,
    FileText,
    CreditCard,
    TrendingUp,
    LayoutGrid
} from 'lucide-react-native';

import { getColors } from '../theme/colors';
import { useFinance } from '../context/FinanceContext';

// Telas Principais
import DashboardScreen from '../screens/DashboardScreen';
import MenuScreen from '../screens/MenuScreen';
import AccountsScreen from '../screens/AccountsScreen';
import TransactionsScreen from '../screens/TransactionsScreen';
import InvestmentsScreen from '../screens/InvestmentsScreen';

// Telas Secundárias (Menu)
import ReportsScreen from '../screens/ReportsScreen';
import GoalsScreen from '../screens/GoalsScreen';
import SettingsScreen from '../screens/SettingsScreen';
import BudgetScreen from '../screens/BudgetScreen';
import NewsScreen from '../screens/NewsScreen';
import AssistantScreen from '../screens/AssistantScreen';
import FamilyScreen from '../screens/FamilyScreen';

// Stack Navigator para as telas acessadas via Menu
const MenuStack = createStackNavigator();
const Tab = createBottomTabNavigator();

// Navigator para o MENU (Telas secundárias)
function MenuStackScreen() {
    return (
        <MenuStack.Navigator screenOptions={{ headerShown: false }}>
            <MenuStack.Screen name="MenuGrid" component={MenuScreen} />

            {/* Telas REAIS */}
            <MenuStack.Screen name="Relatórios" component={ReportsScreen} />
            <MenuStack.Screen name="Metas" component={GoalsScreen} />
            <MenuStack.Screen name="Orçamento" component={BudgetScreen} />
            <MenuStack.Screen name="Configurações" component={SettingsScreen} />
            <MenuStack.Screen name="Notícias" component={NewsScreen} />
            <MenuStack.Screen name="Assistente" component={AssistantScreen} />
            <MenuStack.Screen name="Família" component={FamilyScreen} />
        </MenuStack.Navigator>
    );
}

export default function AppNavigator() {
    const insets = useSafeAreaInsets();
    const { isDarkMode } = useFinance();
    const c = getColors(isDarkMode);

    return (
        <Tab.Navigator
            screenOptions={{
                headerShown: false,
                tabBarStyle: {
                    backgroundColor: c.card,
                    borderTopColor: c.border,
                    height: 60 + (Platform.OS === 'ios' ? insets.bottom : insets.bottom + 10),
                    paddingBottom: Platform.OS === 'ios' ? insets.bottom : insets.bottom + 10,
                    paddingTop: 10,
                },
                tabBarActiveTintColor: c.gold,
                tabBarInactiveTintColor: c.textSubtle,
                tabBarLabelStyle: {
                    fontSize: 11,
                    fontWeight: '600',
                    marginBottom: 4,
                },
                tabBarIconStyle: {
                    marginTop: 0,
                }
            }}
        >
            {/* 1. INÍCIO */}
            <Tab.Screen
                name="Início"
                component={DashboardScreen}
                options={{
                    tabBarIcon: ({ color, size }) => (
                        <Home size={24} color={color} />
                    ),
                    tabBarLabel: 'Início'
                }}
            />

            {/* 2. TRANSAÇÕES */}
            <Tab.Screen
                name="Transações"
                component={TransactionsScreen}
                options={{
                    tabBarIcon: ({ color, size }) => (
                        <FileText size={24} color={color} />
                    ),
                    tabBarLabel: 'Transações'
                }}
            />

            {/* 3. CONTAS */}
            <Tab.Screen
                name="Contas"
                component={AccountsScreen}
                options={{
                    tabBarIcon: ({ color, size }) => (
                        <CreditCard size={24} color={color} />
                    ),
                    tabBarLabel: 'Contas'
                }}
            />

            {/* 4. INVESTIR */}
            <Tab.Screen
                name="Investir"
                component={InvestmentsScreen}
                options={{
                    tabBarIcon: ({ color, size }) => (
                        <TrendingUp size={24} color={color} />
                    ),
                    tabBarLabel: 'Investir'
                }}
            />

            {/* 5. MENU (MAIS) */}
            <Tab.Screen
                name="Menu"
                component={MenuStackScreen}
                options={{
                    tabBarIcon: ({ color, size }) => (
                        <LayoutGrid size={24} color={color} />
                    ),
                    tabBarLabel: 'Menu'
                }}
            />
        </Tab.Navigator>
    );
}
