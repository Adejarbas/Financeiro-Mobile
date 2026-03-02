# 🧪 GUIA RÁPIDO DE TESTE - FINANÇAS PRO GOLD

## ✅ PRÉ-REQUISITOS

Antes de testar, certifique-se de que:

- [ ] O servidor Expo está rodando (`npm start` já executado)
- [ ] Você tem o app **Expo Go** instalado no celular
  - iOS: https://apps.apple.com/app/expo-go/id982107779
  - Android: https://play.google.com/store/apps/details?id=host.exp.exponent
- [ ] Seu celular e PC estão na **mesma rede Wi-Fi**

---

## 📱 PASSO A PASSO PARA TESTAR

### OPÇÃO 1: Testar no Celular (Recomendado)

1. **Abra o Expo Go no celular**

2. **Escaneie o QR Code**
   - iOS: Use a câmera nativa do iPhone
   - Android: Use o scanner dentro do app Expo Go

3. **Aguarde o carregamento**
   - Primeira vez pode demorar 30-60 segundos
   - O app será baixado e executado

4. **Tela de Login aparecerá automaticamente!**

---

### OPÇÃO 2: Testar no Emulador

#### Android Emulator:
```bash
# No terminal onde o Expo está rodando, pressione:
a
```

#### iOS Simulator (apenas macOS):
```bash
# No terminal onde o Expo está rodando, pressione:
i
```

---

### OPÇÃO 3: Testar no Navegador Web
```bash
# No terminal onde o Expo está rodando, pressione:
w
```
*(Funciona, mas não terá a experiência mobile real)*

---

## 🧪 FLUXO DE TESTE COMPLETO

### 1️⃣ TESTE DE CADASTRO

1. Na tela de Login, toque em **"Cadastre-se"**

2. Preencha os campos:
   ```
   Nome: Seu Nome Completo
   Email: teste@financeiro.com
   Senha: senha123
   ```

3. Toque no botão **"Criar Conta"** (dourado)

4. ✅ **Esperado:** 
   - Mensagem de sucesso aparece
   - Você é redirecionado para o Login

---

### 2️⃣ TESTE DE LOGIN

1. Na tela de Login, preencha:
   ```
   Email: teste@financeiro.com
   Senha: senha123
   ```

2. Toque no botão **"Entrar"** (dourado)

3. ✅ **Esperado:**
   - Loading aparece brevemente
   - Você é redirecionado para o Dashboard

---

### 3️⃣ TESTE DO DASHBOARD

**Verifique se os seguintes elementos estão visíveis:**

- [ ] Header com "Olá, [Seu Nome]"
- [ ] Avatar no canto superior direito
- [ ] Card grande "SALDO TOTAL R$ 10.642,98"
- [ ] Variação verde "↑ +12.5%"
- [ ] Card "RECEITAS R$ 3.535,00" com 🟢
- [ ] Card "DESPESAS R$ 1.445,26" com 🔴
- [ ] Card "LUCRO R$ 2.089,74"
- [ ] Seção "Últimas Transações"
- [ ] Lista com 3 transações mockadas:
  - Salário +R$ 5.000 (verde)
  - Mercado -R$ 320 (vermelho)
  - Uber -R$ 45 (vermelho)
- [ ] FAB (botão circular dourado com +) no canto inferior direito
- [ ] Botão "Sair" no final da página

---

### 4️⃣ TESTE DE LOGOUT

1. Role até o final do Dashboard
2. Toque no botão **"Sair"**
3. ✅ **Esperado:**
   - Você volta para a tela de Login

---

### 5️⃣ TESTE DE PERSISTÊNCIA

1. Faça login novamente
2. Feche o app completamente
3. Abra o app novamente
4. ✅ **Esperado:**
   - Você continua logado
   - Dashboard aparece direto (sem precisar fazer login)

---

## 🎨 CHECKLIST VISUAL

Verifique se o design está correto:

### Cores
- [ ] Fundo do app está escuro (#0A0E14)
- [ ] Cards estão em cinza escuro (#161B22)
- [ ] Botões primários têm gradiente dourado
- [ ] Textos principais estão brancos
- [ ] Receitas aparecem em verde (#10B981)
- [ ] Despesas aparecem em vermelho (#EF4444)

### Tipografia
- [ ] Fontes estão legíveis
- [ ] Valores monetários estão em destaque
- [ ] Títulos estão em negrito

### Layout
- [ ] Cards têm bordas arredondadas
- [ ] Espaçamentos estão consistentes
- [ ] Sombras sutis nos cards
- [ ] FAB está no canto inferior direito

---

## ⚠️ PROBLEMAS COMUNS

### App não carrega no Expo Go
**Solução:**
```bash
# Pare o servidor (Ctrl+C)
# Limpe o cache e reinicie:
npx expo start -c
```

### Erro de conexão com Supabase
**Solução:**
- Verifique sua conexão com internet
- Confirme que as credenciais em `src/lib/supabase.ts` estão corretas

### App está em branco
**Solução:**
```bash
# Reinicie o servidor:
npm start
# Pressione 'r' para reload no Expo Go
```

### QR Code não funciona
**Solução:**
- PC e celular devem estar na mesma rede Wi-Fi
- Use modo Tunnel: `npx expo start --tunnel`

---

## 📊 DADOS MOCKADOS ATUAIS

**Observação:** Os dados do Dashboard são **mockados** (não vêm do banco).

**Próxima fase:** Integraremos com dados reais do Supabase.

**Dados mock atuais:**
```javascript
{
  saldoTotal: 10642.98,
  receitas: 3535.00,
  despesas: 1445.26,
  lucro: 2089.74,
  transacoes: [
    { tipo: 'receita', descricao: 'Salário', valor: 5000 },
    { tipo: 'despesa', descricao: 'Mercado', valor: 320 },
    { tipo: 'despesa', descricao: 'Uber', valor: 45 }
  ]
}
```

---

## ✅ TESTE BEM-SUCEDIDO?

Se você conseguiu:
- ✅ Criar uma conta
- ✅ Fazer login
- ✅ Ver o Dashboard
- ✅ Fazer logout
- ✅ O design está bonito (dark + gold)

**PARABÉNS! A FASE 1 ESTÁ 100% FUNCIONAL! 🎉**

---

## 🚀 PRÓXIMO PASSO

**Quer continuar?**

Digite: **"Vamos para a Fase 2"**

E eu vou implementar:
- ✅ Integração com dados reais do Supabase
- ✅ Modal de Nova Transação
- ✅ Gráficos dinâmicos
- ✅ Muito mais!

---

**Dúvidas? Problemas no teste? Me avise! 💬**
