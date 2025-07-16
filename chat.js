"use strict";

/**
 * @typedef {Object} ChatConfig
 * @property {Object.<string, PersonConfig>} people
 */

/**
 * @typedef {Object} PersonConfig
 * @property {string} name
 * @property {string} avatar
 */

/**
 * @typedef {Object} DialogueBlock
 * @property {string} speaker
 * @property {string|null} replyTo
 * @property {string} content
 * @property {string[]} mentions
 */

/**
 * @typedef {Object} ParsedConfigResult
 * @property {ChatConfig} parsedObject
 * @property {string} modifiedContent
 */

/**
 * @typedef {Object} TotalData
 * @property {Object.<string, PersonConfig>} people
 * @property {string} content
 */

/**
 * 解析聊天配置
 * @param {string} content - 包含配置的内容
 * @returns {ParsedConfigResult}
 */
const parseChatConfig = (content) => {
  // 匹配 (ChatConfig) 标识位置
  const configStart = content.indexOf("(ChatConfig)");
  if (configStart === -1) {
    content = `
      (ChatConfig) {
        people: {}
      }
    ${content}`
  }

  let openBraces = 0;
  let objectStart = -1;
  let objectEnd = -1;

  // 从标识符后开始扫描
  for (let i = configStart + "(ChatConfig)".length; i < content.length; i++) {
    const char = content[i];

    // 找到对象开始位置
    if (objectStart === -1 && char === "{") {
      objectStart = i;
      openBraces = 1;
      continue;
    }

    // 计数大括号
    if (objectStart !== -1) {
      if (char === "{") openBraces++;
      if (char === "}") openBraces--;

      // 找到对象结束位置
      if (openBraces === 0) {
        objectEnd = i;
        break;
      }
    }
  }

  if (objectEnd === -1) {
    throw new Error("Invalid format: Unclosed configuration object");
  }

  const configStr = content.slice(objectStart, objectEnd + 1);
  const remainingContent = content.slice(objectEnd + 1).trim();
  let parsedObject;

  try {
    parsedObject = new Function(`return ${configStr}`)();

    if (!(parsedObject?.people instanceof Object)) {
      throw new Error('"people" must be an Object');
    }
  } catch (e) {
    throw new Error(`Parsing failed: ${e.message}`);
  }

  return {
    parsedObject,
    modifiedContent: remainingContent,
  };
};

/**
 * 获取合并后的配置和内容
 * @param {string} content - 原始内容
 * @returns {TotalData}
 */
const getTotalData = (content) => {
  // 从主题中获取人物配置
  const themeChatBoxConfig = hexo.theme.config.chatBox ?? {};

  // 解析配置
  const parsedChatConfig = parseChatConfig(content);

  // 从容器前获取人物配置
  const contentChatBoxConfig = parsedChatConfig.parsedObject;

  // 从容器中获取内容
  const contentData = parsedChatConfig.modifiedContent;

  // 合并配置
  const mergedConfig = {
    ...themeChatBoxConfig.people,
    ...contentChatBoxConfig.people,
  };

  return {
    people: mergedConfig,
    content: contentData,
  };
};

/**
 * 解析对话文本
 * @param {string} text - 对话文本
 * @returns {DialogueBlock[]}
 */
const parseDialogue = (text) => {
  // 正则表达式分解器
  const blockRegex =
    /\[(.*?)\]\s*\|\s*(?:\[回复:\s*(.*?)\])?\n([\s\S]*?)\n\|\s*\n?/g;
  const mentionRegex = /@(\p{Script=Han}|\p{Letter}+)/gu;

  const blocks = [];
  let match;

  while ((match = blockRegex.exec(text)) !== null) {
    // 提取基础信息
    const speaker = match[1].trim();
    const replyTo = match[2] ? match[2].trim() : null;
    let content = match[3].trim();

    // 提取提及列表
    const mentions = [];
    let mentionMatch;
    while ((mentionMatch = mentionRegex.exec(content)) !== null) {
      mentions.push(mentionMatch[1]);
    }

    blocks.push({
      speaker,
      replyTo,
      content,
      mentions: [...new Set(mentions)], // 去重
    });
  }

  return blocks;
};

