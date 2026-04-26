# Campus Journey 资源提示词

## 风格提示词

以下风格提示词可直接拼接到任意皮肤提示词中，用来测试最终美术方向。

### `style-clean-anime.txt`

中文说明：清爽日系动画风，线条干净，颜色明亮，适合校园成长题材，整体最稳妥。
```text
clean anime game illustration, bright palette, polished line art, soft cel shading, youthful character design, crisp silhouette, light and appealing mobile game style
```

### `style-soft-painterly.txt`

中文说明：柔和厚涂风，画面更温暖细腻，情绪感更强，适合偏剧情和陪伴感的表达。
```text
soft painterly game illustration, gentle brush texture, warm lighting, delicate color transitions, refined character rendering, bright and clean mobile game art style
```

### `style-japanese-rpg.txt`

中文说明：日式 RPG 商业角色风，更像传统二次元游戏立绘，完成度高，适合做主视觉级皮肤。
```text
japanese rpg character illustration, polished commercial game art, elegant costume rendering, clean facial features, soft dramatic lighting, readable silhouette, premium mobile game character style
```

### `style-korean-casual.txt`

中文说明：韩系休闲游戏风，时装感更强，人物更轻盈现代，适合大学和都市打工阶段。
```text
korean casual game character illustration, fresh colors, smooth shading, clean edges, fashionable youthful styling, highly readable mobile game art style
```

### `style-flat-vibrant.txt`

中文说明：高辨识度休闲扁平风，颜色更跳，形体更概括，适合小包体和轻度休闲产品。
```text
stylized vibrant game illustration, simplified shapes, bold color separation, clean rendering, strong readability, casual mobile game character style
```

### `style-semi-real-polished.txt`

中文说明：半写实精修风，质感更强，更成熟，适合后期经营阶段，但要注意不要丢失亲和力。
```text
semi-realistic character illustration, polished rendering, natural facial structure, soft realistic fabric detail, clean commercial game presentation, readable mobile game character art
```

### `style-dreamy-campus.txt`

中文说明：梦幻校园风，空气感和青春感更强，适合强调高中到大学阶段的浪漫成长氛围。
```text
dreamy campus illustration style, airy light, soft pastel colors, gentle highlights, youthful and romantic mood, clean character-focused mobile game art
```

### `style-modern-fashion.txt`

中文说明：现代时装插画风，服装表现力更突出，适合做高阶解锁皮肤或付费外观测试。
```text
modern fashion illustration style, stylish outfit rendering, clean body proportions, refined lighting, polished mobile game character presentation, premium youthful aesthetic
```

### 风格拼接示例
```text
[在这里先粘贴风格提示词]

请基于我上传的角色母版图，生成一张游戏角色立绘。
资源文件名：skin-hs-uniform-basic.png
Use the uploaded master character image as the required reference. Keep the same face shape, hairstyle, body proportions, age progression logic, and standing pose. Only change outfit, styling details, and stage-appropriate mood. Do not redesign the character.
a young east asian high school student, full body, neat school uniform, youthful and bright, clean standing pose, polished mobile game character art, clear silhouette, simple classroom-inspired background, consistent character design, high detail, no extra people, no clutter, 3:4 ratio, full body, centered character, mobile game skin art
negative prompt: multiple people, cropped body, extra limbs, bad hands, distorted face, messy background, dramatic perspective, blurry details, dark scene, action pose, text, watermark, logo, cluttered accessories
```

## 皮肤

### 母版

#### `character-master-base.png`
```text
请生成一张游戏角色母版图。
资源文件名：character-master-base.png
a young east asian high school student, full body, neat school uniform, youthful and bright, neutral and reusable expression, clean standing pose, polished mobile game character art, soft lighting, clear silhouette, detailed clothing, simple minimal background, character-focused composition, high quality illustration, no extra people, no clutter, 3:4 ratio, full body, centered character, mobile game skin art, this image will be used as the master reference for all future skins, keep face shape, hairstyle, body proportions, and standing pose stable and reusable
negative prompt: multiple people, cropped body, extra limbs, bad hands, distorted face, messy background, dramatic perspective, blurry details, dark scene, action pose, text, watermark, logo, cluttered accessories
```

### 高中阶段

