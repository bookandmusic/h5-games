import { setActivePinia, createPinia } from 'pinia'
import { beforeEach, describe, expect, it } from 'vitest'

import { useGamesStore } from './games'

describe('Games Store', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  describe('初始状态', () => {
    it('应包含游戏列表', () => {
      const store = useGamesStore()
      expect(store.games.length).toBeGreaterThan(0)
      expect(store.games[0].id).toBe('2048')
    })

    it('搜索查询初始为空', () => {
      const store = useGamesStore()
      expect(store.searchQuery).toBe('')
    })

    it('选中的分类初始为 null', () => {
      const store = useGamesStore()
      expect(store.selectedCategory).toBeNull()
    })
  })

  describe('分类', () => {
    it('应提取所有分类', () => {
      const store = useGamesStore()
      expect(store.categories).toContain('益智')
    })

    it('setCategory 应更新 selectedCategory', () => {
      const store = useGamesStore()
      store.setCategory('益智')
      expect(store.selectedCategory).toBe('益智')
    })

    it('setCategory(null) 应清除分类筛选', () => {
      const store = useGamesStore()
      store.setCategory('益智')
      store.setCategory(null)
      expect(store.selectedCategory).toBeNull()
    })
  })

  describe('搜索', () => {
    it('setSearchQuery 应更新 searchQuery', () => {
      const store = useGamesStore()
      store.setSearchQuery('2048')
      expect(store.searchQuery).toBe('2048')
    })

    it('setSearchQuery("") 应清除搜索', () => {
      const store = useGamesStore()
      store.setSearchQuery('test')
      store.setSearchQuery('')
      expect(store.searchQuery).toBe('')
    })
  })

  describe('filteredGames', () => {
    it('无筛选时应返回所有游戏', () => {
      const store = useGamesStore()
      expect(store.filteredGames.length).toBe(store.games.length)
    })

    it('按分类筛选应返回匹配游戏', () => {
      const store = useGamesStore()
      store.setCategory('益智')
      const filtered = store.filteredGames
      expect(filtered.every((g) => g.category === '益智')).toBe(true)
    })

    it('按名称搜索应返回匹配游戏', () => {
      const store = useGamesStore()
      store.setSearchQuery('2048')
      const filtered = store.filteredGames
      expect(filtered.some((g) => g.name.includes('2048'))).toBe(true)
    })

    it('按描述搜索应返回匹配游戏', () => {
      const store = useGamesStore()
      store.setSearchQuery('数字')
      const filtered = store.filteredGames
      expect(filtered.length).toBeGreaterThan(0)
    })

    it('组合分类和搜索筛选', () => {
      const store = useGamesStore()
      store.setCategory('益智')
      store.setSearchQuery('2048')
      const filtered = store.filteredGames
      expect(filtered.every((g) => g.category === '益智')).toBe(true)
      expect(filtered.some((g) => g.name.includes('2048'))).toBe(true)
    })

    it('无匹配时应返回空数组', () => {
      const store = useGamesStore()
      store.setSearchQuery('nonexistent')
      expect(store.filteredGames.length).toBe(0)
    })
  })

  describe('getGameById', () => {
    it('应返回匹配的游戏', () => {
      const store = useGamesStore()
      const game = store.getGameById('2048')
      expect(game).toBeDefined()
      expect(game?.id).toBe('2048')
    })

    it('不存在的 id 应返回 undefined', () => {
      const store = useGamesStore()
      const game = store.getGameById('nonexistent')
      expect(game).toBeUndefined()
    })
  })
})
