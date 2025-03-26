import {
    ChatInputCommandInteraction,
    GuildMember,
    SlashCommandBuilder,
} from 'discord.js'
import { Command, EMBEDTYPE, Mika, PlayerManager } from '@/instances'
import {
    IsInVoiceChannel,
    IsNotMaintenance,
    IsPlayerCurrent,
    IsPlayerExist,
} from '@/middlewares'

const data = new SlashCommandBuilder()
    .setName('resume')
    .setDescription('Resume current player')

class Resume extends Command {
    constructor() {
        super(data)
        this.use(
            IsNotMaintenance,
            IsInVoiceChannel,
            IsPlayerExist,
            IsPlayerCurrent
        )
    }

    async command(
        client: Mika,
        interaction: ChatInputCommandInteraction,
        context: { player: PlayerManager; member: GuildMember }
    ) {
        const { player, member } = context

        await player.resumeMusic()
        const embed = client.embed.createMessageEmbedWithAuthor(
            '🎶 **Mika** has been resumed 🎶',
            member,
            EMBEDTYPE.SUCCESS
        )
        await client.interaction.replyEmbed(interaction, embed)
    }
}

export default Resume
