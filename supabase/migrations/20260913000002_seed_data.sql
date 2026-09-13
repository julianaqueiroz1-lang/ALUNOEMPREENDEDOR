-- ==============================================================================
-- MIGRAÇÃO DE DADOS INICIAIS (SEED) SUPABASE: PLATAFORMA ALUNO EMPREENDEDOR
-- Versão: 20260913000002
-- Descrição: Insere os palestrantes, oficinas oficiais SEDUC 2026.1, professores,
--            aluno modelo e registros de frequência no banco Supabase.
-- ==============================================================================

-- 1. Inserção de Professores e Coordenação SEDUC
INSERT INTO public.teachers (id, name, email, role, registration, polo, avatar_url, institution)
VALUES
  (
    'prof-juliana',
    'Profª. Juliana Queiroz',
    'juliana.queiroz1@prof.ce.gov.br',
    'Coordenadora Pedagógica & Docente',
    'SEDUC-MAT-98241',
    'Polo SASP (Serviço de Apoio Social e Profissional)',
    'https://images.unsplash.com/photo-1573496799652-408c2ac9fe98?w=400&auto=format&fit=crop&q=80',
    'Governo do Estado do Ceará • Secretaria da Educação (SEDUC)'
  )
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  email = EXCLUDED.email,
  role = EXCLUDED.role,
  registration = EXCLUDED.registration;

-- 2. Inserção de Palestrantes Oficiais
INSERT INTO public.speakers (id, name, role, company, bio, avatar, expertise, linkedin_url, email)
VALUES
  (
    'spk-daniele',
    'Profª. Daniele Rodrigues de Lima',
    'Professora de Química',
    'Programa Aluno Empreendedor & SASP',
    'Professora de Química no Programa Aluno Empreendedor. Especialista em transformações químicas dos alimentos, reações culinárias, técnicas de fermentação, conservação e desenvolvimento prático de receitas inovadoras.',
    'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=400&auto=format&fit=crop&q=80',
    ARRAY['Química', 'Química dos Alimentos', 'Pães Recheados', 'Processos Produtivos'],
    '',
    'daniele.rodrigues@prof.ce.gov.br'
  ),
  (
    'spk-elvis',
    'Dr. Elvis Franklin Fernandes de Carvalho',
    'Prof. Ciências / Biologia',
    'Programa Aluno Empreendedor & SASP',
    'Doutor e Professor de Ciências e Biologia no Programa Aluno Empreendedor. Especialista em microbiologia aplicada aos alimentos, vigilância e boas práticas sanitárias, biossegurança e controle de qualidade nos negócios.',
    'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=400&auto=format&fit=crop&q=80',
    ARRAY['Ciências / Biologia', 'Boas Práticas', 'Microbiologia Alimentar', 'Segurança Sanitária'],
    '',
    'elvis.carvalho@prof.ce.gov.br'
  ),
  (
    'spk-izac',
    'Prof. Izac Dalva Montenegro Fernanda Filho',
    'Professor de Matemática',
    'Programa Aluno Empreendedor & SASP',
    'Professor de Matemática no Programa Aluno Empreendedor. Especialista em matemática financeira voltada a pequenos negócios: cálculo de custos, margens de contribuição, formação do preço de venda e equilíbrio financeiro.',
    'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&auto=format&fit=crop&q=80',
    ARRAY['Matemática', 'Matemática Financeira', 'Cálculo de Margens', 'Custos & Preços'],
    '',
    'izac.fernandes@prof.ce.gov.br'
  ),
  (
    'spk-1',
    'Drª. Juliana Queiroz & Dr. Lucas Silveira',
    'Mentores de Negócios & Inovação',
    'Hub de Inovação & Secretaria da Educação',
    'Especialistas em ideação, validação ágil e criação de fontes de renda a partir do zero para estudantes e jovens empreendedores.',
    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80',
    ARRAY['Do Zero ao Primeiro Negócio', 'Transformando Ideias em Renda', 'Ideação'],
    '',
    'juliana.queiroz1@prof.ce.gov.br'
  ),
  (
    'spk-5',
    'Paulo Morais & Beatriz Menezes',
    'Consultores Especialistas Sebrae',
    'Sebrae Nacional / Regional CE',
    'Consultores especialistas do Sebrae em precificação para alimentação fora do lar, estratégias de vendas digitais e atendimento encantador ao cliente.',
    'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400&auto=format&fit=crop&q=80',
    ARRAY['Sebrae EAD', 'Preço de Vendas', 'Atendimento ao Cliente'],
    '',
    'paulo.morais@sebraece.com.br'
  )
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  role = EXCLUDED.role,
  company = EXCLUDED.company,
  bio = EXCLUDED.bio;