/**
 * 解析完整聊天内容
 * @param {string} content - 原始内容
 * @returns {{totalData: TotalData, dialogue: DialogueBlock[]}}
 */
const parseChatContent = (content) => {
  // 获取数据
  const totalData = getTotalData(content);

  // 解析对话
  const dialogue = parseDialogue(totalData.content);
  return {
    totalData,
    dialogue,
  };
};

/**
 * 渲染聊天内容
 * @param {string[]} args - 标签参数
 * @param {string} content - 原始内容
 * @returns {string}
 */
const renderChatContent = (args, content) => {
  // 获取数据
  const necessaryInfo = parseChatContent(content);

  // 渲染单条消息
  const renderSingleMessage = (me, dialogueInfo) => {

    return `
      <div class="chat-message ${me ? "me" : ""}">
        <img class="chat-avatar no-lightbox" src="${necessaryInfo.totalData.people[dialogueInfo.speaker].avatar}">
        <div class="chat-message-subtitle">
          <span class="chat-message-name">${necessaryInfo.totalData.people[dialogueInfo.speaker].name}</span>
          <div class="chat-message-text-wrapper ${me ? "me" : ""}">
            <div class="chat-message-text">${(() => {
              let processedContent = dialogueInfo.content;

              // 引用回复
              if (dialogueInfo.replyTo) {
                processedContent = `<blockquote>回复：<strong class="chat-message-mentioned">@${
                  necessaryInfo.totalData.people[dialogueInfo.replyTo].name
                }</strong></blockquote>${processedContent}`;
              }

              // 提及
              if (dialogueInfo.mentions.length > 0) {
                // 转义
                const escapeRegExp = (string) => {
                return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
                      };

                // 创建正则表达式
                const mentionPattern = new RegExp(
                  `@(${dialogueInfo.mentions.map(escapeRegExp).join('|')})`,
                  'g'
                );

                // 一波带走
                processedContent = processedContent.replace(
                  mentionPattern,
                  '<strong class="chat-message-mentioned">@$1</strong>'
                );
              }

              // 处理换行
              processedContent = processedContent.replace(/\n/g, '<br>');

              return processedContent
            })()}</div>
          </div>
        </div>
      </div>
    `;
  };

  return necessaryInfo.dialogue.map((dialogueInfo) => {
    const me = dialogueInfo.speaker === args[1];
    return renderSingleMessage(me, dialogueInfo);
  }).join("");
};

/**
 * 创建聊天框容器
 * @param {string[]} args - 标签参数
 * @param {string} content - 原始内容
 * @returns {string}
 */
const createChatBoxContainer = (args, content) => {
  const elapsedMs = process.hrtime();

  try {
    const html = `
      <div class="chat-box">
        <div class="chat-title">
          <i class="fa-solid fa-angle-left"></i>
          <span class="chat-title-text">${args[0] ?? "群聊消息"}</span>
          <div class="chat-box-icons">
            <i class="fa-solid fa-user"></i><i class="fa-solid fa-bars"></i>
          </div>
        </div>
        <div class="chat-content">
          ${renderChatContent(args, content)}
        </div>
      </div>
    `;

    hexo.log.info(`[chatBox] 渲染完成，耗时: ${(() => {
      const hrtime = process.hrtime(elapsedMs);
      return hrtime[0] * 1000 + hrtime[1] / 1000000
    })()} 毫秒`);

    return html
  } catch (err) {
    hexo.log.error(`[chatBox] 渲染失败: ${err.message}`)
    return `<div><p>chatBox Error!</p></div>`
  }
}

// {% chatBox "Group Name" "Your Matcher" %}
hexo.extend.tag.register("chatBox", createChatBoxContainer, { ends: true });
