# Configuração do Supabase

Guia passo a passo para configurar o Supabase para o DarkNotes.

---

## 1. Criar Projeto

1. Acesse [https://supabase.com/dashboard](https://supabase.com/dashboard)
2. Clique em **New project**
3. Preencha:
   - **Name:** `darknotes`
   - **Database Password:** escolha uma senha forte e guarde
   - **Region:** escolha a mais próxima (ex: `South America (southamerica-east1)`)
   - **Pricing Plan:** Free tier é suficiente
4. Aguarde a criação do projeto (~2 minutos)

## 2. Configurar Autenticação

1. No menu lateral, vá em **Authentication → Providers**
2. Certifique-se de que **Email** está habilitado
3. (Opcional) Desabilite "Confirm email" para evitar necessidade de confirmação
   - Como é um app de único usuário, isso simplifica o fluxo
4. Crie um usuário manualmente:
   - Vá em **Authentication → Users**
   - Clique em **Add User**
   - Preencha email e senha que você usará para acessar o app

> **Importante:** A aplicação não possui tela de cadastro (D-02). Você DEVE criar
> um usuário manualmente pelo dashboard do Supabase.

## 3. Executar Migration SQL

1. No menu lateral, vá em **SQL Editor**
2. Clique em **New query**
3. Copie o conteúdo do arquivo `supabase/migrations/001_initial_schema.sql`
4. Cole no SQL Editor e clique em **Run**
5. Verifique se todas as queries executaram sem erros

A migration criará:
- Tabela `folders` — pastas com hierarquia ilimitada (parent_id)
- Tabela `notes` — notas com conteúdo markdown e tags de linguagem
- Índices para performance em buscas e consultas
- **Row Level Security (RLS)** — políticas de segurança linha a linha
- **Triggers** — para associar automaticamente o user_id ao usuário logado
- Função `test_rls()` — para verificar se a segurança está funcionando

## 4. Verificar Configuração

1. Vá em **Database → Tables** e confirme que `folders` e `notes` existem
2. Para cada tabela, verifique se o toggle **RLS enabled** está **ON**
3. Vá em **Authentication → Users** e confirme que seu usuário aparece
4. (Opcional) No SQL Editor, execute `select test_rls();` — deve retornar:
   ```
   "RLS is configured with 8 policies"
   ```

## 5. Obter Credenciais

1. Vá em **Project Settings → API**
2. Anote os valores:
   - **Project URL** → será usado como `SUPABASE_URL`
   - **anon public key** → será usado como `SUPABASE_ANON_KEY`
3. Adicione esses valores nos arquivos de ambiente do Angular:

   **`src/environments/environment.ts`** (produção):
   ```typescript
   export const environment = {
     production: true,
     supabaseUrl: 'https://seu-projeto.supabase.co',
     supabaseAnonKey: 'sua-anon-key-aqui',
   };
   ```

   **`src/environments/environment.development.ts`** (desenvolvimento):
   ```typescript
   export const environment = {
     production: false,
     supabaseUrl: 'https://seu-projeto.supabase.co',
     supabaseAnonKey: 'sua-anon-key-aqui',
   };
   ```

> **Atenção:** Use apenas a **anon key** (chave anônima/pública). A `service_role key`
> NUNCA deve ser usada no código do cliente — ela dá acesso total ao banco de dados
> e burla as políticas de segurança RLS.

## Troubleshooting

| Problema | Solução |
|----------|---------|
| SQL Editor mostra erro de sintaxe | Certifique-se de executar todo o script de uma vez, não linha por linha |
| Tabelas não aparecem em Database → Tables | Role a página para baixo — pode ser necessário atualizar |
| RLS não está habilitado | Vá em Database → Tables, clique na tabela, e ative o toggle RLS manualmente |
| Erro "relation already exists" | Isso é seguro — significa que a migration já foi executada |
| `select test_rls()` retorna 0 policies | Execute a migration novamente; as políticas podem não ter sido criadas |
| Erro 401 nas chamadas da API | Verifique se a anon key está correta nos arquivos de ambiente |
| Usuário não consegue fazer login | Confirme que o email/password provider está ativo em Authentication → Providers |

---

## Segurança

- A anon key é pública e fica exposta no bundle do navegador — isso é intencional
- A segurança dos dados depende exclusivamente do **RLS** (Row Level Security)
- Nunca exponha a `service_role key` no código do cliente
- Se precisar resetar o banco: desabilite RLS, drope as tabelas, e execute a migration novamente
