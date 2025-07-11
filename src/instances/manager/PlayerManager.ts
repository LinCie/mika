import type {
    ChatInputCommandInteraction,
    Guild,
    GuildMember,
    TextChannel,
    VoiceBasedChannel,
    VoiceState,
} from 'discord.js'
import {
    LoadType,
    type Player,
    type Track,
    type TrackStartEvent,
} from 'shoukaku'
import type { Mika } from '../Mika'
import { QueueManager, QUEUEEVENT } from './QueueManager'
import { EMBEDTYPE } from './EmbedManager'

enum PLAYERSTATE {
    Idle = 'idle',
    Playing = 'playing',
    Changing = 'changing',
    Stopping = 'stopping',
    Paused = 'paused',
}

enum LOOPSTATE {
    LoopingNone = 'loopingNone',
    LoopingCurrent = 'loopingCurrent',
    LoopingQueue = 'loopingQueue',
}

class PlayerManager {
    private readonly client: Mika
    private leaveTimer: Timer | undefined
    public readonly guild: Guild
    public readonly channel: TextChannel
    public readonly queue: QueueManager
    public player: Player | undefined
    public voice: VoiceBasedChannel | undefined
    public state: PLAYERSTATE
    public loopState: LOOPSTATE
    public volume = 50

    constructor(client: Mika, interaction: ChatInputCommandInteraction) {
        this.client = client
        this.guild = interaction.guild!
        this.channel = this.client.channels.cache.get(
            interaction.channel?.id || ''
        ) as TextChannel
        this.state = PLAYERSTATE.Idle
        this.loopState = LOOPSTATE.LoopingNone

        // Queue
        this.queue = new QueueManager()
        this.queue.on(QUEUEEVENT.TRACK_ADDED, async (track: Track) => {
            if (this.state === PLAYERSTATE.Idle) {
                if (this.queue.current === this.queue.getLength() - 2) {
                    await this.playMusic(this.queue.playNext()!)
                } else {
                    await this.playMusic(track)
                }
            }
        })
        this.queue.on(QUEUEEVENT.TRACKS_ADDED, async (tracks: Array<Track>) => {
            if (this.state === PLAYERSTATE.Idle) {
                if (
                    this.queue.current ===
                    this.queue.getLength() - tracks.length - 1
                ) {
                    await this.playMusic(this.queue.playNext()!)
                } else {
                    await this.playMusic(tracks[0])
                }
            }
        })
    }

    public async init(
        interaction: ChatInputCommandInteraction
    ): Promise<PlayerManager> {
        const member = interaction.member as GuildMember

        this.player = await this.client.shoukaku.joinVoiceChannel({
            guildId: interaction.guild?.id || '',
            channelId: member?.voice.channel?.id || '',
            shardId: 0,
            deaf: true,
        })
        this.client.players.set(this.guild.id, this)
        this.voice = member.voice.channel!

        this.player?.on('start', async (data) => {
            this.handleTimerExist()
            await this.handleOnPlayerStart(data)
        })

        this.player?.on('end', async () => {
            this.handleTimerExist()

            if (this.state !== PLAYERSTATE.Stopping) {
                if (this.loopState === LOOPSTATE.LoopingCurrent) {
                    await this.handleLoopingCurrent()
                } else if (this.queue.current < this.queue.getLength() - 1) {
                    await this.handlePlayNext()
                } else if (this.queue.current === this.queue.getLength() - 1) {
                    await this.handleLastTrack()
                }
            }
        })

        this.player?.on('closed', async () => {
            this.state = PLAYERSTATE.Stopping
            this.handleTimerExist()
            await this.handleOnPlayerClosed()
        })

        this.handleVoiceStateChange()

        return this
    }

    // Getter

    private getNode() {
        const node = this.client.shoukaku.options.nodeResolver(
            this.client.shoukaku.nodes
        )
        if (!node) {
            this.client.logger.error('No node was found')
            return
        }
        return node
    }

    private getSearchQuery(query: string, method: string) {
        let search = query

        try {
            // Check if query is a valid URL
            new URL(query)
        } catch {
            search = `${method}:${query}`
        }

        return search
    }

    public getNextPlaying(): Track | undefined {
        let next: Track | undefined
        switch (this.loopState) {
            case LOOPSTATE.LoopingCurrent: {
                next = this.queue.getCurrent()
                break
            }

            case LOOPSTATE.LoopingQueue: {
                const nextTrack = this.queue.getNext()
                if (nextTrack) {
                    next = nextTrack
                } else {
                    next = this.queue.getTrack(0)
                }
                break
            }
            default: {
                next = this.queue.getNext()
                break
            }
        }

        return next
    }

