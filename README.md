# 💎 Finanças Pro Gold - Mobile

Aplicativo mobile de gestão financeira pessoal e empresarial desenvolvido com React Native + Expo.

## 🎯 Sobre o Projeto

O **Finanças Pro Gold** é um SaaS completo de gestão financeira que oferece:

- 📊 Dashboard com métricas em tempo real
- 💰 Gestão de contas bancárias e cartões
- 📈 Controle de investimentos (ações, FIIs, cripto)
- 🎯 Metas financeiras com acompanhamento
- 📝 Orçamento mensal por categoria
- 👨‍👩‍👧‍👦 Modo Família (despesas compartilhadas)
- 🏢 Gestão empresarial (NF-e, clientes)

## 🚀 Stack Tecnológico

### Frontend Mobile
- **React Native** 0.76+
- **Expo** SDK 52+
- **TypeScript** (100% tipado)
- **React Navigation** 7 (navegação)
- **Context API** (gerenciamento de estado)
- **@expo/vector-icons** (ícones)

### Backend (JÁ EXISTE)
- **Supabase** (PostgreSQL + Auth + Storage)
- **Row Level Security (RLS)** habilitado
- 14 tabelas principais já criadas

## 📦 Instalação

### Pré-requisitos
- Node.js 18+ instalado
- npm ou yarn
- Expo Go (app no celular) OU Android Studio/Xcode para emuladores

### Passos

1. **Clone o repositório:**
```bash
git clone <url-do-repo>
cd financeiro-mobile
```

2. **Instale as dependências:**
```bash
npm install
```

3. **Configure as credenciais do Supabase:**
   - Edite `src/lib/supabase.ts`
   - As credenciais já estão configuradas, mas você pode alterá-las se necessário

4. **Inicie o servidor Expo:**
```bash
npm start
```

5. **Execute no dispositivo:**
   - **Dispositivo físico:** Escaneie o QR code com o app Expo Go
   - **Emulador Android:** Pressione `a` no terminal
   - **Simulador iOS:** Pressione `i` no terminal (apenas macOS)
   - **Web:** Pressione `w` no terminal

## 📂 Estrutura do Projeto

```
financeiro-mobile/
├── src/
│   ├── components/          # Componentes reutilizáveis
│   ├── screens/             # Telas da aplicação
│   │   ├── LoginScreen.tsx         # ✅ Login/Cadastro
│   │   └── DashboardScreen.tsx     # ✅ Dashboard principal
│   ├── navigation/          # Navegação
│   │   └── RootNavigator.tsx       # ✅ Navegador raiz
│   ├── context/             # Context API
│   │   └── AuthContext.tsx         # ✅ Autenticação
│   ├── lib/                 # Bibliotecas/Configs
│   │   └── supabase.ts             # ✅ Cliente Supabase
│   ├── types/               # TypeScript Types
│   │   └── index.ts                # ✅ Tipos do banco
│   ├── theme/               # Design System
│   │   ├── colors.ts               # ✅ Paleta de cores
│   │   ├── spacing.ts              # ✅ Espaçamentos
│   │   ├── typography.ts           # ✅ Tipografia
│   │   └── index.ts                # ✅ Export central
│   └── utils/               # Utilitários
│       └── currencyUtils.ts        # ✅ Formatação de moeda
├── App.tsx                  # ✅ Entrada principal
└── package.json
```

## 🎨 Design System

### Paleta de Cores (Dark Premium Theme)

```typescript
// Fundos
background: '#0A0E14'  // Preto profundo
card: '#161B22'        // Cinza escuro

// Gold Theme (principal)
gold: '#D4AF37'        // Ouro principal

// Semânticas
success: '#10B981'     // Verde (receitas)
error: '#EF4444'       // Vermelho (despesas)
teal: '#14B8A6'        // Azul-turquesa (investimentos)
```

### Componentes Base

