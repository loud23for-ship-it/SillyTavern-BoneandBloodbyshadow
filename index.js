// ============================================
// 🦴 骨与血 (Bone & Blood) - SillyTavern 插件
// ============================================

import { extension_settings, getContext, renderExtensionTemplateAsync } from '../../../extensions.js';
import { saveSettingsDebounced } from '../../../../script.js';
import { eventSource, event_types } from '../../../../script.js';

const EXTENSION_NAME = 'third-party/bone-and-blood';
const EXTENSION_FOLDER = 'third-party/bone-and-blood';

// ---- 默认设置 ----
const defaultSettings = {
  enabled: true,
  api_endpoint: '',
  api_key: '',
  api_model: 'gpt-4o-mini',
  auto_diary_enabled: true,
  diary_trigger_count: 30,
  message_counter: 0,
};

// ---- 运行时数据 ----
let pluginData = {
  records_bone: [],
  diary_blood: [],
  summaries: [],
  weather: '',
  npc_status: {},
  chaos_event: '',
  vibe: '',
  parallel_universes: [],
};

// ============================================
// 入口
// ============================================

jQuery(async () => {
  console.log('[骨与血] 🦴 开始加载...');

  // 1. 初始化设置
  if (!extension_settings[EXTENSION_NAME]) {
    extension_settings[EXTENSION_NAME] = {};
  }
  Object.assign(extension_settings[EXTENSION_NAME], {
    ...defaultSettings,
    ...extension_settings[EXTENSION_NAME],
  });

  // 2. 加载扩展设置面板 HTML
  const settingsHtml = await renderExtensionTemplateAsync(EXTENSION_FOLDER, 'settings');
  $('#extensions_settings').append(settingsHtml);

  // 3. 把保存的设置填入表单
  loadSettingsToForm();

  // 4. 绑定扩展面板事件
  bindExtensionPanelEvents();

  // 5. 注入悬浮按钮 + 主面板
  injectFloatingUI();

  // 6. 注册酒馆事件监听
  registerEventListeners();

  // 7. 注册宏
  registerAllMacros();

  // 8. 加载当前聊天的数据
  loadChatData();

  console.log('[骨与血] ✅ 加载完成！');
});

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
  $('#bb-api-endpoint').val(s.api_endpoint);
  $('#bb-api-key').val(s.api_key);
  $('#bb-api-model').val(s.api_model);
  $('#bb-diary-trigger').val(s.diary_trigger_count);
  $('#bb-auto-diary').prop('checked', s.auto_diary_enabled);
}

function bindExtensionPanelEvents() {
  $('#bb-enabled').on('change', function () {
    getSettings().enabled = $(this).is(':checked');
    saveSettings();
  });
  $('#bb-api-endpoint').on('input', function () {
    getSettings().api_endpoint = $(this).val();
    saveSettings();
  });
  $('#bb-api-key').on('input', function () {
    getSettings().api_key = $(this).val();
    saveSettings();
  });
  $('#bb-api-model').on('input', function () {
    getSettings().api_model = $(this).val();
    saveSettings();
  });
  $('#bb-diary-trigger').on('input', function () {
    getSettings().diary_trigger_count = parseInt($(this).val()) || 30;
    saveSettings();
  });
  $('#bb-auto-diary').on('change', function () {
    getSettings().auto_diary_enabled = $(this).is(':checked');
    saveSettings();
  });

  $('#bb-btn-diary').on('click', () => generateDiary());
  $('#bb-btn-summary').on('click', () => generateSummary());
  $('#bb-btn-weather').on('click', () => generateWeather());
}

// ============================================
// 悬浮 UI 注入
// ============================================

