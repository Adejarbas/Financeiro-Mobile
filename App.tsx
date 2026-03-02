/**
 * 💎 FINANÇAS PRO GOLD - MOBILE APP
 * Aplicativo de gestão financeira pessoal e empresarial
 */

import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { AuthProvider } from './src/context/AuthContext';
import { FinanceProvider } from './src/context/FinanceContext';
import { FamilyProvider } from './src/context/FamilyContext';
import RootNavigator from './src/navigation/RootNavigator';

export default function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <AuthProvider>
        <FinanceProvider>
          <FamilyProvider>
            <RootNavigator />
            <StatusBar style="light" backgroundColor="transparent" translucent />
          </FamilyProvider>
        </FinanceProvider>
      </AuthProvider>
    </GestureHandlerRootView>
  );
}
