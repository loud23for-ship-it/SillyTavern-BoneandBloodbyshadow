// ============================================
// 🦴 骨与血 (Bone & Blood) v6.0
// SillyTavern 沉浸式风味增强与记忆手账插件
// By SHADOW<安息之影> © 2026
// ============================================

import { extension_settings, getContext } from '../../../extensions.js';
import { saveSettingsDebounced, eventSource, event_types } from '../../../../script.js';

const EXTENSION_NAME = 'third-party/SillyTavern-BoneandBloodbyshadow';

// ============================================
// 风格预设
// ============================================

const STYLE_PRESETS = {
  modern: {
    home: '🏠 主页',
    scrapbook: '🌟 唱片机',
    diary: '📖 日记本',
    npc: '🧑‍🤝‍🧑 情报站',
    weather: '☁️ 环境雷达',
    vibe: '❤️ 氛围心电图',
    parallel: '🦋 平行宇宙',
    fate: '🎲 命运盘',
    ooc: '💬 破墙聊天室',
    world: '📻 世界频段',
    achievements: '🏆 成就殿堂',
    gallery: '🎨 画廊',
    couple: '💑 情侣空间',},
  ancient: {
    home: '🏮 归处',
    scrapbook: '📜拾遗录',
    diary: '🖋️ 手札',
    npc: '👤 人物志',
    weather: '🌸 时节录',
    vibe: '💭 心境图',
    parallel: '🌀镜花水月',
    fate: '🎴卦象台',
    ooc: '💌 私语阁',
    world: '📰 江湖传闻',
    achievements: '🎖️ 功绩榜',
    gallery: '🖼️ 丹青阁',
    couple: '🪷鸳鸯谱',
  },
  gothic: {
    home: '🕯️ 庭院',
    scrapbook: '🦴 骸骨之语',
    diary: '🩸 血迹手记',
    npc: '👻 幽影名录',
    weather: '⚰️ 天气',
    vibe: '🕷️ 血脉共鸣',
    parallel: '🌑 暗面分支',
    fate: '🗡️ 命运之骰',
    ooc: '🚪 破界密室',
    world: '📡 亡者电台',
    achievements: '💀 死亡勋章',
    gallery: '🖤暗影画廊',
    couple: '🥀 血契之约',
  },
};

// ============================================
// 主界面布局预设
// ============================================

const LAYOUT_PRESETS = {
  listen: { name: '🎵 一起听', desc: '仿一起听风格，头像+气泡+电台' },
  card: { name: '🃏 卡片式', desc: '简洁卡片布局，信息一目了然' },
  timeline: { name: '📅 时间线', desc: '时间线风格，记录你们的故事' },
};

// ============================================
// 默认设置
// ============================================

const defaultSettings = {
  enabled: true,
  api_base: '',
  api_key: '',
  api_model: '',
  auto_diary_enabled: true,
  diary_trigger_count: 30,
  message_counter: 0,

  // v0.4.0
  style_preset: 'gothic',
  custom_names: {},

  // v6.0 布局
  home_layout: 'listen', // listen|card|timeline

  // v6.0 生图API
  img_api_enabled: false,
  img_api_type: 'nai', // nai|sd|custom
  img_api_base: '',
  img_api_key: '',
  img_artist_tags: '',
  img_negative_prompt: 'lowres, bad anatomy, bad hands, text, error, missing fingers',
  img_guidance_preset: '根据角色描述和当前场景，生成一张符合氛围的插画。风格应与角色设定一致。',

  prompt_presets: [
    {
      name: '默认预设',
      global: '请用简洁、有情感张力的叙事风格回应。避免过度说教和空洞抒情。',
      prompts: {
        diary: '根据以下对话，以角色第一人称写一篇简短日记（100-200字）。带有时间感和情感细节。',
        summary: '用简洁的故事进度总结风格，概括主要事件、关系变化、未解决的线索（100-150字）。',
        weather: '推断当前场景的环境信息：时间、天气、地点、氛围（50-100字）。',
        vibe: '分析对话的情感氛围和关系状态。用诗意短评（50-100字），包含情感基调、张力指数（1-10）、关键词。',
        npc: '描述NPC当前状态：外貌、情绪、行为动向、与主角关系（80-150字）。',
        fate: '生成一个突发随机事件（可好可坏可离谱），简短有力（50-100字），可直接融入RP，带戏剧性。',
        butterfly: '基于用户选择的消息，生成一个平行宇宙分支剧情（150-300字）。风格应与原对话一致但走向不同。',
        ooc: '你作为角色扮演者，与用户进行OOC（脱离角色）沟通。用户会和你讨论剧情、角色塑造等元层面问题。诚恳、专业地回应。如果用户只是闲聊，以角色身份但不在RP状态下自然回应。',
        world: '根据当前剧情背景，生成1-2条世界背景"噪音"信息（路人八卦/新闻/世界观彩蛋），每条30-50字。',
      },
      blacklist: [],
    }
  ],
  active_preset: 0,

  // v6.0 破墙聊天室独立预设
  ooc_presets: [
    {
      name: '默认OOC预设',
      system_prompt: '你作为角色扮演者，与用户进行OOC（脱离角色）沟通。用户会和你讨论剧情、角色塑造等元层面问题。诚恳、专业地回应。如果用户只是闲聊，以角色身份但不在RP状态下自然回应。',
    }
  ],
  active_ooc_preset: 0,

  custom_css: '',
};

// ============================================
// 运行时数据
// ============================================

let pluginData = {
  records_bone: [],
  diary_blood: [],
  summaries: [],
  weather: '',
  npc_status: {},
  chaos_event: '',
  vibe: '',
  parallel_universes: [],

  home_config: {
    user_avatar: '',
    char_avatar: '',
    link_emoji: '💕',
    user_bubble: '今天也要开心鸭~',
    char_bubble: '嗯，一起加油！',
    radio_text: '骨与血电台',
  },

  fate_history: [],
  world_feed: [],
  achievements: [],
  ooc_chat: [],

  // v6.0 画廊
  gallery_images: [],

  // v6.0 情侣空间
  couple_space: {
    pet_name: '',
    pet_type: '🐱',
    pet_mood: 100,
    pet_hunger: 100,
    anniversary: '',
    love_notes: [],
    gifts: [],
    mood_diary: [],},
};

let butterflySession = {
  active: false,
  originFloor: null,
  originText: '',
  history: [],
};

let oocSession = {
  active: false,
  history: [],
};

// ============================================
// 移动端入口注入
// ============================================

function createMobileFloatingButton() {
  const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  const isNarrowScreen = window.innerWidth <= 768;

  if (!isMobile && !isNarrowScreen) {
    $('#bb-mobile-float').remove();
    return;
  }

  if ($('#bb-mobile-float').length > 0) return;

  const $float = $(`
    <div id="bb-mobile-float" title="打开骨与血面板">🦴
    </div>
  `);

  $('body').append($float);

  $float.on('click', function(e) {
    e.stopPropagation();
    toggleMainPanel();
  });

  //拖拽功能
  let isDragging = false;
  let hasMoved = false;
  let startX, startY, startLeft, startTop;

  $float.on('touchstart mousedown', function(e) {
    isDragging = true;
    hasMoved = false;
    const touch = e.type === 'touchstart' ? e.touches[0] : e;
    startX = touch.clientX;
    startY = touch.clientY;
    startLeft = parseInt($float.css('right')) || 20;
    startTop = parseInt($float.css('bottom')) || 80;
    e.preventDefault();
  });

  $(document).on('touchmove.bbfloat mousemove.bbfloat', function(e) {
    if (!isDragging) return;
    const touch = e.type === 'touchmove' ? e.touches[0] : e;
    const deltaX = touch.clientX - startX;
    const deltaY = -(touch.clientY - startY);
    if (Math.abs(deltaX) > 5 || Math.abs(deltaY) > 5) {
      hasMoved = true;
    }
    $float.css({
      right: Math.max(10, Math.min(window.innerWidth - 66, startLeft - deltaX)) + 'px',
      bottom: Math.max(70, Math.min(window.innerHeight - 66, startTop + deltaY)) + 'px'
    });
  });

  $(document).on('touchend.bbfloat mouseup.bbfloat', function() {
    if (isDragging) {
      isDragging = false;
      if (hasMoved) {
        const currentRight = parseInt($float.css('right'));
        const screenWidth = $(window).width();
        if (currentRight > screenWidth / 2 - 28) {
          $float.css('right', '20px');
        } else {
          $float.css('right', (screenWidth - 76) + 'px');
        }
        localStorage.setItem('bb_float_position', JSON.stringify({
          right: $float.css('right'),
          bottom: $float.css('bottom')
        }));
      }}
  });

  try {
    const savedPos = localStorage.getItem('bb_float_position');
    if (savedPos) {
      const pos = JSON.parse(savedPos);
      $float.css(pos);
    }
  } catch(e) {
    console.warn('[骨与血] 恢复悬浮球位置失败:', e);
  }

  console.log('[骨与血]📱 移动端悬浮球已创建');
}

function injectToMobileMenu() {
  const menuSelectors = [
    '#top-settings-holder',
    '#extensionsMenu',
    '#bg_menu_content',
    '#right-nav-panel',
    '.drawer-content',
    '#rm_button_panel',
    '#top-bar .menu_button'
  ];

  let injected = false;

  for (const selector of menuSelectors) {
    const $menu = $(selector);
    if ($menu.length > 0 && $('#bb-mobile-menu-item').length === 0) {
      let $menuItem;
      if (selector.includes('top-bar') || selector.includes('top-settings')) {
        $menuItem = $(`
          <div id="bb-mobile-menu-item" class="inline-drawer-toggle" title="骨与血"><div class="fa-solid fa-bone"></div>
          </div>
        `);
      } else if (selector.includes('extensionsMenu')) {
        $menuItem = $(`
          <div id="bb-mobile-menu-item" class="extensions_menu_button menu_button">
            <i class="fa-solid fa-bone"></i>
            <span>骨与血</span>
          </div>
        `);
      } else {
        $menuItem = $(`
          <div id="bb-mobile-menu-item" class="list-group-item flex-container flexGap5">
            <div class="fa-solid fa-bone"></div>
            <span>骨与血</span>
          </div>
        `);
      }

      $menuItem.on('click', function(e) {
        e.stopPropagation();
        toggleMainPanel();
        setTimeout(() => {
          $('.drawer-toggle:visible, #drawer-toggle:visible').click();
          $('.inline-drawer-content.opened').removeClass('opened');
        }, 100);
      });

      if (selector.includes('top-bar')) {
        $menu.parent().prepend($menuItem);
      } else {
        $menu.append($menuItem);
      }

      injected = true;
      console.log(`[骨与血] 📱 已注入到移动端菜单: ${selector}`);
      break;
    }
  }

  if (!injected) {
    console.log('[骨与血] ⚠️ 未找到移动端菜单，仅使用悬浮球');
  }

  return injected;
}

function initMobileEntrance() {
  const menuInjected = injectToMobileMenu();
  createMobileFloatingButton();
  let resizeTimer;
  $(window).on('resize.bbmobile', function() {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
      createMobileFloatingButton();
      if (!menuInjected) {
        injectToMobileMenu();
      }
    }, 300);
  });
  console.log('[骨与血] ✅ 移动端入口初始化完成');
}

function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

// ============================================
// 主面板显示/隐藏（修复display冲突）
// ============================================

function toggleMainPanel() {
  const panel = $('#bb-main-panel');
  if (panel.css('display') === 'none') {
    panel.css('display', 'flex');
  } else {
    panel.css('display', 'none');
  }
}

function showMainPanel() {
  $('#bb-main-panel').css('display', 'flex');
}

function hideMainPanel() {
  $('#bb-main-panel').css('display', 'none');
}

// ============================================
// 生图API占位接口
// ============================================

async function callImgAPI(prompt) {
  const s = getSettings();

  // 组合完整提示词
  let fullPrompt = prompt;
  if (s.img_artist_tags) {
    fullPrompt = `${s.img_artist_tags}, ${fullPrompt}`;
  }

  // 根据API类型分发
  if (s.img_api_type === 'nai' && s.img_api_base && s.img_api_key) {
    // Novel AI 接口预留
    try {
      const res = await fetch(`${s.img_api_base}/ai/generate-image`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${s.img_api_key}`,
        },
        body: JSON.stringify({
          input: fullPrompt,
          model: 'nai-diffusion-3',
          parameters: {
            width: 512,
            height: 512,
            negative_prompt: s.img_negative_prompt || '',
            steps: 28,
            guidance:5,
          },
        }),
      });
      if (!res.ok) throw new Error(`NAI API Error: ${res.status}`);
      const blob = await res.blob();
      return URL.createObjectURL(blob);
    } catch (err) {
      console.warn('[骨与血] NAI生图失败，使用占位图:', err);
    }
  } else if (s.img_api_type === 'sd' && s.img_api_base) {
    // Stable Diffusion WebUI 接口预留
    try {
      const res = await fetch(`${s.img_api_base}/sdapi/v1/txt2img`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: fullPrompt,
          negative_prompt: s.img_negative_prompt || '',
          steps: 20,
          width: 512,
          height: 512,
          cfg_scale: 7,
        }),
      });
      if (!res.ok) throw new Error(`SD API Error: ${res.status}`);
      const json = await res.json();
      if (json.images && json.images[0]) {
        return `data:image/png;base64,${json.images[0]}`;
      }
    } catch (err) {
      console.warn('[骨与血] SD生图失败，使用占位图:', err);
    }
  } else if (s.img_api_type === 'custom' && s.img_api_base && s.img_api_key) {
    // 自定义API接口预留
    try {
      const res = await fetch(s.img_api_base, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${s.img_api_key}`,
        },
        body: JSON.stringify({
          prompt: fullPrompt,
          negative_prompt: s.img_negative_prompt || '',}),
      });
      if (!res.ok) throw new Error(`Custom API Error: ${res.status}`);
      const json = await res.json();
      return json.url || json.image || json.data;
    } catch (err) {
      console.warn('[骨与血] 自定义生图失败，使用占位图:', err);
    }
  }

  // 占位演示：返回Picsum随机图片
  return `https://picsum.photos/seed/${encodeURIComponent(prompt).substring(0, 20) + Date.now()}/512/512`;
}

// ============================================
// 入口
// ============================================

jQuery(async () => {
  console.log('[骨与血] 🦴 v6.0 开始加载...');

  // 1. 初始化设置
  if (!extension_settings[EXTENSION_NAME]) {
    extension_settings[EXTENSION_NAME] = {};
  }
  extension_settings[EXTENSION_NAME] = Object.assign(
    {},
    defaultSettings,
    extension_settings[EXTENSION_NAME],
  );

  // 确保新字段存在
  const s = getSettings();
  if (!s.ooc_presets) s.ooc_presets = defaultSettings.ooc_presets;
  if (s.active_ooc_preset === undefined) s.active_ooc_preset = 0;
  if (!s.home_layout) s.home_layout = 'listen';
  if (s.img_api_enabled === undefined) s.img_api_enabled = false;
  if (!s.img_api_type) s.img_api_type = 'nai';
  if (!s.img_negative_prompt) s.img_negative_prompt = defaultSettings.img_negative_prompt;
  if (!s.img_guidance_preset) s.img_guidance_preset = defaultSettings.img_guidance_preset;

  // 2. 注入设置面板
  $('#extensions_settings').append(buildSettingsPanelHTML());

  // 3. 填入已保存设置
  loadSettingsToForm();

  // 4. 绑定设置面板事件
  bindSettingsPanelEvents();

  // 5. 应用自定义 CSS
  applyCustomCSS();

  // 6. 注入悬浮UI
  injectFloatingUI();

  // 7. 注入蝴蝶窗口
  injectButterflyWindow();

  // 8. 注入破墙窗口
  injectOOCWindow();

  // 9. 注册事件
  registerEventListeners();

  // 10. 注册宏
  registerAllMacros();

  // 11. 加载聊天数据
  loadChatData();

  // 12. 为已有消息注入按钮
  setTimeout(() => injectButtonsToExistingMessages(), 800);

  // 13. 启动世界频段
  startWorldFeed();

  // 14. 检查成就
  checkAchievements();

  // 15. 初始化移动端入口
  setTimeout(() => initMobileEntrance(), 1000);

  // 16. 启动宠物系统定时器
  startPetTimer();

  console.log('[骨与血]✅ v6.0 加载完成！');
});

// ============================================
// 设置面板 HTML
// ============================================

