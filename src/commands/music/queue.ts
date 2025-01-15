import {
	type GuildMember,
	type CommandInteraction,
	type ButtonInteraction,
	ButtonBuilder,
	ButtonStyle,
	ActionRowBuilder,
	type MessageActionRowComponentBuilder,
} from "discord.js";
import { ButtonComponent, Discord, Guard, Slash } from "discordx";
import type { Track } from "shoukaku";
import { DeferReply, IsPlayerExist } from "@/guards";
import { EMBEDTYPE, type Mika, type PlayerManager } from "@/instances";

@Discord()
class Queue {
	private tracks: Track[] = [];
	private page = 1;
	private get pages(): number {
		return Math.ceil(this.tracks.length / 10) || 1;
	}

	@ButtonComponent({ id: "next_queue" })
	async nextQueue(interaction: ButtonInteraction, client: Mika) {
		const member = interaction.member as GuildMember;

		if (this.page < this.pages) {
			this.page++;
			await this.updateQueueMessage(interaction, client, member);
		} else {
			await interaction.deferUpdate();
		}
	}

	@ButtonComponent({ id: "previous_queue" })
	async previousQueue(interaction: ButtonInteraction, client: Mika) {
		const member = interaction.member as GuildMember;

		if (this.page > 1) {
			this.page--;
			await this.updateQueueMessage(interaction, client, member);
		} else {
			await interaction.deferUpdate();
		}
	}

	@Slash({ description: "Show current queue" })
	@Guard(DeferReply, IsPlayerExist)
	async queue(
		interaction: CommandInteraction,
		client: Mika,
		data: { player: PlayerManager; member: GuildMember },
	) {
		const { player } = data;

		this.tracks = player.queue.getTracks();
		this.page = 1;

		await this.updateQueueMessage(interaction, client, data.member);
	}

	private async updateQueueMessage(
		interaction: CommandInteraction | ButtonInteraction,
		client: Mika,
		member: GuildMember,
	) {
		const startIndex = (this.page - 1) * 10;
		const endIndex = startIndex + 10;
		const currentTracks = this.tracks.slice(startIndex, endIndex);

		const nextButton = new ButtonBuilder()
			.setStyle(ButtonStyle.Primary)
			.setCustomId("next_queue")
			.setDisabled(this.page >= this.pages)
			.setEmoji("⏭️");

		const previousButton = new ButtonBuilder()
			.setStyle(ButtonStyle.Primary)
			.setCustomId("previous_queue")
			.setDisabled(this.page <= 1)
			.setEmoji("⏮️");

		const buttonRow =
			new ActionRowBuilder<MessageActionRowComponentBuilder>().addComponents(
				previousButton,
				nextButton,
			);

		const guildName = interaction.guild?.name || "Server";
		const queueContent =
			currentTracks
				.map(
					(track, index) =>
						`${startIndex + index + 1}. [${track.info.title}](${track.info.uri}) ~ ${track.info.author}`,
				)
				.join("\n") || "No tracks in the queue.";

		const embedDescription = `### ${guildName}'s Queue\n\n${queueContent}\n-# Page ${this.page} of ${this.pages}`;

		const embed = client.embed
			.createMessageEmbedWithAuthor(embedDescription, member!, EMBEDTYPE.GLOBAL)
			.setThumbnail(interaction.guild?.iconURL()!);

		await client.interaction.replyEmbedWithButton(
			interaction,
			embed,
			buttonRow,
		);
	}
}

export { Queue };
