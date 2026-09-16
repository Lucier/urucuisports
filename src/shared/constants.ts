export const APP_NAME = 'Urucui Sportes'
export const APP_DESCRIPTION = 'Sistema de Gestão de Projetos'

export const PAGINATION = {
  DEFAULT_PAGE: 1,
  DEFAULT_PAGE_SIZE: 10,
  MAX_PAGE_SIZE: 100,
} as const

export const SPORT_TYPES = [
  { value: 'futebol', label: 'Futebol' },
  { value: 'atletismo', label: 'Atletismo' },
  { value: 'volei', label: 'Vôlei' },
  { value: 'jiu_jitsu', label: 'Jiu-jitsu' },
  { value: 'ciclismo', label: 'Ciclismo' },
  { value: 'beach_tenis', label: 'Beach tênis' },
  { value: 'capoeira', label: 'Capoeira' },
  { value: 'futsal', label: 'Futsal' },
] as const

export type SportType = (typeof SPORT_TYPES)[number]['value']
