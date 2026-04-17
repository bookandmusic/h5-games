export interface Game {
  id: string
  name: string
  category: string
  description: string
  icon: string
  route: string
}

export interface GameState {
  games: Game[]
  categories: string[]
  searchQuery: string
  selectedCategory: string | null
}
