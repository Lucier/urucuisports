import {
  pgTable,
  uuid,
  text,
  timestamp,
  varchar,
  pgEnum,
  index,
  integer,
} from 'drizzle-orm/pg-core'
import { relations } from 'drizzle-orm'

// ─── Enums ────────────────────────────────────────────────────────────────────

export const roleEnum = pgEnum('user_role', ['ADMIN', 'USER'])
export const matchStatusEnum = pgEnum('match_status', [
  'SCHEDULED',
  'LIVE',
  'FINISHED',
  'POSTPONED',
])
export const streamStatusEnum = pgEnum('stream_status', ['LIVE', 'SCHEDULED', 'FINISHED'])
export const leagueTypeEnum = pgEnum('league_type', ['pontos_corridos', 'grupos'])

// ─── Users ────────────────────────────────────────────────────────────────────

export const users = pgTable(
  'users',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    name: varchar('name', { length: 255 }).notNull(),
    email: varchar('email', { length: 255 }).notNull().unique(),
    password: varchar('password', { length: 255 }).notNull(),
    role: roleEnum('role').default('USER').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [index('idx_users_email').on(table.email), index('idx_users_role').on(table.role)],
)

export const usersRelations = relations(users, ({ many }) => ({
  posts: many(posts),
  refreshTokens: many(refreshTokens),
}))

// ─── Refresh Tokens ───────────────────────────────────────────────────────────

export const refreshTokens = pgTable(
  'refresh_tokens',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    tokenHash: varchar('token_hash', { length: 64 }).notNull().unique(),
    expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
    revokedAt: timestamp('revoked_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index('idx_refresh_tokens_user').on(table.userId),
    index('idx_refresh_tokens_hash').on(table.tokenHash),
  ],
)

export const refreshTokensRelations = relations(refreshTokens, ({ one }) => ({
  user: one(users, { fields: [refreshTokens.userId], references: [users.id] }),
}))

// ─── Leagues ──────────────────────────────────────────────────────────────────

export const leagues = pgTable('leagues', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  slug: varchar('slug', { length: 255 }).notNull().unique(),
  logoUrl: text('logo_url'),
  country: varchar('country', { length: 100 }),
  tipo: leagueTypeEnum('tipo').default('pontos_corridos').notNull(),
  numeroGrupos: integer('numero_grupos'),
})

export const leaguesRelations = relations(leagues, ({ many }) => ({
  teams: many(teams),
  rounds: many(rounds),
  matches: many(matches),
  standings: many(standings),
  topScorers: many(topScorers),
}))

// ─── Rounds ───────────────────────────────────────────────────────────────────

export const rounds = pgTable(
  'rounds',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    leagueId: uuid('league_id')
      .notNull()
      .references(() => leagues.id, { onDelete: 'cascade' }),
    numero: integer('numero').notNull(),
    nome: varchar('nome', { length: 255 }),
    grupo: integer('grupo'),
  },
  (table) => [
    index('idx_rounds_league').on(table.leagueId),
    index('idx_rounds_grupo').on(table.grupo),
  ],
)

export const roundsRelations = relations(rounds, ({ one, many }) => ({
  league: one(leagues, { fields: [rounds.leagueId], references: [leagues.id] }),
  matches: many(matches),
}))

// ─── Categories ───────────────────────────────────────────────────────────────

export const categories = pgTable('categories', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  slug: varchar('slug', { length: 255 }).notNull().unique(),
})

export const categoriesRelations = relations(categories, ({ many }) => ({
  posts: many(posts),
}))

// ─── Posts ────────────────────────────────────────────────────────────────────

export const posts = pgTable(
  'posts',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    title: varchar('title', { length: 500 }).notNull(),
    slug: varchar('slug', { length: 500 }).notNull().unique(),
    content: text('content').notNull(),
    imageUrl: text('image_url'),
    categoryId: uuid('category_id').references(() => categories.id),
    authorId: uuid('author_id').references(() => users.id),
    authorName: varchar('author_name', { length: 255 }),
    relevancia: integer('relevancia').default(1).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    deletedAt: timestamp('deleted_at', { withTimezone: true }),
  },
  (table) => [
    index('idx_posts_slug').on(table.slug),
    index('idx_posts_category').on(table.categoryId),
    index('idx_posts_author').on(table.authorId),
  ],
)

export const postsRelations = relations(posts, ({ one }) => ({
  category: one(categories, { fields: [posts.categoryId], references: [categories.id] }),
  author: one(users, { fields: [posts.authorId], references: [users.id] }),
}))

// ─── Teams ────────────────────────────────────────────────────────────────────

export const teams = pgTable('teams', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  logoUrl: text('logo_url'),
  leagueId: uuid('league_id').references(() => leagues.id),
  grupo: integer('grupo'),
})

export const teamsRelations = relations(teams, ({ one, many }) => ({
  league: one(leagues, { fields: [teams.leagueId], references: [leagues.id] }),
  homeMatches: many(matches, { relationName: 'homeTeam' }),
  awayMatches: many(matches, { relationName: 'awayTeam' }),
  standings: many(standings),
  topScorers: many(topScorers),
  players: many(players),
}))

// ─── Matches ──────────────────────────────────────────────────────────────────

export const matches = pgTable(
  'matches',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    homeTeamId: uuid('home_team_id')
      .notNull()
      .references(() => teams.id),
    awayTeamId: uuid('away_team_id')
      .notNull()
      .references(() => teams.id),
    homeScore: integer('home_score'),
    awayScore: integer('away_score'),
    status: matchStatusEnum('status').default('SCHEDULED').notNull(),
    date: timestamp('date', { withTimezone: true }).notNull(),
    streamUrl: text('stream_url'),
    leagueId: uuid('league_id').references(() => leagues.id),
    roundId: uuid('round_id').references(() => rounds.id, { onDelete: 'set null' }),
  },
  (table) => [
    index('idx_matches_league').on(table.leagueId),
    index('idx_matches_round').on(table.roundId),
    index('idx_matches_date').on(table.date),
    index('idx_matches_status').on(table.status),
  ],
)