-- 3. Inserção de Alunos de Exemplo da Turma 2026.1
INSERT INTO public.students (id, name, email, cpf, matricula, course_name, turma, institution, avatar_url, facial_enrolled, facial_confidence)
VALUES
  (
    'aluno-01',
    'Mariana Vasconcelos',
    'mariana.vasconcelos@aluno.ce.gov.br',
    '482.915.630-72',
    'AE-2026-0491',
    'Programa Aluno Empreendedor - Jovens Criadores de Startups',
    'Turma 2026.1',
    'Secretaria da Educação & Hub de Inovação',
    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80',
    TRUE,
    98.6
  ),
  (
    'aluno-02',
    'Lucas Matheus Pinheiro',
    'lucas.matheus@aluno.ce.gov.br',
    '319.482.910-15',
    'AE-2026-0492',
    'Programa Aluno Empreendedor - Jovens Criadores de Startups',
    'Turma 2026.1',
    'EEMTI Rachel de Queiroz (Fortaleza)',
    'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=400&auto=format&fit=crop&q=80',
    TRUE,
    95.2
  ),
  (
    'aluno-03',
    'Ana Beatriz Silveira',
    'ana.beatriz@aluno.ce.gov.br',
    '628.391.042-88',
    'AE-2026-0493',
    'Programa Aluno Empreendedor - Jovens Criadores de Startups',
    'Turma 2026.1',
    'EEMTI Jenny Gomes (Fortaleza)',
    'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=400&auto=format&fit=crop&q=80',
    TRUE,
    97.4
  )
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  email = EXCLUDED.email,
  matricula = EXCLUDED.matricula;

