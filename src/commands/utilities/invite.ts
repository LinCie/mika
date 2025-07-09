import {
    SlashCommandBuilder,
    type ChatInputCommandInteraction,
} from 'discord.js'
import { EMBEDTYPE, Command, type Mika } from '@/instances'

const data = new SlashCommandBuilder()
    .setName('invite')
    .setDescription('Invite Mika to your server! ☆')

class Invite extends Command {
    constructor() {
        super(data)
    }

    async command(client: Mika, interaction: ChatInputCommandInteraction) {
        const embed = client.embed.createMessageEmbed(
            'Sensei! ☆ Are you looking to invite Mika in your server? Check out my [invite link](https://discord.com/oauth2/authorize?client_id=1312578502851035166&permissions=3148800&integration_type=0&scope=bot) ☆',
            EMBEDTYPE.GLOBAL
        )

        await client.interaction.replyEmbed(interaction, embed)
    }
}

export default Invite