export const matchesRelations = relations(matches, ({ one, many }) => ({
  homeTeam: one(teams, {
    fields: [matches.homeTeamId],
    references: [teams.id],
    relationName: 'homeTeam',
  }),
  awayTeam: one(teams, {
    fields: [matches.awayTeamId],
    references: [teams.id],
    relationName: 'awayTeam',
  }),
  league: one(leagues, { fields: [matches.leagueId], references: [leagues.id] }),
  round: one(rounds, { fields: [matches.roundId], references: [rounds.id] }),
  goals: many(matchGoals),
}))

// ─── Standings ────────────────────────────────────────────────────────────────

export const standings = pgTable(
  'standings',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    teamId: uuid('team_id')
      .notNull()
      .references(() => teams.id),
    leagueId: uuid('league_id')
      .notNull()
      .references(() => leagues.id),
    played: integer('played').default(0).notNull(),
    won: integer('won').default(0).notNull(),
    drawn: integer('drawn').default(0).notNull(),
    lost: integer('lost').default(0).notNull(),
    goalsFor: integer('goals_for').default(0).notNull(),
    goalsAgainst: integer('goals_against').default(0).notNull(),
    points: integer('points').default(0).notNull(),
  },
  (table) => [
    index('idx_standings_league').on(table.leagueId),
    index('idx_standings_team').on(table.teamId),
  ],
)

export const standingsRelations = relations(standings, ({ one }) => ({
  team: one(teams, { fields: [standings.teamId], references: [teams.id] }),
  league: one(leagues, { fields: [standings.leagueId], references: [leagues.id] }),
}))

// ─── Top Scorers ──────────────────────────────────────────────────────────────

export const topScorers = pgTable(
  'top_scorers',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    playerName: varchar('player_name', { length: 255 }).notNull(),
    teamId: uuid('team_id').references(() => teams.id),
    leagueId: uuid('league_id').references(() => leagues.id),
    goals: integer('goals').default(0).notNull(),
    assists: integer('assists').default(0).notNull(),
  },
  (table) => [index('idx_scorers_league').on(table.leagueId)],
)

export const topScorersRelations = relations(topScorers, ({ one }) => ({
  team: one(teams, { fields: [topScorers.teamId], references: [teams.id] }),
  league: one(leagues, { fields: [topScorers.leagueId], references: [leagues.id] }),
}))

// ─── Streams ──────────────────────────────────────────────────────────────────

export const streams = pgTable(
  'streams',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    title: varchar('title', { length: 255 }).notNull(),
    description: text('description'),
    url: text('url').notNull(),
    status: streamStatusEnum('status').default('SCHEDULED').notNull(),
    scheduledAt: timestamp('scheduled_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index('idx_streams_status').on(table.status),
    index('idx_streams_scheduled').on(table.scheduledAt),
  ],
)

// ─── Players ──────────────────────────────────────────────────────────────────

export const players = pgTable(
  'players',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    name: varchar('name', { length: 255 }).notNull(),
    position: varchar('position', { length: 100 }).notNull(),
    photoUrl: text('photo_url'),
    teamId: uuid('team_id')
      .notNull()
      .references(() => teams.id, { onDelete: 'cascade' }),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [index('idx_players_team').on(table.teamId)],
)

export const playersRelations = relations(players, ({ one, many }) => ({
  team: one(teams, { fields: [players.teamId], references: [teams.id] }),
  matchGoals: many(matchGoals),
}))

// ─── Match Goals ──────────────────────────────────────────────────────────────

export const matchGoals = pgTable(
  'match_goals',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    matchId: uuid('match_id')
      .notNull()
      .references(() => matches.id, { onDelete: 'cascade' }),
    playerId: uuid('player_id')
      .notNull()
      .references(() => players.id, { onDelete: 'cascade' }),
    teamId: uuid('team_id')
      .notNull()
      .references(() => teams.id),
    goals: integer('goals').default(1).notNull(),
  },
  (table) => [index('idx_match_goals_match').on(table.matchId)],
)

export const matchGoalsRelations = relations(matchGoals, ({ one }) => ({
  match: one(matches, { fields: [matchGoals.matchId], references: [matches.id] }),
  player: one(players, { fields: [matchGoals.playerId], references: [players.id] }),
  team: one(teams, { fields: [matchGoals.teamId], references: [teams.id] }),
}))

// ─── Advertisers ─────────────────────────────────────────────────────────────

export const advertisers = pgTable(
  'advertisers',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    name: varchar('name', { length: 255 }).notNull(),
    logoUrl: text('logo_url'),
    url: text('url').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [index('idx_advertisers_created').on(table.createdAt)],
)

// ─── Rate Limits ──────────────────────────────────────────────────────────────

export const rateLimits = pgTable('rate_limits', {
  key: varchar('key', { length: 255 }).primaryKey(),
  count: integer('count').notNull().default(1),
  resetAt: timestamp('reset_at', { withTimezone: true }).notNull(),
})

// ─── Photo Albums ─────────────────────────────────────────────────────────────

export const photoAlbums = pgTable(
  'photo_albums',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    title: varchar('title', { length: 255 }).notNull(),
    description: text('description'),
    url: text('url').notNull(),
    coverUrl: text('cover_url'),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [index('idx_albums_created').on(table.createdAt)],
)
