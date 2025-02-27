/* eslint-disable no-undef */
export const apps = [
    {
        name: 'mika',
        script: 'src/mika.ts',
        interpreter: 'bun',
        env: {
            PATH: `${process.env.HOME}/.bun/bin:${process.env.PATH}`,
        },
        watch: false,
        autorestart: true,
        max_memory_restart: '512M',
    },
    {
        name: 'lavalink',
        script: 'java',
        args: '-jar lavalink/Lavalink.jar',
        max_memory_restart: '1024M',
        watch: false,
        autorestart: true,
    },
]
