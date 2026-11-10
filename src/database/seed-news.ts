import { eq, inArray } from 'drizzle-orm'
import { client, db } from './client'
import { categories, posts, users } from './schema'

// Seed só de notícias: não apaga nada e pode ser executado várias vezes
// (upsert pelo slug). Todas as notícias entram publicadas (status 'pronto'),
// que é o que a home e /noticias exibem.

const daysAgo = (n: number, h = 10, m = 0) => {
  const d = new Date()
  d.setDate(d.getDate() - n)
  d.setHours(h, m, 0, 0)
  return d
}

const CATEGORIES = [
  { name: 'Futebol Local', slug: 'futebol-local' },
  { name: 'Entrevistas', slug: 'entrevistas' },
  { name: 'Esportes', slug: 'esportes' },
  { name: 'Resultados', slug: 'resultados' },
  { name: 'Veteranos', slug: 'veteranos' },
  { name: 'Análise', slug: 'analise' },
  // Categorias de modalidades (mesmos nomes/slugs do ensure-schema)
  { name: 'Atletismo', slug: 'atletismo' },
  { name: 'Jiu-Jítsu', slug: 'jiu-jitsu' },
  { name: 'Ciclismo', slug: 'ciclismo' },
  { name: 'Capoeira', slug: 'capoeira' },
]

type NewsSeed = {
  title: string
  slug: string
  content: string
  category: string
  // 1 = destaque principal do carrossel; maior = menos destaque; 0 = fora do carrossel
  relevancia: number
  daysAgo: number
  // hora local da publicação (padrão: 10h)
  hour?: number
}