- **Card Premium:** Fundo `#161B22`, borda `#2C3036`, shadow, border-radius `16px`
- **Botão Primário:** Gradiente dourado, texto preto
- **Input Field:** Fundo `#0A0E14`, borda `#2C3036`, foco dourado

## ✅ Status de Desenvolvimento

### Fase 1: Setup e Autenticação ✅ CONCLUÍDA
- [x] Criar projeto Expo
- [x] Integrar Supabase
- [x] Tela de Login funcional
- [x] Tela de Cadastro funcional
- [x] Navegação autenticada
- [x] Context de autenticação

### Fase 2: Dashboard 🚧 EM ANDAMENTO
- [x] Estrutura básica do Dashboard
- [x] Cards de métricas (Saldo, Receitas, Despesas, Lucro)
- [x] Lista de últimas transações (mockada)
- [ ] Integração com dados reais do Supabase
- [ ] Gráfico de Despesas vs Receitas

### Fase 3: Transações ⏳ PRÓXIMA
- [ ] Modal de Nova Transação
- [ ] Listagem completa de Transações
- [ ] Filtros e busca
- [ ] Deletar/Editar transações

### Fase 4: Módulos Adicionais ⏳ FUTURO
- [ ] Tela de Contas
- [ ] Tela de Investimentos
- [ ] Tela de Metas
- [ ] Tela de Orçamento
- [ ] Configurações

### Fase 5: Polish ⏳ FUTURO
- [ ] Splash Screen customizada
- [ ] Animações (Reanimated)
- [ ] Offline-first (AsyncStorage)
- [ ] Push notifications

## 🔌 Integração com Supabase

### Credenciais Configuradas
```typescript
URL: https://hqyxuhevjanvaccpcqme.supabase.co
ANON_KEY: sb_publishable_uOLNeHlkCI4gmBHSP2Fy1A_f7kgxAif
```

### Funcionalidades Ativas
- ✅ Autenticação (login/cadastro)
- ✅ Perfil de usuário
- ⏳ Transações (próxima implementação)
- ⏳ Contas (próxima implementação)

## 🧪 Testando a Aplicação

### Login de Teste
Você pode criar uma nova conta direto no app ou usar:
```
Email: teste@financeiro.com
Senha: senha123
```
*(Crie manualmente no app se ainda não existir)*

### Fluxo Inicial
1. Abra o app
2. Toque em "Cadastre-se"
3. Preencha: Nome, Email, Senha
4. Toque em "Criar Conta"
5. Faça login com as credenciais criadas
6. Visualize o Dashboard

## 📱 Commands

```bash
# Iniciar servidor Expo
npm start

# Iniciar em modo Android
npm run android

# Iniciar em modo iOS (somente macOS)
npm run ios

# Iniciar em modo Web
npm run web

# Limpar cache
npx expo start -c
```

## 🐛 Troubleshooting

### Erro: "Cannot connect to Supabase"
- Verifique sua conexão com a internet
- Confirme se as credenciais em `src/lib/supabase.ts` estão corretas

### Erro: "Module not found"
```bash
# Limpe node_modules e reinstale
rm -rf node_modules
npm install
npx expo start -c
```

### App não abre no Expo Go
- Certifique-se de que o celular e o PC estão na mesma rede Wi-Fi
- Tente escanear o QR code novamente
- Use o modo Tunnel: `npx expo start --tunnel`

## 📝 Próximos Passos

1. **Integrar dados reais do Dashboard com Supabase**
2. **Criar modal de Nova Transação**
3. **Implementar gráficos com biblioteca de charts**
4. **Adicionar telas de Contas e Investimentos**
5. **Criar componentes reutilizáveis (Card, Button, Input)**

## 🤝 Contribuindo

Este é um projeto em desenvolvimento ativo. Contribuições são bem-vindas!

## 📄 Licença

Todos os direitos reservados - Finanças Pro Gold © 2026

---

**Desenvolvido com 💛 usando React Native + Expo + Supabase**
