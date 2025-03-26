import {
    ChatInputCommandInteraction,
    GuildMember,
    SlashCommandBuilder,
} from 'discord.js'
import { Command, EMBEDTYPE, Mika } from '@/instances'
import { IsOwner } from '@/middlewares'
import { EMOJI } from '@/config'

const data = new SlashCommandBuilder()
    .setName('maintenance')
    .setDescription('Set maintenance mode to Mika')
    .addBooleanOption((option) =>
        option
            .setName('maintenance')
            .setDescription('Set maintenance mode to Mika')
            .setRequired(true)
    )

class Maintenance extends Command {
    constructor() {
        super(data as SlashCommandBuilder)
        this.isGuildOnly = true
        this.use(IsOwner)
    }

    async command(client: Mika, interaction: ChatInputCommandInteraction) {
        const member = interaction.member as GuildMember

        const maintenance = interaction.options.getBoolean('maintenance', true)
        await client.maintenanceMode(maintenance)

        const message = maintenance
            ? `${EMOJI.music} **Mika** has been set to maintenance mode`
            : `${EMOJI.music} **Mika** has been set to normal mode`
        const embed = client.embed.createMessageEmbedWithAuthor(
            message,
            member,
            EMBEDTYPE.SUCCESS
        )

        await client.interaction.replyEmbed(interaction, embed)
    }
}

export default Maintenance