-- 4. Inserção das Oficinas Oficiais do Calendário
INSERT INTO public.workshops (id, title, category, date, time, duration_hours, speaker_id, speaker_name, speaker_role, location, description, tags, status)
VALUES
  (
    'ws-1',
    'Mentoria do Zero ao Primeiro Negócio: Transformando Ideias em Renda',
    'Mentoria & Ideação',
    '2026-09-10',
    '18h - 21h',
    3.0,
    'spk-daniele',
    'Profª. Daniele Rodrigues de Lima',
    'Professora de Química',
    'Auditório Principal - SASP',
    'Como transformar ideias em fontes de renda real: mapeamento de oportunidades na comunidade, validação rápida e estruturação dos primeiros passos.',
    ARRAY['Do Zero ao Negócio', 'Transformando Ideias em Renda', 'Ideação', 'Sessão Simultânea'],
    'concluida'
  ),
  (
    'ws-1b',
    'Trilha Simultânea: Oficina Prática de Pitch & Prototipagem Rápida',
    'Mentoria & Ideação',
    '2026-09-10',
    '18h - 21h',
    3.0,
    'spk-1',
    'Drª. Juliana Queiroz & Mentores Convidados',
    'Mentora de Negócios & Inovação',
    'Lab de Inovação 02 - Polo SASP',
    'Sessão concorrente em sala paralela: metodologia prática de pitch em 3 minutos para atrair clientes locais, roteiro simplificado e prototipagem ágil.',
    ARRAY['Trilha Simultânea', 'Pitch Ágil', 'Prototipagem'],
    'concluida'
  ),
  (
    'ws-1c',
    'Trilha Simultânea: Laboratório de Vendas Digitais & WhatsApp Business',
    'Vendas & Negócios',
    '2026-09-10',
    '18h - 21h',
    3.0,
    'spk-5',
    'Paulo Morais & Consultores Sebrae',
    'Consultor Sebrae',
    'Sala Conectada Multimídia - Polo SASP',
    'Sessão concorrente em sala paralela: estruturação de catálogo comercial no WhatsApp Business, links de pagamento e atendimento direto.',
    ARRAY['Trilha Simultânea', 'WhatsApp Business', 'Vendas Digitais'],
    'concluida'
  ),
  (
    'ws-2',
    'Matemática Financeira',
    'Finanças & Gestão',
    '2026-09-24',
    '18h - 21h',
    3.0,
    'spk-izac',
    'Prof. Izac Dalva Montenegro Fernanda Filho',
    'Professor de Matemática',
    'SASP',
    'Matemática financeira essencial para quem vende: cálculo de margens de contribuição, despesas fixas e variáveis, ponto de equilíbrio e fluxo de caixa.',
    ARRAY['Matemática Financeira', 'Custos', 'Margem de Lucro'],
    'proxima'
  ),
  (
    'ws-3',
    'Pães Recheados',
    'Gastronomia & Produção',
    '2026-10-01',
    '18h - 21h',
    3.0,
    'spk-daniele',
    'Profª. Daniele Rodrigues de Lima',
    'Professora de Química',
    'SASP',
    'Oficina prática mão na massa: química da fermentação e massas, produção de pães artesanais recheados, ponto da massa e rendimento comercial.',
    ARRAY['Pães Recheados', 'Panificação', 'Química dos Alimentos'],
    'proxima'
  ),
  (
    'ws-4',
    'Boas Práticas',
    'Higiene & Normas Sanitárias',
    '2026-10-22',
    '18h - 21h',
    3.0,
    'spk-elvis',
    'Dr. Elvis Franklin Fernandes de Carvalho',
    'Prof. Ciências / Biologia',
    'SASP',
    'Manual de boas práticas na manipulação de alimentos: biossegurança, microbiologia dos alimentos, higienização de bancadas e rotulagem.',
    ARRAY['Boas Práticas', 'Ciências / Biologia', 'Vigilância Sanitária'],
    'proxima'
  ),
  (
    'ws-5',
    'Curso EAD Sebrae: Preço de Vendas para Alimentação Fora do Lar',
    'Sebrae EAD & Precificação',
    '2026-11-04',
    '18h - 21h',
    3.0,
    'spk-5',
    'Paulo Morais & Beatriz Menezes',
    'Consultores Especialistas Sebrae',
    'Plataforma Sebrae EAD & SASP',
    'Metodologia oficial Sebrae para formação do preço de venda no setor de alimentação: CMV, despesas rateadas, margem líquida e concorrência.',
    ARRAY['Sebrae EAD', 'Preço de Vendas', 'Alimentação'],
    'proxima'
  )
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  category = EXCLUDED.category,
  date = EXCLUDED.date,
  time = EXCLUDED.time;

-- 5. Inserção de Registro de Presença Inicial
INSERT INTO public.attendance (id, workshop_id, workshop_title, student_id, date, time, hours, status, check_in_method, location)
VALUES
  (
    'aluno-01_ws-1',
    'ws-1',
    'Mentoria do Zero ao Primeiro Negócio: Transformando Ideias em Renda',
    'aluno-01',
    '2026-09-10',
    '18:15',
    3.0,
    'presente',
    'biometria_facial',
    'Auditório Principal - SASP'
  )
ON CONFLICT (id) DO NOTHING;

-- 6. Inserção de Avaliação Inicial da Oficina ws-1
INSERT INTO public.workshop_evaluations (id, workshop_id, workshop_title, student_id, rating, speaker_rating, content_applicability, feedback, submitted_at)
VALUES
  (
    'ws-1_aluno-01',
    'ws-1',
    'Mentoria do Zero ao Primeiro Negócio: Transformando Ideias em Renda',
    'aluno-01',
    5,
    5,
    5,
    'Mentoria sensacional! Abriu a mente sobre como faturar rápido com produtos que já sabemos fazer.',
    '2026-09-10 21:15:00+00'
  )
ON CONFLICT (id) DO NOTHING;
