import {
    GuildMember,
    SlashCommandBuilder,
    ApplicationCommandOptionType,
    GuildMember,
    SlashCommandBuilder,
    type ChatInputCommandInteraction,
    type SlashCommandSubcommandBuilder,
} from 'discord.js'
import { EMBEDTYPE, Command, type Mika } from '@/instances'

// Helper function to generate usage string for commands and subcommands
const getUsage = (
    commandName: string,
    commandOrSubcommand: Command | any // Can be Command instance or subcommand JSON
): string => {
    let usage = `/${commandName}`
    if (commandOrSubcommand.name !== commandName) {
        // It's a subcommand
        usage += ` ${commandOrSubcommand.name}`
    }

    const options =
        'options' in commandOrSubcommand && commandOrSubcommand.options
            ? commandOrSubcommand.options // For main command (Command class)
            : commandOrSubcommand.options // For subcommand (already JSON)
    if (options) {
        options.forEach((option: any) => {
            // Ensure option is in JSON format if it's not already
            const opt = option.toJSON ? option.toJSON() : option
            if (opt.type === ApplicationCommandOptionType.Subcommand || opt.type === ApplicationCommandOptionType.SubcommandGroup) {
                return // Skip subcommands/groups in usage string for now, handled separately
            }
            const optionName = opt.name
            const required = opt.required ? '' : '?'
            usage += ` \`<${optionName}${required}>:${opt.description}\``
        })
    }
    return usage
}

const data = new SlashCommandBuilder()
    .setName('help')
    .setDescription(
        'Get a list of all commands or info about a specific command.'
    )
    .addStringOption((option) => {
        option
            .setName('command')
            .setDescription('The command you want help with.')
            .setRequired(false)
        // Dynamically add choices from our command list
        commands.forEach((cmd) =>
            option.addChoices({ name: cmd.name, value: cmd.name })
        )
        return option
    })

class Help extends Command {
    constructor() {
        super(data as SlashCommandBuilder)
    }

