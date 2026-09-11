-- ===================================================
-- ChathuX Database Schema
-- Production MySQL 8.0+ Compatible
-- ===================================================

CREATE DATABASE IF NOT EXISTS chathux_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE chathux_db;

-- Guilds registry
CREATE TABLE IF NOT EXISTS guilds (
    id VARCHAR(32) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    icon VARCHAR(255),
    owner_id VARCHAR(32) NOT NULL,
    joined_at DATETIME NOT NULL,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Users registry
CREATE TABLE IF NOT EXISTS users (
    id VARCHAR(32) PRIMARY KEY,
    username VARCHAR(100) NOT NULL,
    discriminator VARCHAR(10) DEFAULT '0',
    avatar VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Guild members
CREATE TABLE IF NOT EXISTS guild_members (
    guild_id VARCHAR(32) NOT NULL,
    user_id VARCHAR(32) NOT NULL,
    nickname VARCHAR(100),
    joined_at DATETIME,
    PRIMARY KEY (guild_id, user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Guild Configuration Settings
CREATE TABLE IF NOT EXISTS guild_settings (
    guild_id VARCHAR(32) PRIMARY KEY,
    prefix VARCHAR(10) DEFAULT '!',
    welcome_channel_id VARCHAR(32) DEFAULT NULL,
    log_channel_id VARCHAR(32) DEFAULT NULL,
    mod_channel_id VARCHAR(32) DEFAULT NULL,
    ai_channel_id VARCHAR(32) DEFAULT NULL,
    level_channel_id VARCHAR(32) DEFAULT NULL,
    auto_role_id VARCHAR(32) DEFAULT NULL,
    welcome_enabled BOOLEAN DEFAULT FALSE,
    logging_enabled BOOLEAN DEFAULT FALSE,
    mod_enabled BOOLEAN DEFAULT TRUE,
    ai_enabled BOOLEAN DEFAULT TRUE,
    leveling_enabled BOOLEAN DEFAULT TRUE,
    economy_enabled BOOLEAN DEFAULT TRUE,
    owner_only_mode BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Moderation Warnings
CREATE TABLE IF NOT EXISTS warnings (
    id INT AUTO_INCREMENT PRIMARY KEY,
    guild_id VARCHAR(32) NOT NULL,
    user_id VARCHAR(32) NOT NULL,
    moderator_id VARCHAR(32) NOT NULL,
    reason TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_user_guild (guild_id, user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Moderation Audit Logs
CREATE TABLE IF NOT EXISTS moderation_logs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    guild_id VARCHAR(32) NOT NULL,
    user_id VARCHAR(32) NOT NULL,
    moderator_id VARCHAR(32) NOT NULL,
    action VARCHAR(32) NOT NULL,
    reason TEXT,
    duration_seconds INT DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_guild_mod (guild_id, created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Moderation Automated Defense Settings
CREATE TABLE IF NOT EXISTS moderation_settings (
    guild_id VARCHAR(32) PRIMARY KEY,
    anti_spam BOOLEAN DEFAULT TRUE,
    anti_flood BOOLEAN DEFAULT TRUE,
    anti_mention BOOLEAN DEFAULT TRUE,
    max_mentions INT DEFAULT 4,
    filter_bad_words BOOLEAN DEFAULT TRUE,
    filter_links BOOLEAN DEFAULT FALSE,
    raid_protection BOOLEAN DEFAULT FALSE,
    auto_timeout_strikes INT DEFAULT 3,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Welcome & Onboarding Settings
CREATE TABLE IF NOT EXISTS welcome_settings (
    guild_id VARCHAR(32) PRIMARY KEY,
    welcome_channel_id VARCHAR(32) DEFAULT NULL,
    welcome_message TEXT,
    welcome_embed_json TEXT,
    auto_role_id VARCHAR(32) DEFAULT NULL,
    send_dm BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- XP and Leveling
CREATE TABLE IF NOT EXISTS xp (
    guild_id VARCHAR(32) NOT NULL,
    user_id VARCHAR(32) NOT NULL,
    xp INT DEFAULT 0,
    level INT DEFAULT 0,
    total_messages INT DEFAULT 0,
    last_xp_gain DATETIME DEFAULT NULL,
    PRIMARY KEY (guild_id, user_id),
    INDEX idx_guild_xp (guild_id, xp DESC)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Level Rewards (Role unlocks)
CREATE TABLE IF NOT EXISTS level_rewards (
    guild_id VARCHAR(32) NOT NULL,
    level INT NOT NULL,
    role_id VARCHAR(32) NOT NULL,
    PRIMARY KEY (guild_id, level)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Economy User Accounts
CREATE TABLE IF NOT EXISTS economy_accounts (
    guild_id VARCHAR(32) NOT NULL,
    user_id VARCHAR(32) NOT NULL,
    balance BIGINT DEFAULT 1000,
    bank BIGINT DEFAULT 0,
    streak INT DEFAULT 0,
    last_daily DATETIME DEFAULT NULL,
    last_work DATETIME DEFAULT NULL,
    PRIMARY KEY (guild_id, user_id),
    INDEX idx_guild_balance (guild_id, balance DESC)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Economy Transactions Audit
CREATE TABLE IF NOT EXISTS transactions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    guild_id VARCHAR(32) NOT NULL,
    sender_id VARCHAR(32) NOT NULL,
    receiver_id VARCHAR(32) NOT NULL,
    amount BIGINT NOT NULL,
    type VARCHAR(32) NOT NULL,
    description VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_guild_tx (guild_id, created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Economy Shop Items
CREATE TABLE IF NOT EXISTS shop_items (
    id INT AUTO_INCREMENT PRIMARY KEY,
    guild_id VARCHAR(32) NOT NULL,
    name VARCHAR(100) NOT NULL,
    description VARCHAR(255),
    price BIGINT NOT NULL,
    role_id VARCHAR(32) DEFAULT NULL,
    stock INT DEFAULT -1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_guild_shop (guild_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- User Inventories
CREATE TABLE IF NOT EXISTS inventory (
    id INT AUTO_INCREMENT PRIMARY KEY,
    guild_id VARCHAR(32) NOT NULL,
    user_id VARCHAR(32) NOT NULL,
    item_id INT NOT NULL,
    quantity INT DEFAULT 1,
    acquired_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY uq_user_item (guild_id, user_id, item_id),
    CONSTRAINT fk_inv_item FOREIGN KEY (item_id) REFERENCES shop_items(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- AI Conversation Sessions
CREATE TABLE IF NOT EXISTS ai_conversations (
    id INT AUTO_INCREMENT PRIMARY KEY,
    guild_id VARCHAR(32) DEFAULT NULL,
    channel_id VARCHAR(32) NOT NULL,
    user_id VARCHAR(32) NOT NULL,
    context_tokens INT DEFAULT 0,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_chan_user (channel_id, user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- AI Conversation History Messages
CREATE TABLE IF NOT EXISTS ai_messages (
    id INT AUTO_INCREMENT PRIMARY KEY,
    conversation_id INT NOT NULL,
    role ENUM('user', 'assistant', 'system') NOT NULL,
    content TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_conv (conversation_id),
    CONSTRAINT fk_conv_msg FOREIGN KEY (conversation_id) REFERENCES ai_conversations(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Platform System Logs
CREATE TABLE IF NOT EXISTS bot_logs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    level VARCHAR(16) NOT NULL,
    category VARCHAR(64) NOT NULL,
    message TEXT NOT NULL,
    metadata JSON DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