#### `skin-hs-uniform-basic.png`
```text
请基于我上传的角色母版图，生成一张游戏角色立绘。
资源文件名：skin-hs-uniform-basic.png
Use the uploaded master character image as the required reference. Keep the same face shape, hairstyle, body proportions, age progression logic, and standing pose. Only change outfit, styling details, and stage-appropriate mood. Do not redesign the character.
a young east asian high school student, full body, neat school uniform, youthful and bright, clean standing pose, polished mobile game character art, clear silhouette, simple classroom-inspired background, consistent character design, high detail, no extra people, no clutter, 3:4 ratio, full body, centered character, mobile game skin art
negative prompt: multiple people, cropped body, extra limbs, bad hands, distorted face, messy background, dramatic perspective, blurry details, dark scene, action pose, text, watermark, logo, cluttered accessories
```

#### `skin-hs-casual-afterclass.png`
```text
请基于我上传的角色母版图，生成一张游戏角色立绘。
资源文件名：skin-hs-casual-afterclass.png
Use the uploaded master character image as the required reference. Keep the same face shape, hairstyle, body proportions, age progression logic, and standing pose. Only change outfit, styling details, and stage-appropriate mood. Do not redesign the character.
a young east asian high school student, full body, casual after-school outfit, relaxed and youthful mood, clean standing pose, polished mobile game character art, simple campus-inspired background, detailed clothing, no extra people, no clutter, 3:4 ratio, full body, centered character, mobile game skin art
negative prompt: multiple people, cropped body, extra limbs, bad hands, distorted face, messy background, dramatic perspective, blurry details, dark scene, action pose, text, watermark, logo, cluttered accessories
```

#### `skin-hs-exam-sprint.png`
```text
请基于我上传的角色母版图，生成一张游戏角色立绘。
资源文件名：skin-hs-exam-sprint.png
Use the uploaded master character image as the required reference. Keep the same face shape, hairstyle, body proportions, age progression logic, and standing pose. Only change outfit, styling details, and stage-appropriate mood. Do not redesign the character.
a young east asian high school student preparing for exams, full body, study-focused outfit, serious but energetic expression, clean standing pose, polished mobile game character art, academic atmosphere, simple background, detailed clothing, no extra people, no clutter, 3:4 ratio, full body, centered character, mobile game skin art
negative prompt: multiple people, cropped body, extra limbs, bad hands, distorted face, messy background, dramatic perspective, blurry details, dark scene, action pose, text, watermark, logo, cluttered accessories
```

#### `skin-hs-honor-award.png`
```text
请基于我上传的角色母版图，生成一张游戏角色立绘。
资源文件名：skin-hs-honor-award.png
Use the uploaded master character image as the required reference. Keep the same face shape, hairstyle, body proportions, age progression logic, and standing pose. Only change outfit, styling details, and stage-appropriate mood. Do not redesign the character.
a young east asian high school honor student, full body, refined school outfit with award-winner feeling, confident and bright expression, clean standing pose, polished mobile game character art, elegant academic background, detailed clothing, no extra people, no clutter, 3:4 ratio, full body, centered character, mobile game skin art
negative prompt: multiple people, cropped body, extra limbs, bad hands, distorted face, messy background, dramatic perspective, blurry details, dark scene, action pose, text, watermark, logo, cluttered accessories
```

### 大学阶段

#### `skin-college-daily.png`
```text
请基于我上传的角色母版图，生成一张游戏角色立绘。
资源文件名：skin-college-daily.png
Use the uploaded master character image as the required reference. Keep the same face shape, hairstyle, body proportions, age progression logic, and standing pose. Only change outfit, styling details, and stage-appropriate mood. Do not redesign the character.
a young east asian college student, full body, modern campus casual outfit, smart and calm, clean standing pose, polished mobile game character art, fresh academic vibe, simple campus-inspired background, detailed clothing, no extra people, no clutter, 3:4 ratio, full body, centered character, mobile game skin art
negative prompt: multiple people, cropped body, extra limbs, bad hands, distorted face, messy background, dramatic perspective, blurry details, dark scene, action pose, text, watermark, logo, cluttered accessories
```

