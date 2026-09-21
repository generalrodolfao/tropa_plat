/* Seed isolado dos Camps (treino intensivo / hotseat).
 * Idempotente: faz upsert dos camps e recria as perguntas-base.
 * Rodar: pnpm db:seed:camps
 */
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface SeedQuestion {
  format: string;
  prompt: string;
  options?: string[];
  correctIndex?: number;
  answerKey?: string;
  explanation?: string;
  difficulty?: number;
  tags?: string[];
}

interface SeedCamp {
  slug: string;
  title: string;
  description: string;
  category: string;
  icon: string;
  difficulty: string;
  formats: string[];
  xpAward: number;
  position: number;
  questions: SeedQuestion[];
}

const CAMPS: SeedCamp[] = [
  {
    slug: 'camp-sql',
    title: 'Camp de SQL',
    description:
      'Sessões intensivas de SQL: consultas, agregações, joins e performance, no estilo hotseat.',
    category: 'sql',
    icon: 'database',
    difficulty: 'intermediate',
    formats: ['quiz', 'exercise', 'hotseat', 'interview'],
    xpAward: 150,
    position: 1,
    questions: [
      {
        format: 'quiz',
        prompt: 'Qual cláusula filtra linhas ANTES das agregações?',
        options: ['WHERE', 'HAVING', 'GROUP BY', 'ORDER BY'],
        correctIndex: 0,
        explanation: 'WHERE filtra linhas antes do GROUP BY; HAVING filtra grupos depois.',
        difficulty: 2,
        tags: ['fundamentos'],
      },
      {
        format: 'quiz',
        prompt: 'Qual comando esvazia uma tabela mantendo sua estrutura?',
        options: ['DELETE', 'DROP', 'TRUNCATE', 'ALTER'],
        correctIndex: 2,
        explanation: 'TRUNCATE remove todas as linhas rapidamente e mantém a tabela; DROP apaga a tabela.',
        difficulty: 2,
        tags: ['ddl'],
      },
      {
        format: 'quiz',
        prompt: 'Qual JOIN retorna todas as linhas da tabela à esquerda, mesmo sem correspondência?',
        options: ['INNER JOIN', 'LEFT JOIN', 'RIGHT JOIN', 'FULL JOIN'],
        correctIndex: 1,
        explanation: 'LEFT JOIN preserva as linhas da tabela da esquerda e preenche NULL quando não há par.',
        difficulty: 3,
        tags: ['joins'],
      },
      {
        format: 'quiz',
        prompt: 'Qual cláusula filtra grupos depois da agregação?',
        options: ['WHERE', 'HAVING', 'LIMIT', 'DISTINCT'],
        correctIndex: 1,
        explanation: 'HAVING é aplicado após o GROUP BY, sobre o resultado das funções de agregação.',
        difficulty: 3,
        tags: ['agregacao'],
      },
      {
        format: 'hotseat',
        prompt: 'Qual palavra-chave limita o número de linhas retornadas em Postgres/MySQL?',
        answerKey: 'LIMIT (Postgres/MySQL) ou TOP / FETCH FIRST em SQL Server.',
        explanation: 'LIMIT n restringe o total de linhas do resultado.',
        difficulty: 2,
        tags: ['fundamentos'],
      },
      {
        format: 'hotseat',
        prompt: 'Qual palavra-chave remove linhas duplicadas de um SELECT?',
        answerKey: 'DISTINCT.',
        explanation: 'SELECT DISTINCT elimina duplicatas do conjunto de resultados.',
        difficulty: 2,
        tags: ['fundamentos'],
      },
      {
        format: 'hotseat',
        prompt: 'Como se chama a coluna que referencia a chave primária de outra tabela?',
        answerKey: 'Chave estrangeira (foreign key).',
        explanation: 'A foreign key garante integridade referencial entre tabelas.',
        difficulty: 2,
        tags: ['modelagem'],
      },
      {
        format: 'hotseat',
        prompt: 'Qual operador SQL verifica padrões em texto?',
        answerKey: 'LIKE (com % e _).',
        explanation: 'LIKE compara strings com curingas; ILIKE ignora maiúsculas no Postgres.',
        difficulty: 2,
        tags: ['fundamentos'],
      },
      {
        format: 'exercise',
        prompt:
          'Escreva uma query que retorne o total de vendas por mês em 2024, ordenado do maior para o menor total.',
        answerKey:
          "SELECT date_trunc('month', data_venda) AS mes, SUM(valor) AS total FROM vendas WHERE data_venda >= '2024-01-01' AND data_venda < '2025-01-01' GROUP BY 1 ORDER BY total DESC;",
        explanation: 'Agrupe pela data truncada no mês e ordene pela soma.',
        difficulty: 4,
        tags: ['agregacao'],
      },
      {
        format: 'exercise',
        prompt: 'Como identificar clientes que nunca fizeram pedido?',
        answerKey:
          'LEFT JOIN pedidos ON ... WHERE pedidos.id IS NULL, ou usar NOT EXISTS (SELECT 1 FROM pedidos ...).',
        explanation: 'As duas abordagens são anti-joins; NOT EXISTS costuma escalar melhor.',
        difficulty: 4,
        tags: ['joins'],
      },
      {
        format: 'exercise',
        prompt: 'Escreva uma query que liste categorias com mais de 100 produtos.',
        answerKey:
          'SELECT categoria, COUNT(*) AS qtd FROM produtos GROUP BY categoria HAVING COUNT(*) > 100;',
        explanation: 'HAVING filtra o resultado agregado por categoria.',
        difficulty: 3,
        tags: ['agregacao'],
      },
      {
        format: 'exercise',
        prompt: 'Como calcular a média móvel de 7 dias de acessos por dia?',
        answerKey:
          'AVG(acessos) OVER (ORDER BY dia ROWS BETWEEN 6 PRECEDING AND CURRENT ROW) com window function.',
        explanation: 'Window functions calculam sem colapsar as linhas.',
        difficulty: 5,
        tags: ['window-functions'],
      },
      {
        format: 'interview',
        prompt: 'Explique a diferença entre WHERE e HAVING, com um exemplo.',
        answerKey:
          'WHERE filtra linhas antes da agregação; HAVING filtra grupos depois. Ex.: GROUP BY categoria HAVING COUNT(*) > 10.',
        explanation: 'Ordem lógica: FROM → WHERE → GROUP BY → HAVING → SELECT → ORDER BY.',
        difficulty: 3,
        tags: ['entrevista'],
      },
      {
        format: 'interview',
        prompt: 'Como você investigaria uma consulta lenta em produção?',
        answerKey:
          'EXPLAIN ANALYZE, plano de execução, índices ausentes, volume de dados, estatísticas desatualizadas, SELECTs desnecessários e locks.',
        explanation: 'Comece pelo plano de execução e pelos índices.',
        difficulty: 4,
        tags: ['performance'],
      },
    ],
  },
  {
    slug: 'camp-python',
    title: 'Camp de Python',
    description:
      'Treino intensivo de Python: sintaxe, estruturas de dados e boas práticas para dados e automação.',
    category: 'python',
    icon: 'code',
    difficulty: 'intermediate',
    formats: ['quiz', 'exercise', 'hotseat', 'interview'],
    xpAward: 150,
    position: 2,
    questions: [
      {
        format: 'quiz',
        prompt: 'Qual estrutura de dados é imutável em Python?',
        options: ['list', 'dict', 'set', 'tuple'],
        correctIndex: 3,
        explanation: 'Tuplas são imutáveis; listas, dicts e sets são mutáveis.',
        difficulty: 2,
        tags: ['estruturas'],
      },
      {
        format: 'quiz',
        prompt: "Qual o resultado de len({'a': 1, 'b': 2})?",
        options: ['1', '2', '3', 'Erro'],
        correctIndex: 1,
        explanation: 'len de um dict retorna o número de chaves.',
        difficulty: 1,
        tags: ['estruturas'],
      },
      {
        format: 'quiz',
        prompt: 'Qual expressão cria a lista dos quadrados de 0 a 4?',
        options: [
          '[x**2 for x in range(5)]',
          '(x**2 for x in range(5))',
          '{x**2 for x in range(5)}',
          '[x^2 for x in range(5)]',
        ],
        correctIndex: 0,
        explanation: 'List comprehension usa [ ]; ^ não é potência em Python (use **).',
        difficulty: 2,
        tags: ['comprehension'],
      },
      {
        format: 'quiz',
        prompt: 'Qual método remove e retorna o último item de uma lista?',
        options: ['remove', 'pop', 'delete', 'discard'],
        correctIndex: 1,
        explanation: 'list.pop() remove e retorna o último elemento por padrão.',
        difficulty: 3,
        tags: ['listas'],
      },
      {
        format: 'hotseat',
        prompt: 'Qual palavra-chave define uma função anônima?',
        answerKey: 'lambda.',
        explanation: 'Ex.: lambda x: x + 1.',
        difficulty: 2,
        tags: ['sintaxe'],
      },
      {
        format: 'hotseat',
        prompt: 'Como se tratam exceções em Python?',
        answerKey: 'Com try / except (e opcionalmente else / finally).',
        explanation: 'try executa; except captura; finally roda sempre.',
        difficulty: 2,
        tags: ['excecoes'],
      },
      {
        format: 'hotseat',
        prompt: 'O que o método .append() faz em uma lista?',
        answerKey: 'Adiciona um item ao final da lista.',
        explanation: 'Diferente de .extend(), que adiciona vários itens.',
        difficulty: 1,
        tags: ['listas'],
      },
      {
        format: 'hotseat',
        prompt: 'Qual tipo representa valores lógicos e quais são seus valores?',
        answerKey: 'bool, com True e False.',
        explanation: 'bool é subclasse de int em Python.',
        difficulty: 1,
        tags: ['tipos'],
      },
      {
        format: 'exercise',
        prompt:
          'Escreva uma função que recebe uma lista de números e retorna a média, tratando o caso de lista vazia.',
        answerKey:
          'def media(nums):\n    return sum(nums) / len(nums) if nums else 0',
        explanation: 'Trate o caso vazio para evitar ZeroDivisionError.',
        difficulty: 3,
        tags: ['funcoes'],
      },
      {
        format: 'exercise',
        prompt: "Com pandas, leia um CSV e retorne as 5 linhas com maior valor na coluna 'valor'.",
        answerKey:
          "import pandas as pd\n\ndf = pd.read_csv('dados.csv')\ndf.nlargest(5, 'valor')",
        explanation: 'nlargest é eficiente para top-N.',
        difficulty: 4,
        tags: ['pandas'],
      },
      {
        format: 'exercise',
        prompt: 'Conte a frequência de palavras em um texto ignorando pontuação.',
        answerKey:
          "import re\nfrom collections import Counter\n\nwords = re.findall(r'\\w+', texto.lower())\nCounter(words)",
        explanation: 'Use regex para separar palavras e Counter para contar.',
        difficulty: 4,
        tags: ['texto'],
      },
      {
        format: 'exercise',
        prompt: 'Escreva um dict comprehension que mapeia números de 1 a 5 para seus quadrados.',
        answerKey: '{n: n**2 for n in range(1, 6)}',
        explanation: 'Dict comprehension usa {chave: valor for ...}.',
        difficulty: 3,
        tags: ['comprehension'],
      },
      {
        format: 'interview',
        prompt: 'Explique a diferença entre listas e tuplas e quando usar cada uma.',
        answerKey:
          'Tuplas são imutáveis, hashable e mais leves; use quando os dados não mudam ou como chave de dict. Listas para coleções mutáveis.',
        explanation: 'Imutabilidade traz previsibilidade e permite uso como chave.',
        difficulty: 3,
        tags: ['entrevista'],
      },
      {
        format: 'interview',
        prompt: 'O que é o GIL e como ele afeta a concorrência em Python?',
        answerKey:
          'Global Interpreter Lock impede execução simultânea de bytecode por múltiplas threads; limita tarefas CPU-bound. Use multiprocessing ou asyncio para I/O.',
        explanation: 'O GIL simplifica o gerenciamento de memória, mas limita paralelismo real de CPU.',
        difficulty: 5,
        tags: ['concorrencia'],
      },
    ],
  },
  {
    slug: 'camp-negocio',
    title: 'Camp de Negócio',
    description:
      'Treino de visão de negócio: requisitos, métricas e priorização, com simulações de levantamento de requisitos.',
    category: 'business',
    icon: 'briefcase',
    difficulty: 'intermediate',
    formats: ['quiz', 'requirements', 'hotseat', 'interview'],
    xpAward: 150,
    position: 3,
    questions: [
      {
        format: 'quiz',
        prompt: 'O que significa MVP?',
        options: [
          'Máximo Valor Possível',
          'Produto Mínimo Viável',
          'Modelo de Verificação de Produto',
          'Método de Validação Preditiva',
        ],
        correctIndex: 1,
        explanation: 'MVP é a menor versão que entrega valor e permite aprender com o uso real.',
        difficulty: 2,
        tags: ['produto'],
      },
      {
        format: 'quiz',
        prompt: 'Qual métrica mede a perda de clientes ao longo do tempo?',
        options: ['CAC', 'LTV', 'Churn', 'NPS'],
        correctIndex: 2,
        explanation: 'Churn é a taxa de cancelamento/perda de clientes.',
        difficulty: 2,
        tags: ['metricas'],
      },
      {
        format: 'quiz',
        prompt: 'O que é uma história de usuário?',
        options: [
          'Um relatório financeiro',
          'Uma descrição curta de uma funcionalidade na perspectiva do usuário',
          'Um diagrama de banco de dados',
          'Um contrato jurídico',
        ],
        correctIndex: 1,
        explanation: 'Formato comum: "Como <usuário>, quero <ação> para <benefício>".',
        difficulty: 2,
        tags: ['agilidade'],
      },
      {
        format: 'quiz',
        prompt: 'O que significa CAC?',
        options: [
          'Custo de Aquisição de Cliente',
          'Cadastro de Ativo Corrente',
          'Controle de Acesso a Clientes',
          'Cálculo de Análise Comparativa',
        ],
        correctIndex: 0,
        explanation: 'CAC = investimento em aquisição dividido pelo número de clientes conquistados.',
        difficulty: 3,
        tags: ['metricas'],
      },
      {
        format: 'requirements',
        prompt:
          'Você vai criar um app de agendamento para clínicas. Liste 5 requisitos funcionais e 3 não funcionais.',
        answerKey:
          'Funcionais: cadastro de pacientes, agenda de profissionais, confirmação/lembrete de consultas, histórico de atendimentos, relatórios. Não funcionais: segurança/LGPD, desempenho, disponibilidade.',
        explanation: 'Funcionais descrevem o que o sistema faz; não funcionais, como ele se comporta.',
        difficulty: 4,
        tags: ['requisitos'],
      },
      {
        format: 'requirements',
        prompt:
          "Um cliente pede apenas 'um relatório de vendas'. Quais perguntas você faz para levantar requisitos?",
        answerKey:
          'Objetivo/decisão, público, granularidade, período, filtros, formato de saída, frequência e fonte dos dados.',
        explanation: 'Perguntas abertas evitam retrabalho e alinham expectativa.',
        difficulty: 4,
        tags: ['requisitos'],
      },
      {
        format: 'requirements',
        prompt: "Escreva critérios de aceite para a funcionalidade 'login com e-mail e senha'.",
        answerKey:
          'Dados válidos autenticam; inválidos exibem erro claro; bloqueio após N tentativas; link de recuperação de senha; mensagens não revelam se o e-mail existe.',
        explanation: 'Critérios de aceite são testáveis e específicos.',
        difficulty: 4,
        tags: ['requisitos'],
      },
      {
        format: 'requirements',
        prompt: 'Diferencie requisito funcional e não funcional com exemplos.',
        answerKey:
          'Funcional = comportamento/o que o sistema faz (ex.: emitir nota). Não funcional = atributo de qualidade/como (ex.: responder em até 2s, disponibilidade 99,9%).',
        explanation: 'Requisitos não funcionais costumam virar restrições de arquitetura.',
        difficulty: 3,
        tags: ['requisitos'],
      },
      {
        format: 'hotseat',
        prompt: 'O que é um KPI?',
        answerKey: 'Indicador-chave de desempenho usado para medir o alcance de um objetivo.',
        explanation: 'KPIs devem ser específicos, mensuráveis e ligados à estratégia.',
        difficulty: 2,
        tags: ['metricas'],
      },
      {
        format: 'hotseat',
        prompt: 'Defina churn em uma frase.',
        answerKey: 'Taxa de clientes que cancelam ou deixam de usar o produto em um período.',
        explanation: 'Churn baixo indica retenção saudável.',
        difficulty: 2,
        tags: ['metricas'],
      },
      {
        format: 'hotseat',
        prompt: 'O que é backlog?',
        answerKey: 'Lista priorizada de itens (funcionalidades, melhorias, correções) a serem trabalhados.',
        explanation: 'O backlog é refinado continuamente pelo time.',
        difficulty: 2,
        tags: ['agilidade'],
      },
      {
        format: 'hotseat',
        prompt: 'O que é um stakeholder?',
        answerKey: 'Qualquer parte interessada ou impactada pelo projeto.',
        explanation: 'Mapear stakeholders ajuda na comunicação e no alinhamento.',
        difficulty: 2,
        tags: ['gestao'],
      },
      {
        format: 'interview',
        prompt: 'Como você priorizaria funcionalidades com recursos limitados?',
        answerKey:
          'Avaliando impacto x esforço, valor para o cliente, alinhamento à estratégia e usando frameworks como RICE ou MoSCoW.',
        explanation: 'Priorização é sobre trade-offs explícitos.',
        difficulty: 4,
        tags: ['entrevista'],
      },
      {
        format: 'interview',
        prompt: 'Como você validaria uma ideia de produto antes de desenvolvê-la?',
        answerKey:
          'Entrevistas com usuários, pesquisa de mercado, protótipo, landing page de teste e métricas de interesse.',
        explanation: 'Validar barato antes de construir caro.',
        difficulty: 4,
        tags: ['entrevista'],
      },
    ],
  },
  {
    slug: 'camp-entrevistas',
    title: 'Camp de Entrevistas',
    description:
      'Simulados de entrevista e rodadas hotseat para treinar postura, clareza e respostas sob pressão.',
    category: 'interview',
    icon: 'mic',
    difficulty: 'beginner',
    formats: ['interview', 'hotseat', 'quiz', 'requirements'],
    xpAward: 120,
    position: 4,
    questions: [
      {
        format: 'quiz',
        prompt: 'Qual técnica é indicada para responder perguntas comportamentais?',
        options: ['STAR', 'SWOT', 'PDCA', 'OKR'],
        correctIndex: 0,
        explanation: 'STAR = Situação, Tarefa, Ação, Resultado.',
        difficulty: 2,
        tags: ['tecnicas'],
      },
      {
        format: 'quiz',
        prompt: 'O que fazer ao receber uma pergunta que você não sabe responder?',
        options: [
          'Inventar uma resposta confiante',
          'Ficar em silêncio até o entrevistador mudar de assunto',
          'Admitir e explicar como buscaria a resposta',
          'Dizer que a pergunta não faz sentido',
        ],
        correctIndex: 2,
        explanation: 'Honestidade + raciocínio demonstram maturidade profissional.',
        difficulty: 2,
        tags: ['postura'],
      },
      {
        format: 'quiz',
        prompt: "Quanto tempo deve durar, em média, a resposta ao 'fale sobre você'?",
        options: ['10 segundos', '1 a 2 minutos', '5 minutos', 'Não importa'],
        correctIndex: 1,
        explanation: 'Um pitch de 1 a 2 minutos é objetivo e cobre trajetória, foco e motivação.',
        difficulty: 2,
        tags: ['pitch'],
      },
      {
        format: 'quiz',
        prompt: 'O que NÃO é recomendado em uma entrevista?',
        options: [
          'Dar exemplos concretos',
          'Fazer perguntas sobre a empresa',
          'Falar mal de empregadores anteriores',
          'Demonstrar interesse pela vaga',
        ],
        correctIndex: 2,
        explanation: 'Criticar empregadores anteriores passa impressão negativa.',
        difficulty: 1,
        tags: ['postura'],
      },
      {
        format: 'interview',
        prompt: 'Fale sobre você.',
        answerKey:
          'Pitch de 1-2 min: trajetória resumida, foco atual, principais resultados e por que essa vaga.',
        explanation: 'Estruture em passado, presente e futuro.',
        difficulty: 3,
        tags: ['pitch'],
      },
      {
        format: 'interview',
        prompt: 'Qual é o seu maior defeito?',
        answerKey: 'Um defeito real, com contexto e a ação concreta que você toma para melhorá-lo.',
        explanation: 'Evite clichês; mostre autoconhecimento e evolução.',
        difficulty: 3,
        tags: ['comportamental'],
      },
      {
        format: 'interview',
        prompt: 'Por que devemos te contratar?',
        answerKey:
          'Conecte suas habilidades e resultados às necessidades da vaga, com exemplos e motivação genuína.',
        explanation: 'Foque no valor que você gera, não só em qualidades genéricas.',
        difficulty: 3,
        tags: ['fit'],
      },
      {
        format: 'interview',
        prompt: 'Onde você se vê em 5 anos?',
        answerKey:
          'Crescimento alinhado à empresa, desenvolvendo competências relevantes e assumindo mais responsabilidade.',
        explanation: 'Mostre ambição compatível com a cultura da empresa.',
        difficulty: 3,
        tags: ['fit'],
      },
      {
        format: 'hotseat',
        prompt: 'Em uma frase, por que essa vaga?',
        answerKey: 'Resposta curta conectando seu objetivo e habilidades ao propósito da vaga.',
        explanation: 'Clareza e objetividade sob pressão.',
        difficulty: 2,
        tags: ['hotseat'],
      },
      {
        format: 'hotseat',
        prompt: 'Defina sucesso em uma frase.',
        answerKey: 'Resposta pessoal, objetiva, ligada a resultados e impacto.',
        explanation: 'Hotseat avalia síntese.',
        difficulty: 2,
        tags: ['hotseat'],
      },
      {
        format: 'hotseat',
        prompt: 'Qual foi o último erro que você cometeu no trabalho?',
        answerKey: 'Erro real, aprendizado e ação tomada para não repetir.',
        explanation: 'Demonstra humildade e melhoria contínua.',
        difficulty: 3,
        tags: ['comportamental'],
      },
      {
        format: 'hotseat',
        prompt: 'O que você faz quando discorda do seu gestor?',
        answerKey: 'Argumenta com dados, escuta, busca alinhamento e respeita a decisão final.',
        explanation: 'Mostra maturidade e comunicação.',
        difficulty: 3,
        tags: ['comportamental'],
      },
      {
        format: 'requirements',
        prompt:
          'O entrevistador descreve um problema de negócio. Quais perguntas você faria para entender o requisito?',
        answerKey:
          'Objetivo e decisão envolvida, usuários afetados, dados disponíveis, restrições/prazo e critérios de sucesso.',
        explanation: 'Estruturar o problema antes de propor solução.',
        difficulty: 4,
        tags: ['requisitos'],
      },
      {
        format: 'requirements',
        prompt: 'Como você conduziria uma reunião de levantamento de requisitos?',
        answerKey:
          'Preparação com pauta, mapeamento de stakeholders, perguntas abertas, registro/documentação e validação ao final.',
        explanation: 'Planejamento e validação evitam retrabalho.',
        difficulty: 4,
        tags: ['requisitos'],
      },
    ],
  },
];

async function main() {
  for (const c of CAMPS) {
    const camp = await prisma.camp.upsert({
      where: { slug: c.slug },
      create: {
        slug: c.slug,
        title: c.title,
        description: c.description,
        category: c.category,
        icon: c.icon,
        difficulty: c.difficulty,
        formats: c.formats,
        xpAward: c.xpAward,
        position: c.position,
        status: 'active',
      },
      update: {
        title: c.title,
        description: c.description,
        category: c.category,
        icon: c.icon,
        difficulty: c.difficulty,
        formats: c.formats,
        xpAward: c.xpAward,
        position: c.position,
        status: 'active',
      },
    });

    await prisma.campQuestion.deleteMany({ where: { campId: camp.id } });
    await prisma.campQuestion.createMany({
      data: c.questions.map((q) => ({
        campId: camp.id,
        format: q.format,
        prompt: q.prompt,
        options: q.options ?? undefined,
        correctIndex: q.correctIndex ?? null,
        answerKey: q.answerKey ?? null,
        explanation: q.explanation ?? null,
        difficulty: q.difficulty ?? 3,
        tags: q.tags ?? [],
      })),
    });

    console.log(`Camp "${c.title}" pronto com ${c.questions.length} itens.`);
  }
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
