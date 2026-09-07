import { db } from './client'
import {
  matchGoals,
  topScorers,
  standings,
  players,
  matches,
  rounds,
  posts,
  teams,
  categories,
  leagues,
  photoAlbums,
  streams,
  advertisers,
  refreshTokens,
} from './schema'

async function clean() {
  console.log('🧹 Limpando banco de dados (preservando users)...\n')

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
  await db.delete(advertisers)
  await db.delete(refreshTokens)

  console.log('✅ Banco limpo. Tabela users preservada.')
  process.exit(0)
}

clean().catch((err) => {
  console.error('❌ Falha ao limpar o banco:', err)
  process.exit(1)
})
