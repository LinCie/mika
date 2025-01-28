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
class MikaCommand {
  @Slash({ description: "Run PM2 mika Command" })
  @Guild(DEV_GUILD_ID)
  @Guard(DeferReply, IsOwner)
  async mika(
    @SlashChoice({ name: "Start Mika", value: "start mika" })
    @SlashChoice({ name: "Restart Mika", value: "restart mika" })
    @SlashChoice({ name: "Stop Mika", value: "stop mika" })
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

export { MikaCommand };
