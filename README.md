## BLOG-CHAT-PLUGIN

此项目用于在 Hexo-Butterfly 博客中加入群聊消息功能，采用外挂标签实现

基于 [外挂标签之聊天记录 | 鹊楠の小窝][1] 和 [Hexo-butterfly 聊天记录外挂标签][2] 编写，格式和使用略有不同

## 功能

- 💬 聊天消息气泡
- - ![](https://github.com/user-attachments/assets/eb665d78-83ea-46ab-9a83-adc562e16fbd)

- ⤴️ 消息回复
- - ![](https://github.com/user-attachments/assets/04ca8739-8d94-4e1d-8f9d-db6743442c74)

- 🔗 艾特
- - ![](https://github.com/user-attachments/assets/fd5907c9-c3ad-4744-abcd-e53b75aff655)

- 🛠️ 自定义群聊名称
- - ![](https://github.com/user-attachments/assets/7b946254-f85e-4259-b568-bd58215b7139)

- 🔁 自定义我方人物
- - ![](https://github.com/user-attachments/assets/b9d27106-df14-4a64-87c5-e303492c1394)

不出意外地，以上几种功能可以同时存在

![](https://github.com/user-attachments/assets/1773e65d-fec1-4282-8566-f4aee7b8ab59)

## 使用

### 添加人物

你可以在每段对话中添加人物，也可以在主题配置中添加人物

#### 在每段对话中添加人物

1. 使用外挂标签 `chatBox`，并 **设置群聊名称** 和我方人物 **匹配名称**（而不是显示名称）

> 匹配名称不参与页面显示

2. 使用 **特定结构体（ChatConfig）** 设置人物

> 使用特定结构体是为了避免聊天中的正常内容被错误当作人物配置
>
> `FloatSheep` 和 `Quenan` 即为人物 **匹配名称**

```markdown
{% chatBox 群聊名称 我方人物 %}
(ChatConfig) {
  people: {
      "FloatSheep": {
        name: "浮杨", // 显示名称
        avatar: "https://registry.npmmirror.com/@floatsheep/fsl-fim/1.0.23/files/avatar%202024.main.webp" // 头像
      },
      "Quenan": {
        name: "鹊楠",
        avatar: "https://registry.npmmirror.com/@floatsheep/fsl-fim/1.0.4/files/quenan.webp"
      }
    }
}

...
{% endchatBox %}
```

每次对话都添加人物十分繁琐，所以你可以在主题配置中添加人物

在主题配置中添加的人物将在全局可用

#### 在主题配置中添加人物

编辑 `_config.butterfly.yml` 文件，添加以下内容并自行修改

配置项中 `Key` -> `LiuShen`、`FloatSheep`、`Quenan` 为**匹配名称**，`name` 为显示名称，`avatar` 为头像

```yml
chatBox:
  people:
    LiuShen:
      name: 花露水
      avatar: https://registry.npmmirror.com/@floatsheep/fsl-fim/1.0.24/files/qyliu.webp

    FloatSheep:
      name: 浮杨
      avatar: https://registry.npmmirror.com/@floatsheep/fsl-fim/1.0.23/files/avatar%202024.main.webp

    Quenan:
      name: 鹊楠
      avatar: https://registry.npmmirror.com/@floatsheep/fsl-fim/1.0.4/files/quenan.webp
```

### 添加对话

本项目将

```markdown
[匹配名称] |
对话内容
|
```

解析为一个聊天消息，按照此格式编写即可，以下是上文中 `聊天消息气泡` 的示例

```markdown
{% chatBox 我们的群 FloatSheep %}
[FloatSheep] |
请问去星辰瀑布的最佳路线？
需要准备什么装备？
|

[LiuShen] |
三条推荐路线：
1. 东侧彩虹小径（平缓）
2. 西侧鹰嘴岩（风景绝佳）
3. 北侧水晶洞（需防水靴）

建议携带：
- 防风斗篷
- 星象罗盘
|
{% endchatBox %}
```

#### 消息回复

按照以下格式编写

```markdown
{% chatBox 群聊名称 我方人物 %}
[匹配名称] |
对话内容
|

[匹配名称] | [回复:匹配名称]
对话内容
|
{% endchatBox %}
```

以下是上文中 `消息回复` 的示例


```markdown
{% chatBox 相侵相爱异家人 FloatSheep %}
[FloatSheep] |
请问去星辰瀑布的最佳路线？
需要准备什么装备？
|

[LiuShen] | [回复:FloatSheep]
三条推荐路线：
1. 东侧彩虹小径（平缓）
2. 西侧鹰嘴岩（风景绝佳）
3. 北侧水晶洞（需防水靴）

建议携带：
- 防风斗篷
- 星象罗盘
|
```

#### 艾特

直接在文中使用 `@匹配名称`

以下是上文中 `艾特` 的例子


```markdown
[FloatSheep] |
请问去星辰瀑布的最佳路线？
需要准备什么装备？
|

[LiuShen] | [回复:FloatSheep]
三条推荐路线：
1. 东侧彩虹小径（平缓）
2. 西侧鹰嘴岩（风景绝佳）
3. 北侧水晶洞（需防水靴）

建议携带：
- 防风斗篷 @装备管理员
- 星象罗盘
|

[Quenan] |
补充建议：
1. 水晶洞近期有渗水现象

2. 建议额外携带荧光棒 @FloatSheep

3. 天气预报显示明日有阵雨
|
```

#### 其余

**自定义群聊名称**只需要修改外挂标签的第一项参数，**自定义我方人物**只需要修改第二项参数

```markdown
{% chatBox 第一项参数 第二项参数 %}

...
{% endchatBox %}
```

[1]: <https://blog.quenan.cn/posts/829283e6>

[2]: <https://gist.liushen.fun/LiuShen/Hexo-butterfly-tag-chat>
