export interface Game {
  id: string
  name: string
  category: string
  description: string
  icon: string
  route: string
  routeName: string
  dir?: string
  recordType?: 'score' | 'level' | 'time' | 'casual' | 'none'
}
