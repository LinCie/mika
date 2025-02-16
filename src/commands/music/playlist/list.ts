import {
	type GuildMember,
	type CommandInteraction,
	type EmbedBuilder,
	type ButtonInteraction,
	ButtonBuilder,
	ButtonStyle,
	ActionRowBuilder,
	type MessageActionRowComponentBuilder,
} from "discord.js";
import { ButtonComponent, Discord, Guard, Slash, SlashGroup } from "discordx";
import type { Playlist as PlaylistType } from "@prisma/client";
import { EMBEDTYPE, type Mika } from "@/instances";
import { DeferReply } from "@/guards";

@Discord()
@SlashGroup({ name: "playlist", description: "Playlist Manager" })
@SlashGroup("playlist")
class Playlist {
	private playlists: PlaylistType[] = [];
	private page = 1;
	private get pages(): number {
		return Math.ceil(this.playlists.length / 10) || 1;
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

	@Slash({ description: "List your playlists" })
	@Guard(DeferReply)
	async list(interaction: CommandInteraction, client: Mika) {
		const member = interaction.member as GuildMember;

		try {
			const playlists = await client.playlist.getUserPlaylists(member);

			this.playlists = playlists;
			this.page = 1;

			await this.updateListMessage(interaction, client, member);
		} catch (error) {
			client.pino.error(error);

			const embed: EmbedBuilder = client.embed.createMessageEmbedWithAuthor(
				"⛔ There is an error while trying to get playlists ⛔",
				member,
				EMBEDTYPE.ERROR,
			);

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
		const currentTracks = this.playlists.slice(startIndex, endIndex);

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
					(playlist, index) =>
						`${startIndex + index + 1}. **${playlist.name}** ~ ${this.playlists.length} tracks`,
				)
				.join("\n") || "You have no playlist";

		const embedDescription = `### ${member.displayName}'s Playlists\n\n${listContent}\n-# Page ${this.page} of ${this.pages}`;

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
