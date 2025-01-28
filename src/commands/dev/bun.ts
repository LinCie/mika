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
class BunCommand {
  @Slash({ description: "Run Bun Command" })
  @Guild(DEV_GUILD_ID)
  @Guard(DeferReply, IsOwner)
  async bun(
    @SlashChoice({ name: "Install", value: "i --frozen-lockfile" })
    @SlashOption({
      name: "command",
      description: "The Bun command",
      required: true,
      type: ApplicationCommandOptionType.String,
    })
    command: string,

    interaction: CommandInteraction,
    client: Mika,
  ): Promise<void> {
    const member = interaction.member as GuildMember

    const bun = Bun.spawn(["bun", ...command.split(" ")])
    const code = await bun.exited

    if (code === 0) {
      const embed = client.embed.createMessageEmbedWithAuthor(`Ran command \`\`\`bash\nbun ${command}\n\`\`\``, member, EMBEDTYPE.SUCCESS)
      await client.interaction.replyEmbed(interaction, embed)
    } else {
      const embed = client.embed.createMessageEmbedWithAuthor(`An error occured when running command \`\`\`bash\nbun ${command}\n\`\`\`\nError code: ${code}`, member, EMBEDTYPE.ERROR)
      await client.interaction.replyEmbed(interaction, embed)
    }
  }
}

export { BunCommand };
