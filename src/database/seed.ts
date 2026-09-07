import { hash } from 'bcryptjs'
import { db } from './client'
import {
  users, leagues, categories, teams, rounds, posts,
  matches, players, matchGoals, standings, topScorers,
  photoAlbums, streams,
} from './schema'

const SALT_ROUNDS = 10

const today = (h = 0, m = 0) => { const d = new Date(); d.setHours(h, m, 0, 0); return d }
const daysAgo = (n: number, h = 16, m = 0) => { const d = new Date(); d.setDate(d.getDate() - n); d.setHours(h, m, 0, 0); return d }
const daysAhead = (n: number, h = 16, m = 0) => { const d = new Date(); d.setDate(d.getDate() + n); d.setHours(h, m, 0, 0); return d }

// Deterministic scores cycling through this list
const SCORES: [number, number][] = [
  [3, 0], [1, 0], [2, 1], [0, 0], [1, 1], [2, 0], [0, 1], [1, 2],
  [2, 2], [3, 1], [0, 2], [1, 3], [2, 3], [0, 3], [1, 0], [2, 1],
  [0, 0], [3, 2], [1, 1], [2, 0], [4, 0], [1, 0], [0, 0], [2, 1],
  [3, 1], [1, 2], [2, 0], [0, 1], [1, 1], [2, 3], [0, 0], [1, 0],
]
let scoreIdx = 0
function nextScore(): [number, number] {
  return SCORES[scoreIdx++ % SCORES.length]
}

const NOMES = [
  'João', 'Carlos', 'Anderson', 'Felipe', 'Marcos', 'Pedro', 'Rafael', 'Lucas',
  'Diego', 'Thiago', 'Bruno', 'Mateus', 'Gabriel', 'Gustavo', 'Eduardo', 'Rodrigo',
  'Daniel', 'Leandro', 'Henrique', 'Fábio', 'Adriano', 'Tiago', 'Vinícius', 'Samuel',
  'Raimundo', 'Edilson', 'Josué', 'Ailton', 'Walisson', 'Cláudio', 'Antônio', 'Francisco',
  'José', 'Márcio', 'Sérgio', 'Paulo', 'Renato', 'Robson', 'Edson', 'Gilmar',
  'Welton', 'Aurindo', 'Iranildo', 'Nonato', 'Valdeci',
]
const SOBRENOMES = [
  'Silva', 'Santos', 'Oliveira', 'Lima', 'Ferreira', 'Costa', 'Alves', 'Nunes',
  'Araújo', 'Pereira', 'Rodrigues', 'Carvalho', 'Mendes', 'Sousa', 'Medeiros', 'Gomes',
  'Martins', 'Ribeiro', 'Castro', 'Barbosa', 'Moraes', 'Xavier', 'Luz', 'Paz',
  'Brito', 'Rocha', 'Pinheiro', 'Andrade', 'Monteiro', 'Correia', 'Nascimento',
  'Freitas', 'Teixeira', 'Cavalcanti', 'Coelho',
]
const POSICOES = [
  'Goleiro', 'Zagueiro', 'Zagueiro', 'Lateral Direito', 'Lateral Esquerdo',
  'Volante', 'Volante', 'Meia', 'Meia', 'Atacante', 'Atacante',
]

// Round-robin pairings for 8-team group (4 rounds, no repeat matchups)
const PAIRINGS_8 = [
  [[0,1],[2,7],[3,6],[4,5]],
  [[0,2],[3,1],[4,7],[5,6]],
  [[0,3],[4,2],[5,1],[6,7]],
  [[0,4],[5,3],[6,2],[7,1]],
]
// Round-robin pairings for 4-team group (3 rounds, full round-robin)
const PAIRINGS_4 = [
  [[0,1],[2,3]],
  [[0,2],[1,3]],
  [[0,3],[1,2]],
]

type StandingEntry = {
  teamId: string; leagueId: string
  played: number; won: number; drawn: number; lost: number
  goalsFor: number; goalsAgainst: number; points: number
}
const standingMap = new Map<string, StandingEntry>()

function addResult(homeId: string, awayId: string, leagueId: string, hs: number, as_: number) {
  const get = (tid: string): StandingEntry => {
    if (!standingMap.has(tid)) {
      standingMap.set(tid, { teamId: tid, leagueId, played: 0, won: 0, drawn: 0, lost: 0, goalsFor: 0, goalsAgainst: 0, points: 0 })
    }
    return standingMap.get(tid)!
  }
  const h = get(homeId), a = get(awayId)
  h.played++; a.played++
  h.goalsFor += hs; h.goalsAgainst += as_
  a.goalsFor += as_; a.goalsAgainst += hs
  if (hs > as_) { h.won++; h.points += 3; a.lost++ }
  else if (hs < as_) { a.won++; a.points += 3; h.lost++ }
  else { h.drawn++; h.points++; a.drawn++; a.points++ }
}