function buildSettingsPanelHTML() {
  return `
  <div id="bb-extension-settings">
    <div class="inline-drawer">
      <div class="inline-drawer-toggle inline-drawer-header">
        <b>🦴 骨与血 (Bone & Blood) v6.0</b>
        <div class="inline-drawer-icon fa-solid fa-circle-chevron-down down"></div>
      </div>
      <div class="inline-drawer-content">

        <div style="margin:6px 0;">
          <label class="checkbox_label" for="bb-enabled">
            <input id="bb-enabled" type="checkbox" />
            <span>启用插件</span>
          </label>
        </div>

        <hr /><h4 style="margin:8px 0 4px;">📡 副API 配置</h4>

        <div style="margin:6px 0;">
          <label for="bb-api-base" style="font-size:13px;display:block;margin-bottom:2px;">API Base URL:</label>
          <input id="bb-api-base" type="text" class="text_pole" placeholder="https://api.openai.com/v1" style="width:100%;" /><small style="color:#888;font-size:11px;">填到 /v1 即可</small>
        </div>

        <div style="margin:6px 0;">
          <label for="bb-api-key" style="font-size:13px;display:block;margin-bottom:2px;">API Key:</label>
          <input id="bb-api-key" type="password" class="text_pole" placeholder="sk-..." style="width:100%;" />
        </div>

        <div style="margin:8px 0;">
          <input id="bb-btn-test-api" class="menu_button" type="button" value="🔗 测试连接 & 获取模型" style="width:100%;" /><div id="bb-api-status" style="margin-top:4px;font-size:13px;min-height:20px;"></div>
        </div>

        <div style="margin:6px 0;">
          <label for="bb-api-model" style="font-size:13px;display:block;margin-bottom:2px;">选择模型:</label>
          <select id="bb-api-model" class="text_pole" style="width:100%;padding:6px;">
            <option value="">-- 请先测试连接 --</option>
          </select>
        </div>

        <hr />
        <h4 style="margin:8px 0 4px;">🎨 生图 API 配置</h4>

        <div style="margin:6px 0;">
          <label class="checkbox_label" for="bb-img-api-enabled">
            <input id="bb-img-api-enabled" type="checkbox" />
            <span>启用生图功能</span>
          </label>
        </div>

        <div style="margin:6px 0;">
          <label for="bb-img-api-type" style="font-size:13px;">生图API类型:</label>
          <select id="bb-img-api-type" class="text_pole" style="width:100%;padding:6px;">
            <option value="nai">🎨 Novel AI</option>
            <option value="sd">🖌️ Stable Diffusion WebUI</option>
            <option value="custom">⚙️ 自定义API</option>
          </select>
        </div>

        <div style="margin:6px 0;">
          <label for="bb-img-api-base" style="font-size:13px;display:block;margin-bottom:2px;">生图API地址:</label>
          <input id="bb-img-api-base" type="text" class="text_pole" placeholder="https://api.novelai.net" style="width:100%;" />
        </div>

        <div style="margin:6px 0;">
          <label for="bb-img-api-key" style="font-size:13px;display:block;margin-bottom:2px;">生图API Key:</label>
          <input id="bb-img-api-key" type="password" class="text_pole" placeholder="pst-..." style="width:100%;" />
        </div>

        <div style="margin:6px 0;">
          <label for="bb-img-artist-tags" style="font-size:13px;display:block;margin-bottom:2px;">画师串(Artist Tags):</label>
          <input id="bb-img-artist-tags" type="text" class="text_pole" placeholder="artist:xxx, style:watercolor" style="width:100%;" />
          <small style="color:#888;font-size:11px;">画师风格标签，会自动附加到提示词前</small>
        </div>

        <div style="margin:6px 0;">
          <label for="bb-img-negative" style="font-size:13px;display:block;margin-bottom:2px;">负面提示词 (Negative Prompt):</label>
          <textarea id="bb-img-negative" class="text_pole" rows="2" style="width:100%;font-size:12px;" placeholder="lowres, bad anatomy, bad hands..."></textarea>
        </div>

        <div style="margin:6px 0;">
          <label for="bb-img-guidance" style="font-size:13px;display:block;margin-bottom:2px;">生图指导预设 (AI提示词生成引导):</label>
          <textarea id="bb-img-guidance" class="text_pole" rows="3" style="width:100%;font-size:12px;" placeholder="根据角色描述和当前场景，生成一张符合氛围的插画..."></textarea>
          <small style="color:#888;font-size:11px;">指导AI如何生成图片描述提示词</small>
        </div>

        <div style="margin:6px 0;">
          <input id="bb-btn-save-img-settings" class="menu_button" type="button" value="💾 保存生图设置" style="width:100%;" />
        </div>

        <hr />
        <h4 style="margin:8px 0 4px;">⚙️ 自动生成</h4>

        <div style="margin:6px 0;">
          <label for="bb-diary-trigger" style="font-size:13px;">每隔多少条消息自动生成:</label>
          <input id="bb-diary-trigger" type="number" class="text_pole" min="10" max="200" value="30" style="width:80px;" />
        </div>

        <div style="margin:6px 0;">
          <label class="checkbox_label" for="bb-auto-diary">
            <input id="bb-auto-diary" type="checkbox" />
            <span>启用自动日记/总结</span>
          </label>
        </div>

        <hr />
        <h4 style="margin:8px 0 4px;">🎨 风格预设</h4>
        <div style="margin:6px 0;">
          <label for="bb-style-preset" style="font-size:13px;">选择风格:</label>
          <select id="bb-style-preset" class="text_pole" style="width:100%;padding:6px;">
            <option value="modern">🌃 现代风</option>
            <option value="ancient">🏯 古风</option>
            <option value="gothic">🦇 哥特风</option>
            <option value="custom">✏️ 自定义</option>
          </select>
        </div>
        <div id="bb-custom-style-names" style="display:none;margin-top:12px;padding:12px;background:#222;border:1px solid #444;border-radius:6px;">
          <p style="font-size:12px;color:#aaa;margin-bottom:10px;">自定义各模块名称（支持emoji）:</p>
          <div style="display:grid;grid-template-columns:1fr 2fr;gap:8px;font-size:11px;">
            <label>首页:</label><input type="text" class="text_pole bb-custom-name" data-key="home" style="padding:4px;" />
            <label>唱片机:</label><input type="text" class="text_pole bb-custom-name" data-key="scrapbook" style="padding:4px;" />
            <label>日记本:</label><input type="text" class="text_pole bb-custom-name" data-key="diary" style="padding:4px;" />
            <label>NPC:</label><input type="text" class="text_pole bb-custom-name" data-key="npc" style="padding:4px;" />
            <label>环境雷达:</label><input type="text" class="text_pole bb-custom-name" data-key="weather" style="padding:4px;" />
            <label>氛围心电图:</label><input type="text" class="text_pole bb-custom-name" data-key="vibe" style="padding:4px;" />
            <label>平行宇宙:</label><input type="text" class="text_pole bb-custom-name" data-key="parallel" style="padding:4px;" />
            <label>命运盘:</label><input type="text" class="text_pole bb-custom-name" data-key="fate" style="padding:4px;" />
            <label>破墙聊天室:</label><input type="text" class="text_pole bb-custom-name" data-key="ooc" style="padding:4px;" />
            <label>世界频段:</label><input type="text" class="text_pole bb-custom-name" data-key="world" style="padding:4px;" />
            <label>成就殿堂:</label><input type="text" class="text_pole bb-custom-name" data-key="achievements" style="padding:4px;" />
            <label>画廊:</label><input type="text" class="text_pole bb-custom-name" data-key="gallery" style="padding:4px;" />
            <label>情侣空间:</label><input type="text" class="text_pole bb-custom-name" data-key="couple" style="padding:4px;" />
          </div>
          <button id="bb-save-custom-names" class="menu_button" style="width:100%;margin-top:10px;">💾 保存自定义名称</button>
        </div>

        <hr />
        <h4 style="margin:8px 0 4px;">🏠 首页布局</h4>
        <div style="margin:6px 0;">
          <label for="bb-home-layout" style="font-size:13px;">选择布局:</label>
          <select id="bb-home-layout" class="text_pole" style="width:100%;padding:6px;">
            <option value="listen">🎵 一起听（默认）</option>
            <option value="card">🃏 卡片式</option>
            <option value="timeline">📅 时间线</option>
          </select>
        </div>

        <hr />
        <h4 style="margin:8px 0 4px;">📝 预设管理</h4>
        <div style="margin:6px 0;">
          <label for="bb-active-preset" style="font-size:13px;">当前预设:</label>
          <select id="bb-active-preset" class="text_pole" style="width:100%;padding:6px;"></select>
        </div>
        <div style="display:flex;gap:4px;margin:6px 0;">
          <input id="bb-btn-new-preset" class="menu_button" type="button" value="➕ 新建" style="flex:1;" />
          <input id="bb-btn-del-preset" class="menu_button" type="button" value="🗑️ 删除" style="flex:1;" />
        </div>
        <div style="display:flex;gap:4px;margin:6px 0;">
          <input id="bb-btn-import-preset" class="menu_button" type="button" value="📥 导入JSON" style="flex:1;" />
          <input id="bb-btn-export-preset" class="menu_button" type="button" value="📤 导出JSON" style="flex:1;" />
        </div>

        <!-- 展开式编辑器 -->
        <div style="margin-top:12px;">
          <button id="bb-toggle-preset-editor" class="menu_button" style="width:100%;">✏️ 展开预设编辑器</button>
        </div>

        <div id="bb-preset-editor" style="display:none;margin-top:12px;padding:12px;background:#222;border:1px solid #444;border-radius:6px;">
          <div style="margin-bottom:10px;">
            <label style="font-size:12px;color:#aaa;">预设名称:</label>
            <input id="bb-preset-name" type="text" class="text_pole" style="width:100%;padding:6px;" />
          </div>

          <div style="margin-bottom:10px;">
            <label style="font-size:12px;color:#aaa;">全局指导:</label>
            <textarea id="bb-preset-global" class="text_pole" rows="3" style="width:100%;font-size:12px;"></textarea>
          </div>

          <div style="margin-bottom:10px;">
            <label style="font-size:12px;color:#aaa;">禁词列表（逗号分隔）:</label>
            <input id="bb-preset-blacklist" type="text" class="text_pole" style="width:100%;padding:6px;" placeholder="词1,词2,词3" />
          </div>

          <details style="margin-bottom:10px;">
            <summary style="cursor:pointer;color:var(--bb-primary);font-size:13px;font-weight:bold;">📖 提示词模板（点击展开）</summary>
            <div style="margin-top:8px;display:flex;flex-direction:column;gap:8px;">
              <div>
                <label style="font-size:11px;color:#888;">日记:</label>
                <textarea id="bb-preset-diary" class="text_pole" rows="2" style="width:100%;font-size:11px;"></textarea>
              </div>
              <div>
                <label style="font-size:11px;color:#888;">总结:</label>
                <textarea id="bb-preset-summary" class="text_pole" rows="2" style="width:100%;font-size:11px;"></textarea>
              </div>
              <div>
                <label style="font-size:11px;color:#888;">环境:</label>
                <textarea id="bb-preset-weather" class="text_pole" rows="2" style="width:100%;font-size:11px;"></textarea>
              </div>
              <div>
                <label style="font-size:11px;color:#888;">氛围:</label>
                <textarea id="bb-preset-vibe" class="text_pole" rows="2" style="width:100%;font-size:11px;"></textarea>
              </div>
              <div>
                <label style="font-size:11px;color:#888;">NPC:</label>
                <textarea id="bb-preset-npc" class="text_pole" rows="2" style="width:100%;font-size:11px;"></textarea>
              </div>
              <div>
                <label style="font-size:11px;color:#888;">命运:</label>
                <textarea id="bb-preset-fate" class="text_pole" rows="2" style="width:100%;font-size:11px;"></textarea>
              </div>
              <div>
                <label style="font-size:11px;color:#888;">平行宇宙:</label>
                <textarea id="bb-preset-butterfly" class="text_pole" rows="2" style="width:100%;font-size:11px;"></textarea>
              </div>
              <div>
                <label style="font-size:11px;color:#888;">破墙聊天:</label>
                <textarea id="bb-preset-ooc" class="text_pole" rows="2" style="width:100%;font-size:11px;"></textarea>
              </div>
              <div>
                <label style="font-size:11px;color:#888;">世界频段:</label>
                <textarea id="bb-preset-world" class="text_pole" rows="2" style="width:100%;font-size:11px;"></textarea>
              </div>
            </div>
          </details>

          <button id="bb-save-preset-editor" class="menu_button" style="width:100%;background:#8b0000;color:#fff;font-weight:bold;">💾 保存当前预设</button>
        </div>

        <hr />
        <h4 style="margin:8px 0 4px;">💬 破墙聊天室预设</h4>
        <div style="margin:6px 0;">
          <label for="bb-active-ooc-preset" style="font-size:13px;">当前OOC预设:</label>
          <select id="bb-active-ooc-preset" class="text_pole" style="width:100%;padding:6px;"></select>
        </div>
        <div style="display:flex;gap:4px;margin:6px 0;">
          <input id="bb-btn-new-ooc-preset" class="menu_button" type="button" value="➕ 新建" style="flex:1;" />
          <input id="bb-btn-del-ooc-preset" class="menu_button" type="button" value="🗑️ 删除" style="flex:1;" />
        </div>
        <div style="display:flex;gap:4px;margin:6px 0;">
          <input id="bb-btn-import-ooc-preset" class="menu_button" type="button" value="📥 导入" style="flex:1;" />
          <input id="bb-btn-export-ooc-preset" class="menu_button" type="button" value="📤 导出" style="flex:1;" />
        </div>
        <div style="margin-top:8px;">
          <button id="bb-toggle-ooc-preset-editor" class="menu_button" style="width:100%;">✏️ 编辑OOC预设</button>
        </div>
        <div id="bb-ooc-preset-editor" style="display:none;margin-top:12px;padding:12px;background:#222;border:1px solid #444;border-radius:6px;">
          <div style="margin-bottom:10px;">
            <label style="font-size:12px;color:#aaa;">预设名称:</label>
            <input id="bb-ooc-preset-name" type="text" class="text_pole" style="width:100%;padding:6px;" />
          </div>
          <div style="margin-bottom:10px;">
            <label style="font-size:12px;color:#aaa;">系统提示词:</label>
            <textarea id="bb-ooc-preset-system" class="text_pole" rows="5" style="width:100%;font-size:12px;"></textarea>
          </div>
          <button id="bb-save-ooc-preset-editor" class="menu_button" style="width:100%;background:#8b0000;color:#fff;font-weight:bold;">💾 保存OOC预设</button>
        </div>

        <hr />
        <h4 style="margin:8px 0 4px;">🎨 主题管理</h4>
        <div style="margin:6px 0;">
          <label for="bb-custom-css" style="font-size:13px;display:block;margin-bottom:2px;">自定义 CSS:</label>
          <textarea id="bb-custom-css" class="text_pole" placeholder="粘贴 CSS 代码..." style="width:100%;min-height:100px;font-family:monospace;font-size:12px;"></textarea>
        </div>
        <div style="display:flex;gap:4px;margin:6px 0;">
          <input id="bb-btn-apply-css" class="menu_button" type="button" value="🎨 应用" />
          <input id="bb-btn-reset-css" class="menu_button" type="button" value="🔄 重置" /><input id="bb-btn-upload-css" class="menu_button" type="button" value="📁 上传.css" />
        </div>
        <input type="file" id="bb-css-file-input" accept=".css" style="display:none;" />

        <details style="margin-top:12px;">
          <summary style="cursor:pointer;color:var(--bb-primary);font-size:13px;font-weight:bold;">📚 CSS示例模板</summary>
          <div style="margin-top:12px;padding:12px;background:#111;border:1px solid #333;border-radius:6px;max-height:300px;overflow-y:auto;">
            <h5 style="color:#8b0000;margin:0 0 8px;">🎨 示例1:赛博朋克风</h5>
            <pre style="background:#000;padding:8px;border-radius:4px;font-size:10px;overflow-x:auto;"><code id="bb-css-example-1">/* 赛博朋克风格 */
:root {
  --bb-primary: #00ffff;
  --bb-primary-dark: #00aaaa;
  --bb-primary-light: #66ffff;
  --bb-bg-main: #0a0a15;
  --bb-bg-secondary: #15152a;
}
#bb-main-panel {
  box-shadow: 0 0 40px rgba(0,255,255,0.5);
}
.bb-tab.active {
  text-shadow: 0 0 10px #00ffff;
}</code></pre>
            <button class="bb-sm-btn" onclick="navigator.clipboard.writeText(document.getElementById('bb-css-example-1').textContent);toastr.success('已复制')">📋 复制</button>

            <h5 style="color:#8b0000;margin:16px 0 8px;">🌸 示例2: 樱花梦幻风</h5>
            <pre style="background:#000;padding:8px;border-radius:4px;font-size:10px;overflow-x:auto;"><code id="bb-css-example-2">/* 樱花梦幻风格 */
:root {
  --bb-primary: #ffb3d9;
  --bb-primary-dark: #ff99cc;
  --bb-primary-light: #ffcceb;
  --bb-bg-main: #ffe6f2;
  --bb-bg-secondary: #ffcceb;
  --bb-text: #5c4a5a;
}
#bb-main-panel {
  background: linear-gradient(135deg, #ffe6f2 0%, #ffcceb 100%);
}</code></pre>
            <button class="bb-sm-btn" onclick="navigator.clipboard.writeText(document.getElementById('bb-css-example-2').textContent);toastr.success('已复制')">📋 复制</button></div>
        </details>

        <hr />
        <h4 style="margin:8px 0 4px;">🔧 手动操作</h4>
        <div style="display:flex;gap:4px;flex-wrap:wrap;">
          <input id="bb-btn-diary" class="menu_button" type="button" value="📖 生成日记" />
          <input id="bb-btn-summary" class="menu_button" type="button" value="📜 生成总结" />
          <input id="bb-btn-weather" class="menu_button" type="button" value="☁️ 刷新环境" />
          <input id="bb-btn-vibe" class="menu_button" type="button" value="❤️ 分析氛围" />
        </div>

        <hr />
        <div style="color:#888;font-size:11px;padding:8px 0;text-align:center;">
          💡 点击右下角 🦴 打开主面板<br/>
          © 2026SHADOW &lt;安息之影&gt;
        </div>
      </div>
    </div>
  </div>`;
}

// ============================================
// 设置管理
// ============================================

function getSettings() {
  return extension_settings[EXTENSION_NAME];
}

function saveSettings() {
  saveSettingsDebounced();
}

function loadSettingsToForm() {
  const s = getSettings();
  $('#bb-enabled').prop('checked', s.enabled);
  $('#bb-api-base').val(s.api_base);
  $('#bb-api-key').val(s.api_key);
  $('#bb-diary-trigger').val(s.diary_trigger_count);
  $('#bb-auto-diary').prop('checked', s.auto_diary_enabled);
  $('#bb-style-preset').val(s.style_preset);
  $('#bb-custom-css').val(s.custom_css || '');
  $('#bb-home-layout').val(s.home_layout || 'listen');

  // 生图设置
  $('#bb-img-api-enabled').prop('checked', s.img_api_enabled);
  $('#bb-img-api-type').val(s.img_api_type || 'nai');
  $('#bb-img-api-base').val(s.img_api_base || '');
  $('#bb-img-api-key').val(s.img_api_key || '');
  $('#bb-img-artist-tags').val(s.img_artist_tags || '');
  $('#bb-img-negative').val(s.img_negative_prompt || '');
  $('#bb-img-guidance').val(s.img_guidance_preset || '');

  if (s.api_model) {
    $('#bb-api-model').empty().append(`<option value="${s.api_model}" selected>${s.api_model}</option>`);
  }

  refreshPresetSelector();
  refreshOOCPresetSelector();
}

