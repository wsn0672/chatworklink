require("dotenv").config()

const { Client, GatewayIntentBits } = require("discord.js")
const axios = require("axios")

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ]
})

const CHANNEL_IDS = process.env.DISCORD_CHANNEL_IDS.split(",")

client.once("ready", () => {
  console.log(`Bot起動: ${client.user.tag}`)
})

client.on("messageCreate", async (message) => {

  if (message.author.bot) return
  if (!CHANNEL_IDS.includes(message.channel.id)) return

  try {

    const minecraftMentioned =
      message.mentions.roles.has(process.env.MINECRAFT_ROLE_ID)

    let content = message.content

    // @メンション削除
    content = content.replace(/<@!?[0-9]+>/g, "")
    content = content.replace(/<@&[0-9]+>/g, "")
    content = content.replace(/@everyone/g, "")
    content = content.replace(/@here/g, "")

    // embed対応
    if (!content && message.embeds.length > 0) {
      const embed = message.embeds[0]

      content =
        (embed.title ? embed.title + "\n" : "") +
        (embed.description ? embed.description : "")
    }

    // 添付ファイル
    if (message.attachments.size > 0) {
      message.attachments.forEach(file => {
        content += "\n" + file.url
      })
    }

    let body = ""

    if (minecraftMentioned) {
      body += "[toall]\n\n"
    }

    body += `[info]
[title]Discordアナウンス転送[/title]

投稿者: ${message.member?.displayName || message.author.username}
チャンネル: #${message.channel.name}

${content}

[/info]`

    await axios.post(
      `https://api.chatwork.com/v2/rooms/${process.env.CHATWORK_ROOM_ID}/messages`,
      new URLSearchParams({ body }),
      {
        headers: {
          "X-ChatWorkToken": process.env.CHATWORK_TOKEN
        }
      }
    )

    console.log("Chatwork送信成功")

  } catch (err) {
    console.error("送信エラー:", err)
  }

})

client.login(process.env.DISCORD_TOKEN)