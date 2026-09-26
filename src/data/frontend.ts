import type { Track } from '../types';

export const frontendTrack: Track = {
  id: 'frontend',
  name: '前端开发',
  icon: '🎨',
  tagline: '从 HTML/CSS 到框架原理与工程化的完整面试图谱',
  description: '覆盖前端面试从语言基础、框架原理、浏览器与安全，到工程化、性能与手写代码的高频考点。',
  color: 'blue',
  topics: [
    {
      id: 'fe-html-css',
      name: 'HTML 与 CSS',
      description: '考察布局与渲染的硬功底：盒模型、BFC、层叠上下文、flex/grid 与移动端适配，是前端面试的第一道门槛。',
      references: [
        { label: 'MDN CSS 文档', url: 'https://developer.mozilla.org/en-US/docs/Web/CSS' },
        { label: 'web.dev Learn CSS 课程', url: 'https://web.dev/learn/css' },
        { label: 'Can I use 兼容性查询', url: 'https://caniuse.com' },
        { label: 'CSS Working Group 规范草案', url: 'https://drafts.csswg.org' },
      ],
      questions: [
        {
          id: 'fe-html-semantic',
          title: '什么是语义化标签？语义化有哪些实际价值？',
          difficulty: 'basic',
          tags: ['HTML', '语义化'],
          points: [
            '语义化指用**表达内容含义**的标签组织页面：`header`/`nav`/`main`/`article`/`section`/`aside`/`footer`，而不是全部用 `div`/`span` 堆砌。',
            '**可访问性（a11y）**：屏幕阅读器依靠 landmark 地标角色快速导航，语义化是视障用户"听懂"页面的前提。',
            '**SEO**：搜索引擎通过标题层级（h1-h6）和语义标签理解页面结构与内容权重。',
            '**可维护性**：结构自带含义，代码可读性更高，团队协作与样式覆盖成本更低。',
            '无障碍还有硬性收益：部分企业与海外合规要求（如 WCAG）对可访问性等级有明确验收标准。',
          ],
        },
        {
          id: 'fe-css-box-model',
          title: '说说 CSS 盒模型，box-sizing 有什么作用？',
          difficulty: 'basic',
          tags: ['CSS', '盒模型'],
          points: [
            '盒模型 = **content + padding + border + margin**，分两种计算方式：`content-box`（标准盒模型，width 只含内容）与 `border-box`（IE 盒模型，width 含 content+padding+border）。',
            '默认值是 `content-box`：设置 `width: 100px; padding: 10px` 后实际占宽 120px，这是布局"超宽"的最常见原因。',
            '实际项目普遍全局设置 `* { box-sizing: border-box }`，让宽高所见即所得。',
            '`margin` 不计入元素自身大小，但参与**外边距合并**：相邻块级元素垂直 margin 取较大值，父子元素相邻边缘也会合并。',
            '行内非替换元素的 width/height/垂直 margin 不生效（img、button 等替换元素除外）。',
          ],
          followUps: [
            {
              question: '如何阻止相邻元素的 margin 合并？',
              points: [
                '让相关元素形成 **BFC**：父元素 `display: flow-root`（现代首选）或 `overflow: hidden`；相邻元素之间插入 padding/border 也能隔开。',
                '**flex/grid 容器的子项之间不会合并**：把并排元素改到 flex/grid 格式化上下文即可。',
                '父子相邻边缘合并：给父元素加 padding-top/border-top 隔开接触边，或让父元素形成 BFC，阻止子元素 margin "穿透"到父级之外。',
              ],
            },
            {
              question: 'padding 的百分比是相对什么计算的？有什么实际应用？',
              points: [
                '相对**包含块的宽度**计算，padding-top/padding-bottom 也是——规范刻意如此，避免宽高互相依赖的循环。',
                '经典应用：`padding-top: 56.25%` 做 16:9 的**固定宽高比占位**，防止图片/视频加载时布局偏移（CLS）；现代可直接用 `aspect-ratio`。',
              ],
            },
          ],
        },
        {
          id: 'fe-css-specificity',
          title: 'CSS 选择器优先级是如何计算的？',
          difficulty: 'basic',
          tags: ['CSS', '选择器'],
          points: [
            '优先级按 **(内联, ID, 类/属性/伪类, 元素/伪元素)** 四元组从高到逐位比较，如 `#nav .item` 是 (0,1,1,0)。',
            '同优先级按**出现顺序**后者覆盖前者；`!important` 跳过优先级比较，内联加 important 又高于普通 important。',
            '伪类（`:hover` 等）计入类位置；**伪元素**（`::before` 等）计入元素位置；`:not()` 本身不计入，括号内的选择器计入。',
            '通配符 `*`、组合符（`>`、`+`、`~`）与继承样式优先级为 0，继承样式永远低于任何直接命中的规则。',
            '实践建议：保持选择器扁平、避免用 `!important` 救火；CSS Modules/原子化 CSS 正是为了规避优先级失控。',
          ],
          followUps: [
            {
              question: ':is() 和 :where() 有什么区别？@layer 如何改变优先级游戏规则？',
              points: [
                '`:is()` 的优先级按括号内**最高**的选择器计入；`:where()` 优先级恒为 0——适合写"可被轻松覆盖"的默认样式。',
                '**@layer（级联层）**是比较顺序更靠前的维度：层间按声明顺序比较、**后声明的层胜出**，层内再比选择器；分层样式整体低于未分层样式（important 方向反转）。',
                '工程意义：组件库与重置样式放进低优先级层，业务样式无需堆 `!important` 即可覆盖——官方给出的优先级失控解法。',
              ],
            },
          ],
        },
        {
          id: 'fe-css-centering',
          title: '实现水平垂直居中有哪些方案？',
          difficulty: 'basic',
          tags: ['CSS', '布局', '居中'],
          points: [
            '首选 **Flex**：父元素 `display: flex; justify-content: center; align-items: center`，元素尺寸未知也能居中。',
            '**Grid** 一行搞定：`display: grid; place-items: center`，现代浏览器下最简洁。',
            '**绝对定位 + transform**：`position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%)`，不依赖元素尺寸，适合弹窗。',
            '绝对定位 + 四边为 0 + `margin: auto`（配固定宽高）也是经典方案。',
            '文本类内容：单行垂直居中用 `line-height` 等于容器高度，水平用 `text-align: center`。',
          ],
          followUps: [
            {
              question: 'transform 居中方案会创建层叠上下文吗？会影响子元素的 fixed 定位吗？',
              points: [
                '会：`transform` 非 none 的元素**创建新的层叠上下文，同时成为 fixed 子元素的包含块**——子元素 `position: fixed` 改为相对该元素而非视口定位。',
                '规避：弹窗遮罩与内容分层，transform 只放在不需要 fixed 子元素的层上；或直接改用 flex/grid 居中。',
                '同类"包含块劫持"还有 `filter`、`perspective`、`will-change: transform`、`contain: paint`——排查 fixed 失效时优先检查祖先链。',
              ],
            },
            {
              question: 'flex 容器里子元素 margin: auto 的行为是什么？',
              points: [
                '`margin: auto` 会**吸收主轴与交叉轴上的剩余空间**，优先级高于 justify-content/align-items——存在 auto margin 时对齐属性形同失效。',
                '惯用法：`margin-left: auto` 把元素**推到行尾**（导航右侧按钮），是"推挤布局"的标准解法。',
                '没有剩余空间时 auto margin 解析为 0，不会产生负间距，是安全的布局手段。',
              ],
            },
          ],
        },
        {
          id: 'fe-css-hidden',
          title: 'display: none、visibility: hidden、opacity: 0 有什么区别？',
          difficulty: 'basic',
          tags: ['CSS', '渲染'],
          points: [
            '**display: none**：脱离文档流不占空间，触发**重排 + 重绘**；不可交互；子元素无法单独显示；不参与 transition 过渡。',
            '**visibility: hidden**：仍占空间，只触发重绘；不可交互；子元素可设 `visibility: visible` 单独显示；参与 transition，适合做淡出。',
            '**opacity: 0**：占空间、仍可**响应点击等事件**，常配合 transition 做淡入淡出；注意其内容对屏幕阅读器仍然可见，不要用它隐藏敏感信息。',
            '`hidden` HTML 属性等价于 display:none，但若元素样式里显式设置了 display 值会覆盖它，是经典坑。',
            '性能视角：频繁切换显示隐藏时，visibility/opacity 的开销低于 display（不走重排）。',
          ],
          followUps: [
            {
              question: '为什么 display: none 无法参与 transition？如何实现"过渡完成后再移除"？',
              points: [
                'transition 依赖属性**可插值**：display 是离散属性，none 与 block 之间没有中间值，元素离开渲染树后浏览器也不会保留过渡。',
                '惯用方案：淡出用 visibility + opacity（visibility 是可插值的离散属性），监听 `transitionend` 后再设 display: none。',
                '新特性：`transition-behavior: allow-discrete` 让 display 参与过渡，`@starting-style` 处理入场首帧，现代浏览器可用。',
              ],
            },
          ],
        },
        {
          id: 'fe-css-bfc',
          title: '什么是 BFC？如何触发？有哪些应用场景？',
          difficulty: 'basic',
          tags: ['CSS', 'BFC', '布局'],
          points: [
            '**BFC（块级格式化上下文）**是一块独立渲染区域：内部布局不影响外部，外部也不影响它。',
            '触发条件：根元素、`float` 非 none、`position: absolute/fixed`、`display: flow-root/inline-block/table-cell/flex/grid`、`overflow` 非 visible 等。',
            '核心规则：同一 BFC 内相邻块级元素的垂直 **margin 会合并**；BFC 区域不与浮动元素重叠；计算 BFC 高度时**浮动子元素也参与**。',
            '应用一：**清除浮动**——父元素 `display: flow-root`（现代首选）或 `overflow: hidden` 包住浮动子元素。',
            '应用二：**阻止 margin 合并**——给相邻或嵌套元素包一层 BFC；应用三：**自适应两栏布局**——BFC 不与浮动重叠，天然避让。',
          ],
          followUps: [
            {
              question: 'display: flow-root 和 overflow: hidden 清浮动有什么区别？',
              points: [
                '`overflow: hidden` 只是"顺带"形成 BFC，副作用是**裁剪溢出内容**（下拉菜单、阴影被切），还可能意外出现滚动条。',
                '`display: flow-root` 是**专门用来创建 BFC 的无副作用方案**，语义清晰，现代浏览器已全面支持。',
                '老项目兼容兜底：`::after { content: ""; display: block; clear: both; }` 的 clearfix 伪元素方案。',
              ],
            },
            {
              question: 'flex 子项之间的 margin 会合并吗？float 元素之间呢？',
              points: [
                '**都不会**：margin 合并只发生在**同一 BFC 内的块级盒子**之间；flex/grid 格式化上下文与 float 之间均不合并。',
                '因此 flex 布局可放心用 margin 做间距（或直接 `gap`），普通文档流里相邻块级 margin 才取较大值。',
                '排查"同一份样式改成 flex 后间距变了"，先确认格式化上下文类型。',
              ],
            },
          ],
        },
        {
          id: 'fe-css-flex',
          title: 'Flex 布局的核心概念和常用属性有哪些？',
          difficulty: 'basic',
          tags: ['CSS', 'Flex', '布局'],
          points: [
            '两根轴：**主轴**方向由 `flex-direction` 决定（row/column），交叉轴与之垂直；`justify-content` 沿主轴分配，`align-items` 沿交叉轴对齐。',
            '`flex` 是 `flex-grow`（分剩余空间）、`flex-shrink`（超宽收缩）、`flex-basis`（基准尺寸）的缩写；**`flex: 1` 等价 `1 1 0%`**，与 `flex: auto`（1 1 auto）的区别是前者完全按比例分、不看内容尺寸。',
            '经典"等分且不溢出"写法：`flex: 1; min-width: 0`——flex 子项默认 `min-width: auto` 会被内容撑破，是高频坑。',
            '`align-self` 覆盖单个子项的交叉轴对齐；换行布局用 `flex-wrap: wrap` + `align-content` 控制多行分布。',
            '`gap` 直接控制子项间距，比 margin 方案干净（不会产生首尾多余的间距）。',
          ],
          followUps: [
            {
              question: 'flex: 1 和 flex: auto 在子项内容长度差异大时表现有何不同？',
              points: [
                '`flex: 1`（1 1 0%）：basis 为 0，**空间完全按 grow 比例分配**，内容长短不影响最终宽度——适合等分栏。',
                '`flex: auto`（1 1 auto）：basis 是内容的 max-content，**内容长的子项分得更多**，剩余空间在此之上再按 grow 分配。',
                '选型：侧边栏 + 自适应内容区用 `flex: 1` + `min-width: 0`；工具栏"按内容占比分配"用 `flex: auto`。',
              ],
            },
            {
              question: '为什么 flex 子项设置 text-overflow: ellipsis 不生效？',
              points: [
                'flex 子项默认 `min-width: auto`：**最小尺寸被内容撑开**，子项拒绝收缩到内容宽度以下，没有溢出，ellipsis 自然无从生效。',
                '修复：给该子项加 `min-width: 0`（纵向对应 `min-height: 0`）允许收缩，且元素本身需 `overflow: hidden`。',
                '多层 flex 嵌套时**每一层子项都要 min-width: 0**，漏一层照样不生效——高频踩坑点。',
              ],
            },
          ],
        },
        {
          id: 'fe-css-margin-collapse',
          title: '外边距合并（margin 塌陷）是怎么回事？怎么解决？',
          difficulty: 'basic',
          tags: ['CSS', 'margin', 'BFC'],
          points: [
            '两种典型场景：① **相邻兄弟元素**的上下 margin 取较大值而不是相加（上 20px + 下 30px = 30px）；② **父子元素**：父元素没有 border/padding/内容隔开时，子元素的 margin-top 会"穿透"到父元素外面，表现为父元素整体被推下去（经典"margin-top 不生效"）。',
            '根本原因：**垂直方向上处于同一 BFC 的普通流块级盒**，相邻 margin 会折叠成一个（取正值的最大值；有负 margin 时正负相加）。**只有垂直方向折叠，水平 margin 永不折叠**——这也是面试常问的分界线。',
            '**父子塌陷的解法**（任选其一，触发条件是"隔开或新建 BFC"）：父元素加 `overflow: hidden`（新建 BFC）、加 padding-top/border-top 隔开、子元素改用 padding 替代 margin、父元素改用 Flex/Grid 布局（**Flex/Grid 容器内子项 margin 不折叠**，现代项目最省心的答案）。',
            '相邻兄弟的解法：统一 margin 规范（只定义 margin-bottom 或只定义 margin-top）、用 gap（Flex/Grid 的 gap 就是为此而生）、或包一层触发 BFC 的容器。',
          ],
          followUps: [
            {
              question: 'BFC 是什么？除了解决 margin 塌陷还有哪些应用？',
              points: [
                '**BFC（块级格式化上下文）**是一块独立的渲染区域，内部布局不影响外部。触发方式：根元素、`overflow: hidden/auto/scroll`（非 visible）、`float` 非 none、`position: absolute/fixed`、`display: flow-root`（**专门为创建 BFC 发明的无副作用写法，首选**）、Flex/Grid 容器。',
                '四大应用：① 包含内部 margin 塌陷；② **清除浮动**（BFC 容器能包住浮动的子元素，高度不塌陷）；③ **两栏自适应布局**（侧栏浮动 + 主栏 BFC，不与浮动重叠）；④ 隔离 margin 折叠。`display: flow-root` 没有overflow 裁剪的副作用，是现代答案的加分点。',
              ],
            },
          ],
        },
        {
          id: 'fe-css-modern',
          title: '说说近年前端值得用的新 CSS 能力：View Transitions、容器查询、:has() 怎么用？',
          difficulty: 'intermediate',
          tags: ['现代 CSS', 'View Transitions', '容器查询'],
          points: [
            '**容器查询（@container）**：媒体查询问"**视口**多宽"，容器查询问"**父容器**多宽"——同一张卡片在侧边栏窄容器、主栏宽容器里**按自己的空间自适应**，组件真正封装了响应式（不用父组件告诉它上下文）；用法：父元素 `container-type: inline-size` + 子元素 `@container (min-width: 400px)`——设计系统的卡片/小部件是最大受益者。',
            '**View Transitions API（页面动效的新范式）**：`document.startViewTransition(callback)` ——浏览器自动**截取新旧状态快照**做过渡动画（默认 cross-fade），可用 `::view-transition-old/new` 伪元素自定义；**同文档版**（SPA 状态切换：列表→详情的共享元素动画）与**跨文档版**（MPA 多页面导航，CSS 声明式）——以前要 FLIP 手写测量/反转/播放的"元素从列表飞到详情页"，现在是声明式几行；**注意它是增强不是依赖**（不支持的浏览器直接跳变，功能无损）。',
            '**:has() 父选择器**：`form:has(input.invalid)` 按子状态改父样式——CSS 苦等 20 年的"父选择器"；实战场景：表单错误状态高亮整块、`label:has(:checked)` 自定义单选、卡片 hover 联动兄弟区域；配合 **CSS 嵌套**（原生 `&` 选择器，postcss-nesting 时代结束）把 BEM 的长选择器折叠——**很多 JS 状态同步样式的代码可以直接删掉**（状态本来在 DOM 里，CSS 现在够得着了）。',
            '**怎么决策"能不能用"——Baseline 思维**：不再背"哪些浏览器支持"，用 **Baseline 标准**（web platform 特性按 Widely Available（两大引擎 30 个月+）/ Newly Available 分级）+ `@supports` 做能力检测渐进增强；工程纪律：**新特性先用在"增强层"**（动画、锦上添花的布局），核心布局与信息可用性不依赖它——降级路径先想好再用。',
            '收束口径：这一波 CSS 能力的共同主题是"**把原来必须 JS 做的事还给 CSS**"（共享元素动画、按容器自适应、按内容状态选样式）——更少 JS、更少 hydration、浏览器层优化；面试里能各给一个真实使用场景（而不是罗列特性名）就是用过的人。',
          ],
          followUps: [
            {
              question: 'View Transitions 的动画卡顿或闪烁，怎么排查与优化？',
              points: [
                '机理排查：过渡期间浏览器渲染的是**快照层**（旧/新两份伪元素），卡顿常见于快照太大（整页截图级别）——优化：**缩小过渡范围**（`view-transition-name` 只挂在变化的元素上，而不是默认根元素整页过渡）；闪烁常因新旧快照尺寸差异大（布局跳变）——给旧快照 `view-transition-class` 统一尺寸或用 `types` 定制不同过渡。',
                '进阶细节：callback 里只做状态变更（DOM 更新越快过渡越顺）；长列表给每个 item 唯一 name 会爆伪元素数量——按需命名；不可达降级：`@supports (view-transition-name: none)` 包裹自定义样式。能讲到"快照层"这一层的实现理解，这题就答穿了。',
              ],
            },
          ],
        },
        {
          id: 'fe-css-grid',
          title: 'Grid 布局和 Flex 有什么区别？Grid 的核心用法是什么？',
          difficulty: 'intermediate',
          tags: ['CSS', 'Grid', '布局'],
          points: [
            '**Flex 是一维布局**（一行或一列），**Grid 是二维布局**（同时定义行与列），适合页面骨架、不规则卡片墙。',
            '核心三步：`display: grid` → `grid-template-columns/rows` 定义轨道（支持 `fr` 弹性单位）→ `gap` 设间距。',
            '子项用 `grid-column: 1 / 3`（跨网格线）或 `span 2`（跨轨道）做不规则占位；`grid-template-areas` 可用"画图"方式命名整体布局。',
            '最实用技巧：`repeat(auto-fill, minmax(200px, 1fr))` 不写媒体查询即可实现**响应式列数**。',
            '对齐体系（justify-items/align-items/justify-content/align-content）与 Flex 概念互通，可平移记忆。',
          ],
          followUps: [
            {
              question: 'grid-template-areas 命名布局怎么用？和 flex 嵌套相比有什么优势？',
              points: [
                '在容器上"画图"定义布局：`grid-template-areas: "header header" "sidebar main"`，子项用 `grid-area: header` 对号入座，结构一目了然。',
                '响应式只需**改一份 areas 字符串**（媒体查询里重排行列），flex 嵌套方案则要调整 DOM 顺序或多层容器。',
                '细节：空位用 `.` 占位；同名 area 必须拼成矩形，否则整条声明无效。',
              ],
            },
            {
              question: 'repeat(auto-fill, minmax(200px, 1fr)) 是如何实现响应式列数的？auto-fill 和 auto-fit 有什么区别？',
              points: [
                '`minmax(200px, 1fr)` 表示每列最窄 200px、最宽均分剩余空间，容器变宽时**列数自动增加**，不需要媒体查询。',
                '**auto-fill** 尽可能多地生成轨道（含空轨道，保留占位）；**auto-fit** 会**折叠空轨道**，让现有子项拉伸铺满整行。',
                '因此卡片墙用 auto-fit 可"少卡片时铺满"，需要保持卡片尺寸上限时用 auto-fill。',
              ],
            },
          ],
        },
        {
          id: 'fe-css-reflow',
          title: '什么是重排（Reflow）和重绘（Repaint）？如何减少？',
          difficulty: 'intermediate',
          tags: ['CSS', '性能', '渲染'],
          points: [
            '渲染流水线：**样式计算 → 布局（Layout/Reflow）→ 绘制（Paint）→ 合成（Composite）**。重排必然重绘，重绘不一定重排。',
            '触发重排：几何属性（width/height/margin/top）、DOM 结构变化，以及读取 `offsetTop`、`getBoundingClientRect` 等布局属性引发的**强制同步布局**。',
            '只触发重绘：颜色、背景、阴影等外观属性；**只触发合成**：`transform`、`opacity`（走 GPU 合成层，是动画首选）。',
            '减少手段：读写分离（避免循环里交替读布局写样式）、用 `classList` 一次改多个样式、DOM 批量操作用 DocumentFragment、动画只用 transform/opacity。',
            '大列表可用 `content-visibility: auto` 跳过屏幕外渲染；`will-change` 提前提升合成层但别滥用，层过多会吃内存。',
          ],
          followUps: [
            {
              question: '什么是强制同步布局（layout thrashing）？如何避免？',
              points: [
                'JS 中**写样式后立刻读** `offsetTop`/`getBoundingClientRect`，浏览器被迫同步重排才能返回新值；循环里交替读写会触发**一帧内多次无效重排**，即布局抖动。',
                '规避：**批量读、批量写**——先把所有布局值读到局部变量再统一写；高频场景用 rAF 合并写操作。',
                '自测：Performance 面板里一帧内出现密集的紫色 Layout 块 + Recalculate Style 就是典型症状。',
              ],
            },
            {
              question: 'will-change 提前提升合成层为什么不能滥用？',
              points: [
                '每个合成层都要占用**显存与纹理内存**，层过多导致内存暴涨、合成器负担加重，移动端反而掉帧。',
                '浏览器对提升层有数量与尺寸上限，超限会**回退普通渲染**，优化效果消失甚至负优化。',
                '实践：只对确认瓶颈的动画元素临时声明，动画结束移除；更优先让动画只依赖 transform/opacity，交给浏览器自行决策。',
              ],
            },
          ],
        },
        {
          id: 'fe-css-responsive',
          title: '移动端适配有哪些方案？rem 和 vw 适配的原理是什么？',
          difficulty: 'intermediate',
          tags: ['CSS', '移动端', '响应式'],
          points: [
            '**rem 方案**：1rem 等于根元素 font-size。用 JS（或 CSS clamp）按屏幕宽度动态设置根字号，设计稿 px 按比例换算为 rem；工程上常用 postcss 插件自动转换。',
            '**vw 方案**：100vw 等于视口宽度。设计稿 375 宽下 1px 对应 (1/375)*100vw，纯 CSS 无 JS 依赖，postcss-px-to-viewport 自动转换，是目前更主流的方案。',
            '两者本质都是**等比缩放**，大屏上文字会跟着变大；更现代的做法是流式布局 + 断点，或 `clamp(min, vw, max)` 限制字号区间。',
            '`viewport` meta 必须正确：`width=device-width, initial-scale=1`；iOS 横屏字号自动放大需处理 text-size-adjust。',
            '配套问题单独处理：刘海屏安全区用 `env(safe-area-inset-*)` 配合 `viewport-fit=cover`；1px 物理像素问题另设方案。',
          ],
          followUps: [
            {
              question: 'rem 方案和 vw 方案各有什么缺陷？clamp 能解决什么问题？',
              points: [
                'rem 需要一段 **JS 设置根字号**，存在首屏闪烁与执行时机问题；极端大屏下等比放大不符合阅读习惯。',
                'vw 纯 CSS 但**没有上下限**：小屏字过小、大屏字过大；且 100vw 含滚动条宽度，Windows 桌面端可能出现横向溢出。',
                '`clamp(min, fluid, max)` 给字号设置**弹性区间**（如 `clamp(14px, 12px + 1vw, 20px)`），配合流式布局 + 断点是当前更推荐的方向。',
              ],
            },
            {
              question: 'env(safe-area-inset-*) 是怎么用的？viewport-fit=cover 起什么作用？',
              points: [
                '默认 viewport 不延伸到刘海/圆角区域；设置 `viewport-fit=cover` 后页面铺满全屏，才需要用 `env(safe-area-inset-top/bottom/left/right)` 避让。',
                '典型写法：底部操作栏 `padding-bottom: calc(env(safe-area-inset-bottom) + 12px)`，旧 iOS 用 `constant()` 提供回退。',
              ],
            },
          ],
        },
        {
          id: 'fe-css-1px',
          title: '移动端 1px 边框问题是怎么产生的？有哪些解决方案？',
          difficulty: 'intermediate',
          tags: ['CSS', '移动端', '高清屏'],
          points: [
            '成因：CSS 的 1px 是**逻辑像素**，在 dpr（devicePixelRatio）大于等于 2 的高清屏上会被渲染成 2-3 个物理像素，显得比设计稿粗——设计师要的是 1 个**物理像素**。',
            '方案一（最常用）：伪元素 + transform——::after 高度 1px，`transform: scaleY(0.5)`（dpr=3 用 0.33），兼容性好，需处理四边与圆角场景。',
            '方案二：动态 viewport 缩放——整页 `initial-scale = 1/dpr`，再用 rem/vw 放大补偿，效果最精确，但与 rem 方案强耦合、动态改 viewport 有事件坐标等坑。',
            '方案三：border-image、box-shadow 或 0.5px 高的 linear-gradient 背景实现，简单但圆角与交互态支持差。',
            '新趋势：部分现代浏览器已直接支持 `border-width: 0.5px`，可用 `@media (resolution: 2dppx)` 等查询按设备降级。',
          ],
          followUps: [
            {
              question: '为什么有的浏览器支持 0.5px 边框有的不支持？',
              points: [
                'CSS 像素是逻辑单位，0.5px 是否按**物理像素对齐渲染**取决于实现：iOS Safari 8+ 支持，早期 Chrome/Android 会**四舍五入为 0 或 1**。',
                '因此不能裸写 0.5px，需用 `@media (resolution: 2dppx)` 等**按 dpr 降级**，或统一走伪元素 + transform 方案。',
              ],
            },
            {
              question: '动态修改 initial-scale 对 fixed 元素和事件坐标会有什么影响？',
              points: [
                '整页缩放后布局视口变为 1/dpr 倍，`position: fixed` 仍相对布局视口定位，元素尺寸必须**乘回 dpr** 补偿，否则弹窗错位。',
                '事件坐标（clientX/pageX）处于缩放后的坐标系，与 CSS 布局坐标存在 dpr 倍换算差——自定义手势、拖拽逻辑要统一坐标系。',
                '该方案与 rem 适配强耦合（根字号需乘回 dpr），vw 方案普及后已很少单独使用。',
              ],
            },
          ],
        },
        {
          id: 'fe-css-stacking-context',
          title: '什么是层叠上下文？z-index 为什么会"失效"？',
          difficulty: 'advanced',
          tags: ['CSS', '层叠上下文', 'z-index'],
          points: [
            '层叠上下文是三维抽象：**z-index 只在同一层叠上下文内部比较**，无法跨上下文"越级"，这就是 z-index 被父级"锁死"而失效的根源。',
            '创建层叠上下文的常见条件：根元素、`position` 非 static 且 z-index 非 auto、`opacity < 1`、`transform`、`filter`、`will-change`、`isolation: isolate`、flex/grid 子项设置 z-index 等。',
            '同一上下文内的层叠顺序：z-index 正值最高；同为 auto/0 时再按盒类型顺序（背景边框 < 负 z-index 子级 < 块级盒 < 浮动 < 行内 < 定位元素）。',
            '实践守则：z-index 层级收敛为**有限的设计令牌**（如 10/20/30），弹层挂到 body 下，避免在深层嵌套里凭感觉加数字。',
            '`isolation: isolate` 可为组件创建隔离的层叠上下文，防止内部 z-index 泄漏参与页面级比较。',
          ],
          followUps: [
            {
              question: '父元素 opacity: 0.99 时，子元素 z-index: 9999 还能盖过同级 z-index: 1 的元素吗？',
              points: [
                '**不能**：opacity 小于 1 立即形成新层叠上下文，子元素的 9999 只在**父上下文内部**比较。',
                '对外参与比较的是**父上下文**本身：它没有显式 z-index（按 auto/0 处理），落在同级 z-index: 1 元素之下，整体被压住。',
                '同类触发源还有 transform、filter、will-change——"加个动画层级就乱了"的根源都在这里。',
              ],
            },
            {
              question: '为什么加了 transform 动画的元素会"突然"盖在别人上面？',
              points: [
                '动画运行期间元素**形成层叠上下文**并提升合成层，从"普通流内绘制"变为"按定位元素规则参与比较"，层级关系可能反转。',
                '若原本依赖 DOM 顺序压住兄弟，动画开始后就会被兄弟的定位/z-index 规则重新排序，出现"闪到最上层"或"被弹层遮挡"的灵异现象。',
                '治理：关键元素显式声明 z-index 并收敛层级令牌，不依赖隐式绘制顺序。',
              ],
            },
          ],
        },
        {
          id: 'fe-css-animation',
          title: 'transition 和 animation 的区别是什么？CSS 动画怎么保证性能？',
          difficulty: 'basic',
          tags: ['CSS', '动画', '性能'],
          points: [
            '**transition** 补间"状态变化"：只有起止两态，需要触发（hover/class 变化），不能中途暂停或循环。',
            '**animation + @keyframes**：多帧关键帧，可循环（infinite）、暂停（animation-play-state）、反向，配合 animation-fill-mode 控制结束态——复杂动效用它。',
            '性能铁律：只动 **transform 和 opacity**——它们由合成器线程处理、跳过 Layout 与 Paint；改 width/top 会触发重排重绘，是动画卡顿的第一嫌疑。',
            'Web Animations API（`element.animate()`）：CSS 引擎驱动 + JS 控制，统一两者的能力，可暂停/变速/取时间线。',
            '细节联动：`display: none` 是离散属性无法过渡——现代浏览器（2023+）支持 `transition-behavior: allow-discrete` 配合 `@starting-style` 做进出动画。',
          ],
          followUps: [
            {
              question: 'CSS 动画和 requestAnimationFrame 驱动的 JS 动画怎么选？',
              points: [
                'CSS 动画跑在**合成器线程**，主线程阻塞时依然流畅——优先用它做纯视觉动效。',
                'rAF 胜在与 JS 状态联动（物理模拟、滚动联动）、可逐帧控制；新一代 scroll-driven animations 把滚动驱动也下沉给了 CSS。',
              ],
            },
            {
              question: '动画卡顿了怎么排查？',
              points: [
                'DevTools Performance 录制：看紫色 Layout/绿色 Paint 块——出现即说明动了不该动的属性。',
                'Layers 面板确认目标元素已提升为合成层（will-change/transform），警惕层爆炸（过多图层吃显存）。',
                '大图层（超大图/大面积 blur）首帧纹理上传会掉帧——缩小尺寸或预上传。',
              ],
            },
          ],
        },
      ],
    },
    {
      id: 'fe-js',
      name: 'JavaScript 核心',
      description: '闭包、原型链、this 与事件循环等语言核心机制，是区分"会用 JS"和"理解 JS"的分水岭。',
      references: [
        { label: 'MDN JavaScript 文档', url: 'https://developer.mozilla.org/en-US/docs/Web/JavaScript' },
        { label: '现代 JavaScript 教程', url: 'https://javascript.info' },
        { label: 'ECMA-262 语言规范', url: 'https://262.ecma-international.org' },
        { label: 'V8 官方博客', url: 'https://v8.dev' },
      ],
      questions: [
        {
          id: 'fe-js-var-let-const',
          title: 'var、let、const 有什么区别？什么是暂时性死区？',
          difficulty: 'basic',
          tags: ['作用域', 'ES6'],
          points: [
            '**var**：函数作用域、存在**变量提升**（创建时初始化为 undefined）、可重复声明、全局声明会成为 window 的属性。',
            '**let/const**：块级作用域、存在 **TDZ 暂时性死区**（从块开始到声明语句之间访问会抛 ReferenceError）、不可重复声明、不挂到 window。',
            'const 约束的是**绑定不可变**而非值不可变：对象的属性仍可修改；需要深度不可变要用 Object.freeze 或不可变数据结构。',
            'for 循环中 let 每轮迭代创建**新的词法环境**，闭包捕获当轮的 i；var 只有一个共享绑定，这是"循环里输出全是最后一个值"的根源。',
            '实践约定：默认 const，需要重新赋值才用 let，不再使用 var。',
          ],
          followUps: [
            {
              question: '暂时性死区有多严格？在声明前对 let 变量做 typeof 会怎样？',
              points: [
                '连 **typeof 都会抛 ReferenceError**：`typeof x` 在 x 处于 TDZ 时报错，而对一个未声明的变量 typeof 才返回 undefined——这是 TDZ 与"未声明"的本质区别。',
                '设计动机：让"声明前使用"**尽早显式失败**，而不是像 var 静默得到 undefined 掩盖 bug。',
              ],
            },
          ],
        },
        {
          id: 'fe-js-closure',
          title: '什么是闭包？有哪些典型的应用场景？',
          difficulty: 'basic',
          tags: ['闭包', '作用域'],
          points: [
            '闭包是**函数与其词法作用域的组合**：内层函数可以持续访问外层函数的变量，即使外层函数已经返回。',
            '本质是 JS 的**静态（词法）作用域**机制：函数定义时就确定了可访问的变量集合，与调用位置无关；实现上表现为外层变量环境被内层函数引用而无法回收。',
            '典型应用：**防抖/节流**（保存定时器 id）、**模块私有变量**、柯里化、React Hooks 的状态保持（每次渲染的 props/state 被回调闭包捕获）。',
            '闭包会让被引用的变量无法回收，滥用可能造成**内存泄漏**（如闭包意外持有大对象、DOM 节点）。',
          ],
          followUps: [
            {
              question: '循环中用 var 声明计时器，为什么输出全是最后一个值？有几种修复方式？',
              points: [
                'var 只有**一个函数级绑定**：回调执行时循环早已结束，闭包共享的 i 已是最终值；let 会为每轮迭代**创建新的词法环境**，各自捕获当轮的 i。',
                '修复：① 改用 let（推荐）；② IIFE 按值捕获 `((j) => setTimeout(() => console.log(j)))(i)`；③ 把 i 作为 setTimeout 的第三个参数传入。',
              ],
            },
            {
              question: '什么情况下闭包引用的变量会被 GC 回收？',
              points: [
                '可达性决定一切：只要**闭包函数对象本身可达**（被全局、监听器、定时器、存活组件引用），它捕获的变量环境整体不可回收。',
                '释放方式：解除对闭包的引用（clearTimeout、解绑监听、置 null）；现代引擎还会做**上下文裁剪**，只保留闭包真正用到的变量。',
                '排查：堆快照里看 retainer 链，典型泄漏是事件监听器持有了引用大数组的闭包却从未解绑。',
              ],
            },
          ],
        },
        {
          id: 'fe-js-prototype',
          title: '谈谈原型和原型链，以及常见的继承方式。',
          difficulty: 'basic',
          tags: ['原型链', '继承'],
          points: [
            '每个对象都有内部属性 **[[Prototype]]**（经 `__proto__` 或 `Object.getPrototypeOf` 访问）；**函数**额外有 `prototype` 属性，用作其实例的原型。',
            '属性查找沿原型链逐级上溯，直到 `Object.prototype`（其原型为 null）——这就是**原型链**，也是 JS"继承"的本质。',
            '`new Fn()` 四步：创建空对象 → 将 [[Prototype]] 指向 `Fn.prototype` → 以新对象为 this 执行构造函数 → 构造函数返回对象时用返回值，否则返回新对象。',
            '`instanceof` 的原理是检查构造函数的 prototype 是否在对象的原型链上；`Object.create(proto)` 可直接以指定原型创建对象。',
            '现代写法用 **ES6 class**（本质仍是原型语法糖，但方法不可枚举、必须 new 调用、内部严格模式），继承用 extends/super，取代了 ES5 的寄生组合继承。',
          ],
          followUps: [
            {
              question: '__proto__ 和 prototype 到底是什么关系？为什么说一个是访问器一个是属性？',
              points: [
                '`prototype` 是**函数对象的普通属性**，充当"用这个函数 new 出来的实例的原型"；`__proto__` 是 Object.prototype 上的**访问器属性（getter/setter）**，读写内部槽位 **[[Prototype]]**。',
                '链路关系：`obj.__proto__ === Ctor.prototype`；函数既是对象又是构造器，`Function.prototype.__proto__ === Object.prototype` 是两条链的交汇点。',
                '规范推荐用 `Object.getPrototypeOf`/`Object.create` 操作原型，`__proto__` 已降级为附录 B 兼容特性。',
              ],
            },
          ],
        },
        {
          id: 'fe-js-this',
          title: 'this 的指向规则是什么？箭头函数的 this 有什么不同？',
          difficulty: 'basic',
          tags: ['this', '作用域'],
          points: [
            '优先级从高到低：**new 调用** > **call/apply/bind 显式绑定** > **对象方法调用**（指向点号前的对象）> **普通函数调用**（严格模式 undefined，非严格 window）。',
            '**箭头函数没有自己的 this**：沿用定义时所在词法作用域的 this，且不能被 call/apply/bind 改变、不能作构造函数、没有 arguments。',
            '"丢 this"典型：`setTimeout(obj.fn, 100)` 传入的是函数引用，调用时 this 不再是 obj；用 bind 或箭头函数包裹修复。',
            'class 内部自动运行在严格模式，未绑定的回调里 this 是 undefined——这也是 React 类组件要 `.bind(this)` 的原因。',
            'DOM 事件处理函数的 this 是**当前元素**（除非用箭头函数），与普通调用规则不同。',
          ],
          followUps: [
            {
              question: 'bind 返回的函数再 bind 一次，this 会变吗？为什么？',
              points: [
                '**不会**：bind 返回的是**绑定函数（bound function exotic object）**，this 在创建时固定，后续 call/apply/bind 传入的 this 一律被忽略（参数照常透传）。',
                '手写版要模拟该语义：new 调用时优先使用新实例（`this instanceof bound`），否则永远用首次的 ctx。',
              ],
            },
            {
              question: '箭头函数用作对象方法会有什么问题？',
              points: [
                '箭头函数**沿用定义处的 this**：写在对象字面量里时 this 是外层作用域（通常 window/undefined），方法内访问 this.xxx 拿不到对象属性。',
                '需要 this 的方法一律用普通函数/方法简写；反过来，类字段箭头函数可以**固定 this 为实例**，适合作为回调传给子组件——同一个特性正反两面。',
              ],
            },
          ],
        },
        {
          id: 'fe-js-execution-context',
          title: '什么是执行上下文？变量提升是怎么发生的？',
          difficulty: 'basic',
          tags: ['执行上下文', '作用域', '提升'],
          points: [
            '代码执行分阶段：**创建执行上下文**（全局/函数）→ 压栈执行 → 出栈销毁；每次函数调用都创建新的函数执行上下文，递归过深触发栈溢出。',
            '上下文包含：**词法环境**（let/const，带 TDZ）、**变量环境**（var 声明与函数声明）、**this 绑定**。',
            '**变量提升**：创建阶段 var 被初始化为 undefined，函数声明被整体提升（可先调用后定义）；let/const 只登记不初始化，形成暂时性死区。',
            '同名冲突规则：函数声明优先于 var 变量；多个同名函数声明后者覆盖前者。',
            '作用域链在**函数定义时**确定（保存外层词法环境引用），与调用栈无关——这是闭包能跨调用栈访问变量的基础。',
          ],
          followUps: [
            {
              question: '作用域链是在什么时候确定的？它和调用栈有什么区别？',
              points: [
                '作用域链在**函数定义时**固化（函数对象持有对外层词法环境的引用），与在哪调用无关——所以回调在完全不同的调用栈上仍能访问定义处的变量。',
                '调用栈是**运行时**结构（调用的先后与嵌套，随返回销毁）；作用域链是**静态**结构（随定义产生）。输出题里"先看定义处作用域、再按执行顺序推微任务"用的就是这两套体系的区分。',
              ],
            },
          ],
        },
        {
          id: 'fe-js-type-judgment',
          title: 'typeof 和 instanceof 有什么区别？如何准确判断类型？',
          difficulty: 'basic',
          tags: ['类型', 'typeof'],
          points: [
            '**typeof**：返回 string/number/boolean/undefined/symbol/bigint/function/object 八种值；`typeof null === "object"` 是历史 bug；引用类型（除函数）一律 object。',
            '**instanceof**：沿原型链查找构造函数的 prototype，只适用引用类型，跨 iframe（不同 realm）会失效。',
            '通用方案：**`Object.prototype.toString.call(x)`** 返回 `"[object Array]"` 等内部标签，最可靠；数组另有 `Array.isArray()`（跨 realm 安全，优先用）。',
            '隐式转换要点：`==` 触发 ToPrimitive（对象先 valueOf 再 toString）；`null == undefined` 为 true 但与其他任何值都不等，`[] == false` 为 true。',
            '数值坑：0.1 + 0.2 !== 0.3（IEEE 754 双精度），比较用容差或整数化；`Number.isNaN` 优于全局 isNaN（后者会先做隐式转换）。',
          ],
          followUps: [
            {
              question: '如何手写一个更准确的 typeof？NaN 应该怎么判断？',
              points: [
                '思路：`Object.prototype.toString.call(x).slice(8, -1).toLowerCase()` 拿到 Null/Array/Date 等内部标签，函数仍用 typeof 补齐——比原生 typeof 多区分出 null 与各引用类型。',
                'NaN 判断：`Number.isNaN(x)`（不做转换）优于全局 `isNaN`（先 Number() 转换，`isNaN("abc")` 为 true）；另一招利用 **NaN 是唯一不等于自身的值**：`x !== x`。',
              ],
            },
          ],
        },
        {
          id: 'fe-js-es6',
          title: 'ES6+ 你常用的新特性有哪些？分别解决什么问题？',
          difficulty: 'basic',
          tags: ['ES6', '语法'],
          points: [
            '**作用域与变量**：let/const 块级作用域；**解构赋值**与**展开运算符**（浅拷贝、合并、剩余参数）。',
            '**函数增强**：箭头函数、默认参数、剩余参数；**模板字符串**支持多行与插值。',
            '**异步演进**：Promise 统一回调 → Generator（中间态）→ **async/await**（同步写法写异步）。',
            '**数据结构**：Map/Set（键任意类型、数组去重）、**WeakMap/WeakSet**（弱引用不阻止 GC，适合附加元数据与私有数据）、Symbol（唯一键与元编程协议）。',
            '**模块**：ESM 静态结构支撑 Tree Shaking 与依赖静态分析；可选链 `?.`、空值合并 `??`、class 字段等持续减少样板代码。',
          ],
        },
        {
          id: 'fe-js-new-operator',
          title: '用 new 调用函数时发生了什么？如何手写实现？',
          difficulty: 'intermediate',
          tags: ['new', '原型链'],
          points: [
            '四步：① 创建空对象；② 将其 **[[Prototype]] 指向构造函数的 prototype**；③ 以新对象为 this 执行函数体；④ 若函数**返回对象**则采用返回值，否则返回新对象。',
            '关键细节：返回原始值会被忽略，返回**对象**（含数组、函数）会替换默认结果；箭头函数没有 [[Construct]]，不能被 new。',
            '手写要点：`Object.create(Fn.prototype)` 一步完成①②；返回值判断用 `typeof result === "object"` 且非 null；用 `new.target` 可防止绕过 new 调用。',
            'class 的构造函数与普通函数不同：直接调用抛错（普通函数严格模式下 this 是 undefined 而不报错）。',
            '相关延伸：`Object.create(proto)` 只设原型不执行构造函数，适合"纯原型继承"场景。',
          ],
          followUps: [
            {
              question: '手写 new 时如何处理构造函数返回对象的情况？箭头函数为什么不能被 new？',
              points: [
                '返回值为**对象类型**（含数组、函数）时**替换**默认的新对象；返回原始值会被**忽略**，仍返回新对象——判断条件是 `result !== null && typeof result === "object"`（再补 function）。',
                '箭头函数没有 **[[Construct]] 内部方法**（也没有 prototype 与自身 this），new 在引擎层面直接抛 TypeError——是规范约束而非语法限制。',
              ],
            },
            {
              question: 'Object.create(proto) 和 new Fn() 的本质区别是什么？各适合什么场景？',
              points: [
                '`Object.create` 只**建立原型关联**、不执行构造函数体——适合纯原型继承、创建干净对象（`Object.create(null)` 无原型，可作安全字典）。',
                '`new` 执行构造函数初始化实例状态并建立原型。实现继承时 `Child.prototype = Object.create(Parent.prototype)` 优于 `new Parent()`：不会把 Parent 的实例属性污染到 Child 原型上。',
              ],
            },
          ],
        },
        {
          id: 'fe-js-event-loop',
          title: '浏览器的事件循环是怎么工作的？宏任务和微任务有什么区别？',
          difficulty: 'intermediate',
          tags: ['事件循环', '异步'],
          points: [
            'JS 单线程，事件循环不断取任务：每个**宏任务**（script、setTimeout/setInterval、I/O、UI 事件回调）执行完后，**清空整个微任务队列**，然后才可能进行渲染。',
            '**微任务**：Promise.then/catch/finally、queueMicrotask、MutationObserver；**宏任务**：setTimeout/setInterval、postMessage、消息与 I/O 事件等。',
            '输出题套路：同步代码 → 微任务按入队顺序 → 下一个宏任务；`await` 之后的代码相当于注册进 then，属于微任务。',
            '渲染时机：**requestAnimationFrame 在每轮渲染前执行**，rAF 回调里新产生的微任务也会在本次渲染前跑完。',
            'Node 与浏览器不同：分 timers/poll/check 等阶段；Node 11+ **每个宏任务回调执行完后立即清空微任务队列**（含每个 timer 回调），与浏览器趋同；process.nextTick 队列优先于 Promise 微任务。',
          ],
          followUps: [
            {
              question: 'setTimeout(fn, 0) 和 Promise.resolve().then(fn) 谁先执行？为什么？',
              points: [
                '**Promise 先执行**：then 回调进**微任务队列**，setTimeout 进**宏任务队列**；当前同步代码跑完后先清空全部微任务，才会取下一个宏任务。',
                '补充：嵌套超过 5 层的 setTimeout 会被钳制到 **4ms 最小延迟**，微任务则在当前 tick 内就执行。',
              ],
            },
            {
              question: '大量微任务会不会饿死渲染？为什么？',
              points: [
                '**会**：事件循环规定"执行完一个宏任务后**清空全部微任务**才进入渲染"，若微任务里不断自产新微任务（递归 then 链），渲染与输入会被无限推迟，页面假死。',
                '推论：**长任务切片必须用宏任务**（setTimeout/MessageChannel/scheduler.postTask），微任务切片等于不切。',
              ],
            },
          ],
        },
        {
          id: 'fe-js-promise',
          title: 'Promise 是如何解决回调地狱的？说说它的状态机和常用静态方法。',
          difficulty: 'intermediate',
          tags: ['Promise', '异步'],
          points: [
            '三种状态 **pending/fulfilled/rejected**，只能从 pending 单向流转一次；then 返回**新 Promise**，链式调用由此实现，把嵌套回调压平成顺序书写。',
            'then 返回值规则：返回普通值 → resolve；返回 Promise → 采纳其状态；抛错 → rejected；错误沿链**穿透**直到被 catch。',
            '**Promise.all**：全部成功返回数组，**一个失败整体 reject**（快速失败）；**allSettled**：等全部结束，返回每项的 status/value/reason，不短路。',
            '**Promise.race**：第一个 settle 的决定结果（超时控制常用）；**Promise.any**：第一个 fulfilled 的决定结果，全失败才抛 AggregateError。',
            '错误处理：catch 等价 then(undefined, onRejected)；未捕获的 rejection 触发 unhandledrejection 事件，监控体系靠它兜底。',
          ],
          followUps: [
            {
              question: 'Promise.all 中某个 promise 失败后，其余的还会继续执行吗？',
              points: [
                '**会**：all 的 reject 只是"提前返回结果"，**不能取消**其他 promise——它们照常完成，只是结果被丢弃。',
                '衍生风险：失败后其他任务继续产生副作用（写库、发请求）；需要"一失败全取消"要用 AbortController 逐个 abort，或改用 allSettled 收尾清理。',
              ],
            },
            {
              question: '如何封装一个带超时的请求？Promise.race 的坑是什么？',
              points: [
                '实现：`Promise.race([fetchWithSignal(url, signal), timeoutPromise(ms)])`，并把 **AbortController 的 signal 传给 fetch**——超时后真正中断网络请求，而不是放任它跑完。',
                'race 的坑：慢的那个 promise **仍在后台执行**，失败还会触发 unhandledrejection 污染监控；超时分支必须主动 abort 并 catch 掉被淘汰方的错误。',
              ],
            },
          ],
        },
        {
          id: 'fe-js-async-await',
          title: 'async/await 的原理是什么？有哪些使用陷阱？',
          difficulty: 'intermediate',
          tags: ['async', 'await', 'Promise'],
          points: [
            'async 函数**总是返回 Promise**；await 相当于把后续代码注册为该 Promise 的 then 回调——底层是 Generator + 自动执行器（类似 co 库）的语法糖，暂停与恢复由引擎托管。',
            '**串行陷阱**：循环里逐个 await 会串行等待；无依赖的请求应先收集再 `Promise.all` 并行，这是最常见的性能错误。',
            '错误处理：await 一个 rejected Promise 会**抛出异常**，需要 try/catch 或 .catch；try 范围要覆盖业务预期，不能整个函数套一个大 try 了事。',
            '陷阱一：在 forEach/map 里直接 await 不会等待（forEach 不理会 Promise），要用 `for...of` 或 `Promise.all(map(...))`。',
            '陷阱二：await 非 Promise 值也会让出一个微任务周期，可能引入一个 tick 的时序差异，写依赖执行顺序的用例时要注意。',
          ],
          followUps: [
            {
              question: '多个没有依赖关系的 await 请求如何优化？',
              points: [
                '把"逐个 await"改为**先发起再统一等待**：`const [a, b] = await Promise.all([fetchA(), fetchB()])`，总耗时从串行之和降为最慢一个。',
                '关键认知：**发起时机决定并行**——先调用拿到 promise 再 await 就是并行；`await fetchA(); await fetchB()` 是串行。',
                '允许部分失败时用 `allSettled`，或对非关键数据 `.catch` 给默认值，避免一颗雷炸掉整页。',
              ],
            },
            {
              question: '如何在 async 函数外同步捕获它的异常？',
              points: [
                '做不到"同步"：async 函数内异常一律转为**返回 Promise 的 rejected 状态**，只能在调用点用 `.catch()` 或外层 try/catch（配合 await）处理。',
                '工程化：封装 `const [err, data] = await to(fetchX())`（Go 风格 result 包装），避免每个调用点写 try/catch。',
              ],
            },
          ],
        },
        {
          id: 'fe-js-gc-memory',
          title: 'JavaScript 的垃圾回收机制是怎样的？常见内存泄漏有哪些？',
          difficulty: 'intermediate',
          tags: ['垃圾回收', '内存泄漏'],
          points: [
            '主流引擎用**标记-清除**（从 GC Roots 出发标记可达对象，清除不可达者），配合分代优化：**新生代**用 Scavenge 复制算法（存活率低时高效），**老生代**用标记-清除/标记-整理。',
            'V8 还有**增量标记与并发标记**，把长停顿拆小，减少 Stop-The-World 对主线程的影响。',
            '常见泄漏：被遗忘的**定时器与事件监听**、闭包意外持有大对象、**脱离 DOM 的引用**（缓存了已删除节点）、全局变量累积、只增不减的 Map/缓存（该用 WeakMap 的场景）。',
            '排查手段：Chrome DevTools **Memory 面板拍堆快照对比**、Performance Monitor 观察 JS Heap Size 曲线、Detached 节点检查。',
            '预防：组件卸载时清理副作用（React useEffect 返回清理函数、Vue onUnmounted）、事件总线及时解绑、缓存容器优先 WeakMap/带容量上限的 LRU。',
          ],
          followUps: [
            {
              question: 'WeakMap 的键为什么必须是对象？弱引用体现在哪？',
              points: [
                '弱引用指**键到对象的引用不计入 GC 可达性**：外部引用消失后，键对象连同对应值一起被回收，WeakMap 不会阻止回收。',
                '键必须是对象，因为回收粒度是对象——原始值没有对象身份，引擎无法感知"外部引用消失"，也无法提供遍历接口让你手动清理。',
                '因此 WeakMap 适合**随对象存亡的附加元数据**：DOM 节点的私有数据、组件实例级缓存。',
              ],
            },
            {
              question: '如何在堆快照里识别 Detached DOM 节点？',
              points: [
                'DevTools Memory 面板拍快照，Class filter 搜 **Detached**：大量 detached HTMLDivElement 说明"节点已从文档移除但仍被 JS 持有"。',
                '展开节点的 **retainers（保留者）链**定位引用来源：闭包 context、全局数组、未解绑的监听器，顺着修复。',
                '辅助信号：Performance Monitor 里 DOM Node 数随反复操作只增不减；强制 GC 后再拍快照对比。',
              ],
            },
          ],
        },
        {
          id: 'fe-js-iterator-generator',
          title: '迭代器和生成器是什么？有哪些实际应用？',
          difficulty: 'intermediate',
          tags: ['迭代器', 'Generator'],
          points: [
            '**迭代器协议**：对象实现 `next()` 返回 `{ value, done }`；**可迭代协议**：实现 `[Symbol.iterator]`，可被 for...of、展开运算符、解构消费。',
            '**Generator**：`function*` 声明，`yield` 暂停并产出值，`next(value)` 恢复执行并可向内传值——**惰性求值**与**双向通信**是核心能力。',
            '应用一：**自定义迭代**，如分页拉取器（每次 next 拉一页直到 done）；应用二：**状态机**（yield 表达状态转移，代码即流程图）。',
            '历史角色：async/await 普及前，Generator + Promise（co 库）是异步流程控制的主流方案，如今主要价值在惰性与自定义遍历。',
            '无限序列、大文件流式处理等内存敏感场景，Generator 可以避免一次性构建整个数组。',
          ],
          followUps: [
            {
              question: 'Generator 和 async/await 是什么关系？为什么说 async 是 Generator 的语法糖？',
              points: [
                'async/await 的底层形态是 **Generator + 自动执行器**：await 对应 yield，把"暂停-恢复"交给引擎托管；co 库时代需要手写 runner 递归 next 驱动 Promise。',
                '区别：async 函数**固定返回 Promise**、错误走 reject 链路；Generator 的产出与恢复值完全由使用者定义，更底层也更灵活（惰性求值、双向通信）。',
              ],
            },
            {
              question: '如何用 Generator 实现一个惰性的无限序列？比直接生成大数组好在哪里？',
              points: [
                '实现：`function* fib() { let a = 0, b = 1; while (true) { yield a; [a, b] = [b, a + b] } }`，配合 for...of + break 或 next() 按需取值。',
                '优势：**内存 O(1)**——不预生成整个数组，算到哪存到哪；再配一个 `take(n)` 组合子即可声明式表达"取前 n 个"。',
              ],
            },
          ],
        },
        {
          id: 'fe-js-promise-aplus',
          title: '如何实现一个符合 Promise/A+ 规范的 Promise？难点在哪？',
          difficulty: 'advanced',
          tags: ['Promise', '规范', '源码'],
          points: [
            '核心结构：状态机（pending → fulfilled/rejected 单向一次性）+ **回调队列**（pending 时 then 注册回调，状态变更后统一异步执行）。',
            '难点一 **then 的异步性**：回调必须放入**微任务**（规范 2.2.4，实现用 queueMicrotask），否则执行顺序与预期不符。',
            '难点二 **解析 thenable**：then 返回的值若是带 then 方法的对象或原生 Promise，要递归采纳其状态，并用 `called` 标记防止重复 resolve 与**循环引用**（规范 2.3）。',
            '难点三 **值穿透**：onFulfilled/onRejected 非函数时，把 value/reason 原样传给下一个 then，实现上直接赋值透传。',
            '配套实现：executor 同步执行 + 异常捕获、resolve/reject 只生效一次、`Promise.resolve/reject/all/race/allSettled/any` 静态方法。',
          ],
          followUps: [
            {
              question: 'Promise/A+ 测试套件重点考察哪些规则？',
              points: [
                '**2.2.x 回调规则**：then 回调必须**异步执行**（微任务）、对同一 promise 只执行一次、非函数回调触发**值穿透**。',
                '**2.3.x 解析过程**：返回值是 thenable 时递归采纳状态、thenable 抛错转 reject、`called` 锁防止重复 resolve、检测 `x === promise2` 循环引用。',
                '872 个官方用例几乎都在打磨这两个区段——能说出"回调微任务化 + thenable 递归解析 + 防重入"就抓住了主干。',
              ],
            },
            {
              question: '实现 thenable 解析时如何防止循环引用和重复 resolve？',
              points: [
                '**循环引用**：`if (x === promise2) reject(new TypeError("Chaining cycle detected"))`——自己 resolve 自己会无限递归，规范 2.3.1 要求直接报错。',
                '**重复 resolve**：用 `called` 布尔锁包裹 thenable 的 then 调用，首次生效后忽略后续（thenable 可能多次回调甚至既 resolve 又 reject）。',
                '防御细节：读取 `x.then` 要 try/catch 包裹（getter 可能抛错），读取失败直接 reject。',
              ],
            },
          ],
        },
        {
          id: 'fe-js-v8',
          title: 'V8 是如何执行 JavaScript 的？说说 JIT、隐藏类和内联缓存。',
          difficulty: 'advanced',
          tags: ['V8', '引擎', '性能'],
          points: [
            '执行流水线：**Ignition 解释器**字节码快速启动 → 热点代码交给 **TurboFan** 优化编译为机器码（Sparkplug/Maglev 作为中间层级平滑开销）；运行时假设失效会**去优化**回退解释器。',
            '**隐藏类（Hidden Class/Map）**：描述对象属性布局的"形状"。相同顺序添加相同属性的对象共享隐藏类；动态增删属性、乱序初始化会导致形状分裂，拖慢属性访问。',
            '**内联缓存（IC）**：属性访问点缓存"形状 → 偏移量"映射，单态最快，多态/超多态退化——这就是"保持对象形状一致能提速"的原理。',
            '实践建议：构造函数中按固定顺序初始化全部属性；避免 delete；数组保持密集且元素类型一致（PACKED 快于 HOLEY，double 数组快于装箱对象数组）。',
            '边界认知：JS 单线程 + 微任务不等于并行，真正的并行靠 Web Worker；GC 分代与增量标记决定了"为什么大对象分配会造成停顿"。',
          ],
          followUps: [
            {
              question: '为什么 delete obj[key] 会影响性能？',
              points: [
                'delete 改变对象的**隐藏类形状**：V8 把对象退回**字典模式（slow mode）**，属性访问不能再走内联缓存缓存的固定偏移量，速度下降一个量级。',
                '替代：赋值 undefined（保持形状）、动态键值集合改用 Map、或保证对象由构造函数按固定形状初始化。',
              ],
            },
            {
              question: '如何用 node --trace-ic 或 %DebugPrint 观察内联缓存与隐藏类？',
              points: [
                '`node --trace-ic app.js` 输出每个 IC 点的状态迁移：LoadIC 从 **mono（单态）滑向 megamorphic（超多态）**就是形状不一致的信号。',
                '`node --allow-natives-syntax` 下 `%DebugPrint(obj)` 打印对象的 map（隐藏类）与属性布局，对比两个"同类"对象是否共享 map。',
                '实践意义：热点函数的参数要**同构**；跨多形状调用的工具函数按类型拆分以维持单态。',
              ],
            },
          ],
        },
      ],
    },
    {
      id: 'fe-ts',
      name: 'TypeScript',
      description: '类型系统的思维：从泛型与工具类型到协变逆变，考察能否用类型表达业务约束。',
      references: [
        { label: 'TypeScript Handbook', url: 'https://www.typescriptlang.org/docs/handbook/' },
        { label: 'tsconfig 官方参考', url: 'https://www.typescriptlang.org/tsconfig' },
        { label: 'type-challenges 类型体操练习', url: 'https://github.com/type-challenges/type-challenges' },
        { label: 'typescript-eslint', url: 'https://typescript-eslint.io' },
      ],
      questions: [
        {
          id: 'fe-ts-type-vs-interface',
          title: 'type 和 interface 有什么区别？如何选择？',
          difficulty: 'basic',
          tags: ['TypeScript', '类型'],
          points: [
            '**interface 只能描述对象形状**（对象/函数/类），支持 **declaration merging**（同名声明自动合并，是给第三方库"打补丁"的正规方式）；**type 是类型别名**，可以是联合、交叉、原始值、元组、条件类型等任意类型。',
            'interface 用 **extends** 继承，属性类型冲突直接报错；type 用 **& 交叉**，冲突属性会被推断成 never 而不是报错，更隐蔽。',
            '两者都能被 class implements；但 type 无法参与声明合并，也无法表达联合类型。',
            '社区惯例：**公共 API 与对象结构用 interface**，**工具类型、联合类型、条件类型用 type**。',
            '团队保持统一即可，关键是不要在同一概念上混用两种风格导致维护困惑。',
          ],
          followUps: [
            {
              question: 'declaration merging 在实际工程里有什么用？有什么风险？',
              points: [
                '用途：给第三方类型"打补丁"——扩展 window（`declare global { interface Window { __APP_CONFIG__ } }`）、给 vue-router 的 RouteMeta 加字段、给 express 的 Request 挂自定义属性。',
                '风险：合并**全局生效且隐式**，两个库对同一 interface 的扩展可能冲突；type 别名不能被合并，也天然避免了这类污染——两者是取舍不是优劣。',
              ],
            },
          ],
        },
        {
          id: 'fe-ts-any-unknown-never',
          title: 'any、unknown、never 的区别是什么？',
          difficulty: 'basic',
          tags: ['TypeScript', 'any', 'unknown'],
          points: [
            '**any**：完全关闭类型检查，赋给谁谁变成 any，**传染性**强，是类型漏洞之源，团队规范通常禁用（no-explicit-any）。',
            '**unknown**：类型安全的 any——只能赋值给 unknown/any，使用前必须**收窄**（typeof/instanceof/类型断言），适合接收外部输入（JSON.parse 结果、catch 的 error）。',
            '**never**：**底类型**，没有任何值属于它；不可达分支（抛错、死循环）的返回类型；常用于**穷举检查**——switch 处理完所有联合成员后，default 分支把值赋给 never 类型变量，漏分支时编译期就报错。',
            '类型层级：unknown 是顶类型（所有类型可赋给它），never 是底类型（它可赋给所有类型）。',
            '实践：外部边界一律 unknown，收窄后再用；泛型默认约束从 any 收紧为 unknown 更安全。',
          ],
          followUps: [
            {
              question: 'catch (e) 的参数类型为什么随 tsconfig 变化？如何安全取 message？',
              points: [
                '开启 `useUnknownInCatchVariables`（strict 默认包含）后 catch 参数是 **unknown**——throw 可以抛任意值（字符串、数字），历史上默认 any 是类型漏洞。',
                '安全取值：先收窄 `if (e instanceof Error) return e.message`，或封装 `toErrorMessage(e: unknown)` 统一处理字符串/Error 两种形态，避免到处 as Error。',
              ],
            },
            {
              question: '如何利用 never 实现"检查所有分支"的编译期保障？',
              points: [
                '穷举检查：联合类型被 switch 处理完后，default 分支把值赋给 never——`const _exhaustive: never = value`，新增联合成员而漏写分支时**编译期直接报错**。',
                '进阶：封装 `assertNever(value: never): never` 抛错函数，配合可辨识联合保证"加状态必须加处理"，是状态机建模的标配。',
              ],
            },
          ],
        },
        {
          id: 'fe-ts-generics',
          title: '泛型是什么？如何用泛型约束写出类型安全的复用函数？',
          difficulty: 'basic',
          tags: ['TypeScript', '泛型'],
          points: [
            '泛型是**类型的参数化**：定义时不指定具体类型，调用时确定，从而**保住入参与返回值的关联**——`function first<T>(arr: T[]): T | undefined`。',
            '**泛型约束**用 extends：`<T extends { id: number }>` 表示"任何有 id 的类型"，约束体内可安全访问 id；与 keyof 结合可让键名与取值联动。',
            '**默认类型** `<T = string>`、**多类型参数** `<T, R>` 表达输入输出映射；TS 能从实参自动**推断**，显式标注只在推断失败或需要文档化时写。',
            '泛型接口/类多用于容器语义：`Array<T>`、`Promise<T>`、`Record<K, V>`、`Map<K, V>`。',
            '滥用信号：写出一堆不约束的裸 `<T>` 时，先想想 unknown + 收窄是否更简单、更可读。',
          ],
          followUps: [
            {
              question: '写一个 getProperty<T, K extends keyof T>(obj: T, key: K): T[K]，它防住了什么错误？',
              points: [
                '防住两类错误：**键名拼错**（K 被约束为 keyof T，传入不存在的键直接编译报错）与**返回值类型不准**（T[K] 精确到属性类型，调用方无需断言）。',
                '对比：`(obj: any, key: string) => obj[key]` 完全丢检查；`Record<string, unknown>` 能防拼错但返回值全是 unknown，用前还得收窄。',
              ],
            },
            {
              question: '泛型什么时候需要和函数重载配合？',
              points: [
                '当**入参形态多样导致返回类型需要分支**时：`first(arr: T[])` 泛型即可，但 `query("user", id)` 返回 User、`query("list", ids)` 返回 User[] 就要重载声明 + 单一实现。',
                '实践：重载签名写在外面供调用方匹配，实现签名写在里面放宽即可；TS 从上到下匹配第一个命中的签名，顺序很重要。',
              ],
            },
          ],
        },
        {
          id: 'fe-ts-enum-const',
          title: '为什么很多团队禁用 enum？用 const 对象 + as const 怎么替代？',
          difficulty: 'basic',
          tags: ['TypeScript', 'enum'],
          points: [
            'enum 会生成**真实的运行时对象**；数字枚举历史上还有反向映射、可接受任意 number 赋值等宽松行为（TS 5.0 后部分收紧），且与 isolatedModules/Babel 转译存在兼容争议。',
            '**替代方案零运行时开销**：as const 对象 + 索引访问类型，与普通对象用法一致、类型与值同源维护。',
            'as const 把对象收窄为**字面量类型 + readonly**，配合 keyof 拿到键的联合类型。',
            '字符串 enum 相对安全（无反向映射），但同样产生运行时代码；`const enum` 虽被内联，但与 esbuild/swc 的单文件转译（isolatedModules）不兼容，跨包使用受限。',
            '需要"值对象带方法"的真枚举场景仍可用 enum；纯类型场景一律 as const。',
            '```ts\nconst STATUS = { todo: "todo", doing: "doing", done: "done" } as const\ntype Status = typeof STATUS[keyof typeof STATUS] // "todo" | "doing" | "done"\n```',
          ],
        },
        {
          id: 'fe-ts-narrowing',
          title: 'TypeScript 如何进行类型收窄？类型守卫有哪些写法？',
          difficulty: 'intermediate',
          tags: ['TypeScript', '类型守卫'],
          points: [
            '自动收窄依据：**typeof/instanceof**、**truthiness**（if (x)）、**相等比较**、**in 操作符**、**可辨识联合**（按 kind/tag 字段 switch）。',
            '**类型谓词** `function isFish(pet: Fish | Bird): pet is Fish`：返回 true 时调用方获得收窄；注意 TS 不校验实现，谓词写错编译器发现不了。',
            '**断言函数** `asserts condition` / `asserts x is T`：不满足直接抛错，调用点之后按断言后的类型继续分析。',
            '可辨识联合是业务建模利器：请求状态 `{ status: "loading" } | { status: "success", data } | { status: "error", msg }`，每个分支只拿到自己该有的字段。',
            '收窄会被**闭包与可变引用打断**（回调里 TS 不再保证），解决办法是先解构成 const 局部变量再进闭包。',
          ],
          followUps: [
            {
              question: '类型收窄为什么会被闭包"打断"？如何解决？',
              points: [
                '收窄基于**控制流分析**，但回调是**延迟执行**的：TS 无法保证执行时变量没被重新赋值，所以在闭包内退回原始联合类型。',
                '解决：进闭包前把值**解构为 const 局部变量**（`const tag = obj.tag`），不可变绑定让收窄安全沿用；属性收窄用提前 return + 可选链。',
              ],
            },
            {
              question: '类型谓词（pet is Fish）写错了编译器也不报错，怎么防范？',
              points: [
                '`x is T` 的实现 TS **不校验**：返回 true 但实际不是 Fish 会在下游埋雷。可靠做法是谓词内部用 instanceof/in 等可被引擎验证的判断。',
                '可辨识联合优先用 switch tag 字段让编译器穷举兜底；必要时给谓词函数补运行时断言或单测，编译器帮不上忙的地方只能靠纪律。',
              ],
            },
          ],
        },
        {
          id: 'fe-ts-keyof-typeof',
          title: 'keyof、typeof、索引访问类型分别做什么？',
          difficulty: 'intermediate',
          tags: ['TypeScript', '类型操作'],
          points: [
            '**keyof T** 取对象类型的**键的联合**；`keyof typeof obj` 是"从数据推导类型"的标准路径：先 typeof 把变量提升为类型，再 keyof 取键。',
            '**typeof**（类型上下文）把**变量/函数**转成类型，如 `type Config = typeof DEFAULT_CONFIG`——改配置自动同步类型，告别手写两份。',
            '**索引访问类型**：`T["a"]`、`T[keyof T]`、`Arr[number]`，可以从类型中"取属性"，配合 as const 的元组实现 `typeof ROUTES[number]`。',
            '**as const**：把对象/数组收窄为字面量类型 + readonly，是"常量即类型"方案的地基。',
            '组合示例：映射类型 `{ [K in keyof T]: ... }` 遍历键，是 Partial/Pick 等工具类型的实现基础。',
          ],
          followUps: [
            {
              question: 'typeof ROUTES[number] 这种写法是怎么工作的？去掉 as const 会怎样？',
              points: [
                '拆解：`typeof ROUTES` 得到只读元组 `readonly ["home", "about"]`；`[number]` 索引访问取**所有元素类型的联合** `"home" | "about"`。',
                '去掉 as const 后 ROUTES 推断为 `string[]`，联合退化为 string，字面量约束全部丢失——as const 是"常量即类型"的地基。',
              ],
            },
            {
              question: '映射类型里 as 重映射和修饰符加减怎么用？',
              points: [
                '映射时可增删修饰符：`-readonly` 去只读（Mutable）、`-?` 去可选（Required 的实现核心）。',
                '`as` 重映射可改键名或过滤：`{ [K in keyof T as T[K] extends Function ? K : never]: T[K] }` 只保留函数属性——**as + 条件类型**是高级工具类型的惯用套路。',
              ],
            },
          ],
        },
        {
          id: 'fe-ts-utility-types',
          title: 'Partial、Pick、Record 这些工具类型的实现原理是什么？',
          difficulty: 'intermediate',
          tags: ['TypeScript', '工具类型', '条件类型'],
          points: [
            '内置工具类型都是**映射类型 + 条件类型**的组合，能手写才算理解。',
            '`Partial<T>` = `{ [K in keyof T]?: T[K] }`；加 `-?`（**修饰符移除**）即 `Required<T>`；`Readonly<T>` 给每项加 readonly。',
            '`Pick<T, K>` = `{ [K2 in K]: T[K2] }`；`Omit` 是 `Pick<T, Exclude<keyof T, K>>` 的组合；`Record<K, V>` = `{ [P in K]: V }`。',
            '**条件类型** `T extends U ? X : Y` 提供分支能力；**分布式条件类型**：裸类型参数传入联合会逐成员分发，`Exclude<T, U>` = `T extends U ? never : T` 正是利用这一点。',
            '**infer** 在条件类型里声明待推断的占位：`ReturnType<T>` = `T extends (...args: any) => infer R ? R : never`；要禁止分发就写成 `[T] extends [U]` 包一层元组。',
          ],
          followUps: [
            {
              question: '为什么 Exclude 传联合类型会逐个分发？如何禁止分发？',
              points: [
                '条件类型作用于**裸类型参数**（T 直接位于 extends 左侧）时具有**分布式**：`Exclude<"a" | "b", "a">` 等价于两个分支的联合，逐成员判断后合并。',
                '禁止分发：把 T 包进**元组**写成 `[T] extends [U] ? X : Y`；`boolean` 会被分发成 `true | false` 是经典陷阱，同样用元组包裹解决。',
              ],
            },
            {
              question: '手写 DeepPartial 的思路是什么？',
              points: [
                '递归映射类型：`type DeepPartial<T> = T extends Function ? T : T extends object ? { [K in keyof T]?: DeepPartial<T[K]> } : T`——**Function 分支必须放条件最前**，否则函数会命中 object 分支被抹成 `{}`；注意数组分支（映射元素类型）与函数分支（保持原样）。',
                '细节：类实例递归可能破坏方法 this，实战常限制递归深度或对类类型不递归；`any` 会穿透约束，必要时用 `unknown` 兜底。',
              ],
            },
          ],
        },
        {
          id: 'fe-ts-tsconfig',
          title: 'strict 模式包含什么？哪些 tsconfig 选项对前端项目最关键？',
          difficulty: 'intermediate',
          tags: ['TypeScript', 'tsconfig', '工程化'],
          points: [
            '**strict** 是一组选项的集合：`strictNullChecks`（null/undefined 独立成类型，最重要）、`noImplicitAny`、`strictFunctionTypes`（函数参数逆变）、`strictPropertyInitialization`、`noImplicitThis`、`useUnknownInCatchVariables` 等。',
            '**模块相关**：`moduleResolution: "bundler"` 配打包器（支持 package.json exports）、`module: ESNext`、`isolatedModules`（每个文件可独立转译，esbuild/SWC/Babel 的前提）。',
            '**verbatimModuleSyntax**：强制 `import type` 显式区分类型与值导入，转译器不再靠猜测决定删除哪个 import。',
            '**严格度进阶**：`noUncheckedIndexedAccess`（索引访问补 undefined）、`exactOptionalPropertyTypes`（区分缺失与 undefined）、`noUnusedLocals/Parameters`。',
            '事实标准：`skipLibCheck: true` 跳过 d.ts 检查大幅提速；`paths` 别名必须与打包器配置同步，否则运行时解析不到模块。',
          ],
          followUps: [
            {
              question: 'isolatedModules 为什么是使用 esbuild/swc 的前提？',
              points: [
                '单文件转译器**一次只看一个文件**，无法做跨文件分析：const enum 的内联、仅类型 import 的删除都依赖全量类型信息，单文件视角无法正确处理。',
                'isolatedModules 强制代码可被单文件转译：类型导出必须 `export type`、const enum 受限；配合 verbatimModuleSyntax 显式区分类型与值导入。',
              ],
            },
            {
              question: 'paths 别名只配 tsconfig 会发生什么？正确做法是什么？',
              points: [
                'tsc 的 paths **只影响类型解析**，不参与运行时模块查找：类型检查全绿，打包/运行时却报找不到模块。',
                '同步方案：vite 的 resolve.alias、webpack 的 resolve.alias 与 tsconfig 保持一致；monorepo 直接用包名 + `moduleResolution: "bundler"` 按 exports 解析，减少双份配置。',
              ],
            },
          ],
        },
        {
          id: 'fe-ts-covariance',
          title: '什么是协变和逆变？为什么函数参数是逆变的？',
          difficulty: 'advanced',
          tags: ['TypeScript', '类型系统', '协变逆变'],
          points: [
            '**协变**保持子类型方向：`Dog[]` 可赋给 `Animal[]`（数组/对象/返回值协变）；**逆变**方向相反：参数上，需要 `(Dog) => void` 的位置可以传 `(Animal) => void`（逆变：源函数参数必须是目标参数的超类型，处理能力要"更宽"才安全）。',
            '直觉口诀：回调"**会收到什么**"按逆变检查（必须能处理更宽的输入），"**会产出什么**"按协变检查（产出必须够用）。',
            'TS 历史上函数参数是**双变**（协变+逆变都放行）以保易用；开启 `strictFunctionTypes` 后函数属性严格逆变，但**方法简写语法仍保持双变**（刻意保留的兼容性）。',
            '反例说明为何逆变更安全：把 `(e: MouseEvent) => void` 赋给期望 `(e: Event) => void` 的位置，回调里实际可能收到非 MouseEvent，访问 e.clientX 就会出错。',
            '数组协变本质不安全（运行时可塞入异类元素），TS 用运行时风险换表达力；真正类型安全的做法是 `ReadonlyArray` 或映射类型表达不可变协变。',
          ],
          followUps: [
            {
              question: 'strictFunctionTypes 为什么对 method 简写语法不生效？',
              points: [
                'TS 团队的**刻意兼容决定**：`method(): void` 简写（含构造函数、getter/setter）保持**双变**，因为大量 DOM 与既有类库依赖"参数更宽也可行"的事件方法写法。',
                '后果：同一个类里，方法简写的参数检查比属性式函数类型**宽松**；想要严格逆变就统一写 `fn: (e: Event) => void` 属性形式。',
              ],
            },
            {
              question: '举一个参数双变在真实代码里掩盖 bug 的例子。',
              points: [
                '典型：把 `(e: MouseEvent) => void` 赋给接受 `(e: Event) => void` 的监听器注册处，双变模式下编译通过，但回调可能收到**键盘/触摸事件**，访问 `e.clientX` 运行时是 undefined。',
                '逆变检查会直接指出"参数必须能处理 Event"；正确写法是回调参数声明为 Event，内部再 `instanceof MouseEvent` 收窄。',
              ],
            },
          ],
        },
        {
          id: 'fe-ts-declaration',
          title: '如何为 JS 库编写类型声明？模块扩充（module augmentation）是干什么的？',
          difficulty: 'advanced',
          tags: ['TypeScript', 'd.ts', '声明文件'],
          points: [
            '`.d.ts` 只写类型不写实现：全局声明用 `declare var/function/class`；模块声明用 export 描述，或对无类型的第三方包写 `declare module "pkg"`。',
            '类型来源优先级：**库自带类型**（package.json 的 types/exports types 条件）→ 社区 **@types/pkg**（DefinitelyTyped）→ 本地 shims 手写（如 vite-env.d.ts 对 .vue 的声明）。',
            '**模块扩充**：`declare module "vue-router" { interface RouteMeta { title: string } }` 给已有接口加字段，是扩展第三方库类型的正规手段，必须写在模块文件内才生效。',
            '**declare global** 在模块内扩展全局（如给 window 挂自定义属性）；`/// <reference types="vite/client" />` 引入环境类型。',
            '发布库：`tsc --emitDeclarationOnly` 或打包器 dts 插件生成声明，package.json 的 types 字段与 exports 的 types 条件要指向正确入口。',
          ],
          followUps: [
            {
              question: 'declare module "pkg" 和模块扩充（在模块内重开 interface）有什么区别？',
              points: [
                '顶层 `declare module "pkg"` 是**整体声明**：为无类型包兜底描述导出形状；写在有 import/export 的模块文件内且只声明局部成员时，才表现为**扩充合并**。',
                '模块扩充的典型用法：`import "vue-router"` 后 `declare module "vue-router" { interface RouteMeta { title: string } }` 给已有接口加字段，必须写在**模块文件**内才触发合并，写错位置会变成覆盖。',
              ],
            },
            {
              question: '给 window 挂自定义属性，类型应该怎么声明？',
              points: [
                '在模块文件内用 `declare global { interface Window { __APP_CONFIG__: AppConfig } }`——模块内不能直接重开全局 interface，必须走 declare global。',
                '配套纪律：全局属性尽量收敛为一个命名空间对象，避免任意挂载；用 `satisfies` 或显式类型约束初始化处，防止声明与赋值脱节。',
              ],
            },
          ],
        },
      ],
    },
    {
      id: 'fe-react',
      name: 'React',
      description: '从 Hooks 用法到 Fiber 与并发原理的分层考察，React 岗位面试的绝对重心。',
      references: [
        { label: 'React 官方文档', url: 'https://react.dev' },
        { label: 'React Learn 章节', url: 'https://react.dev/learn' },
        { label: 'React GitHub 仓库', url: 'https://github.com/facebook/react' },
        { label: 'React 旧版文档', url: 'https://legacy.reactjs.org' },
      ],
      questions: [
        {
          id: 'fe-react-vdom',
          title: '什么是虚拟 DOM？它解决了什么问题？',
          difficulty: 'basic',
          tags: ['React', '虚拟 DOM'],
          points: [
            '虚拟 DOM 是**用 JS 对象描述真实 DOM** 的轻量抽象（React Element：`{ type, props }`），状态变化先在 JS 层 diff 出最小变更，再最小化地操作真实 DOM。',
            '解决的核心问题是**声明式编程下的正确性与效率**：开发者只声明 UI = f(state)，框架负责找到变更点，避免手写命令式更新带来的遗漏和不一致。',
            '注意：**虚拟 DOM 并不比精心手写的原生操作快**；它的价值是把大量小更新批量化、把正确性交给框架，并带来**跨平台能力**（可渲染到 Native、SSR 字符串）。',
            'JSX 不是虚拟 DOM：JSX 只是语法糖，编译产物是 jsx() 调用，返回 Element 对象。',
            '现代 React 的优化重心已从"更快的 diff"转向**跳过不必要的渲染**（memo、React Compiler 自动记忆化）。',
          ],
        },
        {
          id: 'fe-react-key',
          title: 'key 在 React 中起什么作用？为什么不能用数组下标？',
          difficulty: 'basic',
          tags: ['React', 'key', 'diff'],
          points: [
            'key 是同层兄弟元素在**多次渲染间的身份标识**：diff 按 type + key 匹配，匹配上则复用实例只更新 props，匹配不上则卸载重建。',
            '用**下标作 key** 时，插入/删除/排序会让元素"身份错位"：第 i 位仍被当作原来那个元素，导致**组件内部状态错乱**（输入框串值）、effect 与 DOM 复用错误。',
            'key 需在兄弟间**稳定且唯一**，通常用数据 id；`Math.random()`/时间戳每次渲染都变，等于强制全部重建，性能更差。',
            'key 变化也是**强制重置组件**的惯用手段：改 key 让 React 重新初始化表单或页面组件（如路由参数变化时）。',
            'key 只在**同层比较**中有意义，React 的 diff 不做跨层移动。',
          ],
        },
        {
          id: 'fe-react-controlled',
          title: '受控组件和非受控组件的区别？分别适用什么场景？',
          difficulty: 'basic',
          tags: ['React', '表单'],
          points: [
            '**受控**：表单值由 React state 驱动（`value` + `onChange`），数据流单向、可即时校验/联动/格式化；**非受控**：DOM 自持值，用 `defaultValue` + `ref` 在需要时读取。',
            '受控的代价：每次输入都触发重渲染，大表单要注意性能；好处是状态在 React 侧，便于回显、与全局状态联动。',
            '非受控适合：`<input type="file">`、富文本、无需联动的简单表单，避免无谓重渲染。',
            '经典坑：给 input 传了 value 却没有 onChange（或 value 在 null/undefined 间切换）会报错且**无法输入**；要允许清空需用 `value ?? ""`。',
            '"外部状态变化时重置非受控表单"的惯用法：给元素加 key，key 变则 DOM 重建、defaultValue 重新生效。',
          ],
        },
        {
          id: 'fe-react-communication',
          title: 'React 组件之间有哪些通信方式？',
          difficulty: 'basic',
          tags: ['React', '组件通信'],
          points: [
            '**父 → 子**：props；**子 → 父**：回调函数（父把函数作为 props 传入）。',
            '**兄弟/跨层级**：状态提升到共同父级（Lift State Up）；跨多层避免 props 逐层透传用 **Context**（主题、语言、当前用户等低频全局数据）。',
            '**全局状态**：Redux/Zustand/Jotai 等外部 store；**服务端状态**交给 TanStack Query/SWR（缓存、重试、失效重取）。',
            '**ref 暴露实例**：React 19 中 ref 可直接作为 prop（18 及以前用 forwardRef），配合 `useImperativeHandle` 精确控制暴露面（如 focus、scrollTo 方法）。',
            '事件总线/window 全局事件是逃生舱，破坏数据流可追溯性，仅在跨框架或遗留代码中酌情使用。',
          ],
        },
        {
          id: 'fe-react-usestate',
          title: 'setState 之后发生了什么？函数式更新和批量更新是怎么回事？',
          difficulty: 'basic',
          tags: ['React', 'useState', '批量更新'],
          points: [
            'setState 触发**重渲染调度**而非同步更新：React 重新执行组件函数拿到新 JSX，diff 后提交 DOM；所以 setState 后立刻读 state 是旧值。',
            '同一事件里多次 `setCount(count + 1)` 基于同一旧快照，结果只加 1；**函数式更新** `setCount(c => c + 1)` 基于最新队列值，多次累加才正确。',
            'React 18 起**自动批量更新**覆盖所有场景（事件、setTimeout、Promise、原生事件）；需要立即刷出用 `flushSync`。',
            'setter 用 **Object.is** 比较新旧 state，相等则跳过渲染（浅比较）；引用类型必须返回新对象才会触发更新。',
            'state 若由 props 派生，应"渲染期间直接计算"或用 key 重置，而不是用 effect 同步到新 state（镜像 props 是反模式）。',
          ],
          followUps: [
            {
              question: 'setTimeout 里 setState 还会批量合并吗？',
              points: [
                '**会**：React 18 的 createRoot 下**自动批处理覆盖所有环境**——setTimeout、Promise.then、原生事件里多次 setState 同样合并为一次渲染。',
                '历史差异：React 17 只在合成事件与生命周期里批处理，异步回调里逐次渲染；需要同步刷出时用 `flushSync`（慎用，会破坏并发调度）。',
              ],
            },
            {
              question: '如何实现点击一次连续加 3？为什么必须用函数式更新？',
              points: [
                '`setCount(c => c + 1)` 连写三次：三个 updater **按序入队**，渲染时基于最新值依次套用，结果 +3。',
                '`setCount(count + 1)` 连写三次：三次都基于**同一次渲染闭包的旧快照**，入队的是三个相同目标值，结果只 +1。',
                '本质：state 是"本次渲染的快照"，事件处理函数整个执行期间读到的都是同一个值。',
              ],
            },
          ],
        },
        {
          id: 'fe-react-useeffect',
          title: 'useEffect 和 useLayoutEffect 的区别？清理函数何时执行？',
          difficulty: 'intermediate',
          tags: ['React', 'Hooks', '副作用'],
          points: [
            '**useEffect**：提交后**异步**执行、不阻塞绘制，适合订阅、日志、数据请求；**useLayoutEffect**：DOM 更新后、**浏览器绘制前同步**执行，适合"先测量 DOM 再同步调整"避免闪屏。',
            '**清理函数**：在下一次 effect 重新执行**之前**和组件卸载时运行，用于取消订阅、清定时器、AbortController 中断请求。',
            '依赖数组按**引用比较**：对象/数组/函数每次都是新引用就会重跑；要么真依赖，要么 memo 化，禁止用"撒谎的依赖"骗过 lint（改用 ref 保存非依赖值）。',
            'effect 里做数据请求要用**忽略标志或 AbortController** 防竞态（慢请求覆盖快请求）；服务端状态更推荐 TanStack Query/SWR 管理。',
            'React 18 严格模式开发环境会 **mount → unmount → mount** 执行一次，故意暴露未正确清理的 effect；正确写法应保证重复挂载无副作用。',
          ],
          followUps: [
            {
              question: '为什么建议"每件关心的事一个 effect"而不是合并成一个大 effect？',
              points: [
                '多个 effect **独立运行与清理**：拆开后各自的依赖数组最小化，任一依赖变化只触发对应逻辑，无关副作用不被连带重跑。',
                '合并版一个依赖变化就整体重跑，cleanup 也要全部执行一遍；拆分让清理职责单一，避免清理顺序引发的 bug。',
              ],
            },
            {
              question: 'useEffect 里 setState 导致无限循环的典型原因是什么？',
              points: [
                '根因是"**effect 修改了自身依赖**"：依赖数组里放对象/数组（每次渲染新引用），effect 里 setState 触发重渲染 → 新引用 → effect 再跑，死循环。',
                '另一典型：把 props **镜像进 state** 再用 effect 同步（反模式），应改为渲染期直接派生或用 key 重置。',
                '信号：DevTools Profiler 提交次数暴增；修复方向是依赖改原始值/useMemo 稳定引用，而不是删依赖数组。',
              ],
            },
          ],
        },
        {
          id: 'fe-react-memo',
          title: 'memo、useMemo、useCallback 分别解决什么问题？什么时候该用？',
          difficulty: 'intermediate',
          tags: ['React', '性能优化', 'Hooks'],
          points: [
            '**useMemo/useCallback** 缓存"计算值/函数引用"，跨渲染保持引用相等；**memo** 是组件级缓存——props 浅比较不变则跳过重渲染。',
            '三者要配合才生效：子组件 memo 后，传入的**内联函数/对象仍是新引用**，需要 useCallback/useMemo 包住，否则 memo 形同虚设。',
            '默认策略是"渲染了再说"：多数组件重渲染很便宜，**先测量（React DevTools Profiler / Highlight updates）再优化**；大列表、重组件树、频繁更新的祖先组件才值得包。',
            '不要滥用：useMemo 自身有依赖比较与缓存成本，小计算反而更慢；把 useMemo 当"保证引用稳定"的语义手段而非万能补丁。',
            '新方向：**React Compiler** 自动做组件与值的记忆化，逐步减少手写 memo/useMemo/useCallback 的必要。',
          ],
          followUps: [
            {
              question: 'memo 只做浅比较，传对象 prop 怎么办？',
              points: [
                '首选 **useMemo/useCallback 稳定引用**：父组件把对象、数组、回调包起来，让 props 引用跨渲染稳定。',
                '兜底：给 memo 传**自定义比较函数** `memo(Comp, (prev, next) => deepEqual(prev.data, next.data))`——深比较本身有成本，且容易掩盖"状态放错位置"的设计问题。',
              ],
            },
            {
              question: '把所有组件都包上 memo 会更快吗？为什么不会？',
              points: [
                '**不会**：memo 有比较成本，props 经常变化的组件每次都要"比较 + 渲染"两份开销；多数组件重渲染远比比较便宜。',
                '收益只在**渲染昂贵 + props 稳定 + 祖先频繁更新**三个条件同时成立时出现；无脑包裹还会诱导层层 useCallback/useMemo，复杂度反噬。',
                '正确路径：Profiler 找出真正慢的提交再针对性优化；React Compiler 时代编译器自动判断，进一步降低手写必要。',
              ],
            },
          ],
        },
        {
          id: 'fe-react-context',
          title: 'Context 的更新原理和使用陷阱是什么？',
          difficulty: 'intermediate',
          tags: ['React', 'Context'],
          points: [
            '原理：消费组件在 Fiber 上记录对 context 的依赖，Provider 的 value 变化时**所有消费者被标记并强制重渲染**——这会绕过中间组件的 memo（除非子树被 memo 隔离且自身不消费）。',
            '陷阱一：value 是内联对象 → Provider 每次渲染都产生新引用 → **所有消费者全量重渲染**；标准解法是 useMemo 稳定 value。',
            '陷阱二：单一 Context 同时装"高频状态"和"低频方法"，任何变化都波及全部消费者；应**拆分状态 Context 与 dispatch Context**。',
            '适用边界：Context 适合**低频全局数据**（主题、i18n、登录用户）；高频变化（输入框、鼠标位置）应下沉为局部状态或改用外部 store 的 selector 订阅（如 Zustand）。',
            'createContext 的 defaultValue 只在**组件树上方没有任何 Provider** 时生效，且 Provider 所在组件的重渲染本身也会重新渲染其子树。',
          ],
          followUps: [
            {
              question: '如何避免 Context 更新导致的整树重渲染？',
              points: [
                '**value 稳定 + 拆分**：useMemo 包住 value；把高频状态与 dispatch 拆成两个 Provider（dispatch 天然稳定），消费者只订阅自己需要的。',
                '**children 穿透**：Provider 的 children 由外部传入时引用稳定，配合 memo 可让不消费 context 的子树跳过重渲染。',
                '终极方案：改用 useSyncExternalStore + 外部 store（Zustand/Jotai），selector 订阅做到"值没变就不渲染"。',
              ],
            },
            {
              question: '为什么 react-redux 等库不再推荐用 Context 传 store？',
              points: [
                'Context 的模型是"**Provider value 变 → 所有消费者重渲染**"，粒度停留在消费者组件级，无法表达"只订阅 state 的某个切片"。',
                'selector 订阅基于 **useSyncExternalStore**：store 变更后组件用自己的 selector 算值并与上次浅比较，**不等值才渲染**——粒度精细到值的相等性，这是 Context 结构上做不到的。',
              ],
            },
          ],
        },
        {
          id: 'fe-react-diff',
          title: 'React 的 diff 算法有哪些策略？和 Vue 的 diff 有什么不同？',
          difficulty: 'intermediate',
          tags: ['React', 'diff', '虚拟 DOM'],
          points: [
            '三大前提假设：① 不同 type 的元素**销毁重建**整个子树；② **同层比较**，不做跨层移动；③ 同层列表靠 **key** 识别身份。',
            '列表 diff：按 key 建立映射，**单遍扫描**复用旧节点、处理插入删除；React 不计算最优移动方案，靠稳定的 key 让"移动"表现为顺序变化。',
            'Vue3 采用**双端比较 + 最长递增子序列（LIS）**求最少移动次数；这是两者最常被对比的差异点。',
            'type 相同则复用 Fiber 实例只更新 props；type 不同（或组件函数引用每次渲染都变）连子树一起重建——这就是"组件内联定义导致子组件反复卸载"的坑。',
            'diff 的产出是**副作用 flags 清单**（插入/更新/删除），commit 阶段统一处理，保证一次提交的原子性。',
          ],
          followUps: [
            {
              question: 'React 为什么选择单遍扫描而不是 Vue 的双端 + LIS？',
              points: [
                'React 的取舍是**简单与可预测**：O(n) 单遍 + key 映射已足够快，把"减少移动"的责任交给开发者（稳定 key），换来实现简单、行为可预期。',
                'Vue3 的 LIS 理论移动次数更少但实现复杂；React 把优化重心放在**跳过渲染**（memo/并发）而非更聪明的移动算法——方向不同。',
                '答题要点：两者假设一致（同层 + key），差异只在"同层内如何处理移动"。',
              ],
            },
            {
              question: '组件内联定义（render 里定义子组件）为什么会破坏 diff？',
              points: [
                '每次渲染都产生**新的组件函数引用**，diff 时元素 type 不同 → React 判定为"不同组件" → **卸载重建整个子树**，子组件内部状态全部丢失。',
                '修复：子组件提到模块顶层；需要注入数据时传 props 或用 context，而不是闭包嵌套定义。',
              ],
            },
          ],
        },
        {
          id: 'fe-react-state-management',
          title: 'Redux、Zustand、Jotai 各自的设计思想是什么？如何选型？',
          difficulty: 'intermediate',
          tags: ['状态管理', 'Redux', 'Zustand'],
          points: [
            '**Redux**：单一 store、**action → reducer 纯函数**、不可变更新（现推荐 Redux Toolkit + Immer），中间件与 devtools 生态成熟；强项是可追溯与大型团队规范，代价是样板代码。',
            '**Zustand**：一个 create 出极简外部 store，**selector 粒度订阅**（`useStore(s => s.count)`），无 Provider 无样板，天然规避 Context 整树重渲染问题。',
            '**Jotai**：**原子化（atom）模型**，状态组成依赖图，按需派生与订阅，适合细粒度状态与派生计算。',
            '选型直觉：**服务端数据**（请求缓存、重试、失效）优先 TanStack Query/SWR；**客户端共享状态**小中型项目 Zustand 足够；强审计、复杂工作流上 Redux Toolkit；组件内部状态永远先考虑 useState。',
            '共同原则：状态**最小化与就近**，能从源头推导的不存副本；不可变更新是 React 检测变化的基础。',
          ],
          followUps: [
            {
              question: '为什么说"服务端状态"和"客户端状态"应该分开管理？',
              points: [
                '服务端数据本质是**远端数据的缓存副本**：过期、重校验、竞态、重试、分页去重是它独有的问题，手工塞进 Redux 要写大量样板且容易漏。',
                'TanStack Query/SWR 把"缓存 + 失效 + 重取"做成声明式能力：key 即缓存键、staleTime 控新鲜度；客户端状态（UI、草稿）才归 Zustand/Jotai。',
                '混放代价：接口返回进全局 store 后还要手工维护"数据什么时候算旧"——这正是很多项目 Redux 膨胀的根源。',
              ],
            },
            {
              question: 'Zustand 的 selector 订阅是如何避免 Context 整树重渲染问题的？',
              points: [
                'store 独立于 React 渲染体系：`useStore(selector)` 订阅后，store 变更会逐个通知订阅者，**selector 结果经 Object.is 比较相等才跳过渲染**。',
                '底层是 **useSyncExternalStore**：把外部 store 桥接进 React，getSnapshot 返回 selector 结果，订阅粒度由 selector 决定而非 Provider 结构。',
              ],
            },
          ],
        },
        {
          id: 'fe-react-performance',
          title: 'React 有哪些性能优化手段？',
          difficulty: 'intermediate',
          tags: ['React', '性能优化'],
          points: [
            '**减少渲染量**：memo + useCallback/useMemo 稳定引用、**状态下沉**（把频繁变化的 state 放进最小子组件）、Context 拆分、长列表虚拟化（TanStack Virtual/react-window）。',
            '**减少计算量**：用 Profiler 定位慢组件，重计算 useMemo，路由级懒加载 `React.lazy` + Suspense 按需加载代码。',
            '**结构正确**：避免内联定义组件（每次渲染都是新 type 导致子树重建）、避免无谓的包裹层、key 保持稳定。',
            '**并发特性**：输入过滤大列表用 `useDeferredValue`/`startTransition` 把非紧急更新标记为**可中断的低优先级**，保住输入响应。',
            '**数据层**：请求缓存去重交给 TanStack Query；配合图片懒加载、SSR 首屏；先测量再优化，Profiler 火焰图定位是起点。',
          ],
          followUps: [
            {
              question: '状态下沉（colocation）是怎么减少重渲染的？举个例子。',
              points: [
                '把**频繁变化的 state 移到唯一消费它的最小子组件内部**：输入框 value 放进 SearchInput 自己持有，顶层不再因每次键入重渲染整棵树。',
                '典型反例：顶层放 searchQuery 导致所有兄弟组件跟着渲染；修复是"input 自持状态 + 提交时上抛"，或用 useDeferredValue 把消费与更新解耦。',
              ],
            },
            {
              question: '长列表虚拟化为什么能提升渲染性能？有什么代价？',
              points: [
                '原理：只渲染**可视区 ± 缓冲区**条目，DOM 从上万降到几十，diff 与 commit 规模被限制在常数级（react-window/TanStack Virtual）。',
                '代价：滚动位置维护、不定高估算、全量搜索需要旁路索引；对"渲染贵的行"收益最大，行本身很轻时收益有限——先 Profiler 再上虚拟化。',
              ],
            },
          ],
        },
        {
          id: 'fe-react-error-boundary',
          title: 'React 的 Error Boundary 是什么？哪些错误它捕获不到？',
          difficulty: 'intermediate',
          tags: ['React', 'Error Boundary', '异常处理'],
          points: [
            '**Error Boundary** 是一种 React 组件，用 `static getDerivedStateFromError()`（渲染备用 UI）+ `componentDidCatch(error, errorInfo)`（记录日志）捕获**子组件树**里的渲染期错误，兜住"白屏"这种最伤可用性的故障。类组件实现，或用 react-error-boundary 库；函数组件没有对应 Hook，社区方案的内部仍是类组件。',
            '**边界粒度是设计题**：不能整页一个 EB 包到底（一处错全页换兜底图），要按**故障域分包**——路由级包一层、独立卡片/侧栏/图表各包各的，局部崩了局部降级，主流程照常。兜底 UI 要给"重试"出口（重新渲染 key 或重置状态）。',
            '**捕获不到的错误（必考）**：① **事件处理函数**里的异常（try-catch 自己包，或全局 window.onerror 兜底）；② **异步代码**（setTimeout、Promise 链，用 window.onunhandledrejection / 统一请求层捕获）；③ 服务端渲染（SSR）错误；④ **Error Boundary 自身及其子组件的事件回调**；⑤ React 19 起 `onUncaughtError`/`onCaughtError` root 回调可作为全局补充。能主动列全"捕获不到"清单，才是真的用过。',
            '与监控联动：componentDidCatch 里上报 **组件栈（componentStack）+ 版本号 + 用户操作路径**，配合 sourcemap 还原——这是前端监控体系里渲染错误的数据源头。',
          ],
          followUps: [
            {
              question: '生产环境的全局异常监控体系怎么搭？',
              points: [
                '分层捕获：**渲染错误**（Error Boundary + componentDidCatch 上报）→ **异步/运行时错误**（window.onerror、unhandledrejection）→ **资源加载错误**（error 捕获阶段监听 script/img）→ **接口错误**（统一请求层拦截，区分业务码与 HTTP 错误）→ **跨域脚本错误**（script 加 crossorigin + CORS 响应头，否则只有 "Script error."）。',
                '治理要点：**sourcemap 还原**（map 文件只上传监控平台不下发生产）、**聚合与降噪**（同错误指纹聚合计数，参考 ops 方向的告警治理思路）、**采样与配额**（高频错误限流上报避免打爆）、**版本维度看板**（新版本错误率环比，回归发版前发现劣化）。',
              ],
            },
          ],
        },
        {
          id: 'fe-react-actions',
          title: 'React 19 的 Actions 解决了什么？useActionState 和 useOptimistic 怎么用？',
          difficulty: 'intermediate',
          tags: ['React 19', 'Actions', 'useActionState', 'useOptimistic'],
          points: [
            '**Actions 是什么**：把"表单提交/异步变更"这类动作的**pending、错误、乐观状态管理**内置成一等公民——`<form action={fn}>` 的 fn 可以是异步函数，React 自动管理提交期间状态；配套三个 Hook：`useActionState`（状态 + action 函数 + pending）、`useOptimistic`（乐观 UI）、`use()`（读取 Promise/context 挂起渲染）。与并发特性题分工：那题讲 startTransition 的渲染机制，本题讲 Actions 这套**异步动作的状态范式**。',
            '**useActionState 的形态**：`const [state, formAction, pending] = useActionState(async (prevState, formData) => {...}, initialState)`——**prevState 链式传递**让错误/结果自然成为下一次提交的输入（替代手写 useState + try/catch + finally 的样板）；**pending 由 React 跟踪**，按钮禁用/loading 不再需要自己维护标志位（且天然避免竞态：React 知道哪个 action 是当前的）。',
            '**useOptimistic 的正确心智**：提交瞬间渲染"假定成功"的 UI（点赞立刻 +1），`useOptimistic(realState)` 在**transition 期间**返回乐观值、失败或结束后自动回滚到真实值——注意它**只该用于"回滚不伤人"的场景**（点赞、关注），金额、库存这类需要真实确认的不适合乐观；与手写乐观更新对比：手写要处理回滚、乱序、清理三件事，Hook 把"乐观区间"的生命周期交给了 React。',
            '**渐进增强加分点**：`<form action>` 在**JS 还没加载时也能提交**（纯 HTML 表单行为，配 Server Actions 时服务端直接处理）——弱网/慢设备的首个可用时间提前；这是"JS 优先"时代的回摆，与 RSC 的理念一脉相承（见 RSC 题）。',
            '什么时候不用：复杂多步流程（向导式表单）的联动状态用 reducer/状态机更清晰；Actions 的甜区是**"一个异步动作 + pending + 结果/错误 + 可选乐观"** 这个形状——能识别出这个形状并知道边界，比无脑套新 API 更显水平。',
          ],
          followUps: [
            {
              question: '乐观更新失败回滚时，用户已经看到了成功 UI，体验上怎么处理？',
              points: [
                '回滚是技术动作，**体验要靠沟通**：回滚时给明确的失败反馈（toast/inline 错误），而不是默默弹回让用户困惑"我刚才点了吗"；已聚焦的输入框回滚后保持焦点与草稿（乐观 UI 只覆盖展示层，不动用户输入源）。',
                '进阶：**乐观队列**——连续快速操作（连点多个赞）时乐观状态要按序叠加、失败只回滚该笔而不是整批；再考虑服务端最终态与乐观态的合并冲突（别人同时改了同一条数据，回滚后要不要重新拉取）——乐观 UI 的复杂度全在"失败之后"，面试官问这个就是在探你的实际深度。',
              ],
            },
          ],
        },
        {
          id: 'fe-react-fiber',
          title: 'React Fiber 是什么？它解决了什么问题？',
          difficulty: 'advanced',
          tags: ['React', 'Fiber', '调度'],
          points: [
            'Fiber 是 React 16 起的**新协调引擎**：把渲染工作拆成一个个 **Fiber 节点**（链表结构 child/sibling/return），以**可中断、可恢复**的增量方式完成协调，解决旧架构递归 diff 不可中断、长任务阻塞输入的问题。',
            '双阶段模型：**render/reconciliation 阶段可中断**（纯计算、无副作用，可重入），**commit 阶段同步不可中断**（操作 DOM、执行 layout effect，保证一致性）。',
            'Fiber 节点同时是**工作单元**，携带 flags（插入/更新/删除）与副作用链表；优先级用 **lane 模型**表示，决定调度顺序。',
            '**调度**基于 MessageChannel 的任务切片 + 优先级：高优先级更新（输入）可打断低优先级渲染（transition），这是并发特性的底层支撑。',
            '并非所有更新都切片：离散输入等紧急更新仍走同步渲染，transition 更新才启用可中断渲染。',
          ],
          followUps: [
            {
              question: 'render 阶段为什么必须可重入且无副作用？',
              points: [
                '可中断意味着**同一次渲染可能被丢弃重来**（高优先级插入、时间片用尽后重跑）：render 若有副作用会执行多次或执行不完整。',
                '所以 render 阶段只做**纯计算**（产出 flags 与新 props），一切副作用推迟到**同步不可中断的 commit 阶段**——这是"render 必须纯净"在架构层面的解释。',
              ],
            },
            {
              question: '双缓冲（current 与 workInProgress 树）是做什么的？',
              points: [
                'Fiber 同时维护两棵树：**current**（屏幕上正在显示的）与 **workInProgress**（内存中构建的下一帧），节点间用 alternate 互相指向。',
                'render 在 workInProgress 上工作，commit 时整体切换指针——构建过程对用户不可见，可随时中断丢弃重来，用户始终看到完整一致的界面。',
              ],
            },
          ],
        },
        {
          id: 'fe-react-hooks-principle',
          title: 'Hooks 的实现原理是什么？为什么不能放在条件语句里？',
          difficulty: 'advanced',
          tags: ['React', 'Hooks', 'Fiber'],
          points: [
            'Hook 状态存放在 **Fiber 节点的 memoizedState 链表**上，每个 Hook 按调用顺序占一个节点；**调用顺序即索引**——条件/循环/提前 return 会改变顺序，导致读到别的 Hook 的状态，这就是"只在顶层调用"的原因。',
            'useState 的更新：setter 生成 update 对象进入**更新队列**并调度重渲染；渲染时按队列依次套用到基础值上得出最终 state（函数式更新的实现基础）。',
            'useEffect 在**提交阶段之后**比较 deps（浅比较），变化才把 effect 挂入副作用链；cleanup 与 effect 成对存放在 fiber 上，按序执行。',
            '闭包陷阱的根源：**每次渲染都是独立快照**（新 props/state/函数），effect 闭包捕获的是当次渲染的变量——"过期闭包"的本质。',
            '自定义 Hook 只是复用"调用序列"，状态并不共享：每次调用在各自 Fiber 上独立建链，这是 Hooks 能自由组合而互不干扰的原因。',
          ],
          followUps: [
            {
              question: '如何理解"每次渲染都有自己的 props 和 state"？',
              points: [
                '组件函数每次渲染是**一次独立调用**：本次的 props/state 是渲染时捕获的**常量快照**，事件回调与 effect 闭包引用的都是这次快照——"setState 后旧回调读到旧值"是设计不是 bug。',
                '推论：要读最新值用函数式更新或 ref（ref 是跨渲染的可变容器）；要刻意锁定快照（如防竞态）反而要利用这个特性。',
              ],
            },
            {
              question: 'eslint 的 react-hooks/exhaustive-deps 是怎么检查依赖完整性的？',
              points: [
                '静态分析组件函数体：收集 effect/useCallback/useMemo 回调里**引用的所有外部变量**，与依赖数组逐项比对，缺失则告警。',
                '边界：ref.current、模块级变量不要求进依赖；故意省略依赖的正确替代是**用 ref 保存**或把逻辑移进 effect，而不是 eslint-disable。',
              ],
            },
          ],
        },
        {
          id: 'fe-react-concurrent',
          title: 'React 18/19 的并发特性有哪些？startTransition 和 useDeferredValue 有什么区别？',
          difficulty: 'advanced',
          tags: ['React', '并发', 'React 19'],
          points: [
            'React 18 核心：**并发渲染**能力 + 四个入口——`createRoot`、自动批处理、**流式 SSR（Suspense）**、transition API（`startTransition`/`useTransition`/`useDeferredValue`）。',
            '**startTransition**：把更新标记为**低优先级可中断**，让位于输入等紧急更新；**useDeferredValue**：让"某个值的消费"延迟一拍，新旧两份内容都渲染（紧急版本立即上屏）——前者标记"这次更新不急"，后者表达"这个值的消费可以慢一点"。',
            '**Suspense** 从代码分割的 loading 边界扩展为通用异步边界：与流式 SSR 配合实现 HTML 分段发送与选择注水。',
            '**React 19**：**Actions**（`useActionState`/`useFormStatus`/`useOptimistic`）把表单异步提交、pending 态、乐观更新标准化；`use()` 可在渲染中读取 Promise 与 Context；ref 成为普通 prop，`forwardRef` 不再必需。',
            '配套方向：**React Server Components**（服务端组件不进客户端 bundle）、**React Compiler** 自动记忆化，共同减少手动优化代码。',
          ],
          followUps: [
            {
              question: 'startTransition 和 useDeferredValue 的语义差异是什么？分别什么时候用？',
              points: [
                '**startTransition** 包住"更新本身"：本次 setState 被标记低优先级可被输入打断，适合"状态更新触发的重计算"（tab 切换、搜索结果渲染）。',
                '**useDeferredValue** 包住"值的消费"：值立即更新，消费它的渲染延迟一拍用旧值，适合"同一状态既驱动输入框又驱动昂贵列表"，无需控制 setState 位置。',
                '共同点：都可中断、都不是防抖——需要节流还得配合 debounce；能改 setState 处用 startTransition 更直接，改不了（第三方受控组件）用 useDeferredValue。',
              ],
            },
            {
              question: 'useOptimistic 的乐观更新是如何工作的？失败后怎么办？',
              points: [
                '提交时**立即用乐观值渲染**（如消息先上屏显示发送中），真实请求后台执行；完成后 React 自动用服务端结果**替换乐观状态**。',
                '失败：action 抛错时乐观状态**自动回滚**到原值，配合 useActionState 返回错误信息提示重试——比手写"先 setState 再 catch 回滚"竞态更少。',
              ],
            },
          ],
        },
      ],
    },
    {
      id: 'fe-vue',
      name: 'Vue',
      description: '响应式原理、diff 与 Composition API 是核心，考的是"懂框架"而不只是"用框架"。',
      references: [
        { label: 'Vue 官方文档（中文）', url: 'https://cn.vuejs.org' },
        { label: 'vuejs/core GitHub 仓库', url: 'https://github.com/vuejs/core' },
        { label: 'Pinia 官方文档', url: 'https://pinia.vuejs.org' },
        { label: 'Vue Router 官方文档', url: 'https://router.vuejs.org' },
      ],
      questions: [
        {
          id: 'fe-react-rsc',
          title: 'React Server Components 是什么？它和 SSR 有什么本质区别？',
          difficulty: 'advanced',
          tags: ['React', 'RSC', 'Next.js'],
          points: [
            '**RSC（服务端组件）是"组件在服务端运行、产物不是 HTML 而是序列化的 UI 描述"**：Server Component 只在服务端执行一次，把渲染结果（React Server Format，一种类 RSC Payload 的中间描述）流式发给客户端，客户端按描述 hydrate/拼装。它**不进入客户端 bundle**——组件代码、依赖库全部留在服务端。',
            '**与 SSR 的本质区别（高频混淆点）**：SSR 是**首屏渲染策略**——组件仍要下载到客户端、重新执行、hydrate 成可交互应用（"在服务端渲染一遍再在客户端渲染一遍"）；RSC 是**组件的运行位置划分**——Server Component 根本不下载不 hydrate，天然零客户端 JS 成本。SSR 交付的是"更快的 HTML"，RSC 交付的是"更小的 bundle + 直接访问服务端能力"。',
            '**Server Component 的能力与限制**：能直接 `async/await` 取数据库、读文件、调内部服务（fetch 免走公网）、用 API 密钥不泄露；**不能**用 state/effect/浏览器 API、不能绑定事件——需要交互的部分标 `\'use client\'` 拆成 Client Component，二者可在组件树里**交错嵌套**（Client Component 的 children 可以是 Server Component）。',
            '**为什么大方向是对的**：数据获取从"客户端瀑布"（先下载 JS → 发请求 → 再渲染）变成"服务端直连数据源一次完成"；markdown 解析器、语法高亮这类重依赖只在服务端跑，客户端只收结果。Next.js App Router 是 RSC 的主流落地，Meta 的做法是**按"是否需要交互/状态"划组件归属**，而不是按页面一刀切。',
          ],
          followUps: [
            {
              question: 'RSC 下数据怎么传给 Client Component？序列化有什么限制？',
              points: [
                'props 从 Server 传向 Client 必须可被 **React 序列化协议**编码：支持普通对象、数组、字符串、数字、Date、Map/Set、Promise、BigInt；**不支持**函数（包括事件处理器）、class 实例（自定义原型会丢）、Symbol。想要服务端能力就传"数据"，行为留在客户端定义。',
                '进阶约定：Server 侧可以传 **Promise 作为 prop**（客户端用 `<Suspense>` 接住，流式到达），传函数的反向需求用 **Server Actions**（`\'use server\'`：客户端调用的函数在服务端执行，本质是一个 RPC 端点，常配 `useActionState` 做表单提交）。能讲到"RSC Payload + Server Actions = 客户端和服务端的双向通道"，这道题就到顶了。',
              ],
            },
          ],
        },
        {
          id: 'fe-vue-vif-vshow',
          title: 'v-if 和 v-show 有什么区别？分别适用什么场景？',
          difficulty: 'basic',
          tags: ['Vue', '条件渲染'],
          points: [
            '**v-if** 是**真正的条件渲染**：惰性创建/销毁（初始为 false 不渲染），切换触发组件销毁与重建，切换开销高；可搭配 v-else-if/v-else。',
            '**v-show** 只是切换 CSS `display`：元素始终编译并保留，初始渲染开销高（无论条件如何都渲染）、切换开销低。',
            '场景：**频繁切换用 v-show**（Tab 内容、悬浮面板）；**条件很少变化或含重组件用 v-if**（权限区块、路由级区块）。',
            'Vue3 中 v-if 与 v-for 同元素连用时 **v-if 优先级更高**（无法访问 v-for 的变量），官方与 lint 都禁止同元素并用。',
            'v-if 销毁组件会**丢失状态**；需要保留状态可用 v-show 或 `<KeepAlive>` 缓存组件实例。',
          ],
        },
        {
          id: 'fe-vue-computed-watch',
          title: 'computed 和 watch 的区别与使用场景？',
          difficulty: 'basic',
          tags: ['Vue', 'computed', 'watch'],
          points: [
            '**computed**：声明**派生值**，基于响应式依赖**惰性求值 + 缓存**——依赖不变直接返回缓存，多次读取只算一次；getter 必须真的用到响应式依赖，否则不更新。',
            '**watch**：声明**副作用**，监听数据变化**执行回调**（异步逻辑、请求、DOM 操作），无缓存概念，支持 immediate/deep/once 等选项。',
            '选择标准："得到一个值"用 computed，"执行一个动作"用 watch；**watch 一个 computed 再把结果赋给 data 是典型反模式**（应该直接用 computed）。',
            'computed 的 getter 应当**纯**：不修改状态、不发请求；副作用一律放 watch/watchEffect。',
            'watch 监听 reactive 对象默认深层；监听 getter 返回的对象需要 deep 或比较引用，注意引用不变但内部变化的情况。',
          ],
          followUps: [
            {
              question: 'computed 的缓存什么时候失效？为什么 getter 里发请求是反模式？',
              points: [
                'computed 是带 **dirty 标记的 lazy effect**：依赖变化只把 dirty 置 true（不立即重算），**下次读取时**才重算并更新缓存——没人读就永远不算。',
                'getter 应当纯：发请求是副作用，读取次数不可控（模板多处引用、DevTools 检查都会触发读取），可能重复请求；副作用一律放 watch/watchEffect。',
              ],
            },
          ],
        },
        {
          id: 'fe-vue-ref-reactive',
          title: 'ref 和 reactive 有什么区别？为什么需要 .value？',
          difficulty: 'basic',
          tags: ['Vue', '响应式', 'ref'],
          points: [
            '**reactive** 基于 **Proxy** 包装对象，深层自动响应；局限：**不能整体替换**（替换后失去响应）、解构/展开后丢失响应、只支持对象类型。',
            '**ref** 是**包装器**：`.value` 持有任意值（含原始值），访问 .value 时收集依赖、赋值时触发更新；值为对象时内部自动用 reactive 转换。',
            '.value 存在的原因：**Proxy 只能代理对象**，原始值（number/string/boolean）无法被直接劫持，必须包一层 { value } 对象；模板中的自动解包是编译期/渲染层的语法糖。',
            '最佳实践：**组合式函数与跨层传递统一用 ref**；reactive 用于局部状态组；解构 reactive 前用 `toRefs` 保住响应性。',
            '性能优化位：`shallowRef`/`shallowReactive` 跳过深层转换，大对象用"整体替换 .value"的方式触发更新。',
          ],
          followUps: [
            {
              question: '为什么 reactive 对象解构后会失去响应性？',
              points: [
                '解构取出的是**普通值/普通引用**：响应式建立在"通过 Proxy 访问属性"这个动作上（track/trigger），脱离代理对象的读写不再被拦截。',
                '修复：`toRefs(state)` 把每个属性转成 ref 保住响应，或保持 `state.x` 的访问方式；解构即快照。',
              ],
            },
            {
              question: 'ref 的自动解包发生在哪些位置？数组/集合里会解包吗？',
              points: [
                '解包位置：**模板渲染上下文**中的顶层 ref；**reactive 对象内部嵌套的 ref**（读写自动解包）。',
                '不解包：**数组与 Map/Set 中的 ref**——必须手动 `.value`；`<script setup>` 的模板解包是编译期语法糖，进入普通函数（如 setTimeout 回调）后要显式 .value。',
              ],
            },
          ],
        },
        {
          id: 'fe-vue-composition-api',
          title: 'Composition API 相比 Options API 解决了什么问题？',
          difficulty: 'basic',
          tags: ['Vue', 'Composition API'],
          points: [
            'Options API 按**选项类型**（data/methods/computed/watch）切分代码，同一功能的逻辑被撕成碎片，组件一大就要"跳来跳去"；Composition API 按**功能组织**，相关逻辑放在一起。',
            '**逻辑复用**从 mixin（命名冲突、来源不明、隐式耦合）升级为**组合式函数**（useXxx 返回 ref）：来源清晰、类型友好、可 tree-shake。',
            '**TypeScript 支持更好**：不再依赖 this 上下文推导类型，纯函数签名天然可标注。',
            '两种 API 在 Vue3 中共存且底层一致（都是响应式系统 + 渲染函数）；Options API 未废弃，简单小组件依然直观。',
            '`<script setup>` 是 Composition API 的编译糖：更少样板、顶层 await、常量提升，是官方推荐写法。',
          ],
        },
        {
          id: 'fe-vue-lifecycle',
          title: 'Vue 组件的生命周期有哪些？每个阶段适合做什么？',
          difficulty: 'basic',
          tags: ['Vue', '生命周期'],
          points: [
            '**创建阶段**：`setup()`（Composition API 的入口，替代 beforeCreate/created，此时还没有 this 与响应式视图）→ 组件实例初始化完成、props/事件就绪，**数据请求常放这里**（最早发起，省一个生命周期的时间）。',
            '**挂载阶段**：`onBeforeMount`（模板编译完还未渲染，很少用）→ `onMounted`（**DOM 就绪**：测量尺寸、初始化需要 DOM 的第三方库、图表/编辑器实例、焦点管理都在这）。',
            '**更新阶段**：`onBeforeUpdate`（数据变了、DOM 还没变，可取旧 DOM）→ `onUpdated`（DOM 已按新数据更新；**注意不要在这里改响应式数据**，会死循环）。',
            '**销毁阶段**：`onBeforeUnmount`（实例还在，清理还来得及）→ `onUnmounted`（清理定时器、事件监听、WebSocket、取消未完成请求）。**清理不彻底 = 内存泄漏**，是生命周期题的落点：`onMounted` 里注册的每一项，都要在卸载钩子里注销。',
          ],
          followUps: [
            {
              question: '父组件和子组件的生命周期执行顺序是怎样的？',
              points: [
                '挂载：**父 beforeMount → 子 beforeMount → 子 mounted → 父 mounted**——父先开始渲染，遇到子组件递归完成，最后父的 mounted 才触发（"父等待子"）。更新同理：父 beforeUpdate → 子 beforeUpdate → 子 updated → 父 updated。',
                '销毁：**父 beforeUnmount → 子 beforeUnmount → 子 unmounted → 父 unmounted**。记忆口径：钩子触发总是"父的 before 先到，子的完成先到"。',
                '引申：keep-alive 缓存的组件不触发 unmounted，而是 activated/deactivated——这是 KeepAlive 题的入口，能连起来讲说明生命周期是真的理解了。',
              ],
            },
          ],
        },
        {
          id: 'fe-vue-reactivity',
          title: 'Vue3 的响应式原理是什么？为什么用 Proxy 替代 Object.defineProperty？',
          difficulty: 'intermediate',
          tags: ['Vue', '响应式', 'Proxy'],
          points: [
            'Vue3 用 **Proxy** 拦截 get/set/has/deleteProperty/ownKeys 等 5 类 trap（Proxy trap 共 13 种，Vue 只用 5 类）：读时**依赖收集**（track：属性 → effect 的映射，结构为 WeakMap(target) → Map(key) → Set(effect)），写时**触发更新**（trigger）。',
            '相比 defineProperty 的提升：**惰性代理**（访问到才递归，无需初始化全量遍历）、**新增/删除属性可侦测**（Vue2 需要 $set/$delete）、**数组索引与 length** 直接响应、还能代理 Map/Set。',
            '依赖清理：effect 重新运行前先**清空旧依赖再收集**，避免分支切换后残留无效订阅；computed 是带 dirty 标记的 lazy effect，实现缓存。',
            '组件渲染函数本身就是一个 effect；watch/watchEffect/computed 复用同一套 effect 系统，scheduler 控制时机——去重后经 nextTick **批量异步更新**。',
            '边界：原始值必须 ref 包装；`Object.freeze` 的对象不会被代理；深层大对象可用 shallow 版本降开销。',
          ],
          followUps: [
            {
              question: 'Vue2 的 $set 解决什么问题？Vue3 里还有这个问题吗？',
              points: [
                'Vue2 用 defineProperty 劫持，**无法侦测"新增属性"与数组索引直接赋值**，必须 `Vue.set`/`arr.splice` 绕过——Vue2 最大的心智负担之一。',
                'Vue3 的 Proxy 用 set/deleteProperty 等 5 类 trap 拦截，**新增、删除、索引赋值全部可侦测**，$set/$delete 已移除；剩余边界只有"原始值需 ref"与"freeze 对象不代理"。',
              ],
            },
            {
              question: 'EffectScope 是做什么的？组合式函数为什么需要它？',
              points: [
                'EffectScope **批量收集并统一停止**作用域内创建的 effect（computed/watch/watchEffect）：setup 时自动建立，卸载时整体 dispose，无需逐个记 stop。',
                '组件外场景：store、工具函数里创建的 watch 用 `effectScope().run(() => ...)` 包住并提供 `scope.stop()`——这是组合式函数不泄漏副作用的关键。',
              ],
            },
          ],
        },
        {
          id: 'fe-vue-watch-watcheffect',
          title: 'watch 和 watchEffect 有什么区别？各自的适用场景？',
          difficulty: 'intermediate',
          tags: ['Vue', 'watch', '副作用'],
          points: [
            '**watch**：**显式声明监听源**（ref/reactive/getter），默认惰性，**回调拿到新值与旧值**，适合"数据变了 → 做某事"且需要旧值的场景。',
            '**watchEffect**：**立即执行一次**并自动收集回调内的响应式依赖，依赖变化后重新执行；写法简洁但依赖隐式化，拿不到旧值。',
            '**清理副作用**：回调签名中的 `onCleanup` 函数在下次触发前与停止时调用，是取消请求、防竞态的首选位置。',
            '**flush 选项**：pre（默认，组件更新前）/ post（DOM 更新后）/ sync（同步，慎用）；post 可替代大部分 updated 钩子场景。',
            '在 setup 同步调用时组件卸载会**自动停止**；异步上下文（setTimeout 内）创建的要手动 stop，或用 effectScope 统一管理。',
          ],
          followUps: [
            {
              question: 'watch 的 onCleanup 是如何防竞态的？',
              points: [
                '搜索场景：输入 a 发请求、再输入 ab 又发请求，若先发的后返回，会用**旧结果覆盖新结果**——典型异步竞态。',
                'onCleanup 在**下次触发前**执行：把上一次的 AbortController abort（或置 ignore 标志），回调里丢弃过期响应，保证"最后触发的请求结果才生效"。',
              ],
            },
            {
              question: '在 setTimeout 里创建的 watch 为什么不会自动停止？如何治理？',
              points: [
                '自动停止依赖**当前活跃的 effectScope**：setup 同步执行期间存在组件作用域；异步回调执行时作用域已不活跃，watch 变成游离副作用，卸载后仍在运行（泄漏）。',
                '治理：异步创建的必须 `const stop = watch(...)` 并在合适时机 stop；或统一用 `effectScope().run()` 包住管理；组件内尽量把 watch 放在 setup 顶层同步区。',
              ],
            },
          ],
        },
        {
          id: 'fe-vue-nexttick',
          title: 'nextTick 是做什么的？为什么修改数据后不能立刻拿到更新后的 DOM？',
          difficulty: 'intermediate',
          tags: ['Vue', 'nextTick', '异步更新'],
          points: [
            'Vue 的更新是**异步批量**的：同一 tick 内多次修改状态，effect 去重后**只渲染一次**，渲染 flush 被推进**微任务队列**（Promise.then，降级 setTimeout）。',
            '修改数据后立即读 DOM 读到的是**旧 DOM**；`await nextTick()` 把回调排到渲染 flush **之后**，此时拿到最新 DOM。',
            '价值：批量去重避免了"一次交互 N 次状态变更 → N 次重渲染"；nextTick 是暴露给用户的"渲染后钩子"。',
            '典型场景：更新列表后滚动到底部、操作刚渲染的 DOM、测试中断言渲染结果。',
            '与 watch 的关系：默认 flush: pre 的 watch 回调在**组件更新前**执行；flush: post 则在更新后，等价于 nextTick 时机。',
          ],
          followUps: [
            {
              question: '连续点击按钮修改同一个 ref 三次，DOM 更新几次？',
              points: [
                '**一次**：三次修改触发的是同一个渲染 effect 的三次调度，去重后只推进微任务队列一份，flush 时只渲染一次。',
                '推论：若在每次修改之间插入 `await nextTick()`，则每次都等到渲染完成，DOM 更新三次——nextTick 的价值正在于"渲染后时机"。',
              ],
            },
            {
              question: '为什么 Vue3 的 nextTick 基于 Promise？如果同步执行渲染会怎样？',
              points: [
                '微任务保证"**当前同步代码全部执行完再渲染**"：同一 tick 的多次修改合并、用户代码能在渲染前完成准备；实现按 Promise.then → MutationObserver → setTimeout 降级。',
                '若同步渲染：一次交互 N 次修改就是 N 次全量 diff + DOM 更新，且"先读后写"的中间状态会被渲染出来——性能与正确性双输。',
              ],
            },
          ],
        },
        {
          id: 'fe-vue-pinia',
          title: 'Pinia 和 Vuex 有什么区别？为什么 Pinia 成为官方推荐？',
          difficulty: 'intermediate',
          tags: ['Vue', 'Pinia', '状态管理'],
          points: [
            '**去 mutation**：Pinia 的 action 直接修改 state（支持 async），不再有 action → commit → mutation 的样板链，devtools 仍可追踪。',
            '**天然模块化**：一个 store 一个 `defineStore`，互相 import 组合，没有 Vuex 的 modules/namespaced 层级与命名空间心智。',
            '**TypeScript 体验好**：state/getters/actions 全自动类型推导，无需 Vuex 复杂的泛型声明。',
            '**组合式 API 原生**：store 内可用 ref（state）、computed（getter）、函数（action），与 setup 心智一致；支持 $reset（options 写法）、订阅与插件生态（如持久化插件）。',
            '底层仍是 Vue 响应式系统（reactive/effectScope），按需引入不打包冗余；跨 store 调用是直接函数引用，便于拆分与测试。',
          ],
          followUps: [
            {
              question: 'Pinia 的 store 之间如何互相调用？循环依赖怎么办？',
              points: [
                '直接在 action 里调用：`const other = useOtherStore()` 拿到实例后正常读写——store 是函数创建的惰性实例，天然支持组合。',
                '循环引用：setup 写法的 store 互相 import 时，**把调用放在 action 内部（运行时执行）**而不是模块顶层，否则拿到的是未初始化的 undefined。',
              ],
            },
            {
              question: 'Pinia 的状态持久化怎么做？直接把整个 store 存 localStorage 有什么问题？',
              points: [
                '官方姿势：pinia-plugin-persistedstate 声明式配置 **paths 只持久化需要的字段**，序列化与写入时机由插件统一管理。',
                '整 store 直存的坑：localStorage 同步 IO 阻塞主线程、响应式对象/函数无法序列化、临时 UI 状态被持久化成脏数据；token 类敏感信息进 localStorage 另有 XSS 风险。',
              ],
            },
          ],
        },
        {
          id: 'fe-vue-vmodel',
          title: 'v-model 的实现原理是什么？组件上怎么自定义 v-model？',
          difficulty: 'intermediate',
          tags: ['Vue', 'v-model', '双向绑定'],
          points: [
            'v-model 是**语法糖**，本质是"value 绑定 + input 事件回写"两件事：`<input v-model="text">` 编译成 `:value="text"` + `@input="text = $event.target.value"`。**它不是双向数据流**——数据到视图是响应式更新，视图到数据是事件回写，单向数据流原则并没有被破坏。',
            '**不同元素绑定的事件不同**：原生 input/textarea 是 input 事件；checkbox/radio 用 checked + change；组件上默认是 `modelValue` prop + `update:modelValue` 事件（Vue 3），Vue 2 是 value + input。',
            '**自定义组件 v-model（Vue 3）**：组件内 `defineProps<{ modelValue: string }>()` 接收，更新时 `emit(\'update:modelValue\', 新值)`；`<script setup>` 里有捷径——`defineModel<string>()` 返回一个读写即同步的 ref，宏内部替你做了 props + emit 样板。',
            '**修饰符原理**：`.lazy` 把 input 事件换成 change（失焦才同步）；`.number` 用 parseFloat 转型；`.trim` 去首尾空格。Vue 3 还支持**多个 v-model**（`v-model:title="t"` 对应 modelValue 换名）与自定义修饰符（`modelModifiers` prop 里判断），能讲出"绑定名可参数化"说明理解到协议层。',
          ],
          followUps: [
            {
              question: 'v-model 和 sync 修饰符、单向数据流有什么关系？为什么子组件不能直接改 props？',
              points: [
                'Vue 2 的 `.sync` 是 v-model 的多路版本（`:title.sync` 语法糖 = `:title` + `@update:title`），Vue 3 已合并进参数化的 v-model——说得出这段演进史，能体现版本理解。',
                '**单向数据流的原因**：props 的变更是父组件触发的重新渲染，子组件直接改 props 会破坏"数据只有一个写入口"的契约，父子各自改同一份数据时**变更不可追溯**（谁改的、什么顺序，完全失控）。子组件想改的正确姿势：emit 事件让父改，或用 v-model 把"改"的通道显式声明出来。',
                '对象/数组 prop 的坑：直接改对象内部属性"能生效"（引用没换），但这仍是反模式——监控不到、约定崩坏，code review 一票否决。',
              ],
            },
          ],
        },
        {
          id: 'fe-vue-router',
          title: 'Vue Router 的 hash 模式和 history 模式有什么区别？导航守卫怎么用？',
          difficulty: 'intermediate',
          tags: ['Vue Router', '路由', 'SPA'],
          points: [
            '**hash 模式**：URL 里 `#/path`，路由变化只改 **# 后面的部分**——hash 变化**不会发请求**，靠 `hashchange` 事件监听。优点：无需服务端配置，任何静态托管都能跑；缺点：URL 带 # 不美观，且 SEO 与锚点语义受限。',
            '**history 模式**：用 **History API**（`pushState/replaceState` 改 URL 不刷新页面 + `popstate` 监听前进后退）。URL 干净；代价是**直接访问/刷新深层路径会 404**——浏览器真向服务器发起了 `/user/123` 请求，服务端必须把所有路径**回退到 index.html**（nginx `try_files $uri /index.html`），即所谓"fallback/重写"配置。',
            '**导航守卫三级**：**全局**（`beforeEach` 鉴权拦截、`afterEach` 埋点/改标题）、**路由独享**（`beforeEnter`）、**组件内**（`beforeRouteEnter/Update/Leave`——Leave 里做"表单未保存拦截"）。异步鉴权用 `next()`/返回值控制：返回 `false` 取消、返回路由对象重定向，Vue Router 4 支持 Promise 风格。',
            '工程要点：路由**懒加载**（`() => import(\'...\')` 按需分包，首屏优化标配）；守卫里的**异步竞态**（快速切换路由时旧鉴权结果回来污染新页面，用路由元信息比对或取消旧请求）；404 用 `/:pathMatch(.*)*` 兜底。',
          ],
          followUps: [
            {
              question: 'history 模式的 404 问题在 nginx 里具体怎么配？静态托管还有别的方案吗？',
              points: [
                'nginx 标准写法：`location / { try_files $uri $uri/ /index.html; }`——先找真实文件（JS/CSS 资源命中即返回），找不到统一回退 index.html 交给前端路由。注意**只对页面路径回退**，接口路径（/api）绝不能回退，否则错误被吞成 200 的 HTML，前端解析出一堆玄学问题。',
                '其他方案：静态托管平台（Vercel/Netlify/GitHub Pages）配 SPA rewrite 规则；或干脆 hash 模式零配置。工程判断：有 SEO 要求或 URL 美观要求选 history + 服务端 fallback，纯内部工具 hash 最省事。',
              ],
            },
          ],
        },
        {
          id: 'fe-vue-keepalive',
          title: 'KeepAlive 缓存组件的原理是什么？activated 和 deactivated 什么时候触发？',
          difficulty: 'intermediate',
          tags: ['Vue', 'KeepAlive', '性能优化'],
          points: [
            '**KeepAlive 是抽象组件**：包裹动态组件时，组件切换**不销毁实例**，而是把 vnode 从真实 DOM 摘下后存入**缓存容器**（内部 Map + LRU 淘汰策略），再次渲染时直接从缓存取回并重新插入 DOM——状态（表单、滚动位置、数据）完整保留。',
            '**一对专属生命周期钩子**：被缓存的组件**进入**视口时触发 `onActivated`，**离开**时触发 `onDeactivated`——替代 mounted/unmounted 承担"进入刷新数据、离开暂停轮询"的职责。**首次进入 activated 与 mounted 都触发**；组件被真正销毁（缓存淘汰或 KeepAlive 卸载）时才走 unmounted。',
            '**三个属性控制缓存面**：`include`（匹配才缓存）/ `exclude`（匹配不缓存）/ `max`（上限 + **LRU 淘汰**最久未访问的实例，防内存无限涨）。匹配依据是组件的 name 选项——这也是"组件要显式命名"的一个工程理由。',
            '典型场景与边界：列表页 ↔ 详情页往返保留列表筛选状态（配路由 meta 决定哪些页缓存）；**注意**：缓存组件里的定时器/事件监听不会自动暂停，"离开页继续轮询"是 KeepAlive 场景的经典 bug——暂停逻辑必须挂在 onDeactivated。',
          ],
          followUps: [
            {
              question: 'KeepAlive 和 v-if/v-show 在"保留状态"上有什么本质区别？什么场景不该用 KeepAlive？',
              points: [
                '**v-show** 只是 display 切换，实例常驻、始终活着，适合**频繁显隐的小块 UI**（tab 面板）；**KeepAlive** 面向**路由/组件级切换**——实例从渲染树摘除（不占渲染开销）、按需缓存，适合"页面级"的往返场景。v-if 则完全销毁重建，什么都不保留。',
                '不该用的场景：数据必须每次新鲜的页面（缓存了反而是 bug，要么不缓存要么 activated 里强制刷新）；表单敏感页（后台切回要重新鉴权）；内存敏感的移动端长列表（缓存的实例连着大 DOM 树，配 max 收敛）。能用"缓存 = 用内存换交互连续性"的口径收尾，说明取舍讲清了。',
              ],
            },
          ],
        },
        {
          id: 'fe-vue-3-5',
          title: 'Vue 3.5 更新了什么？响应式 props 解构为什么不丢响应性了？',
          difficulty: 'intermediate',
          tags: ['Vue 3.5', '响应式', 'useTemplateRef'],
          points: [
            '**Reactive Props Destructure 转正**：Vue 3.5 前解构 props 会断开响应（解构发生在 setup 一次，拿到的是当时的值快照），必须 `toRefs(props)`；3.5 编译器把解构**编译回 `props.x` 访问**（编译期转换，零运行时开销）——`const { count = 0, onDone } = defineProps<...>()` 直接可用且保持响应式，默认值也由编译器处理。能讲出"**是编译宏魔法不是运行时代理**"这点，说明理解了实现本质。',
            '**响应式系统重写（内存降约 56%）**：3.5 重构了响应式内核——依赖用**双向链表 + 版本计数**替代原来的 Map/Set 结构（effect 的依赖清理不再遍历删除，断链即删），大幅减少对象与 Map 开销；这是"响应式原理"题（见响应式系统题）在最新版本的落点，老资料讲的 dep.subs 结构已经换代——用旧八股答新版本会被识破。',
            '**新 API 三件**：`useTemplateRef()`（模板引用的响应式写法，替代"ref 变量名与模板字符串精确匹配"的脆弱约定——重命名重构不再静默失效）；`onWatcherCleanup()`（watcher 竞态清理：新回调触发前清理上一次的副作用，如 abort 上一个请求——解决"快速切换选项时旧请求晚到覆盖新结果"的经典竞态，思想与 React 的 cleanup 一致）；`useId()`（SSR/CSR 一致的稳定 id，hydration 友好——与 SSR 题的 mismatch 主题呼应）。',
            '**Lazy Hydration 与延迟传送**：3.5+ 支持 `hydrate-on-visible` 等策略（组件可见才注水）与 Teleport 的 defer——同构应用的 TTI 优化补齐了与 React 流式注水对齐的能力（与 SSR 题衔接）。答题结构建议：按"**开发者体验（props 解构/useTemplateRef）→ 内核性能（响应式重写）→ 同构能力（useId/lazy hydration）**"三层讲，展示的是版本演进的理解框架而不只是背 changelog。',
          ],
          followUps: [
            {
              question: '为什么 Vue 官方说 3.5 的响应式"内存占用降低 56%"？链表结构好在哪？',
              points: [
                '旧结构的两个开销：dep（属性）与 effect（副作用）之间用 Map/Set 双向登记，**依赖变化时要集合删除操作**（key 遍历、hash 计算），且每个依赖关系都是对象级开销；组件大量响应式属性 × 大量 effect 时内存与清理成本线性放大。',
                '新结构把依赖关系做成**链表节点**（dep 与 sub 互指），清理 = 断开指针 O(1)；配合**版本号/脏检查**跳过未变化的属性通知（track 时记版本，trigger 时比对）——"该通知的才通知、该清理的 O(1) 清理"。用数据结构视角讲框架优化（对照 React 的 fiber 链表化）是高级感的来源：**框架演进的共同主线是用链表/版本换 Map/Set 与重复计算**。',
              ],
            },
          ],
        },
        {
          id: 'fe-vue-signals',
          title: 'Signals（细粒度响应式）为什么是前端框架的共同趋势？和 VDOM diff 差在哪？',
          difficulty: 'advanced',
          tags: ['Signals', '响应式', 'Svelte', '性能'],
          points: [
            '**Signal 是什么**：一个"**带订阅关系的值容器**"——读取时自动登记"谁在依赖我"（自动依赖追踪），写入时**只通知精确的订阅者**更新；组件渲染本身也是一个 effect（依赖的 signal 变了才重跑那一小块）——**更新的粒度是"信号级"的，不是组件级的**。与 Vue 响应式题分工：那题讲 Vue 3 的 Proxy 实现，本题讲跨框架的 Signals 范式与 VDOM 的路线之争。',
            '**与 VDOM diff 的路线对比（本题的主线）**：React 模型是"**状态变了 → 重跑组件函数 → 生成新 VDOM → diff 打补丁**"——通用（任意 JS 状态都能驱动）但**做了一层多余的中间表示**（diff 本身是运行时开销）；Signals 模型是"**状态变了 → 精确知道哪个 DOM 节点依赖它 → 直接改那个节点**"——**跳过 diff，更新路径 O(精确订阅数)**；代价是状态必须是"可追踪的"（要包在 signal 里，心智上有约束）。一句话：**VDOM 用通用性换简单心智，Signals 用约束换更新效率**。',
            '**各家落地形态（视野加分）**：**Solid.js**（Signals 原生 + 无重渲染：组件函数只跑一次，彻底的细粒度）；**Svelte 5 Runes**（`$state/$derived/$effect`——编译器把声明式语法编译成信号操作）；**Vue**（响应式系统本就是 signals 思想，**Vapor Mode** 去掉 VDOM 直接操作 DOM 的编译路线）；**Preact Signals**（给 React 生态的移植尝试，反衬 React 官方的保守）；**TC39 Signals 提案**（信号原语进入 JS 标准的讨论——框架们共同向底层收敛的信号）。',
            '**React 为什么不变（必被追问）**：React 的价值在**渲染模型的简单一致**（"UI = f(state)" 一切重跑，配合并发特性调度）+ 庞大生态的兼容成本；Signals 的"组件只跑一次"改变了心智模型（条件分支里不能随便创建 signal、对迁移不友好）；React 官方的答案是 **React Compiler**（编译期自动记忆化，用编译解决性能而不是改模型）——两条路线都成立，是"运行时调度 vs 编译期优化"的经典分野（与 Babel/SWC 题的编译思想呼应）。',
            '收束：Signals 的本质是把"**依赖追踪**"做进状态层（Angular/Preact/Vue/Solid 全员收敛证明了这个方向）；面试的完整答案 = 讲清粒度差异 + 各家实现 + React 的取舍——而不是站队说谁赢。',
          ],
          followUps: [
            {
              question: 'Signal 的自动依赖追踪是怎么实现的？为什么读取要在"追踪上下文"里才生效？',
              points: [
                '实现机制：全局维护一个**当前正在运行的作用域指针**（正在执行的 effect/组件）——signal 的 **get** 把当前作用域登记进自己的订阅者集合，**set** 时遍历订阅者重新调度；没有作用域时读取就是普通取值（不建立订阅）——这就是"读取要发生在 computed/effect/组件渲染里才被追踪"的原因（**动态依赖**：本轮执行读了什么就依赖什么，条件分支变了依赖也自动变）。',
                '进阶细节：**glitch 防护**（diamond 依赖——a 改了 b、c 都重算、d 依赖 b 和 c 只该跑一次：拓扑排序按层级批量更新，Solid/Vue 的实现都有这个）；**相等性检查短路**（set 同值不触发）；这是把"响应式图的调度"做成一个微型增量计算引擎——答到 glitch 这层就到顶了。',
              ],
            },
          ],
        },
        {
          id: 'fe-vue-diff',
          title: 'Vue3 的 diff 算法是怎么做的？key 的作用与注意点？',
          difficulty: 'advanced',
          tags: ['Vue', 'diff', 'key'],
          points: [
            '前置优化：编译器生成 **PatchFlag** 并做**静态提升**、收集 **block tree**（动态节点平铺），运行时 diff 只遍历**动态节点**，跳过静态内容——"靶向更新"。',
            '同级子节点 diff：先**头尾同步预处理**（sync from start/end）缩小范围，剩余部分才进入核心比较。',
            '核心是**最长递增子序列（LIS）**：对新列表中可复用的旧节点求 LIS，序列内节点不动，其余做移动/插入/删除——**移动次数最少**。',
            'key 是节点的**身份**：无 key 走"就地复用"（按位置 patch，输入框等状态易错位）；有 key 才能精确移动。key 必须稳定唯一，禁用随机数；纯静态不增删的列表用 index 才算安全。',
            '与 React 的差异：React 单遍扫描 + key 映射，Vue3 双端 + LIS 理论上移动开销更优；两者都建立在"同层比较"假设上。',
          ],
          followUps: [
            {
              question: '静态提升和 block tree 分别优化了什么？',
              points: [
                '**静态提升**：静态节点/属性在编译期提到 render 函数外只创建一次，重渲染直接复用引用——省创建开销，diff 也直接跳过。',
                '**Block Tree**：block 收集所有后代**动态节点**平铺成数组，更新时只遍历这个数组做靶向更新——diff 范围从"整棵树"降为"动态节点数"，深层嵌套也不再递归。',
                '共同前提：模板是受约束 DSL，编译期就能区分静态与动态；手写渲染函数享受不到。',
              ],
            },
            {
              question: 'Vue2 的双端 diff 和 Vue3 的 LIS diff 有什么区别？',
              points: [
                'Vue2 双端：新旧列表**头尾四个指针**两两比较 + 复用，能较好处理反转、旋转类移动，但中间乱序部分的定位靠逐个比对，效率一般。',
                'Vue3：先**头尾同步**缩小范围（吸收双端优点），中间乱序部分用"新节点 → 旧位置"映射求**最长递增子序列**，LIS 内不动、只动序列外节点——移动次数理论上最少。',
              ],
            },
          ],
        },
        {
          id: 'fe-vue-compiler',
          title: 'Vue3 的编译优化有哪些？为什么模板比手写渲染函数更快？',
          difficulty: 'advanced',
          tags: ['Vue', '编译器', '性能'],
          points: [
            '模板是**受约束的 DSL**，编译期可做完整静态分析：**静态提升**（静态节点提到 render 外只创建一次）、**预字符串化**（大量静态内容合并为字符串常量）、**cacheHandler**（缓存事件处理函数，避免子组件无谓更新）。',
            '**PatchFlag**：给动态节点打标记（TEXT/CLASS/PROPS/CHILDREN 等），运行时 patch 只比对标记的字段，不做全量 props 对比。',
            '**Block Tree**：动态子节点被平铺收集进 block 的 dynamicChildren，更新时**跳过静态层级直达动态节点**——diff 范围从 O(整树) 降为 O(动态节点数)。',
            '手写 h() 渲染函数无法获得这些优化（信息只能在编译期确定），这就是"模板比手写快"的原因。',
            '手动档延伸：`v-memo` 按依赖数组缓存子树、`v-once` 完全跳过更新，用于极端性能场景，注意失效条件。',
          ],
          followUps: [
            {
              question: 'v-memo 和 v-once 分别用在什么场景？有什么失效风险？',
              points: [
                '`v-once`：渲染一次永不更新，适合纯静态内容（条款、文案）；风险是数据变化后视图"冻住"，误用在动态内容上就是 bug。',
                '`v-memo="[dep1, dep2]"`：依赖不变则**跳过整个子树的 diff**，适合 v-for 长列表的行级优化；依赖数组必须包含行内所有动态依赖，漏一项就渲染陈旧 UI。',
              ],
            },
            {
              question: '编译优化依赖"模板受约束"，哪些写法会让优化退化？',
              points: [
                '动态组件、动态插槽、`v-html` 等让结构在编译期不可知：dynamicChildren 收集失效，回退到**全量 diff**；手写 h() 则完全得不到静态提升与 PatchFlag。',
                '应对：保持模板结构稳定、用 v-if/v-else 显式分支替代动态拼装；性能敏感区块用 v-memo 手动兜底。',
              ],
            },
          ],
        },
      ],
    },
    {
      id: 'fe-browser',
      name: '浏览器原理',
      description: '渲染流水线、同源策略与存储体系——理解浏览器，才能理解前端的一切约束。与"计算机基础 → 计算机网络"的同题分工：输入 URL、HTTP 版本等经典题在此聚焦**浏览器渲染进程与前端配合**，网络链路与协议细节在计算机基础方向。',
      references: [
        { label: 'MDN Web API 参考', url: 'https://developer.mozilla.org/en-US/docs/Web/API' },
        { label: 'MDN CORS 文档', url: 'https://developer.mozilla.org/en-US/docs/Web/HTTP/CORS' },
        { label: 'MDN PWA 指南', url: 'https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps' },
        { label: 'web.dev（Google Web 平台）', url: 'https://web.dev' },
      ],
      questions: [
        {
          id: 'fe-browser-from-url',
          title: '从输入 URL 到页面渲染完成，中间发生了什么？',
          difficulty: 'basic',
          tags: ['浏览器', '网络', '渲染'],
          points: [
            '**URL 解析与网络**：DNS 解析（缓存 → 递归查询）→ 检查强缓存/协商缓存 → TCP 三次握手 + TLS 握手（HTTP/3 用 QUIC）→ 发送 HTTP 请求。',
            '**服务器响应**：返回 HTML（可能经 CDN/网关/SSR），浏览器开始解析并并行发起关键资源请求。',
            '**渲染主线程**：解析 HTML 构建 **DOM**，解析 CSS 构建 **CSSOM**；两者合成**渲染树** → **布局**（几何计算）→ **绘制**（生成绘制指令并栅格化）→ **合成**上屏。',
            '脚本阻塞规则：同步 `<script>` 会**阻塞 HTML 解析**；`defer` 解析完按序执行，`async` 下载完即执行（顺序不保证）。',
            '之后进入**事件循环**驱动交互：输入事件、JS 执行、rAF、渲染交替进行。',
          ],
          followUps: [
            {
              question: '"CSS 阻塞渲染、JS 阻塞解析"分别是什么意思？如何缓解？',
              points: [
                'CSS 不阻塞 HTML 解析（DOM 照常构建），但**渲染会等 CSSOM**——避免无样式闪烁；所以关键 CSS 放头部，非关键 CSS 用 media 拆分或 preload + onload 异步化。',
                '同步 `<script>` 可能 document.write 改 DOM，解析器必须停下等下载执行；`defer`（按序、DOMContentLoaded 前）与 `async`（下载完即执行、顺序不保证）都**不阻塞解析**。',
                '有依赖的脚本用 defer 保序；独立的统计类脚本才用 async；ESM 脚本默认 defer 语义。',
              ],
            },
          ],
        },
        {
          id: 'fe-browser-events',
          title: '说说 DOM 事件流。什么是事件委托？',
          difficulty: 'basic',
          tags: ['DOM', '事件', '事件委托'],
          points: [
            '事件流三阶段：**捕获**（window → 目标）→ **目标阶段** → **冒泡**（目标 → window）；`addEventListener(type, fn, useCapture)` 决定监听哪个阶段。',
            '**事件委托**：利用冒泡把子元素监听统一挂到父容器，用 `event.target`（配 closest）区分真实目标——减少监听器数量，天然支持动态新增的子元素。',
            '`stopPropagation()` 阻止继续传播；`preventDefault()` 阻止默认行为（跳转、提交），两者互不影响；`stopImmediatePropagation()` 还会阻止同元素后续监听器。',
            '细节：focus/blur 不冒泡（用 focusin/focusout）；scroll 在元素上不冒泡；委托时注意 target 可能是子孙节点。',
            '**被动事件**：`{ passive: true }` 声明不会调 preventDefault，浏览器可立即滚动不等待监听器，是滚动性能优化的标配。',
          ],
          followUps: [
            {
              question: 'passive 事件监听解决什么问题？为什么 touchmove/wheel 上建议开启？',
              points: [
                '浏览器**无法预知**监听器是否调用 preventDefault，只能等监听器执行完才决定"滚还是不滚"——滚动被 JS 卡住，掉帧从这里来。',
                '`{ passive: true }` 承诺"绝不 preventDefault"，浏览器**立即开始滚动**、监听器异步补跑；Chrome 已把 window/document 上的 touchstart/touchmove/wheel 默认 passive。',
                '需要阻止默认行为时必须显式传 `{ passive: false }`，例如自定义下拉刷新拦截 touchmove。',
              ],
            },
          ],
        },
        {
          id: 'fe-browser-storage',
          title: 'cookie、localStorage、sessionStorage、IndexedDB 各自的特点与适用场景？',
          difficulty: 'basic',
          tags: ['浏览器', '存储'],
          points: [
            '**Cookie**：每次同域请求**自动携带**，容量约 4KB，可设过期时间；用于身份凭证；属性组合：`HttpOnly`（JS 不可读）、`Secure`（仅 HTTPS）、`SameSite`（限制跨站携带）。',
            '**localStorage**：同源共享、**持久化**（约 5-10MB）、字符串 KV、**同步 API**；适合主题、语言等小配置；滥用会阻塞主线程。',
            '**sessionStorage**：标签页级生命周期（关闭即清，刷新保留），适合单次会话内的流程状态（如多步表单草稿）。',
            '**IndexedDB**：**异步**、事务型、大容量（可上百 MB）、支持索引与游标；适合离线缓存与结构化大数据，一般用 Dexie/idb 包装库改善 API。',
            '安全视角：任何 JS 可读的存储都防不住 XSS——token 放 localStorage 有被窃取风险，放 Cookie 需配 HttpOnly + SameSite + CSRF 防护，二者是权衡不是银弹。',
          ],
          followUps: [
            {
              question: 'localStorage 触发什么事件？如何跨标签页同步状态？',
              points: [
                '写入触发**其他同源页面**的 storage 事件（key/newValue/oldValue），**写入者自身不触发**——不能在写入页监听自己的写入。',
                '惯用法：写入 storage → 其他页在 storage 回调里重读并更新 store（同步登录态/主题）；注意值真正变化才触发，频繁写入要节流。',
              ],
            },
            {
              question: '为什么 localStorage 大量读写会卡顿？大数据该用什么？',
              points: [
                'localStorage 是**主线程同步 API**：读写要跨进程访问存储并做字符串序列化，MB 级数据能阻塞主线程几十毫秒，直接推高 INP。',
                '大数据用 **IndexedDB**（异步、事务型、索引与游标）或 OPFS 大文件方案；封装库推荐 idb/Dexie 改善 API 体验。',
              ],
            },
          ],
        },
        {
          id: 'fe-browser-rendering',
          title: '浏览器的渲染流水线是怎样的？为什么合成器动画不掉帧？',
          difficulty: 'intermediate',
          tags: ['浏览器', '渲染', '合成'],
          points: [
            '主线程流水线：解析 HTML → **DOM**，解析 CSS → **CSSOM**（CSS 阻塞渲染但不阻塞解析）→ 渲染树 → **Layout**（几何）→ **Paint**（绘制指令）→ **Composite**（合成上屏）。',
            '浏览器把页面划分为**图层**：transform/opacity/will-change/fixed 等会提升独立合成层；只改合成属性的动画**主线程可以完全空闲**。',
            '合成器线程 + 栅格化线程把图层分块（tile）栅格化为位图，近屏优先；滚动与 transform 动画只需组合已有纹理，所以即使 JS 忙，合成器仍可能流畅。',
            '**样式计算与布局是主线程重活**：改 width/top 走完整流水线（重排），改颜色只重绘，改 transform/opacity 通常只合成。',
            '配套 API：`requestAnimationFrame` 对齐渲染帧；`requestIdleCallback` 用空闲时间做低优先级任务；长任务会推迟输入与绘制，需主动拆分。',
          ],
          followUps: [
            {
              question: '什么情况下元素会被提升为合成层？层爆炸是什么问题？',
              points: [
                '提升条件：3D transform、`will-change: transform/opacity`、fixed 定位、叠加上下文的定位元素、video/canvas 等；**隐式提升**还会由层叠规则连带产生。',
                '层爆炸：大量元素被隐式提升（父级 will-change 连带子级、滚动容器内多层叠加），显存保存过多纹理，移动端内存吃紧、合成耗时反升。',
                '治理：DevTools Layers 面板看层数量与内存，只对动画元素显式提升，动画结束移除 will-change。',
              ],
            },
            {
              question: '为什么 CSS 放头部而 JS 推荐加 defer？',
              points: [
                'CSS 放头部是为了让 **CSSOM 尽早就绪**：渲染要等样式表，放底部反而让首屏等待更久；非关键 CSS 异步化即可。',
                '同步 JS 既阻塞解析又阻塞渲染；defer 下载不阻塞、按序执行，是带依赖脚本的默认选择——这是"关键渲染路径"优化的基本盘。',
              ],
            },
          ],
        },
        {
          id: 'fe-browser-cors',
          title: '什么是同源策略？CORS 是如何解决跨域的？',
          difficulty: 'intermediate',
          tags: ['浏览器', '跨域', 'CORS'],
          points: [
            '**同源策略**：协议 + 域名 + 端口完全一致才算同源；限制跨源读取 DOM、Cookie/Storage 与 **XHR/fetch 响应**。它防的是"恶意站点读取别的站点的数据"，不是阻止请求发出。',
            '**CORS** 靠响应头授权：**简单请求**（GET/POST/HEAD + 安全首部 + 受限 Content-Type）直接发送，服务器以 `Access-Control-Allow-Origin` 放行。',
            '**预检请求**：带自定义头、PUT/DELETE、JSON 之外的复杂类型等**非简单请求**先发 OPTIONS 预检，通过后（`Allow-Methods/Headers/Max-Age`）才发真实请求。',
            '**带凭证**：`credentials: "include"` 时服务端必须返回**具体源**（不能是 *）且 `Access-Control-Allow-Credentials: true`，这是最常见的联调坑。',
            '工程实践：开发环境用 vite/webpack 的 proxy 代理，生产用网关/nginx 反代（同源化，最省心）；JSONP 已过时且有 XSS 风险；iframe 间用 postMessage 并校验 origin。',
          ],
          followUps: [
            {
              question: 'CORS 失败时请求发出去了吗？服务器收到请求了吗？',
              points: [
                '**发出了**：请求真实到达服务器并执行（写操作已生效），只是**响应被浏览器拦截**、JS 拿不到——"前端报 CORS 错"不等于服务端没处理，非幂等接口要格外小心。',
                '预检失败则不同：OPTIONS 未通过时**真实请求根本不会发出**。看 Network 面板区分：只有 OPTIONS 是预检失败；请求在但控制台报错是响应头缺失。',
              ],
            },
            {
              question: '为什么生产更推荐网关代理而不是给每个服务开 CORS？',
              points: [
                '同源化后**不再依赖浏览器 CORS 机制**：Cookie 同源天然携带（SameSite 也不拦），免去"Allow-Origin 具体源 + credentials"在每个服务的维护与配置漂移。',
                '网关统一收口还能做鉴权、限流、灰度；CORS 散落在 N 个微服务上，任何一处漏配都是线上事故。CORS 更适合"公开 API 提供给第三方浏览器应用"的场景。',
              ],
            },
          ],
        },
        {
          id: 'fe-browser-cross-tab',
          title: '多个标签页之间如何通信？',
          difficulty: 'intermediate',
          tags: ['浏览器', '通信'],
          points: [
            '**BroadcastChannel**：同源标签页间的发布订阅（`new BroadcastChannel(name)` + postMessage），API 最直接，现代首选。',
            '**localStorage 事件**：一个页面写入，**其他**同源页面收到 `storage` 事件（写入者自身不触发）；兼容性最好，注意序列化与节流。',
            '**SharedWorker**：多个标签页共享同一个 Worker 作为消息枢纽；Safari 16+ 才恢复支持，低版本需降级 BroadcastChannel/localStorage。',
            '**postMessage**：window.open 的子窗口、opener、iframe.contentWindow 之间的跨窗口通信，可跨域，**必须校验 event.origin**。',
            '其他：Service Worker 充当消息中心；IndexedDB + 轮询兜底；Web Locks API 做跨标签页互斥（如保证单实例逻辑）。',
          ],
          followUps: [
            {
              question: '如何保证多个标签页只有一个实例在执行任务（如轮询、抢锁）？',
              points: [
                '**Web Locks API**：`navigator.locks.request("poll-lock", async (lock) => {...})`，同源标签页互斥，锁随页面关闭自动释放，是标准解法。',
                '降级方案：localStorage 写时间戳实现简单心跳锁（定期续期、过期即抢），或用 BroadcastChannel 做 leader election 选主。',
              ],
            },
            {
              question: 'postMessage 跨窗口通信有哪些安全要点？',
              points: [
                '发送方 `targetWindow.postMessage(data, targetOrigin)` **必须指定精确 origin**，写 * 会把消息泄露给任意嵌入页面。',
                '接收方必须**校验 event.origin 白名单**再处理，并对 data 做结构校验——恶意页面可以把你的站点嵌 iframe 后伪造消息触发写操作。',
              ],
            },
          ],
        },
        {
          id: 'fe-browser-worker',
          title: 'Web Worker 是什么？什么场景该用它？',
          difficulty: 'intermediate',
          tags: ['浏览器', 'Web Worker', '多线程'],
          points: [
            'Worker 在**独立线程**运行 JS，与主线程**不共享内存**，通过 postMessage **结构化克隆**（或 Transferable 零拷贝转移 ArrayBuffer）通信；没有 DOM/window，可用 fetch、IndexedDB、setTimeout。',
            '类型：**Dedicated Worker**（页面专属）、**Shared Worker**（同源多页面共享）以及以 API 形式存在的变体（AudioWorklet 等）。',
            '适用：**大数据计算**（JSON 解析、加解密、图像处理）、复杂排序搜索、大文件处理——把长任务挪出主线程，保住输入响应（INP）。',
            '不适用：需要频繁小消息往返的细粒度任务（通信开销大于收益）；DOM 操作绝对不可行。',
            '工程实践：打包器原生支持 `new Worker(new URL("./worker.ts", import.meta.url))`；做好错误兜底（超时判断 + 降级同步执行）与 Worker 生命周期管理。',
          ],
          followUps: [
            {
              question: 'postMessage 传 100MB 数据怎么优化？',
              points: [
                '默认**结构化克隆**完整复制一份数据（双倍内存 + 序列化耗时）；改用 **Transferable 对象**（ArrayBuffer、MessagePort 等）把所有权**零拷贝转移**，近乎瞬时。',
                '实战：大文件/大 JSON 转 ArrayBuffer 再 transfer，或用 SharedArrayBuffer 共享只读；注意转移后主线程原 buffer 变为 detached（长度 0），不能再使用。',
              ],
            },
            {
              question: 'Worker 里死循环会影响页面吗？主线程如何终止它？',
              points: [
                '**不影响主线程**：Worker 是独立线程，死循环只烧自己的线程与 CPU，页面照常响应——这正是 Worker 的价值；但会占用系统资源。',
                '终止：主线程 `worker.terminate()` **立即硬杀**，Worker 内无法自救；软终止靠 Worker 监听消息自行退出循环。',
              ],
            },
          ],
        },
        {
          id: 'fe-browser-http2-3',
          title: 'HTTP/1.1、HTTP/2、HTTP/3 的关键区别？前端需要做什么配合？',
          difficulty: 'intermediate',
          tags: ['网络', 'HTTP/2', 'HTTP/3'],
          points: [
            '**HTTP/1.1**：文本协议，一条连接同时只能处理一个请求（**队头阻塞**），靠 6 个并发连接、域名分片、合并文件缓解。',
            '**HTTP/2**：**二进制分帧 + 多路复用**（一条连接并发多个流，消除 HTTP 层队头阻塞）、HPACK 头部压缩、流优先级；但 TCP 层丢包仍会阻塞所有流。',
            '**HTTP/3**：换用 **QUIC（基于 UDP）**，流之间独立重传，彻底解决传输层队头阻塞；0/1-RTT 建连、连接迁移（切换网络不断线）。',
            '前端配合：HTTP/2 下**域名分片与过度文件合并成为反模式**，应合理拆分模块利用多路复用与缓存粒度；配合 Brotli/gzip 与 TLS。',
            '认知升级：协议升级对页面透明（ALPN 协商），优化重点从"减少请求数"转向**缓存粒度、优先级与依赖图管理**。',
          ],
          followUps: [
            {
              question: 'HTTP/2 为什么没彻底解决队头阻塞？QUIC 是怎么解决的？',
              points: [
                'HTTP/2 多路复用消除了 **HTTP 层**队头阻塞，但所有流跑在**同一条 TCP 连接**上：TCP 只认字节流，一个包丢失，后面所有流的数据都要等重传——**传输层队头阻塞**依旧。',
                'QUIC 把流做成**相互独立的可靠传输单元**：某流丢包只重传该流，其他流继续交付；配合 UDP 之上自实现的拥塞控制、内置 TLS 1.3（0-RTT 建连、连接迁移）。',
              ],
            },
            {
              question: 'HTTP/2 下前端哪些旧优化要撤销？为什么？',
              points: [
                '**域名分片**失效且有副作用：多域名意味着更多 TLS 握手，还失去同连接的优先级调度——收敛回单域名 + CDN。',
                '**过度合并文件**（雪碧图、拼大 JS）变成反模式：多路复用让小文件并行不排队，拆分反而获得**更细的缓存粒度**——改一个模块不必失效整个大文件。',
                '内联小资源要权衡：内联失去缓存与并行加载，只对首屏关键 CSS 等关键路径资源保留。',
              ],
            },
          ],
        },
        {
          id: 'fe-browser-wasm',
          title: 'WebAssembly 是什么？什么场景值得上，什么场景是反向优化？',
          difficulty: 'advanced',
          tags: ['WebAssembly', 'wasm', '性能'],
          points: [
            '定位：**可移植的二进制指令格式**，在浏览器沙箱内以接近原生的速度执行，语言无关（C/C++/Rust/Go 都能编译过来）；与 JS 的关系是**互补不是替代**——wasm 没有直接操作 DOM 的 API（要过 JS 桥），调试与生态都以 JS 宿主为中心。',
            '**性能真相**：计算密集任务（视频编解码、图像处理、物理模拟、加密压缩）能拿到 1.5 倍到数倍提升；但 **JS 与 wasm 边界的数据拷贝是第一杀手**——大数组跨边界要拷贝（或 SharedArrayBuffer 共享），频繁小调用被类型转换与调用约定吃掉收益；优化套路：数据驻留 wasm 侧、批量调用、线性内存直接挂 TypedArray 视图。',
            '真实落地场景：设计工具与编辑器内核（Figma、Photoshop Web 把 C++ 引擎搬进浏览器）、音视频处理（ffmpeg.wasm）、地图/游戏引擎（Unity）、**沙箱执行不可信代码**（在线代码运行器）、边缘计算（Cloudflare Workers 也以 wasm 支持多语言）——共同点：**有重计算内核或已有 C/C++ 资产可复用**。',
            '不该用的场景（主动说才有说服力）：普通 UI 与业务逻辑（JS 足够，调试/体积/招聘成本全吃亏）、为了省体积（wasm 二进制不小还要带胶水运行时）、简单计算（桥接开销吞掉提速）；决策口径：**先 profile 证明瓶颈是 JS 的纯计算，再考虑 wasm**——与"先测量再优化"同一条纪律。',
            '进阶谈资：SIMD 指令与线程（需 SharedArrayBuffer，页面要配 COOP/COEP 跨域隔离头）、WasmGC 让带 GC 的语言（Java/Kotlin）可低成本编译；浏览器之外，wasm 作为"**通用可移植字节码**"正在向边缘与容器领域出圈——视野题的加分点。',
          ],
          followUps: [
            {
              question: 'wasm 的沙箱安全性是怎么保证的？和 iframe/Worker 沙箱比有什么不同？',
              points: [
                '三层机制：**线性内存隔离**（wasm 模块只能读写自己的线性内存，无法越界访问宿主内存——访问都经边界检查）；**能力模型**（拿不到任何系统 API 与文件句柄，只能调用显式导入的函数）；无系统调用（网络/文件全靠宿主注入）。它隔离的是**内存与能力**，而 iframe/Worker 隔离的是**执行环境与源**（同源策略、postMessage 通信）。',
                '组合用法：在线运行器常见"wasm 跑不可信代码 + Worker 限时执行 + 主线程只收结果"的多层沙箱——每层防不同维度的风险（内存越界 / 死循环 / 数据泄露）。能对比三层各自的威胁模型，说明安全思维成体系。',
              ],
            },
          ],
        },
        {
          id: 'fe-browser-streaming-ai',
          title: 'AI 对话的前端为什么普遍用 SSE 而不是 WebSocket？流式渲染有哪些工程细节？',
          difficulty: 'advanced',
          tags: ['SSE', '流式渲染', 'AI 应用', 'ReadableStream'],
          points: [
            '**SSE（Server-Sent Events）与生成式 AI 的天然匹配**：LLM 输出本质是**服务端单向持续推流**（token 逐个生成），SSE 正是为"服务端→客户端单向流"设计的——基于**普通 HTTP**（过代理/网关/CDN 无障碍，复用鉴权头与 CORS 语义）、协议文本极简（`text/event-stream`，`data:` 行 + 空行分隔事件）、**浏览器原生 `EventSource` 自带断线重连与 Last-Event-ID 续传**。对比 WebSocket：需要**协议升级握手**（101）、代理与负载均衡配置更复杂、断线重连要自己实现、而双向能力在"客户端只发请求"的场景纯属浪费——**用 WebSocket 做 AI 对话是拿对讲机干收音机的活**。',
            '**但生产级实现几乎都用 fetch 而不是 EventSource**：EventSource 有硬伤——**只能 GET**（对话要 POST 长 prompt 与上下文）、**不能自定义请求头**（Authorization）、错误信息有限；所以主流是 `fetch` + **`ReadableStream` 手动消费**：`response.body.getReader()` 循环 `read()`，按 SSE 格式（或厂商的分块协议）切分事件，把 delta 增量 append 到状态里。这道"为什么不用原生 API"是流式前端的第一道区分题。',
            '**取消与中断的细节（高频追问）**：用户点"停止生成"——`AbortController.abort()` 中断 fetch；**reader 的 `cancel()` 要显式调用释放流锁**，否则流挂着不释放；abort 后 `read()` 会抛 AbortError，catch 里要区分"用户主动取消"（不算错误，保留已生成内容）与网络异常（进入重试逻辑）；服务端也要能感知断开停止计费生成（连接断开事件向上游传播）。',
            '**渲染层的工程难点**：**Markdown 增量渲染**——半截的 Markdown（未闭合代码块、半个表格）解析会闪烁，方案是"稳定前缀缓存 + 只有尾部最后一段重渲染"（react-markdown 配 memo 粒度控制）；打字机效果用定时器平滑 token 突发（视觉速率与生成速率解耦）；**长对话性能**——消息列表虚拟化 + 只渲染视口内的富文本；代码块高亮用增量 tokenizer。',
            '**断线恢复与重连（生产必考）**：网络闪断后不能丢已生成内容——方案：**按消息 id + 序号请求续传**（服务端把生成结果也落库，客户端带 offset 拉 delta）、或重连后整段重发（幂等由服务端保证）；自动重连配指数退避，重连期间 UI 显示"连接中断，重试中"而不是白屏。收束口径：流式体验的分水岭不在"能流式"，在**断点续传、可取消、半成品渲染**这三件脏活。',
          ],
          followUps: [
            {
              question: '流式响应下前端状态怎么组织？多条消息并发生成怎么处理？',
              points: [
                '状态形态：消息列表里每条消息带 **status（streaming/done/aborted/error）**，streaming 中的消息内容用**不可变更新**（每次 append 生成新数组/新对象）——配合 React 的并发特性天然可中断渲染；把"网络层解析"（SSE 切分）与"UI 状态"（store 更新）解耦成两层，解析层纯函数化可单测。',
                '多路并发（并行问多个模型/多个会话）：每路流一个 AbortController 注册到管理表，按消息 id 路由 delta 到对应消息；注意**全局 loading 与单消息 streaming 状态分离**、一路失败不拖垮其他路；对话类 SDK（useChat/streamText 这类抽象）本质就是把上面这些模式封装成 hooks。',
              ],
            },
            {
              question: 'SSE 经过 Nginx/CDN/代理时为什么会"卡住一次性吐出"？怎么修？',
              points: [
                '根因是**中间层缓冲**：Nginx 的 proxy_buffering 会攒够 buffer 再转发、gzip 攒块压缩、CDN 默认缓冲响应——流被攒成大块，前端表现为"等半天突然蹦一大段"。',
                '修复清单：响应头 **`X-Accel-Buffering: no`**（Nginx 透传禁用缓冲）或 nginx 配置 `proxy_buffering off`；`Content-Type: text/event-stream` + **`Cache-Control: no-cache`**；关掉该路径的 gzip 或确认其流式模式；HTTP/2 下还要注意某些代理对长连接的超时（`proxy_read_timeout` 调大）。能报出"三个缓冲点：代理缓冲、压缩缓冲、CDN 缓冲"说明真排查过。',
              ],
            },
          ],
        },
        {
          id: 'fe-browser-webrtc',
          title: 'WebRTC 的连接建立和弱网对抗是怎么做的？和 HLS/RTMP 什么场景下选谁？',
          difficulty: 'advanced',
          tags: ['WebRTC', 'ICE', '实时音视频', '弱网对抗'],
          points: [
            '**定位先分清（协议选型题眼）**：**实时通信（<500ms 延迟）用 WebRTC**（连麦、会议、云游戏）；**延迟容忍的点播/直播用 HLS/DASH 切片**（CDN 分发成本优势巨大）；RTMP 是推流侧的老协议（延迟 1~3s，正在被 SRT/WebRTC 推流替代）。一句话：**延迟预算决定协议，成本决定规模**——WebRTC 的低延迟是用 P2P/UDP 和抗住了复杂度换的。',
            '**连接建立三步（信令 → ICE 打洞 → SRTP）**：① **信令协商**（WebRTC 标准不管信令——一般走 WebSocket 交换 **SDP**（Offer/Answer：编解码能力、加密参数）与 ICE candidate）；② **ICE 打洞**：收集候选地址（主机/STUN 公网映射/TURN 中继），按优先级**配对探测连通性**——能打洞就 P2P 直连，打不通走 TURN 中继（成本兜底，与 NAT 题的穿透内容衔接）；③ 协商出 **DTLS 加密信道 + SRTP 媒体流 + SCTP DataChannel**（数据通道，传文件/信令/游戏状态）。',
            '**弱网对抗全家桶（实时音视频的深水区）**：**丢包恢复**——NACK（接收方请求重传，RTT 小时有效）+ **FEC 前向纠错**（冗余包，重传来不及时）交织使用；**JitterBuffer**（缓冲消抖动，按网络抖动自适应大小——延迟与流畅的平衡器）；**码率自适应**（GCC/TransportCC：基于延迟梯度与丢包率的双臂码率估计，带宽降了通知编码器降码率——与视频平台题的 ABR 呼应：那是播放侧选档，这是发送侧调码率）；**带宽估计联动编码器**（VP8/H264 的 simulcast 多路分层，SFU 按接收端带宽转发不同层）。',
            '**架构角色：P2P vs SFU vs MCU**：P2P（1v1 最优）；**SFU（选择性转发单元，多人场景主流）**——服务器只转发不解码（ simulcast 各端按带宽收不同质量，成本可控）；MCU（服务器混流解码再编码，CPU 贵、延迟高，基本只在需要"合成单流录制"时用）——多人会议的答案基本都是 SFU + simulcast，能讲出为什么 MCU 死了是加分。',
            '**工程收束**：WebRTC 的学习曲线全在"协议栈全家桶"（ICE/DTLS/SRTP/SCTP + 编解码 + 弱网算法）；生产实践常"**用开源栈（libwebrtc/mediasoup/Pion）而少自己写**"，工程师的价值在**调参与排障**（为什么卡：看 getStats 的丢包/RTT/抖动/编码器目标码率四个指标定位是网络、编码还是渲染的问题——分层排查的又一次应用）。',
          ],
          followUps: [
            {
              question: '多人会议里某端反馈「画面糊但不卡」，另一端「卡但不糊」，分别是什么问题？',
              points: [
                '**糊但不卡 = 带宽估计过低**：码率估计算法保守（延迟梯度误判拥塞）或上行确实受限，编码器长期跑低码率——查 getStats 的编码目标码率 vs 实际带宽、simulcast 层选择（是不是被 SFU 降到了低分辨率层转发）；调 GCC 参数或调高最低码率档。',
                '**卡但不糊 = 码率没降下来**：带宽估计反应慢或丢包靠 FEC/NACK 硬扛、缓冲溢出丢帧；查丢包率曲线（突发丢包 vs 持续丢包）、JitterBuffer 深度是否打满；反应是让码率估计更激进（快降慢升策略）或补 FEC 比例。这两个 case 的对照说明你理解"**质量 = 码率策略 × 恢复策略**"的两维调优空间，而不是笼统的"网络不好」。',
              ],
            },
          ],
        },
        {
          id: 'fe-browser-process-thread',
          title: '现代浏览器的多进程架构是怎样的？为什么这样设计？',
          difficulty: 'advanced',
          tags: ['浏览器', '进程', '架构'],
          points: [
            'Chrome 多进程：**浏览器主进程**（UI、调度、存储）、**渲染进程**（每站点隔离，运行 Blink + V8）、**GPU 进程**（合成与光栅）、**网络进程**、插件/扩展进程等。',
            '设计动机：**安全（沙箱）**——渲染进程运行不可信网页代码，权限被沙箱收紧，被攻破也不影响系统与其他站点；**稳定性**——单页崩溃不拖垮整个浏览器；**性能**——多核并行。',
            '**Site Isolation**：不同站点（甚至跨站 iframe）使用不同渲染进程，是 Spectre 类漏洞的缓解手段；代价是内存占用上升。',
            '渲染进程内部：主线程（DOM/V8/样式布局）、合成器线程、栅格化线程池；理解"跨进程通信（IPC）有成本"有助于解释 postMessage、IndexedDB 调用的开销。',
            '对前端的直观影响：后台标签页定时器被节流、页面可被冻结/丢弃回收内存、bfcache 前进后退秒开——这些都来自进程与标签页生命周期策略。',
          ],
          followUps: [
            {
              question: 'Site Isolation 是什么？它牺牲了什么换来了什么？',
              points: [
                '每个**站点**（eTLD+1）使用独立渲染进程，跨站 iframe 也在自己的进程里——攻破一个渲染进程也拿不到其他站点数据，是 Spectre 类侧信道漏洞的关键缓解。',
                '代价：进程数量上升带来**内存与 IPC 开销**，低端设备压力明显；浏览器因此做进程复用、按需启停等权衡。',
              ],
            },
            {
              question: '后台标签页里 setTimeout 为什么不准？bfcache 是什么？',
              points: [
                '省电策略：后台标签页定时器被**节流到最低 1 次/秒**，被冻结的页面 5 分钟后更低；前台链式 setTimeout（嵌套超过 5 层）也有 4ms 下限——倒计时不要依赖 setInterval 的精度。',
                '**bfcache（往返缓存）**：前进后退直接恢复整页内存快照，秒开且保留 JS 状态；页面需监听 pageshow（persisted 判断）与 pagehide 释放资源，写在 unload 里的逻辑在 bfcache 下不执行。',
              ],
            },
          ],
        },
        {
          id: 'fe-browser-service-worker',
          title: 'Service Worker 是什么？如何支撑 PWA 的离线能力？',
          difficulty: 'advanced',
          tags: ['浏览器', 'Service Worker', 'PWA'],
          points: [
            '**Service Worker** 是运行在页面之外的**事件驱动网络代理**：可拦截同源页面的 fetch 请求并自定义响应（缓存优先/网络优先/混合策略），是 PWA 离线的核心。',
            '**生命周期**：install（预缓存）→ waiting → activate（清理旧缓存）→ 运行中响应 fetch/sync/push；更新靠字节对比，`skipWaiting` + `clients.claim` 控制接管时机。',
            '**Cache Storage API** 存请求/响应对；典型策略：App Shell **缓存优先**、API **网络优先 + 缓存兜底**、静态资源 **stale-while-revalidate**。',
            '扩展能力：**Background Sync** 延迟到网络恢复时同步数据、**Push 通知**、配合 Manifest 实现可安装与独立窗口。',
            '坑与纪律：仅 HTTPS（或 localhost）可用；作用域由 SW 文件路径决定；"发版后用户永远拿到旧缓存"是经典事故——必须设计版本号、缓存清理与 kill switch（workbox 封装了这些策略）。',
          ],
          followUps: [
            {
              question: '缓存优先策略如何避免用户长期拿旧资源？',
              points: [
                '核心是**版本化 URL**：静态资源带内容 hash，SW 缓存按 URL 键控——代码更新意味着 URL 变化，天然绕开旧缓存；index.html 本身走网络优先。',
                'SW 自身更新：浏览器**字节对比** sw.js → 新 SW install 预缓存新清单 → `skipWaiting` + `clients.claim` 接管 → activate 里 `caches.delete` 清旧版本。',
                '兜底：提供"新版本可用，点击刷新"提示，避免用户停留期间新旧代码混跑。',
              ],
            },
            {
              question: 'workbox 解决了什么问题？',
              points: [
                '把 SW 三件苦活**策略化**：路由匹配 + 缓存策略（CacheFirst/NetworkFirst/StaleWhileRevalidate）声明式配置；构建期生成**带修订 hash 的预缓存清单**；activate 时**自动清理过期版本**。',
                '价值在于把"发版后用户拿旧缓存"这类事故的坑统一填掉，比手写 fetch 事件分发可靠得多。',
              ],
            },
          ],
        },
        {
          id: 'fe-browser-websocket',
          title: 'WebSocket 和 SSE 的原理是什么？实时通信方案怎么选型？',
          difficulty: 'intermediate',
          tags: ['WebSocket', 'SSE', '实时通信'],
          points: [
            'WebSocket：借 **HTTP Upgrade 握手**（101 Switching Protocols）升级为 TCP **全双工**长连接，帧协议自带掩码与 Opcode，服务端可主动推送。',
            'SSE（Server-Sent Events）：基于 HTTP 的**单向**服务端推送，`text/event-stream` 格式，浏览器端 EventSource **自带断线重连与 Last-Event-ID 续传**。',
            '选型按"延迟敏感度 + 方向性"：通知流、行情、LLM 逐 token 输出选 **SSE**（实现简单、天然过网关）；聊天/协同编辑/游戏等双向交互才选 **WebSocket**；低频更新用长轮询即可。',
            '工程三件套：**心跳保活**（ping/pong 超时判假死，nginx 代理要配 proxy_read_timeout）、**指数退避重连**（加抖动防雪崩）、**离线增量补偿**（消息序号 + 重连后拉缺口，幂等去重）。',
            '鉴权与安全：Cookie 随 Upgrade 请求自动携带；token 走 URL 参数有日志泄漏风险（建议短时效 ticket 换连）；**WS 没有 CORS**，服务端必须校验 Origin 头防跨站劫持（CSWSH）。',
          ],
          followUps: [
            {
              question: '心跳与重连的边界怎么定？重连风暴怎么防？',
              points: [
                '心跳超时判定假死：连续 N 次未收到 pong 主动断开重连，而不是等 TCP 层超时（默认可达小时级）。',
                '重连必须**指数退避 + 随机抖动**（如 1s/2s/4s…上限 30s），否则服务端抖动时全量客户端同步重连会打成 DDoS。',
                '消息带单调递增序号，重连后按 lastSeq 拉增量，处理端幂等去重——网络层重连与业务层不丢消息解耦。',
              ],
            },
            {
              question: 'SSE 和 WebSocket 的工程取舍还有哪些细节？',
              points: [
                'SSE 只能传文本（二进制要 base64），且 HTTP/1.1 下每个连接独占一条 TCP（浏览器 6 连接限制内），需 HTTP/2 多路复用兜底。',
                '双向才选 WS；需要"服务端改写/过滤消息"的代理场景 SSE 更友好（普通 HTTP 语义）。',
                '移动端弱网下 WS 长连接易假死，心跳参数要按网络类型动态调整。',
              ],
            },
          ],
        },
      ],
    },
    {
      id: 'fe-engineering',
      name: '前端工程化',
      description: '从构建工具原理到 CI/CD 与灰度发布，考察工程效率与协作规范的实践能力。',
      references: [
        { label: 'Webpack 官方文档', url: 'https://webpack.js.org' },
        { label: 'Vite 官方文档', url: 'https://vite.dev' },
        { label: 'Rollup 官方文档', url: 'https://rollupjs.org' },
        { label: 'pnpm 官方文档', url: 'https://pnpm.io' },
      ],
      questions: [
        {
          id: 'fe-eng-modules',
          title: '前端模块化是如何演进的？CommonJS 和 ESM 的本质区别？',
          difficulty: 'basic',
          tags: ['模块化', 'ESM', 'CommonJS'],
          points: [
            '演进：全局变量/IIFE 命名空间 → **CommonJS**（Node，require 同步加载）→ **AMD**（RequireJS，浏览器异步）→ UMD 兼容包 → **ESM**（语言标准）。',
            '**CJS 运行时加载**：require 动态求值，导出的是**值的拷贝**（基本类型）；**ESM 编译期确定依赖结构**（静态顶层 import/export），导出的是**只读的实时绑定**（引用）。',
            '静态结构使 ESM 支持静态分析：**Tree Shaking**、依赖图预构建、循环依赖的拓扑处理、按需 code splitting 都依赖它。',
            '生态现状：npm 双格式包用 `exports` 字段区分 import/require 条件；Node 18+ 完整支持 ESM；"CJS 壳包"与 .mjs/.cjs 解析差异是常见踩坑点。',
            '浏览器原生支持 `<script type="module">` 与 import maps，可免打包直跑；生产仍用打包器做合并、压缩与缓存优化。',
          ],
          followUps: [
            {
              question: '循环依赖在 CommonJS 和 ESM 下的表现有什么不同？',
              points: [
                'CJS：模块**执行到 require 处暂停**，返回"当前已完成部分的导出副本"——先加载方拿到不完整对象，访问未初始化的导出是 undefined，时序敏感且难排查。',
                'ESM：**先静态解析建立依赖图再执行**，导出是**实时绑定（引用）**；循环时函数声明可用（提升）、类与 const 处于 TDZ 会报错——根治靠把循环依赖重构为共享模块。',
              ],
            },
          ],
        },
        {
          id: 'fe-eng-lint',
          title: 'ESLint、Prettier、husky、lint-staged 如何协作形成代码规范流程？',
          difficulty: 'basic',
          tags: ['工程化', 'ESLint', '代码规范'],
          points: [
            '分工：**ESLint** 管**代码质量**（错误、坏味道、最佳实践，TS 用 typescript-eslint）；**Prettier** 只管**格式化**，用 eslint-config-prettier 关闭 ESLint 的排版类规则避免打架。',
            '**husky** 管理 git hooks：pre-commit 触发 **lint-staged**，只对**暂存区文件**执行 eslint --fix + prettier，快且不碰未提交代码。',
            '本地之外：**commitlint** 规范提交信息；CI 兜底跑全量 lint + 类型检查 + 测试（本地可被 --no-verify 绕过，CI 是最后防线）。',
            '编辑器保存即格式化 + `.editorconfig` 统一基础风格，减少提交 diff 噪音。',
            'monorepo 实践：lint 配置抽成共享包分层引用，开启 `eslint --cache` 提速。',
          ],
        },
        {
          id: 'fe-eng-lowcode',
          title: '低代码平台的核心设计是什么？为什么「简单拖拽」撑不起严肃业务？',
          difficulty: 'intermediate',
          tags: ['低代码', 'Schema 驱动', '可视化搭建'],
          points: [
            '**架构核心 = Schema 驱动渲染**：搭建器产出**页面描述 JSON**（组件树 + 属性 + 数据绑定 + 事件/逻辑编排），渲染器消费 Schema 实时渲染——"搭建 = 写 Schema，渲染 = 执行 Schema"；配套三件套：**物料体系**（基础组件按协议封装：属性面板描述、setter 类型、事件声明——物料质量决定平台上限）、**属性/样式配置面板**（由物料 Schema 自动生成）、**数据源管理**（接口注册、取数时机、数据映射表达式）。',
            '**复杂逻辑是分水岭（也是"简单拖拽撑不起严肃业务"的原因）**：表单联动、跨组件数据流、条件分支循环，纯可视化编排很快变成"**面条配置**"（比面条代码更难 review 与版本管理）；成熟平台的三条出路：**逻辑编排画布**（可视化流程图，适合简单场景）、**代码扩展点**（事件里写受沙箱约束的 JS 片段/表达式语言）、**出码（code generation）**——把 Schema 生成真实工程代码交给开发者接管，突破天花板但变成"单向门"。',
            '**出码 vs 运行时渲染的权衡（必考决策）**：**运行时**（渲染器执行 Schema）——改动即时生效、同一 Schema 多端渲染，但**性能差一层、调试黑盒、逃逸不出渲染器能力圈**；**出码**——得到标准工程（可 git、可断点、可任意扩展），但**失去在线编辑**（改 Schema 要重新出码合并）。折中形态：**开发期搭建 + 交付期出码**，或低代码只做"壳"（页面骨架、表单、报表）+ 专业代码做重交互岛屿（与微前端的集成边界呼应）。',
            '**边界与定位（判断力得分点）**：低代码的甜区 = **中后台 CRUD、表单流程、运营活动页、报表大屏**（模式收敛、变化频繁、非核心链路）；不适合：重交互产品（编辑器/设计工具）、高性能 C 端、强定制复杂规则——**平台给自己划边界比功能多更难也更重要**；企业落地三现实：**物料治理**（谁维护、版本兼容）、**数据源安全**（接口权限与敏感数据暴露面）、**Schema 版本迁移**（物料升级后存量页面的兼容策略——低代码平台自己的"技术债"比业务还快）。',
          ],
          followUps: [
            {
              question: '低代码平台的 Schema 版本怎么管理？物料升级后存量页面怎么办？',
              points: [
                '核心机制：**Schema 带 schemaVersion 与物料版本清单**（页面声明依赖的组件版本范围），渲染器按版本路由到对应物料实现（多版本共存）；升级路径：物料提供**兼容层/属性迁移函数**（旧 Schema 自动转换），配**灰度渲染**（新版本物料先影子渲染比对 DOM 差异再切）。',
                '治理纪律：破坏性变更走**新组件名**（Form2 而不是改 Form）、弃用字段保留兼容窗口、存量页面**按访问热度分批迁移**（僵尸页面不迁）；本质是把"语义化版本 + 数据库 schema 迁移"两套方法论搬进页面描述层——能点出这个类比的候选人极少，点出即满分。',
              ],
            },
          ],
        },
        {
          id: 'fe-eng-testing',
          title: '前端怎么做测试？单测、组件测试、快照测试的边界与工具链选择？',
          difficulty: 'intermediate',
          tags: ['前端测试', 'Vitest', 'Testing Library', '测试策略'],
          points: [
            '**前端测试金字塔是变形金字塔**：UI 层（E2E）最贵最脆要最少；**中间层组件测试最厚**（RTL + jsdom 模拟用户交互，覆盖逻辑与渲染联动，速度秒级）；底层纯函数单测（工具、hooks、状态 reducer）最便宜多写。与后端金字塔的区别就在"组件测试"这层的分量——**组件是前端逻辑的主要载体**。',
            '**Testing Library 的核心哲学（必考）**：**测行为不测实现**——通过用户可感知的方式查询与交互（getByRole/getByText 模拟点击输入），而不是组件内部状态（不测 state、不 shallow 渲染、不直接调内部方法）；**查询优先级**：getByRole（同时验证了无障碍性）> getByLabelText/getByText > getByTestId（最后手段——testid 泛滥说明组件语义化没做好）。改内部实现不破坏测试，这才是重构安全网。',
            '**Hooks 测试**：renderHook + act 包裹状态更新（React 的并发渲染要求更新都在 act 内断言）；注意"测 hook 本身"与"通过组件间接测 hook"的选择——通用 hook 抽出来单测，业务 hook 跟组件一起测更接近真实。',
            '**快照测试的争议要会评（区分度点）**：优点是零成本兜底（渲染结果意外变了会报警）；缺点是**大快照没有断言意图**（review 时直接按 u 更新，快照沦为"变更日志"，防护力趋零）——正确用法：**快照要小**（只对关键输出片段）或干脆用显式断言替代；CI 里把"快照更新次数"当信号监控（频繁更新 = 快照失效）。**E2E 只留核心冒烟链路**（登录/下单），与 QA 方向的自动化策略题分工：那题讲测试团队体系，本题讲前端工程内建。',
            '**Mock 分层**：**msw（Mock Service Worker）**拦截网络层（组件测试里最推荐的 mock 层——测试代码贴近真实 fetch 语义、同一份 handler 可复用到开发环境）；module mock（vi.mock）用于注入纯依赖（时间、随机数）；**不 mock 到太深层**（mock 内部函数会让测试与实现耦合）。收束口径：**测多少看回报**——核心逻辑与易错分支全覆盖，展示型页面靠视觉回归与 E2E 兜底，追求 100% 覆盖率是指标游戏。',
          ],
          followUps: [
            {
              question: '覆盖率多少合适？怎么让测试真的拦住 bug 而不是凑数？',
              points: [
                '覆盖率是**必要不充分指标**：0% 说明没安全网，但 80% 的行覆盖 ≠ 关键路径覆盖——**变更覆盖率（diff coverage）更有指导性**：新代码的覆盖必须达标（门禁 80%+），存量不追；把指标从"全量行覆盖"换成"分支覆盖 + 变更覆盖 + 核心模块覆盖"的组合，指标游戏空间就小了。',
                '检验测试质量的三招：**变异测试抽查**（改逻辑看测试挂不挂——与 QA 方向 AI 测试题的变异思路同源）；**故障注入回顾**（线上 bug 复盘时问"哪个测试本该拦住它"，补上并归因漏洞类型）；**测试代码也 review**（断言有没有真断、mock 是否过深——测试的腐烂速度不亚于业务代码）。',
              ],
            },
          ],
        },
        {
          id: 'fe-eng-webpack-vite',
          title: 'Vite 为什么快？和 Webpack 的构建原理有什么本质区别？',
          difficulty: 'intermediate',
          tags: ['Vite', 'Webpack', '构建'],
          points: [
            '**Webpack**：以入口为起点**构建完整依赖图**，把所有模块打包成 bundle（loader 转换、plugin 扩展、代码分割）；开发环境也要全量打包，冷启动随项目规模变慢。',
            '**Vite 开发模式**：**基于原生 ESM 按需编译**——浏览器请求哪个模块就现场转换哪个（esbuild 预构建依赖 + 单文件转译），冷启动与项目体积解耦，HMR 精确到模块、毫秒级。',
            '**esbuild 预构建**的作用：把 CJS/UMD 依赖转成 ESM、合并细碎模块减少请求数、结果缓存到 node_modules/.vite。',
            '**Vite 生产构建用 Rollup**（Rolldown 整合在推进中）：ESM 语义天然利于 Tree Shaking 与更优 chunk 产物；开发/生产双引擎的行为差异是其历史争议点。',
            '选型：新项目默认 Vite；超大型存量 Webpack 项目可评估 Rspack（兼容 Webpack API 的 Rust 实现）渐进迁移。',
          ],
          followUps: [
            {
              question: '为什么依赖要预构建而不是同样按需转换？',
              points: [
                '依赖的特点是**数量庞大但极少变更**：react + 组件库生态可能上千个模块，逐个按需请求会陷入请求瀑布（嵌套 import 一个个被发现）；预构建把它们**合并成单文件**，请求数骤降。',
                '预构建结果**缓存到 node_modules/.vite**：锁文件与配置不变则直接复用；依赖升级后用 `vite --force` 或自动失效重建。',
              ],
            },
            {
              question: 'Vite 的 HMR 边界是怎么确定的？',
              points: [
                '模块通过 `import.meta.hot.accept()` **声明自接受**：接受则该模块就是 HMR 边界，更新只重新执行它；Vue SFC、React Fast Refresh 由框架插件自动注入 accept。',
                '未被接受的更新**沿 import 链向上冒泡**，直到找到能接受的模块或到达入口——后者触发整页刷新，这就是"改某些文件必须刷新"的原因。',
              ],
            },
          ],
        },
        {
          id: 'fe-eng-tree-shaking',
          title: 'Tree Shaking 的原理是什么？为什么有时候摇不掉？',
          difficulty: 'intermediate',
          tags: ['Tree Shaking', '构建', 'ESM'],
          points: [
            '前提是 **ESM 静态结构**：编译期即可确定 import/export 关系，打包器从入口做**作用域分析**标记未引用的导出，压缩阶段（Terser/SWC/esbuild）删除死代码。',
            '**package.json 的 sideEffects 字段**是关键开关：`"sideEffects": false` 声明包内文件无副作用，未被引用的模块可整体删除；CSS 等需白名单保留（如 `["*.css"]`）。',
            '摇不掉的常见原因：① CJS/UMD 动态导出；② 模块顶层有副作用（polyfill、注册、全局修改）；③ **动态访问**导出（`import * as` 后按变量索引）；④ Babel 把 ESM 转成了 CJS；⑤ 类的继承/原型操作被判有副作用。',
            '验证手段：bundle 分析器（rollup-plugin-visualizer / webpack-bundle-analyzer）、对照 sourcemap 看实际包含的模块。',
            '实践：库作者提供 ESM 构建 + sideEffects + 规范的 exports；业务侧避免 barrel 文件（index.ts 转发全部导出）引发的连带引入。',
          ],
          followUps: [
            {
              question: '为什么 barrel 文件会拖慢构建并破坏摇树？',
              points: [
                '`index.ts` 转发全部导出形成**中心聚合点**：import 其中一个函数，打包器也要**分析整个 barrel 引用的所有模块**，开发环境 HMR 与类型检查随之变慢。',
                '摇树风险：barrel 里存在模块级副作用或动态导出时**整桶保留**；最佳实践是深路径导入，或依赖包自身良好的 exports 与 sideEffects 声明。',
              ],
            },
            {
              question: 'lodash 与 lodash-es 的区别体现了什么？',
              points: [
                'lodash 主包是 **CJS/UMD**：模块边界动态、难以静态分析，业务侧基本全量引入；lodash-es 是 **ESM 版本**：每个函数独立模块 + 可摇树，只打包用到的函数。',
                '启示：摇树能力是**包作者的义务**（提供 ESM 构建 + sideEffects + exports），不是业务侧配置能凭空造出来的。',
              ],
            },
          ],
        },
        {
          id: 'fe-eng-babel-swc',
          title: 'Babel 的编译流程是怎样的？SWC/esbuild 为什么快？',
          difficulty: 'intermediate',
          tags: ['Babel', 'SWC', '编译'],
          points: [
            'Babel 三阶段：**parse**（源码 → AST，@babel/parser）→ **transform**（遍历 AST，插件按 visitor 修改）→ **generate**（AST → 代码 + sourcemap）；preset 是插件集合，preset-env 按 browserslist 目标自动做语法转换与 polyfill 注入。',
            '**polyfill 演进**：core-js 全量引入 → `useBuiltIns: "usage"` 按需注入 → 目标浏览器现代化后直接放弃转换，只保留语法糖编译。',
            '**SWC**（Rust）与 **esbuild**（Go）：**原生二进制 + 多线程**，解析/转换/压缩比 JS 实现快一个数量级；Next.js、Rspack、Vite 都采用。',
            '区分两个概念：**语法转换**（esbuild 也能做）与 **API polyfill**（esbuild 不做，需要 core-js 或提高 browserslist 目标）。',
            '工程建议：用 browserslist 统一各工具的目标环境；业务代码交给打包器原生转译，Babel 保留给仍依赖其插件生态的场景。',
          ],
          followUps: [
            {
              question: '语法转换和 API polyfill 有什么区别？esbuild 为什么不做 polyfill？',
              points: [
                '**语法转换**改写代码结构（箭头函数 → function），不需要运行时支持；**API polyfill** 补运行时缺失的方法（Array.flat、Promise.allSettled），要向全局/原型注入实现。',
                'esbuild 只做前者：注入哪些 polyfill 是"目标环境矩阵 + 副作用"的策略问题，由 core-js + preset-env 或抬高 browserslist 目标解决。',
                '事故模式：只换语法不补 API，"新语法编译过的代码在旧浏览器调用了不存在的方法"——上线前要按目标环境核对 API 覆盖。',
              ],
            },
            {
              question: 'useBuiltIns: "usage" 的按需注入有什么注意点？',
              points: [
                'usage 按代码中**实际用到的 API** 注入 core-js 对应模块，避免全量引入（全量约 90KB+ gz）；必须锁定 **corejs 版本号**（corejs: 3）与 browserslist 一致。',
                '坑：第三方包内部用到的 API 不会被业务代码触发注入（usage 只扫自己编译的代码），依赖库需要自带 polyfill 或在入口手工补关键 API。',
              ],
            },
          ],
        },
        {
          id: 'fe-eng-sourcemap',
          title: 'Source Map 的原理是什么？生产环境应该怎么配置？',
          difficulty: 'intermediate',
          tags: ['Source Map', '构建', '调试'],
          points: [
            '**.map 文件**记录"生成代码位置 ↔ 源码位置"映射：`version/sources/sourcesContent/names/mappings`，mappings 用 **VLQ 编码**压缩行列差值。',
            '生成代码末尾的 `//# sourceMappingURL=xx.js.map` 告诉 DevTools 去哪取 map；部署时把 map 放内网或上传到监控平台，**不发布到公网 CDN**。',
            '生产常见策略：`hidden-source-map`（生成但不写引用注释）或 `nosources-source-map`（保留结构隐藏源码）；错误上报后用上传的 map 反解堆栈到源码行级。',
            '工具链 map 串联：TS → JS → 打包 → 压缩，每步都产出 map，需链式合并（source-map 库负责生成与消费）。',
            '配套闭环：全局错误监听（error/unhandledrejection）+ ErrorBoundary + sourcemap 反解，构成线上排障体系。',
          ],
          followUps: [
            {
              question: '生产环境 sourcemap 应该怎么管理？直接发到 CDN 会怎样？',
              points: [
                'map 文件的 sourcesContent 包含**完整源码**（含注释与内部 API 路径），公开发布等于把源码暴露给攻击者。',
                '正确姿势：`hidden-source-map` 生成但不写引用注释，构建后**上传到错误监控平台/内网**，堆栈上报后由平台反解；确保线上无法访问 .map 文件。',
              ],
            },
            {
              question: 'TS → 打包 → 压缩多步转换，sourcemap 如何保持正确？',
              points: [
                '每一步都会产出自己的 map，必须**链式合并**（source-map 库的 SourceMapGenerator/Consumer 串联），最终 map 直接映射回原始 TS 源码行。',
                '常见错位原因：某一步漏传 --source-map、转换器重排代码后没更新 mappings；验证方式是在产物中人为抛错，核对反解后的行号与源码一致。',
              ],
            },
          ],
        },
        {
          id: 'fe-eng-package-manager',
          title: 'npm 和 pnpm 在依赖管理上有什么区别？幻影依赖是什么？',
          difficulty: 'intermediate',
          tags: ['npm', 'pnpm', '依赖管理'],
          points: [
            '**npm/yarn 的扁平化 node_modules**（hoisting）：把依赖尽量提升到顶层，代价是**幻影依赖**——代码能 require 到未在 package.json 声明的包（被别的包带到顶层），埋下升级事故。',
            '**pnpm 用内容寻址存储 + 硬链接**：全局 store 只存一份文件，项目内通过硬/软链接引用，**省磁盘 + 安装快**；node_modules 按声明严格隔离（.pnpm 结构），天然杜绝幻影依赖。',
            '**lockfile** 是确定性的关键：package-lock.json / pnpm-lock.yaml 锁定版本与完整性哈希；CI 必须 `npm ci` 或 `pnpm install --frozen-lockfile`，禁止隐式重新解析。',
            '版本策略：`^`/`~` 与 SemVer；monorepo 用 workspace 协议（`workspace:*`）链接内部包。',
            '迁移注意：pnpm 严格模式会暴露历史"缺声明"的包，需要补全 dependencies；理清 peerDependencies 语义（宿主提供、插件声明）。',
          ],
          followUps: [
            {
              question: 'pnpm 的硬链接为什么省空间？跨文件系统怎么办？',
              points: [
                '硬链接是**同一份数据的多个目录入口**（相同 inode），不复制内容：全局 store 存一份，N 个项目的 node_modules 都指向它，磁盘只算一份。',
                '跨文件系统无法硬链接（inode 只在单文件系统内有效），pnpm 降级为**复制**；store 默认放同一分区的 ~/.pnpm-store，也可配置 store-dir 对齐。',
              ],
            },
            {
              question: 'peerDependencies 在 npm 7+ 会自动安装，这带来什么问题？',
              points: [
                '自动安装破坏了"宿主提供、插件声明"的契约：插件可能自带一份 react，**多实例共存**——hooks 上下文断裂（Invalid hook call）、Context 不互通、单例语义失效。',
                '应对：pnpm 7 默认**不自动安装 peer**（严格遵循声明），pnpm 8+ 默认 `auto-install-peers=true`（多实例版本风险重新出现，需用 overrides 收敛）；库作者应把 peer 范围声明得尽量宽（如 ^18 || ^19）。',
              ],
            },
          ],
        },
        {
          id: 'fe-eng-monorepo',
          title: '什么是 monorepo？pnpm workspace + Turborepo 的核心机制？',
          difficulty: 'intermediate',
          tags: ['monorepo', 'Turborepo', '工程化'],
          points: [
            '**monorepo**：多个包/应用同仓库管理（对比 polyrepo 多仓库）。收益：跨包改动原子提交、共享配置与工具链、版本联动重构；代价：仓库体积、权限与发布流程复杂。',
            '**pnpm workspace**：pnpm-workspace.yaml 声明包范围，内部依赖用 `workspace:*` 软链，本地改动即时生效。',
            '**Turborepo/Nx 的核心是任务编排 + 缓存**：按依赖图拓扑并行执行 build/test/lint；**远程/本地缓存**——输入（源码、依赖、环境变量哈希）不变则直接复用产物，CI 时间大幅缩短。',
            '构建拓扑化：A 依赖 B 则 B 先构建；`--filter=app-a` 只构建受影响子图，配合 changesets 管理版本与 changelog。',
            '配套实践：共享 tsconfig/eslint 配置包、按包划分 CODEOWNERS、发布走 changeset 流程。',
          ],
          followUps: [
            {
              question: 'Turborepo 的缓存输入是怎么计算的？什么会导致"假命中"？',
              points: [
                '任务缓存的 key 由**声明的输入哈希**决定：包源码、依赖 lockfile、环境变量、turbo.json 配置——输入不变则直接复用产物目录。',
                '假命中风险：任务读取了**未声明的输入**（远程配置、系统时间、未纳管文件），输入变了但哈希没变，产物是旧的；治理靠把隐式依赖显式化（inputs、env 声明）。',
              ],
            },
            {
              question: 'monorepo 里内部包用 workspace:* 协议，发布时要注意什么？',
              points: [
                '`workspace:*` 只在 workspace 内解析：发布前必须由 changesets 等工具**替换为真实版本号**，否则消费者装到非法版本依赖。',
                '配套：私有包加 `private: true` 防误发；包间用 exports 明确入口；CI 按拓扑序构建受影响子图，避免"改了 A 包忘了发依赖它的 B 包"。',
              ],
            },
          ],
        },
        {
          id: 'fe-eng-cicd',
          title: '前端的 CI/CD 流水线一般包含哪些环节？如何做灰度发布与回滚？',
          difficulty: 'intermediate',
          tags: ['CI/CD', '灰度发布', '工程化'],
          points: [
            '典型流水线：**代码检查**（lint + type check）→ **测试**（单测/组件测试，必要时 E2E）→ **构建**（产物 + sourcemap 归档，缓存依赖与产物）→ **部署**（CDN/对象存储 + 网关配置）→ **验证与通知**（冒烟检查、指标监控）。',
            '前端部署本质是**静态产物 + 入口文件**：带 hash 的 js/css 设 `Cache-Control: max-age=31536000, immutable` 长缓存；index.html 用 no-cache 协商缓存，保证发版后入口更新。',
            '**灰度**手段：网关按流量/用户标签分流、独立灰度域名 + 白名单、Feature Flags（Unleash 等）做功能级开关。',
            '**回滚**：保留 N 个历史版本产物目录，网关/软链/CDN 切换指向实现分钟级回滚；版本号与 sourcemap 一一对应，排障才能落地。',
            '安全规范：构建时只注入公开环境变量（VITE_ 前缀即公开）、依赖漏洞扫描（npm audit/Socket 类）、发布审批与制品留存。',
          ],
          followUps: [
            {
              question: '为什么 index.html 必须用 no-cache 而带 hash 的资源用 immutable 长缓存？',
              points: [
                '发版后**入口必须最新**：index.html 知道引用哪些 hash 文件，强缓存会让用户停在旧版本、引用已删除资源而 404；no-cache 每次协商校验。',
                'hash 资源**内容永不变**：immutable 让浏览器连 revalidate 都省掉；两者配反就是事故——入口长缓存导致发版不生效，hash 资源短缓存导致回访全量拉取。',
              ],
            },
            {
              question: '灰度发布前端的常见维度有哪些？如何处理新旧版本共存问题？',
              points: [
                '维度：**流量比例**（网关按 uid/设备哈希分流）、**白名单**（内部员工/特定租户先上）、**Feature Flag**（功能开关与发布解耦）。',
                '共存问题：长驻页面发版后**新旧 chunk 混用**导致懒加载 404——全局捕获 chunk 加载失败并提示刷新；localStorage 里的旧数据要设计版本迁移。',
              ],
            },
          ],
        },
        {
          id: 'fe-eng-ssr-hydration',
          title: 'SSR/同构渲染的原理是什么？hydration mismatch 是怎么产生的、怎么排查？',
          difficulty: 'advanced',
          tags: ['SSR', 'hydration', '同构'],
          points: [
            '**同构 = 一份组件代码跑两端**：服务端 `renderToString` 直出 HTML（首屏快、SEO 可抓），客户端 **hydrate（注水）**：不重建 DOM，把事件监听与状态"附着"到现有 DOM 上。与 RSC 题分工：那题讲组件运行位置的划分，本题讲经典同构链路与注水细节。',
            '**hydration mismatch 的根因清单**（服务端与客户端首次渲染输出不一致）：① **时间与随机**（`Date.now()`、`Math.random()`、本地化格式化）；② **客户端才有的环境**（`window.innerWidth`、`localStorage`、`navigator`）；③ 服务端取数与客户端取数竞态（两端数据版本不同）；④ **浏览器改写了 HTML**（表格结构纠错、浏览器插件注入属性）；⑤ 渲染分支依赖端标识（`typeof window` 判断）。React 18 检测到 mismatch 会**丢弃服务端 HTML 整树重建**（白屏代价），React 19 改为按差异打补丁且报错更精确。',
            '排查手法：按报错指出的节点二分定位（注释组件二分法）、确知无害的差异（如时间戳显示）用 `suppressHydrationWarning` 局部压制、**端差异逻辑移到 `useEffect`**（首渲染两端一致，交互后再校正）或 `useSyncExternalStore` 统一外部状态读取——这是"治本"与"压制"的分界线，面试要点出来。',
            '工程深水区（区分度所在）：**流式 HTML + 选择性注水**（React 18：HTML 边生成边发送，Suspense 边界各自 hydrate，被用户点到的边界优先注水——首屏不再等整页）；**脱水（dehydrate）数据**：服务端取的数据嵌进 `window.__INITIAL_STATE__`，要防 XSS（JSON 里的 `</script>` 必须 `<` 转义）与超大 payload 拖慢可交互时间——**首屏快了但 TTI 变差**是 SSR 的经典隐性成本。',
            '收束权衡：SSR 不是银弹——服务器成本、TTFB 与缓存设计（静态化 SSG / ISR 是折中路线）；判断依据回到指标与需求（LCP/FCP 目标、SEO 强度、个性化程度），而不是"上了看起来先进"。',
          ],
          followUps: [
            {
              question: 'hydration 一定要做吗？听说过 Islands 架构吗？',
              points: [
                '**Islands（孤岛）架构**：页面默认是静态 HTML（零 JS），只有真正交互的组件（搜索框、购物车）作为"岛屿"注水——Astro 是代表，Qwik 更进一步做"恢复到点击"（事件监听序列化，点的时候才加载执行）。代价是交互能力被框架约束。',
                '它能成立的前提：**页面大部分区域是非交互的**（内容型站点）；对重交互应用（编辑器、后台）收益有限。能说出"注水成本与页面交互密度成正比，所以内容站适合 Islands、应用站适合全注水或 CSR"，就是架构选型视角而非工具视角。',
              ],
            },
          ],
        },
        {
          id: 'fe-eng-tracking-sdk',
          title: '从零设计一个前端埋点 SDK，你的方案是什么？',
          difficulty: 'advanced',
          tags: ['埋点', 'SDK', '数据采集'],
          points: [
            '**事件模型先行**：一条事件 = 谁（userID/设备 ID）+ 何时（客户端时间戳 + 服务端接收时间双时间线）+ 哪里（页面路径 + 组件位置）+ 什么（事件 ID + 参数）+ 环境（端/版本/渠道）；配套**事件字典与命名规范**（与数据团队约定，防"同义事件爆炸"——埋点治理是数据治理的前置，这个视角是高级感所在）。',
            '三类采集方式：**代码埋点**（精确带业务参数，侵入业务）、**全埋点/无埋点**（自动监听 click/change/曝光，研发省力但参数语义弱、量与噪声大）、**可视化埋点**（运营圈选配置下发）。成熟 SDK 混合：全埋点兜底 + 关键链路代码埋点，能对比三者成本是产品化思维。',
            '**上报工程（SDK 质量的分水岭）**：批量合并 + 内存队列；**页面卸载用 `navigator.sendBeacon`**（浏览器保证发出、不阻塞关闭）与 **1×1 gif 打点**（GET 跨域无预检、兼容性兜底）；失败重试 + **本地缓存补发**（localStorage/IndexedDB，带事件 ID 幂等去重，防重复上报）；高频事件**采样与限流**；处理 document.visibilityState 时机，杀掉"切后台丢最后一批"的经典 bug。',
            '质量与合规：schema 校验（上报前校验事件结构，脏数据在端上拦）、SDK 自监控（上报成功率、队列长度）、体积与性能预算（异步加载、不阻塞主线程、不因 SDK 崩掉宿主——try-catch 包一切回调）、隐私合规（敏感字段脱敏、用户授权 consent 后才初始化，与前端安全题的敏感数据要点呼应）。',
            '体系化收束：SDK 只是采集端，完整链路 = 采集 → 上报网关 → 清洗入仓 → 看板/漏斗；设计时就要为下游考虑（字段稳定、版本兼容、乱序可纠正）——"埋点是给数据团队写的 API"，这句话能瞬间拉开与纯实现视角的差距。',
          ],
          followUps: [
            {
              question: '曝光埋点怎么做才算准？列表快速滑过算曝光吗？',
              points: [
                '技术方案：**IntersectionObserver** 监听元素进入视口，配合**曝光判定规则**——可见面积比例阈值（如 ≥50%）+ 停留时长阈值（如 500ms~1s，防快速滑过刷量）；同一元素**去重**（一次会话内重复曝光是否上报要看指标定义，曝光人数 vs 曝光次数口径不同）。',
                '难点：虚拟列表节点复用时的重复/漏报（组件卸载时机要对）、React 并发渲染下 Observer 的挂载时机、H5 与原生的曝光对齐口径——把"曝光的口径定义"当需求问题而不是纯技术问题提出来，是这道追问的隐藏考点。',
              ],
            },
          ],
        },
        {
          id: 'fe-eng-component-library',
          title: '如果让你建设团队的组件库/设计系统，关键设计决策有哪些？',
          difficulty: 'advanced',
          tags: ['组件库', '设计系统', '工程化'],
          points: [
            '定位先立住：组件库不是"代码合集"，是**团队的产品**——有用户（业务开发）、有 API 稳定性承诺、有发布节奏；设计系统 = **设计 token**（颜色/间距/字号/圆角的命名变量）+ 组件实现 + 文档；token 化让换肤、多品牌、暗色模式成为配置问题而不是 fork 一份代码。',
            '**API 设计三原则**：① **受控与非受控双模式**（`value/onChange` 与 `defaultValue` 二选一，内部维护状态做兜底）；② **组合优于配置**（compound components：`Menu` + `Menu.Item`，避免一个组件几十个 props 的配置地狱）；③ **透传原生行为**（rest props spread、`forwardRef`、不吞事件与 className）——业务方"逃出生天"的口子必须留。',
            '稳定性工程：**语义化版本 + 自动变更日志**（changesets），破坏性变更配 codemod 迁移脚本而不是口头通知；**无障碍内建**（role/aria、键盘导航、focus trap——业务方默认拿到 a11y）；测试策略 = 交互逻辑单测（Testing Library）+ **视觉回归**（Playwright 截图 diff 防 UI 漂移）。',
            '工程设施：monorepo 管理（与 monorepo 题分工）、**tree-shaking 友好**（ESM + `sideEffects: false`，按需引入零配置）、文档站（Storybook：用例即文档即 playground）；多框架/多视觉风格时考虑 **headless 内核**（行为与样式分离，Radix 模式），样式层独立成可替换的主题包。',
            '治理与 ROI：**迁移成本是最大的敌人**——增量采纳（新业务先用、旧业务按接触点渐进迁移）、贡献流程（RFC + 双人 review）、覆盖率与使用度度量；收束口径：组件库的收益 = 复用节省的开发时间 + 全站一致性，但**只有治理跟得上才兑现**，没有 owner 的组件库三个月就变成"没人敢升级的祖传依赖"。',
          ],
          followUps: [
            {
              question: '破坏性变更怎么发布才能不惹怒所有业务方？',
              points: [
                '标准节奏：新 API 与旧 API **并行一个版本周期**（旧 API 打 deprecation 警告 + 迁移文档链接）→ 提供 **codemod**（可执行的老代码自动改写脚本，把人力成本从"每个团队一天"压到"CI 里跑一次"）→ 大版本移除并发布公告列明清单。',
                '兜底机制：_locked 版本长期分支只收关键 bugfix_（有明确的服务终止时间）、企业内私有 registry 允许业务锁版过渡；把"升级成本"当组件库自己的产品指标（跟踪各业务落后版本数），而不是甩给业务的义务——这个立场是资深与初级的分水岭。',
              ],
            },
          ],
        },
        {
          id: 'fe-eng-micro-frontend',
          title: '微前端解决什么问题？qiankun 和 Module Federation 的实现思路？',
          difficulty: 'advanced',
          tags: ['微前端', 'qiankun', 'Module Federation'],
          points: [
            '解决**多团队/多技术栈大型应用的集成与独立交付**：子应用独立开发、独立部署、技术栈异构，也是老系统（React/Angular 遗留）增量迁移的手段。',
            '**qiankun**（基于 single-spa）：**HTML Entry** 拉取子应用页面并解析出资源 → 加载执行；**JS 沙箱**用 Proxy 代理 window（低版本降级快照沙箱），**样式隔离**用 scoped class 或 Shadow DOM（兼容坑多）；通过 mount/unmount 生命周期挂载卸载。',
            '**Module Federation**（Webpack5/Rspack）：**构建期声明共享模块**，运行时按需从远端容器加载组件/依赖；`shared` 配置对 React 等依赖做去重单例协商，"应用即模块"。',
            '核心难点：样式冲突与隔离、全局状态与路由接管（主子应用 history 协调）、公共依赖版本协商与共享失败的回退、二次加载的性能开销。',
            '选型提醒：微前端是**组织架构问题的技术解**，成本不小；优先考虑同框架 + npm 包 + 路由级拆分，确有多栈共存/独立发布诉求再上。',
          ],
          followUps: [
            {
              question: 'qiankun 的 JS 沙箱是怎么实现的？哪些场景会"漏"？',
              points: [
                'Modern 沙箱：**Proxy 代理 fakeWindow**，写操作记录在沙箱内、读操作先查沙箱再回落真 window，卸载时还原；不支持 Proxy 的环境降级为**快照沙箱**（激活拍快照、卸载恢复）。',
                '会漏的场景：**绕过代理拿原生引用**——直接操作 document、addEventListener 挂到 document/window、未清理的定时器与全局变量、动态 script 注入；共享全局的副作用要靠规范约束 + 生命周期清理。',
              ],
            },
            {
              question: 'Module Federation 的 shared 依赖版本冲突时如何降级？',
              points: [
                'shared 协商：各容器声明 **requiredVersion（singleton/strictVersion）**，比较各自提供的版本，**满足 semver 范围的高版本胜出**；都不满足就回退到**本地打包的 fallback 版本**。',
                'React 这类必须单例的库配 `singleton: true`：版本不满足时用已加载那份并告警；strictVersion: true 直接抛错——生产建议提前统一版本，避免两份 React 导致 hooks 失效。',
              ],
            },
          ],
        },
        {
          id: 'fe-eng-bundle-analysis',
          title: '线上首屏越来越慢，你怎么对构建产物做分析与体积治理？',
          difficulty: 'advanced',
          tags: ['构建优化', '体积治理', '代码分割'],
          points: [
            '先量化再动手：`rollup-plugin-visualizer` / `source-map-explorer` 生成 treemap，回答三个问题——**最大的依赖是什么、有没有重复打包、首屏 chunk 里混进了什么**；没有数据的体积优化都是玄学。',
            '常见体积来源与治理：重复依赖多版本并存（`npm ls` + overrides 统一）；moment 全量 locale → dayjs、lodash 全量引入 → 按需 ESM 引用触发 tree-shaking；polyfill 过量（browserslist 精确目标 + 按需 core-js）；UI 库全量 → 按需加载。',
            '代码分割：**路由级 lazy** 是底线；再按"变化频率"用 manualChunks 拆 vendor（框架/组件库拆稳定 chunk 吃长效缓存，业务代码频繁变也不影响用户缓存）；编辑器/图表等大依赖用动态 import 按需加载。',
            '传输层：gzip 换 **brotli**（文本再省 15-20%，预压缩静态产物）；配 HTTP/2 多路复用，chunk 数量增加的请求代价可控——"更多更小的 chunk + 长效缓存"通常优于"一个巨包"。',
            '**治理机制化**：CI 接体积门禁（size-limit 类工具，超阈值挡合并）、PR 上输出 bundle diff 报告、把首屏资源清单纳入监控——体积治理是持续过程，一次清理必然回弹。',
          ],
          followUps: [
            {
              question: 'tree-shaking 为什么经常不生效？',
              points: [
                'CommonJS 的动态 require 无法静态分析——依赖必须 ESM；`sideEffects: false`（或精确标注）没配，未引用模块仍会保留。',
                '有副作用的模块（polyfill、CSS 引入、自执行初始化）被误 shaking 会出运行时错误——sideEffects 要精确到文件模式。',
                'Babel 转译到 CommonJS、class 成员/装饰器等难以静态判断的语法都会破坏 shaking——保留 ESM 输出给打包器。',
              ],
            },
            {
              question: 'chunk 拆得越细越好吗？',
              points: [
                '拆分提升缓存命中，但 chunk 数量增加并行请求数与解析成本；HTTP/1.1 下请求代价高，HTTP/2+ 才适合细粒度。',
                '被多个入口共享的小模块若不提取，会重复打包；若过度提取，改一行公共代码会击穿所有 chunk 缓存——按"变化频率分层"是最稳的拆分维度。',
              ],
            },
          ],
        },
      ],
    },
    {
      id: 'fe-perf',
      name: '性能优化',
      description: '以 Core Web Vitals 为纲的加载与运行时优化，大厂面试的高频综合题。HTTP 缓存与"计算机基础 → 计算机网络"的同题分工：网络方向讲强缓存/协商缓存的报文语义，本领域聚焦**前端缓存策略设计与性能实践**。',
      references: [
        { label: 'Core Web Vitals 官方指南', url: 'https://web.dev/articles/vitals' },
        { label: 'web-vitals 测量库', url: 'https://github.com/GoogleChrome/web-vitals' },
        { label: 'MDN Performance API', url: 'https://developer.mozilla.org/en-US/docs/Web/API/Performance_API' },
        { label: 'Lighthouse GitHub 仓库', url: 'https://github.com/GoogleChrome/lighthouse' },
      ],
      questions: [
        {
          id: 'fe-perf-core-metrics',
          title: 'Core Web Vitals 有哪些指标？各自怎么优化？',
          difficulty: 'basic',
          tags: ['性能', 'Core Web Vitals'],
          points: [
            '三大指标：**LCP**（最大内容绘制，≤2.5s，衡量加载，通常是首屏大图/标题块）；**INP**（交互到下一次绘制，≤200ms，衡量响应性，2024 年起取代 FID）；**CLS**（累计布局偏移，≤0.1，衡量视觉稳定性）。',
            '**LCP 优化**：关键资源优先（preload LCP 图 + fetchpriority、字体 font-display）、CDN 与缓存、SSR/预渲染、压缩与减少关键请求链。',
            '**INP 优化**：拆分**长任务**（>50ms）、输入处理里少做同步计算（拆给 rAF/Worker/空闲时间）、避免强制同步布局、治理第三方脚本。',
            '**CLS 优化**：给图片/视频/广告位设 **width/height 或 aspect-ratio**、避免在现有内容之上动态插入、字体用 fallback 匹配与 size-adjust、动画只用 transform。',
            '测量：实验室（Lighthouse）找问题 + **真实用户监控 RUM**（web-vitals 库）验证效果；以 75 分位达标为准。',
          ],
          followUps: [
            {
              question: 'FID 为什么被 INP 取代？',
              points: [
                'FID 只测**第一次交互的输入延迟**（点击到处理函数开始执行），既不看后续交互，也不看处理与渲染耗时——"首次很快、后续全卡"的页面 FID 照样合格。',
                'INP 统计**整个生命周期内所有交互**（取最差交互的近似分位），覆盖输入延迟 + 处理时长 + 下一帧绘制，真实反映交互体验。',
              ],
            },
            {
              question: '如何在真实用户侧采集 LCP？有哪些坑？',
              points: [
                '`PerformanceObserver` 监听 largest-contentful-paint，构造时传 `buffered: true` 回溯注册前的记录；用 web-vitals 库封装最稳，上报时机是首次交互或页面隐藏（交互前 LCP 值仍可能被更大元素更新）。',
                '坑：SPA 路由切换可能产生新的 LCP 候选（一般只报首次加载）；bfcache 恢复不算新加载，要用 persisted 标记区分；上报用 sendBeacon 防页面卸载丢失。',
              ],
            },
          ],
        },
        {
          id: 'fe-perf-resource',
          title: '静态资源优化有哪些常规手段？',
          difficulty: 'basic',
          tags: ['性能', '资源优化'],
          points: [
            '**图片**：WebP/AVIF（体积降 30-50%）、srcset/sizes 响应式分发、loading="lazy" 懒加载、LCP 大图 preload + fetchpriority=high、CDN 裁剪参数。',
            '**JS/CSS**：压缩（Terser/SWC/esbuild）、按路由代码分割、组件库与 polyfill 按需引入（browserslist）、Tree Shaking 消除死代码。',
            '**字体**：woff2、**子集化**（中文字体收益巨大）、font-display: swap 防白屏、关键字重 preload。',
            '**传输**：Brotli/gzip、HTTP/2 或 3、immutable 长缓存 + 文件名 hash、sourcemap 不上 CDN。',
            '**第三方脚本**：审计统计/客服/AB 脚本，延迟或 facades 方式加载（点击后再加载 embed），它们常是 INP 与带宽的隐形杀手。',
          ],
        },
        {
          id: 'fe-perf-lazy-preload',
          title: '懒加载和预加载分别怎么做？preload、prefetch、dns-prefetch、preconnect 的区别？',
          difficulty: 'basic',
          tags: ['性能', '懒加载', '预加载'],
          points: [
            '**懒加载**：非关键资源延迟加载——图片 `loading="lazy"`、组件动态 `import()`、路由级分割；判断依据是"进入视口才需要"（IntersectionObserver）。',
            '**preload**：当前页面马上要用的关键资源高优先级加载（`<link rel="preload" as="...">`），常用于首图与关键字体；**prefetch**：浏览器空闲时拉取**下一次导航**可能用的资源（低优先级）；`modulepreload` 专用于模块依赖图。',
            '**dns-prefetch** 提前解析 DNS；**preconnect** 提前完成 DNS+TCP+TLS 建连，用于第三方域（CDN、字体站），收益更大但别滥用（占连接）。',
            '优先级管理是本质：LCP 资源给高优先级，非关键资源给低优先级；preload 用错 as 或 crossorigin 会造成**重复下载**。',
            '平衡原则：懒加载省当下带宽，预加载花当下带宽换未来速度，按用户路径决策。',
          ],
          followUps: [
            {
              question: 'preload 用错会造成重复下载，常见的错误姿势有哪些？',
              points: [
                '**crossorigin 不一致**：字体默认以匿名 CORS 模式请求，preload 不加 crossorigin（或加错）会下载两次——高频坑。',
                '`as` 类型写错导致优先级与实际请求不匹配；preload 了最终没被使用的资源白占带宽（Chrome 控制台会警告）；modulepreload 只该用于模块依赖图。',
              ],
            },
          ],
        },
        {
          id: 'fe-perf-cache',
          title: '强缓存和协商缓存的区别？如何设计一套可靠的缓存策略？',
          difficulty: 'intermediate',
          tags: ['缓存', 'HTTP', '性能'],
          points: [
            '**强缓存**：`Cache-Control: max-age=N`（配合 immutable），有效期内不发请求；过期的 Expires 是旧方案。**协商缓存**：`ETag/If-None-Match`、`Last-Modified/If-Modified-Since`，304 复用但仍有一次往返。',
            '经典组合：**带 hash 的静态资源** → 一年强缓存 + immutable；**index.html** → `no-cache` 每次协商——入口新则引用的资源也新。',
            'ETag 按内容生成更精确（秒内多次修改可感知），Last-Modified 精度只到秒且受时钟影响；两者可并用，ETag 优先。',
            '分层缓存：**浏览器 → CDN（s-maxage/stale-while-revalidate 控制边缘缓存）→ 源站**；`Vary` 头决定缓存键是否区分 Accept-Encoding 等请求头。',
            '常见坑：HTML 被强缓存导致发版不生效；POST 一般不缓存；URL query 变化即不同资源，可利用也会造成缓存碎片。',
          ],
          followUps: [
            {
              question: 'no-cache 和 no-store 的区别？',
              points: [
                '**no-cache**：可以缓存，但每次使用前必须**协商验证**（ETag/Last-Modified），命中 304 仍省传输体——适合 index.html。',
                '**no-store**：**完全禁止缓存**（含磁盘与内存副本），每次全量请求——适合敏感响应；代价是带宽与延迟。',
                '易混项：`private` 限制只进浏览器缓存（CDN 不缓存）；`max-age=0, must-revalidate` 与 no-cache 语义接近但依赖实现细节。',
              ],
            },
            {
              question: 'stale-while-revalidate 适合什么资源？有什么风险？',
              points: [
                '语义：缓存过期后**先用旧内容立即响应**，同时后台异步 revalidate——用"一次旧"换"零等待"，适合可容忍短暂过期的静态资源：图标、配置 JSON、非关键 CSS。',
                '风险：不适合价格、库存等强实时数据（用户会看到过期值）；CDN 侧要与 s-maxage 配合，否则浏览器与边缘层行为不一致。',
              ],
            },
          ],
        },
        {
          id: 'fe-perf-code-splitting',
          title: '前端如何做代码分割？splitChunks 的常见策略？',
          difficulty: 'intermediate',
          tags: ['性能', '代码分割', '构建'],
          points: [
            '三类来源：**多入口分割**、**动态 `import()`**（路由级/交互级懒加载，最常用）、**公共依赖提取**（webpack splitChunks / rollup manualChunks）。',
            '常用策略：提取 node_modules 中的大依赖（react、图表库）为 vendors chunk；被多个 chunk 共享的模块按 minChunks 阈值抽 commons；UI 库按需引入代替全量。',
            '路由级最佳实践：每个路由动态 import + 加载态；对"大概率去"的下一路由做预取（webpack 魔法注释 prefetch / modulepreload），点击前提前加载。',
            '权衡：把所有 vendor 打进一个 chunk——改业务代码不影响 vendor 缓存（好），但首包变大；策略应向**缓存稳定性 + 首屏体积**双目标平衡。',
            '衡量：bundle 分析器看体积构成，关注**初始 JS 大小**与请求瀑布，不要只看总包体积。',
          ],
          followUps: [
            {
              question: '为什么不建议把全部 node_modules 合进一个 vendor chunk？',
              points: [
                '**缓存放大**：任何一次依赖升级（哪怕小版本）都使整个 vendor chunk 的 hash 失效，用户回访要重新下载全量三方代码。',
                '**首屏负担**：图表、富文本、日期库全进首包，即使用户只用 5%；正确做法是路由级动态 import + 按模块组分拆 vendor + 按需引入。',
              ],
            },
            {
              question: '动态 import 的 chunk 加载失败如何处理？',
              points: [
                '场景：发版后旧 index.html 引用的 chunk 已被清理、弱网超时——用户停在旧版本里触发懒加载直接白屏。',
                '处理：路由级 `import().catch()` 里**重试一次**，仍失败则提示或自动 reload 拉新入口；配合 ErrorBoundary 兜底与按 chunk 名聚合的错误上报。',
              ],
            },
          ],
        },
        {
          id: 'fe-perf-virtual-list',
          title: '虚拟列表的原理是什么？如何处理不定高场景？',
          difficulty: 'intermediate',
          tags: ['性能', '虚拟列表', '长列表'],
          points: [
            '核心：只渲染**可视区域 ± 缓冲区**的条目。外层固定高度容器 + 内部占位元素撑出滚动条（总高度 = n × itemHeight），监听滚动用 scrollTop 反算 startIndex/endIndex，列表用 translateY 定位。',
            '效果：DOM 节点数恒定在几十个，内存与渲染成本与数据量解耦，万级列表也能流畅滚动。',
            '**不定高方案**：先按**预估高度**渲染，用 ResizeObserver 测量真实高度并维护**前缀和数组**；scrollTop → index 用二分或前缀和查找；已滚过区域用缓存真实高度，未滚到用估算并逐步修正。',
            '细节：快速滚动白屏靠**上下缓冲区**与骨架占位；跳转到第 N 条用累计高度表；key 保持稳定避免内部状态错乱。',
            '现成方案：@tanstack/react-virtual、vue-virtual-scroller；表格/树/分组列表需要专门实现。',
          ],
          followUps: [
            {
              question: '不定高列表为什么会出现"滚动条跳动"？如何缓解？',
              points: [
                '位置映射基于**预估高度**：滚动到某区域实测后修正前缀和，之前"以为"的位置整体偏移——scrollTop 对应内容突变，滚动条跳一下。',
                '缓解：按类型分桶提高预估准确度、只修正未到达区域、测量后用 `scrollTo` 补偿差值；或接受"首次滚过一遍后趋稳"的体验。',
              ],
            },
            {
              question: '虚拟列表和分页加载分别在什么场景用？',
              points: [
                '**虚拟列表**解决"渲染成本"：数据已在本地，万级行流畅滚动，支持快速定位与全量搜索——管理后台、大表格场景。',
                '**分页/无限滚动**解决"传输成本"：服务端数据海量按需拉取。两者可组合：接口分页拉取 + 本地虚拟滚动，是超长信息流的标配。',
              ],
            },
          ],
        },
        {
          id: 'fe-perf-first-screen',
          title: '首屏性能优化你会怎么做？给出一个系统性的方案。',
          difficulty: 'intermediate',
          tags: ['性能', '首屏', 'SSR'],
          points: [
            '**先测量**：Lighthouse/真实 RUM 把链路拆成 TTFB → FCP → LCP，定位瓶颈在网络、服务端还是渲染，再动手。',
            '**网络层**：CDN 就近分发、HTTP/2+、Brotli、关键资源 preload、第三方域 preconnect、减少重定向。',
            '**服务端层**：SSR/流式 SSR/预渲染（内容型页面收益最大）、服务端聚合接口避免客户端请求瀑布、HTML 边缘缓存。',
            '**渲染层**：关键 CSS 内联 + 其余异步、JS defer 与首屏代码最小化、骨架屏改善感知、图片 WebP + 固定尺寸（同时防 CLS）。',
            '**持续治理**：性能预算纳入 CI（bundle 体积、Lighthouse 门槛）、第三方脚本审计、灰度观察指标回归——优化不是一次运动而是流程。',
          ],
          followUps: [
            {
              question: 'SSR、SSG、预渲染分别适合什么场景？各自的代价是什么？',
              points: [
                '**SSR**：每次请求实时渲染，内容新鲜（详情页、搜索结果），代价是服务端成本与 TTFB；**SSG**：构建期生成静态 HTML、CDN 直出最快，适合文档/营销页，代价是内容时效。',
                '共同注意：SSR/SSG 只解决"HTML 快速可见"，**水合前页面不可交互**，水合脚本仍会拖慢 INP——流式 SSR + 选择性水合是演进方向。',
              ],
            },
            {
              question: 'TTFB 偏高怎么排查？',
              points: [
                '拆解链路：DNS（解析慢/未命中）→ TCP/TLS 握手（未复用连接、无 HTTP/3）→ 重定向链 → 服务端处理（无边缘缓存、接口聚合慢、冷启动）。',
                '对策：CDN + 边缘缓存 HTML、preconnect 第三方域、减少重定向、SSR 降级为边缘渲染或增量静态再生；先看 RUM 里 TTFB 的地域与运营商分布定位是网络问题还是源站问题。',
              ],
            },
          ],
        },
        {
          id: 'fe-perf-monitoring',
          title: '如何搭建前端性能与错误监控体系？',
          difficulty: 'advanced',
          tags: ['监控', 'Performance', '错误监控'],
          points: [
            '**采集**：PerformanceObserver 采集 paint/LCP/CLS/长任务；web-vitals 库标准化上报；错误侧 window.onerror、unhandledrejection、资源 onerror、fetch/XHR 包装拦截接口异常；Resource Timing 分析请求耗时。',
            '**上报设计**：采样率控制、批量合并上报、`navigator.sendBeacon`（页面卸载不丢）+ 上报队列降级；监控本身不能成为性能负担。',
            '**还原与归因**：sourcemap 上传到平台反解堆栈、错误按堆栈指纹聚合归并、携带设备/版本/灰度标签；性能大盘看 **p75 分位**并按版本下钻。',
            '**告警与闭环**：阈值/突降告警 → 关联发版与灰度记录 → 定位到提交 → 复盘回归；优化效果用 A/B 或灰度对比验证，不拍脑袋。',
            '现成体系：Sentry（错误 + 性能）、自研 RUM、Lighthouse CI 做实验室门禁——实验室找问题，RUM 验证效果，两者互补。',
          ],
          followUps: [
            {
              question: '为什么性能大盘要看 p75 而不是平均值？告警阈值怎么定？',
              points: [
                '性能数据是**长尾分布**：少数极慢用户拉高均值，平均值掩盖"四分之一用户体验很差"的事实；Core Web Vitals 达标口径就是 **p75**。',
                '阈值：先跑基线拿 p75 现状，按指标预算设绝对阈值（LCP ≤ 2.5s），再叠加**环比突降告警**；按设备/地域/版本维度下钻，避免被单一维度平均掉。',
              ],
            },
            {
              question: '错误上报如何避免"上报本身拖垮页面"？',
              points: [
                '**采样与限流**：错误按比例采样、同一堆栈指纹 session 内聚合去重；性能数据按会话采样，SDK 自身 try/catch 全包裹、初始化失败静默退出。',
                '**异步与降级**：批量入队、空闲时发送；页面卸载用 `sendBeacon`（或 fetch keepalive）降级——监控系统崩溃不能连累业务。',
              ],
            },
          ],
        },
        {
          id: 'fe-perf-long-task',
          title: '什么是长任务？如何减少主线程阻塞、优化交互响应（INP）？',
          difficulty: 'advanced',
          tags: ['性能', 'INP', '调度'],
          points: [
            '**长任务**：主线程连续执行超过 50ms 的任务；期间无法处理输入与渲染，直接推高 INP（交互到下次绘制超过 200ms 即不合格）。',
            '**拆分手段**：大计算切块，用 setTimeout/MessageChannel 让出主线程；新 API `scheduler.postTask/yield` 带优先级调度；非紧急计算进 **Web Worker**；低优先级工作用 `requestIdleCallback`。',
            '**渲染优化**：避免强制同步布局（读写分离）、大列表用 content-visibility、动画只走 transform/opacity 合成、批量 DOM 更新用 DocumentFragment。',
            '**输入路径优先**：事件处理只做必要同步工作（更新受控值），重活交给 transition/idle；React 用 startTransition 把非紧急更新降级。',
            '**第三方脚本治理**：统计/AB/客服是长任务大户，延迟加载、按需加载，或用 Worker 化方案（Partytown 思路）隔离。',
          ],
          followUps: [
            {
              question: 'MessageChannel 和 setTimeout 做任务切片有什么区别？',
              points: [
                '`setTimeout` 有 **4ms 嵌套下限**（第 5 层起），切片密度受限；`MessageChannel` 的 postMessage 是**高优先级宏任务**、无最小延迟，切片更细。',
                '现代标准做法是 `scheduler.postTask/yield`（可带优先级、让出后立即恢复）；React 的并发调度用的就是 MessageChannel。',
              ],
            },
            {
              question: 'INP 统计的是所有交互还是最差交互？如何定位慢交互？',
              points: [
                'INP 取**观察窗口内最差交互的近似分位**——一次糟糕的点击就能拖垮整体分数，优化目标是"消灭最差的那几次"。',
                '定位：web-vitals 的 attribution 版本回传**交互目标选择器与各阶段耗时**（inputDelay/processDuration/presentationDelay），对照 Performance 面板看慢在事件处理、强制布局还是渲染。',
              ],
            },
          ],
        },
      ],
    },
    {
      id: 'fe-security',
      name: '前端安全',
      description: 'XSS/CSRF/CSP 到供应链安全——一面常问、二面深挖的安全素养。',
      references: [
        { label: 'OWASP Cheat Sheet Series', url: 'https://cheatsheetseries.owasp.org' },
        { label: 'MDN Web Security', url: 'https://developer.mozilla.org/en-US/docs/Web/Security' },
        { label: 'MDN Content-Security-Policy', url: 'https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Content-Security-Policy' },
      ],
      questions: [
        {
          id: 'fe-security-xss',
          title: 'XSS 有哪几种类型？如何系统性防御？',
          difficulty: 'basic',
          tags: ['XSS', '安全'],
          points: [
            '三类：**存储型**（恶意脚本入库，所有访问者中招，危害最大）、**反射型**（恶意参数经服务端/前端回显执行）、**DOM 型**（纯前端把不可信数据插入 DOM：innerHTML、eval、URL 参数拼接）。',
            '第一原则：**不可信数据与代码分离**——默认 `textContent` 而不是 innerHTML；必须渲染富文本时用 **DOMPurify** 等库做白名单过滤。',
            '**输出编码按上下文选择**：HTML 实体、属性、URL（encodeURIComponent）、JS 字符串各有规则，"一套编码走天下"会漏。',
            '配置层兜底：**CSP** 限制脚本来源（禁 inline/eval 或用 nonce）、Cookie 加 **HttpOnly** 让脚本读不到凭证；输入侧长度/格式校验是辅助不是主防。',
            '框架默认转义（React 插值、Vue 插值）是主防线，警惕逃逸口：`dangerouslySetInnerHTML`、`v-html`、`javascript:` 伪协议 href、SVG/MathML 上下文。',
          ],
          followUps: [
            {
              question: 'React/Vue 的默认转义在哪些情况下会失效？',
              points: [
                '显式逃逸口：`dangerouslySetInnerHTML` 与 `v-html` 完全绕过转义；`href`/`src` 的 `javascript:` 伪协议不经过 HTML 转义体系。',
                '上下文误用：把用户输入拼进内联 `<script>`、style 表达式、SVG 的 `<use>`；SSR 手工拼接 HTML 模板同样漏防。',
                '防线组合：富文本走 **DOMPurify 白名单清洗**、URL 做协议白名单校验、CSP 兜底——框架转义只是默认防线不是全部。',
              ],
            },
          ],
        },
        {
          id: 'fe-security-csrf',
          title: 'CSRF 的攻击原理是什么？有哪些防御手段？',
          difficulty: 'basic',
          tags: ['CSRF', '安全'],
          points: [
            '**CSRF**：利用浏览器**自动携带目标站 Cookie** 的特性——恶意站点诱导已登录用户的浏览器向目标站发起请求（img/表单/自动提交），**冒用身份**执行转账、改资料等写操作；攻击者拿不到响应，但操作已生效。',
            '成立前提：登录态依赖 **Cookie 自动携带**，且关键操作可被跨站简单请求触发。',
            '**CSRF Token**：服务端下发随机 token，写请求必须携带并校验（表单隐藏域或自定义请求头）；自定义头本身也因跨站表单无法携带而具备防御力。',
            '**SameSite Cookie**：`SameSite=Lax/Strict` 限制跨站请求携带 Cookie（现代浏览器默认 Lax），配合 Secure 与正确的 Domain，性价比最高。',
            '辅助手段：校验 **Origin/Referer**、敏感操作二次确认（验证码/密码）、写操作禁用 GET。',
          ],
          followUps: [
            {
              question: 'SameSite=Lax 和 Strict 分别放行哪些场景？',
              points: [
                '**Lax**：跨站**顶层导航的 GET**（点链接跳转）仍携带 Cookie；表单 POST、img、ajax 等跨站请求不携带——安全与"外链跳转保持登录"的平衡，现代浏览器默认值。',
                '**Strict**：任何跨站请求都不携带，最安全但体验差——从邮件/外部链接跳进来会**未登录**，需要配合子域中转或引导用户重新进入。',
              ],
            },
            {
              question: 'token 改放 localStorage 后还需要防 CSRF 吗？',
              points: [
                'CSRF 基本消除：token 不随请求自动携带，需前端手动放请求头，跨站表单/ img 做不到——攻击前提（浏览器自动带凭证）不存在了。',
                '但 **XSS 风险上升**：localStorage 可被注入脚本直接读取，这是风险转移不是消除——必须同步强化 XSS 防御（CSP、DOMPurify）；敏感系统更推荐 HttpOnly Cookie + CSRF token 组合。',
              ],
            },
          ],
        },
        {
          id: 'fe-security-https',
          title: '为什么前端必须关注 HTTPS？混合内容和 HSTS 是什么？',
          difficulty: 'basic',
          tags: ['HTTPS', '安全'],
          points: [
            'HTTP 明文传输可被**中间人窃听与篡改**（运营商插广告、公共 WiFi 劫持）；HTTPS（TLS）提供**加密 + 完整性 + 身份认证**。',
            '**混合内容**：HTTPS 页面引用 HTTP 资源——主动内容（script、iframe）会被现代浏览器直接**阻止**，被动内容（图片）也在逐步淘汰，发版前要全量检查资源协议。',
            '**HSTS**：`Strict-Transport-Security: max-age=...; includeSubDomains` 让浏览器在有效期内强制走 HTTPS，防降级攻击；配合 preload 名单可覆盖首次访问。',
            'Cookie 必须组合：`Secure`（仅 HTTPS 发送）+ `HttpOnly`（禁 JS 读取）+ `SameSite`（防 CSRF），三者是一套拳。',
            '现代能力前提：HTTP/2、Service Worker、getUserMedia 等都**仅在安全上下文可用**——HTTPS 是新特性的门票。',
          ],
          followUps: [
            {
              question: 'TLS 握手对首屏性能有什么影响？如何优化？',
              points: [
                'TLS 1.2 需要 **2-RTT** 握手，叠加 TCP 三次握手，冷连接首字节延迟可观；TLS 1.3 压到 **1-RTT**，会话恢复可 **0-RTT** 发数据。',
                '优化：启用 TLS 1.3 + Session Resumption、精简证书链与 OCSP stapling、上 HTTP/3（QUIC 内置 TLS 1.3，握手与传输合并）、关键第三方域 preconnect 提前建连。',
              ],
            },
          ],
        },
        {
          id: 'fe-security-clickjacking',
          title: '什么是点击劫持？如何防御？',
          difficulty: 'intermediate',
          tags: ['点击劫持', 'iframe', '安全'],
          points: [
            '**点击劫持（Clickjacking）**：攻击者把目标站点放进**透明 iframe** 叠在诱饵页上，用户点击的其实是"看不见的按钮"（点赞、授权、转账确认）。',
            '**主防御**：响应头 `X-Frame-Options: DENY/SAMEORIGIN`；现代标准是 CSP 的 **`frame-ancestors "none"/"self"`**（支持多源白名单，逐步取代前者）。',
            '**JS 兜底**：检测 `window.self !== window.top` 时跳转顶层或隐藏页面；可能被 sandbox 等手段限制，只能作补充。',
            '**敏感交互加固**：关键操作二次确认（验证码/密码）、明显的按钮交互态；即使公开页面也建议设置 frame 头防钓鱼套壳。',
            '反向场景：合法业务嵌第三方（支付/地图 iframe）时，用 postMessage 并**校验来源 origin 白名单**。',
          ],
          followUps: [
            {
              question: 'X-Frame-Options 和 CSP frame-ancestors 有什么区别？',
              points: [
                'X-Frame-Options 是**老标准**，只有 DENY/SAMEORIGIN 两个值，不支持多域名白名单；CSP 的 `frame-ancestors` 支持源列表、语义更精确，是替代标准。',
                '兼容策略：两者**同时下发**（老浏览器认 XFO，现代浏览器以 frame-ancestors 为准）；注意 frame-ancestors 只能写在**响应头**，meta 标签里的 CSP 不生效。',
              ],
            },
            {
              question: 'JS 检测 window.self !== window.top 的兜底方案为什么只能作补充？',
              points: [
                '它依赖**自己脚本能执行**：攻击者可用 sandbox 属性禁脚本、或配合其他手段绕过；且跳转顶层的行为可能被顶层导航策略限制。',
                '响应头（XFO/frame-ancestors）由**浏览器强制执行**、先于脚本生效，才是主防御；JS 方案只覆盖"头配漏了的页面"。',
              ],
            },
          ],
        },
        {
          id: 'fe-security-csp',
          title: 'CSP 的作用与常用配置？如何渐进式启用？',
          difficulty: 'intermediate',
          tags: ['CSP', '安全', 'HTTP 头'],
          points: [
            '**CSP（内容安全策略）**通过响应头声明资源白名单，浏览器拒绝加载违规资源——是 **XSS 的结构性防线**：脚本即使注入成功也无法加载外链或执行 inline。',
            '核心指令：`default-src` 兜底，`script-src/style-src/img-src/connect-src` 分类管控，`frame-ancestors` 防点击劫持，`base-uri`/`form-action` 防劫持跳转。',
            '**nonce/hash 模式**替代危险的 `unsafe-inline`：服务端生成一次性 nonce，脚本标签携带同值；`unsafe-eval` 同样要关闭。',
            '**渐进式启用**：先上 `Content-Security-Policy-Report-Only` + report-to 收集违规不阻断，观察期后切强制——直接强上 CSP 常把业务打挂。',
            '局限与配套：CSP 不能替代输出编码（同域 XSS 依然有效）；内联样式多、第三方脚本多的应用治理成本高；CDN 资源配 **SRI**（integrity 完整性校验）。',
          ],
          followUps: [
            {
              question: 'Report-Only 模式如何灰度切换到强制模式？',
              points: [
                '阶段一：只下发 `Content-Security-Policy-Report-Only` + report-to，**只上报不拦截**，收集所有违规样本。',
                '阶段二：修正策略（补齐第三方域名、nonce 注入），违规收敛到"仅预期内"后**两种头同时下发**——正式头开始拦截，Report-Only 继续观察。',
                '阶段三：稳定后移除 Report-Only；每次加严重复"先观察后强制"，并持续监控线上新违规。',
              ],
            },
            {
              question: 'SRI（Subresource Integrity）是什么？对动态更新的 CDN 资源有什么限制？',
              points: [
                'script/link 标签加 `integrity="sha384-..."`，浏览器校验资源哈希与声明一致才执行——防御 **CDN 被篡改/劫持注入代码**。',
                '限制：资源一变哈希就失配，**动态更新的文件不能用 SRI**（必须配合版本化 URL）；还要求 CDN 支持 CORS（crossorigin 属性）且缓存层不能对同一 URL 返回不同内容。',
              ],
            },
          ],
        },
        {
          id: 'fe-security-sensitive-data',
          title: '前端如何处理敏感信息？token 放哪里更安全？',
          difficulty: 'intermediate',
          tags: ['安全', 'Token', '隐私'],
          points: [
            '**存储权衡**：localStorage 便于使用但 **XSS 可读**；HttpOnly Cookie XSS 读不到但要防 CSRF（SameSite + token）。较稳的折中：**refresh token 放 HttpOnly Cookie，access token 短期保存在内存**。',
            '认清边界：任何前端存储都防不住"脚本已执行"的终局——**XSS 防御才是第一道也是最关键的一道**，存储方案只是纵深防御。',
            '**敏感数据不出前端**：传输靠 HTTPS；**日志与埋点脱敏**（手机号、地址、token 打码）——错误上报平台不是法外之地。',
            '**不硬编码密钥**：前端的环境变量是公开的（VITE_/NEXT_PUBLIC_ 前缀即意味着公开），签名与密钥逻辑放服务端；注意 sourcemap 和 bundle 会暴露内部 API 结构。',
            '合规意识：个人信息**最小必要 + 明示同意**、退出登录清理全部状态（storage/cookie/内存 store）、遵循平台隐私规范。',
          ],
          followUps: [
            {
              question: '为什么说前端加密对防中间人没有意义？',
              points: [
                '中间人威胁在**传输层**，HTTPS 已用 TLS 解决（加密 + 完整性 + 身份认证）；前端 JS 加密的密钥必然随 bundle 下发，抓包即可获得——加密形同虚设。',
                '前端加密的合理场景是别的威胁模型：防日志/埋点误采、合规脱敏展示、配合服务端做挑战应答——先分清威胁再谈加密。',
              ],
            },
            {
              question: '用户退出登录时需要清理哪些状态？',
              points: [
                '**凭证与存储**：内存中的 access/refresh token、localStorage/sessionStorage/IndexedDB 中的用户数据；同时调用服务端**吊销 token**（不能只删本地）。',
                '**内存状态**：全局 store（用户信息、权限）、接口缓存（queryClient.clear/reset）、事件订阅与定时器。',
                '**跳转与缓存**：重定向到登录页并清理敏感参数；配合 no-store 响应头防止"退出后点后退又看到缓存页面"。',
              ],
            },
          ],
        },
        {
          id: 'fe-security-supply-chain',
          title: '前端供应链攻击是什么？如何降低依赖风险？',
          difficulty: 'advanced',
          tags: ['供应链安全', 'npm', '安全'],
          points: [
            '典型形态：**依赖投毒**（维护者账号被盗后发布恶意版本，event-stream、ua-parser-js 都有历史事件）、**typosquatting** 仿冒包名、**安装脚本**（postinstall 执行任意代码）、**构建/发布链路被攻破**（CI token 泄漏、CDN 篡改）。',
            '**锁定与审计**：lockfile 提交仓库 + CI 用 frozen 模式安装；npm audit/pnpm audit + Dependabot/Renovate 自动跟进升级；定期审视依赖树规模。',
            '**收窄攻击面**：默认禁用陌生包的安装脚本（ignore-scripts 按需放行）、锁定私有 registry、CI 发布使用**最小权限 token + 双因素/provenance**。',
            '**引入评审**：新依赖看维护活跃度、下载量、开源协议、传递依赖规模；关键包必要时 fork 内化。',
            '运行时兜底：CSP 限制外联让恶意脚本难以回传数据、CDN 资源用 SRI 校验完整性、升级后监控异常流量与报错。',
          ],
          followUps: [
            {
              question: 'lockfile 提交仓库能防住哪些攻击？防不住哪些？',
              points: [
                '防得住**版本漂移**：依赖解析被锁定、CI 与本地一致，"作者发布新补丁版本带恶意代码"通过 ^ 浮动版本进来的路径被挡住（配合 frozen 安装）。',
                '防不住：**锁定的版本本身就是恶意的**（投毒发生在发布时）、安装脚本（postinstall）在 lockfile 之外执行任意代码、首次引入时的 typosquatting——所以 lockfile 只是基础，还需审计 + 禁脚本 + 引入评审。',
              ],
            },
            {
              question: '如何评估一个新依赖的安全性？',
              points: [
                '静态面：维护活跃度（最近提交/issue 响应）、下载量与使用者、开源协议、**传递依赖规模**（拉进来的整棵树）。',
                '供应链面：是否有 postinstall 脚本、npm/pnpm audit 报告、socket 类工具的行为分析（安装钩子、网络外联、混淆代码）；关键依赖必要时 fork 内化，引入走评审流程。',
              ],
            },
          ],
        },
        {
          id: 'fe-security-incident-review',
          title: '复盘一次真实的前端安全事故（XSS 或 npm 供应链投毒）：根因与机制化修复怎么做？',
          difficulty: 'advanced',
          tags: ['安全', 'XSS', '供应链安全', '事故复盘'],
          points: [
            '复盘框架通用于两类事故：**时间线**（引入 → 爆发 → 发现 → 止血 → 修复）→ 根因分层（直接原因 / 为什么没拦住 / 为什么没早发现）→ Action 落到机制而不是个案。',
            '**XSS 案例**：UGC 富文本未净化 → 存储型 XSS 窃取 Cookie。根因三层：信任用户输入（无净化）、Cookie 未设 httpOnly（可被 JS 读取）、无 CSP 兜底。修复组合：DOMPurify 白名单净化 + 输出按上下文编码 + **CSP**（禁 unsafe-inline、nonce/hash）+ Cookie 全属性（httpOnly/Secure/SameSite）。',
            '**供应链案例**：恶意 npm 包（typosquatting 蹭名或维护者被钓鱼，如 event-stream 事件）在 postinstall 窃取凭据。根因：lockfile 与依赖来源无审计、install 脚本无约束、CI 权限过大。修复：依赖审计（audit/Dependabot）+ 锁文件评审、CI `--ignore-scripts` + 脚本白名单、私有 registry 白名单、发布令牌最小权限。',
            '**机制层 Action**（个案变机制才防复发）：SAST/依赖扫描进 CI、CSP 违规上报接告警、安全 checklist 进上线流程、把"用户输入永不信任"写进编码规范并配示例。',
            '沟通与影响面：评估哪些用户/数据受影响（Cookie 属性、操作路径、日志回放定位受影响请求），决定是否强制改密与对外披露——安全事件的处置半径按"最坏可能"划，不按"已证实"划。',
          ],
          followUps: [
            {
              question: 'CSP 怎么设计才不形同虚设？',
              points: [
                '禁 `unsafe-inline`/`unsafe-eval`：脚本用 nonce 或文件 hash 白名单，内联事件处理器全部改造。',
                '先 **Content-Security-Policy-Report-Only** 灰度收集违规上报，收敛后再强制；`report-uri` 接入告警，新违规持续可见。',
                'CSP 是纵深防御的一层：它不能替代输入净化与输出编码——三层各自独立生效才叫纵深。',
              ],
            },
            {
              question: '一次存储型 XSS 的爆炸半径怎么评估？',
              points: [
                '看 Cookie/Token 可窃性：httpOnly 与作用域决定"能否冒充登录"；能读 token 即可远程接管账号，不能读但能执行操作则是 CSRF 式滥用。',
                '看传播面：payload 存在什么位置（评论/个人签名）、多少用户会渲染到它、停留时长——决定受影响用户集合；用日志回放精确圈出"已渲染过污染页"的请求再通知与改密。',
              ],
            },
          ],
        },
      ],
    },
    {
      id: 'fe-coding',
      name: '手写代码题',
      description: '防抖节流到 LRU——笔试与白板环节的经典手写题，关键在边界条件与复杂度分析。',
      references: [
        { label: 'MDN JavaScript 文档', url: 'https://developer.mozilla.org/en-US/docs/Web/JavaScript' },
        { label: '现代 JavaScript 教程', url: 'https://javascript.info' },
        { label: 'lodash GitHub 仓库', url: 'https://github.com/lodash/lodash' },
        { label: 'p-limit GitHub 仓库', url: 'https://github.com/sindresorhus/p-limit' },
      ],
      questions: [
        {
          id: 'fe-coding-debounce-throttle',
          title: '手写防抖（debounce）与节流（throttle）',
          difficulty: 'basic',
          tags: ['手写', '防抖', '节流'],
          points: [
            '**防抖**：n 毫秒内多次触发只执行最后一次（每次触发重置计时器），适合搜索联想、resize 结束后计算。',
            '**节流**：n 毫秒内最多执行一次（稀释频率），适合滚动加载、按钮防连点、鼠标移动。',
            '实现要点：防抖用闭包保存 timer 引用并支持 cancel；节流有"时间戳"（首次沿立即执行）与"定时器"（尾沿补发）两种流派，完整版两者都要。',
            '进阶追问点：leading/trailing 可配置、取消方法、this 与参数透传；lodash 的 debounce 还支持 maxWait。',
            '```ts\nfunction debounce<T extends (...args: any[]) => void>(\n  fn: T,\n  wait = 300,\n): ((...args: Parameters<T>) => void) & { cancel(): void } {\n  let timer: ReturnType<typeof setTimeout> | undefined\n  const debounced = function (this: unknown, ...args: Parameters<T>) {\n    if (timer) clearTimeout(timer)\n    timer = setTimeout(() => {\n      timer = undefined\n      fn.apply(this, args)\n    }, wait)\n  }\n  debounced.cancel = () => {\n    if (timer) {\n      clearTimeout(timer)\n      timer = undefined\n    }\n  }\n  return debounced\n}\n\nfunction throttle<T extends (...args: any[]) => void>(fn: T, interval = 300) {\n  let last = 0\n  return (...args: Parameters<T>) => {\n    const now = Date.now()\n    if (now - last >= interval) {\n      last = now\n      fn(...args)\n    }\n  }\n}\n```',
          ],
          followUps: [
            {
              question: '节流想要"首次立即执行且最后一次也执行"怎么实现？',
              points: [
                '**leading + trailing 双沿**：时间戳流派负责首沿——距上次执行超过 interval 立即执行并记录时间；定时器流派负责尾沿——触发但未执行时设 `setTimeout(remaining)` 补发最后一次。',
                '关键细节：尾沿定时器触发后要把 `last` 更新为执行时刻并清空 timer；lodash 的 throttle 本质就是带 maxWait 的 debounce。',
              ],
            },
            {
              question: 'debounce 如何保留原函数的返回值？',
              points: [
                '改造为**返回 Promise**：每次触发都 new Promise 存下 resolve/reject（覆盖旧的），定时器触发时用 fn 结果 resolve；cancel 时要 reject 挂起的 Promise 防止悬挂。',
                '语义：防抖后"多次调用一次执行"，调用方拿到的应是**最后一次的结果**——`await debouncedSearch(kw)` 的使用体验与原生函数一致。',
              ],
            },
          ],
        },
        {
          id: 'fe-coding-call-apply-bind',
          title: '手写 call、apply、bind',
          difficulty: 'basic',
          tags: ['手写', 'this'],
          points: [
            '**call/apply** 核心：把函数临时挂到目标对象上调用（利用"方法调用时 this 指向调用者"），执行后删掉；区别只在参数传递形式。',
            '细节：this 传 null/undefined 时非严格模式指向 window（实现可忽略严格模式差异，但要能讲清楚）；需要返回函数执行结果。',
            '**bind** 返回**永久绑定 this** 的新函数：再次 bind/call 无法改变；支持预设参数（柯里化）；**作为构造函数调用时 this 应指向新实例**而非绑定的对象。',
            '加分项：bind 返回函数的原型要接回原函数（保证 new 出来的实例 instanceof 原函数），函数名规则是 bound xxx。',
            '```ts\n// 把方法挂到 Function.prototype 需要接口扩充声明：declare global { interface Function { myCall: ...; myBind: ... } }\nFunction.prototype.myCall = function (ctx: any, ...args: any[]) {\n  ctx = ctx ?? globalThis\n  ctx = Object(ctx) // 包装原始类型，避免严格模式下对 42 等原始值赋属性抛错\n  const key = Symbol("fn")\n  ctx[key] = this\n  const result = ctx[key](...args)\n  delete ctx[key]\n  return result\n}\n\nFunction.prototype.myBind = function (ctx: any, ...preset: any[]) {\n  const fn = this\n  const bound = function (this: any, ...args: any[]) {\n    // new 调用时 this 是新实例，优先使用实例\n    return fn.apply(this instanceof bound ? this : ctx, [...preset, ...args])\n  }\n  bound.prototype = Object.create(fn.prototype)\n  return bound\n}\n```',
          ],
          followUps: [
            {
              question: '手写 bind 时为什么要处理 new 调用？不处理会怎样？',
              points: [
                '原生 bind 的规则：**new 一个绑定函数时 this 指向新实例**，绑定的 ctx 被忽略（预设参数仍生效）——构造器场景必须兼容。',
                '不处理的后果：`new bound()` 里 this 错指向 ctx，实例属性全部挂到 ctx 上；配合 `bound.prototype = Object.create(fn.prototype)` 实例的原型链才正确。',
                '实现要点：bound 内部判断 `this instanceof bound` 则改用 this 调用原函数。',
              ],
            },
          ],
        },
        {
          id: 'fe-coding-event-emitter',
          title: '手写一个发布订阅（EventEmitter）',
          difficulty: 'basic',
          tags: ['手写', '发布订阅', '设计模式'],
          points: [
            '核心数据结构：`Map<事件名, Set<回调>>`，提供 on 注册、off 注销、emit 触发、once 执行一次后自动移除。',
            '**once 实现细节**：包装函数闭包持有原函数与自身引用，执行前先 off 自身；注意 emit 过程中再注册/移除同名事件的边界（Set 遍历期间删除是安全的）。',
            '健壮性：单个回调抛错不应中断其他回调（try/catch 隔离）；用 **Set** 保证同一函数重复 on 只触发一次、off 能精准移除。',
            '现代 API 风格：on 返回**取消函数**（`const un = on(...)`），在 React/Vue 的副作用清理里比记住函数引用再 off 更顺手。',
            '```ts\nclass EventEmitter {\n  private events = new Map<string | symbol, Set<Function>>()\n\n  on(event: string | symbol, fn: Function) {\n    if (!this.events.has(event)) this.events.set(event, new Set())\n    this.events.get(event)!.add(fn)\n    return () => this.off(event, fn)\n  }\n\n  once(event: string | symbol, fn: Function) {\n    const wrap = (...args: any[]) => {\n      this.off(event, wrap)\n      fn(...args)\n    }\n    return this.on(event, wrap)\n  }\n\n  off(event: string | symbol, fn: Function) {\n    this.events.get(event)?.delete(fn)\n  }\n\n  emit(event: string | symbol, ...args: any[]) {\n    this.events.get(event)?.forEach((fn) => {\n      try {\n        fn(...args)\n      } catch (e) {\n        console.error(e)\n      }\n    })\n  }\n}\n```',
          ],
          followUps: [
            {
              question: 'emit 过程中某个回调把自己 off 掉、或再注册新回调，会出什么问题？',
              points: [
                '用 **Set 存回调**是安全的：迭代期间删除尚未访问到的元素，该元素不会再被遍历到——"回调里把自己 off 掉"没有问题；数组 + splice 的实现会因索引错位跳过或重复回调。',
                '更稳的姿势：emit 前**拷贝一份回调列表** `[...listeners]` 再遍历；once 的包装函数要先 off 自身再执行原函数，防止原函数里再 emit 同名事件造成重入。',
              ],
            },
          ],
        },
        {
          id: 'fe-coding-array-unique-flatten',
          title: '手写数组去重与扁平化',
          difficulty: 'basic',
          tags: ['手写', '数组'],
          points: [
            '**去重**：`[...new Set(arr)]` 一行解决原始值；Set 基于 **SameValueZero**，能正确处理 NaN 和 +0/-0；对象数组按 key 去重用 Map 保序 O(n)。',
            '原理版去重：`filter((x, i) => arr.indexOf(x) === i)` 是 O(n²)，且 indexOf 对 NaN 恒返回 -1 会导致 NaN 全被过滤——面试可主动指出这个差异。',
            '**扁平化**：`flat(depth)` 原生支持层级；手写用递归 reduce 或栈迭代；超深嵌套递归有栈溢出风险，可改迭代。',
            '复杂度意识：去重 Map/Set 版是 O(n) 时间 O(n) 空间；扁平化递归是 O(n)（每个元素处理一次），注意 depth 语义。',
            '```ts\nfunction unique<T>(arr: T[]): T[] {\n  return [...new Set(arr)]\n}\n\nfunction uniqueBy<T>(arr: T[], key: (item: T) => string | number): T[] {\n  const map = new Map<string | number, T>()\n  for (const item of arr) map.set(key(item), item)\n  return [...map.values()]\n}\n\nfunction flatten(arr: any[], depth = Infinity): any[] {\n  return arr.reduce(\n    (acc, cur) =>\n      Array.isArray(cur) && depth > 0\n        ? acc.concat(flatten(cur, depth - 1))\n        : acc.concat(cur),\n    [],\n  )\n}\n```',
          ],
          followUps: [
            {
              question: '超深嵌套数组递归扁平化会有什么风险？如何改成迭代实现？',
              points: [
                '递归深度受**调用栈限制**，万级嵌套直接 RangeError；扁平化本质是树遍历，改用**栈 + 展开运算符**迭代即可规避。',
                '迭代实现：栈里弹出的元素若是数组且未到 depth 就 `stack.push(...item)`（倒序压入保持原序），否则推入结果数组——复杂度仍 O(n)。',
              ],
            },
          ],
        },
        {
          id: 'fe-coding-instanceof',
          title: '手写 instanceof 与 Object.create',
          difficulty: 'basic',
          tags: ['手写', '原型链'],
          points: [
            '**instanceof** 原理：沿 `Object.getPrototypeOf` 向上找原型链，命中构造函数的 prototype 返回 true；左操作数是基本类型直接 false，右操作数必须是函数。',
            '边界：跨 iframe 的对象原型不同会误判（所以有 Array.isArray）；`Symbol.hasInstance` 可以自定义 instanceof 行为。',
            '**Object.create(proto)** 手写：临时构造函数挂 proto 再 new；传 null 时需要特殊处理（创建无原型对象）。',
            '这一题是原型链知识的动手验证：能顺带讲清 `__proto__`（访问器属性）、`prototype`（函数属性）与原型链查找的关系。',
            '```ts\nfunction myInstanceof(obj: unknown, ctor: Function): boolean {\n  if (typeof ctor !== "function") {\n    throw new TypeError("Right operand must be a function")\n  }\n  if (obj === null || (typeof obj !== "object" && typeof obj !== "function")) return false\n  let proto = Object.getPrototypeOf(obj)\n  while (proto !== null) {\n    if (proto === ctor.prototype) return true\n    proto = Object.getPrototypeOf(proto)\n  }\n  return false\n}\n\nfunction myCreate(proto: object | null): any {\n  if (proto === null) {\n    const obj: any = {}\n    Object.setPrototypeOf(obj, null)\n    return obj\n  }\n  function F() {}\n  F.prototype = proto\n  return new F()\n}\n```',
          ],
          followUps: [
            {
              question: 'Symbol.hasInstance 是干什么的？手写 instanceof 要怎么兼容它？',
              points: [
                '它是 instanceof 的**自定义协议**：`class Even { static [Symbol.hasInstance](x) { return x % 2 === 0 } }` 之后 `5 instanceof Even` 返回 false——语言级开放的行为钩子。',
                '兼容写法：入口先判断 `typeof ctor[Symbol.hasInstance] === "function"` 则直接调用其结果，否则走原型链查找；左操作数为基本类型直接返回 false。',
              ],
            },
          ],
        },
        {
          id: 'fe-coding-deep-clone',
          title: '手写深拷贝，如何处理循环引用和特殊对象？',
          difficulty: 'intermediate',
          tags: ['手写', '深拷贝'],
          points: [
            '基础递归版即可应付多数面试：对象递归、数组分支；注意 `typeof null === "object"` 要排除，Date/RegExp/Map/Set 需要专门分支。',
            '**循环引用**用 WeakMap 缓存"原对象 → 拷贝对象"，递归前先查缓存——必考点，也是 WeakMap 的标准应用（弱引用不阻止原对象被 GC）。',
            '进阶处理：`Reflect.ownKeys` 覆盖 **Symbol 键**；不可枚举属性是否拷贝要说明取舍；函数一般直接引用不拷贝。',
            '快捷方案与边界：**`structuredClone`**（原生，支持 Map/Set/Date/循环引用，但函数与 DOM 节点会抛错）；`JSON.parse(JSON.stringify)` 会丢 undefined/函数/Symbol、Date 变字符串、循环引用直接报错。',
            '```ts\nfunction deepClone<T>(value: T, seen = new WeakMap<object, any>()): T {\n  if (value === null || typeof value !== "object") return value\n  if (seen.has(value)) return seen.get(value)\n  if (value instanceof Date) return new Date(value) as T\n  if (value instanceof RegExp) return new RegExp(value.source, value.flags) as T\n  if (value instanceof Map) {\n    const m: any = new Map()\n    seen.set(value, m)\n    value.forEach((v, k) => m.set(deepClone(k, seen), deepClone(v, seen)))\n    return m\n  }\n  if (value instanceof Set) {\n    const s: any = new Set()\n    seen.set(value, s)\n    value.forEach((v) => s.add(deepClone(v, seen)))\n    return s\n  }\n  const clone: any = Array.isArray(value) ? [] : {}\n  seen.set(value, clone)\n  for (const key of Reflect.ownKeys(value)) {\n    clone[key] = deepClone((value as any)[key], seen)\n  }\n  return clone\n}\n```',
          ],
          followUps: [
            {
              question: 'structuredClone 和手写版的差距在哪？什么场景仍需要手写？',
              points: [
                'structuredClone 由**引擎实现**：完整覆盖内建类型（Date/RegExp/Map/Set/ArrayBuffer/Blob）、正确处理循环引用且更快；但**函数、DOM 节点、Symbol 键会报错**，类实例会退化为普通对象。',
                '手写版仍有价值：需要**保留类实例的原型**（拷贝属性 + Object.create 接原型）、拷贝函数、或在不支持 structuredClone 的旧环境运行——面试考的正是边界认知。',
              ],
            },
            {
              question: '循环引用缓存为什么用 WeakMap 而不是 Map？',
              points: [
                'WeakMap 以原对象为键持有**弱引用**：克隆完成后，原对象与拷贝的关系随作用域结束可整体回收，缓存表不阻止 GC。',
                'Map 会**强引用所有参与克隆的对象**：大对象克隆后若不手动清空缓存表，整批对象都无法回收——深拷贝是一次性过程，生命周期不应超过调用本身。',
              ],
            },
          ],
        },
        {
          id: 'fe-coding-promise-combinators',
          title: '手写 Promise.all、race、allSettled、any',
          difficulty: 'intermediate',
          tags: ['手写', 'Promise'],
          points: [
            '骨架：返回新 Promise；逐项用 `Promise.resolve()` 包装非 Promise 值；维护**计数器**统计已 settled 的数量（不是已成功的数量），全部结束才 resolve。',
            '**all**：任一 reject 立即整体 reject；全成功按**原始顺序**填充结果数组（用索引赋值而不是 push，顺序才正确）。',
            '**allSettled** 不短路，收集 `{status, value/reason}`；**any** 第一个成功即 resolve，全失败才 reject `AggregateError`；**race** 第一个 settle（无论成败）决定结果。',
            '空数组语义差异：`all([])` resolve 空数组，`race([])` **永远 pending**——高频追问点。',
            '```ts\nfunction promiseAll<T>(list: Iterable<T>): Promise<Awaited<T>[]> {\n  return new Promise((resolve, reject) => {\n    const arr = [...list]\n    const result: Awaited<T>[] = new Array(arr.length)\n    let count = 0\n    if (arr.length === 0) return resolve([])\n    arr.forEach((item, i) => {\n      Promise.resolve(item).then(\n        (value) => {\n          result[i] = value\n          if (++count === arr.length) resolve(result)\n        },\n        reject,\n      )\n    })\n  })\n}\n\nfunction promiseRace<T>(list: T[]): Promise<T> {\n  return new Promise((resolve, reject) => {\n    for (const item of list) {\n      Promise.resolve(item).then(resolve, reject)\n    }\n  })\n}\n```',
          ],
          followUps: [
            {
              question: 'promiseAll 传空数组为什么返回空数组？promiseRace 传空数组会怎样？',
              points: [
                '`all([])` **立即 resolve([])**：语义是"全部成功"，零个任务视为全部成功；实现上必须先判空，否则计数器永远到不了 length。',
                '`race([])` **永远 pending**：没有任何 promise 能率先 settle，也没有失败可 reject——语义陷阱，封装时应做入参校验或文档说明。',
              ],
            },
            {
              question: '如何给 Promise.all 加"失败重试 + 按原始顺序返回结果"的能力？',
              points: [
                '重试：每个任务包一层 `retry(fn, n)`——catch 后延迟重试（指数退避），失败 n 次才向外 reject；需要限并发再套一层并发限制器。',
                '顺序：结果按**索引写入**预分配数组而不是 push；若要求"全落定但不中断"，改用 allSettled 语义收集，再统一判断哪些要补偿。',
              ],
            },
          ],
        },
        {
          id: 'fe-coding-curry-compose',
          title: '手写柯里化（curry）与函数组合（compose/pipe）',
          difficulty: 'intermediate',
          tags: ['手写', '柯里化', '函数式'],
          points: [
            '**柯里化**：`f(a,b,c)` 转成 `f(a)(b)(c)`；递归收集参数，**数量够了就执行、不够就返回新函数**；判断依据是 `fn.length`（形参个数，不含剩余参数与默认值之后的参数）。',
            '**compose** 从右到左执行，**pipe** 从左到右：reduce 串联函数，中间件思想（Redux 中间件、Koa 洋葱模型都是变体）。',
            '应用场景：参数复用与延迟执行（日志、校验装饰）、数据处理管道（可读性 + 可测试性）。',
            '进阶变体：带占位符的柯里化（lodash 的 curry.placeholder）、无限累加的 `sum(1)(2)(3)...`（靠 valueOf/toString 触发收集）。',
            '```ts\nfunction curry<T extends (...args: any[]) => any>(fn: T) {\n  return function curried(this: any, ...args: any[]): any {\n    if (args.length >= fn.length) return fn.apply(this, args)\n    return (...rest: any[]) => curried.apply(this, [...args, ...rest])\n  }\n}\n\nfunction compose(...fns: Function[]) {\n  return function (this: any, ...args: any[]) {\n    if (fns.length === 0) return args[0]\n    let value = fns[fns.length - 1].apply(this, args)\n    for (let i = fns.length - 2; i >= 0; i--) {\n      value = fns[i].call(this, value)\n    }\n    return value\n  }\n}\n\nconst pipe =\n  (...fns: Function[]) =>\n  (x: any) =>\n    fns.reduce((acc, fn) => fn(acc), x)\n```',
          ],
          followUps: [
            {
              question: 'curry 依赖 fn.length 判断参数够不够，哪些情况会让它失灵？',
              points: [
                'fn.length **不含剩余参数**，也**不含第一个默认值之后的参数**：`function f(a, b = 1, c) {}` 的 length 是 1——默认值之后的参数全部不计入。',
                '应对：约定柯里化目标函数只写必选参数，或支持显式终止/占位符（lodash 的 curry.placeholder）；一次传满参数的调用不受影响。',
              ],
            },
            {
              question: 'compose 里某个中间函数是异步的怎么办？',
              points: [
                '同步 compose 无法等待中间 Promise：reduce 传给下一个函数的是 Promise 而不是值。',
                '改造 **composeAsync**：reduce 里先 `await acc` 再调用 fn，整体返回 Promise——Koa 洋葱模型、Redux thunk、Express 中间件本质都是"支持异步的 compose"变体，错误要在链条上统一 catch。',
              ],
            },
          ],
        },
        {
          id: 'fe-coding-promise-retry',
          title: '手写 Promise.retry：失败自动重试 N 次，支持指数退避与超时',
          difficulty: 'advanced',
          tags: ['手写', 'Promise', '重试'],
          points: [
            '需求拆解：任务失败后**自动重试最多 N 次**；每次重试间隔**指数退避**（100ms、200ms、400ms…防同步重试风暴）；单次尝试要有**超时**（Promise.race 包一层）；整体返回一个可 await 的 Promise。',
            '关键结构：把"单次尝试"写成循环体——成功直接 return；失败判断剩余次数，还有名额就 `await delay(base * 2 ** i)` 后重试，没有就抛出最后一次的错误。**"await + 计数 + 有界循环"**是重试/轮询类手写题的通用骨架。',
            '易错点：① `delay` 用 `new Promise(r => setTimeout(r, ms))`，指数基数每次翻倍；② 超时 race 落败后**原请求并不会被取消**（JS 没有取消原语，真取消要配 AbortController）；③ 只重试**可重试错误**（网络超时/5xx），4xx 参数错误重试无意义——说出这一层是工程判断力的体现。',
            '```ts\nfunction delay(ms: number) {\n  return new Promise((r) => setTimeout(r, ms))\n}\n\nfunction withTimeout<T>(p: Promise<T>, ms: number): Promise<T> {\n  return Promise.race([\n    p,\n    new Promise<T>((_, reject) =>\n      setTimeout(() => reject(new Error("timeout")), ms),\n    ),\n  ])\n}\n\nasync function retry<T>(\n  task: () => Promise<T>,\n  opts: { retries?: number; baseMs?: number; timeoutMs?: number } = {},\n): Promise<T> {\n  const { retries = 3, baseMs = 100, timeoutMs = 5000 } = opts\n  for (let i = 0; ; i++) {\n    try {\n      return await withTimeout(task(), timeoutMs)\n    } catch (err) {\n      if (i >= retries) throw err\n      await delay(baseMs * 2 ** i) // 指数退避\n    }\n  }\n}\n```',
          ],
          followUps: [
            {
              question: '重试为什么必须配指数退避和抖动（jitter）？不加上限会怎样？',
              points: [
                '故障刚恢复时，所有客户端**同步脉冲式重试**会把服务再次打垮（重试风暴）——指数退避把重试时间拉开，**随机抖动再打散重试时刻**，避免共振。',
                '没有上限的重试在持续故障下会无限堆积请求（连接、内存、下游压力）——重试必须**有界 + 可取消**；"哪些错误值得重试"交由 shouldRetry(err) 策略注入（超时/5xx 重试，4xx 直接失败）。',
              ],
            },
            {
              question: '怎么把它封装成通用的 withRetry(task, options) 高阶函数？',
              points: [
                '返回**签名一致的新函数**，调用方无感知；options 暴露 retries/backoff/shouldRetry(err) 钩子——策略可注入而不是写死在实现里。',
                '进阶：AbortSignal 贯穿取消链（外层超时触发内层 fetch 的 abort）；对同一资源的重试总数加并发上限，防止重试放大流量——这道题是从手写题通向**弹性设计（resilience）**的桥。',
              ],
            },
          ],
        },
        {
          id: 'fe-coding-concurrency-limit',
          title: '手写异步任务并发限制器（同时最多 N 个请求）',
          difficulty: 'advanced',
          tags: ['手写', '并发控制', 'Promise'],
          points: [
            '场景：批量上传/请求时避免一次性打满连接（HTTP/1.1 同域 6 个连接、服务端限流），需要"同时最多 N 个"。',
            '思路一 **worker 池**：起 min(n, limit) 个 worker 循环从任务队列取活干（next++ 取索引），全部完成 Promise.all 收尾——JS 单线程保证 next 递增无竞态。',
            '思路二 **占坑释放**：启动前 limit 个任务，每个任务的 finally 里取下一个任务，维护活跃计数。',
            '细节：结果按**原始索引**写入保证顺序；可扩展动态 add、超时重试、AbortController 取消；生产可直接用 p-limit。',
            '```ts\nasync function runWithLimit<T>(\n  tasks: Array<() => Promise<T>>,\n  limit: number,\n): Promise<T[]> {\n  const results: T[] = new Array(tasks.length)\n  let next = 0\n  async function worker() {\n    while (next < tasks.length) {\n      const i = next++\n      results[i] = await tasks[i]()\n    }\n  }\n  await Promise.all(\n    Array.from({ length: Math.min(limit, tasks.length) }, worker),\n  )\n  return results\n}\n```',
          ],
          followUps: [
            {
              question: '这个实现里 results 为什么能保证与输入顺序一致？',
              points: [
                'worker 用 `next++` 拿到**原始索引 i**，完成后 `results[i] = ...` 按索引写回——完成顺序无关，数组下标与输入一一对应。',
                '若用 push 则顺序变成完成顺序；这与手写 Promise.all 的技巧相同（结果数组按 i 赋值）。',
              ],
            },
            {
              question: '如果任务有优先级，如何改造？任务要失败重试呢？',
              points: [
                '优先级：把任务队列从数组换成**优先队列（二叉堆，按优先级 + 入队时间）**，worker 从堆顶取任务；动态提交要暴露 add(task, priority) 并让 worker 等待新任务。',
                '重试：任务包装 `withRetry(fn, n)` 递归重试（指数退避）；要明确"重试期间仍占并发名额"还是"放回队列"——放回对其他任务更公平。',
              ],
            },
          ],
        },
        {
          id: 'fe-coding-deep-equal',
          title: '手写一个 deepEqual：深比较两个值是否相等，要处理哪些边界？',
          difficulty: 'intermediate',
          tags: ['手写', '递归', '深比较'],
          points: [
            '与深拷贝对照着记：深拷贝是"造一份"（写），deepEqual 是"比内容"（读）——都要递归处理嵌套与特殊类型，但比较是**只读**的，不用缓存新对象。',
            '基础递归：`Object.is(a, b)` 命中直接 true（用 Object.is 而不是 ===，正确处理 **NaN** 与 +0/-0）；类型不同即 false；区分数组与普通对象（构造/标签不同即不等）。',
            '对象比较先比**键数量**（长度不等直接 false），再逐键递归——同时校验 a 的键在 b 中存在，防止"键集合不同但数量相同"漏判。',
            '特殊类型：Date 比 `getTime()`；RegExp 比 source + flags；**Map**（size 相等 + 按 key 递归匹配 value，key 本身也要深比）与 **Set**（size + 逐一找等价元素）单独分支。',
            '**循环引用**：用 WeakMap 记录"已比较过的对象对"（a → b），递归中遇到已在对中的引用直接视为相等——记录的是**配对**而不是单侧对象，两侧同时入表才能识别对称的环。',
          ],
          followUps: [
            {
              question: '循环引用的比较为什么记录"对"就够了？和深拷贝的缓存有什么区别？',
              points: [
                'a.b 与 b.a 互指时：比较 (a, b) 前先把 (a, b) 记入 WeakMap，递归到 a.b 与 b.a 时发现"这一对已经在比较中"，直接判等——环意味着结构对称，展开只会死循环。',
                '深拷贝缓存的是"原对象 → 拷贝"保持引用一致性；深比较缓存的是"比较中的配对"用于终结递归——两者都用 WeakMap 但语义不同。',
              ],
            },
            {
              question: '和 JSON.stringify 比较、和测试框架的 toEqual 相比，语义差异在哪？',
              points: [
                'JSON 方案的坑：undefined/函数/Symbol 丢失、NaN 变 null、键顺序影响结果、循环引用直接抛错——只能用于纯数据快照。',
                'Jest 的 `toEqual` **忽略 undefined 属性**（{a: 1} 等于 {a: 1, b: undefined}），`toStrictEqual` 才严格——写测试时要知道自己选的语义。',
                '工程折中：业务上常需"忽略字段/忽略顺序"的可配置比较，通用实现要留 options 而不是写死语义。',
              ],
            },
          ],
        },
      ],
    },
  ],
}