    // Utils

    public async leaveVoiceChannel() {
        await this.client.shoukaku.leaveVoiceChannel(this.guild.id!)
    }

    public async searchMusic(query: string, method: string) {
        const node = this.getNode()
        const search = this.getSearchQuery(query, method)
        return await node?.rest.resolve(search)
    }

    public async playMusic(track: Track) {
        await this.player?.playTrack({
            volume: this.volume,
            track: { encoded: track.encoded },
        })
    }

    public async skipMusic() {
        this.state = PLAYERSTATE.Changing
        await this.player?.stopTrack()
    }

    public async moveTrack(position: number) {
        this.state = PLAYERSTATE.Changing
        this.queue.setCurrent(position - 1)
        await this.player?.stopTrack()
    }

    public async pauseMusic() {
        this.state = PLAYERSTATE.Paused
        await this.player?.setPaused(true)
    }

    public async resumeMusic() {
        this.state = PLAYERSTATE.Playing
        await this.player?.setPaused(false)
    }

    public async seekMusic(position: number) {
        await this.player?.update({ position })
    }

    public async stopPlayer() {
        this.state = PLAYERSTATE.Stopping
        await this.player?.destroy()
    }

    public async removePlayer(): Promise<void> {
        this.client.players.delete(this.guild.id)
        await this.leaveVoiceChannel()
        this.queue.destroy()
        this.cleanup()
        this.handleTimerExist()
        this.player?.removeAllListeners()
    }

    public async changeVolume(volume: number): Promise<void> {
        this.volume = volume
        await this.player?.setGlobalVolume(volume)
    }

    public async addMusic(
        query: string,
        method: string,
        interaction: ChatInputCommandInteraction
    ) {
        const result = await this.searchMusic(query, method)
        const member = interaction.member as GuildMember

        switch (result?.loadType) {
            case LoadType.SEARCH: {
                const track = result.data.shift()
                if (track) {
                    this.queue.addTrack(track)
                    const embed = this.client.embed.createAddTrackEmbed(
                        track,
                        member
                    )
                    await this.client.interaction.replyEmbed(interaction, embed)
                }
                break
            }

            case LoadType.TRACK: {
                const track = result.data
                if (track) {
                    this.queue.addTrack(track)
                    const embed = this.client.embed.createAddTrackEmbed(
                        track,
                        member
                    )
                    await this.client.interaction.replyEmbed(interaction, embed)
                }
                break
            }

            case LoadType.PLAYLIST: {
                const tracks = result.data.tracks
                if (tracks) {
                    this.queue.addTracks(tracks)
                    const embed = this.client.embed.createAddPlaylistEmbed(
                        tracks,
                        result,
                        member
                    )
                    await this.client.interaction.replyEmbed(interaction, embed)
                }
                break
            }

            case LoadType.EMPTY: {
                const embed = this.client.embed.createMessageEmbed(
                    `⛔ No result found with query **${query}** ⛔`,
                    EMBEDTYPE.ERROR
                )
                await this.client.interaction.replyEmbed(interaction, embed, {
                    ephemeral: true,
                })
                break
            }

            case LoadType.ERROR: {
                const embed = this.client.embed.createMessageEmbed(
                    '⛔ An error had occured. Please try again later </3 ⛔',
                    EMBEDTYPE.ERROR
                )
                await this.client.interaction.replyEmbed(interaction, embed, {
                    ephemeral: true,
                })
                this.client.logger.error(result.data.message, result.data.cause)
                break
            }
        }
    }

    public async getSearchResult(query: string, method: string) {
        const result = await this.searchMusic(query, method)

        switch (result?.loadType) {
            case LoadType.SEARCH: {
                const tracks = result.data.slice(0, 10)
                return tracks
            }

            case LoadType.TRACK: {
                const track = result.data
                return [track]
            }

            case LoadType.PLAYLIST: {
                const tracks = result.data.tracks.slice(0, 10)
                return tracks
            }

            default: {
                return
            }
        }
    }

    public async changeMusicSource(query: string, method: string) {
        const result = await this.searchMusic(query, method)
        switch (result?.loadType) {
            case LoadType.SEARCH: {
                const tracks = result.data.slice(0, 10)
                return tracks.shift()
            }

            default: {
                return
            }
        }
    }

    private cleanup() {
        this.client.off('voiceStateUpdate', this.voiceStateHandler)
    }

    // Handles

    private async handleLoopingCurrent(): Promise<void> {
        await this.playMusic(this.queue.getCurrent()!)
    }

    private async handleLoopingQueue(): Promise<void> {
        this.queue.resetQueue()
        await this.playMusic(this.queue.playCurrent()!)
    }