function injectFloatingUI() {
  // ---- 悬浮按钮 ----
  const floatBtn = $(`<div id="bb-float-button" title="骨与血 Bone & Blood">🦴</div>`);
  $('body').append(floatBtn);

  // ---- 主面板 ----
  const panel = $(`
    <div id="bb-panel" class="bb-panel-hidden">

      <!-- 头部 -->
      <div class="bb-panel-header">
        <span class="bb-panel-title">🦴 骨与血</span>
        <button class="bb-panel-close">✕</button>
      </div>

      <!-- 内容区 -->
      <div class="bb-panel-content">

        <!-- 🌟 唱片机 -->
        <div class="bb-tab-content" id="bb-tab-scrapbook">
          <h3>🌟 唱片机 — 语录收藏</h3>
          <div class="bb-export-bar" style="display:none;">
            <button class="bb-export-btn" id="bb-export-md">📄 导出 Markdown</button>
            <button class="bb-export-btn" id="bb-export-json">📦 导出 JSON</button>
          </div>
          <p class="bb-empty-hint" id="bb-scrap-empty">还没有收藏任何语录~<br/>点击消息旁的 🌟 收藏吧</p>
          <div class="bb-records-list"></div>
        </div>

        <!-- 📖 日记本 -->
        <div class="bb-tab-content bb-hidden" id="bb-tab-diary">
          <h3>📖 日记本</h3>
          <p class="bb-empty-hint" id="bb-diary-empty">角色还没有写日记...<br/>在扩展设置中点击"立即生成日记"试试</p>
          <div class="bb-diary-list"></div>
        </div>

        <!-- 📻 情报站 -->
        <div class="bb-tab-content bb-hidden" id="bb-tab-intel">
          <h3>📻 情报站</h3>
          <div class="bb-intel-section">
            <h4>📜 阿卡夏记录</h4>
            <div class="bb-summary-content">暂无总结</div>
          </div>
          <div class="bb-intel-section">
            <h4>☁️ 环境雷达</h4>
            <div class="bb-weather-content">未检测</div>
          </div>
          <div class="bb-intel-section">
            <h4>❤️ 氛围心电图</h4>
            <div class="bb-vibe-content">未检测</div>
          </div>
          <div class="bb-intel-section">
            <h4>🗺️ NPC 动态</h4>
            <div class="bb-npc-list">暂无NPC追踪</div>
          </div>
        </div>

        <!-- 🦋 观测站 -->
        <div class="bb-tab-content bb-hidden" id="bb-tab-parallel">
          <h3>🦋 观测站 — 平行宇宙</h3>
          <p class="bb-empty-hint" id="bb-parallel-empty">点击消息旁的 🦋 按钮生成平行宇宙</p>
          <div class="bb-parallel-list"></div>
        </div>

        <!-- 🃏 命运盘 -->
        <div class="bb-tab-content bb-hidden" id="bb-tab-fate">
          <h3>🃏 命运盘</h3>
          <p style="color:var(--bb-text-muted);font-size:13px;margin-bottom:12px;">点击骰子生成突发事件，下一次发送时将通过 {{bb_chaos_event}} 宏注入预设</p>
          <button id="bb-roll-fate" class="bb-big-button">🎲 摇骰子！</button>
          <div class="bb-fate-result"></div>
        </div>

      </div>

      <!-- 底部导航 -->
      <div class="bb-panel-nav">
        <button class="bb-nav-btn bb-nav-active" data-tab="scrapbook" title="唱片机">🌟</button>
        <button class="bb-nav-btn" data-tab="diary" title="日记本">📖</button>
        <button class="bb-nav-btn" data-tab="intel" title="情报站">📻</button>
        <button class="bb-nav-btn" data-tab="parallel" title="观测站">🦋</button>
        <button class="bb-nav-btn" data-tab="fate" title="命运盘">🃏</button>
      </div>

    </div>
  `);
  $('body').append(panel);

  // ---- 绑定面板事件 ----
  $('#bb-float-button').on('click', () => {
    $('#bb-panel').toggleClass('bb-panel-hidden');
  });
  $('.bb-panel-close').on('click', () => {
    $('#bb-panel').addClass('bb-panel-hidden');
  });

  // 导航切换
  $('.bb-nav-btn').on('click', function () {
    const tab = $(this).data('tab');
    $('.bb-nav-btn').removeClass('bb-nav-active');
    $(this).addClass('bb-nav-active');
    $('.bb-tab-content').addClass('bb-hidden');
    $(`#bb-tab-${tab}`).removeClass('bb-hidden');
  });

  // 命运骰子
  $('#bb-roll-fate').on('click', () => rollFate());

  // 导出
  $('#bb-export-md').on('click', () => exportAsMarkdown());
  $('#bb-export-json').on('click', () => exportAsJSON());
}