function bindSettingsPanelEvents() {
  $('#bb-enabled').on('change', function () {
    getSettings().enabled = $(this).is(':checked');
    saveSettings();
  });

  $('#bb-api-base').on('input', function () {
    getSettings().api_base = $(this).val().replace(/\/+$/, '');
    saveSettings();
  });

  $('#bb-api-key').on('input', function () {
    getSettings().api_key = $(this).val();
    saveSettings();
  });

  $('#bb-btn-test-api').on('click', testAPIConnection);

  $('#bb-api-model').on('change', function () {
    getSettings().api_model = $(this).val();
    saveSettings();
  });

  $('#bb-diary-trigger').on('change', function () {
    getSettings().diary_trigger_count = parseInt($(this).val()) || 30;
    saveSettings();
  });

  $('#bb-auto-diary').on('change', function () {
    getSettings().auto_diary_enabled = $(this).is(':checked');
    saveSettings();
  });

  // 风格预设
  $('#bb-style-preset').on('change', function () {
    const val = $(this).val();
    getSettings().style_preset = val;
    saveSettings();
    if (val === 'custom') {
      $('#bb-custom-style-names').slideDown();
      loadCustomNames();
    } else {
      $('#bb-custom-style-names').slideUp();
    }refreshFloatingUI();
  });

  // 首页布局
  $('#bb-home-layout').on('change', function () {
    getSettings().home_layout = $(this).val();
    saveSettings();
    refreshFloatingUI();
  });

  // 保存自定义名称
  $('#bb-save-custom-names').on('click', function () {
    const s = getSettings();
    s.custom_names = {};
    $('.bb-custom-name').each(function () {
      const key = $(this).data('key');
      const val = $(this).val().trim();
      if (val) s.custom_names[key] = val;
    });
    saveSettings();
    refreshFloatingUI();
    toastr.success('✅ 自定义名称已保存');
  });

  $('#bb-active-preset').on('change', function () {
    getSettings().active_preset = parseInt($(this).val());
    saveSettings();
  });

  $('#bb-btn-new-preset').on('click', createNewPreset);
  $('#bb-btn-del-preset').on('click', deleteCurrentPreset);
  $('#bb-btn-import-preset').on('click', importPreset);
  $('#bb-btn-export-preset').on('click', exportPreset);

  // 生图设置保存
  $('#bb-btn-save-img-settings').on('click', function () {
    const s = getSettings();
    s.img_api_enabled = $('#bb-img-api-enabled').is(':checked');
    s.img_api_type = $('#bb-img-api-type').val();
    s.img_api_base = $('#bb-img-api-base').val().replace(/\/+$/, '');
    s.img_api_key = $('#bb-img-api-key').val();
    s.img_artist_tags = $('#bb-img-artist-tags').val();
    s.img_negative_prompt = $('#bb-img-negative').val();
    s.img_guidance_preset = $('#bb-img-guidance').val();
    saveSettings();
    toastr.success('🎨 生图设置已保存');
  });

  // CSS
  $('#bb-btn-apply-css').on('click', () => {
    getSettings().custom_css = $('#bb-custom-css').val();
    saveSettings();
    applyCustomCSS();
    toastr.success('🎨 CSS 已应用');
  });

  $('#bb-btn-reset-css').on('click', () => {
    getSettings().custom_css = '';
    $('#bb-custom-css').val('');
    saveSettings();
    applyCustomCSS();
    toastr.success('🔄 已重置为默认样式');
  });

  $('#bb-btn-upload-css').on('click', () => $('#bb-css-file-input').click());

  $('#bb-css-file-input').on('change', function () {
    const file = this.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      const css = e.target.result;
      $('#bb-custom-css').val(css);
      getSettings().custom_css = css;
      saveSettings();
      applyCustomCSS();
      toastr.success(`📁 已加载 ${file.name}`);
    };
    reader.readAsText(file);
  });

  // 设置面板按钮
  $('#bb-btn-diary').on('click', generateDiary);
  $('#bb-btn-summary').on('click', generateSummary);
  $('#bb-btn-weather').on('click', generateWeather);
  $('#bb-btn-vibe').on('click', generateVibe);

  // 预设编辑器展开/折叠
  $('#bb-toggle-preset-editor').on('click', function () {
    const editor = $('#bb-preset-editor');
    if (editor.is(':visible')) {
      editor.slideUp();
      $(this).text('✏️ 展开预设编辑器');
    } else {
      loadPresetToEditor();
      editor.slideDown();
      $(this).text('🔼 收起编辑器');
    }
  });

  $('#bb-save-preset-editor').on('click', savePresetFromEditor);

  // OOC预设管理
  $('#bb-active-ooc-preset').on('change', function () {
    getSettings().active_ooc_preset = parseInt($(this).val());
    saveSettings();
  });

  $('#bb-btn-new-ooc-preset').on('click', createNewOOCPreset);
  $('#bb-btn-del-ooc-preset').on('click', deleteCurrentOOCPreset);
  $('#bb-btn-import-ooc-preset').on('click', importOOCPreset);
  $('#bb-btn-export-ooc-preset').on('click', exportOOCPreset);

  $('#bb-toggle-ooc-preset-editor').on('click', function () {
    const editor = $('#bb-ooc-preset-editor');
    if (editor.is(':visible')) {
      editor.slideUp();
      $(this).text('✏️ 编辑OOC预设');
    } else {
      loadOOCPresetToEditor();
      editor.slideDown();
      $(this).text('🔼 收起编辑器');
    }
  });

  $('#bb-save-ooc-preset-editor').on('click', saveOOCPresetFromEditor);
}

// ============================================
// 预设编辑器
// ============================================

function loadPresetToEditor() {
  const preset = getActivePreset();
  $('#bb-preset-name').val(preset.name);
  $('#bb-preset-global').val(preset.global || '');
  $('#bb-preset-blacklist').val((preset.blacklist || []).join(','));
  $('#bb-preset-diary').val(preset.prompts.diary || '');
  $('#bb-preset-summary').val(preset.prompts.summary || '');
  $('#bb-preset-weather').val(preset.prompts.weather || '');
  $('#bb-preset-vibe').val(preset.prompts.vibe || '');
  $('#bb-preset-npc').val(preset.prompts.npc || '');
  $('#bb-preset-fate').val(preset.prompts.fate || '');
  $('#bb-preset-butterfly').val(preset.prompts.butterfly || '');
  $('#bb-preset-ooc').val(preset.prompts.ooc || '');
  $('#bb-preset-world').val(preset.prompts.world || '');
}

function savePresetFromEditor() {
  const s = getSettings();
  const idx = s.active_preset;
  s.prompt_presets[idx] = {
    name: $('#bb-preset-name').val() || '未命名预设',
    global: $('#bb-preset-global').val(),
    blacklist: $('#bb-preset-blacklist').val().split(',').map(w => w.trim()).filter(Boolean),
    prompts: {
      diary: $('#bb-preset-diary').val(),
      summary: $('#bb-preset-summary').val(),
      weather: $('#bb-preset-weather').val(),
      vibe: $('#bb-preset-vibe').val(),
      npc: $('#bb-preset-npc').val(),
      fate: $('#bb-preset-fate').val(),
      butterfly: $('#bb-preset-butterfly').val(),
      ooc: $('#bb-preset-ooc').val(),
      world: $('#bb-preset-world').val(),
    },
  };
  saveSettings();
  refreshPresetSelector();
  toastr.success('💾 预设已保存');
}

// ============================================
// OOC预设管理 (v6.0)
// ============================================

function getActiveOOCPreset() {
  const s = getSettings();
  if (!s.ooc_presets || s.ooc_presets.length === 0) {
    s.ooc_presets = defaultSettings.ooc_presets;
  }
  return s.ooc_presets[s.active_ooc_preset] || s.ooc_presets[0];
}

function refreshOOCPresetSelector() {
  const s = getSettings();
  if (!s.ooc_presets) s.ooc_presets = defaultSettings.ooc_presets;
  const sel = $('#bb-active-ooc-preset');
  sel.empty();
  s.ooc_presets.forEach((p, i) => {
    sel.append(`<option value="${i}">${esc(p.name)}</option>`);
  });
  sel.val(s.active_ooc_preset || 0);
}

function loadOOCPresetToEditor() {
  const preset = getActiveOOCPreset();
  $('#bb-ooc-preset-name').val(preset.name || '');
  $('#bb-ooc-preset-system').val(preset.system_prompt || '');
}

function saveOOCPresetFromEditor() {
  const s = getSettings();
  const idx = s.active_ooc_preset || 0;
  s.ooc_presets[idx] = {
    name: $('#bb-ooc-preset-name').val() || '未命名OOC预设',
    system_prompt: $('#bb-ooc-preset-system').val(),
  };
  saveSettings();
  refreshOOCPresetSelector();
  toastr.success('💾 OOC预设已保存');
}

function createNewOOCPreset() {
  const name = prompt('OOC预设名称:', `新OOC预设 ${Date.now()}`);
  if (!name) return;
  const s = getSettings();
  if (!s.ooc_presets) s.ooc_presets = [];
  s.ooc_presets.push({
    name,
    system_prompt: defaultSettings.ooc_presets[0].system_prompt,
  });
  s.active_ooc_preset = s.ooc_presets.length - 1;
  saveSettings();
  refreshOOCPresetSelector();
  toastr.success(`➕ 已创建OOC预设: ${name}`);
}

function deleteCurrentOOCPreset() {
  const s = getSettings();
  if (!s.ooc_presets || s.ooc_presets.length <= 1) {
    toastr.warning('至少保留一个OOC预设');
    return;
  }
  if (!confirm(`确认删除OOC预设: ${getActiveOOCPreset().name}?`)) return;
  s.ooc_presets.splice(s.active_ooc_preset, 1);
  s.active_ooc_preset =0;
  saveSettings();
  refreshOOCPresetSelector();
  toastr.success('🗑️ OOC预设已删除');
}

function importOOCPreset() {
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = '.json';
  input.onchange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const imported = JSON.parse(ev.target.result);
        const s = getSettings();
        if (!s.ooc_presets) s.ooc_presets = [];
        s.ooc_presets.push(imported);
        s.active_ooc_preset = s.ooc_presets.length - 1;
        saveSettings();
        refreshOOCPresetSelector();
        toastr.success(`📥 已导入OOC预设: ${imported.name}`);
      } catch (err) {
        toastr.error('JSON格式错误');
      }
    };
    reader.readAsText(file);
  };
  input.click();
}

function exportOOCPreset() {
  const preset = getActiveOOCPreset();
  dl(`bb_ooc_preset_${preset.name}_${Date.now()}.json`, JSON.stringify(preset, null, 2), 'application/json');
  toastr.success(`📤 已导出OOC预设: ${preset.name}`);
}

// ============================================
// 自定义名称加载
// ============================================

function loadCustomNames() {
  const s = getSettings();
  const defaultPreset = STYLE_PRESETS.gothic;
  $('.bb-custom-name').each(function () {
    const key = $(this).data('key');
    $(this).val(s.custom_names[key] || defaultPreset[key] || '');
  });
}

// ============================================
// API测试与调用
// ============================================

async function testAPIConnection() {
  const s = getSettings();
  const base = s.api_base.replace(/\/+$/, '');
  const key = s.api_key;

  if (!base || !key) {
    toastr.warning('请先填写 API Base 和 Key');
    return;
  }

  $('#bb-api-status').html('<span style="color:orange;">⏳ 连接中...</span>');

  try {
    const url = base.includes('/v1') ? `${base}/models` : `${base}/v1/models`;
    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${key}` },
    });

    if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);

    const json = await res.json();
    const models = json.data || json.models || [];

    if (models.length === 0) throw new Error('未找到可用模型');

    $('#bb-api-model').empty();
    models.forEach(m => {
      const id = m.id || m;
      $('#bb-api-model').append(`<option value="${id}">${id}</option>`);
    });

    s.api_model = models[0].id || models[0];
    $('#bb-api-model').val(s.api_model);
    saveSettings();

    $('#bb-api-status').html(`<span style="color:green;">✅ 连接成功！获取到 ${models.length} 个模型</span>`);
    toastr.success(`🔗 已连接，默认模型: ${s.api_model}`);
  } catch (err) {
    $('#bb-api-status').html(`<span style="color:red;">❌ 连接失败: ${err.message}</span>`);
    toastr.error(`连接失败: ${err.message}`);
  }
}

async function callSubAPI(messages, maxTokens = 500) {
  const s = getSettings();
  const base = s.api_base.replace(/\/+$/, '');
  const key = s.api_key;
  const model = s.api_model;

  if (!base || !key || !model) {
    toastr.error('请先配置并测试副API');
    return null;
  }

  const preset = getActivePreset();
  if (preset.global) {
    messages = [{ role: 'system', content: preset.global }, ...messages];
  }

  try {
    const url = base.includes('/v1') ? `${base}/chat/completions` : `${base}/v1/chat/completions`;
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${key}`,
      },
      body: JSON.stringify({
        model,
        messages,
        max_tokens: maxTokens,
        temperature: 0.85,
      }),
    });

    if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);

    const json = await res.json();
    let content = json.choices?.[0]?.message?.content || '';

    if (preset.blacklist && preset.blacklist.length > 0) {
      preset.blacklist.forEach(word => {
        const reg = new RegExp(word, 'gi');
        content = content.replace(reg, '***');
      });
    }

    return content.trim();
  } catch (err) {
    toastr.error(`API 调用失败: ${err.message}`);
    return null;
  }
}

// ============================================
// 预设管理
// ============================================

function getActivePreset() {
  const s = getSettings();
  return s.prompt_presets[s.active_preset] || s.prompt_presets[0];
}

function refreshPresetSelector() {
  const s = getSettings();
  const sel = $('#bb-active-preset');
  sel.empty();
  s.prompt_presets.forEach((p, i) => {
    sel.append(`<option value="${i}">${esc(p.name)}</option>`);
  });
  sel.val(s.active_preset);
}

function createNewPreset() {
  const name = prompt('预设名称:', `新预设 ${Date.now()}`);
  if (!name) return;
  const s = getSettings();
  s.prompt_presets.push({
    name,
    global: '',
    prompts: { ...defaultSettings.prompt_presets[0].prompts },
    blacklist: [],
  });
  s.active_preset = s.prompt_presets.length - 1;
  saveSettings();
  refreshPresetSelector();
  toastr.success(`➕ 已创建预设: ${name}`);
}

function deleteCurrentPreset() {
  const s = getSettings();
  if (s.prompt_presets.length === 1) {
    toastr.warning('至少保留一个预设');
    return;
  }
  if (!confirm(`确认删除预设: ${getActivePreset().name}?`)) return;
  s.prompt_presets.splice(s.active_preset, 1);
  s.active_preset = 0;
  saveSettings();
  refreshPresetSelector();
  toastr.success('🗑️ 预设已删除');
}

function importPreset() {
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = '.json';
  input.onchange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const imported = JSON.parse(ev.target.result);
        const s = getSettings();
        s.prompt_presets.push(imported);
        s.active_preset = s.prompt_presets.length - 1;
        saveSettings();
        refreshPresetSelector();
        toastr.success(`📥 已导入: ${imported.name}`);
      } catch (err) {
        toastr.error('JSON 格式错误');
      }
    };
    reader.readAsText(file);
  };
  input.click();
}

function exportPreset() {
  const preset = getActivePreset();
  dl(`bb_preset_${preset.name}_${Date.now()}.json`, JSON.stringify(preset, null, 2), 'application/json');
  toastr.success(`📤 已导出: ${preset.name}`);
}

// ============================================
// 自定义 CSS
// ============================================

function applyCustomCSS() {
  const s = getSettings();
  $('#bb-custom-style').remove();
  if (s.custom_css) {
    $('head').append(`<style id="bb-custom-style">${s.custom_css}</style>`);
  }
}

// ============================================
// 悬浮UI（主面板）
// ============================================

function injectFloatingUI() {
  if ($('#bb-float-btn').length > 0) return;

  //悬浮按钮
  $('body').append(`
    <div id="bb-float-btn" title="骨与血" style="position:fixed;bottom:20px;right:20px;width:50px;height:50px;background:#000;border:2px solid #8b0000;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:24px;cursor:pointer;z-index:9999;box-shadow:0 4px 12px rgba(0,0,0,0.5);transition:transform 0.2s;">🦴
    </div>
  `);

  $('#bb-float-btn').on('click', () => toggleMainPanel());
  $('#bb-float-btn').on('mouseenter', function () { $(this).css('transform', 'scale(1.1)'); });
  $('#bb-float-btn').on('mouseleave', function () { $(this).css('transform', 'scale(1)'); });

  // 主面板（修复：只有一个 display:none，不再有 display:flex冲突）
  $('body').append(buildMainPanelHTML());
  bindMainPanelEvents();
  renderAll();
}

