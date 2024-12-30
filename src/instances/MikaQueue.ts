import Denque from "denque";
import type { Track } from "shoukaku";

class MikaQueue {
	public queue: Denque<Track>;
	public current: number;

	constructor(initial?: Array<Track> | undefined) {
		this.queue = new Denque<Track>(initial || []);
		this.current = 0;
	}
}

export { MikaQueue };