// ============================================
// 酒馆事件监听
// ============================================

function registerEventListeners() {
  eventSource.on(event_types.CHARACTER_MESSAGE_RENDERED, (messageId) => {
    if (!getSettings().enabled) return;
    injectMessageButtons(messageId);
    incrementMessageCounter();
  });

  eventSource.on(event_types.USER_MESSAGE_RENDERED, (messageId) => {
    if (!getSettings().enabled) return;
    injectMessageButtons(messageId);
  });

  eventSource.on(event_types.CHAT_CHANGED, () => {
    loadChatData();
    getSettings().message_counter = 0;
    saveSettings();
  });
}

// 在消息气泡旁注入按钮
function injectMessageButtons(messageId) {
  const msg = $(`.mes[mesid="${messageId}"]`);
  if (msg.length === 0 || msg.find('.bb-msg-buttons').length > 0) return;

  const btns = $(`
    <div class="bb-msg-buttons">
      <button class="bb-msg-btn bb-collect-btn" title="收藏这句话">🌟</button>
      <button class="bb-msg-btn bb-butterfly-btn" title="平行宇宙">🦋</button>
    </div>
  `);

  msg.find('.mes_buttons').prepend(btns);

  btns.find('.bb-collect-btn').on('click', () => collectMessage(messageId));
  btns.find('.bb-butterfly-btn').on('click', () => generateParallelUniverse(messageId));
}

// ============================================
// 🌟 收藏功能
// ============================================

function collectMessage(messageId) {
  const context = getContext();
  const chat = context.chat;
  const message = chat[messageId];
  if (!message) return;

  if (pluginData.records_bone.some(r => r.floor === messageId)) {
    toastr.info('这条消息已经收藏过了');
    return;
  }

  const prevMsg = messageId > 0 ? chat[messageId - 1] : null;

  pluginData.records_bone.push({
    id: `rec-${Date.now()}`,
    who: message.name,
    text: message.mes,
    context: prevMsg ? prevMsg.mes : '',
    floor: messageId,
    date: new Date().toLocaleString('zh-CN'),
    is_user: message.is_user,
  });

  saveChatData();
  renderScrapbook();

  const btn = $(`.mes[mesid="${messageId}"] .bb-collect-btn`);
  btn.text('✅').addClass('bb-collected');
  setTimeout(() => btn.text('🌟'), 1500);

  toastr.success('已收藏到唱片机 🌟');
}

// ============================================
// 渲染函数
// ============================================

function renderScrapbook() {
  const container = $('#bb-tab-scrapbook .bb-records-list');
  container.empty();

  if (pluginData.records_bone.length === 0) {
    $('#bb-scrap-empty').show();
    $('#bb-tab-scrapbook .bb-export-bar').hide();
    return;
  }

  $('#bb-scrap-empty').hide();
  $('#bb-tab-scrapbook .bb-export-bar').show();

  [...pluginData.records_bone].reverse().forEach((record) => {
    const card = $(`
      <div class="bb-record-card" data-record-id="${record.id}">
        <div class="bb-card-who">${escapeHtml(record.who)}</div>
        <div class="bb-card-text">${escapeHtml(record.text)}</div>
        ${record.context ? `<div class="bb-card-context">↩ ${escapeHtml(record.context.substring(0, 120))}</div>` : ''}
        <div class="bb-card-meta">
          <span>#${record.floor} · ${record.date}</span>
          <button class="bb-card-delete" data-id="${record.id}">🗑️</button>
        </div>
      </div>
    `);
    container.append(card);
  });

  container.find('.bb-card-delete').on('click', function () {
    const id = $(this).data('id');
    pluginData.records_bone = pluginData.records_bone.filter(r => r.id !== id);
    saveChatData();
    renderScrapbook();
    toastr.info('已删除');
  });
}

