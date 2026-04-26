const backgroundModules = import.meta.glob('./assets/imgs/backgrounds/*.png', {
  eager: true,
  import: 'default',
}) as Record<string, string>

const skinModules = import.meta.glob('./assets/imgs/skins/*.png', {
  eager: true,
  import: 'default',
}) as Record<string, string>

const uiModules = import.meta.glob('./assets/imgs/ui/*.png', {
  eager: true,
  import: 'default',
}) as Record<string, string>

const navModules = import.meta.glob('./assets/imgs/nav/*.png', {
  eager: true,
  import: 'default',
}) as Record<string, string>

const subnavModules = import.meta.glob('./assets/imgs/subnav/*.{png,svg}', {
  eager: true,
  import: 'default',
}) as Record<string, string>

const eventModules = import.meta.glob('./assets/imgs/events/*.png', {
  eager: true,
  import: 'default',
}) as Record<string, string>

const minigameModules = import.meta.glob('./assets/imgs/minigames/**/*.png', {
  eager: true,
  import: 'default',
}) as Record<string, string>

const normalize = (modules: Record<string, string>) =>
  Object.fromEntries(
    Object.entries(modules).map(([path, href]) => [
      path
        .split('/')
        .pop()
        ?.replace(/\.(png|svg)$/, '') ?? path,
      href,
    ])
  )

export const backgroundAssets = normalize(backgroundModules)
export const skinAssets = normalize(skinModules)
export const uiAssets = normalize(uiModules)
export const navAssets = normalize(navModules)
export const subnavAssets = normalize(subnavModules)
export const eventAssets = normalize(eventModules)
export const minigameAssets = normalize(minigameModules)
