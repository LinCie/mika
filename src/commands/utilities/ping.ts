import {
    GuildMember,
    SlashCommandBuilder,
    type CommandInteraction,
} from 'discord.js'
import { EMBEDTYPE, Command, type Mika } from '@/instances'

const data = new SlashCommandBuilder()
    .setName('ping')
    .setDescription('Replies with Pong!')
    .toJSON()

class Ping extends Command {
    constructor() {
        super(data)
    }

    async command(client: Mika, interaction: CommandInteraction) {
        const member = interaction.member as GuildMember
        const embed = client.embed.createMessageEmbedWithAuthor(
            'Pong!',
            member,
            EMBEDTYPE.GLOBAL
        )

        await client.interaction.replyEmbed(interaction, embed)
    }
}

export default Ping