function buildMainPanelHTML() {
  const names = getTabNames();
  const layout = getSettings().home_layout || 'listen';

  return `
    <div id="bb-main-panel" style="display:none;position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);width:90%;max-width:800px;height:80%;max-height:700px;background:#1a1a1a;border:3px solid #8b0000;border-radius:12px;box-shadow:0 8px 32px rgba(0,0,0,0.8);z-index:10000;overflow:hidden;flex-direction:column;">

      <!-- 标题栏 -->
      <div class="bb-header" style="background:#000;color:#fff;padding:12px 16px;display:flex;justify-content:space-between;align-items:center;border-bottom:2px solid #8b0000;">
        <div style="font-size:18px;font-weight:bold;">🦴 骨与血</div>
        <button id="bb-close-btn" style="background:none;border:none;color:#fff;font-size:20px;cursor:pointer;">✖</button>
      </div>

      <!-- Tab导航 -->
      <div class="bb-nav" style="background:#222;display:flex;overflow-x:auto;border-bottom:1px solid #444;">
        <div class="bb-tab active" data-tab="home">${names.home}</div>
        <div class="bb-tab" data-tab="scrapbook">${names.scrapbook}</div>
        <div class="bb-tab" data-tab="diary">${names.diary}</div>
        <div class="bb-tab" data-tab="npc">${names.npc}</div>
        <div class="bb-tab" data-tab="weather">${names.weather}</div>
        <div class="bb-tab" data-tab="vibe">${names.vibe}</div>
        <div class="bb-tab" data-tab="parallel">${names.parallel}</div>
        <div class="bb-tab" data-tab="fate">${names.fate}</div>
        <div class="bb-tab" data-tab="ooc">${names.ooc}</div>
        <div class="bb-tab" data-tab="world">${names.world}</div>
        <div class="bb-tab" data-tab="gallery">${names.gallery || '🎨 画廊'}</div>
        <div class="bb-tab" data-tab="couple">${names.couple || '💑 情侣空间'}</div>
        <div class="bb-tab" data-tab="achievements">${names.achievements}</div>
      </div>

      <!-- 内容区 -->
      <div class="bb-content" style="flex:1;overflow-y:auto;padding:16px;background:#1a1a1a;color:#ddd;">

        <!-- 🏠 首页 -->
        <div id="bb-tab-home" class="bb-tab-panel active">
          ${buildHomeLayout(layout)}
        </div>

        <!-- 🌟唱片机 -->
        <div id="bb-tab-scrapbook" class="bb-tab-panel" style="display:none;">
          <div class="bb-export-bar" style="margin-bottom:12px;display:flex;gap:8px;justify-content:flex-end;">
            <button class="bb-sm-btn" id="bb-btn-export-md">📄 导出MD</button>
            <button class="bb-sm-btn" id="bb-btn-export-json">📦 导出JSON</button>
          </div>
          <div id="bb-scrap-empty" class="bb-empty" style="text-align:center;color:#888;padding:40px;">
            暂无收藏的语录<br/>点击消息旁的🌟 收藏
          </div>
          <div id="bb-records-list"></div>
        </div>

        <!-- 📖 日记本 -->
        <div id="bb-tab-diary" class="bb-tab-panel" style="display:none;">
          <div style="margin-bottom:12px;display:flex;gap:8px;justify-content:flex-end;">
            <button class="bb-sm-btn" id="bb-btn-gen-diary-tab">📖 生成日记</button></div>
          <div id="bb-diary-empty" class="bb-empty" style="text-align:center;color:#888;padding:40px;">
            暂无日记<br/>点击上方按钮生成
          </div>
          <div id="bb-diary-list"></div>
        </div>

        <!-- 🧑‍🤝‍🧑 NPC动态 -->
        <div id="bb-tab-npc" class="bb-tab-panel" style="display:none;">
          <div style="margin-bottom:12px;display:flex;gap:8px;justify-content:flex-end;">
            <button class="bb-sm-btn" id="bb-btn-add-npc">➕ 添加NPC</button>
            <button class="bb-sm-btn" id="bb-btn-auto-npc">🎲 随机窥探</button>
          </div>
          <div id="bb-npc-box"></div>
        </div>

        <!-- ☁️ 环境雷达 -->
        <div id="bb-tab-weather" class="bb-tab-panel" style="display:none;">
          <div style="margin-bottom:12px;display:flex;gap:8px;justify-content:flex-end;">
            <button class="bb-sm-btn" id="bb-btn-gen-weather-tab">☁️ 扫描环境</button>
          </div>
          <div class="bb-box" id="bb-weather-box" style="background:#222;border:2px solid #444;border-radius:8px;padding:16px;min-height:100px;color:#ddd;">
            未检测
          </div>
        </div>

        <!-- ❤️ 氛围心电图 -->
        <div id="bb-tab-vibe" class="bb-tab-panel" style="display:none;">
          <div style="margin-bottom:12px;display:flex;gap:8px;justify-content:flex-end;">
            <button class="bb-sm-btn" id="bb-btn-gen-vibe-tab">❤️ 分析氛围</button>
          </div>
          <div class="bb-box" id="bb-vibe-box" style="background:#222;border:2px solid #444;border-radius:8px;padding:16px;min-height:100px;color:#ddd;">
            未检测
          </div>
        </div>

        <!-- 🦋 平行宇宙 -->
        <div id="bb-tab-parallel" class="bb-tab-panel" style="display:none;">
          <div id="bb-par-empty" class="bb-empty" style="text-align:center;color:#888;padding:40px;">
            暂无平行宇宙记录<br/>点击消息旁的 🦋 开启分支
          </div>
          <div id="bb-par-list"></div>
        </div>

        <!-- 🎲 命运盘 -->
        <div id="bb-tab-fate" class="bb-tab-panel" style="display:none;">
          <div style="margin-bottom:12px;display:flex;gap:8px;justify-content:center;">
            <button class="bb-big-btn" id="bb-btn-roll-fate">🎲 转动命运之轮</button>
          </div>
          <div id="bb-fate-result" style="background:#222;border:2px solid #8b0000;border-radius:8px;padding:16px;margin-bottom:16px;min-height:100px;color:#ddd;text-align:center;">
            点击上方按钮，让命运降临...
          </div>
          <div style="margin-top:20px;">
            <h4 style="color:#8b0000;margin-bottom:12px;border-bottom:1px solid #444;padding-bottom:8px;">📜 命运历史</h4>
            <div id="bb-fate-history-list"></div>
          </div>
        </div>

        <!-- 💬 破墙聊天室 -->
        <div id="bb-tab-ooc" class="bb-tab-panel" style="display:none;">
          <div style="margin-bottom:12px;display:flex;gap:8px;justify-content:flex-end;">
            <button class="bb-sm-btn" id="bb-btn-open-ooc-win">💬 打开对话窗口</button>
            <button class="bb-sm-btn" id="bb-btn-clear-ooc">🗑️ 清空历史</button>
          </div>
          <div id="bb-ooc-preview" style="background:#222;border:2px solid #444;border-radius:8px;padding:16px;min-height:200px;max-height:400px;overflow-y:auto;color:#ddd;">
            <div class="bb-empty" style="text-align:center;color:#888;">
              这里是跨越次元的聊天窗口，点击上方按钮，和ta聊聊剧本之外的故事吧！
            </div>
          </div>
        </div>

        <!-- 📻 世界频段 -->
        <div id="bb-tab-world" class="bb-tab-panel" style="display:none;">
          <div style="margin-bottom:12px;display:flex;gap:8px;justify-content:flex-end;">
            <button class="bb-sm-btn" id="bb-btn-add-feed">➕ 添加消息</button>
            <button class="bb-sm-btn" id="bb-btn-gen-feed">🎲 生成消息</button>
            <button class="bb-sm-btn" id="bb-btn-clear-feed">🗑️ 清空</button>
          </div>
          <div class="bb-marquee-container" style="background:#000;border:2px solid #8b0000;border-radius:8px;padding:12px;margin-bottom:16px;overflow:hidden;position:relative;height:50px;">
            <div id="bb-marquee" style="white-space:nowrap;animation:bb-scroll 20s linear infinite;color:#fff;font-size:16px;">🌍 世界频段广播中...
            </div>
          </div>
          <div id="bb-world-feed-list" style="max-height:400px;overflow-y:auto;"></div>
        </div>

        <!-- 🎨 画廊 (v6.0) -->
        <div id="bb-tab-gallery" class="bb-tab-panel" style="display:none;">
          <div style="margin-bottom:12px;display:flex;gap:8px;justify-content:flex-end;flex-wrap:wrap;">
            <button class="bb-sm-btn" id="bb-btn-gen-image">🎨 AI生成配图</button>
            <button class="bb-sm-btn" id="bb-btn-upload-image">📁 上传图片</button></div>
          <div id="bb-gallery-empty" class="bb-empty" style="text-align:center;color:#888;padding:40px;">
            暂无图片<br/>点击上方按钮生成或上传
          </div>
          <div id="bb-gallery-list" style="display:grid;grid-template-columns:repeat(auto-fill,minmax(200px,1fr));gap:12px;"></div>
        </div>

        <!-- 💑 情侣空间 (v6.0) -->
        <div id="bb-tab-couple" class="bb-tab-panel" style="display:none;">
          ${buildCoupleSpaceHTML()}
        </div>

        <!-- 🏆 成就殿堂 -->
        <div id="bb-tab-achievements" class="bb-tab-panel" style="display:none;">
          <div style="margin-bottom:12px;text-align:center;">
            <div style="font-size:14px;color:#888;">已解锁 <span id="bb-ach-count" style="color:#8b0000;font-weight:bold;">0</span> /<span id="bb-ach-total">14</span></div>
          </div>
          <div id="bb-ach-list"></div>
        </div>

      </div>
    </div>
  `;
}

// ============================================
// 首页布局构建 (v6.0 多布局)
// ============================================

function buildHomeLayout(layout) {
  if (layout === 'card') return buildHomeLayoutCard();
  if (layout === 'timeline') return buildHomeLayoutTimeline();
  return buildHomeLayoutListen(); // 默认
}

function buildHomeLayoutListen() {
  return `
  <div class="bb-home-card" style="background:#222;border:2px solid #444;border-radius:8px;padding:20px;margin-bottom:16px;">
    <!--顶部：头像 + 链接 + 名字 -->
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:20px;">
      <div style="display:flex;align-items:center;gap:12px;">
        <div class="bb-home-avatar" id="bb-home-user-avatar" style="width:60px;height:60px;border-radius:50%;background:#333;border:2px solid #8b0000;cursor:pointer;overflow:hidden;display:flex;align-items:center;justify-content:center;font-size:32px;">👤
        </div>
        <div>
          <div id="bb-home-user-name" style="font-size:16px;font-weight:bold;color:#fff;">用户名</div>
        </div>
      </div><div id="bb-home-link-emoji" contenteditable="true" style="font-size:40px;cursor:pointer;user-select:none;" title="点击编辑">💕</div>

      <div style="display:flex;align-items:center;gap:12px;">
        <div style="text-align:right;">
          <div id="bb-home-char-name" style="font-size:16px;font-weight:bold;color:#fff;">角色名</div>
        </div>
        <div class="bb-home-avatar" id="bb-home-char-avatar" style="width:60px;height:60px;border-radius:50%;background:#333;border:2px solid #8b0000;cursor:pointer;overflow:hidden;display:flex;align-items:center;justify-content:center;font-size:32px;">
          🎭
        </div>
      </div>
    </div>

    <!-- 气泡对话 -->
    <div style="margin-bottom:20px;">
      <div style="display:flex;justify-content:flex-start;margin-bottom:12px;">
        <div id="bb-home-user-bubble" contenteditable="true" style="background:#444;color:#fff;padding:10px 14px;border-radius:18px 18px 18px 4px;max-width:70%;font-size:14px;cursor:text;" title="点击编辑">
          今天也要开心鸭~
        </div>
      </div>
      <div style="display:flex;justify-content:flex-end;">
        <div id="bb-home-char-bubble" contenteditable="true" style="background:#8b0000;color:#fff;padding:10px 14px;border-radius:18px 18px 4px 18px;max-width:70%;font-size:14px;cursor:text;" title="点击编辑">
          嗯，一起加油！
        </div>
      </div>
    </div>

    <!-- 统计信息 -->
    <div style="background:#1a1a1a;border-radius:8px;padding:16px;">
      <div style="display:flex;justify-content:space-around;text-align:center;">
        <div>
          <div style="font-size:24px;font-weight:bold;color:#8b0000;" id="bb-home-msg-count">0</div>
          <div style="font-size:12px;color:#888;">💬 已聊天</div>
        </div>
        <div>
          <div style="font-size:24px;font-weight:bold;color:#8b0000;" id="bb-home-time-count">0</div>
          <div style="font-size:12px;color:#888;">⏱️ 分钟</div>
        </div>
      </div>
      <div style="margin-top:16px;text-align:center;">
        <div style="font-size:14px;color:#aaa;">🎵 正在一起听</div>
        <div id="bb-home-radio-text" contenteditable="true" style="font-size:18px;color:#fff;margin-top:8px;cursor:text;text-align:center;" title="点击编辑">骨与血电台
        </div>
      </div>
    </div>

    <!-- 头像设置按钮 -->
    <div style="margin-top:16px;display:flex;gap:8px;justify-content:center;flex-wrap:wrap;">
      <button class="bb-sm-btn" id="bb-btn-set-user-avatar">📷 设置用户头像</button>
      <button class="bb-sm-btn" id="bb-btn-set-char-avatar">📷 设置角色头像</button>
      <button class="bb-sm-btn" id="bb-btn-save-home">💾 保存首页配置</button>
    </div>
  </div>
  `;
}

function buildHomeLayoutCard() {
  return `
  <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-bottom:16px;">
    <!-- 用户卡片 -->
    <div style="background:#222;border:2px solid #444;border-radius:12px;padding:20px;text-align:center;">
      <div class="bb-home-avatar" id="bb-home-user-avatar" style="width:80px;height:80px;border-radius:50%;background:#333;border:3px solid #8b0000;cursor:pointer;overflow:hidden;display:flex;align-items:center;justify-content:center;font-size:40px;margin:0 auto 12px;">
        👤
      </div>
      <div id="bb-home-user-name" style="font-size:18px;font-weight:bold;color:#fff;margin-bottom:8px;">用户名</div>
      <div id="bb-home-user-bubble" contenteditable="true" style="background:#444;color:#fff;padding:8px 12px;border-radius:12px;font-size:13px;cursor:text;" title="点击编辑">
        今天也要开心鸭~
      </div>
    </div>

    <!-- 角色卡片 -->
    <div style="background:#222;border:2px solid #444;border-radius:12px;padding:20px;text-align:center;">
      <div class="bb-home-avatar" id="bb-home-char-avatar" style="width:80px;height:80px;border-radius:50%;background:#333;border:3px solid #8b0000;cursor:pointer;overflow:hidden;display:flex;align-items:center;justify-content:center;font-size:40px;margin:0 auto 12px;">
        🎭
      </div>
      <div id="bb-home-char-name" style="font-size:18px;font-weight:bold;color:#fff;margin-bottom:8px;">角色名</div>
      <div id="bb-home-char-bubble" contenteditable="true" style="background:#8b0000;color:#fff;padding:8px 12px;border-radius:12px;font-size:13px;cursor:text;" title="点击编辑">
        嗯，一起加油！
      </div>
    </div>
  </div>

  <!-- 中间链接 -->
  <div style="text-align:center;margin-bottom:16px;">
    <div id="bb-home-link-emoji" contenteditable="true" style="font-size:48px;cursor:pointer;user-select:none;" title="点击编辑">💕</div>
  </div>

  <!-- 统计卡片 -->
  <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:12px;margin-bottom:16px;">
    <div style="background:#222;border:1px solid #444;border-radius:8px;padding:16px;text-align:center;">
      <div style="font-size:28px;font-weight:bold;color:#8b0000;" id="bb-home-msg-count">0</div>
      <div style="font-size:12px;color:#888;">💬 消息</div>
    </div>
    <div style="background:#222;border:1px solid #444;border-radius:8px;padding:16px;text-align:center;">
      <div style="font-size:28px;font-weight:bold;color:#8b0000;" id="bb-home-time-count">0</div>
      <div style="font-size:12px;color:#888;">⏱️ 分钟</div>
    </div><div style="background:#222;border:1px solid #444;border-radius:8px;padding:16px;text-align:center;">
      <div id="bb-home-radio-text" contenteditable="true" style="font-size:14px;color:#fff;cursor:text;" title="点击编辑">骨与血电台</div><div style="font-size:12px;color:#888;">🎵 电台</div>
    </div>
  </div>

  <div style="display:flex;gap:8px;justify-content:center;flex-wrap:wrap;">
    <button class="bb-sm-btn" id="bb-btn-set-user-avatar">📷 用户头像</button>
    <button class="bb-sm-btn" id="bb-btn-set-char-avatar">📷 角色头像</button>
    <button class="bb-sm-btn" id="bb-btn-save-home">💾 保存</button>
  </div>
  `;
}

function buildHomeLayoutTimeline() {
  return `
  <div style="position:relative;padding-left:30px;border-left:3px solid #8b0000;margin-left:20px;">
    <!-- 头像区-->
    <div style="position:relative;margin-bottom:24px;">
      <div style="position:absolute;left:-41px;top:0;width:20px;height:20px;background:#8b0000;border-radius:50;border:3px solid #1a1a1a;"></div>
      <div style="display:flex;align-items:center;gap:16px;">
        <div class="bb-home-avatar" id="bb-home-user-avatar" style="width:50px;height:50px;border-radius:50%;background:#333;border:2px solid #8b0000;cursor:pointer;overflow:hidden;display:flex;align-items:center;justify-content:center;font-size:28px;">
          👤
        </div>
        <div id="bb-home-user-name" style="font-size:16px;font-weight:bold;color:#fff;">用户名</div>
        <div id="bb-home-link-emoji" contenteditable="true" style="font-size:32px;cursor:pointer;" title="点击编辑">💕</div>
        <div id="bb-home-char-name" style="font-size:16px;font-weight:bold;color:#fff;">角色名</div>
        <div class="bb-home-avatar" id="bb-home-char-avatar" style="width:50px;height:50px;border-radius:50%;background:#333;border:2px solid #8b0000;cursor:pointer;overflow:hidden;display:flex;align-items:center;justify-content:center;font-size:28px;">
          🎭
        </div>
      </div>
    </div>

    <!-- 对话时间线 -->
    <div style="position:relative;margin-bottom:24px;">
      <div style="position:absolute;left:-41px;top:0;width:20px;height:20px;background:#444;border-radius:50%;border:3px solid #1a1a1a;"></div>
      <div style="background:#222;border-radius:8px;padding:12px;">
        <div style="font-size:12px;color:#888;margin-bottom:6px;">💬 用户说</div>
        <div id="bb-home-user-bubble" contenteditable="true" style="color:#fff;font-size:14px;cursor:text;" title="点击编辑">今天也要开心鸭~</div>
      </div>
    </div>

    <div style="position:relative;margin-bottom:24px;">
      <div style="position:absolute;left:-41px;top:0;width:20px;height:20px;background:#8b0000;border-radius:50%;border:3px solid #1a1a1a;"></div>
      <div style="background:#2a1a1a;border:1px solid #8b0000;border-radius:8px;padding:12px;">
        <div style="font-size:12px;color:#888;margin-bottom:6px;">🎭 角色说</div>
        <div id="bb-home-char-bubble" contenteditable="true" style="color:#fff;font-size:14px;cursor:text;" title="点击编辑">嗯，一起加油！</div>
      </div>
    </div>

    <!-- 统计时间线 -->
    <div style="position:relative;margin-bottom:24px;">
      <div style="position:absolute;left:-41px;top:0;width:20px;height:20px;background:#444;border-radius:50%;border:3px solid #1a1a1a;"></div>
      <div style="background:#222;border-radius:8px;padding:16px;display:flex;gap:24px;">
        <div>
          <span style="font-size:24px;font-weight:bold;color:#8b0000;" id="bb-home-msg-count">0</span>
          <span style="font-size:12px;color:#888;"> 条消息</span>
        </div>
        <div>
          <span style="font-size:24px;font-weight:bold;color:#8b0000;" id="bb-home-time-count">0</span>
          <span style="font-size:12px;color:#888;"> 分钟</span>
        </div>
      </div>
    </div>

    <!-- 电台 -->
    <div style="position:relative;margin-bottom:24px;">
      <div style="position:absolute;left:-41px;top:0;width:20px;height:20px;background:#8b0000;border-radius:50%;border:3px solid #1a1a1a;"></div>
      <div style="background:#222;border-radius:8px;padding:12px;text-align:center;">
        <div style="font-size:12px;color:#888;">🎵 正在一起听</div>
        <div id="bb-home-radio-text" contenteditable="true" style="font-size:16px;color:#fff;margin-top:4px;cursor:text;" title="点击编辑">骨与血电台</div>
      </div>
    </div>
  </div>

  <div style="display:flex;gap:8px;justify-content:center;flex-wrap:wrap;margin-top:16px;">
    <button class="bb-sm-btn" id="bb-btn-set-user-avatar">📷 用户头像</button>
    <button class="bb-sm-btn" id="bb-btn-set-char-avatar">📷 角色头像</button>
    <button class="bb-sm-btn" id="bb-btn-save-home">💾 保存</button>
  </div>
  `;
}

