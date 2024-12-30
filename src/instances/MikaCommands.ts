import type { CommandInteraction } from "discord.js";
import type { Mika } from "./Mika";

type MikaCommandOptions = {
	isGuarded?: boolean;
	isDeferred?: boolean;
};
type GuardFunction = () => Promise<void>;

/**
 * The MikaCommands class is an abstract base class that represents a command in a Discord bot.
 * It provides a structure for commands to be executed, with optional guards and deferrable interactions.
 */
class MikaCommands {
	public readonly client: Mika;
	public readonly interaction: CommandInteraction;
	public commandOptions?: MikaCommandOptions;
	private guards: GuardFunction[];

	/**
	 * @param client The Mika client.
	 * @param interaction The interaction which triggered this command.
	 * @param data The data of the command.
	 * @param options Optional options for the command.
	 */
	constructor(
		client: Mika,
		interaction: CommandInteraction,
		options?: MikaCommandOptions,
	) {
		this.client = client;
		this.interaction = interaction;
		this.commandOptions = options;
		this.guards = [];
	}

	/**
	 * Adds a guard to the command.
	 *
	 * A guard is a function that will be called before the main logic of the command.
	 * If the guard throws an error, the command will be cancelled and the error will be logged.
	 *
	 * @param {GuardFunction} guard The guard to add.
	 */
	addGuard(guard: GuardFunction): void {
		this.guards.push(guard);
	}

	async main(): Promise<void> {
		return;
	}

	/**
	 * Runs the command.
	 *
	 * If the command is deferred, it will defer the interaction reply.
	 * If the command is guarded, it will run all the guards before running the main logic.
	 * Finally, it will run the main logic.
	 */
	async run(): Promise<void> {
		if (this.commandOptions?.isDeferred) {
			await this.interaction.deferReply();
		}

		if (this.commandOptions?.isGuarded) {
			for (const guard of this.guards) {
				await guard();
			}
		}
		await this.main();
	}
}

export { MikaCommands, type MikaCommandOptions };