    async command(client: Mika, interaction: ChatInputCommandInteraction) {
        const member = interaction.member as GuildMember
        const commandInput = interaction.options.getString('command')
        const { commands } = client

        // Dynamically set choices for the 'command' option
        const commandOption = this.data.options.find(opt => opt.toJSON().name === 'command');
        if (commandOption && commandOption.toJSON().type === ApplicationCommandOptionType.String) {
            const choices = [];
            commands.forEach(cmd => {
                choices.push({ name: cmd.data.name, value: cmd.data.name });
                const subcommands = cmd.data.options?.filter(
                    option => option.toJSON().type === ApplicationCommandOptionType.Subcommand
                );
                subcommands?.forEach(sub => {
                    const subJson = sub.toJSON();
                    choices.push({ name: `${cmd.data.name}/${subJson.name}`, value: `${cmd.data.name}/${subJson.name}` });
                });
            });
            // @ts-expect-error choices is not directly assignable
            commandOption.setChoices(...choices.slice(0, 25)); // Discord limits choices to 25
        }


        if (commandInput) {
            let mainCommandName = commandInput
            let subCommandName: string | null = null

            if (commandInput.includes('/')) {
                [mainCommandName, subCommandName] = commandInput.split('/')
            }

            const command = commands.get(mainCommandName)

            if (!command) {
                const embed = client.embed.createMessageEmbedWithAuthor(
                    `⛔ The command \`${mainCommandName}\` was not found.`,
                    member,
                    EMBEDTYPE.ERROR
                )
                await client.interaction.replyEmbed(interaction, embed, {
                    ephemeral: true,
                })
                return
            }

            // Check if a specific subcommand is requested
            if (subCommandName) {
                const subcommand = command.data.options
                    ?.filter(opt => opt.toJSON().type === ApplicationCommandOptionType.Subcommand)
                    .find(opt => opt.toJSON().name === subCommandName) as SlashCommandSubcommandBuilder | undefined;


                if (!subcommand) {
                    const embed = client.embed.createMessageEmbedWithAuthor(
                        `⛔ Subcommand \`${subCommandName}\` not found for command \`/${mainCommandName}\`.`,
                        member,
                        EMBEDTYPE.ERROR
                    );
                    await client.interaction.replyEmbed(interaction, embed, { ephemeral: true });
                    return;
                }
                const subJson = subcommand.toJSON()
                const embed = client.embed
                    .createMessageEmbedWithAuthor(subJson.description, member, EMBEDTYPE.GLOBAL)
                    .setTitle(`Subcommand: /${mainCommandName} ${subJson.name}`)
                    .addFields({
                        name: 'Usage',
                        value: `\`${getUsage(mainCommandName, subJson)}\``, // Pass subcommand JSON to getUsage
                    });
                await client.interaction.replyEmbed(interaction, embed, { ephemeral: true });
            } else {
                // Display help for the main command
                const embed = client.embed
                    .createMessageEmbedWithAuthor(command.data.description, member, EMBEDTYPE.GLOBAL)
                    .setTitle(`Command: /${command.data.name}`);

                embed.addFields({
                    name: 'Usage',
                    value: `\`${getUsage(command.data.name, command.data)}\``,
                });

                const subcommands = command.data.options?.filter(
                    (option) => option.toJSON().type === ApplicationCommandOptionType.Subcommand
                );

                if (subcommands && subcommands.length > 0) {
                    const subcommandsString = subcommands
                        .map((sub) => {
                            const subJson = sub.toJSON();
                            return `> \`/${command.data.name} ${subJson.name}\` - ${subJson.description}`;
                        })
                        .join('\n');
                    embed.addFields({
                        name: 'Subcommands',
                        value: subcommandsString,
                    });
                    embed.setFooter({
                        text: 'Use `/help command/subcommand` for details on a specific subcommand.',
                    });
                }
                await client.interaction.replyEmbed(interaction, embed, { ephemeral: true });
            }
        } else {
            // User wants the main help menu
            const embed = client.embed
                .createMessageEmbedWithAuthor(
                    'Hello! Here are all the things I can do for you. \nUse `/help <command>` for more details on a specific command.',
                    member,
                    EMBEDTYPE.GLOBAL
                )
                .setTitle("Mika's Command List")

            // Categorize commands (assuming a 'category' property exists on the Command class or can be derived)
            // This part needs adjustment based on how categories are defined for commands.
            // For now, we'll group them by a simple heuristic or a default category.
            const categorizedCommands: Record<string, string[]> = {}
            commands.forEach((cmd) => {
                // Attempt to get category from command object (e.g., cmd.category)
                // If not available, use a default or derive from path
                const category = cmd.category || 'General' // Fallback category
                if (!categorizedCommands[category]) {
                    categorizedCommands[category] = []
                }
                categorizedCommands[category].push(`\`${cmd.data.name}\``)
            })

            for (const category in categorizedCommands) {
                embed.addFields({
                    name: `••• ${category} Commands •••`,
                    value: categorizedCommands[category].join(' '),
                })
            }

            await client.interaction.replyEmbed(interaction, embed, {
                ephemeral: true,
            })
        }
    }

    // TODO: Add a `category` property to the Command class
    // For now, category is hardcoded in the command itself or defaults to 'General'
    private getCommandCategory(command: Command): string {
        return command.category || 'General';
    }


    private populateCommandChoices(client: Mika) {
        const commandOption = this.data.options.find(opt => opt.toJSON().name === 'command');
        if (commandOption && commandOption.toJSON().type === ApplicationCommandOptionType.String) {
            const choices = [];
            client.commands.forEach(cmd => {
                choices.push({ name: cmd.data.name, value: cmd.data.name });
                const subcommands = cmd.data.options?.filter(
                    option => option.toJSON().type === ApplicationCommandOptionType.Subcommand
                );
                subcommands?.forEach(sub => {
                    const subJson = sub.toJSON();
                    choices.push({ name: `${cmd.data.name}/${subJson.name}`, value: `${cmd.data.name}/${subJson.name}` });
                });
            });
            // @ts-expect-error choices is not directly assignable
            commandOption.setChoices(...choices.slice(0, 25)); // Discord limits choices to 25
        }
    }

    async command(client: Mika, interaction: ChatInputCommandInteraction) {
        const member = interaction.member as GuildMember;
        const commandInput = interaction.options.getString('command');

        this.populateCommandChoices(client);

        if (commandInput) {
            await this.sendSpecificCommandHelp(client, interaction, commandInput, member);
        } else {
            await this.sendGeneralHelp(client, interaction, member);
        }
    }