// ============================================
// 情侣空间 HTML (v6.0)
// ============================================

function buildCoupleSpaceHTML() {
  return `
  <div style="text-align:center;margin-bottom:20px;">
    <div style="font-size:48px;margin-bottom:8px;" id="bb-pet-display">🐱</div>
    <div style="font-size:16px;color:#fff;font-weight:bold;" id="bb-pet-name-display">给宠物取个名字吧</div>
    <div style="display:flex;justify-content:center;gap:20px;margin-top:12px;">
      <div style="text-align:center;">
        <div style="font-size:12px;color:#888;">❤️ 心情</div>
        <div style="width:100px;height:8px;background:#333;border-radius:4px;overflow:hidden;margin-top:4px;">
          <div id="bb-pet-mood-bar" style="width:100%;height:100%;background:linear-gradient(90deg,#8b0000,#ff4444);border-radius:4px;transition:width 0.3s;"></div>
        </div><div style="font-size:11px;color:#aaa;margin-top:2px;" id="bb-pet-mood-text">100%</div>
      </div>
      <div style="text-align:center;">
        <div style="font-size:12px;color:#888;">🍖饱腹</div>
        <div style="width:100px;height:8px;background:#333;border-radius:4px;overflow:hidden;margin-top:4px;">
          <div id="bb-pet-hunger-bar" style="width:100%;height:100%;background:linear-gradient(90deg,#8b6914,#ffa500);border-radius:4px;transition:width 0.3s;"></div>
        </div>
        <div style="font-size:11px;color:#aaa;margin-top:2px;" id="bb-pet-hunger-text">100%</div>
      </div>
    </div>
    <div style="display:flex;gap:8px;justify-content:center;margin-top:12px;flex-wrap:wrap;">
      <button class="bb-sm-btn" id="bb-btn-pet-feed">🍖 喂食</button>
      <button class="bb-sm-btn" id="bb-btn-pet-play">🎾 玩耍</button>
      <button class="bb-sm-btn" id="bb-btn-pet-rename">✏️ 改名</button>
      <button class="bb-sm-btn" id="bb-btn-pet-change">🔄 换宠物</button>
    </div>
  </div>

  <hr style="border-color:#444;margin:20px 0;" />

  <!--纪念日 -->
  <div style="background:#222;border:1px solid #444;border-radius:8px;padding:16px;margin-bottom:16px;">
    <h4 style="color:#8b0000;margin:0 0 12px;">💍 纪念日</h4>
    <div style="display:flex;align-items:center;gap:12px;">
      <input type="date" id="bb-anniversary-date" class="text_pole" style="padding:6px;background:#333;border:1px solid #555;color:#fff;border-radius:4px;" />
      <button class="bb-sm-btn" id="bb-btn-save-anniversary">💾 保存</button>
    </div><div id="bb-anniversary-display" style="margin-top:8px;color:#aaa;font-size:14px;"></div>
  </div>

  <!-- 情书/小纸条 -->
  <div style="background:#222;border:1px solid #444;border-radius:8px;padding:16px;margin-bottom:16px;">
    <h4 style="color:#8b0000;margin:0 0 12px;">💌 小纸条</h4>
    <div style="display:flex;gap:8px;margin-bottom:12px;">
      <input type="text" id="bb-love-note-input" class="text_pole" placeholder="写一张小纸条给ta..." style="flex:1;padding:8px;background:#333;border:1px solid #555;color:#fff;border-radius:4px;" />
      <button class="bb-sm-btn" id="bb-btn-add-love-note">📝 留言</button>
    </div>
    <div id="bb-love-notes-list" style="max-height:200px;overflow-y:auto;"></div>
  </div>

  <!-- 心情日记 -->
  <div style="background:#222;border:1px solid #444;border-radius:8px;padding:16px;">
    <h4 style="color:#8b0000;margin:0 0 12px;">📊 心情曲线</h4>
    <div style="display:flex;gap:8px;margin-bottom:12px;flex-wrap:wrap;">
      <button class="bb-sm-btn bb-mood-btn" data-mood="😊">😊 开心</button>
      <button class="bb-sm-btn bb-mood-btn" data-mood="😢">😢 难过</button>
      <button class="bb-sm-btn bb-mood-btn" data-mood="😍">😍 心动</button>
      <button class="bb-sm-btn bb-mood-btn" data-mood="😤">😤 生气</button>
      <button class="bb-sm-btn bb-mood-btn" data-mood="😴">😴 困倦</button>
      <button class="bb-sm-btn bb-mood-btn" data-mood="🥰">🥰 甜蜜</button></div>
    <div id="bb-mood-diary-list" style="max-height:200px;overflow-y:auto;"></div>
  </div>`;
}

// ============================================
// Tab名称获取
// ============================================

function getTabNames() {
  const s = getSettings();
  const preset = s.style_preset;
  if (preset === 'custom' && Object.keys(s.custom_names).length > 0) {
    return s.custom_names;
  }
  return STYLE_PRESETS[preset] || STYLE_PRESETS.gothic;
}

function refreshFloatingUI() {
  const wasVisible = $('#bb-main-panel').css('display') !== 'none';
  $('#bb-main-panel').remove();
  $('body').append(buildMainPanelHTML());
  bindMainPanelEvents();
  renderAll();
  if (wasVisible) {
    showMainPanel();
  }
}

// ============================================
// 主面板事件绑定
// ============================================

function bindMainPanelEvents() {
  // 关闭按钮
  $('#bb-close-btn').on('click', () => hideMainPanel());

  // Tab切换
  $('.bb-tab').on('click', function () {
    const tab = $(this).data('tab');
    $('.bb-tab').removeClass('active');
    $(this).addClass('active');
    $('.bb-tab-panel').hide();
    $(`#bb-tab-${tab}`).show();
  });

  // 首页：头像点击
  $(document).off('click.bb-avatar').on('click.bb-avatar', '#bb-home-user-avatar, #bb-home-char-avatar', function () {
    const isUser = $(this).attr('id') === 'bb-home-user-avatar';
    const avatarEl = $(this);

    const modal = $(`
      <div class="bb-modal-overlay" style="position:fixed;inset:0;background:rgba(0,0,0,0.8);z-index:99999;display:flex;align-items:center;justify-content:center;">
        <div class="bb-modal-content" style="background:var(--bb-bg-main,#1a1a1a);border:3px solid var(--bb-primary,#8b0000);border-radius:12px;padding:24px;width:90%;max-width:400px;box-shadow:var(--bb-shadow-lg);">
          <h3 style="color:var(--bb-primary,#8b0000);margin:0 0 16px;text-align:center;">设置${isUser ? '用户' : '角色'}头像</h3>
          <div style="display:flex;flex-direction:column;gap:12px;">
            <button class="bb-big-btn" id="bb-avatar-url" style="width:100%;">🔗 输入URL</button>
            <button class="bb-big-btn" id="bb-avatar-file" style="width:100%;">📁 上传文件</button>
            <button class="bb-sm-btn" id="bb-avatar-cancel" style="width:100%;background:#444;">取消</button>
          </div>
        </div>
      </div>
    `);

    $('body').append(modal);

    modal.find('#bb-avatar-url').on('click', function () {
      modal.remove();
      const url = prompt('请输入头像URL:');
      if (url) {
        avatarEl.html(`<img src="${url}" style="width:100%;height:100%;object-fit:cover;" />`);
        if (isUser) pluginData.home_config.user_avatar = url;
        else pluginData.home_config.char_avatar = url;
        saveChatData();
        toastr.success('头像已更新');
      }
    });

    modal.find('#bb-avatar-file').on('click', function () {
      modal.remove();
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = 'image/*';
      input.onchange = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        if (file.size > 5 * 1024 * 1024) {
          toastr.error('文件过大，请选择小于5MB的图片');
          return;
        }
        const reader = new FileReader();
        reader.onload = (ev) => {
          const dataURL = ev.target.result;
          avatarEl.html(`<img src="${dataURL}" style="width:100%;height:100%;object-fit:cover;" />`);
          if (isUser) pluginData.home_config.user_avatar = dataURL;
          else pluginData.home_config.char_avatar = dataURL;
          saveChatData();
          toastr.success('头像已上传');
        };
        reader.readAsDataURL(file);
      };
      input.click();
    });

    modal.find('#bb-avatar-cancel').on('click', function () {
      modal.remove();
    });
  });

  // 首页：保存配置
  $(document).off('click.bb-save-home').on('click.bb-save-home', '#bb-btn-save-home', function () {
    pluginData.home_config.link_emoji = $('#bb-home-link-emoji').text();
    pluginData.home_config.user_bubble = $('#bb-home-user-bubble').text();
    pluginData.home_config.char_bubble = $('#bb-home-char-bubble').text();
    pluginData.home_config.radio_text = $('#bb-home-radio-text').text();
    saveChatData();
    toastr.success('💾 首页配置已保存');
  });

  // 导出按钮
  $('#bb-btn-export-md').on('click', exportAsMarkdown);
  $('#bb-btn-export-json').on('click', exportAsJSON);

  // 生成按钮
  $('#bb-btn-gen-diary-tab').on('click', generateDiary);
  $('#bb-btn-add-npc').on('click', () => {
    const name = prompt('输入NPC名称:');
    if (!name) return;
    if (pluginData.npc_status[name]) {
      toastr.info('该NPC已存在');
      return;
    }
    pluginData.npc_status[name] = { description: '等待窥探...', lastUpdate: '' };
    saveChatData();
    renderIntel();
    toastr.success(`➕ 已添加NPC: ${name}`);
  });

  $('#bb-btn-auto-npc').on('click', autoNPCPeek);
  $('#bb-btn-gen-weather-tab').on('click', generateWeather);
  $('#bb-btn-gen-vibe-tab').on('click', generateVibe);
  $('#bb-btn-roll-fate').on('click', rollFate);

  // 破墙聊天室
  $('#bb-btn-open-ooc-win').on('click', () => $('#bb-ooc-win').css('display', 'flex'));
  $('#bb-btn-clear-ooc').on('click', () => {
    if (!confirm('确认清空破墙聊天历史?')) return;
    pluginData.ooc_chat = [];
    oocSession.history = [];
    saveChatData();
    renderOOCPreview();
    toastr.info('🗑️ 已清空');
  });

  // 世界频段
  $('#bb-btn-add-feed').on('click', () => {
    const content = prompt('输入消息内容:');
    if (!content) return;
    pluginData.world_feed.push({
      type: 'custom',
      content,
      timestamp: new Date().toLocaleString('zh-CN'),});
    saveChatData();
    renderWorldFeed();
    updateMarquee();
  });

  $('#bb-btn-gen-feed').on('click', generateWorldFeed);
  $('#bb-btn-clear-feed').on('click', () => {
    if (!confirm('确认清空世界频段?')) return;
    pluginData.world_feed = [];
    saveChatData();
    renderWorldFeed();
    updateMarquee();
    toastr.info('🗑️ 已清空');
  });

  // 画廊
  $('#bb-btn-gen-image').on('click', generateGalleryImage);
  $('#bb-btn-upload-image').on('click', uploadGalleryImage);

  // 情侣空间
  bindCoupleSpaceEvents();
}

// ============================================
// 情侣空间事件绑定 (v6.0)
// ============================================

function bindCoupleSpaceEvents() {
  $(document).off('click.bb-pet').on('click.bb-pet', '#bb-btn-pet-feed', function () {
    pluginData.couple_space.pet_hunger = Math.min(100, (pluginData.couple_space.pet_hunger || 0) + 20);
    pluginData.couple_space.pet_mood = Math.min(100, (pluginData.couple_space.pet_mood || 0) + 5);
    saveChatData();
    renderCoupleSpace();
    toastr.success('🍖 宠物吃饱啦！');
  });

  $(document).off('click.bb-pet-play').on('click.bb-pet-play', '#bb-btn-pet-play', function () {
    pluginData.couple_space.pet_mood = Math.min(100, (pluginData.couple_space.pet_mood || 0) + 15);
    pluginData.couple_space.pet_hunger = Math.max(0, (pluginData.couple_space.pet_hunger || 100) - 10);
    saveChatData();
    renderCoupleSpace();
    toastr.success('🎾 宠物玩得很开心！');
  });

  $(document).off('click.bb-pet-rename').on('click.bb-pet-rename', '#bb-btn-pet-rename', function () {
    const name = prompt('给宠物取个名字:', pluginData.couple_space.pet_name || '');
    if (name !== null) {
      pluginData.couple_space.pet_name = name;
      saveChatData();
      renderCoupleSpace();
      toastr.success(`✏️ 宠物改名为: ${name}`);
    }
  });

  $(document).off('click.bb-pet-change').on('click.bb-pet-change', '#bb-btn-pet-change', function () {
    const pets = ['🐱', '🐶', '🐰', '🐻', '🦊', '🐼', '🐸', '🦋', '🐦', '🐠', '🦄', '🐉', '🐺', '🦇'];
    const current = pluginData.couple_space.pet_type || '🐱';
    const idx = pets.indexOf(current);
    pluginData.couple_space.pet_type = pets[(idx + 1) % pets.length];
    saveChatData();
    renderCoupleSpace();
    toastr.info(`🔄 换成了 ${pluginData.couple_space.pet_type}`);
  });

  $(document).off('click.bb-anniversary').on('click.bb-anniversary', '#bb-btn-save-anniversary', function () {
    const date = $('#bb-anniversary-date').val();
    if (date) {
      pluginData.couple_space.anniversary = date;
      saveChatData();
      renderCoupleSpace();
      toastr.success('💍 纪念日已保存');
    }
  });

  $(document).off('click.bb-love-note').on('click.bb-love-note', '#bb-btn-add-love-note', function () {
    const note = $('#bb-love-note-input').val().trim();
    if (!note) return;
    if (!pluginData.couple_space.love_notes) pluginData.couple_space.love_notes = [];
    pluginData.couple_space.love_notes.push({
      content: note,
      timestamp: new Date().toLocaleString('zh-CN'),
    });
    $('#bb-love-note-input').val('');
    saveChatData();
    renderCoupleSpace();
    toastr.success('💌 小纸条已留下');
  });

  $(document).off('click.bb-mood').on('click.bb-mood', '.bb-mood-btn', function () {
    const mood = $(this).data('mood');
    if (!pluginData.couple_space.mood_diary) pluginData.couple_space.mood_diary = [];
    pluginData.couple_space.mood_diary.push({
      mood,
      timestamp: new Date().toLocaleString('zh-CN'),
    });
    saveChatData();
    renderCoupleSpace();
    toastr.success(`${mood} 心情已记录`);
  });
}

function renderCoupleSpace() {
  const cs = pluginData.couple_space;

  // 宠物
  $('#bb-pet-display').text(cs.pet_type || '🐱');
  $('#bb-pet-name-display').text(cs.pet_name || '给宠物取个名字吧');
  const mood = cs.pet_mood ??100;
  const hunger = cs.pet_hunger ?? 100;
  $('#bb-pet-mood-bar').css('width', mood + '%');
  $('#bb-pet-mood-text').text(mood + '%');
  $('#bb-pet-hunger-bar').css('width', hunger + '%');
  $('#bb-pet-hunger-text').text(hunger + '%');

  // 纪念日
  if (cs.anniversary) {
    $('#bb-anniversary-date').val(cs.anniversary);
    const days = Math.floor((Date.now() - new Date(cs.anniversary).getTime()) / (1000 * 60 * 60 * 24));
    $('#bb-anniversary-display').html(`💕 你们已经在一起 <span style="color:#8b0000;font-weight:bold;font-size:18px;">${days}</span> 天了`);
  }

  // 小纸条
  const notesList = $('#bb-love-notes-list');
  notesList.empty();
  if (cs.love_notes && cs.love_notes.length > 0) {
    cs.love_notes.slice(-10).reverse().forEach((n, idx) => {
      notesList.append(`
        <div style="background:#1a1a1a;border-left:3px solid #8b0000;padding:8px 12px;margin-bottom:8px;border-radius:4px;display:flex;justify-content:space-between;align-items:center;">
          <div>
            <div style="color:#ddd;font-size:13px;">${esc(n.content)}</div>
            <div style="color:#666;font-size:11px;margin-top:4px;">${n.timestamp}</div>
          </div>
          <span class="bb-note-del" data-idx="${cs.love_notes.length - 1 - idx}" style="cursor:pointer;font-size:14px;" title="删除">🗑️</span>
        </div>
      `);
    });
    notesList.find('.bb-note-del').on('click', function () {
      const i = $(this).data('idx');
      cs.love_notes.splice(i, 1);
      saveChatData();
      renderCoupleSpace();
    });
  } else {
    notesList.html('<div style="text-align:center;color:#666;font-size:13px;padding:12px;">还没有小纸条哦~</div>');
  }

  // 心情日记
  const moodList = $('#bb-mood-diary-list');
  moodList.empty();
  if (cs.mood_diary && cs.mood_diary.length > 0) {
    cs.mood_diary.slice(-10).reverse().forEach(m => {
      moodList.append(`
        <div style="display:inline-flex;align-items:center;gap:6px;background:#1a1a1a;padding:6px 10px;border-radius:16px;margin:4px;font-size:13px;">
          <span style="font-size:18px;">${m.mood}</span>
          <span style="color:#888;font-size:11px;">${m.timestamp}</span>
        </div>
      `);
    });
  } else {
    moodList.html('<div style="text-align:center;color:#666;font-size:13px;padding:12px;">记录今天的心情吧~</div>');
  }
}

//宠物系统定时器
function startPetTimer() {
  setInterval(() => {
    if (!pluginData.couple_space) return;
    // 每5分钟降低1点
    pluginData.couple_space.pet_mood = Math.max(0, (pluginData.couple_space.pet_mood || 100) - 1);
    pluginData.couple_space.pet_hunger = Math.max(0, (pluginData.couple_space.pet_hunger || 100) - 1);
    // 不频繁保存，只在面板可见时更新UI
    if ($('#bb-tab-couple').is(':visible')) {
      renderCoupleSpace();
    }
  }, 5 * 60 * 1000);
}

