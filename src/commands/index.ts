import * as ping from "./utility/ping";

const commands = {
	ping,
};

const commandsData = Object.values(commands).map((command) => command.data);

export { commands, commandsData };
