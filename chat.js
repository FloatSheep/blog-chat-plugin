"use strict";

// 配置解析器
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

    if (!parsedObject?.people instanceof Object) {
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

// 获取人物配置
const getTotalData = (content) => {
  // 从主题中获取人物配置
  const themeChatBoxConfig = hexo.theme.config.chatBox ?? {};

  // 从容器前获取人物配置
  const contentChatBoxConfig = parseChatConfig(content).parsedObject;

  // 从容器中获取内容
  const contentData = parseChatConfig(content).modifiedContent;

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
 * 解析对话格式的文本
 * @param {string} text - 符合规范的对话文本
 * @returns {Array} 包含所有对话块对象的数组
 */
const parseDialogue = (text) => {
  // 正则表达式分解器
  const blockRegex =
    /\[(.*?)\]\s*\|\s*(?:\[回复:\s*(.*?)\])?\n([\s\S]*?)\n\|\s*\n?/g;
  const mentionRegex = /@([\w\u4e00-\u9fa5]+)/g;

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

// 解析聊天内容
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

// 渲染聊天内容
const renderChatContent = (args, content) => {
  const necessaryInfo = parseChatContent(content);

  // 渲染单条消息
  const renderSingleMessage = (me, dialogueInfo) => {

    return `
      <div class="chat-message ${me ? "me" : ""}">
        <img class="chat-avatar" src="${necessaryInfo.totalData.people[dialogueInfo.speaker].avatar}">
        <div class="chat-message-subtitle">
          <span class="chat-message-name">${necessaryInfo.totalData.people[dialogueInfo.speaker].name}</span>
          <div class="chat-message-text-wrapper ${me ? "me" : ""}">
            <div class="chat-message-text">${(() => {
              if (dialogueInfo.replyTo) {
                dialogueInfo.content = `<blockquote>回复：<strong class="chat-message-mentioned">@${necessaryInfo.totalData.people[dialogueInfo.replyTo].name}</strong></blockquote>${dialogueInfo.content}`
              }
              dialogueInfo.mentions.forEach(mentioned => {
                dialogueInfo.content = dialogueInfo.content.replaceAll(`@${mentioned}`, `<strong class="chat-message-mentioned">@${mentioned}</strong>`);
              });

              dialogueInfo.content = dialogueInfo.content.replace(/\n/g, '<br>');

              return dialogueInfo.content
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

// 创建聊天容器
const createChatBoxContainer = (args, content) => {
  return `
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
};

// {% chatBox "Group Name" "Your Matcher" %}
hexo.extend.tag.register("chatBox", createChatBoxContainer, { ends: true });
