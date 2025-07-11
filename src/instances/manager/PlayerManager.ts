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

export enum PLAYERSTATE {
    Idle = 'idle',
    Playing = 'playing',
    Changing = 'changing',
    Stopping = 'stopping',
    Paused = 'paused',
}

export enum LOOPSTATE {
    LoopingNone = 'loopingNone',
    LoopingCurrent = 'loopingCurrent',
    LoopingQueue = 'loopingQueue',
}

class PlayerManager {
    private readonly client: Mika
    private leaveTimer?: NodeJS.Timer
    public readonly guild: Guild
    public readonly channel: TextChannel
    public readonly queue: QueueManager
    public player?: Player
    public voice?: VoiceBasedChannel
    public state: PLAYERSTATE
    public loopState: LOOPSTATE
    public volume = 50

    constructor(client: Mika, interaction: ChatInputCommandInteraction) {
        this.client = client
        this.guild = interaction.guild!
        this.channel = interaction.channel as TextChannel
        this.state = PLAYERSTATE.Idle
        this.loopState = LOOPSTATE.LoopingNone
        this.queue = new QueueManager()

        this.queue.on(QUEUEEVENT.TRACK_ADDED, (track: Track) => {
            if (this.state === PLAYERSTATE.Idle) {
                this.playMusic(track)
            }
        })

        this.queue.on(QUEUEEVENT.TRACKS_ADDED, (tracks: Track[]) => {
            if (this.state === PLAYERSTATE.Idle && tracks.length > 0) {
                this.playMusic(tracks[0])
            }
        })
    }

    public async init(
        interaction: ChatInputCommandInteraction
    ): Promise<PlayerManager> {
        const member = interaction.member as GuildMember
        if (!member.voice.channel) {
            throw new Error('User is not in a voice channel.')
        }

        this.player = await this.client.shoukaku.joinVoiceChannel({
            guildId: this.guild.id,
            channelId: member.voice.channel.id,
            shardId: 0,
            deaf: true,
        })

        this.client.players.set(this.guild.id, this)
        this.voice = member.voice.channel

        this.attachPlayerListeners()
        this.client.on('voiceStateUpdate', this.voiceStateHandler)

        return this
    }

    private attachPlayerListeners(): void {
        this.player?.on('start', (data) => this.handleOnPlayerStart(data))
        this.player?.on('end', () => this.handleOnPlayerEnd())
        this.player?.on('closed', () => this.handleOnPlayerClosed())
    }

    private getNode() {
        const node = this.client.shoukaku.options.nodeResolver(
            this.client.shoukaku.nodes
        )
        if (!node) {
            throw new Error('No available Lavalink node.')
        }
        return node
    }

    private getSearchQuery(query: string, method: string): string {
        try {
            new URL(query)
            return query
        } catch {
            return `${method}:${query}`
        }
    }

    public getNextPlaying(): Track | undefined {
        switch (this.loopState) {
            case LOOPSTATE.LoopingCurrent:
                return this.queue.getCurrent()
            case LOOPSTATE.LoopingQueue:
                return this.queue.getNext() ?? this.queue.getTrack(0)
            default:
                return this.queue.getNext()
        }
    }

    public leaveVoiceChannel(): Promise<void> {
        return this.client.shoukaku.leaveVoiceChannel(this.guild.id)
    }

    public async searchMusic(query: string, method: string) {
        const node = this.getNode()
        const searchQuery = this.getSearchQuery(query, method)
        return node.rest.resolve(searchQuery)
    }

    public playMusic(track: Track) {
        this.state = PLAYERSTATE.Playing
        return this.player?.playTrack({
            track: { encoded: track.encoded },
        })
    }

    public skipMusic() {
        this.state = PLAYERSTATE.Changing
        return this.player?.stopTrack()
    }

    public moveTrack(position: number) {
        this.state = PLAYERSTATE.Changing
        this.queue.setCurrent(position)
        return this.player?.stopTrack()
    }

