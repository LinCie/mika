# Mika 🩷
Mika is a multi-functional Discord bot built with Bun, TypeScript, and Discord.js v14. She comes packed with features, including a robust music system, playlist management, and an integrated AI chat powered by Google's Gemini.

## ✨ Features
- **Music System 🎶**: Powered by Shoukaku and Lavalink, Mika delivers a high-quality music experience.
	- Play songs from YouTube, SoundCloud, and Spotify.
	- Search for tracks and get a list of results to choose from.
	- Comprehensive queue management: view, shuffle, clear, loop (track or queue), move, and remove tracks.
	- Control playback with pause, resume, skip, and seek commands.
	- Adjust the volume to your liking.
	- Download the currently playing song.
- **Playlist Management 🎵**: Create and manage your own custom playlists.
	- Create, delete, and list your personal playlists.
	- Add the current track, a URL, or an entire queue to your playlist.
	- Remove specific tracks from your playlists.
	- Play your saved playlists directly.
- **AI Chat 🤖**: Engage in conversations with a powerful AI.
	- Chat directly with the AI using the /ai chat command.
	- Customize the AI's personality, choosing from a variety of beloved characters.
	- Clear your chat history for a fresh start.
- **Developer Tools 🛠️**: Owner-only commands for easy management.
	- Manage the bot and Lavalink instances with PM2 commands.
	- Pull the latest changes from Git.
	- Toggle maintenance mode.