type MatchInput = {
  homeTeamId: string; awayTeamId: string
  homeScore: number | null; awayScore: number | null
  status: 'FINISHED' | 'LIVE' | 'SCHEDULED' | 'POSTPONED'
  date: Date; leagueId: string; roundId: string
}
type TeamRow = { id: string }
type RoundRow = { id: string }

function buildMatches(
  groupTeams: TeamRow[],
  groupRounds: RoundRow[],
  pairings: number[][][],
  leagueId: string,
  dayOffsets: number[],   // positive = days ago, negative = days ahead, 0 = today (live round)
  liveRoundIndex: number | null,
  out: MatchInput[],
) {
  groupRounds.forEach((round, ri) => {
    const pairs = pairings[ri] ?? []
    const offset = dayOffsets[ri] ?? 0

    pairs.forEach(([hi, ai], mi) => {
      const home = groupTeams[hi]
      const away = groupTeams[ai]
      if (!home || !away) return

      let status: MatchInput['status']
      let homeScore: number | null = null
      let awayScore: number | null = null
      let date: Date

      if (liveRoundIndex === ri && mi === 0) {
        status = 'LIVE'
        const [hs, as_] = nextScore()
        homeScore = hs; awayScore = as_
        date = today(15)
      } else if (offset > 0) {
        status = 'FINISHED'
        const [hs, as_] = nextScore()
        homeScore = hs; awayScore = as_
        date = daysAgo(offset, 14 + mi * 2)
        addResult(home.id, away.id, leagueId, hs, as_)
      } else if (liveRoundIndex === ri && mi > 0) {
        status = 'SCHEDULED'
        date = today(17 + mi)
      } else {
        status = 'SCHEDULED'
        date = daysAhead(-offset, 14 + mi * 2)
      }

      out.push({ homeTeamId: home.id, awayTeamId: away.id, homeScore, awayScore, status, date, leagueId, roundId: round.id })
    })
  })
}

