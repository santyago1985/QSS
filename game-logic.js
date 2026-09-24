// Конфигурация для Robinhood Chain
const RPC_URL = "https://rpc.robinhoodchain.com"; // Замените на актуальный RPC сети, если отличается
const PAIR_ADDRESS = "0xВашАдресПулаЛиквидностиНаDEX"; 

// Минимальный ABI для чтения резервов или цены из пула (стандарт Uniswap V2 Pair)
const PAIR_ABI = [
    "function getReserves() external view returns (uint112 reserve0, uint112 reserve1, uint32 blockTimestampLast)"
];

let lastPrice = null;

async function checkMarketAndSwitchTheme() {
    try {
        // Подключаемся к RPC узлу Robinhood Chain без кошелька (только чтение данных)
        const provider = new ethers.JsonRpcProvider(RPC_URL);
        const pairContract = new ethers.Contract(PAIR_ADDRESS, PAIR_ABI, provider);

        // Получаем резервы токенов в пуле для расчета текущей цены
        const reserves = await pairContract.getReserves();
        
        // Условный расчет цены (зависит от того, как токенизирован ваш пул: token0 / token1)
        const currentPrice = Number(reserves.reserve1) / Number(reserves.reserve0);

        if (lastPrice !== null) {
            const priceChange = ((currentPrice - lastPrice) / lastPrice) * 100;
            updateVisuals(priceChange);
        }

        lastPrice = currentPrice;
    } catch (error) {
        console.error("Ошибка получения данных из блокчейна:", error);
        // Fallback: если RPC недоступен, переводим в безопасный режим или оставляем день
    }
}

// Функция управления визуалом в зависимости от изменения цены
function updateVisuals(changePercent) {
    const body = document.body;
    const statusText = document.getElementById("status-text");

    console.log(`Изменение цены за интервал: ${changePercent.toFixed(2)}%`);

    if (changePercent < -2.0) {
        // Сильное падение -> Включаем ночь/панику
        body.classList.add("is-night");
        statusText.innerText = "🚨 ПАНИКА! Зомби атакуют дома (Цена падает!)";
        statusText.style.color = "#ef4444";
    } else if (changePercent > 0) {
        // Рост -> День
        body.classList.remove("is-night");
        statusText.innerText = "☀️ Бычий рынок! Жители празднуют победу.";
        statusText.style.color = "#22c55e";
    }
}

// Функция покупки токена (интеграция с кошельком пользователя, например MetaMask / Robinhood Wallet)
async function buyToken() {
    if (window.ethereum) {
        try {
            await window.ethereum.request({ method: 'eth_requestAccounts' });
            alert("Подключение к кошельку успешно! Перенаправление на DEX для покупки $PONS...");
            // Здесь можно добавить вызов метода покупки через роутер DEX или редирект на пул
            window.open("https://dex.robinhoodchain.com/#/swap?outputCurrency=ВАШ_АДРЕС_ТОКЕНА", "_blank");
        } catch (err) {
            console.error("Пользователь отклонил подключение кошелька", err);
        }
    } else {
        alert("Пожалуйста, установите Web3-кошелек (например, Robinhood Wallet или MetaMask)!");
    }
}

// Запускаем проверку цены каждые 15 секунд
setInterval(checkMarketAndSwitchTheme, 15000);

// Первичный вызов при загрузке страницы
checkMarketAndSwitchTheme();