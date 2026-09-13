# 🚀 Guia de Integração e Migrações Supabase • Aluno Empreendedor (SEDUC-CE)

Este diretório contém a estrutura completa de banco de dados PostgreSQL e migrações SQL para a plataforma **Aluno Empreendedor**.

---

## 📁 Estrutura de Arquivos

- `migrations/20260913000001_initial_schema.sql`:
  - Criação das tabelas centrais: `students`, `teachers`, `speakers`, `workshops`, `attendance`, `workshop_evaluations`, `complementary_activities`, `moment_posts`, `notifications`, `fcm_tokens`.
  - Configuração de tipos enum (`attendance_status`, `check_in_method`, `user_role`, `activity_status`).
  - Índices de performance para busca rápida de frequência por aluno e oficina.
  - Gatilhos automáticos (`triggers`) para atualização de `updated_at`.
  - Políticas de segurança **Row Level Security (RLS)** para proteção de dados de alunos e turmas.
  - Publicação no `supabase_realtime` para sincronização instantânea de presenças e chamadas.

- `migrations/20260913000002_seed_data.sql`:
  - Carga inicial com a Professora/Coordenadora SEDUC (Profª. Juliana Queiroz), docentes de Química, Biologia e Matemática, oficinas do calendário oficial 2026.1 e alunos modelo.

---

## 🛠️ Como Aplicar as Migrações no seu Supabase

### Opção 1: Pelo Painel Web do Supabase (Mais Rápido)
1. Acesse o seu projeto em [supabase.com](https://supabase.com/dashboard).
2. No menu lateral esquerdo, clique no ícone **SQL Editor**.
3. Clique em **+ New Query**.
4. Copie todo o conteúdo do arquivo `supabase/migrations/20260913000001_initial_schema.sql`, cole no editor e clique em **Run** (Ctrl + Enter).
5. Abra outra aba no SQL Editor, cole o conteúdo de `supabase/migrations/20260913000002_seed_data.sql` e clique em **Run**.
6. Pronto! As tabelas, índices e dados iniciais estarão criados.

### Opção 2: Pela CLI do Supabase
Caso utilize a CLI oficial do Supabase na sua máquina local:
```bash
# 1. Login e link com seu projeto
npx supabase login
npx supabase link --project-ref seu-project-ref-do-supabase

# 2. Executar as migrações pendentes
npx supabase db push
```

---

## 🔑 Variáveis de Ambiente no Aplicativo

Para conectar a aplicação diretamente ao seu Supabase, configure as seguintes variáveis no arquivo `.env` (ou no menu Settings do Google AI Studio):

```env
VITE_SUPABASE_URL=https://SEU_PROJETO.supabase.co
VITE_SUPABASE_ANON_KEY=sua-chave-publica-anon-aqui
```

### Arquitetura Híbrida Inteligente:
- **Se as variáveis do Supabase estiverem preenchidas**: o aplicativo conecta-se ao Supabase PostgreSQL para persistência e atualizações em tempo real (`supabase_realtime`).
- **Se não estiverem configuradas ou em modo offline**: a aplicação continua operando sem falhas com o banco local persistente PWA e sincronização com o Firestore nativo, garantindo total disponibilidade para os alunos e professores mesmo sem internet nas salas do polo.