//============================================
// 画廊功能 (v6.0)
// ============================================

async function generateGalleryImage() {
  const s = getSettings();
  if (!s.img_api_enabled) {
    toastr.warning('请先在设置中启用生图功能');
    return;
  }

  toastr.info('🎨 正在生成配图...');

  // 用AI生成提示词
  const recent = getRecentChat(10);
  const ctx = getContext();
  let imgPrompt = '';

  if (recent.length > 0) {
    const guidancePrompt = s.img_guidance_preset || '根据角色描述和当前场景，生成一张符合氛围的插画描述。';
    const result = await callSubAPI([
      { role: 'system', content: `${guidancePrompt}\n请用英文输出适合AI绘画的提示词（prompt），只输出提示词，不要其他内容。角色名: ${ctx.name2|| '角色'}` },
      { role: 'user', content: fmt(recent) },
    ],200);
    imgPrompt = result || `${ctx.name2 || 'character'}, beautiful illustration`;
  } else {
    imgPrompt = `${ctx.name2 || 'character'}, beautiful illustration, high quality`;
  }

  const imgUrl = await callImgAPI(imgPrompt);

  if (imgUrl) {
    if (!pluginData.gallery_images) pluginData.gallery_images = [];
    pluginData.gallery_images.push({
      url: imgUrl,
      prompt: imgPrompt,
      timestamp: new Date().toLocaleString('zh-CN'),
    });
    saveChatData();
    renderGallery();
    toastr.success('🎨 配图已生成！');
  }
}

function uploadGalleryImage() {
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = 'image/*';
  input.onchange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) {
      toastr.error('文件过大，请选择小于10MB的图片');
      return;
    }
    const reader = new FileReader();
    reader.onload = (ev) => {
      if (!pluginData.gallery_images) pluginData.gallery_images = [];
      pluginData.gallery_images.push({
        url: ev.target.result,
        prompt: '手动上传',
        timestamp: new Date().toLocaleString('zh-CN'),
      });
      saveChatData();
      renderGallery();
      toastr.success('📁 图片已上传');
    };
    reader.readAsDataURL(file);
  };
  input.click();
}

function renderGallery() {
  const list = $('#bb-gallery-list');
  list.empty();

  if (!pluginData.gallery_images || pluginData.gallery_images.length === 0) {
    $('#bb-gallery-empty').show();
    return;
  }

  $('#bb-gallery-empty').hide();

  pluginData.gallery_images.forEach((img, idx) => {
    list.append(`
      <div style="background:#222;border:1px solid #444;border-radius:8px;overflow:hidden;position:relative;">
        <img src="${img.url}" style="width:100%;height:200px;object-fit:cover;display:block;" onerror="this.src='https://picsum.photos/200/200?random=${idx}'" />
        <div style="padding:8px;">
          <div style="font-size:11px;color:#888;margin-bottom:4px;">${img.timestamp}</div>
          <div style="font-size:11px;color:#666;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;" title="${esc(img.prompt)}">${esc(img.prompt)}</div>
          <div style="display:flex;gap:4px;margin-top:6px;">
            <button class="bb-sm-btn bb-gallery-reroll" data-idx="${idx}" style="padding:3px 8px;font-size:11px;">🔄 重roll</button>
            <button class="bb-sm-btn bb-gallery-del" data-idx="${idx}" style="padding:3px 8px;font-size:11px;">🗑️ 删除</button>
          </div>
        </div>
      </div>
    `);
  });

  list.find('.bb-gallery-del').on('click', function () {
    const idx = $(this).data('idx');
    if (!confirm('确认删除该图片?')) return;
    pluginData.gallery_images.splice(idx, 1);
    saveChatData();
    renderGallery();
    toastr.info('已删除图片');
  });

  list.find('.bb-gallery-reroll').on('click', async function () {
    const idx = $(this).data('idx');
    const oldImg = pluginData.gallery_images[idx];
    toastr.info('🔄 重新生成中...');
    const newUrl = await callImgAPI(oldImg.prompt);
    if (newUrl) {
      pluginData.gallery_images[idx] = {
        url: newUrl,
        prompt: oldImg.prompt,
        timestamp: new Date().toLocaleString('zh-CN'),
      };
      saveChatData();
      renderGallery();
      toastr.success('🔄 已重新生成');
    }
  });
}

// ============================================
// 蝴蝶窗口（平行宇宙）
// ============================================

function injectButterflyWindow() {
  if ($('#bb-bf-win').length > 0) return;

  // 修复：只用display:none，不再有第二个 display:flex冲突
  $('body').append(`
    <div id="bb-bf-win" style="display:none;position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);width:90%;max-width:600px;height:70%;background:#1a1a1a;border:3px solid #8b0000;border-radius:12px;box-shadow:0 8px 32px rgba(0,0,0,0.8);z-index:10001;flex-direction:column;">

      <div class="bb-bf-header" style="background:#000;color:#fff;padding:12px 16px;display:flex;justify-content:space-between;align-items:center;border-bottom:2px solid #8b0000;">
        <div style="font-size:16px;font-weight:bold;">🦋 平行宇宙</div>
        <button id="bb-bf-close" style="background:none;border:none;color:#fff;font-size:18px;cursor:pointer;">✖</button>
      </div>

      <div id="bb-bf-origin" style="background:#222;padding:12px;border-bottom:1px solid #444;color:#aaa;font-size:13px;max-height:80px;overflow-y:auto;"></div>

      <div id="bb-bf-chat" style="flex:1;overflow-y:auto;padding:12px;background:#1a1a1a;"></div>

      <div style="background:#222;padding:12px;border-top:1px solid #444;display:flex;gap:8px;">
        <input id="bb-bf-input" type="text" placeholder="输入消息..." style="flex:1;padding:8px;background:#333;border:1px solid #555;color:#fff;border-radius:4px;" />
        <button id="bb-bf-send" style="padding:8px 16px;background:#8b0000;color:#fff;border:none;border-radius:4px;cursor:pointer;font-weight:bold;">发送</button>
        <button id="bb-bf-export" style="padding:8px 12px;background:#444;color:#fff;border:none;border-radius:4px;cursor:pointer;" title="导出对话">📄</button>
      </div>
    </div>
  `);

  $('#bb-bf-close').on('click', () => $('#bb-bf-win').css('display', 'none'));
  $('#bb-bf-send').on('click', sendBfMsg);
  $('#bb-bf-input').on('keypress', (e) => { if (e.which === 13) sendBfMsg(); });
  $('#bb-bf-export').on('click', exportBfChat);
}

function openBfWin(messageId) {
  const ctx = getContext();
  const msg = ctx.chat[messageId];
  if (!msg) { toastr.error('未找到消息'); return; }

  butterflySession = {
    active: true,
    originFloor: messageId,
    originText: msg.mes,
    history: [],
  };

  $('#bb-bf-origin').html(`<b>原文(#${messageId}):</b> ${esc(msg.mes.substring(0, 200))}${msg.mes.length > 200 ? '...' : ''}`);
  $('#bb-bf-chat').empty();
  $('#bb-bf-win').css('display', 'flex');

  toastr.info('🦋 平行宇宙已开启，输入你的选择...');
}

async function sendBfMsg() {
  const input = $('#bb-bf-input');
  const userMsg = input.val().trim();
  if (!userMsg) return;

  input.val('');
  addBfBubble('user', userMsg);
  butterflySession.history.push({ role: 'user', content: userMsg });

  if (butterflySession.history.length === 1) {
    await genBfFirst(userMsg);
  } else {
    const preset = getActivePreset();
    const aiReply = await callSubAPI([
      { role: 'system', content: preset.prompts.butterfly },
      ...butterflySession.history,
    ], 500);

    if (aiReply) {
      addBfBubble('assistant', aiReply);
      butterflySession.history.push({ role: 'assistant', content: aiReply });
    }
  }
}

async function genBfFirst(userChoice) {
  toastr.info('🦋 生成平行宇宙中...');
  const preset = getActivePreset();
  const prompt = `${preset.prompts.butterfly}\n\n原文:\n${butterflySession.originText}\n\n用户选择:\n${userChoice}`;

  const result = await callSubAPI([
    { role: 'system', content: prompt },
  ], 600);

  if (result) {
    addBfBubble('assistant', result);
    butterflySession.history.push({ role: 'assistant', content: result });

    pluginData.parallel_universes.push({
      floor: butterflySession.originFloor,
      origin: butterflySession.originText,
      content: result,
      date: new Date().toLocaleString('zh-CN'),
    });
    saveChatData();
    renderParallel();
    toastr.success('🦋 平行宇宙已生成！');
  }
}

function addBfBubble(role, text) {
  const isUser = role === 'user';
  const bubble = `
    <div style="display:flex;justify-content:${isUser ? 'flex-end' : 'flex-start'};margin-bottom:12px;">
      <div style="background:${isUser ? '#444' : '#8b0000'};color:#fff;padding:10px 14px;border-radius:${isUser ? '18px 18px 4px 18px' : '18px 18px 18px 4px'};max-width:80%;word-wrap:break-word;">
        ${esc(text)}
      </div>
    </div>
  `;
  $('#bb-bf-chat').append(bubble);$('#bb-bf-chat').scrollTop($('#bb-bf-chat')[0].scrollHeight);
}

function exportBfChat() {
  if (butterflySession.history.length === 0) {
    toastr.warning('暂无对话');
    return;
  }

  let md = `# 🦋 平行宇宙对话\n\n## 原文 (#${butterflySession.originFloor})\n${butterflySession.originText}\n\n## 对话记录\n\n`;
  butterflySession.history.forEach(m => {
    md += `**${m.role === 'user' ? '你' : '角色'}:** ${m.content}\n\n`;
  });

  dl(`butterfly_${butterflySession.originFloor}_${Date.now()}.md`, md, 'text/markdown');
  toastr.success('📄 已导出蝴蝶对话');
}

// ============================================
// 破墙聊天室（OOC窗口）
// ============================================

function injectOOCWindow() {
  if ($('#bb-ooc-win').length > 0) return;

  // 修复：只用 display:none，不再有第二个 display:flex 冲突
  $('body').append(`
    <div id="bb-ooc-win" style="display:none;position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);width:90%;max-width:600px;height:70%;background:#1a1a1a;border:3px solid #8b0000;border-radius:12px;box-shadow:0 8px 32px rgba(0,0,0,0.8);z-index:10001;flex-direction:column;">

      <div class="bb-ooc-header" style="background:#000;color:#fff;padding:12px 16px;display:flex;justify-content:space-between;align-items:center;border-bottom:2px solid #8b0000;">
        <div style="font-size:16px;font-weight:bold;">Burning Star chat</div>
        <button id="bb-ooc-close" style="background:none;border:none;color:#fff;font-size:18px;cursor:pointer;">✖</button>
      </div>

      <div id="bb-ooc-chat" style="flex:1;overflow-y:auto;padding:12px;background:#1a1a1a;"></div>

      <div style="background:#222;padding:12px;border-top:1px solid #444;display:flex;gap:8px;">
        <input id="bb-ooc-input" type="text" placeholder="在这里，你可以和TA聊聊天外的故事..." style="flex:1;padding:8px;background:#333;border:1px solid #555;color:#fff;border-radius:4px;" />
        <button id="bb-ooc-send" style="padding:8px 16px;background:#8b0000;color:#fff;border:none;border-radius:4px;cursor:pointer;font-weight:bold;">发送</button>
      </div>
    </div>
  `);

  $('#bb-ooc-close').on('click', () => $('#bb-ooc-win').css('display', 'none'));
  $('#bb-ooc-send').on('click', sendOOCMsg);$('#bb-ooc-input').on('keypress', (e) => { if (e.which === 13) sendOOCMsg(); });

  renderOOCChat();
}

async function sendOOCMsg() {
  const input = $('#bb-ooc-input');
  const userMsg = input.val().trim();
  if (!userMsg) return;

  input.val('');

  pluginData.ooc_chat.push({
    role: 'user',
    content: userMsg,
    timestamp: new Date().toLocaleString('zh-CN'),
  });
  oocSession.history.push({ role: 'user', content: userMsg });

  addOOCBubble('user', userMsg);
  saveChatData();

  // 调用AI
  const ctx = getContext();
  const oocPreset = getActiveOOCPreset();

  const systemPrompt = `${oocPreset.system_prompt || '你作为角色扮演者，与用户进行OOC沟通。'}

你正在与用户进行一场温柔的、治愈系的对话。这是一个安全的空间，用户可以：
- 和你聊聊生活中的小事
- 分享今天的心情和感受
- 讨论剧情走向和角色想法
- 寻求情感支持和温暖陪伴

当前角色名: ${ctx.name2 || '角色'}
用户名: ${ctx.name1 || '用户'}
真实时间: ${new Date().toLocaleString('zh-CN')}

请用温柔、真诚、治愈的语气回应。如果用户看起来疲惫或难过，给予温暖的关怀。`;

  const messages = [
    { role: 'system', content: systemPrompt },
    ...oocSession.history,
  ];

  const aiReply = await callSubAPI(messages, 400);

  if (aiReply) {
    pluginData.ooc_chat.push({
      role: 'assistant',
      content: aiReply,
      timestamp: new Date().toLocaleString('zh-CN'),
    });
    oocSession.history.push({ role: 'assistant', content: aiReply });

    addOOCBubble('assistant', aiReply);
    saveChatData();
    renderOOCPreview();
  }
}

function addOOCBubble(role, text) {
  const isUser = role === 'user';
  const bubble = `
    <div style="display:flex;justify-content:${isUser ? 'flex-end' : 'flex-start'};margin-bottom:12px;">
      <div style="background:${isUser ? '#444' : '#8b0000'};color:#fff;padding:10px 14px;border-radius:${isUser ? '18px 18px 4px 18px' : '18px 18px 18px 4px'};max-width:80%;word-wrap:break-word;font-size:14px;">
        ${esc(text)}
      </div>
    </div>
  `;
  $('#bb-ooc-chat').append(bubble);
  $('#bb-ooc-chat').scrollTop($('#bb-ooc-chat')[0].scrollHeight);
}

function renderOOCChat() {
  $('#bb-ooc-chat').empty();
  pluginData.ooc_chat.forEach(m => {
    addOOCBubble(m.role, m.content);
  });
}

function renderOOCPreview() {
  const preview = $('#bb-ooc-preview');
  preview.empty();

  if (pluginData.ooc_chat.length === 0) {
    preview.html(`<div class="bb-empty" style="text-align:center;color:#888;">这里是跨越次元的聊天窗口，点击上方按钮，和ta聊聊剧本之外的故事吧！</div>`);
    return;
  }

  pluginData.ooc_chat.slice(-5).forEach(m => {
    const isUser = m.role === 'user';
    preview.append(`
      <div style="display:flex;justify-content:${isUser ? 'flex-end' : 'flex-start'};margin-bottom:10px;">
        <div style="background:${isUser ? '#333' : '#8b0000'};color:#fff;padding:8px 12px;border-radius:${isUser ? '12px 12px 4px 12px' : '12px 12px 12px 4px'};max-width:80%;font-size:13px;">
          ${esc(m.content)}
        </div>
      </div>
    `);
  });

  if (pluginData.ooc_chat.length > 5) {
    preview.prepend(`<div style="text-align:center;color:#888;font-size:12px;margin-bottom:12px;">...仅显示最近5条，点击打开查看全部</div>`);
  }
}

// ============================================
// 事件监听
// ============================================

function registerEventListeners() {
  eventSource.on(event_types.CHARACTER_MESSAGE_RENDERED, (msgId) => {
    if (!getSettings().enabled) return;
    injectMessageButtons(msgId);
    incrementMessageCounter();
  });

  eventSource.on(event_types.USER_MESSAGE_RENDERED, (msgId) => {
    if (!getSettings().enabled) return;
    injectMessageButtons(msgId);});

  eventSource.on(event_types.CHAT_CHANGED, () => {
    loadChatData();
    getSettings().message_counter = 0;
    saveSettings();
    updateCharInfo();
    setTimeout(() => injectButtonsToExistingMessages(), 500);
  });
}

// ============================================
// 按钮注入
// ============================================

function injectButtonsToExistingMessages() {
  const ctx = getContext();
  if (!ctx.chat) return;
  ctx.chat.forEach((_, idx) => injectMessageButtons(idx));
  console.log(`[骨与血] 已为${ctx.chat.length} 条消息注入按钮`);
}

function injectMessageButtons(messageId) {
  const mesEl = $(`.mes[mesid="${messageId}"]`);
  if (mesEl.length === 0) return;
  if (mesEl.find('.bb-msg-btns').length > 0) return;

  const btnHtml = `<span class="bb-msg-btns" style="display:inline-flex;gap:3px;margin-left:4px;font-size:15px;cursor:pointer;">
    <span class="bb-btn-star" title="🌟 收藏语录" data-mid="${messageId}">🌟</span>
    <span class="bb-btn-butterfly" title="🦋 平行宇宙" data-mid="${messageId}">🦋</span>
  </span>`;

  const targets = [
    mesEl.find('.extraMesButtons'),
    mesEl.find('.mes_buttons'),
    mesEl.find('.mes_block'),
    mesEl,
  ];

  let injected = false;
  for (const target of targets) {
    if (target.length > 0) {
      target.first().append(btnHtml);
      injected = true;
      break;
    }
  }

  if (!injected) return;

  mesEl.find('.bb-btn-star').off('click').on('click', function () {
    collectMessage($(this).data('mid'));
  });
  mesEl.find('.bb-btn-butterfly').off('click').on('click', function () {
    openBfWin($(this).data('mid'));
  });
}

// ============================================
// 收藏功能
// ============================================

function collectMessage(messageId) {
  const ctx = getContext();
  const msg = ctx.chat[messageId];
  if (!msg) { toastr.error('未找到消息'); return; }

  const exists = pluginData.records_bone.some(r => r.messageId === messageId);
  if (exists) { toastr.info('已收藏过该条语录'); return; }

  pluginData.records_bone.push({
    messageId,
    character: msg.name || (msg.is_user ? ctx.name1 : ctx.name2),
    text: msg.mes,
    timestamp: new Date().toLocaleString('zh-CN'),
    isUser: msg.is_user,
  });

  saveChatData();
  renderScrapbook();
  toastr.success(`🌟 已收藏 #${messageId}`);
  checkAchievements();
}

// ============================================
// 渲染函数
// ============================================