function renderDiary() {
  const container = $('#bb-tab-diary .bb-diary-list');
  container.empty();

  if (pluginData.diary_blood.length === 0) {
    $('#bb-diary-empty').show();
    return;
  }

  $('#bb-diary-empty').hide();

  [...pluginData.diary_blood].reverse().forEach((entry) => {
    container.append(`
      <div class="bb-diary-entry">
        <div class="bb-diary-date">📅 ${entry.date}</div>
        <div class="bb-diary-text">${escapeHtml(entry.content)}</div>
      </div>
    `);
  });
}

function renderIntel() {
  const lastSummary = pluginData.summaries.length > 0
    ? pluginData.summaries[pluginData.summaries.length - 1].content
    : '暂无总结';
  $('.bb-summary-content').text(lastSummary);
  $('.bb-weather-content').text(pluginData.weather || '未检测');
  $('.bb-vibe-content').text(pluginData.vibe || '未检测');

  const npcContainer = $('.bb-npc-list');
  npcContainer.empty();
  const npcEntries = Object.entries(pluginData.npc_status);
  if (npcEntries.length === 0) {
    npcContainer.text('暂无NPC追踪');
  } else {
    npcEntries.forEach(([name, status]) => {
      npcContainer.append(`<div><strong>${escapeHtml(name)}</strong>: ${escapeHtml(status)}</div>`);
    });
  }
}

function renderParallel() {
  const container = $('#bb-tab-parallel .bb-parallel-list');
  container.empty();

  const list = pluginData.parallel_universes || [];
  if (list.length === 0) {
    $('#bb-parallel-empty').show();
    return;
  }

  $('#bb-parallel-empty').hide();

  [...list].reverse().forEach((p) => {
    container.append(`
      <div class="bb-parallel-card">
        <div class="bb-parallel-origin">📍 原文: "${escapeHtml(p.origin)}..."</div>
        <div class="bb-parallel-text">🦋 ${escapeHtml(p.content)}</div>
      </div>
    `);
  });
}

function renderAll() {
  renderScrapbook();
  renderDiary();
  renderIntel();
  renderParallel();
}

// ============================================
// 副 API 调用
// ============================================

