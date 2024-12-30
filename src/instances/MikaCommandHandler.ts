import { readdirSync, statSync } from "node:fs";
import path from "node:path";
import type {
	CommandInteraction,
	RESTPostAPIChatInputApplicationCommandsJSONBody,
} from "discord.js";
import type { Mika } from "@/instances";
import { MikaCommands } from "@/instances";

class MikaCommandHandler {
	private commands: Map<string, typeof MikaCommands> = new Map();
	private commandDataArray: RESTPostAPIChatInputApplicationCommandsJSONBody[] =
		[];

	constructor(private client: Mika) {}

	// Recursively load all commands from the specified directory
	loadCommands(commandsPath: string): void {
		const loadDirectory = (dir: string): void => {
			const entries = readdirSync(dir);

			for (const entry of entries) {
				const entryPath = path.join(dir, entry);
				const stats = statSync(entryPath);

				if (stats.isDirectory()) {
					// Recurse into subdirectories
					loadDirectory(entryPath);
				} else if (
					stats.isFile() &&
					(entry.endsWith(".js") || entry.endsWith(".ts"))
				) {
					// Import the command file
					const commandModule = require(entryPath);
					const CommandClass = commandModule.default;
					const { data } = commandModule;

					if (!CommandClass || !data) {
						this.client.logger.warn(
							`Command file ${entryPath} is missing a default export or data.`,
						);
						continue;
					}

					// Ensure the class extends MikaCommands
					if (CommandClass.prototype instanceof MikaCommands) {
						this.commands.set(data.name, CommandClass);
						this.commandDataArray.push(data);
						this.client.logger.info(
							`Command /${data.name} has been loaded successfully`,
						);
					} else {
						this.client.logger.warn(
							`Command file ${entryPath} does not export a valid subclass of MikaCommands.`,
						);
					}
				}
			}
		};

		loadDirectory(commandsPath);
	}

	// Get all command data
	getCommandDataArray(): RESTPostAPIChatInputApplicationCommandsJSONBody[] {
		return this.commandDataArray;
	}

	// Handle command execution
	async runCommand(interaction: CommandInteraction): Promise<void> {
		const commandName = interaction.commandName;
		const CommandClass = this.commands.get(commandName);

		if (!CommandClass) {
			console.error(`No command found for: ${commandName}`);
			await interaction.reply({
				content: `Command "${commandName}" is not implemented.`,
				ephemeral: true,
			});
			return;
		}

		try {
			const commandInstance = new CommandClass(this.client, interaction);
			await commandInstance.run();
		} catch (error) {
			this.client.logger.error(
				`Error executing command ${commandName}:`,
				error,
			);
			await interaction.reply({
				content: `An error occurred while executing "${commandName}".`,
				ephemeral: true,
			});
		}
	}
}

export { MikaCommandHandler };
