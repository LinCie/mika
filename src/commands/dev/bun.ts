import {
    ChatInputCommandInteraction,
    GuildMember,
    SlashCommandBuilder,
} from 'discord.js'
import { Command, EMBEDTYPE, Mika } from '@/instances'
import { IsOwner } from '@/middlewares'

const data = new SlashCommandBuilder()
    .setName('bun')
    .setDescription('Run bun command')
    .addStringOption((option) =>
        option
            .setName('command')
            .setDescription('The bun command')
            .addChoices({ name: 'install', value: 'i --frozen-lockfile' })
            .setRequired(true)
    )

class BunCommand extends Command {
    constructor() {
        super(data as SlashCommandBuilder)
        this.isGuildOnly = true
        this.use(IsOwner)
    }

    async command(client: Mika, interaction: ChatInputCommandInteraction) {
        const member = interaction.member as GuildMember

        const command = interaction.options.getString('command', true)

        const pm2 = Bun.spawn(['bun', ...command.split(' ')])
        const code = await pm2.exited

        if (code === 0) {
            const embed = client.embed.createMessageEmbedWithAuthor(
                `Ran command \`\`\`bash\npm2 ${command}\n\`\`\``,
                member,
                EMBEDTYPE.SUCCESS
            )
            await client.interaction.replyEmbed(interaction, embed)
        } else {
            const embed = client.embed.createMessageEmbedWithAuthor(
                `An error occured when running command \`\`\`bash\npm2 ${command}\n\`\`\`\nError code: ${code}`,
                member,
                EMBEDTYPE.ERROR
            )
            await client.interaction.replyEmbed(interaction, embed)
        }
    }
}

export default BunCommand
