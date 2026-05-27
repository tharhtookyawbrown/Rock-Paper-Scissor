// --- BGM Variables (Updated for HTML Audio) ---
let bgmAudio;
let isMusicPlaying = false;
const musicControlBtn = document.getElementById('music-control');

// Initialize the audio element reference when the script loads
document.addEventListener('DOMContentLoaded', () => {
    // Reference the audio element added to the HTML
    bgmAudio = document.getElementById('game-bgm');
    if (bgmAudio) {
        // Set a moderate default volume for background music
        bgmAudio.volume = 0.4;
    }
});


/**
 * Toggles music playback using the HTML Audio element.
 */
function toggleMusic() {
    if (!bgmAudio) return;

    if (isMusicPlaying) {
        bgmAudio.pause();
        isMusicPlaying = false;
    } else {
        // Start playback (requires user gesture, which the click provides)
        bgmAudio.play().catch(error => {
            console.error("Audio playback failed:", error);
        });
        isMusicPlaying = true;
    }

    // Update button text
    musicControlBtn.textContent = isMusicPlaying ? '🔇 BGM OFF' : '🔊 BGM ON';
}


// --- Game State Variables ---
let playerName = '';
let currentScore = 0;
let oldScore = 0;
let round = 1;
let wins = 0;
let losses = 0;
let ties = 0;

// Rank Icons and Tiers
const RANK_ICONS = {
    'Titanium': '💎',
    'Diamond': '💠',
    'Platinum': '✨',
    'Gold': '🥇',
    'Silver': '🥈',
    'Bronze': '🥉'
};

const RANK_TIERS = [
    { score: 16000, title: 'Titanium', nextRankScore: Infinity },
    { score: 8000, title: 'Diamond', nextRankScore: 16000 },
    { score: 4000, title: 'Platinum', nextRankScore: 8000 },
    { score: 2000, title: 'Gold', nextRankScore: 4000 },
    { score: 1000, title: 'Silver', nextRankScore: 2000 },
    { score: 0, title: 'Bronze', nextRankScore: 1000 }
];

// --- FIX: Corrected HTML tag syntax for images ---
const CHOICES_IMAGES = {
    // 修正前: '<images/rockpixel.png" alt="グー" class="choice-result-img">'
    // 修正後: 正しい <img> タグで開始し、ファイルパスの参照を修正
    'rock': '<img src="images/rockpixel.png" alt="グー" class="choice-result-img">',
    'paper': '<img src="images/paperpixel.png" alt="パー" class="choice-result-img">',
    'scissors': '<img src="images/scissorspixel.png" alt="チョキ" class="choice-result-img">'
};

// --- DOM Element References ---
const nameScreen = document.getElementById('name-screen');
const mainGame = document.getElementById('main-game');
const resultScreen = document.getElementById('result-screen');
const nameInput = document.getElementById('player-name-input');
const playerNameDisplay = document.getElementById('current-player-name');
const scoreDisplay = document.getElementById('current-score-display');
const rankTitleDisplay = document.getElementById('current-rank-title');
const roundNumberDisplay = document.getElementById('round-number');
const playerChoiceDisplay = document.getElementById('player-choice-display');
const cpuChoiceDisplay = document.getElementById('cpu-choice-display');
const matchMessage = document.getElementById('match-message');
const choicesMenuButtons = document.querySelectorAll('#choices-menu button');
const rankProgressBar = document.getElementById('rank-progress-bar');
const roundAnnouncement = document.getElementById('round-announcement');
const announcementText = document.getElementById('announcement-text');


/**
 * 1. Initializes the game, loading the score.
 */
function startGame() {
    playerName = nameInput.value.trim();

    if (playerName.length < 2) {
        alert('Please enter a name with at least 2 characters.');
        return;
    }

    const storedData = localStorage.getItem(playerName);
    currentScore = storedData ? parseInt(storedData, 10) : 0;
    oldScore = currentScore;

    resetMatchStats();
    updateUI();

    nameScreen.classList.add('hidden');
    startMatch();
}

/**
 * Handles the round announcement sequence and starting the match.
 */
function startMatch() {
    mainGame.classList.add('hidden');

    updateUI();

    const roundNumber = round <= 5 ? round : 1;
    announcementText.textContent = `ROUND ${roundNumber} START!`;
    roundAnnouncement.classList.remove('hidden');

    choicesMenuButtons.forEach(btn => btn.disabled = true);

    // ANNOUNCEMENT TIMING: 800ms (Short)
    setTimeout(() => {
        roundAnnouncement.classList.add('hidden');

        choicesMenuButtons.forEach(btn => btn.disabled = false);
        mainGame.classList.remove('hidden');

        matchMessage.textContent = 'Make your move!';
        playerChoiceDisplay.textContent = '❓';
        cpuChoiceDisplay.textContent = '❓';
    }, 800);
}


/**
 * 2. Handles the main game logic for a single round.
 */
