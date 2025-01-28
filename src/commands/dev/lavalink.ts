import {
  ApplicationCommandOptionType,
  type GuildMember,
  type CommandInteraction,
} from "discord.js";
import { Discord, Guard, Guild, Slash, SlashChoice, SlashOption } from "discordx";
import { DeferReply, IsOwner } from "@/guards";
import { EMBEDTYPE, type Mika } from "@/instances";
import { DEV_GUILD_ID } from "@/config";

@Discord()
class Lavalink {
  @Slash({ description: "Run PM2 lavalink Command" })
  @Guild(DEV_GUILD_ID)
  @Guard(DeferReply, IsOwner)
  async lavalink(
    @SlashChoice({ name: "Start Lavalink", value: "start lavalink" })
    @SlashChoice({ name: "Restart Lavalink", value: "restart lavalink" })
    @SlashChoice({ name: "Stop Lavalink", value: "stop lavalink" })
    @SlashOption({
      name: "command",
      description: "The PM2 command",
      required: true,
      type: ApplicationCommandOptionType.String,
    })
    command: string,

    interaction: CommandInteraction,
    client: Mika,
  ): Promise<void> {
    const member = interaction.member as GuildMember

    const pm2 = Bun.spawn(["pm2", ...command.split(" ")])
    const code = await pm2.exited

    if (code === 0) {
      const embed = client.embed.createMessageEmbedWithAuthor(`Ran command \`\`\`bash\npm2 ${command}\n\`\`\``, member, EMBEDTYPE.SUCCESS)
      await client.interaction.replyEmbed(interaction, embed)
    } else {
      const embed = client.embed.createMessageEmbedWithAuthor(`An error occured when running command \`\`\`bash\npm2 ${command}\n\`\`\`\nError code: ${code}`, member, EMBEDTYPE.ERROR)
      await client.interaction.replyEmbed(interaction, embed)
    }
  }
}

export { Lavalink };