    public pauseMusic() {
        this.state = PLAYERSTATE.Paused
        return this.player?.setPaused(true)
    }

    public resumeMusic() {
        if (this.state !== PLAYERSTATE.Paused) return Promise.resolve(undefined)
        this.state = PLAYERSTATE.Playing
        return this.player?.setPaused(false)
    }

    public seekMusic(position: number) {
        return this.player?.seekTo(position)
    }

    public async stopPlayer(): Promise<void> {
        this.state = PLAYERSTATE.Stopping
        await this.player?.destroy()
    }

    public async removePlayer(): Promise<void> {
        this.client.players.delete(this.guild.id)
        if (this.leaveTimer) clearTimeout(this.leaveTimer)
        this.player?.removeAllListeners()
        this.client.off('voiceStateUpdate', this.voiceStateHandler)
        this.queue.destroy()
        await this.leaveVoiceChannel()
    }

    public async changeVolume(volume: number): Promise<void> {
        if (volume < 0 || volume > 1000) {
            throw new Error('Volume must be between 0 and 1000.')
        }
        this.volume = volume
        await this.player?.setGlobalVolume(volume)
    }

    public async addMusic(
        query: string,
        method: string,
        interaction: ChatInputCommandInteraction
    ) {
        const member = interaction.member as GuildMember
        try {
            const result = await this.searchMusic(query, method)
            if (!result) {
                return
            }

            switch (result.loadType) {
                case LoadType.SEARCH:
                case LoadType.TRACK: {
                    const track =
                        result.loadType === LoadType.TRACK
                            ? result.data
                            : result.data[0]
                    if (!track) return // or handle no track found
                    this.queue.addTrack(track)
                    const embed = this.client.embed.createAddTrackEmbed(
                        track,
                        member
                    )
                    await this.client.interaction.replyEmbed(interaction, embed)
                    break
                }
                case LoadType.PLAYLIST: {
                    const { tracks } = result.data
                    this.queue.addTracks(tracks)
                    const embed = this.client.embed.createAddPlaylistEmbed(
                        tracks,
                        result,
                        member
                    )
                    await this.client.interaction.replyEmbed(interaction, embed)
                    break
                }
                case LoadType.EMPTY: {
                    const embed = this.client.embed.createMessageEmbed(
                        `⛔ No result found with query **${query}** ⛔`,
                        EMBEDTYPE.ERROR
                    )
                    await this.client.interaction.replyEmbed(
                        interaction,
                        embed,
                        { ephemeral: true }
                    )
                    break
                }
                case LoadType.ERROR:
                    this.client.logger.error(result.data, 'Lavalink Error')
                    throw new Error(result.data.message)
            }
        } catch (error) {
            this.client.logger.error(error, 'Error in addMusic')
            const embed = this.client.embed.createMessageEmbed(
                '⛔ An error occurred while adding music. Please try again later. ⛔',
                EMBEDTYPE.ERROR
            )
            await this.client.interaction.replyEmbed(interaction, embed, {
                ephemeral: true,
            })
        }
    }

    public async getSearchResult(
        query: string,
        method: string
    ): Promise<Track[] | undefined> {
        const result = await this.searchMusic(query, method)
        switch (result?.loadType) {
            case LoadType.SEARCH:
                return result.data.slice(0, 10)
            case LoadType.TRACK:
                return [result.data]
            case LoadType.PLAYLIST:
                return result.data.tracks.slice(0, 10)
            default:
                return undefined
        }
    }

    public async changeMusicSource(
        query: string,
        method: string
    ): Promise<Track | undefined> {
        const result = await this.searchMusic(query, method)
        if (result?.loadType === LoadType.SEARCH) {
            return result.data[0]
        }
        return undefined
    }

    private handleTimer(action: 'set' | 'clear') {
        if (action === 'clear' && this.leaveTimer) {
            clearTimeout(this.leaveTimer)
            this.leaveTimer = undefined
        } else if (action === 'set') {
            this.handleTimer('clear')
            this.leaveTimer = setTimeout(() => this.stopPlayer(), 120000)
        }
    }

