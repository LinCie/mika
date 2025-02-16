import {
	type GuildMember,
	type CommandInteraction,
	type EmbedBuilder,
	type ButtonInteraction,
	ApplicationCommandOptionType,
	ButtonBuilder,
	ButtonStyle,
	ActionRowBuilder,
	type MessageActionRowComponentBuilder,
} from "discord.js";
import {
	ButtonComponent,
	Discord,
	Guard,
	Slash,
	SlashGroup,
	SlashOption,
} from "discordx";
import { Prisma } from "@prisma/client";
import type { Track } from "shoukaku";
import { EMBEDTYPE, type Mika } from "@/instances";
import { DeferReply } from "@/guards";

@Discord()
@SlashGroup({ name: "playlist", description: "Playlist Manager" })
@SlashGroup("playlist")
class Playlist {
	private playlistName = "Playlist";
	private tracks: Track[] = [];
	private page = 1;
	private get pages(): number {
		return Math.ceil(this.tracks.length / 10) || 1;
	}

	@ButtonComponent({ id: "next_list" })
	async nextList(interaction: ButtonInteraction, client: Mika) {
		const member = interaction.member as GuildMember;

		if (this.page < this.pages) {
			this.page++;
			await this.updateListMessage(interaction, client, member);
		} else {
			await interaction.deferUpdate();
		}
	}

	@ButtonComponent({ id: "previous_list" })
	async previousList(interaction: ButtonInteraction, client: Mika) {
		const member = interaction.member as GuildMember;

		if (this.page > 1) {
			this.page--;
			await this.updateListMessage(interaction, client, member);
		} else {
			await interaction.deferUpdate();
		}
	}

	@Slash({ description: "Get a playlist" })
	@Guard(DeferReply)
	async get(
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
			const playlist = await client.playlist.getPlaylistByName(
				name.toLowerCase(),
			);

			this.tracks = JSON.parse(playlist.musics);
			this.page = 1;
			this.playlistName = playlist.name;

			await this.updateListMessage(interaction, client, member);
		} catch (error) {
			client.pino.error(error);

			let embed: EmbedBuilder = client.embed.createMessageEmbedWithAuthor(
				`⛔ There is an error while trying to get playlist **${name}** ⛔`,
				member,
				EMBEDTYPE.ERROR,
			);

			if (error instanceof Prisma.PrismaClientKnownRequestError) {
				if (error.code === "P2025") {
					embed = client.embed.createMessageEmbedWithAuthor(
						`⛔ Playlist **${name}** doesn't exist ⛔`,
						member,
						EMBEDTYPE.ERROR,
					);
				}
			}

			await client.interaction.replyEmbed(interaction, embed, {
				ephemeral: true,
			});
		}
	}

	private async updateListMessage(
		interaction: CommandInteraction | ButtonInteraction,
		client: Mika,
		member: GuildMember,
	) {
		const startIndex = (this.page - 1) * 10;
		const endIndex = startIndex + 10;
		const currentTracks = this.tracks.slice(startIndex, endIndex);

		const nextButton = new ButtonBuilder()
			.setStyle(ButtonStyle.Primary)
			.setCustomId("next_list")
			.setDisabled(this.page >= this.pages)
			.setEmoji("⏭️");

		const previousButton = new ButtonBuilder()
			.setStyle(ButtonStyle.Primary)
			.setCustomId("previous_list")
			.setDisabled(this.page <= 1)
			.setEmoji("⏮️");

		const buttonRow =
			new ActionRowBuilder<MessageActionRowComponentBuilder>().addComponents(
				previousButton,
				nextButton,
			);

		const listContent =
			currentTracks
				.map(
					(track, index) =>
						`${startIndex + index + 1}. [${track.info.title}](${track.info.uri}) ~ ${track.info.author}`,
				)
				.join("\n") || "No tracks in the playlist.";

		const embedDescription = `### ${this.playlistName}'s Tracks\n\n${listContent}\n-# Page ${this.page} of ${this.pages}`;

		const embed = client.embed
			.createMessageEmbedWithAuthor(embedDescription, member!, EMBEDTYPE.GLOBAL)
			.setThumbnail(member.displayAvatarURL());

		await client.interaction.replyEmbedWithButton(
			interaction,
			embed,
			buttonRow,
		);
	}
}

export { Playlist };
