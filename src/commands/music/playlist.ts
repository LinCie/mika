import {
	type GuildMember,
	type CommandInteraction,
	ApplicationCommandOptionType,
} from "discord.js";
import {
	Discord,
	Guard,
	Slash,
	SlashChoice,
	SlashGroup,
	SlashOption,
} from "discordx";
import {
	EMBEDTYPE,
	LoopState,
	type Mika,
	type PlayerManager,
} from "@/instances";
import {
	DeferReply,
	IsInVoiceChannel,
	IsPlayerExist,
	IsPlayerCurrent,
} from "@/guards";

@Discord()
@SlashGroup({ name: "playlist", description: "Playlist Manager" })
@SlashGroup("playlist")
class Playlist {
	@Slash({ description: "Create a playlist" })
	@Guard(DeferReply)
	async create(
		@SlashOption({
			name: "name",
			description: "The playlist name",
			required: true,
			type: ApplicationCommandOptionType.String,
		})
		name: string,

		interaction: CommandInteraction,
		client: Mika,
	) {
		const member = interaction.member as GuildMember;
		try {
			const playlist = await client.playlist.createPlaylist(name, member);
			const embed = client.embed.createMessageEmbedWithAuthor(
				`Created playlist with name \'${playlist.name}\'`,
				member,
				EMBEDTYPE.SUCCESS,
			);
			await client.interaction.replyEmbed(interaction, embed);
		} catch (error) {
			client.pino.error(error);
			const embed = client.embed.createMessageEmbedWithAuthor(
				"There is an error while adding playlist",
				member,
				EMBEDTYPE.ERROR,
			);
			await client.interaction.replyEmbed(interaction, embed);
		}
	}
}

export { Playlist };
