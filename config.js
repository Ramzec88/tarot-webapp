// config.js - Конфигурация для тестирования
const API_CONFIG = {
    // Ваши n8n webhook URLs
    createUser: 'https://romanmedn8n.ru/webhook/tarot-create-user',
    getProfile: 'https://romanmedn8n.ru/webhook/tarot-get-profile', 
    generatePrediction: 'https://romanmedn8n.ru/webhook/tarot-prediction',
    
    // Пока оставим пустыми - заполним позже
    supabaseUrl: '',
    supabaseKey: '',
    
    // Настройки приложения
    freeQuestionsLimit: 3,
    premiumPrice: 299
};

// Колода карт для тестов
const TAROT_CARDS = [
    {
        name: "Шут",
        symbol: "🃏", 
        image: "https://via.placeholder.com/100x150/1a1a2e/ffd700?text=🃏",
        meaning: "Новые начинания, спонтанность, свобода"
    },
    {
        name: "Маг",
        symbol: "🎩",
        image: "https://via.placeholder.com/100x150/1a1a2e/ffd700?text=🎩", 
        meaning: "Сила воли, мастерство, концентрация"
    },
    {
        name: "Жрица",
        symbol: "🌙",
        image: "https://via.placeholder.com/100x150/1a1a2e/ffd700?text=🌙",
        meaning: "Интуиция, тайные знания, подсознание"
    }
];