async function callSubAPI(messages) {
  const s = getSettings();
  if (!s.api_endpoint || !s.api_key) {
    toastr.warning('请先在扩展设置中配置副 API');
    return null;
  }

  try {
    const response = await fetch(s.api_endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${s.api_key}`,
      },
      body: JSON.stringify({
        model: s.api_model,
        messages: messages,
        max_tokens: 500,
        temperature: 0.8,
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`${response.status}: ${errText.substring(0, 200)}`);
    }

    const data = await response.json();
    return data.choices?.[0]?.message?.content || null;
  } catch (error) {
    console.error('[骨与血] API 调用失败:', error);
    toastr.error(`副API调用失败: ${error.message}`);
    return null;
  }
}

function getRecentChat(count = 30) {
  const context = getContext();
  const chat = context.chat;
  if (!chat || chat.length === 0) return [];
  return chat.slice(-count).map(msg => ({
    role: msg.is_user ? 'user' : 'assistant',
    name: msg.name,
    content: msg.mes,
  }));
}

function formatChatForPrompt(messages) {
  return messages.map(m => `${m.name}: ${m.content}`).join('\n').substring(0, 3000);
}

// ============================================
// 功能：日记生成
// ============================================

async function generateDiary() {
  const context = getContext();
  const charName = context.name2 || '角色';
  const userName = context.name1 || '用户';
  const recent = getRecentChat(30);
  if (recent.length < 5) {
    toastr.info('聊天消息太少，至少需要5条');
    return;
  }

  toastr.info('📖 正在生成日记...');

  const result = await callSubAPI([
    {
      role: 'system',
      content: `你是一位文学助手。请以"${charName}"的第一人称视角写一篇私密日记。总结最近发生的事件，流露对${userName}的真实情感。风格：文学性强、情感细腻、150-250字。不要使用markdown格式。`,
    },
    {
      role: 'user',
      content: `最近的对话记录：\n\n${formatChatForPrompt(recent)}`,
    },
  ]);

  if (result) {
    pluginData.diary_blood.push({
      id: `diary-${Date.now()}`,
      content: result,
      date: new Date().toLocaleString('zh-CN'),
    });
    saveChatData();
    renderDiary();
    toastr.success('📖 日记已生成！');
  }
}

// ============================================
// 功能：阿卡夏总结
// ============================================

async function generateSummary() {
  const recent = getRecentChat(40);
  if (recent.length < 10) {
    toastr.info('聊天消息太少，至少需要10条');
    return;
  }

  toastr.info('📜 正在生成总结...');

  const result = await callSubAPI([
    {
      role: 'system',
      content: '你是一位冒险日志记录员。用简洁的"情报简报"风格，总结以下对话中发生的重要事件、关键决策和人物关系变化。分条列出，每条不超过一句话，总计不超过200字。',
    },
    {
      role: 'user',
      content: formatChatForPrompt(recent),
    },
  ]);

  if (result) {
    pluginData.summaries.push({
      id: `sum-${Date.now()}`,
      content: result,
      date: new Date().toLocaleString('zh-CN'),
    });
    saveChatData();
    renderIntel();
    toastr.success('📜 总结已生成！');
  }
}

// ============================================
// 功能：环境雷达
// ============================================

async function generateWeather() {
  const recent = getRecentChat(10);
  if (recent.length < 3) {
    toastr.info('聊天消息太少');
    return;
  }

  toastr.info('☁️ 正在感知环境...');

  const result = await callSubAPI([
    {
      role: 'system',
      content: '根据以下对话推断当前场景的环境。用一句话描述天气、光线、声音和气味。只输出描述。',
    },
    {
      role: 'user',
      content: formatChatForPrompt(recent),
    },
  ]);

  if (result) {
    pluginData.weather = result;
    saveChatData();
    renderIntel();
    toastr.success('☁️ 环境已更新！');
  }
}

// ============================================
// 功能：氛围心电图
// ============================================

async function generateVibe() {
  const recent = getRecentChat(10);
  if (recent.length < 3) return;

  const result = await callSubAPI([
    {
      role: 'system',
      content: '分析以下对话的情绪基调，用2-4个关键词概括（如：暧昧而紧张、轻松搞笑、沉重悲伤、温馨日常）。只输出关键词描述，不超过20字。',
    },
    {
      role: 'user',
      content: formatChatForPrompt(recent),
    },
  ]);

  if (result) {
    pluginData.vibe = result;
    saveChatData();
    renderIntel();
  }
}

// ============================================
// 功能：平行宇宙
// ============================================

async function generateParallelUniverse(messageId) {
  const context = getContext();
  const message = context.chat[messageId];
  if (!message) return;

  const btn = $(`.mes[mesid="${messageId}"] .bb-butterfly-btn`);
  btn.text('⏳');
  toastr.info('🦋 正在撕裂时空...');

  const result = await callSubAPI([
    {
      role: 'system',
      content: '如果在这个瞬间，角色做出了截然相反、极其离谱或遭遇大失败的选择，会发生什么？写一个50-80字的搞笑或暗黑平行宇宙分支。不要使用markdown。',
    },
    {
      role: 'user',
      content: `原文："${message.mes.substring(0, 500)}"\n\n写出平行宇宙版本：`,
    },
  ]);

  btn.text('🦋');

  if (result) {
    pluginData.parallel_universes.push({
      id: `par-${Date.now()}`,
      origin: message.mes.substring(0, 80),
      content: result,
      floor: messageId,
      date: new Date().toLocaleString('zh-CN'),
    });
    saveChatData();
    renderParallel();
    toastr.success('🦋 平行宇宙已生成！');
  }
}

// ============================================
// 功能：命运梭哈
// ============================================

async function rollFate() {
  const btn = $('#bb-roll-fate');
  const resultDiv = $('.bb-fate-result');

  btn.addClass('bb-loading').text('🎲 命运旋转中...');
  resultDiv.text('正在召唤命运...');

  const context = getContext();
  const charName = context.name2 || '角色';
  const userName = context.name1 || '用户';
  const recent = getRecentChat(10);
  const chatSnippet = formatChatForPrompt(recent);

  const result = await callSubAPI([
    {
      role: 'system',
      content: `你是一位TRPG的命运骰子。基于当前剧情场景，生成一个突发事件。要求：具有戏剧性和冲击力，可以是危险的、搞笑的、浪漫的或诡异的。用一两句话描述，不超过60字。不要使用markdown。
示例："一颗流星突然坠落在附近的山丘上，大地震颤，远处传来不明生物的嚎叫。"
示例："${charName}的口袋里突然掉出一封不属于自己的情书，字迹居然是${userName}的。"`,
    },
    {
      role: 'user',
      content: `当前场景：\n${chatSnippet}\n\n请投掷命运骰子，生成一个突发事件：`,
    },
  ]);

  btn.removeClass('bb-loading').text('🎲 摇骰子！');

  if (result) {
    pluginData.chaos_event = result;
    saveChatData();
    resultDiv.html(`<strong>🔥 命运已定：</strong><br>${escapeHtml(result)}`);
    toastr.success('🃏 命运事件已生成！下次发送消息时 {{bb_chaos_event}} 将携带此事件');
  } else {
    resultDiv.text('❌ 命运沉默了...（API调用失败，请检查设置）');
  }
}

// ============================================
// 功能：NPC 状态追踪
// ============================================

async function generateNPCStatus(npcName) {
  const context = getContext();
  const charName = context.name2 || '角色';
  const userName = context.name1 || '用户';
  const recent = getRecentChat(20);

  const result = await callSubAPI([
    {
      role: 'system',
      content: `${charName}和${userName}正在进行剧情。请用一句话描述此时不在场的NPC "${npcName}" 正在另一个地方干什么？要求：符合人物性格和当前世界观，有趣且具体。不超过50字。`,
    },
    {
      role: 'user',
      content: `当前场景对话：\n${formatChatForPrompt(recent)}\n\nNPC "${npcName}" 此刻在做什么？`,
    },
  ]);

  if (result) {
    pluginData.npc_status[npcName] = result;
    saveChatData();
    renderIntel();
  }
}

// ============================================
// 消息计数器（触发自动生成）
// ============================================

function incrementMessageCounter() {
  const s = getSettings();
  s.message_counter = (s.message_counter || 0) + 1;

  if (s.auto_diary_enabled && s.message_counter >= s.diary_trigger_count) {
    console.log(`[骨与血] 📊 消息计数达到 ${s.message_counter}，触发自动生成...`);
    s.message_counter = 0;
    saveSettings();
    autoGenerate();
  } else {
    saveSettings();
  }
}

async function autoGenerate() {
  const s = getSettings();
  if (!s.api_endpoint || !s.api_key) return;

  console.log('[骨与血] ⚙️ 开始自动生成...');
  try {
    await Promise.allSettled([
      generateDiary(),
      generateSummary(),
      generateWeather(),
      generateVibe(),
    ]);
    console.log('[骨与血] ✅ 自动生成完成');
  } catch (error) {
    console.error('[骨与血] ❌ 自动生成出错:', error);
  }
}

// ============================================
// 宏注册
// ============================================

function registerAllMacros() {
  // {{bb_diary}} - 最新日记
  registerMacroLike(
    /\{\{bb_diary\}\}/gi,
    () => {
      if (pluginData.diary_blood.length > 0) {
        return pluginData.diary_blood[pluginData.diary_blood.length - 1].content;
      }
      return '';
    }
  );

  // {{bb_summary}} - 最新阿卡夏总结
  registerMacroLike(
    /\{\{bb_summary\}\}/gi,
    () => {
      if (pluginData.summaries.length > 0) {
        return pluginData.summaries[pluginData.summaries.length - 1].content;
      }
      return '';
    }
  );

  // {{bb_weather}} - 当前环境
  registerMacroLike(
    /\{\{bb_weather\}\}/gi,
    () => pluginData.weather || '未知环境'
  );

  // {{bb_chaos_event}} - 突发事件（一次性，读取后清空）
  registerMacroLike(
    /\{\{bb_chaos_event\}\}/gi,
    () => {
      const evt = pluginData.chaos_event;
      if (evt) {
        pluginData.chaos_event = '';
        saveChatData();
      }
      return evt || '';
    }
  );

  // {{bb_vibe}} - 氛围基调
  registerMacroLike(
    /\{\{bb_vibe\}\}/gi,
    () => pluginData.vibe || '平静'
  );

  // {{bb_npc_status}} - 全部NPC动态
  registerMacroLike(
    /\{\{bb_npc_status\}\}/gi,
    () => {
      const entries = Object.entries(pluginData.npc_status);
      if (entries.length === 0) return '';
      return entries.map(([name, status]) => `${name}: ${status}`).join('\n');
    }
  );

  console.log('[骨与血] 📡 所有宏已注册');
}

// ============================================
// 数据持久化
// ============================================

function getChatDataKey() {
  const context = getContext();
  if (!context.chatId) return null;
  return `bb_data_${context.chatId}`;
}

function saveChatData() {
  const key = getChatDataKey();
  if (!key) return;

  try {
    localStorage.setItem(key, JSON.stringify(pluginData));
  } catch (error) {
    console.error('[骨与血] 存储失败:', error);
  }
}

function loadChatData() {
  const key = getChatDataKey();
  if (!key) {
    resetPluginData();
    renderAll();
    return;
  }

  try {
    const stored = localStorage.getItem(key);
    if (stored) {
      const parsed = JSON.parse(stored);
      pluginData.records_bone = parsed.records_bone || [];
      pluginData.diary_blood = parsed.diary_blood || [];
      pluginData.summaries = parsed.summaries || [];
      pluginData.weather = parsed.weather || '';
      pluginData.npc_status = parsed.npc_status || {};
      pluginData.chaos_event = parsed.chaos_event || '';
      pluginData.vibe = parsed.vibe || '';
      pluginData.parallel_universes = parsed.parallel_universes || [];
    } else {
      resetPluginData();
    }
  } catch (error) {
    console.error('[骨与血] 读取失败:', error);
    resetPluginData();
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
  };
}

// ============================================
// 导出功能
// ============================================

function exportAsMarkdown() {
  if (pluginData.records_bone.length === 0) {
    toastr.info('没有可导出的语录');
    return;
  }

  const context = getContext();
  const charName = context.name2 || '角色';

  let md = `# 🦴 骨与血 — ${charName} 语录集\n\n`;
  md += `> 导出时间: ${new Date().toLocaleString('zh-CN')}\n\n---\n\n`;

  pluginData.records_bone.forEach((record, index) => {
    md += `### ${index + 1}. ${record.who}\n\n`;
    md += `> ${record.text}\n\n`;
    if (record.context) {
      md += `*上文: ${record.context.substring(0, 100)}...*\n\n`;
    }
    md += `📅 ${record.date} | #${record.floor}\n\n---\n\n`;
  });

  downloadFile(`bone_and_blood_${charName}.md`, md, 'text/markdown');
  toastr.success('📄 Markdown 已导出');
}

function exportAsJSON() {
  if (pluginData.records_bone.length === 0) {
    toastr.info('没有可导出的数据');
    return;
  }

  const context = getContext();
  const charName = context.name2 || '角色';

  const exportData = {
    export_time: new Date().toISOString(),
    records: pluginData.records_bone,
    diaries: pluginData.diary_blood,
    summaries: pluginData.summaries,
  };

  downloadFile(
    `bone_and_blood_${charName}.json`,
    JSON.stringify(exportData, null, 2),
    'application/json'
  );
  toastr.success('📦 JSON 已导出');
}

function downloadFile(filename, content, mimeType) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// ============================================
// 工具函数
// ============================================

function escapeHtml(text) {
  if (!text) return '';
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}




