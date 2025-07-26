const API_CONFIG = {
    // Ваш n8n webhook URL (замените на реальный из n8n)
    generatePrediction: 'https://romanmedn8n.ru/webhook-test/tarot-prediction',
    
    // Настройки приложения
    freeQuestionsLimit: 3,
    premiumPrice: 299,
    
    // Отключаем мок-режим после настройки API
    enableMockMode: false
};

// Функция для API вызовов с правильной обработкой
async function apiCall(endpoint, data = {}) {
    console.log(`🌐 API вызов: ${endpoint}`, data);
    
    try {
        const response = await fetch(endpoint, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(data)
        });

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const result = await response.json();
        console.log('✅ API ответ получен:', result);
        return result;

    } catch (error) {
        console.error('❌ Ошибка API:', error);
        
        // Возвращаем fallback ответ при ошибке
        return {
            success: false,
            error: error.message,
            prediction: `⚠️ API временно недоступен. ${generateFallbackPrediction(data)}`,
            card: data.card,
            timestamp: new Date().toISOString()
        };
    }
}

// Fallback предсказание при ошибке API
function generateFallbackPrediction(data) {
    const card = data.card;
    const question = data.question;
    
    if (!card) return "Карты шепчут о важных переменах в вашей жизни.";
    
    let prediction = `Карта "${card.name}" ${card.symbol} говорит: ${card.meaning}`;
    
    if (question) {
        prediction += ` В контексте вашего вопроса "${question}" - доверьтесь своей интуиции.`;
    }
    
    return prediction;
}

// Расширенная колода карт
const TAROT_CARDS = [
    {
        name: "Шут", symbol: "🃏",
        image: "https://via.placeholder.com/100x150/1a1a2e/ffd700?text=🃏",
        meaning: "Новые начинания, спонтанность, свобода. Время для смелых решений и доверия интуиции."
    },
    {
        name: "Маг", symbol: "🎩", 
        image: "https://via.placeholder.com/100x150/1a1a2e/ffd700?text=🎩",
        meaning: "Сила воли, мастерство, концентрация. У вас есть все инструменты для достижения целей."
    },
    {
        name: "Жрица", symbol: "🌙",
        image: "https://via.placeholder.com/100x150/1a1a2e/ffd700?text=🌙", 
        meaning: "Интуиция, тайные знания, подсознание. Слушайте свой внутренний голос."
    },
    {
        name: "Императрица", symbol: "👑",
        image: "https://via.placeholder.com/100x150/1a1a2e/ffd700?text=👑",
        meaning: "Творчество, изобилие, материнство. Время роста и процветания в делах."
    },
    {
        name: "Император", symbol: "⚔️",
        image: "https://via.placeholder.com/100x150/1a1a2e/ffd700?text=⚔️",
        meaning: "Власть, стабильность, контроль. Организуйте свою жизнь и принимайте ответственность."
    },
    {
        name: "Иерофант", symbol: "📿",
        image: "https://via.placeholder.com/100x150/1a1a2e/ffd700?text=📿",
        meaning: "Духовность, традиции, учение. Ищите мудрость в проверенных источниках."
    },
    {
        name: "Влюбленные", symbol: "💕",
        image: "https://via.placeholder.com/100x150/1a1a2e/ffd700?text=💕",
        meaning: "Выбор, гармония, партнерство. Важные решения в отношениях или жизненном пути."
    },
    {
        name: "Колесница", symbol: "🏆",
        image: "https://via.placeholder.com/100x150/1a1a2e/ffd700?text=🏆",
        meaning: "Победа, самоконтроль, движение вперед. Успех достигается через дисциплину."
    },
    {
        name: "Сила", symbol: "🦁",
        image: "https://via.placeholder.com/100x150/1a1a2e/ffd700?text=🦁",
        meaning: "Внутренняя сила, храбрость, терпение. Контролируйте свои инстинкты."
    },
    {
        name: "Отшельник", symbol: "🏮",
        image: "https://via.placeholder.com/100x150/1a1a2e/ffd700?text=🏮",
        meaning: "Поиск истины, уединение, внутренняя мудрость. Время для размышлений."
    }
];

// Функция для получения случайной карты
function getRandomCard() {
    return TAROT_CARDS[Math.floor(Math.random() * TAROT_CARDS.length)];
}
