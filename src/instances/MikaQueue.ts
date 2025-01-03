import Denque from "denque";
import { EventEmitter } from "node:events";
import type { Track } from "shoukaku";
import type { Mika } from "./Mika";

enum QueueEvents {
	TRACK_ADDED = "trackAdded",
	TRACKS_ADDED = "tracksAdded",
}

/**
 * The MikaQueue class represents a queue of tracks, with methods to manipulate the queue and retrieve information about the tracks.
 */
class MikaQueue extends EventEmitter {
	private readonly client: Mika;
	public queue: Denque<Track>;
	public current: number;

	/**
	 * Constructor for MikaQueue.
	 *
	 * Initializes the queue with the given tracks and sets the current track index to 0.
	 *
	 * @param {Array<Track> | undefined} initial The tracks to initialize the queue with, or undefined to create an empty queue.
	 */
	constructor(client: Mika, initial?: Array<Track> | undefined) {
		super();
		this.client = client;
		this.queue = new Denque<Track>(initial || []);
		this.current = 0;
	}

	/**
	 * Retrieves the current track in the queue.
	 *
	 * Retrieves the track that is currently playing.
	 *
	 * @returns {Track | undefined} The current track in the queue, or undefined if the queue is empty or at the beginning.
	 */
	public getCurrent(): Track | undefined {
		return this.queue.peekAt(this.current);
	}

	/**
	 * Retrieves the previous track in the queue.
	 *
	 * Retrieves the track that is scheduled to play before the current track.
	 *
	 * @returns {Track | undefined} The previous track in the queue, or undefined if the queue is empty or at the beginning.
	 */
	public getPrevious(): Track | undefined {
		return this.queue.peekAt(this.current - 1);
	}

	/**
	 * Retrieves the next track in the queue.
	 *
	 * Retrieves the track that is scheduled to play after the current track.
	 *
	 * @returns {Track | undefined} The next track in the queue, or undefined if the queue is empty or at the end.
	 */
	public getNext(): Track | undefined {
		return this.queue.peekAt(this.current + 1);
	}

	/**
	 * Returns the length of the queue.
	 *
	 * @returns {number} The length of the queue.
	 */
	public getLength(): number {
		return this.queue.length;
	}

	/**
	 * Returns the entire queue as an array of tracks.
	 *
	 * @returns {Array<Track>} The queue as an array of tracks.
	 */
	public getTracks(): Array<Track> {
		return this.queue.toArray();
	}

	/**
	 * Retrieves the track at the given index.
	 *
	 * @param {number} index The index of the track to retrieve.
	 * @returns {Track | undefined} The track at the given index, or undefined if the index is out of bounds.
	 */
	public getTrack(index: number): Track | undefined {
		return this.queue.get(index);
	}

	/**
	 * Plays the next track in the queue and returns it.
	 *
	 * Increments the current track index and retrieves the track at the new index.
	 *
	 * @returns {Track | undefined} The next track in the queue, or undefined if the queue is empty or at the end.
	 */
	public playNext(): Track | undefined {
		this.current++;
		return this.getCurrent();
	}

	/**
	 * Moves to the previous track in the queue and returns it.
	 *
	 * Decrements the current track index and retrieves the track at the new index.
	 *
	 * @returns {Track | undefined} The previous track in the queue, or undefined if the queue is empty or at the beginning.
	 */

	public playPrevious(): Track | undefined {
		this.current--;
		return this.getCurrent();
	}

	/**
	 * Retrieves the current track in the queue.
	 *
	 * @returns {Track | undefined} The current track in the queue, or undefined if the queue is empty or at the beginning.
	 */
	public playCurrent(): Track | undefined {
		return this.getCurrent();
	}

	/**
	 * Adds a track to the queue.
	 *
	 * The current track index is not changed.
	 *
	 * @param {Track} track The track to add to the queue.
	 */
	public addTrack(track: Track): void {
		this.queue.push(track);
		this.emit(QueueEvents.TRACK_ADDED, track);
	}

	/**
	 * Adds multiple tracks to the queue.
	 *
	 * The current track index is not changed.
	 *
	 * @param {Array<Track>} tracks The tracks to add to the queue.
	 * @returns {void}
	 */
	public addTracks(tracks: Array<Track>): void {
		for (let x = 0; x < tracks.length; x++) {
			const track = tracks[x];
			this.queue.push(track);
		}
		this.emit(QueueEvents.TRACKS_ADDED, tracks);
	}

	/**
	 * Removes a track from the queue at the given index.
	 *
	 * The current track index is not changed.
	 *
	 * @param {number} index The index at which to remove the track.
	 * @returns {void}
	 */
	public removeTrack(index: number): void {
		this.queue.removeOne(index);
	}

	/**
	 * Shuffles the queue randomly.
	 *
	 * The current track is not moved. All other tracks are shuffled around it.
	 *
	 * @returns {void}
	 */
	public shuffleQueue(): void {
		if (this.queue.isEmpty()) return;

		const currentTrack = this.queue.peekAt(this.current) as Track;

		const remainingTracks = this.queue.toArray();
		remainingTracks.splice(this.current, 1);

		for (let i = remainingTracks.length - 1; i > 0; i--) {
			const j = Math.floor(Math.random() * (i + 1));
			[remainingTracks[i], remainingTracks[j]] = [
				remainingTracks[j],
				remainingTracks[i],
			];
		}

		this.queue = new Denque<Track>([currentTrack, ...remainingTracks]);
		this.current = 0;
	}

	/**
	 * Resets the queue to the beginning.
	 *
	 * Sets the current track index to 0.
	 *
	 * @returns {void}
	 */
	public resetQueue(): void {
		this.current = 0;
	}

	public destroy(): void {
		this.removeAllListeners();
		this.queue.clear();
		this.resetQueue();
	}
}

export { MikaQueue, QueueEvents };