#### `skin-college-library.png`
```text
请基于我上传的角色母版图，生成一张游戏角色立绘。
资源文件名：skin-college-library.png
Use the uploaded master character image as the required reference. Keep the same face shape, hairstyle, body proportions, age progression logic, and standing pose. Only change outfit, styling details, and stage-appropriate mood. Do not redesign the character.
a young east asian college student, full body, library study outfit, calm and focused expression, clean standing pose, polished mobile game character art, quiet academic vibe, simple library-inspired background, detailed clothing, no extra people, no clutter, 3:4 ratio, full body, centered character, mobile game skin art
negative prompt: multiple people, cropped body, extra limbs, bad hands, distorted face, messy background, dramatic perspective, blurry details, dark scene, action pose, text, watermark, logo, cluttered accessories
```

#### `skin-college-lab.png`
```text
请基于我上传的角色母版图，生成一张游戏角色立绘。
资源文件名：skin-college-lab.png
Use the uploaded master character image as the required reference. Keep the same face shape, hairstyle, body proportions, age progression logic, and standing pose. Only change outfit, styling details, and stage-appropriate mood. Do not redesign the character.
a young east asian college student researcher, full body, lab coat over clean academic outfit, focused and intelligent, clean standing pose, polished mobile game character art, simple laboratory-inspired background, high detail, no extra people, no clutter, 3:4 ratio, full body, centered character, mobile game skin art
negative prompt: multiple people, cropped body, extra limbs, bad hands, distorted face, messy background, dramatic perspective, blurry details, dark scene, action pose, text, watermark, logo, cluttered accessories
```

#### `skin-college-club.png`
```text
请基于我上传的角色母版图，生成一张游戏角色立绘。
资源文件名：skin-college-club.png
Use the uploaded master character image as the required reference. Keep the same face shape, hairstyle, body proportions, age progression logic, and standing pose. Only change outfit, styling details, and stage-appropriate mood. Do not redesign the character.
a young east asian college student, full body, stylish club activity outfit, lively but smart expression, clean standing pose, polished mobile game character art, youthful campus club vibe, simple background, detailed clothing, no extra people, no clutter, 3:4 ratio, full body, centered character, mobile game skin art
negative prompt: multiple people, cropped body, extra limbs, bad hands, distorted face, messy background, dramatic perspective, blurry details, dark scene, action pose, text, watermark, logo, cluttered accessories
```

#### `skin-college-competition.png`
```text
请基于我上传的角色母版图，生成一张游戏角色立绘。
资源文件名：skin-college-competition.png
Use the uploaded master character image as the required reference. Keep the same face shape, hairstyle, body proportions, age progression logic, and standing pose. Only change outfit, styling details, and stage-appropriate mood. Do not redesign the character.
a young east asian college competitor, full body, polished presentation outfit with academic competition feel, confident and accomplished expression, clean standing pose, polished mobile game character art, elegant minimal background, detailed clothing, no extra people, no clutter, 3:4 ratio, full body, centered character, mobile game skin art
negative prompt: multiple people, cropped body, extra limbs, bad hands, distorted face, messy background, dramatic perspective, blurry details, dark scene, action pose, text, watermark, logo, cluttered accessories
```

### 打工阶段

#### `skin-work-store-uniform.png`
```text
请基于我上传的角色母版图，生成一张游戏角色立绘。
资源文件名：skin-work-store-uniform.png
Use the uploaded master character image as the required reference. Keep the same face shape, hairstyle, body proportions, age progression logic, and standing pose. Only change outfit, styling details, and stage-appropriate mood. Do not redesign the character.
a young east asian worker, full body, convenience store uniform, practical and energetic, clean standing pose, polished mobile game character art, urban service job vibe, simple background, clear clothing details, no extra people, no clutter, 3:4 ratio, full body, centered character, mobile game skin art
negative prompt: multiple people, cropped body, extra limbs, bad hands, distorted face, messy background, dramatic perspective, blurry details, dark scene, action pose, text, watermark, logo, cluttered accessories
```

#### `skin-work-restaurant.png`
```text
请基于我上传的角色母版图，生成一张游戏角色立绘。
资源文件名：skin-work-restaurant.png
Use the uploaded master character image as the required reference. Keep the same face shape, hairstyle, body proportions, age progression logic, and standing pose. Only change outfit, styling details, and stage-appropriate mood. Do not redesign the character.
a young east asian service worker, full body, restaurant service uniform, busy but professional mood, clean standing pose, polished mobile game character art, simple restaurant-inspired background, clear clothing details, no extra people, no clutter, 3:4 ratio, full body, centered character, mobile game skin art
negative prompt: multiple people, cropped body, extra limbs, bad hands, distorted face, messy background, dramatic perspective, blurry details, dark scene, action pose, text, watermark, logo, cluttered accessories
```

