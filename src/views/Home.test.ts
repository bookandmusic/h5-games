import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { createRouter, createWebHistory } from 'vue-router'
import { beforeEach, describe, expect, it } from 'vitest'

import Home from './Home.vue'
import { useGamesStore } from '@/stores/games'

describe('Home', () => {
  const router = createRouter({
    history: createWebHistory(),
    routes: [
      { path: '/', component: Home },
      { path: '/game/:id', component: { template: '<div />' } },
    ],
  })

  beforeEach(() => {
    setActivePinia(createPinia())
    router.push('/')
  })

  it('应渲染标题', () => {
    const wrapper = mount(Home, {
      global: {
        plugins: [router, createPinia()],
      },
    })

    expect(wrapper.find('.ios-header-title').text()).toBe('游戏中心')
  })

  it('应渲染搜索栏', () => {
    const wrapper = mount(Home, {
      global: {
        plugins: [router, createPinia()],
      },
    })

    expect(wrapper.find('.ios-search-bar').exists()).toBe(true)
    expect(wrapper.find('.ios-search-input').exists()).toBe(true)
  })

  it('应渲染分段控制器', () => {
    const wrapper = mount(Home, {
      global: {
        plugins: [router, createPinia()],
      },
    })

    expect(wrapper.find('.ios-segment-control').exists()).toBe(true)
  })

  it('应渲染游戏卡片', () => {
    const wrapper = mount(Home, {
      global: {
        plugins: [router, createPinia()],
      },
    })

    expect(wrapper.find('.ios-game-card').exists()).toBe(true)
  })

  it('应显示游戏数量', () => {
    const pinia = createPinia()
    const wrapper = mount(Home, {
      global: {
        plugins: [router, pinia],
      },
    })

    const store = useGamesStore(pinia)
    const countText = wrapper.find('.ios-section-count').text()

    expect(countText).toContain(store.filteredGames.length.toString())
  })

  it('搜索输入应更新 store', async () => {
    const pinia = createPinia()
    const wrapper = mount(Home, {
      global: {
        plugins: [router, pinia],
      },
    })

    const store = useGamesStore(pinia)
    const input = wrapper.find('.ios-search-input')

    await input.setValue('2048')

    expect(store.searchQuery).toBe('2048')
  })

  it('点击分类分段应筛选游戏', async () => {
    const pinia = createPinia()
    const wrapper = mount(Home, {
      global: {
        plugins: [router, pinia],
      },
    })

    const store = useGamesStore(pinia)

    // 点击第二个分段（第一个分类）
    const segments = wrapper.findAll('.ios-segment')
    if (segments.length > 1) {
      await segments[1].trigger('click')
      expect(store.selectedCategory).not.toBeNull()
    }
  })

  it('无匹配游戏时应显示空状态', async () => {
    const pinia = createPinia()
    const wrapper = mount(Home, {
      global: {
        plugins: [router, pinia],
      },
    })

    const store = useGamesStore(pinia)
    store.setSearchQuery('nonexistent')

    await wrapper.vm.$nextTick()

    expect(wrapper.find('.ios-empty-state').exists()).toBe(true)
    expect(wrapper.find('.ios-empty-title').text()).toBe('没有找到游戏')
  })
})
