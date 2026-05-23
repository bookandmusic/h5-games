import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import GameContainer from './GameContainer.vue'

describe('GameContainer', () => {
  it('渲染游戏容器和内容插槽', () => {
    const wrapper = mount(GameContainer, {
      slots: { default: '<div class="test-content">hello</div>' },
    })
    expect(wrapper.find('.game-container').exists()).toBe(true)
    expect(wrapper.find('.game-inner').exists()).toBe(true)
    expect(wrapper.find('.test-content').text()).toBe('hello')
  })

  it('默认竖屏 3/4，不含 landscape 类', () => {
    const wrapper = mount(GameContainer, {
      slots: { default: '<div>content</div>' },
    })
    expect(wrapper.find('.game-container').classes()).not.toContain('game-container--landscape')
  })

  it('不存在 portrait 属性，传入 portrait=false 不产生 landscape 类', () => {
    const wrapper = mount(GameContainer, {
      props: { portrait: false },
      slots: { default: '<div>content</div>' },
    })
    expect(wrapper.find('.game-container').classes()).not.toContain('game-container--landscape')
  })

  it('支持 bgImage 渲染背景图片', () => {
    const wrapper = mount(GameContainer, {
      props: { bgImage: '/test-bg.png' },
      slots: { default: '<div>content</div>' },
    })
    const bg = wrapper.find('.game-bg')
    expect(bg.attributes('style')).toContain('/test-bg.png')
  })
})