#### `skin-work-delivery.png`
```text
请基于我上传的角色母版图，生成一张游戏角色立绘。
资源文件名：skin-work-delivery.png
Use the uploaded master character image as the required reference. Keep the same face shape, hairstyle, body proportions, age progression logic, and standing pose. Only change outfit, styling details, and stage-appropriate mood. Do not redesign the character.
a young east asian delivery worker, full body, practical delivery outfit, energetic and fast-paced mood, clean standing pose, polished mobile game character art, urban daily work vibe, simple background, detailed clothing, no extra people, no clutter, 3:4 ratio, full body, centered character, mobile game skin art
negative prompt: multiple people, cropped body, extra limbs, bad hands, distorted face, messy background, dramatic perspective, blurry details, dark scene, action pose, text, watermark, logo, cluttered accessories
```

#### `skin-work-apprentice.png`
```text
请基于我上传的角色母版图，生成一张游戏角色立绘。
资源文件名：skin-work-apprentice.png
Use the uploaded master character image as the required reference. Keep the same face shape, hairstyle, body proportions, age progression logic, and standing pose. Only change outfit, styling details, and stage-appropriate mood. Do not redesign the character.
a young east asian apprentice worker, full body, practical trainee outfit, serious and improving mood, clean standing pose, polished mobile game character art, skill-learning vibe, simple background, detailed clothing, no extra people, no clutter, 3:4 ratio, full body, centered character, mobile game skin art
negative prompt: multiple people, cropped body, extra limbs, bad hands, distorted face, messy background, dramatic perspective, blurry details, dark scene, action pose, text, watermark, logo, cluttered accessories
```

#### `skin-work-commuter.png`
```text
请基于我上传的角色母版图，生成一张游戏角色立绘。
资源文件名：skin-work-commuter.png
Use the uploaded master character image as the required reference. Keep the same face shape, hairstyle, body proportions, age progression logic, and standing pose. Only change outfit, styling details, and stage-appropriate mood. Do not redesign the character.
a young east asian urban commuter, full body, neat city work outfit, more mature and capable mood, clean standing pose, polished mobile game character art, modern city vibe, simple background, detailed clothing, no extra people, no clutter, 3:4 ratio, full body, centered character, mobile game skin art
negative prompt: multiple people, cropped body, extra limbs, bad hands, distorted face, messy background, dramatic perspective, blurry details, dark scene, action pose, text, watermark, logo, cluttered accessories
```

### 经营阶段

#### `skin-biz-founder.png`
```text
请基于我上传的角色母版图，生成一张游戏角色立绘。
资源文件名：skin-biz-founder.png
Use the uploaded master character image as the required reference. Keep the same face shape, hairstyle, body proportions, age progression logic, and standing pose. Only change outfit, styling details, and stage-appropriate mood. Do not redesign the character.
a young east asian entrepreneur, full body, modern business casual outfit, confident and mature, clean standing pose, polished mobile game character art, startup founder vibe, simple office-inspired background, detailed clothing, no extra people, no clutter, 3:4 ratio, full body, centered character, mobile game skin art
negative prompt: multiple people, cropped body, extra limbs, bad hands, distorted face, messy background, dramatic perspective, blurry details, dark scene, action pose, text, watermark, logo, cluttered accessories
```

#### `skin-biz-manager.png`
```text
请基于我上传的角色母版图，生成一张游戏角色立绘。
资源文件名：skin-biz-manager.png
Use the uploaded master character image as the required reference. Keep the same face shape, hairstyle, body proportions, age progression logic, and standing pose. Only change outfit, styling details, and stage-appropriate mood. Do not redesign the character.
a young east asian business manager, full body, sharp management outfit, calm and competent expression, clean standing pose, polished mobile game character art, modern office vibe, simple background, detailed clothing, no extra people, no clutter, 3:4 ratio, full body, centered character, mobile game skin art
negative prompt: multiple people, cropped body, extra limbs, bad hands, distorted face, messy background, dramatic perspective, blurry details, dark scene, action pose, text, watermark, logo, cluttered accessories
```

