import { ChatInputCommandInteraction, SlashCommandBuilder } from 'discord.js'
import { Command, Mika, PlayerManager } from '@/instances'
import { IsInVoiceChannel, IsPlayerCurrent, IsPlayerExist } from '@/middlewares'

const data = new SlashCommandBuilder()
    .setName('stop')
    .setDescription('Stop current player')

class Stop extends Command {
    constructor() {
        super(data)
        this.use(IsInVoiceChannel, IsPlayerExist, IsPlayerCurrent)
    }

    async command(
        _client: Mika,
        interaction: ChatInputCommandInteraction,
        context: { player: PlayerManager }
    ) {
        const { player } = context

        await player.removePlayer()
        await interaction.deleteReply()
    }
}

export default Stop