    private async sendSpecificCommandHelp(client: Mika, interaction: ChatInputCommandInteraction, commandInput: string, member: GuildMember) {
        let mainCommandName = commandInput;
        let subCommandName: string | null = null;

        if (commandInput.includes('/')) {
            [mainCommandName, subCommandName] = commandInput.split('/');
        }

        const command = client.commands.get(mainCommandName);

        if (!command) {
            const embed = client.embed.createMessageEmbedWithAuthor(
                `⛔ The command \`${mainCommandName}\` was not found.`,
                member,
                EMBEDTYPE.ERROR
            );
            await client.interaction.replyEmbed(interaction, embed, { ephemeral: true });
            return;
        }

        if (subCommandName) {
            await this.sendSubcommandHelp(client, interaction, command, subCommandName, member);
        } else {
            await this.sendMainCommandHelp(client, interaction, command, member);
        }
    }

    private async sendMainCommandHelp(client: Mika, interaction: ChatInputCommandInteraction, command: Command, member: GuildMember) {
        const embed = client.embed
            .createMessageEmbedWithAuthor(command.data.description, member, EMBEDTYPE.GLOBAL)
            .setTitle(`Command: /${command.data.name}`);

        embed.addFields({
            name: 'Usage',
            value: `\`${getUsage(command.data.name, command.data)}\``,
        });

        const subcommands = command.data.options?.filter(
            (option) => option.toJSON().type === ApplicationCommandOptionType.Subcommand
        );

        if (subcommands && subcommands.length > 0) {
            const subcommandsString = subcommands
                .map((sub) => {
                    const subJson = sub.toJSON();
                    return `> \`/${command.data.name} ${subJson.name}\` - ${subJson.description}`;
                })
                .join('\n');
            embed.addFields({
                name: 'Subcommands',
                value: subcommandsString,
            });
            embed.setFooter({
                text: 'Use `/help command/subcommand` for details on a specific subcommand.',
            });
        }
        await client.interaction.replyEmbed(interaction, embed, { ephemeral: true });
    }

    private async sendSubcommandHelp(client: Mika, interaction: ChatInputCommandInteraction, command: Command, subCommandName: string, member: GuildMember) {
        const subcommand = command.data.options
            ?.filter(opt => opt.toJSON().type === ApplicationCommandOptionType.Subcommand)
            .find(opt => opt.toJSON().name === subCommandName) as SlashCommandSubcommandBuilder | undefined;

        if (!subcommand) {
            const embed = client.embed.createMessageEmbedWithAuthor(
                `⛔ Subcommand \`${subCommandName}\` not found for command \`/${command.data.name}\`.`,
                member,
                EMBEDTYPE.ERROR
            );
            await client.interaction.replyEmbed(interaction, embed, { ephemeral: true });
            return;
        }
        const subJson = subcommand.toJSON();
        const embed = client.embed
            .createMessageEmbedWithAuthor(subJson.description, member, EMBEDTYPE.GLOBAL)
            .setTitle(`Subcommand: /${command.data.name} ${subJson.name}`)
            .addFields({
                name: 'Usage',
                value: `\`${getUsage(command.data.name, subJson)}\``,
            });
        await client.interaction.replyEmbed(interaction, embed, { ephemeral: true });
    }

    private async sendGeneralHelp(client: Mika, interaction: ChatInputCommandInteraction, member: GuildMember) {
        const embed = client.embed
            .createMessageEmbedWithAuthor(
                'Hello! Here are all the things I can do for you. \nUse `/help <command>` for more details on a specific command.',
                member,
                EMBEDTYPE.GLOBAL
            )
            .setTitle("Mika's Command List");

        const categorizedCommands: Record<string, string[]> = {};
        client.commands.forEach((cmd) => {
            const category = this.getCommandCategory(cmd);
            if (!categorizedCommands[category]) {
                categorizedCommands[category] = [];
            }
            categorizedCommands[category].push(`\`${cmd.data.name}\``);
        });

        for (const category in categorizedCommands) {
            embed.addFields({
                name: `••• ${category} Commands •••`,
                value: categorizedCommands[category].join(' '),
            });
        }

        await client.interaction.replyEmbed(interaction, embed, { ephemeral: true });
    }
}

export default Help;