const NEWS: NewsSeed[] = [
  {
    title: 'Urucuí FC vence clássico e assume a liderança da Série A',
    slug: 'urucui-fc-vence-classico-e-assume-lideranca',
    content: `Diante de um estádio lotado, o Urucuí FC derrotou o rival por 2 a 1 e assumiu a ponta da tabela da Série A. O gol da vitória saiu aos 41 minutos do segundo tempo, em cobrança de pênalti.\n\nO técnico elogiou a postura da equipe: "Foi um jogo de muita entrega. Os meninos entenderam a importância do clássico". Na próxima rodada, o líder encara um adversário direto na briga pelo título.`,
    category: 'futebol-local',
    relevancia: 1,
    daysAgo: 0,
  },
  {
    title: 'Prefeitura anuncia reforma do Estádio Municipal para a próxima temporada',
    slug: 'prefeitura-anuncia-reforma-do-estadio-municipal',
    content: `A Prefeitura de Urucuí anunciou uma reforma completa do Estádio Municipal, com novo gramado, iluminação em LED e melhorias nas arquibancadas. As obras devem começar após o fim do campeonato atual.\n\nSegundo a Secretaria de Esportes, o investimento vai beneficiar clubes, atletas e torcedores, além de permitir jogos noturnos com mais conforto e segurança.`,
    category: 'esportes',
    relevancia: 1,
    daysAgo: 1,
  },
  {
    title: 'Artilheiro da Série A chega a dez gols e embala sua equipe',
    slug: 'artilheiro-da-serie-a-chega-a-dez-gols',
    content: `Com um doblete na última rodada, o atacante chegou a dez gols no campeonato e isolou-se na artilharia da Série A. A média é de mais de um gol por partida.\n\n"Estou trabalhando muito, e o time tem criado boas chances. O objetivo é o título, e a artilharia vem como consequência", afirmou o jogador após o apito final.`,
    category: 'futebol-local',
    relevancia: 2,
    daysAgo: 2,
  },
  {
    title: 'Série B: Estrela do Norte vence fora de casa e sonha com o acesso',
    slug: 'serie-b-estrela-do-norte-vence-fora-e-sonha-com-acesso',
    content: `O Estrela do Norte venceu por 3 a 0 fora de casa e se aproximou do G4 da Série B. A equipe controlou a partida do início ao fim e contou com uma atuação inspirada do meio-campo.\n\nCom o resultado, o time chega à reta final da fase de grupos embalado e com a torcida cada vez mais confiante na classificação.`,
    category: 'futebol-local',
    relevancia: 2,
    daysAgo: 3,
  },
  {
    title: 'Entrevista: o treinador que transformou o Sport Urucuí em candidato ao título',
    slug: 'entrevista-treinador-sport-urucui-candidato-ao-titulo',
    content: `Em bate-papo exclusivo com o Urucuí Sports, o treinador falou sobre a preparação da equipe, a rotina de treinos e a relação com a torcida.\n\n"Trabalho, disciplina e humildade. É isso que a gente cobra todos os dias. O campeonato é longo e não dá para relaxar um minuto", disse. Ele também comentou a expectativa para o returno e a evolução dos jovens da base.`,
    category: 'entrevistas',
    relevancia: 3,
    daysAgo: 4,
  },
  {
    title: 'Fluminense do Piauí goleia e entra de vez na briga pela liderança',
    slug: 'fluminense-do-piaui-goleia-e-entra-na-briga-pela-lideranca',
    content: `O Fluminense do Piauí fez 4 a 0 em casa e embolou de vez a disputa pela liderança do Grupo B. A equipe abriu o placar cedo e administrou a vantagem com tranquilidade.\n\nA torcida compareceu em peso e fez a festa nas arquibancadas, em uma das maiores presenças de público da temporada.`,
    category: 'futebol-local',
    relevancia: 3,
    daysAgo: 5,
  },
  {
    title: 'Análise: o que esperar da reta final da fase de grupos',
    slug: 'analise-o-que-esperar-da-reta-final-da-fase-de-grupos',
    content: `Faltando poucas rodadas para o fim da fase de grupos, a disputa por vagas está mais acirrada do que nunca. Os confrontos diretos serão decisivos, e a regularidade vai pesar mais do que o brilho individual.\n\nNesta análise, mostramos o calendário dos principais candidatos, os adversários mais difíceis e os cenários de classificação para cada grupo.`,
    category: 'analise',
    relevancia: 4,
    daysAgo: 6,
  },
  {
    title: 'Veteranos FC mantém campanha perfeita e avança às semifinais',
    slug: 'veteranos-fc-mantem-campanha-perfeita-e-avanca-as-semifinais',
    content: `Com mais uma vitória, o Veteranos FC garantiu vaga nas semifinais do torneio de veteranos com aproveitamento de 100%. A experiência dos jogadores fez a diferença nos minutos finais.\n\nA equipe agora se prepara para o mata-mata e conta com o apoio da torcida para sonhar com o título.`,
    category: 'veteranos',
    relevancia: 4,
    daysAgo: 7,
  },
  {
    title: 'Resultados da rodada: três jogos terminam empatados e líder segue isolado',
    slug: 'resultados-da-rodada-tres-empates-e-lider-isolado',
    content: `A rodada teve três empates, uma goleada e uma vitória por placar mínimo. Apesar dos resultados, o líder da Série A seguiu isolado na ponta com boa margem de pontos.\n\nConfira o resumo de todos os jogos, os destaques individuais e a tabela atualizada após a rodada.`,
    category: 'resultados',
    relevancia: 5,
    daysAgo: 8,
  },
  {
    title: 'Escolinha de futebol da prefeitura abre novas vagas para crianças e jovens',
    slug: 'escolinha-de-futebol-da-prefeitura-abre-novas-vagas',
    content: `A escolinha de futebol mantida pela Prefeitura abriu novas vagas para crianças e jovens de 7 a 17 anos. As aulas são gratuitas e acontecem no período da tarde, com acompanhamento de professores de educação física.\n\nAs inscrições podem ser feitas na Secretaria de Esportes, mediante apresentação de documento de identidade e comprovante de residência.`,
    category: 'futebol-local',
    relevancia: 0,
    daysAgo: 9,
  },
  {
    title: 'Torcida organizada promove campanha de arrecadação de alimentos',
    slug: 'torcida-organizada-promove-campanha-de-arrecadacao-de-alimentos',
    content: `A torcida organizada do Urucuí FC lançou uma campanha de arrecadação de alimentos não perecíveis, que serão doados a famílias carentes do município. Os pontos de coleta ficam na entrada do estádio nos dias de jogo.\n\n"O esporte também é solidariedade. Queremos mostrar que a torcida vai muito além das arquibancadas", disse um dos organizadores.`,
    category: 'futebol-local',
    relevancia: 0,
    daysAgo: 10,
  },
  {
    title: 'Vôlei e futsal ganham torneios municipais com inscrições abertas',
    slug: 'volei-e-futsal-ganham-torneios-municipais-com-inscricoes-abertas',
    content: `A Secretaria de Esportes abriu as inscrições para os torneios municipais de vôlei e futsal, nas categorias masculina e feminina. As partidas serão disputadas aos fins de semana nas quadras da cidade.\n\nOs times interessados devem se inscrever até o fim do mês, e a organização promete premiação para os três primeiros colocados.`,
    category: 'esportes',
    relevancia: 5,
    daysAgo: 11,
  },
  {
    title: 'Jiu-jitsu: atletas de Urucuí conquistam medalhas em campeonato regional',
    slug: 'jiu-jitsu-atletas-de-urucui-conquistam-medalhas-em-campeonato-regional',
    content: `Os atletas de jiu-jitsu de Urucuí voltaram do campeonato regional com uma bagagem cheia de medalhas: foram três ouros, quatro pratas e cinco bronzes, somando resultados nas categorias infantil, juvenil e adulto.\n\nSegundo o professor responsável pela equipe, o desempenho é fruto de uma preparação que combinou treinos técnicos, condicionamento físico e muita disciplina. "Os alunos treinaram o ano inteiro para este momento. Ver o esforço virar medalha é a maior recompensa", afirmou.\n\nOs treinos continuam abertos a novos alunos, e a equipe já mira o próximo campeonato estadual.`,
    category: 'jiu-jitsu',
    relevancia: 4,
    daysAgo: 0,
    hour: 18,
  },
  {
    title: 'Passeio ciclístico reúne famílias e atletas pelas ruas de Urucuí',
    slug: 'passeio-ciclistico-reune-familias-e-atletas-pelas-ruas-de-urucui',
    content: `Centenas de ciclistas, entre famílias, crianças e atletas, participaram do passeio ciclístico que percorreu os principais pontos da cidade. O trajeto de 15 quilômetros teve largada na praça central e chegada no Estádio Municipal.\n\nA organização contou com apoio da guarda municipal para garantir a segurança nas vias e com pontos de hidratação ao longo do percurso. Os participantes elogiaram a estrutura e pediram que o evento passe a fazer parte do calendário fixo de esportes da cidade.\n\nAo final, houve sorteio de brindes e uma confraternização com todos os participantes.`,
    category: 'ciclismo',
    relevancia: 4,
    daysAgo: 0,
    hour: 17,
  },
  {
    title: 'Atletismo: corrida de rua reúne mais de 300 corredores em Urucuí',
    slug: 'atletismo-corrida-de-rua-reune-mais-de-300-corredores-em-urucui',
    content: `A tradicional corrida de rua de Urucuí reuniu mais de 300 corredores, entre profissionais e amadores, em percursos de 5 e 10 quilômetros. A largada aconteceu logo cedo, com clima agradável e grande presença de público.\n\nOs vencedores de cada categoria receberam troféus e medalhas, e todos os concluintes ganharam medalha de participação. A organização destacou o crescimento do evento, que a cada edição atrai mais atletas de cidades vizinhas.\n\nQuem quiser começar a correr pode procurar os grupos de treino que se reúnem semanalmente na pista do Estádio Municipal.`,
    category: 'atletismo',
    relevancia: 4,
    daysAgo: 0,
    hour: 16,
  },
  {
    title: 'Natação: projeto social leva aulas gratuitas a crianças do município',
    slug: 'natacao-projeto-social-leva-aulas-gratuitas-a-criancas-do-municipio',
    content: `Um projeto social de natação está levando aulas gratuitas a crianças e adolescentes de Urucuí. As turmas funcionam duas vezes por semana, com acompanhamento de professores de educação física e salva-vidas.\n\nAlém de ensinar a nadar, a iniciativa busca promover saúde, segurança aquática e inclusão por meio do esporte. "Para muitas crianças, é a primeira vez que entram em uma piscina. Ver a evolução delas é emocionante", contou uma das instrutoras.\n\nAs vagas são limitadas, e as inscrições podem ser feitas na Secretaria Municipal de Esportes.`,
    category: 'esportes',
    relevancia: 4,
    daysAgo: 0,
    hour: 15,
  },
  {
    title: 'Roda de capoeira celebra a cultura afro-brasileira em Urucuí',
    slug: 'roda-de-capoeira-celebra-a-cultura-afro-brasileira-em-urucui',
    content: `Uma grande roda de capoeira reuniu mestres, alunos e curiosos na praça central de Urucuí em celebração à cultura afro-brasileira. A programação incluiu apresentação de maculelê, samba de roda e batizado de novos capoeiristas.\n\nOs mestres destacaram a importância da capoeira como patrimônio cultural, esporte e instrumento de educação e inclusão social. "A capoeira ensina respeito, história e cidadania. É muito mais do que luta", disse um dos mestres presentes.\n\nOs grupos da cidade mantêm aulas abertas durante a semana para crianças, jovens e adultos.`,
    category: 'capoeira',
    relevancia: 4,
    daysAgo: 0,
    hour: 14,
  },
]

