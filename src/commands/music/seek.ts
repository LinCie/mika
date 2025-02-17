import {
	type GuildMember,
	type CommandInteraction,
	ApplicationCommandOptionType,
} from "discord.js";
import { Discord, Guard, Slash, SlashOption } from "discordx";
import {
	DeferReply,
	IsInVoiceChannel,
	IsPlayerExist,
	IsPlayerCurrent,
} from "@/guards";
import {
	EMBEDTYPE,
	PlayerState,
	type Mika,
	type PlayerManager,
} from "@/instances";

@Discord()
class Seek {
	@Slash({ description: "Change the position of current track" })
	@Guard(DeferReply, IsInVoiceChannel, IsPlayerExist, IsPlayerCurrent)
	async seek(
		@SlashOption({
			name: "position",
			description: "The position of the music (in seconds)",
			required: true,
			type: ApplicationCommandOptionType.Number,
		})
		position: number,

		interaction: CommandInteraction,
		client: Mika,
		data: { player: PlayerManager; member: GuildMember },
	) {
		const { player, member } = data;
		const current = player.queue.getCurrent();
		const positionInSeconds = position * 1000;

		if (positionInSeconds > current?.info.length! || positionInSeconds < 0) {
			const embed = client.embed.createMessageEmbedWithAuthor(
				"⛔ Music position is out of range ⛔",
				member,
				EMBEDTYPE.ERROR,
			);

			return await client.interaction.replyEmbed(interaction, embed);
		}

		await player.seekMusic(positionInSeconds);
		const embed = client.embed.createMessageEmbedWithAuthor(
			`🎶 Music position has been changed to **${position}** seconds 🎶`,
			member,
			EMBEDTYPE.SUCCESS,
		);
		await client.interaction.replyEmbed(interaction, embed);
	}
}

export { Seek };