function renderAll() {
  renderScrapbook();
  renderDiary();
  renderIntel();
  renderParallel();
  renderFateHistory();
  renderWorldFeed();
  renderAchievements();
  renderOOCPreview();
  renderGallery();
  renderCoupleSpace();
  updateCharInfo();
  updateMarquee();
}

function updateCharInfo() {
  const ctx = getContext();
  $('#bb-home-user-name').text(ctx.name1 || '用户名');
  $('#bb-home-char-name').text(ctx.name2 || '角色名');

  const msgCount = ctx.chat ? ctx.chat.length : 0;
  $('#bb-home-msg-count').text(msgCount);
  $('#bb-home-time-count').text(msgCount * 2);

  if (pluginData.home_config.user_avatar) {
    $('#bb-home-user-avatar').html(`<img src="${pluginData.home_config.user_avatar}" style="width:100%;height:100%;object-fit:cover;" />`);
  }if (pluginData.home_config.char_avatar) {
    $('#bb-home-char-avatar').html(`<img src="${pluginData.home_config.char_avatar}" style="width:100%;height:100%;object-fit:cover;" />`);
  }

  $('#bb-home-link-emoji').text(pluginData.home_config.link_emoji || '💕');
  $('#bb-home-user-bubble').text(pluginData.home_config.user_bubble || '今天也要开心鸭~');
  $('#bb-home-char-bubble').text(pluginData.home_config.char_bubble || '嗯，一起加油！');
  $('#bb-home-radio-text').text(pluginData.home_config.radio_text || '骨与血电台');
}

function renderScrapbook() {
  const list = $('#bb-records-list');
  list.empty();

  if (pluginData.records_bone.length === 0) {
    $('#bb-scrap-empty').show();
    $('.bb-export-bar').hide();
    return;
  }

  $('#bb-scrap-empty').hide();
  $('.bb-export-bar').show();

  pluginData.records_bone.forEach((r, idx) => {
    list.append(`
      <div class="bb-record-item" style="background:#222;border:1px solid #444;border-radius:8px;padding:12px;margin-bottom:12px;">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;">
          <span style="color:#8b0000;font-weight:bold;">${esc(r.character)}</span>
          <span style="display:flex;gap:8px;align-items:center;">
            <span style="font-size:12px;color:#888;">${r.timestamp}</span>
            <span class="bb-record-del" data-idx="${idx}" style="cursor:pointer;font-size:14px;" title="删除">🗑️</span>
          </span>
        </div>
        <div style="color:#ddd;line-height:1.5;">${esc(r.text)}</div>
      </div>
    `);
  });

  list.find('.bb-record-del').on('click', function () {
    const idx = $(this).data('idx');
    if (!confirm('确认删除该语录?')) return;
    pluginData.records_bone.splice(idx, 1);
    saveChatData();
    renderScrapbook();
    toastr.info('已删除语录');
  });
}

function renderDiary() {
  const list = $('#bb-diary-list');
  list.empty();

  if (pluginData.diary_blood.length === 0) {
    $('#bb-diary-empty').show();
    return;
  }

  $('#bb-diary-empty').hide();

  pluginData.diary_blood.forEach((d, idx) => {
    list.append(`
      <div class="bb-diary-item" style="background:#222;border:1px solid #444;border-radius:8px;padding:16px;margin-bottom:12px;">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;border-bottom:1px solid #444;padding-bottom:8px;">
          <span style="color:#8b0000;font-size:15px;">📅 ${d.date}</span>
          <span class="bb-diary-del" data-idx="${idx}" style="cursor:pointer;font-size:14px;" title="删除">🗑️</span>
        </div>
        <div style="color:#ddd;line-height:1.6;white-space:pre-wrap;">${esc(d.content)}</div>
      </div>
    `);
  });

  list.find('.bb-diary-del').on('click', function () {
    const idx = $(this).data('idx');
    if (!confirm('确认删除该日记?')) return;
    pluginData.diary_blood.splice(idx, 1);
    saveChatData();
    renderDiary();
    toastr.info('已删除日记');
  });
}

function renderIntel() {
  const npcBox = $('#bb-npc-box');
  npcBox.empty();
  const npcNames = Object.keys(pluginData.npc_status);

  if (npcNames.length === 0) {
    npcBox.html('<p class="bb-empty" style="text-align:center;color:#888;padding:40px;">暂无追踪的 NPC<br/>点击上方添加</p>');
    return;
  }

  npcNames.forEach(name => {
    const info = pluginData.npc_status[name];
    npcBox.append(`
      <div class="bb-npc-card" style="background:#222;border:1px solid #444;border-radius:8px;padding:12px;margin-bottom:12px;">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;">
          <span style="color:#8b0000;font-weight:bold;font-size:15px;">🧑‍🤝‍🧑 ${esc(name)}</span>
          <span style="display:flex;gap:6px;">
            <button class="bb-sm-btn bb-npc-peek" data-name="${esc(name)}" title="窥探" style="padding:4px 8px;font-size:12px;">🔍</button>
            <button class="bb-sm-btn bb-npc-del" data-name="${esc(name)}" title="移除" style="padding:4px 8px;font-size:12px;">🗑️</button>
          </span>
        </div>
        <div style="color:#ddd;line-height:1.5;margin-bottom:6px;">${esc(info.description || '等待窥探...')}</div>
        <div style="font-size:11px;color:#666;">${info.lastUpdate || ''}</div>
      </div>
    `);
  });

  npcBox.find('.bb-npc-peek').on('click', function () {
    generateNPCStatus($(this).data('name'));
  });
  npcBox.find('.bb-npc-del').on('click', function () {
    const n = $(this).data('name');
    if (!confirm(`确认移除NPC: ${n}?`)) return;
    delete pluginData.npc_status[n];
    saveChatData();
    renderIntel();
    toastr.info(`已移除 ${n}`);
  });
}

function renderParallel() {
  const list = $('#bb-par-list');
  list.empty();

  if (pluginData.parallel_universes.length === 0) {
    $('#bb-par-empty').show();
    return;
  }

  $('#bb-par-empty').hide();

  pluginData.parallel_universes.forEach((p, idx) => {
    list.append(`
      <div class="bb-par-item" style="background:#222;border:1px solid #444;border-radius:8px;padding:12px;margin-bottom:12px;">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;">
          <span style="color:#8b0000;font-weight:bold;">🦋 #${p.floor} — ${p.date}</span>
          <span class="bb-par-del" data-idx="${idx}" style="cursor:pointer;font-size:14px;" title="删除">🗑️</span>
        </div>
        <div style="background:#1a1a1a;padding:8px;border-left:3px solid #8b0000;margin-bottom:8px;font-size:13px;color:#aaa;">
          <b>原文:</b> ${esc((p.origin || '').substring(0, 60))}...
        </div>
        <div style="color:#ddd;line-height:1.5;white-space:pre-wrap;">${esc(p.content)}</div>
      </div>
    `);
  });

  list.find('.bb-par-del').on('click', function () {
    const idx = $(this).data('idx');
    if (!confirm('确认删除该平行宇宙记录?')) return;
    pluginData.parallel_universes.splice(idx, 1);
    saveChatData();
    renderParallel();
    toastr.info('已删除平行宇宙记录');
  });
}

function renderFateHistory() {
  const list = $('#bb-fate-history-list');
  list.empty();

  if (pluginData.fate_history.length === 0) {
    list.html('<div class="bb-empty" style="text-align:center;color:#888;padding:20px;">暂无命运历史</div>');
    return;
  }

  pluginData.fate_history.slice(-5).reverse().forEach((f, idx) => {
    list.append(`
      <div style="background:#222;border:1px solid #444;border-radius:8px;padding:12px;margin-bottom:12px;">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;">
          <span style="color:#8b0000;font-size:13px;">[${f.timestamp}] #${f.floor}</span>
          <span class="bb-fate-del" data-idx="${pluginData.fate_history.length - 1 - idx}" style="cursor:pointer;font-size:14px;" title="删除">🗑️</span>
        </div>
        <div style="color:#ddd;line-height:1.5;">${esc(f.content)}</div>
      </div>
    `);
  });

  if (pluginData.fate_history.length > 5) {
    list.prepend(`<div style="text-align:center;color:#888;font-size:12px;margin-bottom:12px;">仅显示最近5条</div>`);
  }

  list.find('.bb-fate-del').on('click', function () {
    const idx = $(this).data('idx');
    pluginData.fate_history.splice(idx, 1);
    saveChatData();
    renderFateHistory();
    toastr.info('已删除命运记录');
  });
}

function renderWorldFeed() {
  const list = $('#bb-world-feed-list');
  list.empty();

  if (pluginData.world_feed.length === 0) {
    list.html('<div class="bb-empty" style="text-align:center;color:#888;padding:40px;">暂无世界频段消息</div>');
    return;
  }

  pluginData.world_feed.forEach((f, idx) => {
    const icon = f.type === 'gossip' ? '💬' : f.type === 'news' ? '📰' : '✨';
    list.append(`
      <div style="background:#222;border:1px solid #444;border-radius:8px;padding:12px;margin-bottom:12px;">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;">
          <span style="color:#8b0000;">${icon} ${f.timestamp}</span>
          <span class="bb-feed-del" data-idx="${idx}" style="cursor:pointer;font-size:14px;" title="删除">🗑️</span>
        </div>
        <div style="color:#ddd;line-height:1.5;">${esc(f.content)}</div>
      </div>
    `);
  });

  list.find('.bb-feed-del').on('click', function () {
    const idx = $(this).data('idx');
    pluginData.world_feed.splice(idx, 1);
    saveChatData();
    renderWorldFeed();
    updateMarquee();
    toastr.info('已删除消息');
  });
}

function renderAchievements() {
  const list = $('#bb-ach-list');
  list.empty();

  const allAchievements = [
    { id: 'chat_100', name: '初见倾心', desc: '聊天达到100条', icon: '💬', check: () => (getContext().chat?.length || 0) >= 100 },
    { id: 'chat_500', name: '相知相伴', desc: '聊天达到500条', icon: '💕', check: () => (getContext().chat?.length || 0) >= 500 },
    { id: 'chat_1000', name: '生死相依', desc: '聊天达到1000条', icon: '💍', check: () => (getContext().chat?.length || 0) >= 1000 },
    { id: 'scrap_10', name: '拾荒者', desc: '收藏10条语录', icon: '🌟', check: () => pluginData.records_bone.length >= 10 },
    { id: 'scrap_50', name: '收藏家', desc: '收藏50条语录', icon: '📚', check: () => pluginData.records_bone.length >= 50 },
    { id: 'scrap_100', name: '记忆宝库', desc: '收藏100条语录', icon: '💎', check: () => pluginData.records_bone.length >= 100 },
    { id: 'diary_5', name: '日记新手', desc: '生成5篇日记', icon: '📖', check: () => pluginData.diary_blood.length >= 5 },
    { id: 'diary_20', name: '日记达人', desc: '生成20篇日记', icon: '🖋️', check: () => pluginData.diary_blood.length >= 20 },
    { id: 'parallel_1', name: '破壁者', desc: '开启1次平行宇宙', icon: '🦋', check: () => pluginData.parallel_universes.length >= 1 },
    { id: 'parallel_10', name: '多元旅者', desc: '开启10次平行宇宙', icon: '🌌', check: () => pluginData.parallel_universes.length >= 10 },
    { id: 'fate_lucky', name: '幸运眷顾', desc: '命运骰子出现"幸运"关键词', icon: '🍀', check: () => pluginData.fate_history.some(f => f.content.includes('幸运')) },
    { id: 'fate_crisis', name: '劫后余生', desc: '命运骰子出现"危机"关键词', icon: '⚠️', check: () => pluginData.fate_history.some(f => f.content.includes('危机')) },
    { id: 'pet_master', name: '宠物达人', desc: '给宠物取名并喂食10次', icon: '🐾', check: () => pluginData.couple_space?.pet_name && (pluginData.couple_space?.pet_hunger || 0) > 0 },
    { id: 'love_letter', name: '情书达人', desc: '写下10张小纸条', icon: '💌', check: () => (pluginData.couple_space?.love_notes?.length || 0) >= 10 },
  ];

  let unlockedCount = 0;

  allAchievements.forEach(ach => {
    const unlocked = ach.check();
    const saved = pluginData.achievements.find(a => a.id === ach.id);

    if (unlocked) unlockedCount++;

    list.append(`
      <div style="background:${unlocked ? '#222' : '#111'};border:1px solid ${unlocked ? '#8b0000' : '#333'};border-radius:8px;padding:12px;margin-bottom:12px;opacity:${unlocked ? '1' : '0.5'};">
        <div style="display:flex;align-items:center;gap:12px;">
          <div style="font-size:32px;">${unlocked ? ach.icon : '🔒'}</div>
          <div style="flex:1;">
            <div style="color:${unlocked ? '#8b0000' : '#666'};font-weight:bold;font-size:15px;">${ach.name}</div>
            <div style="color:#888;font-size:13px;">${ach.desc}</div>
            ${saved ? `<div style="color:#666;font-size:11px;margin-top:4px;">解锁于: ${saved.date}</div>` : ''}
          </div>
        </div>
      </div>
    `);
  });

  $('#bb-ach-count').text(unlockedCount);
  $('#bb-ach-total').text(allAchievements.length);
}

//============================================
// AI 生成功能
// ============================================

async function generateDiary() {
  const ctx = getContext();
  const cn = ctx.name2 || '角色';
  toastr.info(`📖 ${cn} 正在写日记...`);

  const recent = getRecentChat(30);
  if (recent.length === 0) { toastr.warning('没有聊天记录'); return; }

  const preset = getActivePreset();
  const result = await callSubAPI([
    { role: 'system', content: `你是"${cn}"。${preset.prompts.diary}` },
    { role: 'user', content: fmt(recent) },
  ], 600);

  if (result) {
    pluginData.diary_blood.push({
      date: new Date().toLocaleString('zh-CN'),
      content: result,
      character: cn,
    });
    saveChatData();
    renderDiary();
    toastr.success(`📖 ${cn} 的日记已更新！`);
    checkAchievements();
  }
}

async function generateSummary() {
  toastr.info('📜 正在生成阿卡夏记录...');

  const recent = getRecentChat(40);
  if (recent.length === 0) { toastr.warning('没有聊天记录'); return; }

  const preset = getActivePreset();
  const result = await callSubAPI([
    { role: 'system', content: preset.prompts.summary },
    { role: 'user', content: fmt(recent) },
  ], 500);

  if (result) {
    pluginData.summaries.push({
      date: new Date().toLocaleString('zh-CN'),
      content: result,
    });
    saveChatData();
    toastr.success('📜 阿卡夏记录已更新！');
  }
}

async function generateWeather() {
  toastr.info('☁️ 正在扫描环境...');

  const recent = getRecentChat(20);
  if (recent.length === 0) { toastr.warning('没有聊天记录'); return; }

  const preset = getActivePreset();
  const result = await callSubAPI([
    { role: 'system', content: preset.prompts.weather },
    { role: 'user', content: fmt(recent) },
  ], 300);

  if (result) {
    pluginData.weather = result;
    saveChatData();
    $('#bb-weather-box').html(esc(result));
    toastr.success('☁️ 环境雷达已更新！');
  }
}

async function generateVibe() {
  toastr.info('❤️ 正在分析氛围...');

  const recent = getRecentChat(20);
  if (recent.length === 0) { toastr.warning('没有聊天记录'); return; }

  const preset = getActivePreset();
  const result = await callSubAPI([
    { role: 'system', content: preset.prompts.vibe },
    { role: 'user', content: fmt(recent) },
  ], 300);

  if (result) {
    pluginData.vibe = result;
    saveChatData();
    $('#bb-vibe-box').html(esc(result));
    toastr.success('❤️ 氛围心电图已更新！');
  }
}

async function generateNPCStatus(name) {
  toastr.info(`🔍 正在窥探 ${name}...`);

  const recent = getRecentChat(30);
  const preset = getActivePreset();
  const result = await callSubAPI([
    { role: 'system', content: `${preset.prompts.npc}\nNPC名称: ${name}` },
    { role: 'user', content: fmt(recent) },
  ], 400);

  if (result) {
    pluginData.npc_status[name] = {
      description: result,
      lastUpdate: new Date().toLocaleString('zh-CN'),
    };
    saveChatData();
    renderIntel();
    toastr.success(`🔍 ${name} 的情报已更新！`);
  }
}

async function autoNPCPeek() {
  toastr.info('🎲 分析剧情中的NPC...');

  const recent = getRecentChat(40);
  if (recent.length === 0) { toastr.warning('没有聊天记录'); return; }

  const ctx = getContext();
  const result = await callSubAPI([
    { role: 'system', content: `分析以下对话，提取出1-2个出现过的NPC名字（不包括用户"${ctx.name1}"和主角"${ctx.name2}"）。只返回名字，用逗号分隔，不要其他内容。如果没有NPC，返回"无"。` },
    { role: 'user', content: fmt(recent) },
  ], 100);

  if (!result || result === '无') {
    toastr.warning('未检测到NPC');
    return;
  }

  const names = result.split(/[,，、]/).map(n => n.trim()).filter(Boolean).slice(0, 2);

  for (const name of names) {
    if (!pluginData.npc_status[name]) {
      pluginData.npc_status[name] = { description: '等待窥探...', lastUpdate: '' };
    }
    await generateNPCStatus(name);
  }

  saveChatData();
  renderIntel();
}

async function roll
async function rollFate() {
  toastr.info('🎲 命运之轮转动中...');

  const ctx = getContext();
  const cn = ctx.name2|| '角色';
  const recent = getRecentChat(15);

  const preset = getActivePreset();
  const result = await callSubAPI([
    { role: 'system', content: `${preset.prompts.fate}\n角色名：${cn}` },
    { role: 'user', content: recent.length > 0 ? fmt(recent) : '（新的冒险刚刚开始）' },
  ], 300);

  if (result) {
    pluginData.chaos_event = result;

    const floor = ctx.chat ? ctx.chat.length : 0;
    pluginData.fate_history.push({
      content: result,
      floor: floor,
      timestamp: new Date().toLocaleString('zh-CN'),
    });

    $('#bb-fate-result').html(`
      <div style="font-size:18px;margin-bottom:16px;">🎲</div>
      <div style="color:#ddd;line-height:1.6;margin-bottom:16px;">${esc(result)}</div>
      <div style="font-size:12px;color:#888;border-top:1px solid #444;padding-top:12px;margin-top:12px;">
        使用宏<code style="background:#000;padding:2px 6px;border-radius:3px;">{{bb_chaos_event}}</code> 插入到对话中<br/>
        （宏读取后会自动清空，只能使用一次）
      </div>
    `);

    saveChatData();
    renderFateHistory();
    toastr.success('🎲 命运已降临！');
    checkAchievements();
  }
}

