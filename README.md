# 🔥 ChathuX — Enterprise Multi-Purpose Discord Platform

[![Node.js Version](https://img.shields.io/badge/node.js-v18.0%2B-brightgreen.svg)](https://nodejs.org/)
[![Discord.js](https://img.shields.io/badge/discord.js-v14.18%2B-blue.svg)](https://discord.js.org/)
[![Database](https://img.shields.io/badge/database-MySQL%208.0-orange.svg)](https://www.mysql.com/)
[![License](https://img.shields.io/badge/license-ISC-purple.svg)](#license)

**ChathuX** is an enterprise-grade, production-quality Discord bot platform built from scratch using clean architecture principles. It integrates high-intelligence AI features, comprehensive server moderation, automated defense, an engaging XP leveling engine, a complete virtual economy, an audio player, and a sleek glassmorphic web dashboard with Discord OAuth2 authentication.

---

## 📑 Table of Contents

1. [Architectural Overview](#-architectural-overview)
2. [Feature Matrix](#-feature-matrix)
3. [Technology Stack](#-technology-stack)
4. [Prerequisites](#-prerequisites)
5. [Installation & Setup](#-installation--setup)
6. [Environment Configuration](#-environment-configuration)
7. [Discord Developer Portal Setup](#-discord-developer-portal-setup)
8. [OAuth2 Dashboard Configuration](#-oauth2-dashboard-configuration)
9. [Database Schema & Migrations](#-database-schema--migrations)
10. [Slash Commands Reference](#-slash-commands-reference)
11. [Bot Permissions Guide](#-bot-permissions-guide)
12. [Testing & Verification](#-testing--verification)
13. [Production Deployment](#-production-deployment)
14. [Security Best Practices](#-security-best-practices)
15. [Troubleshooting](#-troubleshooting)

---

## 🏛️ Architectural Overview

ChathuX employs a clean, layered service-oriented architecture:

```
ChathuX/
├── src/
│   ├── bot.js                     # Discord Client bootstrap & export
│   ├── config/                    # Configuration loading & validation
│   ├── database/                  # Connection pooling, migrations & repositories
│   │   ├── connection.js          # MySQL pool with in-memory resilient fallback
│   │   ├── migrator.js            # Automated DDL schema runner
│   │   └── repositories/          # Domain data access objects
│   ├── services/                  # Decoupled business logic
│   │   ├── aiService.js           # Multi-provider AI abstraction (Gemini / OpenAI / Fallback)
│   │   ├── moderationService.js   # Auto-mod rules engine & penalty dispatch
│   │   ├── xpService.js           # Level formula, cooldowns & ASCII rank cards
│   │   ├── economyService.js      # Accounts, streaks, work, transfers & shop
│   │   ├── loggingService.js      # Audit log formatter & dispatcher
│   │   ├── musicService.js        # Voice connection, queue & player controls
│   │   ├── giveawayService.js     # Timed giveaways, button entries & winner picks
│   │   ├── pollService.js         # Real-time interactive polls & progress bars
│   │   ├── afkService.js          # User AFK state tracking & mention alerts
│   │   └── reminderService.js     # Scheduled user reminder timers
│   ├── commands/                  # Modular slash command definitions (68 commands)
│   ├── events/                    # Discord gateway event handlers
│   ├── handlers/                  # Dynamic command, event & component loaders
│   └── utils/                     # Structured logger, permissions & embeds
├── dashboard/                     # Web Dashboard & REST API
│   ├── server.js                  # Express application setup
│   ├── routes/                    # OAuth2 auth, API & view routes
│   ├── views/                     # Responsive HTML5 glassmorphic templates
│   └── public/                    # CSS, client JavaScript & assets
├── database/                      # SQL schema definitions (schema.sql)
├── scripts/                       # Deployment and DB migration utilities
├── .env.example                   # Environment variable template
└── index.js                       # Master process entrypoint with graceful shutdown
```

---

## 🚀 Feature Matrix

### 🤖 1. AI Assistant System
- **Provider Abstraction**: Seamlessly switch between **Google Gemini**, **OpenAI**, or built-in intelligent fallback.
- **Conversational Memory**: Maintains conversation context per user and channel.
- **Natural AI Channel Mode**: Users can speak conversationally in dedicated channels without typing `/ask`.
- **Engineering Capabilities**: Problem-solving (`/code`), architecture breakdown (`/explain`), summarization (`/summarize`), and translation (`/translate`).
- **Sinhala Language Support**: Natural conversational replies to colloquial Sinhala messages.

### 🛡️ 2. Moderation & Auto-Mod Engine
- **Manual Moderation**: `/kick`, `/ban`, `/unban`, `/timeout`, `/untimeout`, `/warn`, `/warnings`, `/clear`, `/slowmode`, `/lock`, `/unlock`, `/modlog`.
- **Auto-Spam Protection**: Message burst rate limiter (5 msgs in 5s).
- **Mention Flood Limiter**: Flags messages exceeding threshold user/role mentions.
- **Bad-Word Filtering**: Normalizes text and matches against configurable prohibited term lists.
- **Phishing & Invite Blocking**: Scans for unauthorized links and Discord invite URLs.
- **Automated Penalty Strikes**: Auto-timeout for repeat offenders.

### 🏆 3. Leveling & Progression System
- **Anti-Abuse Cooldown**: 60-second message cooldown prevents XP farming.
- **Dynamic ASCII Rank Card**:
  ```
  ╭──────────────────────────────────────────╮
  │ 🏆 Chathunga               Rank #1       │
  │ Level: 24                                │
  │ XP: 8,420 / 10,000                       │
  │ [████████████████████░░░░░░░░] 84%       │
  ╰──────────────────────────────────────────╯
  ```
- **Leaderboards**: Real-time server ranking via `/leaderboard`.
- **Role Unlocks**: Automatically awards custom roles upon reaching milestone levels.

### 💰 4. Virtual Economy & Casino
- **Wallet & Bank**: Multi-currency accounting with net-worth rankings.
- **Daily Rewards**: Progressive streak multiplier.
- **Career Shifts**: `/work` with randomized career scenarios.
- **Casino Slots Machine**: High-stakes `/slots <bet>` mini-game with custom animated reels and multi-tier payout multipliers (Jackpot 10x, Diamonds 6x, Golden Bells 4x).
- **Atomic Transfers**: Safe peer-to-peer coin transfers guarded by database transactions.
- **Server Marketplace**: Server admins can configure purchasable items and roles via `/shop` and `/buy`.

### 🎵 5. High-Fidelity Music Streaming
- **Voice Connection Management**: Powered by `@discordjs/voice`.
- **Playback Controls**: `/play`, `/pause`, `/resume`, `/skip`, `/stop`, `/volume`, `/loop`.
- **Interactive Control Buttons**: Embedded control pad (`⏯️`, `⏭️`, `⏹️`, `🔁`, `📜`) directly in the `/nowplaying` card.

### 🎉 6. Community & Interactive Utilities
- **Interactive Giveaways**: Timed countdowns with `/giveaway start`, `/giveaway end`, `/giveaway reroll`, interactive entry button `🎉 Enter Giveaway (X)`, and automated crypto-random winner selection.
- **Real-Time Polls**: Dynamic percentage progress bars (`████░░ 40%`) via `/poll create` or `/poll quick`, instant button voting, and duplicate vote prevention.
- **Smart AFK Assistant**: Set custom AFK reasons via `/afk [reason]`. ChathuX automatically notifies anyone who mentions the user and auto-clears AFK with a welcome-back message when they speak again.
- **Automated Reminders**: Schedule self-reminders with natural time durations (`/remind <time> <task>`) via high-precision background timers.

### 🌐 7. Glassmorphism Web Dashboard & OAuth2
- **Responsive Dark UI**: Deep dark background (`#090d16`), purple/cyan neon accents, and backdrop blur.
- **Discord OAuth2**: Secure user authentication displaying only servers where the user holds `Manage Server` or `Administrator` rights.
- **Full Configuration Suite**: Customize welcome messages, audit log channels, auto-mod toggles, and AI channels from your web browser.

---

## 🛠️ Technology Stack

| Component | Technology | Description |
| :--- | :--- | :--- |
| **Runtime** | Node.js (v18+) | Non-blocking asynchronous I/O engine |
| **Bot Framework** | Discord.js (v14+) | Modern Discord Gateway API integration |
| **REST API** | Express.js (v4+) | Web dashboard backend and API endpoints |
| **Database** | MySQL 8.0 / `mysql2` | Relational storage with connection pooling |
| **Voice / Music** | `@discordjs/voice` | Voice gateway audio streamer |
| **Frontend UI** | Bootstrap 5 + Vanilla CSS | Responsive Glassmorphism design system |
| **Analytics** | Chart.js | Visual metrics and telemetry graphs |
| **AI Integration** | Google Gemini / OpenAI | Multi-model REST abstraction |

---

## 📋 Prerequisites

- **Node.js**: v18.0.0 or higher ([Download Node.js](https://nodejs.org/))
- **MySQL**: MySQL Server 8.0+ or MariaDB 10.5+
- **Discord Application**: Bot token and application credentials from the [Discord Developer Portal](https://discord.com/developers/applications)

---

## ⚡ Installation & Setup

1. **Clone or navigate to the repository:**
   ```bash
   cd d:/ChathuX
   ```

2. **Install all dependencies:**
   ```bash
   npm install
   ```

3. **Configure Environment Variables:**
   Copy `.env.example` to `.env`:
   ```bash
   copy .env.example .env
   ```
   Open `.env` and fill in your credentials.

4. **Initialize Database Schema:**
   Ensure MySQL is running, then execute:
   ```bash
   npm run db:init
   ```

5. **Deploy Slash Commands:**
   Register the bot's slash commands with Discord:
   ```bash
   npm run deploy-commands
   ```

6. **Start the Platform:**
   ```bash
   # Production Mode
   npm start

   # Development Mode (auto-reload via nodemon)
   npm run dev
   ```

---

## 🔑 Discord Developer Portal Setup

Follow these exact steps to register and configure your Discord bot:

1. Navigate to the **[Discord Developer Portal](https://discord.com/developers/applications)**.
2. Click **"New Application"**, enter **ChathuX**, and accept terms.
3. In the left sidebar, click **"Bot"**:
   - Click **"Reset Token"** and copy your **Bot Token**. Save it in `.env` as `DISCORD_TOKEN`.
   - Toggle **OFF** "Public Bot" if you want private deployment.
   - Under **Privileged Gateway Intents**, enable:
     - **PRESENCE INTENT** (for user activity tracking)
     - **SERVER MEMBERS INTENT** (for welcome system and auto-roles)
     - **MESSAGE CONTENT INTENT** (for auto-mod scanning and natural AI chat)
   - Click **"Save Changes"**.
4. In the left sidebar, click **"General Information"**:
   - Copy the **Application ID**. Save it in `.env` as `CLIENT_ID`.
5. In the left sidebar, click **"OAuth2"**:
   - Click **"Reset Secret"** and copy your **Client Secret**. Save it in `.env` as `DISCORD_CLIENT_SECRET`.
   - Under **Redirects**, click **"Add Redirect"** and enter:
     `http://localhost:3000/api/auth/callback`
   - Click **"Save Changes"**.
6. Generate Bot Invite URL:
   - In the left sidebar, go to **OAuth2** ➔ **URL Generator**.
   - Under **SCOPES**, check:
     - `bot`
     - `applications.commands`
   - Under **BOT PERMISSIONS**, select:
     - Administrator (or standard moderation/voice permissions)
   - Copy the generated URL at the bottom and open it in your browser to invite ChathuX to your server.

---

## 📖 Slash Commands Reference

| Category | Command | Description |
| :--- | :--- | :--- |
| **General** | `/ping` | Measures API roundtrip and WebSocket heartbeat latency |
| **General** | `/status` | Live CPU, memory, and operational platform status |
| **General** | `/help` | Interactive category dropdown command directory |
| **General** | `/about` | Architectural design and platform background |
| **General** | `/serverinfo` | Statistics, member distribution, and boost metrics |
| **General** | `/userinfo` | Member profile, roles, and creation dates |
| **General** | `/avatar` | Retrieves user avatar in high resolution |
| **General** | `/roles` | Server roles listing with member counts |
| **General** | `/uptime` | Displays continuous runtime since deployment |
| **General** | `/botinfo` | Platform specifications and global telemetry |
| **General** | `/giveaway <start\|end\|reroll>` | Interactive giveaways with timers, buttons & crypto-random winners |
| **General** | `/poll <create\|quick>` | Real-time community voting with dynamic progress bars |
| **General** | `/afk [reason]` | Sets AFK state with mention alerts and auto welcome-back |
| **General** | `/remind <time> <task>` | Schedules automated timed reminder alerts |
| **AI** | `/ask <question>` | Context-aware AI assistant dialogue |
| **AI** | `/code <problem>` | Generates clean algorithmic code solutions |
| **AI** | `/explain <code>` | In-depth breakdown of complex code |
| **AI** | `/translate <text> <lang>` | Accurate multi-lingual translation |
| **AI** | `/summarize <text>` | High-yield executive summary bullet points |
| **AI** | `/ai-clear` | Resets conversation context session |
| **Moderation** | `/kick <user> [reason]` | Kicks member with hierarchy validation |
| **Moderation** | `/ban <user> [reason]` | Bans member with optional message purge |
| **Moderation** | `/unban <user_id>` | Lifts an existing ban |
| **Moderation** | `/timeout <user> <duration>` | Mutes member from chat and voice channels |
| **Moderation** | `/untimeout <user>` | Removes timeout restriction early |
| **Moderation** | `/warn <user> <reason>` | Issues official strike recorded in MySQL |
| **Moderation** | `/warnings <user>` | Displays member warning history |
| **Moderation** | `/clear <amount>` | Bulk removes 1-100 recent messages |
| **Moderation** | `/slowmode <seconds>` | Adjusts channel rate-limiting |
| **Moderation** | `/lock [reason]` | Locks channel against `@everyone` |
| **Moderation** | `/unlock` | Restores normal channel permissions |
| **Moderation** | `/modlog [limit]` | Displays recent moderation action logs |
| **Leveling** | `/rank [user]` | Visual ASCII rank card with progress bar |
| **Leveling** | `/level [user]` | Quick level check |
| **Leveling** | `/leaderboard` | Top 10 most active community members |
| **Leveling** | `/levels` | Progression requirements overview |
| **Leveling** | `/xp [user]` | Raw XP statistics |
| **Economy** | `/balance [user]` | Wallet and bank balance summary |
| **Economy** | `/daily` | Daily reward with streak multiplier |
| **Economy** | `/work` | Undertake career shifts to earn coins |
| **Economy** | `/slots <bet>` | Casino slot machine gambling mini-game with win multipliers |
| **Economy** | `/pay <user> <amount>` | Atomic peer-to-peer coin transfer |
| **Economy** | `/shop` | Server marketplace catalog |
| **Economy** | `/buy <item_id>` | Purchase store item |
| **Economy** | `/inventory` | View acquired collectibles |
| **Economy** | `/economy-leaderboard` | Top 10 wealthiest members |
| **Music** | `/play <query>` | Connects and enqueues audio track |
| **Music** | `/pause` | Pauses audio playback |
| **Music** | `/resume` | Resumes playback |
| **Music** | `/skip` | Advances to next track |
| **Music** | `/stop` | Clears queue and disconnects |
| **Music** | `/queue` | Upcoming song list |
| **Music** | `/nowplaying` | Interactive playback embed with buttons |
| **Music** | `/volume <0-100>` | Adjusts audio volume |
| **Music** | `/loop [off\|song\|queue]` | Sets track/queue repeat mode |
| **Fun** | `/joke`, `/meme` | Curated comedy and Reddit memes |
| **Fun** | `/cat`, `/dog` | Animal images and facts |
| **Fun** | `/8ball <question>` | Fortune prediction |
| **Fun** | `/coinflip`, `/dice` | Chance games |
| **Fun** | `/roast [user]` | Witty roast |
| **Fun** | `/ship <u1> <u2>` | Love compatibility calculation |
| **Fun** | `/rate <item>` | 1-10 rating system |
| **Fun** | `/choose <options>` | Decision helper |
| **Config** | `/config view` | Active server configuration overview |
| **Config** | `/config welcome` | Welcome channel, message & auto-role |
| **Config** | `/config logs` | Server audit log channel |
| **Config** | `/config moderation` | Mod log channel & auto-mod rules |
| **Config** | `/config ai` | AI Assistant channel & toggle |
| **Config** | `/config leveling` | Level-up announcement channel |
| **Config** | `/config economy` | Enable or disable economy |

---

## 🛡️ Bot Permissions Guide

| Permission | Reason |
| :--- | :--- |
| **Send Messages** | Deliver command replies and announcements |
| **Embed Links** | Render rich glassmorphic cards and stats |
| **Manage Messages** | Required for `/clear` and auto-mod message removal |
| **Kick Members** | Required for `/kick` command |
| **Ban Members** | Required for `/ban` and `/unban` commands |
| **Moderate Members** | Required for `/timeout` and auto-mod strike punishments |
| **Manage Channels** | Required for `/lock`, `/unlock`, and `/slowmode` |
| **Manage Roles** | Required for onboarding auto-roles and level rewards |
| **Connect & Speak** | Required for high-fidelity music streaming in voice channels |

---

## 🔒 Security Best Practices

1. **Environment Secrets**: Never commit `.env` to Git. `.gitignore` is pre-configured to exclude all `.env` files and logs.
2. **SQL Injection Protection**: All queries in `src/database/` use parameterized prepared statements (`?` placeholders).
3. **Role Hierarchy Checks**: ChathuX enforces strict role hierarchy validation: moderators cannot target members with higher or equal roles, and the bot cannot target members above its highest role.
4. **Discord OAuth2 Validation**: The dashboard checks for `0x8` (Administrator) or `0x20` (Manage Server) bitflags before allowing any guild settings modification.

---

## 📜 License

This project is licensed under the ISC License. Built with pride by the **ChathuX Engineering Team**.