## 📋 Requirements
- [Bun](https://bun.sh/)
- At least Java 17. You can download it from [Azul](https://docs.azul.com/core/install/debian)
- A running [Lavalink](https://github.com/lavalink-devs/Lavalink) server.
- A [Turso](https://turso.tech/) or [SQLite](https://www.sqlite.org/) database.

## 🚀 Installation
- **Clone the repository:**
```bash
git clone https://github.com/LinCie/mika.git
cd mika
```
- **Install dependencies:**
```bash
bun install --frozen-lockfile
```
- **Set up the database:**
	- Create a `.env` file and configure your `TURSO_DATABASE_URL` and `TURSO_AUTH_TOKEN`.
	- Run the Prisma migration to create the necessary tables:
```bash
bun run prisma:migrate
```
- **Get Lavalink:**
  - Run the provided script to download the `Lavalink.jar` file.
```bash
bun run lava:get
```
  - This will place `Lavalink.jar` inside a newly created `lavalink` directory.

## ⚙️ Configuration
- Create a `.env` file in the root directory and fill it with the following variables:
```
# Discord Bot
BOT_TOKEN=
CLIENT_ID=
GUILD_ID= # Your development server ID
OWNER_ID= # Your Discord User ID

# Database (Turso)
TURSO_DATABASE_URL=
TURSO_AUTH_TOKEN=

# Logging
LOGGER_CHANNEL_ID=
ERROR_LOGGER_CHANNEL_ID=

# AI (Google Gemini)
GEMINI_API_KEY=
GEMINI_MODEL="gemini-1.5-flash"

# Lavalink Node(s)
# You can add multiple nodes by incrementing the index (e.g., LAVALINK_NODE_1_...)
LAVALINK_NODE_0_NAME=
LAVALINK_NODE_0_URL=
LAVALINK_NODE_0_AUTH=
LAVALINK_NODE_0_SECURE=
```
- Create a `application.yml` file in the root directory and fill it with the variables marked with `<>`:
```yml
server: # REST and WS server
  port: 2333
  address: 0.0.0.0
  http2:
    enabled: false # Whether to enable HTTP/2 support
plugins:
  youtube:
    enabled: true # Whether this source can be used.
    allowSearch: true # Whether "ytsearch:" and "ytmsearch:" can be used.
    allowDirectVideoIds: true # Whether just video IDs can match. If false, only complete URLs will be loaded.
    allowDirectPlaylistIds: true # Whether just playlist IDs can match. If false, only complete URLs will be loaded.
    # The clients to use for track loading. See below for a list of valid clients.
    # Clients are queried in the order they are given (so the first client is queried first and so on...)
    clients:
      - MUSIC
      - ANDROID_VR
      - WEB
      - WEBEMBEDDED
  lavasrc:
    providers: # Custom providers for track loading. This is the default
      # # - "dzisrc:%ISRC%" # Deezer ISRC provider
      # # - "dzsearch:%QUERY%" # Deezer search provider
      # - "ytsearch:\"%ISRC%\"" # Will be ignored if track does not have an ISRC. See https://en.wikipedia.org/wiki/International_Standard_Recording_Code
      # - "ytsearch:%QUERY%" # Will be used if track has no ISRC or no track could be found for the ISRC
      # #  you can add multiple other fallback sources here
    sources:
      spotify: true # Enable Spotify source
      applemusic: false # Enable Apple Music source
      deezer: false # Enable Deezer source
      yandexmusic: false # Enable Yandex Music source
      flowerytts: false # Enable Flowery TTS source
      youtube: false # Enable YouTube search source (https://github.com/topi314/LavaSearch)
      vkmusic: false # Enable Vk Music source
    lyrics-sources:
      spotify: false # Enable Spotify lyrics source
      deezer: false # Enable Deezer lyrics source
      youtube: false # Enable YouTube lyrics source
      yandexmusic: false # Enable Yandex Music lyrics source
      vkmusic: false # Enable Vk Music lyrics source
    spotify:
      clientId: "<your-spotify-client-id>"
      clientSecret: "<your-spotify-client-secret>"
      # spDc: "your sp dc cookie" # the sp dc cookie used for accessing the spotify lyrics api
      countryCode: "US" # the country code you want to use for filtering the artists top tracks. See https://en.wikipedia.org/wiki/ISO_3166-1_alpha-2
      playlistLoadLimit: 6 # The number of pages at 100 tracks each
      albumLoadLimit: 6 # The number of pages at 50 tracks each
      resolveArtistsInSearch: true # Whether to resolve artists in track search results (can be slow)
      localFiles: false # Enable local files support with Spotify playlists. Please note `uri` & `isrc` will be `null` & `identifier` will be `"local"`
      preferAnonymousToken: false # Whether to use the anonymous token for resolving tracks, artists and albums. Playlists are always resolved with the anonymous token to support autogenerated playlists.
    applemusic:
      countryCode: "US" # the country code you want to use for filtering the artists top tracks and language. See https://en.wikipedia.org/wiki/ISO_3166-1_alpha-2
      mediaAPIToken: "your apple music api token" # apple music api token
      # or specify an apple music key
      keyID: "your key id"
      teamID: "your team id"
      musicKitKey: |
        -----BEGIN PRIVATE KEY-----
        your key
        -----END PRIVATE KEY-----      
      playlistLoadLimit: 6 # The number of pages at 300 tracks each
      albumLoadLimit: 6 # The number of pages at 300 tracks each
    deezer:
      masterDecryptionKey: "your master decryption key" # the master key used for decrypting the deezer tracks. (yes this is not here you need to get it from somewhere else)
      # arl: "your deezer arl" # the arl cookie used for accessing the deezer api this is optional but required for formats above MP3_128
      formats: [ "FLAC", "MP3_320", "MP3_256", "MP3_128", "MP3_64", "AAC_64" ] # the formats you want to use for the deezer tracks. "FLAC", "MP3_320", "MP3_256" & "AAC_64" are only available for premium users and require a valid arl
    yandexmusic:
      accessToken: "your access token" # the token used for accessing the yandex music api. See https://github.com/TopiSenpai/LavaSrc#yandex-music
      playlistLoadLimit: 1 # The number of pages at 100 tracks each
      albumLoadLimit: 1 # The number of pages at 50 tracks each
      artistLoadLimit: 1 # The number of pages at 10 tracks each
    flowerytts:
      voice: "default voice" # (case-sensitive) get default voice from here https://api.flowery.pw/v1/tts/voices
      translate: false # whether to translate the text to the native language of voice
      silence: 0 # the silence parameter is in milliseconds. Range is 0 to 10000. The default is 0.
      speed: 1.0 # the speed parameter is a float between 0.5 and 10. The default is 1.0. (0.5 is half speed, 2.0 is double speed, etc.)
      audioFormat: "mp3" # supported formats are: mp3, ogg_opus, ogg_vorbis, aac, wav, and flac. Default format is mp3
    youtube:
      countryCode: "US" # the country code you want to use for searching lyrics via ISRC. See https://en.wikipedia.org/wiki/ISO_3166-1_alpha-2
    vkmusic:
      userToken: "your user token" # This token is needed for authorization in the api. Guide: https://github.com/topi314/LavaSrc#vk-music
      playlistLoadLimit: 1 # The number of pages at 50 tracks each
      artistLoadLimit: 1 # The number of pages at 10 tracks each
      recommendationsLoadLimit: 10 # Number of tracks
lavalink:
  plugins:
    # Replace VERSION with the current version as shown by the Releases tab or a long commit hash for snapshots.
    - dependency: "dev.lavalink.youtube:youtube-plugin:<latest-version>"
      repository: "https://maven.lavalink.dev/releases"
      snapshot: false
    - dependency: "com.github.topi314.lavasrc:lavasrc-plugin:<latest-version>"
      repository: "https://maven.lavalink.dev/releases" # this is optional for lavalink v4.0.0-beta.5 or greater
      snapshot: false # set to true if you want to use snapshot builds (see below)
  server:
    password: "youshallnotpass"
    sources:
      # The default Youtube source is now deprecated and won't receive further updates. Please use https://github.com/lavalink-devs/youtube-source#plugin instead.
      youtube: false
      bandcamp: true
      soundcloud: true
      twitch: true
      vimeo: true
      nico: true
      http: true # warning: keeping HTTP enabled without a proxy configured could expose your server's IP address.
      local: false
    filters: # All filters are enabled by default
      volume: true
      equalizer: true
      karaoke: true
      timescale: true
      tremolo: true
      vibrato: true
      distortion: true
      rotation: true
      channelMix: true
      lowPass: true
    nonAllocatingFrameBuffer: false # Setting to true reduces the number of allocations made by each player at the expense of frame rebuilding (e.g. non-instantaneous volume changes)
    bufferDurationMs: 400 # The duration of the NAS buffer. Higher values fare better against longer GC pauses. Duration <= 0 to disable JDA-NAS. Minimum of 40ms, lower values may introduce pauses.
    frameBufferDurationMs: 5000 # How many milliseconds of audio to keep buffered
    opusEncodingQuality: 10 # Opus encoder quality. Valid values range from 0 to 10, where 10 is best quality but is the most expensive on the CPU.
    resamplingQuality: LOW # Quality of resampling operations. Valid values are LOW, MEDIUM and HIGH, where HIGH uses the most CPU.
    trackStuckThresholdMs: 10000 # The threshold for how long a track can be stuck. A track is stuck if does not return any audio data.
    useSeekGhosting: true # Seek ghosting is the effect where whilst a seek is in progress, the audio buffer is read from until empty, or until seek is ready.
    youtubePlaylistLoadLimit: 6 # Number of pages at 100 each
    playerUpdateInterval: 5 # How frequently to send player updates to clients, in seconds
    youtubeSearchEnabled: true
    soundcloudSearchEnabled: true
    gc-warnings: true
    #ratelimit:
      #ipBlocks: ["1.0.0.0/8", "..."] # list of ip blocks
      #excludedIps: ["...", "..."] # ips which should be explicit excluded from usage by lavalink
      #strategy: "RotateOnBan" # RotateOnBan | LoadBalance | NanoSwitch | RotatingNanoSwitch
      #searchTriggersFail: true # Whether a search 429 should trigger marking the ip as failing
      #retryLimit: -1 # -1 = use default lavaplayer value | 0 = infinity | >0 = retry will happen this numbers times
    #youtubeConfig: # Required for avoiding all age restrictions by YouTube, some restricted videos still can be played without.
      #email: "" # Email of Google account
      #password: "" # Password of Google account
    #httpConfig: # Useful for blocking bad-actors from ip-grabbing your music node and attacking it, this way only the http proxy will be attacked
      #proxyHost: "localhost" # Hostname of the proxy, (ip or domain)
      #proxyPort: 3128 # Proxy port, 3128 is the default for squidProxy
      #proxyUser: "" # Optional user for basic authentication fields, leave blank if you don't use basic auth
      #proxyPassword: "" # Password for basic authentication
    timeouts:
      connectTimeoutMs: 3000
      connectionRequestTimeoutMs: 3000
      socketTimeoutMs: 3000

metrics:
  prometheus:
    enabled: false
    endpoint: /metrics

sentry:
  dsn: ""
  environment: ""
#  tags:
#    some_key: some_value
#    another_key: another_value

logging:
  file:
    path: ./logs/

  level:
    root: INFO
    lavalink: INFO

  request:
    enabled: true
    includeClientInfo: true
    includeHeaders: false
    includeQueryString: true
    includePayload: true
    maxPayloadLength: 10000


  logback:
    rollingpolicy:
      max-file-size: 1GB
      max-history: 30
```
## ▶️ Usage
### Development
For development, you need to run the bot and the Lavalink server in separate terminals.
- **Start Lavalink:**
```bash
bun run lava
```
- **Start the bot:**
```bash
bun run dev
```
### Production
For production, it is recommended to use a process manager like [PM2](https://pm2.keymetrics.io/). An `ecosystem.config.js` file is included for your convenience.
- **Ensure PM2 is installed:**
```bash
npm install -g pm2
```
- **Start all applications:**
```bash
pm2 start
```
This will start both the Mika bot and the Lavalink server as background processes.