async function generateWorldFeed() {
  toastr.info('📻 生成世界频段消息中...');

  const recent = getRecentChat(25);
  const preset = getActivePreset();

  const result = await callSubAPI([
    { role: 'system', content: `${preset.prompts.world}\n当前场景背景请根据对话推断。` },
    { role: 'user', content: recent.length > 0 ? fmt(recent) : '（新的世界刚刚展开）' },
  ], 300);

  if (result) {
    const messages = result.split('\n').filter(line => line.trim());

    messages.forEach(msg => {
      const type = msg.includes('八卦') || msg.includes('传闻') ? 'gossip': msg.includes('新闻') || msg.includes('突发') ? 'news'
                 : 'lore';

      pluginData.world_feed.push({
        type,
        content: msg.replace(/^[🌍📰💬✨\-\*\d\.]+\s*/, ''),
        timestamp: new Date().toLocaleString('zh-CN'),
      });
    });

    saveChatData();
    renderWorldFeed();
    updateMarquee();
    toastr.success(`📻 已生成 ${messages.length} 条消息`);
  }
}

//============================================
// 世界频段跑马灯
// ============================================

function startWorldFeed() {
  updateMarquee();
  setInterval(() => {
    updateMarquee();
  }, 30000);
}

function updateMarquee() {
  const marquee = $('#bb-marquee');
  if (pluginData.world_feed.length === 0) {
    marquee.text('🌍 世界频段广播中...暂无消息');
    return;
  }

  const samples = pluginData.world_feed
    .slice(-10)
    .sort(() => Math.random() - 0.5)
    .slice(0, 3);

  const text = samples.map(f => {
    const icon = f.type === 'gossip' ? '💬' : f.type === 'news' ? '📰' : '✨';
    return `${icon} ${f.content}`;
  }).join('|   ');

  marquee.text(text || '🌍 世界频段广播中...');
}

// ============================================
// 成就系统
// ============================================

function checkAchievements() {
  const allAchievements = [
    { id: 'chat_100', name: '初见倾心', desc: '聊天达到100条', icon: '💬', check: () => (getContext().chat?.length || 0) >= 100 },
    { id: 'chat_500', name: '相知相伴', desc: '聊天达到500条', icon: '💕', check: () => (getContext().chat?.length || 0) >= 500 },
    { id: 'chat_1000', name: '生死相依', desc: '聊天达到1000条', icon: '💍', check: () => (getContext().chat?.length || 0) >= 1000 },
    { id: 'scrap_10', name: '拾荒者', desc: '收藏10条语录', icon: '🌟', check: () => pluginData.records_bone.length >= 10 },
    { id: 'scrap_50', name: '收藏家', desc: '收藏50条语录', icon: '📚', check: () => pluginData.records_bone.length >= 50 },
    { id: 'scrap_100', name: '记忆宝库', desc: '收藏100条语录', icon: '💎', check: () => pluginData.records_bone.length >= 100 },
    { id: 'diary_5', name: '日记新手', desc: '生成5篇日记', icon: '📖', check: () => pluginData.diary_blood.length >= 5 },
    { id: 'diary_20', name: '日记达人', desc: '生成20篇日记', icon: '🖋️', check: () => pluginData.diary_blood.length >= 20 },
    { id: 'parallel_1', name: '破壁者', desc: '开启1次平行宇宙', icon: '🦋', check: () => pluginData.parallel_universes.length >= 1 },
    { id: 'parallel_10', name: '多元旅者', desc: '开启10次平行宇宙', icon: '🌌', check: () => pluginData.parallel_universes.length >= 10 },
    { id: 'fate_lucky', name: '幸运眷顾', desc: '命运骰子出现"幸运"关键词', icon: '🍀', check: () => pluginData.fate_history.some(f => f.content.includes('幸运')) },
    { id: 'fate_crisis', name: '劫后余生', desc: '命运骰子出现"危机"关键词', icon: '⚠️', check: () => pluginData.fate_history.some(f => f.content.includes('危机')) },
    { id: 'pet_master', name: '宠物达人', desc: '给宠物取名并喂食', icon: '🐾', check: () => !!(pluginData.couple_space?.pet_name) },
    { id: 'love_letter', name: '情书达人', desc: '写下10张小纸条', icon: '💌', check: () => (pluginData.couple_space?.love_notes?.length || 0) >= 10 },
  ];

  allAchievements.forEach(ach => {
    if (ach.check()) {
      const alreadyUnlocked = pluginData.achievements.some(a => a.id === ach.id);
      if (!alreadyUnlocked) {
        unlockAchievement(ach);
      }
    }
  });

  renderAchievements();
}

function unlockAchievement(ach) {
  pluginData.achievements.push({
    id: ach.id,
    unlocked: true,
    date: new Date().toLocaleString('zh-CN'),
  });
  saveChatData();

  showAchievementPopup(ach);

  toastr.success(`🏆 解锁成就：${ach.name}`, '', { timeOut: 5000 });
}

function showAchievementPopup(ach) {
  const popup = $(`
    <div class="bb-achievement-popup" style="position:fixed;top:50%;left:50%;transform:translate(-50%,-50%) scale(0);width:400px;background:#000;border:3px solid #8b0000;border-radius:12px;padding:24px;z-index:99999;text-align:center;box-shadow:0 8px 32px rgba(0,0,0,0.9);transition:transform 0.3s ease;">
      <div style="font-size:64px;margin-bottom:16px;">${ach.icon}</div>
      <div style="color:#8b0000;font-size:24px;font-weight:bold;margin-bottom:8px;">🏆 成就解锁</div>
      <div style="color:#fff;font-size:20px;margin-bottom:8px;">${ach.name}</div>
      <div style="color:#888;font-size:14px;">${ach.desc}</div></div>
  `);

  $('body').append(popup);

  setTimeout(() => {
    popup.css('transform', 'translate(-50%,-50%) scale(1)');
  }, 50);

  setTimeout(() => {
    popup.css('transform', 'translate(-50%,-50%) scale(0)');
    setTimeout(() => popup.remove(), 300);
  }, 3000);
}

// ============================================
// 消息计数& 自动触发
// ============================================

function incrementMessageCounter() {
  const s = getSettings();
  s.message_counter = (s.message_counter || 0) + 1;
  saveSettings();

  if (s.auto_diary_enabled && s.message_counter >= s.diary_trigger_count) {
    s.message_counter = 0;
    saveSettings();
    autoGenerate();
  }

  checkAchievements();
}

async function autoGenerate() {
  console.log('[骨与血]🔄 触发自动生成...');
  toastr.info('🔄 自动生成日记和总结中...');
  await generateDiary();
  await generateSummary();
}

// ============================================
// 宏注册（新API）
// ============================================

function registerAllMacros() {
  try {
    if (typeof MacrosParser !== 'undefined' && MacrosParser.registerMacro) {
      registerMacroNew('bb_diary', () => {
        if (pluginData.diary_blood.length === 0) return '(暂无日记)';
        return pluginData.diary_blood[pluginData.diary_blood.length - 1].content;
      });

      registerMacroNew('bb_summary', () => {
        if (pluginData.summaries.length === 0) return '(暂无总结)';
        return pluginData.summaries[pluginData.summaries.length - 1].content;
      });

      registerMacroNew('bb_weather', () => {
        return pluginData.weather || '(环境未知)';
      });

      registerMacroNew('bb_chaos_event', () => {
        const evt = pluginData.chaos_event;
        if (!evt) return '(无事件)';
        pluginData.chaos_event = '';
        saveChatData();
        return evt;
      });

      registerMacroNew('bb_vibe', () => {
        return pluginData.vibe || '(氛围未知)';
      });

      registerMacroNew('bb_npc_status', () => {
        const names = Object.keys(pluginData.npc_status);
        if (names.length === 0) return '(无NPC追踪)';
        return names.map(n => `【${n}】${pluginData.npc_status[n].description || '未知'}`).join('\n');
      });

      console.log('[骨与血] 📝 6个宏已注册（新API）');
    } else {
      console.warn('[骨与血] 未找到新版宏系统，宏功能可能不可用');
    }
  } catch (e) {
    console.error('[骨与血] 宏注册失败:', e);
  }
}

function registerMacroNew(key, fn) {
  try {
    if (typeof MacrosParser !== 'undefined') {
      MacrosParser.registerMacro(key, fn);
    }
  } catch (e) {
    console.warn(`[骨与血] 宏 ${key} 注册失败:`, e);
  }
}

// ============================================
// 数据持久化 (localStorage)
// ============================================

function getChatDataKey() {
  const ctx = getContext();
  return ctx.chatId ? `bb_data_${ctx.chatId}` : null;
}

function saveChatData() {
  const key = getChatDataKey();
  if (!key) return;
  try {
    localStorage.setItem(key, JSON.stringify(pluginData));
  } catch (e) {
    console.error('[骨与血] 保存数据失败:', e);
  }
}

function loadChatData() {
  resetPluginData();
  const key = getChatDataKey();
  if (!key) return;
  try {
    const raw = localStorage.getItem(key);
    if (raw) {
      const saved = JSON.parse(raw);
      pluginData = Object.assign({}, pluginData, saved);
      // 确保新字段存在
      if (!pluginData.gallery_images) pluginData.gallery_images = [];
      if (!pluginData.couple_space) {
        pluginData.couple_space = {
          pet_name: '', pet_type: '🐱', pet_mood: 100, pet_hunger: 100,
          anniversary: '', love_notes: [], gifts: [], mood_diary: [],
        };
      }
      if (!pluginData.couple_space.love_notes) pluginData.couple_space.love_notes = [];
      if (!pluginData.couple_space.mood_diary) pluginData.couple_space.mood_diary = [];
      console.log(`[骨与血] 📂 已加载数据: ${key}`);
    }
  } catch (e) {
    console.error('[骨与血] 加载数据失败:', e);
  }

  // 重新加载OOC历史到session
  if (pluginData.ooc_chat && pluginData.ooc_chat.length > 0) {
    oocSession.history = pluginData.ooc_chat.map(m => ({
      role: m.role,
      content: m.content,
    }));
  }

  renderAll();
}

function resetPluginData() {
  pluginData = {
    records_bone: [],
    diary_blood: [],
    summaries: [],
    weather: '',
    npc_status: {},
    chaos_event: '',
    vibe: '',
    parallel_universes: [],

    home_config: {
      user_avatar: '',
      char_avatar: '',
      link_emoji: '💕',
      user_bubble: '今天也要开心鸭~',
      char_bubble: '嗯，一起加油！',
      radio_text: '骨与血电台',
    },

    fate_history: [],
    world_feed: [],
    achievements: [],
    ooc_chat: [],

    gallery_images: [],

    couple_space: {
      pet_name: '',
      pet_type: '🐱',
      pet_mood: 100,
      pet_hunger: 100,
      anniversary: '',
      love_notes: [],
      gifts: [],
      mood_diary: [],
    },
  };

  oocSession = {
    active: false,
    history: [],
  };
}

// ============================================
// 导出功能
// ============================================

function exportAsMarkdown() {
  const ctx = getContext();
  const cn = ctx.name2 || '角色';
  const un = ctx.name1 || '用户';
  let md = `# 🦴骨与血 — ${cn} & ${un}\n\n> 导出时间: ${new Date().toLocaleString('zh-CN')}\n\n`;

  if (pluginData.records_bone.length > 0) {
    md += `## 🌟 唱片机（语录收藏）\n\n`;
    pluginData.records_bone.forEach(r => {
      md += `**${r.character}** (${r.timestamp}):\n> ${r.text}\n\n`;
    });
  }

  if (pluginData.diary_blood.length > 0) {
    md += `## 📖 日记本\n\n`;
    pluginData.diary_blood.forEach(d => {
      md += `### ${d.date}\n${d.content}\n\n`;
    });
  }

  if (pluginData.summaries.length > 0) {
    md += `## 📜阿卡夏记录\n\n`;
    pluginData.summaries.forEach(s => {
      md += `### ${s.date}\n${s.content}\n\n`;
    });
  }

  if (pluginData.weather) md += `## ☁️ 环境\n${pluginData.weather}\n\n`;
  if (pluginData.vibe) md += `## ❤️ 氛围\n${pluginData.vibe}\n\n`;

  const npcNames = Object.keys(pluginData.npc_status);
  if (npcNames.length > 0) {
    md += `## 🗺️ NPC 动态\n\n`;
    npcNames.forEach(n => {
      md += `### ${n}\n${pluginData.npc_status[n].description || '未知'}\n*更新时间: ${pluginData.npc_status[n].lastUpdate}*\n\n`;
    });
  }

  if (pluginData.parallel_universes.length > 0) {
    md += `##🦋 平行宇宙\n\n`;
    pluginData.parallel_universes.forEach(p => {
      md += `### #${p.floor} — ${p.date}\n> **原文:** ${p.origin}\n\n${p.content}\n\n`;
    });
  }

  if (pluginData.fate_history.length > 0) {
    md += `## 🎲 命运之轮\n\n`;
    pluginData.fate_history.forEach(f => {
      md += `**[#${f.floor} ${f.timestamp}]** ${f.content}\n\n`;
    });
  }

  if (pluginData.world_feed.length > 0) {
    md += `## 📻 世界频段\n\n`;
    pluginData.world_feed.forEach(f => {
      const icon = f.type === 'gossip' ? '💬' : f.type === 'news' ? '📰' : '✨';
      md += `${icon} **[${f.timestamp}]** ${f.content}\n\n`;
    });
  }

  if (pluginData.achievements.length > 0) {
    md += `## 🏆 成就殿堂\n\n`;
    pluginData.achievements.forEach(a => {
      md += `- ${a.id} (${a.date})\n`;});
  }

  // v6.0 情侣空间导出
  if (pluginData.couple_space) {
    const cs = pluginData.couple_space;
    md += `## 💑 情侣空间\n\n`;
    if (cs.pet_name) md += `🐾 宠物: ${cs.pet_type} ${cs.pet_name}\n\n`;
    if (cs.anniversary) md += `💍 纪念日: ${cs.anniversary}\n\n`;
    if (cs.love_notes && cs.love_notes.length > 0) {
      md += `### 💌 小纸条\n\n`;
      cs.love_notes.forEach(n => {
        md += `- [${n.timestamp}] ${n.content}\n`;
      });
      md += '\n';
    }
    if (cs.mood_diary && cs.mood_diary.length > 0) {
      md += `### 📊 心情记录\n\n`;
      cs.mood_diary.forEach(m => {
        md += `- ${m.mood} ${m.timestamp}\n`;
      });
      md += '\n';
    }
  }

  md += `\n---\n*© 2026SHADOW<安息之影>*\n`;

  dl(`bone_blood_${cn}_${Date.now()}.md`, md,'text/markdown');
  toastr.success('📄Markdown 已导出！');
}

function exportAsJSON() {
  const ctx = getContext();
  const cn = ctx.name2 || '角色';
  const data = {
    exportTime: new Date().toISOString(),
    character: cn,
    user: ctx.name1,
    chatId: ctx.chatId,
    pluginData: pluginData,
  };
  dl(`bone_blood_${cn}_${Date.now()}.json`, JSON.stringify(data, null, 2), 'application/json');
  toastr.success('📦 JSON 已导出！');
}

// ============================================
// 工具函数
// ============================================

function dl(filename, content, type) {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

functionesc(text) {
  if (!text) return '';
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

function getRecentChat(count = 20) {
  const ctx = getContext();
  if (!ctx.chat || ctx.chat.length === 0) return [];
  return ctx.chat.slice(-count);
}

function fmt(messages) {
  const ctx = getContext();
  return messages.map(m => {
    const speaker = m.is_user ? (ctx.name1 || '用户') : (m.name || ctx.name2 || '角色');
    return `${speaker}: ${m.mes}`;
  }).join('\n\n');
}

// ============================================
// CSS 动画（跑马灯）
// ============================================

if ($('#bb-marquee-style').length === 0) {
  $('head').append(`
    <style id="bb-marquee-style">
      @keyframes bb-scroll {
        0% { transform: translateX(100%); }
        100% { transform: translateX(-100%); }
      }

      .bb-tab {
        padding: 12px 16px;
        cursor: pointer;
        border-bottom: 2px solid transparent;
        white-space: nowrap;
        color: #aaa;
        transition: all 0.2s;user-select: none;
      }

      .bb-tab:hover {
        background: #333;
        color: #fff;
      }

      .bb-tab.active {
        background: #1a1a1a;
        color: #8b0000;
        border-bottom-color: #8b0000;
      }

      .bb-sm-btn {
        padding: 6px 12px;
        background: #444;
        color: #fff;
        border: 1px solid #666;
        border-radius: 4px;
        cursor: pointer;
        font-size: 13px;
        transition: all 0.2s;
      }

      .bb-sm-btn:hover {
        background: #8b0000;
        border-color: #8b0000;
      }

      .bb-big-btn {
        padding: 12px 24px;
        background: #8b0000;
        color: #fff;
        border: none;
        border-radius: 8px;
        cursor: pointer;
        font-size: 16px;
        font-weight: bold;
        transition: all 0.2s;
      }

      .bb-big-btn:hover {
        background: #a00000;
        transform: scale(1.05);
      }

      .bb-empty {
        text-align: center;
        color: #666;
        padding: 40px 20px;
        font-size: 14px;
      }

      /*滚动条美化 */
      .bb-content::-webkit-scrollbar,
      #bb-bf-chat::-webkit-scrollbar,
      #bb-ooc-chat::-webkit-scrollbar {
        width: 8px;
      }

      .bb-content::-webkit-scrollbar-track,
      #bb-bf-chat::-webkit-scrollbar-track,
      #bb-ooc-chat::-webkit-scrollbar-track {
        background: #111;
      }

      .bb-content::-webkit-scrollbar-thumb,
      #bb-bf-chat::-webkit-scrollbar-thumb,
      #bb-ooc-chat::-webkit-scrollbar-thumb {
        background: #8b0000;
        border-radius: 4px;
      }

      .bb-content::-webkit-scrollbar-thumb:hover,
      #bb-bf-chat::-webkit-scrollbar-thumb:hover,
      #bb-ooc-chat::-webkit-scrollbar-thumb:hover {
        background: #a00000;
      }
    </style>
  `);
}

console.log('[骨与血]🦴 index.js v6.0 完整加载');









