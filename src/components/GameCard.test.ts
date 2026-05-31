import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { createRouter, createWebHistory } from 'vue-router'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import GameCard from './GameCard.vue'
import type { Game } from '@/types/game'

const mockGame: Game = {
  id: '2048',
  name: '2048',
  category: '益智',
  description: '经典数字合成游戏',
  icon: '/assets/games/2048.png',
  route: '/game/2048',
  routeName: 'game.2048.home',
}

const mockGameWithoutIcon: Game = {
  id: 'test',
  name: '测试游戏',
  category: '休闲',
  description: '测试无图标游戏',
  icon: '',
  route: '/game/test',
  routeName: 'game.test.home',
}

describe('GameCard', () => {
  const router = createRouter({
    history: createWebHistory(),
    routes: [
      { path: '/', component: { template: '<div />' } },
      { path: '/game/2048', name: 'game.2048.home', component: { template: '<div />' } },
      { path: '/game/test', name: 'game.test.home', component: { template: '<div />' } },
    ],
  })

  beforeEach(() => {
    setActivePinia(createPinia())
    router.push('/')
  })

  it('应渲染游戏名称', () => {
    const wrapper = mount(GameCard, {
      global: { plugins: [router, createPinia()] },
      props: { game: mockGame },
    })
    expect(wrapper.text()).toContain('2048')
  })

  it('应渲染游戏分类', () => {
    const wrapper = mount(GameCard, {
      global: { plugins: [router, createPinia()] },
      props: { game: mockGame },
    })
    expect(wrapper.text()).toContain('益智')
  })

  it('点击卡片应导航到游戏页面', async () => {
    const pushSpy = vi.spyOn(router, 'push')
    const wrapper = mount(GameCard, {
      global: { plugins: [router, createPinia()] },
      props: { game: mockGame },
    })
    await wrapper.find('.game-card').trigger('click')
    expect(pushSpy).toHaveBeenCalledWith({ name: 'game.2048.home' })
  })

  it('有图标时应显示图片', () => {
    const wrapper = mount(GameCard, {
      global: { plugins: [router, createPinia()] },
      props: { game: mockGame },
    })
    expect(wrapper.find('.icon-img').exists()).toBe(true)
    expect(wrapper.find('.icon-img').attributes('src')).toBe('/assets/games/2048.png')
    expect(wrapper.find('.icon-fallback').exists()).toBe(false)
  })

  it('无图标时应显示文字缩写', () => {
    const wrapper = mount(GameCard, {
      global: { plugins: [router, createPinia()] },
      props: { game: mockGameWithoutIcon },
    })
    expect(wrapper.find('.icon-img').exists()).toBe(false)
    expect(wrapper.find('.icon-fallback').exists()).toBe(true)
    expect(wrapper.find('.icon-fallback').text()).toBe('测')
  })
})
