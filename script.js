// Исправленные функции для работы с n8n API в script.js

// ===== ИСПРАВЛЕННАЯ ФУНКЦИЯ ГЕНЕРАЦИИ AI-ПРЕДСКАЗАНИЯ =====
async function generateAIPredictionToContainer(containerId, type, card, question = '') {
    const container = document.getElementById(containerId);
    if (!container) return '';
    
    const aiBlock = document.createElement('div');
    aiBlock.className = 'ai-prediction';
    aiBlock.innerHTML = `
        <div class="ai-header">
            <div class="ai-icon">🤖</div>
            <div class="ai-title">ИИ-толкование</div>
        </div>
        <div class="ai-content">
            <div class="generating-text">Генерирую персональное предсказание...</div>
        </div>
    `;
    
    container.appendChild(aiBlock);
    
    try {
        let prediction = '';
        
        // ИСПРАВЛЕНО: Всегда используем POST запрос с данными
        if (typeof API_CONFIG !== 'undefined' && API_CONFIG.primary && API_CONFIG.primary.generatePrediction) {
            
            const requestData = {
                type: type,
                card: {
                    name: card.name,
                    symbol: card.symbol,
                    meaning: card.meaning,
                    image: card.image || ''
                },
                question: question || '',
                userName: userName || 'Гость',
                userBirthdate: userBirthdate || '',
                timestamp: new Date().toISOString(),
                // Дополнительная информация для улучшения предсказания
                requestId: Date.now(),
                clientInfo: {
                    userAgent: navigator.userAgent,
                    language: navigator.language
                }
            };

            console.log('📤 Отправляю данные в n8n:', requestData);

            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 секунд

            const response = await fetch(API_CONFIG.primary.generatePrediction, {
                method: 'POST', // ИСПРАВЛЕНО: используем POST вместо GET
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    // Дополнительные заголовки для лучшей совместимости
                    'Cache-Control': 'no-cache',
                    'X-Requested-With': 'XMLHttpRequest'
                },
                body: JSON.stringify(requestData),
                signal: controller.signal
            });

            clearTimeout(timeoutId);

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}, statusText: ${response.statusText}`);
            }

            const responseText = await response.text();
            console.log('📥 Ответ от n8n (raw):', responseText);

            let result;
            try {
                result = JSON.parse(responseText);
            } catch (parseError) {
                console.warn('⚠️ Ответ не является JSON, используем как текст:', responseText);
                // Если ответ не JSON, используем как готовое предсказание
                result = { prediction: responseText };
            }

            prediction = result.prediction || result.response || result.message || responseText || "Карты молчат сегодня...";
            
            console.log('✅ Получено предсказание от ИИ:', prediction);

        } else {
            console.warn('⚠️ API_CONFIG не настроен, используем локальную генерацию');
            prediction = generatePredictionText(type, card, question);
        }
       
        // Задержка перед началом печати текста
        setTimeout(() => {
            const aiContent = aiBlock.querySelector('.ai-content');
            if (aiContent) {
                typeWriter(aiContent, prediction, 30); // Эффект печатания
            }
        }, 2000); 
        
        return prediction;
       
    } catch (error) {
        console.error('❌ Ошибка ИИ-предсказания:', error);
        
        // Детальная обработка ошибок
        let errorMessage = 'Произошла ошибка при обращении к ИИ';
        
        if (error.name === 'AbortError') {
            errorMessage = 'Превышено время ожидания ответа от ИИ';
        } else if (error.message.includes('Failed to fetch')) {
            errorMessage = 'Не удается подключиться к серверу ИИ';
        } else if (error.message.includes('404')) {
            errorMessage = 'Эндпоинт ИИ не найден';
        } else if (error.message.includes('CORS')) {
            errorMessage = 'Проблема с CORS настройками';
        }
        
        console.warn('🔄 Используем локальную генерацию из-за ошибки:', errorMessage);
        
        // Фоллбэк на локальную генерацию текста при ошибке API
        const prediction = generatePredictionText(type, card, question);
        setTimeout(() => {
            const aiContent = aiBlock.querySelector('.ai-content');
            if (aiContent) {
                typeWriter(aiContent, prediction, 50);
            }
        }, 2000); 
        return prediction;
    }
}

// ===== НОВАЯ ФУНКЦИЯ ДЛЯ УНИВЕРСАЛЬНЫХ API ЗАПРОСОВ =====
async function makeSecureAPIRequest(endpoint, data, options = {}) {
    const defaultOptions = {
        timeout: 30000,
        retries: 2,
        retryDelay: 2000
    };
    
    const config = { ...defaultOptions, ...options };
    
    // Определяем URL эндпоинта
    let url;
    if (typeof API_CONFIG !== 'undefined' && API_CONFIG.primary && API_CONFIG.primary[endpoint]) {
        url = API_CONFIG.primary[endpoint];
    } else {
        throw new Error(`Эндпоинт ${endpoint} не найден в конфигурации`);
    }
    
    // Функция для одной попытки запроса
    async function attemptRequest(attemptNumber) {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), config.timeout);
        
        try {
            console.log(`🔄 Попытка ${attemptNumber}: ${endpoint}`);
            
            const response = await fetch(url, {
                method: 'POST', // Всегда используем POST для n8n webhooks
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'Cache-Control': 'no-cache'
                },
                body: JSON.stringify({
                    ...data,
                    timestamp: new Date().toISOString(),
                    requestId: Date.now() + '_' + attemptNumber
                }),
                signal: controller.signal
            });
            
            clearTimeout(timeoutId);
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            
            const responseText = await response.text();
            
            try {
                return JSON.parse(responseText);
            } catch {
                return { success: true, data: responseText };
            }
            
        } catch (error) {
            clearTimeout(timeoutId);
            
            if (attemptNumber < config.retries) {
                console.warn(`⚠️ Попытка ${attemptNumber} неудачна, повторяю через ${config.retryDelay}мс:`, error.message);
                await new Promise(resolve => setTimeout(resolve, config.retryDelay));
                return attemptRequest(attemptNumber + 1);
            } else {
                throw error;
            }
        }
    }
    
    return attemptRequest(1);
}

// ===== ИСПРАВЛЕННЫЕ ФУНКЦИИ СОХРАНЕНИЯ ДАННЫХ =====

async function saveDailyCardToSupabase(card) {
    console.log('💾 Сохранение карты дня:', card.name);
    
    try {
        const result = await makeSecureAPIRequest('saveDailyCard', {
            user_id: currentUser?.telegram_id || 'anonymous',
            card_name: card.name,
            card_symbol: card.symbol,
            card_meaning: card.meaning,
            card_image: card.image || '',
            drawn_date: new Date().toISOString().split('T')[0],
            user_info: {
                username: currentUser?.username || '',
                first_name: currentUser?.first_name || ''
            }
        });
        
        console.log('✅ Карта дня сохранена:', result);
        return result;
        
    } catch (error) {
        console.error('❌ Ошибка сохранения карты дня:', error);
        return null;
    }
}

async function saveQuestionToSupabase(question, isFollowUp) {
    console.log('💾 Сохранение вопроса:', question);
    
    try {
        const result = await makeSecureAPIRequest('saveQuestion', {
            user_id: currentUser?.telegram_id || 'anonymous',
            question_text: question,
            is_follow_up: isFollowUp,
            user_info: {
                username: currentUser?.username || '',
                first_name: currentUser?.first_name || '',
                display_name: userName || ''
            }
        });
        
        console.log('✅ Вопрос сохранен:', result);
        return result;
        
    } catch (error) {
        console.error('❌ Ошибка сохранения вопроса:', error);
        return { id: Date.now() }; // Возвращаем фейковый ID для продолжения работы
    }
}

async function saveAnswerToSupabase(questionId, card, aiPrediction) {
    console.log('💾 Сохранение ответа для вопроса:', questionId);
    
    try {
        const result = await makeSecureAPIRequest('saveAnswer', {
            question_id: questionId,
            user_id: currentUser?.telegram_id || 'anonymous',
            card_name: card.name,
            card_symbol: card.symbol,
            card_meaning: card.meaning,
            card_image: card.image || '',
            ai_prediction: aiPrediction,
            user_info: {
                username: currentUser?.username || '',
                first_name: currentUser?.first_name || ''
            }
        });
        
        console.log('✅ Ответ сохранен:', result);
        return result;
        
    } catch (error) {
        console.error('❌ Ошибка сохранения ответа:', error);
        return null;
    }
}

async function updateUserQuestionsInSupabase() {
    console.log('💾 Обновление количества вопросов:', questionsLeft);
    
    try {
        const result = await makeSecureAPIRequest('updateSubscription', {
            user_id: currentUser?.telegram_id || 'anonymous',
            free_questions_left: questionsLeft,
            action: 'update_questions'
        });
        
        console.log('✅ Количество вопросов обновлено:', result);
        return result;
        
    } catch (error) {
        console.error('❌ Ошибка обновления количества вопросов:', error);
        return null;
    }
}

// ===== ФУНКЦИЯ ДЛЯ ТЕСТИРОВАНИЯ ПОДКЛЮЧЕНИЯ =====
async function testN8NConnection() {
    try {
        console.log('🧪 Тестирую подключение к n8n...');
        
        const testData = {
            type: 'connection_test',
            message: 'Тест подключения от Telegram Web App',
            timestamp: new Date().toISOString(),
            user_agent: navigator.userAgent
        };
        
        const result = await makeSecureAPIRequest('generatePrediction', testData);
        console.log('✅ Тест подключения успешен:', result);
        return true;
        
    } catch (error) {
        console.error('❌ Тест подключения неудачен:', error);
        return false;
    }
}

// ===== УЛУЧШЕННАЯ ФУНКЦИЯ ДЛЯ ОТЛАДКИ =====
function enableAPIDebugging() {
    // Включаем детальное логирование для отладки
    window.apiDebug = true;
    
    // Перехватываем все fetch запросы для отладки
    const originalFetch = window.fetch;
    window.fetch = function(...args) {
        if (window.apiDebug) {
            console.log('🌐 Fetch запрос:', args);
        }
        return originalFetch.apply(this, args).then(response => {
            if (window.apiDebug) {
                console.log('📥 Fetch ответ:', response.status, response.statusText);
            }
            return response;
        }).catch(error => {
            if (window.apiDebug) {
                console.error('❌ Fetch ошибка:', error);
            }
            throw error;
        });
    };
    
    console.log('🔍 API отладка включена');
}

// Автоматическое включение отладки в development режиме
if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
    enableAPIDebugging();
}