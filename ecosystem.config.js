export const apps = [
	{
		name: "mika",
		script: "src/mika.ts",
		interpreter: "bun",
		env: {
			PATH: `${process.env.HOME}/.bun/bin:${process.env.PATH}`,
		},
	},
  {
    name: "lavalink",
    script: "java",
    args: "-jar lavalink/Lavalink.jar"
  }
];