#### `skin-biz-award.png`
```text
请基于我上传的角色母版图，生成一张游戏角色立绘。
资源文件名：skin-biz-award.png
Use the uploaded master character image as the required reference. Keep the same face shape, hairstyle, body proportions, age progression logic, and standing pose. Only change outfit, styling details, and stage-appropriate mood. Do not redesign the character.
a young east asian business achiever, full body, refined award ceremony outfit, confident and successful, clean standing pose, polished mobile game character art, elegant minimal background, high detail, no extra people, no clutter, 3:4 ratio, full body, centered character, mobile game skin art
negative prompt: multiple people, cropped body, extra limbs, bad hands, distorted face, messy background, dramatic perspective, blurry details, dark scene, action pose, text, watermark, logo, cluttered accessories
```

## UI

#### `icon-money.png`
```text
请生成一张游戏 UI 图标。
资源文件名：icon-money.png
mobile game ui icon, clean silhouette, centered object, bright readable colors, soft shading, transparent background, polished casual game style, 1:1 ratio, a single stylized coin pouch icon, gold and warm tones, centered object, transparent background
negative prompt: complex scene, multiple objects, perspective background, text, watermark, logo, blurry edges
```

#### `icon-exp.png`
```text
请生成一张游戏 UI 图标。
资源文件名：icon-exp.png
mobile game ui icon, clean silhouette, centered object, bright readable colors, soft shading, transparent background, polished casual game style, 1:1 ratio, a single stylized star badge icon representing experience points, centered object, blue and gold tones, transparent background
negative prompt: complex scene, multiple objects, perspective background, text, watermark, logo, blurry edges
```

#### `icon-knowledge.png`
```text
请生成一张游戏 UI 图标。
资源文件名：icon-knowledge.png
mobile game ui icon, clean silhouette, centered object, bright readable colors, soft shading, transparent background, polished casual game style, 1:1 ratio, a single stylized open book icon representing knowledge, centered object, academic blue tones, transparent background
negative prompt: complex scene, multiple objects, perspective background, text, watermark, logo, blurry edges
```

#### `icon-reputation.png`
```text
请生成一张游戏 UI 图标。
资源文件名：icon-reputation.png
mobile game ui icon, clean silhouette, centered object, bright readable colors, soft shading, transparent background, polished casual game style, 1:1 ratio, a single stylized medal icon representing reputation, centered object, elegant gold and white tones, transparent background
negative prompt: complex scene, multiple objects, perspective background, text, watermark, logo, blurry edges
```

#### `icon-skill-study.png`
```text
请生成一张游戏 UI 图标。
资源文件名：icon-skill-study.png
mobile game ui icon, clean silhouette, centered object, bright readable colors, soft shading, transparent background, polished casual game style, 1:1 ratio, a single stylized study skill icon, centered object, book and pencil motif, transparent background
negative prompt: complex scene, multiple objects, perspective background, text, watermark, logo, blurry edges
```

#### `icon-skill-focus.png`
```text
请生成一张游戏 UI 图标。
资源文件名：icon-skill-focus.png
mobile game ui icon, clean silhouette, centered object, bright readable colors, soft shading, transparent background, polished casual game style, 1:1 ratio, a single stylized focus skill icon, centered object, target motif, transparent background
negative prompt: complex scene, multiple objects, perspective background, text, watermark, logo, blurry edges
```

#### `icon-skill-action.png`
```text
请生成一张游戏 UI 图标。
资源文件名：icon-skill-action.png
mobile game ui icon, clean silhouette, centered object, bright readable colors, soft shading, transparent background, polished casual game style, 1:1 ratio, a single stylized action skill icon, centered object, lightning or motion motif, transparent background
negative prompt: complex scene, multiple objects, perspective background, text, watermark, logo, blurry edges
```

#### `icon-skill-social.png`
```text
请生成一张游戏 UI 图标。
资源文件名：icon-skill-social.png
mobile game ui icon, clean silhouette, centered object, bright readable colors, soft shading, transparent background, polished casual game style, 1:1 ratio, a single stylized social skill icon, centered object, chat bubble or handshake motif, transparent background
negative prompt: complex scene, multiple objects, perspective background, text, watermark, logo, blurry edges
```