async function main() {
  console.log('📰 Populando notícias...\n')

  // Categorias: garante que existam sem tocar nas que já estão lá
  await db.insert(categories).values(CATEGORIES).onConflictDoNothing()
  const catRows = await db
    .select({ id: categories.id, slug: categories.slug })
    .from(categories)
    .where(
      inArray(
        categories.slug,
        CATEGORIES.map((c) => c.slug),
      ),
    )
  const catBySlug = new Map(catRows.map((c) => [c.slug, c.id]))

  // Autor: primeiro admin existente (opcional)
  const [admin] = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.role, 'ADMIN'))
    .limit(1)

  for (const n of NEWS) {
    const values = {
      title: n.title,
      slug: n.slug,
      content: n.content,
      categoryId: catBySlug.get(n.category) ?? null,
      authorId: admin?.id ?? null,
      authorName: 'Redação Urucuí Sports',
      relevancia: n.relevancia,
      status: 'pronto' as const,
      createdAt: daysAgo(n.daysAgo, n.hour),
      deletedAt: null,
    }
    await db
      .insert(posts)
      .values(values)
      .onConflictDoUpdate({ target: posts.slug, set: values })
  }

  console.log(`  ✓ ${NEWS.length} notícias publicadas\n`)
}

main()
  .catch((err) => {
    console.error('Falha ao popular notícias:', err)
    process.exitCode = 1
  })
  .finally(() => client.end())
