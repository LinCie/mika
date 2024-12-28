// utility
import * as ping from "./utility/ping";

// music
import * as play from "./music/play";

const commands = {
	ping,
	play,
};

const commandsData = Object.values(commands).map((command) => command.data);

export { commands, commandsData };