#### `icon-skill-business.png`
```text
请生成一张游戏 UI 图标。
资源文件名：icon-skill-business.png
mobile game ui icon, clean silhouette, centered object, bright readable colors, soft shading, transparent background, polished casual game style, 1:1 ratio, a single stylized business skill icon, centered object, briefcase or chart motif, transparent background
negative prompt: complex scene, multiple objects, perspective background, text, watermark, logo, blurry edges
```

#### `icon-exam.png`
```text
请生成一张游戏 UI 图标。
资源文件名：icon-exam.png
mobile game ui icon, clean silhouette, centered object, bright readable colors, soft shading, transparent background, polished casual game style, 1:1 ratio, a single stylized exam icon, centered object, test paper and pencil motif, transparent background
negative prompt: complex scene, multiple objects, perspective background, text, watermark, logo, blurry edges
```

#### `icon-sprint.png`
```text
请生成一张游戏 UI 图标。
资源文件名：icon-sprint.png
mobile game ui icon, clean silhouette, centered object, bright readable colors, soft shading, transparent background, polished casual game style, 1:1 ratio, a single stylized sprint icon, centered object, speed motif, transparent background
negative prompt: complex scene, multiple objects, perspective background, text, watermark, logo, blurry edges
```

#### `icon-minigame-exam-rush.png`
```text
请生成一张游戏 UI 图标。
资源文件名：icon-minigame-exam-rush.png
mobile game ui icon, clean silhouette, centered object, bright readable colors, soft shading, transparent background, polished casual game style, 1:1 ratio, a single stylized minigame icon for exam rush, centered object, notebook and check mark motif, transparent background
negative prompt: complex scene, multiple objects, perspective background, text, watermark, logo, blurry edges
```

#### `icon-minigame-work-rush.png`
```text
请生成一张游戏 UI 图标。
资源文件名：icon-minigame-work-rush.png
mobile game ui icon, clean silhouette, centered object, bright readable colors, soft shading, transparent background, polished casual game style, 1:1 ratio, a single stylized minigame icon for work rush, centered object, tray or delivery box motif, transparent background
negative prompt: complex scene, multiple objects, perspective background, text, watermark, logo, blurry edges
```

#### `icon-minigame-business-rush.png`
```text
请生成一张游戏 UI 图标。
资源文件名：icon-minigame-business-rush.png
mobile game ui icon, clean silhouette, centered object, bright readable colors, soft shading, transparent background, polished casual game style, 1:1 ratio, a single stylized minigame icon for business rush, centered object, laptop or coin motif, transparent background
negative prompt: complex scene, multiple objects, perspective background, text, watermark, logo, blurry edges
```

#### `mg-exam-book.png`
```text
请生成一张游戏物件图标。
资源文件名：mg-exam-book.png
mobile game item icon, simple and readable, centered object, slightly playful style, bright colors, transparent background, polished mobile game asset, 1:1 ratio, a stylized study book icon, centered object, transparent background
negative prompt: complex scene, multiple objects, perspective background, text, watermark, logo, blurry edges
```

#### `mg-exam-pencil.png`
```text
请生成一张游戏物件图标。
资源文件名：mg-exam-pencil.png
mobile game item icon, simple and readable, centered object, slightly playful style, bright colors, transparent background, polished mobile game asset, 1:1 ratio, a stylized pencil icon, centered object, transparent background
negative prompt: complex scene, multiple objects, perspective background, text, watermark, logo, blurry edges
```

#### `mg-exam-notes.png`
```text
请生成一张游戏物件图标。
资源文件名：mg-exam-notes.png
mobile game item icon, simple and readable, centered object, slightly playful style, bright colors, transparent background, polished mobile game asset, 1:1 ratio, a stylized study notes icon, centered object, transparent background
negative prompt: complex scene, multiple objects, perspective background, text, watermark, logo, blurry edges
```

#### `mg-exam-paper.png`
```text
请生成一张游戏物件图标。
资源文件名：mg-exam-paper.png
mobile game item icon, simple and readable, centered object, slightly playful style, bright colors, transparent background, polished mobile game asset, 1:1 ratio, a stylized exam paper icon, centered object, transparent background
negative prompt: complex scene, multiple objects, perspective background, text, watermark, logo, blurry edges
```