async function seed() {
  console.log('🌱 Populando banco de dados...\n')

  await db.delete(matchGoals)
  await db.delete(topScorers)
  await db.delete(standings)
  await db.delete(players)
  await db.delete(matches)
  await db.delete(rounds)
  await db.delete(posts)
  await db.delete(teams)
  await db.delete(categories)
  await db.delete(leagues)
  await db.delete(photoAlbums)
  await db.delete(streams)
  await db.delete(users)
  console.log('  ✓ banco limpo\n')

  // ── Usuários ─────────────────────────────────────────────────────────────────
  const [lucierPw, moisesPw, userPw] = await Promise.all([
    hash('Admin@123!', SALT_ROUNDS),
    hash('Admin@132!', SALT_ROUNDS),
    hash('User@123!', SALT_ROUNDS),
  ])
  const [admin, editor] = await db.insert(users).values([
    { name: 'Lucier', email: 'lucierflima@gmail.com', password: lucierPw, role: 'ADMIN' },
    { name: 'Moises', email: 'moisesferreira447@gmail.com', password: moisesPw, role: 'ADMIN' },
    { name: 'Carlos Mendes', email: 'editor@urucuisports.com', password: userPw, role: 'USER' },
  ]).returning()
  console.log('  ✓ 3 usuários')
  console.log('    lucierflima@gmail.com / Admin@123!')
  console.log('    moisesferreira447@gmail.com / Admin@132!')
  console.log('    editor@urucuisports.com / User@123!\n')

  // ── Categorias ───────────────────────────────────────────────────────────────
  const [catFutebol, catEntrevistas, catEsportes, catResultados, catVeteranos, catAnalise] = await db
    .insert(categories)
    .values([
      { name: 'Futebol Local',  slug: 'futebol-local'  },
      { name: 'Entrevistas',    slug: 'entrevistas'    },
      { name: 'Esportes',       slug: 'esportes'       },
      { name: 'Resultados',     slug: 'resultados'     },
      { name: 'Veteranos',      slug: 'veteranos'      },
      { name: 'Análise',        slug: 'analise'        },
    ])
    .returning()
  console.log('  ✓ 6 categorias')

  // ── Ligas ────────────────────────────────────────────────────────────────────
  const [serieA, serieB, ligaVet] = await db
    .insert(leagues)
    .values([
      { name: 'Uruçíense Série A', slug: 'urucuiense-serie-a', country: 'Brasil', tipo: 'grupos', numeroGrupos: 2 },
      { name: 'Uruçíense Série B', slug: 'urucuiense-serie-b', country: 'Brasil', tipo: 'grupos', numeroGrupos: 2 },
      { name: 'Veteranos',         slug: 'veteranos',          country: 'Brasil', tipo: 'grupos', numeroGrupos: 2 },
    ])
    .returning()
  console.log('  ✓ 3 ligas')

  // ── Times – 40 total ─────────────────────────────────────────────────────────
  const allTeams = await db
    .insert(teams)
    .values([
      // Série A – Grupo 1
      { name: 'Urucuí FC',                leagueId: serieA.id, grupo: 1 },
      { name: 'Sport Urucuí',             leagueId: serieA.id, grupo: 1 },
      { name: 'Atlético Uruçuiense',      leagueId: serieA.id, grupo: 1 },
      { name: 'Flamengo de Urucuí',       leagueId: serieA.id, grupo: 1 },
      { name: 'Botafogo Uruçuiense',      leagueId: serieA.id, grupo: 1 },
      { name: 'Corinthians de Urucuí',    leagueId: serieA.id, grupo: 1 },
      { name: 'Santos Piauiense',         leagueId: serieA.id, grupo: 1 },
      { name: 'Real Urucuí',              leagueId: serieA.id, grupo: 1 },
      // Série A – Grupo 2
      { name: 'Fluminense do Piauí',      leagueId: serieA.id, grupo: 2 },
      { name: 'Cruzeiro Uruçuiense',      leagueId: serieA.id, grupo: 2 },
      { name: 'Internacional de Urucuí',  leagueId: serieA.id, grupo: 2 },
      { name: 'Vasco do Piauí',           leagueId: serieA.id, grupo: 2 },
      { name: 'Palmeiras Uruçuiense',     leagueId: serieA.id, grupo: 2 },
      { name: 'América Uruçuiense',       leagueId: serieA.id, grupo: 2 },
      { name: 'Grêmio Uruçuiense',        leagueId: serieA.id, grupo: 2 },
      { name: 'Fortaleza Uruçuiense',     leagueId: serieA.id, grupo: 2 },
      // Série B – Grupo 1
      { name: 'Estrela do Norte',         leagueId: serieB.id, grupo: 1 },
      { name: 'União Uruçuiense',         leagueId: serieB.id, grupo: 1 },
      { name: 'Nacional Uruçuiense',      leagueId: serieB.id, grupo: 1 },
      { name: 'Juventude Piauiense',      leagueId: serieB.id, grupo: 1 },
      { name: 'Esportivo Uruçuiense',     leagueId: serieB.id, grupo: 1 },
      { name: 'Guarani de Urucuí',        leagueId: serieB.id, grupo: 1 },
      { name: 'XV de Urucuí',             leagueId: serieB.id, grupo: 1 },
      { name: 'Independente Uruçuiense',  leagueId: serieB.id, grupo: 1 },
      // Série B – Grupo 2
      { name: 'Democrata Uruçuiense',     leagueId: serieB.id, grupo: 2 },
      { name: 'Ferroviário Piauiense',    leagueId: serieB.id, grupo: 2 },
      { name: 'Náutico Uruçuiense',       leagueId: serieB.id, grupo: 2 },
      { name: 'Auto Esporte Piauiense',   leagueId: serieB.id, grupo: 2 },
      { name: 'Treze de Urucuí',          leagueId: serieB.id, grupo: 2 },
      { name: 'Central Uruçuiense',       leagueId: serieB.id, grupo: 2 },
      { name: 'ABC Piauiense',            leagueId: serieB.id, grupo: 2 },
      { name: 'Paraíba de Urucuí',        leagueId: serieB.id, grupo: 2 },
      // Veteranos – Grupo 1
      { name: 'Veteranos FC',             leagueId: ligaVet.id, grupo: 1 },
      { name: 'Amigos do Balão',          leagueId: ligaVet.id, grupo: 1 },
      { name: 'Aposentados United',       leagueId: ligaVet.id, grupo: 1 },
      { name: 'Golden Team',              leagueId: ligaVet.id, grupo: 1 },
      // Veteranos – Grupo 2
      { name: 'Veteranos Sport',          leagueId: ligaVet.id, grupo: 2 },
      { name: 'Old Boys Urucuí',          leagueId: ligaVet.id, grupo: 2 },
      { name: 'Lendas do Piauí',          leagueId: ligaVet.id, grupo: 2 },
      { name: 'Masters Urucuí',           leagueId: ligaVet.id, grupo: 2 },
    ])
    .returning()

  const saG1 = allTeams.slice(0,  8)   // Série A Grupo 1
  const saG2 = allTeams.slice(8,  16)  // Série A Grupo 2
  const sbG1 = allTeams.slice(16, 24)  // Série B Grupo 1
  const sbG2 = allTeams.slice(24, 32)  // Série B Grupo 2
  const vtG1 = allTeams.slice(32, 36)  // Veteranos Grupo 1
  const vtG2 = allTeams.slice(36, 40)  // Veteranos Grupo 2
  console.log('  ✓ 40 times')

  // ── Rodadas ──────────────────────────────────────────────────────────────────
  const allRounds = await db
    .insert(rounds)
    .values([
      // Série A G1 (4 rodadas)
      { leagueId: serieA.id, numero: 1, nome: '1ª Rodada – Grupo A', grupo: 1 },
      { leagueId: serieA.id, numero: 2, nome: '2ª Rodada – Grupo A', grupo: 1 },
      { leagueId: serieA.id, numero: 3, nome: '3ª Rodada – Grupo A', grupo: 1 },
      { leagueId: serieA.id, numero: 4, nome: '4ª Rodada – Grupo A', grupo: 1 },
      // Série A G2 (4 rodadas)
      { leagueId: serieA.id, numero: 1, nome: '1ª Rodada – Grupo B', grupo: 2 },
      { leagueId: serieA.id, numero: 2, nome: '2ª Rodada – Grupo B', grupo: 2 },
      { leagueId: serieA.id, numero: 3, nome: '3ª Rodada – Grupo B', grupo: 2 },
      { leagueId: serieA.id, numero: 4, nome: '4ª Rodada – Grupo B', grupo: 2 },
      // Série B G1 (3 rodadas)
      { leagueId: serieB.id, numero: 1, nome: '1ª Rodada – Grupo A', grupo: 1 },
      { leagueId: serieB.id, numero: 2, nome: '2ª Rodada – Grupo A', grupo: 1 },
      { leagueId: serieB.id, numero: 3, nome: '3ª Rodada – Grupo A', grupo: 1 },
      // Série B G2 (3 rodadas)
      { leagueId: serieB.id, numero: 1, nome: '1ª Rodada – Grupo B', grupo: 2 },
      { leagueId: serieB.id, numero: 2, nome: '2ª Rodada – Grupo B', grupo: 2 },
      { leagueId: serieB.id, numero: 3, nome: '3ª Rodada – Grupo B', grupo: 2 },
      // Veteranos G1 (3 rodadas)
      { leagueId: ligaVet.id, numero: 1, nome: '1ª Rodada – Grupo A', grupo: 1 },
      { leagueId: ligaVet.id, numero: 2, nome: '2ª Rodada – Grupo A', grupo: 1 },
      { leagueId: ligaVet.id, numero: 3, nome: '3ª Rodada – Grupo A', grupo: 1 },
      // Veteranos G2 (3 rodadas)
      { leagueId: ligaVet.id, numero: 1, nome: '1ª Rodada – Grupo B', grupo: 2 },
      { leagueId: ligaVet.id, numero: 2, nome: '2ª Rodada – Grupo B', grupo: 2 },
      { leagueId: ligaVet.id, numero: 3, nome: '3ª Rodada – Grupo B', grupo: 2 },
    ])
    .returning()

  const saRG1 = allRounds.slice(0,  4)
  const saRG2 = allRounds.slice(4,  8)
  const sbRG1 = allRounds.slice(8,  11)
  const sbRG2 = allRounds.slice(11, 14)
  const vtRG1 = allRounds.slice(14, 17)
  const vtRG2 = allRounds.slice(17, 20)
  console.log('  ✓ 20 rodadas')

  // ── Partidas ─────────────────────────────────────────────────────────────────
  const matchInputs: MatchInput[] = []

  // Série A G1: R1=21 dias atrás, R2=14, R3=7, R4=hoje (ao vivo)
  buildMatches(saG1, saRG1, PAIRINGS_8, serieA.id, [21, 14, 7, 0], 3, matchInputs)
  // Série A G2: R1=18 dias atrás, R2=11, R3=4, R4=3 dias à frente
  buildMatches(saG2, saRG2, PAIRINGS_8, serieA.id, [18, 11, 4, -3], null, matchInputs)
  // Série B G1: R1=14 dias atrás, R2=7, R3=hoje (ao vivo)
  buildMatches(sbG1, sbRG1, PAIRINGS_8, serieB.id, [14, 7, 0], 2, matchInputs)
  // Série B G2: R1=12 dias atrás, R2=5, R3=2 dias à frente
  buildMatches(sbG2, sbRG2, PAIRINGS_8, serieB.id, [12, 5, -2], null, matchInputs)
  // Veteranos G1: R1=10 dias atrás, R2=3, R3=4 dias à frente
  buildMatches(vtG1, vtRG1, PAIRINGS_4, ligaVet.id, [10, 3, -4], null, matchInputs)
  // Veteranos G2: R1=10 dias atrás, R2=3, R3=hoje (ao vivo)
  buildMatches(vtG2, vtRG2, PAIRINGS_4, ligaVet.id, [10, 3, 0], 2, matchInputs)

  await db.insert(matches).values(matchInputs)
  const nFin  = matchInputs.filter(m => m.status === 'FINISHED').length
  const nLive = matchInputs.filter(m => m.status === 'LIVE').length
  const nSch  = matchInputs.filter(m => m.status === 'SCHEDULED').length
  console.log(`  ✓ ${matchInputs.length} partidas (${nFin} encerradas, ${nLive} ao vivo, ${nSch} agendadas)`)

  // ── Jogadores – 11 por time ──────────────────────────────────────────────────
  const playerInserts = allTeams.flatMap((team, ti) =>
    POSICOES.map((position, pi) => ({
      name: `${NOMES[(ti * 11 + pi) % NOMES.length]} ${SOBRENOMES[(ti * 7 + pi * 3) % SOBRENOMES.length]}`,
      position,
      teamId: team.id,
    }))
  )
  await db.insert(players).values(playerInserts)
  console.log(`  ✓ ${playerInserts.length} jogadores (11 por time)`)

  // ── Classificação ─────────────────────────────────────────────────────────────
  const standingInserts = Array.from(standingMap.values())
  if (standingInserts.length > 0) {
    await db.insert(standings).values(standingInserts)
  }
  console.log(`  ✓ ${standingInserts.length} registros de classificação`)

  // ── Artilheiros – 5 por liga ─────────────────────────────────────────────────
  await db.insert(topScorers).values([
    // Série A
    { playerName: 'João Silva',          teamId: saG1[0].id, leagueId: serieA.id, goals: 7, assists: 2 },
    { playerName: 'Carlos Santos',       teamId: saG1[1].id, leagueId: serieA.id, goals: 5, assists: 3 },
    { playerName: 'Felipe Araújo',       teamId: saG2[0].id, leagueId: serieA.id, goals: 4, assists: 1 },
    { playerName: 'Diego Nunes',         teamId: saG2[1].id, leagueId: serieA.id, goals: 4, assists: 0 },
    { playerName: 'Anderson Costa',      teamId: saG1[3].id, leagueId: serieA.id, goals: 3, assists: 4 },
    // Série B
    { playerName: 'Rafael Lima',         teamId: sbG1[0].id, leagueId: serieB.id, goals: 6, assists: 1 },
    { playerName: 'Marcos Oliveira',     teamId: sbG1[2].id, leagueId: serieB.id, goals: 4, assists: 2 },
    { playerName: 'Thiago Brito',        teamId: sbG2[0].id, leagueId: serieB.id, goals: 3, assists: 0 },
    { playerName: 'Bruno Ferreira',      teamId: sbG2[3].id, leagueId: serieB.id, goals: 3, assists: 1 },
    { playerName: 'Leandro Alves',       teamId: sbG1[4].id, leagueId: serieB.id, goals: 2, assists: 3 },
    // Veteranos
    { playerName: 'Raimundo Filho',      teamId: vtG1[0].id, leagueId: ligaVet.id, goals: 4, assists: 1 },
    { playerName: 'Edinaldo Silva',      teamId: vtG2[0].id, leagueId: ligaVet.id, goals: 3, assists: 0 },
    { playerName: 'Fábio Moraes',        teamId: vtG1[2].id, leagueId: ligaVet.id, goals: 2, assists: 2 },
    { playerName: 'Gilmar Costa',        teamId: vtG2[1].id, leagueId: ligaVet.id, goals: 2, assists: 0 },
    { playerName: 'Nonato Pereira',      teamId: vtG1[1].id, leagueId: ligaVet.id, goals: 1, assists: 3 },
  ])
  console.log('  ✓ 15 artilheiros')

  // ── Álbuns de fotos ──────────────────────────────────────────────────────────
  await db.insert(photoAlbums).values([
    { title: 'Uruçíense Série A – Abertura 2025',     description: 'Melhores momentos da rodada inaugural da Série A.',             url: 'https://example.com/albuns/serie-a-abertura',    coverUrl: null },
    { title: 'Uruçíense Série B – 1ª Rodada',         description: 'Imagens das partidas da 1ª rodada da Série B.',                 url: 'https://example.com/albuns/serie-b-r1',          coverUrl: null },
    { title: 'Veteranos – Fase de Grupos',            description: 'Momentos marcantes do torneio veteranos 2025.',                 url: 'https://example.com/albuns/veteranos-grupos',    coverUrl: null },
    { title: 'Urucuí FC – Treino Aberto',             description: 'Bastidores do treino aberto do Urucuí FC.',                     url: 'https://example.com/albuns/urucuifc-treino',     coverUrl: null },
    { title: 'Gols e Lances – Série A Rodada 2',      description: 'Compilado dos melhores lances da 2ª rodada da Série A.',        url: 'https://example.com/albuns/serie-a-r2-lances',   coverUrl: null },
    { title: 'Torcida nas Arquibancadas',             description: 'A paixão da torcida uruçuiense registrada em fotos.',           url: 'https://example.com/albuns/torcida',             coverUrl: null },
    { title: 'Premiação – Melhor em Campo',           description: 'Cerimônia de premiação das rodadas anteriores.',                url: 'https://example.com/albuns/premiacao',           coverUrl: null },
    { title: 'Bastidores – Vestiário Sport Urucuí',   description: 'Imagens exclusivas do vestiário do Sport Urucuí.',              url: 'https://example.com/albuns/sport-vestiario',     coverUrl: null },
    { title: 'Série A – Rodada 3 Melhores Momentos',  description: 'Os gols e jogadas da 3ª rodada da Série A.',                   url: 'https://example.com/albuns/serie-a-r3',          coverUrl: null },
    { title: 'Entrega de Uniformes – Série B 2025',   description: 'Times da Série B recebem seus uniformes oficiais.',             url: 'https://example.com/albuns/serie-b-uniformes',   coverUrl: null },
  ])
  console.log('  ✓ 10 álbuns de fotos')

  // ── Transmissões ─────────────────────────────────────────────────────────────
  await db.insert(streams).values([
    { title: 'Urucuí FC x Sport Urucuí – Série A AO VIVO',      description: 'Clássico do Grupo A da Série A ao vivo.',            url: 'https://www.youtube.com/watch?v=live1',  status: 'LIVE',      scheduledAt: today(15)         },
    { title: 'Veteranos Sport x Old Boys – Grupo B AO VIVO',    description: 'Rodada final do Grupo B Veteranos ao vivo.',         url: 'https://www.youtube.com/watch?v=live2',  status: 'LIVE',      scheduledAt: today(16)         },
    { title: 'Série A G1 – Rodada 4 Jogo 2',                    description: 'Segundo confronto da 4ª rodada do Grupo A.',         url: 'https://www.youtube.com/watch?v=sch1',   status: 'SCHEDULED', scheduledAt: today(17)         },
    { title: 'Série A G1 – Rodada 4 Jogo 3',                    description: 'Terceiro confronto da 4ª rodada do Grupo A.',        url: 'https://www.youtube.com/watch?v=sch2',   status: 'SCHEDULED', scheduledAt: today(18)         },
    { title: 'Série B G1 – Rodada 3 Jogo 2',                    description: 'Segundo confronto da 3ª rodada da Série B.',         url: 'https://www.youtube.com/watch?v=sch3',   status: 'SCHEDULED', scheduledAt: today(19)         },
    { title: 'Série A G2 – Rodada 4 Completa',                  description: 'Rodada 4 completa do Grupo B da Série A.',           url: 'https://www.youtube.com/watch?v=sch4',   status: 'SCHEDULED', scheduledAt: daysAhead(3, 15)  },
    { title: 'Melhores Momentos – Série A Rodada 3',            description: 'Compilado da 3ª rodada completa da Série A.',        url: 'https://www.youtube.com/watch?v=fin1',   status: 'FINISHED',  scheduledAt: daysAgo(7)        },
    { title: 'Melhores Momentos – Série B Rodada 2',            description: 'Compilado da 2ª rodada da Série B.',                 url: 'https://www.youtube.com/watch?v=fin2',   status: 'FINISHED',  scheduledAt: daysAgo(5)        },
    { title: 'Melhores Momentos – Veteranos Rodada 1',          description: 'Lances da 1ª rodada do torneio Veteranos.',          url: 'https://www.youtube.com/watch?v=fin3',   status: 'FINISHED',  scheduledAt: daysAgo(10)       },
    { title: 'Abertura da Temporada – Cerimônia Oficial 2025',  description: 'Cerimônia de abertura da temporada esportiva 2025.', url: 'https://www.youtube.com/watch?v=fin4',   status: 'FINISHED',  scheduledAt: daysAgo(25)       },
  ])
  console.log('  ✓ 10 transmissões')

  // ── Notícias – 15 artigos ────────────────────────────────────────────────────
  await db.insert(posts).values([
    {
      title: 'Uruçíense Série A 2025 começa com goleadas e empates históricos',
      slug: 'urucuiense-serie-a-2025-começa',
      content: `A temporada 2025 da Uruçíense Série A foi inaugurada com grande emoção. O Urucuí FC estreou com uma convincente vitória no Grupo A, enquanto no Grupo B o Fluminense do Piauí mostrou força e terminou a primeira rodada na liderança. A organização confirmou que todas as partidas serão transmitidas ao vivo pelo canal oficial no YouTube.`,
      categoryId: catFutebol.id, authorId: admin.id, relevancia: 5,
    },
    {
      title: 'Sport Urucuí mantém 100% e lidera o Grupo A da Série A',
      slug: 'sport-urucui-lidera-grupo-a-serie-a',
      content: `Com campanha impecável, o Sport Urucuí chegou à segunda rodada sem ter sofrido nenhum gol e com seis pontos conquistados. O técnico destacou a disciplina tática como principal diferencial. A próxima rodada coloca os dois líderes frente a frente num clássico esperado.`,
      categoryId: catFutebol.id, authorId: editor.id, relevancia: 4,
    },
    {
      title: 'Série B: Estrela do Norte surpreende na abertura do Grupo A',
      slug: 'serie-b-estrela-norte-surpreende-grupo-a',
      content: `O Estrela do Norte, recém-promovido à Série B, começou a temporada de forma surpreendente ao vencer seus dois primeiros confrontos. O artilheiro Rafael Lima, com três gols em dois jogos, tem sido o grande destaque da equipe nesta fase de grupos.`,
      categoryId: catFutebol.id, authorId: editor.id, relevancia: 3,
    },
    {
      title: 'Veteranos FC domina Grupo A com facilidade e mira o título',
      slug: 'veteranos-fc-domina-grupo-a',
      content: `No torneio Veteranos, o Veteranos FC mostrou superior qualidade técnica e aproveitamento máximo na fase de grupos. Com Raimundo Filho brilhando com quatro gols, a equipe se coloca como favorita ao título. A final está marcada para as próximas semanas no Estádio Municipal.`,
      categoryId: catVeteranos.id, authorId: admin.id, relevancia: 3,
    },
    {
      title: 'Resultados completos da 2ª Rodada – Série A Grupo A',
      slug: 'resultados-2a-rodada-serie-a-grupo-a',
      content: `A segunda rodada do Grupo A da Série A trouxe resultados equilibrados. Atlético Uruçuiense e Flamengo de Urucuí empataram em jogo emocionante, enquanto Botafogo Uruçuiense surpreendeu o Corinthians de Urucuí com vitória fora de casa. Confira todos os placares e goleadores na tabela atualizada.`,
      categoryId: catResultados.id, authorId: editor.id, relevancia: 2,
    },
    {
      title: 'Resultados da 2ª Rodada – Série B Grupos A e B',
      slug: 'resultados-2a-rodada-serie-b',
      content: `A segunda rodada da Série B foi marcada pela disputa acirrada em ambos os grupos. No Grupo A, União Uruçuiense e Nacional Uruçuiense empataram. No Grupo B, o Democrata Uruçuiense manteve 100% de aproveitamento com mais uma vitória convincente.`,
      categoryId: catResultados.id, authorId: editor.id, relevancia: 2,
    },
    {
      title: 'Entrevista exclusiva: João Silva fala sobre artilharia e pressão',
      slug: 'entrevista-joao-silva-artilheiro-serie-a',
      content: `Com sete gols na Série A, João Silva é o artilheiro isolado do torneio. Em entrevista exclusiva ao Urucuí Sports, o atacante do Urucuí FC revelou sua rotina de treinos e como lida com a responsabilidade de liderar o ataque. "Prefiro focar no coletivo. Os gols vêm como consequência do trabalho em equipe", declarou.`,
      categoryId: catEntrevistas.id, authorId: editor.id, relevancia: 4,
    },
    {
      title: 'Técnico do Fluminense do Piauí revela estratégia para a decisão',
      slug: 'entrevista-tecnico-fluminense-piauí-estrategia',
      content: `O técnico Alexandre Moraes, do Fluminense do Piauí, concedeu entrevista exclusiva antes da rodada decisiva do Grupo B da Série A. Ele explicou a estratégia defensiva adotada e prometeu que o time buscará o título. "Somos candidatos sérios. O elenco está preparado para qualquer adversário", afirmou.`,
      categoryId: catEntrevistas.id, authorId: admin.id, relevancia: 3,
    },
    {
      title: 'Análise: como o Urucuí FC domina tecnicamente o Grupo A',
      slug: 'analise-urucuifc-dominio-grupo-a',
      content: `Com o melhor ataque do Grupo A da Série A, o Urucuí FC tem se destacado pelo volume de jogo e pela eficiência finalizadora. Analisamos os dados das três primeiras rodadas: posse de bola, finalizações e aproveitamento revelam por que a equipe é apontada como favorita ao título da Série A 2025.`,
      categoryId: catAnalise.id, authorId: editor.id, relevancia: 3,
    },
    {
      title: 'Torneio Veteranos reúne mais de 300 atletas em Urucuí',
      slug: 'torneio-veteranos-reune-300-atletas',
      content: `O Torneio Veteranos 2025 bateu recorde de participação, reunindo mais de 300 atletas acima de 40 anos. A competição, organizada pela Secretaria Municipal de Esportes, conta com oito equipes distribuídas em dois grupos e promete uma final memorável no Estádio Municipal.`,
      categoryId: catVeteranos.id, authorId: admin.id, relevancia: 3,
    },
    {
      title: 'Série A Grupo B: Cruzeiro e Internacional brigam pela liderança',
      slug: 'serie-a-grupo-b-cruzeiro-internacional-liderança',
      content: `O duelo pelo topo do Grupo B entre Cruzeiro Uruçuiense e Internacional de Urucuí promete ser o confronto mais aguardado da fase de grupos. As duas equipes chegam empatadas em pontos e o saldo de gols será o fator decisivo caso o equilíbrio persista até o final da rodada classificatória.`,
      categoryId: catFutebol.id, authorId: editor.id, relevancia: 4,
    },
    {
      title: 'Tabela atualizada: classificação completa da Série B após 2 rodadas',
      slug: 'tabela-atualizada-classificacao-serie-b',
      content: `Com duas rodadas disputadas na Série B, os líderes já estão definidos em cada grupo. No Grupo A, o Estrela do Norte ocupa a primeira posição com seis pontos e saldo positivo. No Grupo B, o Democrata Uruçuiense lidera com aproveitamento máximo. Confira a classificação completa e os próximos confrontos.`,
      categoryId: catResultados.id, authorId: admin.id, relevancia: 2,
    },
    {
      title: 'Prefeitura anuncia reforma do Estádio Municipal para 2026',
      slug: 'prefeitura-reforma-estadio-municipal-2026',
      content: `A Prefeitura de Urucuí anunciou a reforma completa do Estádio Municipal com previsão para 2026. O projeto inclui nova iluminação de LED, vestiários modernos, acessibilidade ampliada e expansão da capacidade para 3.000 torcedores. O investimento total é de R$ 2,5 milhões com recursos estaduais e municipais.`,
      categoryId: catEsportes.id, authorId: admin.id, relevancia: 3,
    },
    {
      title: 'Os gols mais bonitos da 3ª Rodada da Série A',
      slug: 'gols-bonitos-3a-rodada-serie-a',
      content: `A terceira rodada da Série A produziu lances espetaculares. Um voleio de Anderson Costa pelo Flamengo de Urucuí e uma cobrança de falta milimétrica de Diego Nunes pelo Corinthians foram eleitos os gols mais bonitos pelos torcedores em nossa enquete nas redes sociais. Reveja os lances completos.`,
      categoryId: catResultados.id, authorId: editor.id, relevancia: 2,
    },
    {
      title: 'Futsal, vôlei e natação crescem entre os jovens de Urucuí',
      slug: 'modalidades-alternativas-crescem-urucui',
      content: `Além do futebol, outras modalidades esportivas ganham força em Urucuí. O futsal, o vôlei e a natação têm atraído novos praticantes especialmente entre os jovens. A Secretaria Municipal de Esportes está desenvolvendo projetos para ampliar o acesso às quadras e piscinas da cidade durante 2025.`,
      categoryId: catEsportes.id, authorId: admin.id, relevancia: 1,
    },
  ])
  console.log('  ✓ 15 notícias')

  console.log('\n✅ Banco de dados populado com sucesso!')
  console.log(`   40 times | 20 rodadas | ${matchInputs.length} partidas | 440 jogadores`)
  console.log(`   15 artilheiros | 15 notícias | 10 álbuns | 10 transmissões`)
  process.exit(0)
}

seed().catch((err) => {
  console.error('❌ Falha ao popular o banco:', err)
  process.exit(1)
})
