const economyRepo = require('../database/repositories/economyRepository');

const WORK_SCENARIOS = [
    { title: 'Software Engineer', text: 'You debugged production code for ChathuX platform and earned', min: 250, max: 600 },
    { title: 'Discord Moderator', text: 'You cleared out a wave of spammers and earned', min: 180, max: 450 },
    { title: 'Content Creator', text: 'You streamed to 5,000 viewers and collected', min: 300, max: 750 },
    { title: 'Graphic Designer', text: 'You designed custom Discord banners and earned', min: 200, max: 500 },
    { title: 'Cybersecurity Analyst', text: 'You secured server permissions from raid exploits and earned', min: 350, max: 800 }
];

class EconomyService {
    /**
     * Claims daily coin reward with streak multiplier
     */
    async claimDaily(guildId, userId) {
        const account = await economyRepo.getAccount(guildId, userId);
        const now = Date.now();
        const lastDaily = account.last_daily ? new Date(account.last_daily).getTime() : 0;
        const oneDay = 24 * 60 * 60 * 1000;
        const twoDays = 48 * 60 * 60 * 1000;

        if (now - lastDaily < oneDay) {
            const remainingHours = Math.ceil((oneDay - (now - lastDaily)) / (60 * 60 * 1000));
            return { success: false, reason: `You have already collected your daily reward! Come back in ${remainingHours} hour(s).` };
        }

        // Check streak
        let streak = account.streak || 0;
        if (now - lastDaily > twoDays) {
            streak = 1; // Reset streak if missed
        } else {
            streak += 1;
        }

        // Base 500 coins + streak bonus
        const streakBonus = Math.min(streak * 50, 1000);
        const totalReward = 500 + streakBonus;

        const updated = await economyRepo.claimDaily(guildId, userId, totalReward, streak);
        return {
            success: true,
            reward: totalReward,
            streak,
            newBalance: updated.balance
        };
    }

    /**
     * Executes a work task
     */
    async claimWork(guildId, userId) {
        const account = await economyRepo.getAccount(guildId, userId);
        const now = Date.now();
        const lastWork = account.last_work ? new Date(account.last_work).getTime() : 0;
        const cooldown = 30 * 60 * 1000; // 30 minutes

        if (now - lastWork < cooldown) {
            const remainingMins = Math.ceil((cooldown - (now - lastWork)) / (60 * 1000));
            return { success: false, reason: `You are tired from work! Take a break and rest for ${remainingMins} minute(s).` };
        }

        const scenario = WORK_SCENARIOS[Math.floor(Math.random() * WORK_SCENARIOS.length)];
        const earned = Math.floor(Math.random() * (scenario.max - scenario.min + 1)) + scenario.min;

        const updated = await economyRepo.claimWork(guildId, userId, earned);
        return {
            success: true,
            job: scenario.title,
            description: `${scenario.text} **${earned.toLocaleString()} coins**!`,
            earned,
            newBalance: updated.balance
        };
    }

    /**
     * Transfers money between members safely
     */
    async transfer(guildId, senderId, receiverId, amount) {
        if (senderId === receiverId) {
            return { success: false, reason: 'You cannot transfer coins to yourself.' };
        }

        if (isNaN(amount) || amount <= 0) {
            return { success: false, reason: 'Please specify a positive coin amount.' };
        }

        return await economyRepo.transfer(guildId, senderId, receiverId, amount);
    }
}

module.exports = new EconomyService();