#### `mg-exam-correct.png`
```text
请生成一张游戏物件图标。
资源文件名：mg-exam-correct.png
mobile game item icon, simple and readable, centered object, slightly playful style, bright colors, transparent background, polished mobile game asset, 1:1 ratio, a stylized correct answer check mark icon, centered object, transparent background
negative prompt: complex scene, multiple objects, perspective background, text, watermark, logo, blurry edges
```

#### `mg-work-tray.png`
```text
请生成一张游戏物件图标。
资源文件名：mg-work-tray.png
mobile game item icon, simple and readable, centered object, slightly playful style, bright colors, transparent background, polished mobile game asset, 1:1 ratio, a stylized food tray icon, centered object, transparent background
negative prompt: complex scene, multiple objects, perspective background, text, watermark, logo, blurry edges
```

#### `mg-work-box.png`
```text
请生成一张游戏物件图标。
资源文件名：mg-work-box.png
mobile game item icon, simple and readable, centered object, slightly playful style, bright colors, transparent background, polished mobile game asset, 1:1 ratio, a stylized delivery box icon, centered object, transparent background
negative prompt: complex scene, multiple objects, perspective background, text, watermark, logo, blurry edges
```

#### `mg-work-cashier.png`
```text
请生成一张游戏物件图标。
资源文件名：mg-work-cashier.png
mobile game item icon, simple and readable, centered object, slightly playful style, bright colors, transparent background, polished mobile game asset, 1:1 ratio, a stylized cash register icon, centered object, transparent background
negative prompt: complex scene, multiple objects, perspective background, text, watermark, logo, blurry edges
```

#### `mg-work-ticket.png`
```text
请生成一张游戏物件图标。
资源文件名：mg-work-ticket.png
mobile game item icon, simple and readable, centered object, slightly playful style, bright colors, transparent background, polished mobile game asset, 1:1 ratio, a stylized order ticket icon, centered object, transparent background
negative prompt: complex scene, multiple objects, perspective background, text, watermark, logo, blurry edges
```

#### `mg-work-paybag.png`
```text
请生成一张游戏物件图标。
资源文件名：mg-work-paybag.png
mobile game item icon, simple and readable, centered object, slightly playful style, bright colors, transparent background, polished mobile game asset, 1:1 ratio, a stylized pay bag icon, centered object, transparent background
negative prompt: complex scene, multiple objects, perspective background, text, watermark, logo, blurry edges
```

#### `mg-biz-laptop.png`
```text
请生成一张游戏物件图标。
资源文件名：mg-biz-laptop.png
mobile game item icon, simple and readable, centered object, slightly playful style, bright colors, transparent background, polished mobile game asset, 1:1 ratio, a stylized laptop icon, centered object, transparent background
negative prompt: complex scene, multiple objects, perspective background, text, watermark, logo, blurry edges
```

#### `mg-biz-folder.png`
```text
请生成一张游戏物件图标。
资源文件名：mg-biz-folder.png
mobile game item icon, simple and readable, centered object, slightly playful style, bright colors, transparent background, polished mobile game asset, 1:1 ratio, a stylized folder icon, centered object, transparent background
negative prompt: complex scene, multiple objects, perspective background, text, watermark, logo, blurry edges
```

#### `mg-biz-contract.png`
```text
请生成一张游戏物件图标。
资源文件名：mg-biz-contract.png
mobile game item icon, simple and readable, centered object, slightly playful style, bright colors, transparent background, polished mobile game asset, 1:1 ratio, a stylized contract document icon, centered object, transparent background
negative prompt: complex scene, multiple objects, perspective background, text, watermark, logo, blurry edges
```

#### `mg-biz-client.png`
```text
请生成一张游戏物件图标。
资源文件名：mg-biz-client.png
mobile game item icon, simple and readable, centered object, slightly playful style, bright colors, transparent background, polished mobile game asset, 1:1 ratio, a stylized client avatar badge icon, centered object, transparent background
negative prompt: complex scene, multiple objects, perspective background, text, watermark, logo, blurry edges
```

#### `mg-biz-coin.png`
```text
请生成一张游戏物件图标。
资源文件名：mg-biz-coin.png
mobile game item icon, simple and readable, centered object, slightly playful style, bright colors, transparent background, polished mobile game asset, 1:1 ratio, a stylized gold coin icon, centered object, transparent background
negative prompt: complex scene, multiple objects, perspective background, text, watermark, logo, blurry edges
```
