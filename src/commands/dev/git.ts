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
class Git {
  @Slash({ description: "Run Git Command" })
  @Guild(DEV_GUILD_ID)
  @Guard(DeferReply, IsOwner)
  async git(
    @SlashChoice({ name: "Pull", value: "pull" })
    @SlashChoice({ name: "Fetch", value: "fetch" })
    @SlashChoice({ name: "Stash", value: "stash" })
    @SlashOption({
      name: "command",
      description: "The Git command",
      required: true,
      type: ApplicationCommandOptionType.String,
    })
    command: string,

    interaction: CommandInteraction,
    client: Mika,
  ): Promise<void> {
    const member = interaction.member as GuildMember

    const pm2 = Bun.spawn(["git", ...command.split(" ")])
    const code = await pm2.exited

    if (code === 0) {
      const embed = client.embed.createMessageEmbedWithAuthor(`Ran command \`\`\`bash\ngit ${command}\n\`\`\``, member, EMBEDTYPE.SUCCESS)
      await client.interaction.replyEmbed(interaction, embed)
    } else {
      const embed = client.embed.createMessageEmbedWithAuthor(`An error occured when running command \`\`\`bash\ngit ${command}\n\`\`\`\nError code: ${code}`, member, EMBEDTYPE.ERROR)
      await client.interaction.replyEmbed(interaction, embed)
    }
  }
}

export { Git };
