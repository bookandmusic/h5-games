import { computed, ref } from 'vue'
import { defineStore } from 'pinia'

import gamesData from '../data/games.json'
import type { Game } from '../types/game'

export const useGamesStore = defineStore('games', () => {
  const games = ref<Game[]>(gamesData as Game[])
  const searchQuery = ref('')
  const selectedCategory = ref<string | null>(null)

  const categories = computed(() => {
    const cats = games.value.map((g) => g.category)
    return [...new Set(cats)]
  })

  const filteredGames = computed(() => {
    let result = games.value

    if (selectedCategory.value) {
      result = result.filter((g) => g.category === selectedCategory.value)
    }

    if (searchQuery.value) {
      const query = searchQuery.value.toLowerCase()
      result = result.filter(
        (g) => g.name.toLowerCase().includes(query) || g.description.toLowerCase().includes(query)
      )
    }

    return result
  })

  const setCategory = (category: string | null) => {
    selectedCategory.value = category
  }

  const setSearchQuery = (query: string) => {
    searchQuery.value = query
  }

  const getGameById = (id: string): Game | undefined => {
    return games.value.find((g) => g.id === id)
  }

  return {
    games,
    searchQuery,
    selectedCategory,
    categories,
    filteredGames,
    setCategory,
    setSearchQuery,
    getGameById,
  }
})
