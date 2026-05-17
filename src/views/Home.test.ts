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

  it('应渲染游戏卡片', () => {
    const wrapper = mount(Home, {
      global: { plugins: [router, createPinia()] },
    })
    expect(wrapper.find('.game-card').exists()).toBe(true)
  })

  it('搜索按钮点击应切换到搜索模式', async () => {
    const wrapper = mount(Home, {
      global: { plugins: [router, createPinia()] },
    })
    const btns = wrapper.findAll('.curtain-btn')
    await btns[btns.length - 1].trigger('click')
    expect(wrapper.find('.search-box').exists()).toBe(true)
    expect(wrapper.find('.search-input').exists()).toBe(true)
  })

  it('搜索输入应更新 store', async () => {
    const wrapper = mount(Home, {
      global: { plugins: [router, createPinia()] },
    })

    const store = useGamesStore()
    const btns = wrapper.findAll('.curtain-btn')
    await btns[btns.length - 1].trigger('click')
    const input = wrapper.find('.search-input')
    await input.setValue('2048')
    expect(store.searchQuery).toBe('2048')
  })

  it('无匹配游戏时应显示空状态', async () => {
    const pinia = createPinia()
    const wrapper = mount(Home, {
      global: { plugins: [router, pinia] },
    })

    const store = useGamesStore(pinia)
    const btns = wrapper.findAll('.curtain-btn')
    await btns[btns.length - 1].trigger('click')
    store.setSearchQuery('nonexistent')

    await wrapper.vm.$nextTick()

    expect(wrapper.find('.empty').exists()).toBe(true)
    expect(wrapper.find('.empty-title').text()).toBe('没有找到游戏')
  })
})
