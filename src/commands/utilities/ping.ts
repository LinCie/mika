import { SlashCommandBuilder, type CommandInteraction } from 'discord.js'
import { Command } from '@/instances/Command'
import type { Mika } from '@//instances/Mika'
import { DeferReply } from '@/middlewares'

const data = new SlashCommandBuilder()
    .setName('ping')
    .setDescription('Replies with Pong!')
    .toJSON()

class Ping extends Command {
    constructor() {
        super(data)
        this.use(DeferReply)
    }

    async command(client: Mika, interaction: CommandInteraction) {
        await interaction.editReply('Pong!')
    }
}

export default Ping