    private async handlePlayNext(): Promise<void> {
        const track = this.queue.playNext()
        if (track) await this.playMusic(track)
    }

    private async handleLastTrack(): Promise<void> {
        if (this.loopState === LOOPSTATE.LoopingQueue) {
            await this.handleLoopingQueue()
        } else {
            this.state = PLAYERSTATE.Idle

            const time = `<t:${Math.floor(Date.now() / 1000) + 120}:R>`
            const embed = this.client.embed.createMessageEmbed(
                `⚠️ Queue is currently empty, leaving voice channel ${time} if no new track is added ⚠️`,
                EMBEDTYPE.WARNING
            )
            await this.channel.send({ embeds: [embed] })

            this.leaveTimer = setTimeout(async () => {
                await this.stopPlayer()
            }, 120000)
            this.player?.once('start', () => {
                this.handleTimerExist()
            })
        }
    }

    private async handleOnPlayerStart(data: TrackStartEvent): Promise<void> {
        this.state = PLAYERSTATE.Playing
        const next = this.getNextPlaying()
        const embed = this.client.embed.createPlayingEmbed(data.track, next)
        await this.channel.send({ embeds: [embed] })
    }

    private async handleOnPlayerClosed(): Promise<void> {
        const exit = this.client.embed.createMessageEmbed(
            '🎶 Leaving voice channel! Thanks for using Mika! 🎶',
            EMBEDTYPE.GLOBAL
        )
        const invite = this.client.embed.createMessageEmbed(
            'Are you looking to invite Mika in your server? Check out my [invite link](https://discord.com/oauth2/authorize?client_id=1312578502851035166&permissions=3148800&integration_type=0&scope=bot) ☆',
            EMBEDTYPE.GLOBAL
        )
        await this.channel.send({ embeds: [exit, invite] })
        await this.removePlayer()
    }

    private async handleTimerExist() {
        if (this.leaveTimer) {
            clearTimeout(this.leaveTimer)
            this.leaveTimer = undefined
        }
    }

    private async handleNoUser() {
        if (this.state === PLAYERSTATE.Idle) {
            return
        }

        await this.pauseMusic()

        const time = `<t:${Math.floor(Date.now() / 1000) + 120}:R>`
        const embed = this.client.embed.createMessageEmbed(
            `⚠️ There is currently no one in the voice channel. I will leave the voice channel ${time} if no one enters the voice channel ⚠️`,
            EMBEDTYPE.WARNING
        )

        await this.channel.send({ embeds: [embed] })
        this.leaveTimer = setTimeout(async () => {
            await this.stopPlayer()
        }, 120000)
    }

    private async handleUserRejoin() {
        this.handleTimerExist()
        await this.resumeMusic()
        const current = this.queue.getCurrent()
        const embed = this.client.embed.createMessageEmbed(
            `🎶 Welcome back! Resuming **${current?.info.title}** 🎶`,
            EMBEDTYPE.GLOBAL
        )
        await this.channel.send({ embeds: [embed] })
    }

    private handleVoiceStateChange() {
        this.client.on('voiceStateUpdate', this.voiceStateHandler)
    }

    // Handler

    private voiceStateHandler = async (
        oldState: VoiceState,
        newState: VoiceState
    ) => {
        // Only process events for a specific guild
        const targetGuildId = this.voice?.guild.id
        if (
            oldState.guild.id !== targetGuildId &&
            newState.guild.id !== targetGuildId
        ) {
            return
        }

        const member = oldState.member || newState.member
        if (!member || member.user.bot) return

        const oldChannel = oldState.channel
        const newChannel = newState.channel

        // --- Handle a user leaving a channel ---
        if (oldChannel && (!newChannel || oldChannel.id !== newChannel.id)) {
            if (oldChannel.id !== this.voice?.id) return

            if (member.user.id === this.client.user?.id) {
                if (newChannel) {
                    this.voice = newChannel
                }
            }

            const nonBotMembersOld = oldChannel.members.filter(
                (m) => !m.user.bot
            )
            if (nonBotMembersOld.size === 0) {
                await this.handleNoUser()
            }
        }

        // --- Handle a user joining a channel ---
        if (newChannel && (!oldChannel || oldChannel.id !== newChannel.id)) {
            if (newChannel.id !== this.voice?.id) return
            const nonBotMembersNew = newChannel.members.filter(
                (m) => !m.user.bot
            )
            if (nonBotMembersNew.size === 1) {
                await this.handleUserRejoin()
            }
        }
    }
}

export { PlayerManager, PLAYERSTATE, LOOPSTATE }
