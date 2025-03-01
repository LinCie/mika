import Denque from 'denque'
import { EventEmitter } from 'node:events'
import type { Track } from 'shoukaku'

enum QUEUEEVENT {
    TRACK_ADDED = 'trackAdded',
    TRACKS_ADDED = 'tracksAdded',
}

/**
 * The QueueManager class represents a queue of tracks, with methods to manipulate the queue and retrieve information about the tracks.
 */
class QueueManager extends EventEmitter {
    public queue: Denque<Track>
    public current: number

    constructor(initial?: Array<Track> | undefined) {
        super()
        this.queue = new Denque<Track>(initial || [])
        this.current = 0
    }

    public getCurrent(): Track | undefined {
        return this.queue.peekAt(this.current)
    }

    public getPrevious(): Track | undefined {
        return this.queue.peekAt(this.current - 1)
    }

    public getNext(): Track | undefined {
        return this.queue.peekAt(this.current + 1)
    }

    public getLength(): number {
        return this.queue.length
    }

    public getTracks(): Array<Track> {
        return this.queue.toArray()
    }

    public getTrack(index: number): Track | undefined {
        return this.queue.get(index)
    }

    public playNext(): Track | undefined {
        this.current++
        return this.getCurrent()
    }

    public playPrevious(): Track | undefined {
        this.current--
        return this.getCurrent()
    }

    public playCurrent(): Track | undefined {
        return this.getCurrent()
    }

    public addTrack(track: Track): void {
        this.queue.push(track)
        this.emit(QUEUEEVENT.TRACK_ADDED, track)
    }

    public addTracks(tracks: Array<Track>): void {
        for (let x = 0; x < tracks.length; x++) {
            const track = tracks[x]
            this.queue.push(track)
        }
        this.emit(QUEUEEVENT.TRACKS_ADDED, tracks)
    }

    public removeTrack(index: number): void {
        if (this.current >= index) this.current--
        this.queue.removeOne(index)
    }

    public shuffleQueue(): void {
        if (this.queue.isEmpty()) return

        const currentTrack = this.queue.peekAt(this.current) as Track

        const remainingTracks = this.queue.toArray()
        remainingTracks.splice(this.current, 1)

        for (let i = remainingTracks.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1))
            ;[remainingTracks[i], remainingTracks[j]] = [
                remainingTracks[j],
                remainingTracks[i],
            ]
        }

        this.queue = new Denque<Track>([currentTrack, ...remainingTracks])
        this.current = 0
    }

    public resetQueue(): void {
        this.current = 0
    }

    public destroy(): void {
        this.removeAllListeners()
        this.queue.clear()
        this.resetQueue()
    }

    public setCurrent(position: number): void {
        this.current = position
    }
}

export { QueueManager, QUEUEEVENT }
