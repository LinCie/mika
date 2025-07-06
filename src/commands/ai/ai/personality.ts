import type {
    ChatInputCommandInteraction,
    GuildMember,
    SlashCommandBuilder,
} from 'discord.js'
import { EMBEDTYPE, Mika, Subcommand } from '@/instances'
import type { Personality } from '@/config'

class AIPersonality extends Subcommand {
    async configure(data: SlashCommandBuilder): Promise<void> {
        data.addSubcommand((subcommand) =>
            subcommand
                .setName('personality')
                .setDescription('Change AI personality')
                .addStringOption((option) =>
                    option
                        .setName('student')
                        .setDescription('The student name')
                        .setRequired(true)
                        .addChoices(
                            { name: 'Misono Mika', value: 'mika' },
                            { name: 'Arona', value: 'arona' },
                            { name: 'Plana', value: 'plana' },
                            { name: 'Iochi Mari', value: 'mari' },
                            { name: 'Tendou Alice', value: 'alice' },
                            { name: 'Shimoe Koharu', value: 'koharu' },
                            { name: 'Kuda Izuna', value: 'izuna' },
                            { name: 'Kosaka Wakamo', value: 'wakamo' },
                            { name: 'Shirasu Azusa', value: 'azusa' },
                            { name: 'Ajitani Hifumi', value: 'hifumi' }
                        )
                )
        )
    }

    async command(client: Mika, interaction: ChatInputCommandInteraction) {
        const member = interaction.member as GuildMember

        const student = interaction.options.getString(
            'student',
            true
        ) as Personality

        client.ai.setPersonality(member.id, student)

        const embed = client.embed.createMessageEmbedWithAuthor(
            'Your AI personality has been updated, Sensei! ☆',
            member,
            EMBEDTYPE.SUCCESS
        )

        await client.interaction.replyEmbed(interaction, embed)
    }
}

export default AIPersonality