function playRound(playerChoice) {
    if (round > 5) return;

    const choices = ['rock', 'paper', 'scissors'];
    const cpuChoice = choices[Math.floor(Math.random() * 3)];

    // --- FIX: Use innerHTML to render the <img> tag string ---
    // (And refer to the correct CHOICES_IMAGES object)
    playerChoiceDisplay.innerHTML = CHOICES_IMAGES[playerChoice];
    cpuChoiceDisplay.innerHTML = CHOICES_IMAGES[cpuChoice];

    choicesMenuButtons.forEach(btn => btn.disabled = true);

    const winner = checkWinner(playerChoice, cpuChoice);

    if (winner === 'player') {
        wins++;
        matchMessage.textContent = 'YOU WIN ROUND!';
    } else if (winner === 'cpu') {
        losses++;
        matchMessage.textContent = 'YOU LOSE ROUND!';
    } else {
        ties++;
        matchMessage.textContent = 'ROUND TIED!';
    }

    // OUTCOME TIMING FIX: 2000ms (Longer)
    if (round < 5) {
        setTimeout(() => {
            // Reset to '?' text
            playerChoiceDisplay.textContent = '❓';
            cpuChoiceDisplay.textContent = '❓';
            matchMessage.textContent = 'Starting next round...';

            round++;

            startMatch();
        }, 2000);
    } else {
        // If it's the last round (round 5), delay and then go to end screen
        setTimeout(endGame, 2000);
    }

    updateUI();
}

/**
 * Helper: Logic to determine the winner of a single round.
 */
function checkWinner(p1, p2) {
    if (p1 === p2) return 'tie';
    if (
        (p1 === 'rock' && p2 === 'scissors') ||
        (p1 === 'paper' && p2 === 'rock') ||
        (p1 === 'scissors' && p2 === 'paper')
    ) {
        return 'player';
    } else {
        return 'cpu';
    }
}

/**
 * 3. Calculates the final score based on NEW RULE, updates localStorage, and shows the results.
 */
function endGame() {
    let matchResultText = '';
    let scoreChange = 0;

    // NEW SCORING LOGIC
    if (wins > losses) {
        matchResultText = '🏆 YOU WIN THE MATCH! 🏆';
        scoreChange = 200;
    } else if (losses > wins) {
        matchResultText = '❌ YOU LOSE THE MATCH ❌';
        scoreChange = -100;
    } else {
        matchResultText = '🤝DRAW🤝';
        scoreChange = 0;
    }

    document.querySelector('#result-screen h2').textContent = matchResultText;

    currentScore += scoreChange;

    localStorage.setItem(playerName, currentScore);

    document.getElementById('final-wins').textContent = wins;
    document.getElementById('final-losses').textContent = losses;
    document.getElementById('final-ties').textContent = ties;
    document.getElementById('old-score').textContent = oldScore;
    document.getElementById('score-change').textContent = scoreChange > 0 ? `+${scoreChange}` : scoreChange;
    document.getElementById('new-score').textContent = currentScore;

    mainGame.classList.add('hidden');
    resultScreen.classList.remove('hidden');
}

/**
 * Resets game state for a new 5-round match, keeping the player and score.
 */
function restartGame() {
    resultScreen.classList.add('hidden');

    document.querySelector('#result-screen h2').textContent = 'MATCH COMPLETE!';

    oldScore = currentScore;
    resetMatchStats();

    startMatch();
}

/**
 * Resets all game state and returns to the name input screen.
 */
function returnToNameInput() {
    window.location.reload();
}

/**
 * Helper: Resets round-specific statistics.
 */
function resetMatchStats() {
    round = 1;
    wins = 0;
    losses = 0;
    ties = 0;
}

/**
 * Helper: Updates UI elements like score, rank title (with icon), and round number.
 */
function updateUI() {
    playerNameDisplay.textContent = playerName.toUpperCase();
    scoreDisplay.textContent = currentScore;
    roundNumberDisplay.textContent = round <= 5 ? round : 5;

    const { title, progress } = getRankInfo(currentScore);
    const icon = RANK_ICONS[title] || '';

    rankTitleDisplay.textContent = `${icon} ${title}`;
    updateRankProgressBar(progress);
}

/**
 * Helper: Determines the rank title and progress percentage based on the score.
 */
function getRankInfo(score) {
    let currentRank = RANK_TIERS[RANK_TIERS.length - 1];
    let nextRank = null;

    for (let i = 0; i < RANK_TIERS.length; i++) {
        if (score >= RANK_TIERS[i].score) {
            currentRank = RANK_TIERS[i];
            if (i > 0) {
                nextRank = RANK_TIERS[i - 1];
            }
            break;
        }
    }

    let progress = 0;
    if (nextRank && nextRank.score !== Infinity) {
        const lowerBound = currentRank.score;
        const upperBound = nextRank.score;
        if (upperBound > lowerBound) {
            progress = ((score - lowerBound) / (upperBound - lowerBound)) * 100;
        }
    } else if (currentRank.score === RANK_TIERS[0].score && currentRank.score !== 0) {
        progress = 100;
    }

    progress = Math.min(100, Math.max(0, progress));

    return { title: currentRank.title, progress: progress };
}

/**
 * Updates the visual width of the rank progress bar.
 */
function updateRankProgressBar(percentage) {
    rankProgressBar.style.width = `${percentage}%`;
}

// Initial setup
playerChoiceDisplay.textContent = '❓';
cpuChoiceDisplay.textContent = '❓';
updateUI();