    private async handleOnPlayerStart(data: TrackStartEvent) {
        this.state = PLAYERSTATE.Playing
        this.handleTimer('clear')
        const nextTrack = this.getNextPlaying()
        const embed = this.client.embed.createPlayingEmbed(
            data.track,
            nextTrack
        )
        await this.channel.send({ embeds: [embed] })
    }

    private async handleOnPlayerEnd() {
        if (
            this.state === PLAYERSTATE.Stopping ||
            this.state === PLAYERSTATE.Changing
        ) {
            const nextTrack = this.queue.playNext()
            if (nextTrack) this.playMusic(nextTrack)
            return
        }

        const trackToPlay = this.getNextOnEnd()

        if (trackToPlay) {
            this.queue.playNext()
            await this.playMusic(trackToPlay)
        } else {
            this.state = PLAYERSTATE.Idle
            const time = `<t:${Math.floor(Date.now() / 1000) + 120}:R>`
            const embed = this.client.embed.createMessageEmbed(
                `⚠️ Queue is empty. Leaving voice channel ${time} if no new track is added.`,
                EMBEDTYPE.WARNING
            )
            await this.channel.send({ embeds: [embed] })
            this.handleTimer('set')
        }
    }

    private getNextOnEnd(): Track | undefined {
        if (this.loopState === LOOPSTATE.LoopingCurrent) {
            return this.queue.getCurrent()
        }
        if (this.queue.current < this.queue.getLength() - 1) {
            return this.queue.getNext()
        }
        if (this.loopState === LOOPSTATE.LoopingQueue) {
            this.queue.resetQueue()
            return this.queue.getCurrent()
        }
        return undefined
    }

    private async handleOnPlayerClosed() {
        this.state = PLAYERSTATE.Stopping
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

    private async handleNoUsersInChannel() {
        if (this.state === PLAYERSTATE.Paused) return
        await this.pauseMusic()
        const time = `<t:${Math.floor(Date.now() / 1000) + 120}:R>`
        const embed = this.client.embed.createMessageEmbed(
            `⚠️ No one is in the voice channel. I will leave ${time} if no one rejoins.`,
            EMBEDTYPE.WARNING
        )
        await this.channel.send({ embeds: [embed] })
        this.handleTimer('set')
    }

    private async handleUserRejoined() {
        this.handleTimer('clear')
        await this.resumeMusic()
        const current = this.queue.getCurrent()
        const embed = this.client.embed.createMessageEmbed(
            `🎶 Welcome back! Resuming **${current?.info.title}** 🎶`,
            EMBEDTYPE.SUCCESS
        )
        await this.channel.send({ embeds: [embed] })
    }

    private voiceStateHandler = (
        oldState: VoiceState,
        newState: VoiceState
    ) => {
        if (oldState.guild.id !== this.guild.id) return

        const isBot = oldState.member?.user.bot
        if (isBot) return

        const leftChannel = oldState.channel && !newState.channel
        const joinedChannel = !oldState.channel && newState.channel
        const movedChannel =
            oldState.channel &&
            newState.channel &&
            oldState.channel.id !== newState.channel.id

        const wasInPlayerChannel = oldState.channel?.id === this.voice?.id
        const isInPlayerChannel = newState.channel?.id === this.voice?.id

        if (
            (leftChannel && wasInPlayerChannel) ||
            (movedChannel && wasInPlayerChannel)
        ) {
            if (
                oldState.channel?.members.filter((m) => !m.user.bot).size === 0
            ) {
                this.handleNoUsersInChannel()
            }
        }

        if (
            (joinedChannel && isInPlayerChannel) ||
            (movedChannel && isInPlayerChannel)
        ) {
            if (
                newState.channel?.members.filter((m) => !m.user.bot).size ===
                    1 &&
                this.state === PLAYERSTATE.Paused
            ) {
                this.handleUserRejoined()
            }
        }
    }
}

export { PlayerManager }
