export const apps = [
	{
		name: "mika",
		script: "src/mika.ts",
		interpreter: "bun",
		env: {
			PATH: `${process.env.HOME}/.bun/bin:${process.env.PATH}`,
		},
		exec_mode: "cluster",
		instances: "max",
		watch: false,
		autorestart: true,
		max_memory_restart: "200M",
	},
	{
		name: "lavalink",
		script: "java",
		args: "-Xms256M -Xmx512M -jar lavalink/Lavalink.jar",
		max_memory_restart: "500M",
		watch: false,
		autorestart: true,
	},
];
