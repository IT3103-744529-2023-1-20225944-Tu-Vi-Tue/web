/**
 * Chatbot.js - Xử lý logic chatbot và các chức năng AI
 */

// Lưu trữ lịch sử trò chuyện
let chatHistory = [];

// Danh sách từ khóa và câu trả lời
const responses = {
    // Chào hỏi
    'chào': 'Xin chào! Tôi có thể giúp gì cho bạn?',
    'hello': 'Xin chào! Tôi có thể giúp gì cho bạn?',
    'hi': 'Chào bạn! Tôi có thể giúp gì cho bạn?',
    'xin chào': 'Chào bạn! Tôi có thể giúp gì cho bạn?',
    
    // Thông tin cửa hàng
    'giờ mở cửa': 'Cửa hàng mở cửa từ 7:00 - 22:00 các ngày trong tuần, cuối tuần mở đến 23:00.',
    'địa chỉ': 'Cửa hàng chúng tôi đặt tại Tp Hà Nội.',
    'liên hệ': 'Bạn có thể liên hệ với chúng tôi qua số điện thoại 0348 405 323 hoặc email Tue@gmail.com.',
    'số điện thoại': 'Số điện thoại của cửa hàng là 0348 405 323.',
    
    // Thông tin sản phẩm
    'bánh kem': 'Chúng tôi có nhiều loại bánh kem với các kích cỡ và hương vị khác nhau. Bạn muốn loại bánh nào?',
    'đồ uống': 'Chúng tôi có các loại đồ uống như cà phê, trà sữa, nước ép trái cây. Bạn muốn đặt loại nào?',
    'đồ ăn': 'Chúng tôi có các loại bánh ngọt, bánh mì và snack. Bạn muốn xem loại nào?',
    
    // Đặt hàng
    'đặt hàng': 'Để đặt hàng, bạn có thể thêm sản phẩm vào giỏ hàng và tiến hành thanh toán. Bạn cần giúp đỡ gì không?',
    'thanh toán': 'Chúng tôi hỗ trợ thanh toán khi nhận hàng (COD), thanh toán bằng thẻ và ví điện tử MoMo.',
    'giao hàng': 'Chúng tôi giao hàng trong vòng 60 phút trong khu vực nội thành, phí giao hàng là 30.000 VNĐ.',
    
    // Hỗ trợ
    'giúp': 'Tôi có thể giúp bạn tìm kiếm sản phẩm, đặt hàng, hoặc trả lời các câu hỏi về cửa hàng. Bạn cần hỗ trợ gì?',
    'help': 'Tôi có thể giúp bạn tìm kiếm sản phẩm, đặt hàng, hoặc trả lời các câu hỏi về cửa hàng. Bạn cần hỗ trợ gì?',
    
    // Mặc định
    'default': 'Xin lỗi, tôi không hiểu câu hỏi của bạn. Bạn có thể hỏi về sản phẩm, giờ mở cửa, hoặc cách đặt hàng.'
};

// Danh sách gợi ý sản phẩm theo nhu cầu
const productSuggestions = {
    'sinh nhật': [
        { name: 'Bánh kem sinh nhật', description: 'Bánh kem trang trí theo chủ đề sinh nhật' },
        { name: 'Bánh cupcake', description: 'Set 6 bánh cupcake trang trí sinh nhật' }
    ],
    'tiệc': [
        { name: 'Bánh kem lớn', description: 'Bánh kem 2 tầng cho 15-20 người' },
        { name: 'Bánh ngọt nhỏ', description: 'Set bánh ngọt nhỏ đa dạng cho tiệc' }
    ],
    'cà phê': [
        { name: 'Cà phê đen', description: 'Cà phê đen đậm đà' },
        { name: 'Cà phê sữa', description: 'Cà phê sữa béo ngậy' }
    ],
    'trà sữa': [
        { name: 'Trà sữa trân châu', description: 'Trà sữa với trân châu đường đen' },
        { name: 'Trà sữa matcha', description: 'Trà sữa vị matcha đậm đà' }
    ],
    'bánh mì': [
        { name: 'Bánh mì thịt', description: 'Bánh mì kẹp thịt thơm ngon' },
        { name: 'Bánh mì chà bông', description: 'Bánh mì chà bông mềm mịn' }
    ]
};

/**
 * Khởi tạo chatbot
 */
function initChatbot() {
    // Thêm tin nhắn chào mừng
    addBotMessage('Xin chào! Tôi có thể giúp gì cho bạn?');
    
    // Thêm sự kiện cho nút gửi và input
    const sendButton = document.querySelector('.chat-input button');
    const chatInput = document.getElementById('chatInput');
    
    if (sendButton) {
        sendButton.addEventListener('click', handleSendMessage);
    }
    
    if (chatInput) {
        chatInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                handleSendMessage();
            }
        });
    }
}

/**
 * Xử lý khi người dùng gửi tin nhắn
 */
function handleSendMessage() {
    const chatInput = document.getElementById('chatInput');
    const message = chatInput.value.trim();
    
    if (message) {
        // Hiển thị tin nhắn của người dùng
        addUserMessage(message);
        
        // Xóa input
        chatInput.value = '';
        
        // Xử lý và trả lời
        processMessage(message);
    }
}

/**
 * Thêm tin nhắn của người dùng vào khung chat
 * @param {string} message - Nội dung tin nhắn
 */
function addUserMessage(message) {
    const chatMessages = document.querySelector('.chat-messages');
    
    chatMessages.innerHTML += `
        <div class="message user-message">
            <p>${message}</p>
            <i class="fas fa-user"></i>
        </div>
    `;
    
    // Lưu vào lịch sử
    chatHistory.push({ sender: 'user', message: message });
    
    // Cuộn xuống dưới
    scrollToBottom();
}

/**
 * Thêm tin nhắn của bot vào khung chat
 * @param {string} message - Nội dung tin nhắn
 */
function addBotMessage(message) {
    const chatMessages = document.querySelector('.chat-messages');
    
    chatMessages.innerHTML += `
        <div class="message bot-message">
            <i class="fas fa-robot"></i>
            <p>${message}</p>
        </div>
    `;
    
    // Lưu vào lịch sử
    chatHistory.push({ sender: 'bot', message: message });
    
    // Cuộn xuống dưới
    scrollToBottom();
}

/**
 * Cuộn khung chat xuống dưới cùng
 */
function scrollToBottom() {
    const chatMessages = document.querySelector('.chat-messages');
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

/**
 * Xử lý tin nhắn và tạo câu trả lời
 * @param {string} message - Tin nhắn của người dùng
 */
function processMessage(message) {
    // Chuyển tin nhắn về chữ thường để dễ so sánh
    const lowerMessage = message.toLowerCase();
    
    // Hiển thị đang nhập
    showTypingIndicator();
    
    // Tìm câu trả lời phù hợp sau một khoảng thời gian
    setTimeout(() => {
        // Xóa hiệu ứng đang nhập
        hideTypingIndicator();
        
        // Tìm câu trả lời dựa trên từ khóa
        let response = findResponse(lowerMessage);
        
        // Kiểm tra nếu là yêu cầu gợi ý sản phẩm
        const productSuggestion = findProductSuggestion(lowerMessage);
        if (productSuggestion) {
            response = productSuggestion;
        }
        
        // Hiển thị câu trả lời
        addBotMessage(response);
    }, 1000);
}

/**
 * Hiển thị hiệu ứng bot đang nhập
 */
function showTypingIndicator() {
    const chatMessages = document.querySelector('.chat-messages');
    
    // Tạo và thêm hiệu ứng đang nhập
    const typingIndicator = document.createElement('div');
    typingIndicator.className = 'message bot-message typing-indicator';
    typingIndicator.innerHTML = `
        <i class="fas fa-robot"></i>
        <p><span class="dot"></span><span class="dot"></span><span class="dot"></span></p>
    `;
    
    chatMessages.appendChild(typingIndicator);
    scrollToBottom();
}

/**
 * Ẩn hiệu ứng bot đang nhập
 */
function hideTypingIndicator() {
    const typingIndicator = document.querySelector('.typing-indicator');
    if (typingIndicator) {
        typingIndicator.remove();
    }
}

/**
 * Tìm câu trả lời dựa trên từ khóa
 * @param {string} message - Tin nhắn của người dùng (đã chuyển thành chữ thường)
 * @returns {string} - Câu trả lời phù hợp
 */
function findResponse(message) {
    // Tìm từ khóa trong tin nhắn
    for (const keyword in responses) {
        if (message.includes(keyword)) {
            return responses[keyword];
        }
    }
    
    // Nếu không tìm thấy từ khóa nào, trả về câu mặc định
    return responses['default'];
}

/**
 * Tìm gợi ý sản phẩm dựa trên nhu cầu
 * @param {string} message - Tin nhắn của người dùng (đã chuyển thành chữ thường)
 * @returns {string|null} - Câu trả lời với gợi ý sản phẩm hoặc null nếu không tìm thấy
 */
function findProductSuggestion(message) {
    // Kiểm tra xem tin nhắn có chứa từ khóa về sản phẩm không
    for (const keyword in productSuggestions) {
        if (message.includes(keyword)) {
            const products = productSuggestions[keyword];
            let response = `Dựa trên nhu cầu của bạn về "${keyword}", tôi gợi ý những sản phẩm sau:\n`;
            
            products.forEach(product => {
                response += `- ${product.name}: ${product.description}\n`;
            });
            
            response += '\nBạn có muốn xem chi tiết sản phẩm nào không?';
            return response;
        }
    }
    
    return null;
}

/**
 * Phân tích cảm xúc từ tin nhắn
 * @param {string} message - Tin nhắn cần phân tích
 * @returns {string} - Cảm xúc (positive, negative, neutral)
 */
function analyzeSentiment(message) {
    // Danh sách từ tích cực
    const positiveWords = ['tốt', 'hay', 'thích', 'ngon', 'tuyệt', 'xuất sắc', 'yêu', 'thú vị', 'hài lòng'];
    
    // Danh sách từ tiêu cực
    const negativeWords = ['tệ', 'kém', 'chán', 'dở', 'không thích', 'không ngon', 'thất vọng', 'buồn'];
    
    // Đếm số từ tích cực và tiêu cực
    let positiveCount = 0;
    let negativeCount = 0;
    
    // Chuyển tin nhắn về chữ thường
    const lowerMessage = message.toLowerCase();
    
    // Đếm từ tích cực
    positiveWords.forEach(word => {
        if (lowerMessage.includes(word)) {
            positiveCount++;
        }
    });
    
    // Đếm từ tiêu cực
    negativeWords.forEach(word => {
        if (lowerMessage.includes(word)) {
            negativeCount++;
        }
    });
    
    // Xác định cảm xúc
    if (positiveCount > negativeCount) {
        return 'positive';
    } else if (negativeCount > positiveCount) {
        return 'negative';
    } else {
        return 'neutral';
    }
}

/**
 * Xử lý phản hồi dựa trên cảm xúc
 * @param {string} message - Tin nhắn của người dùng
 * @returns {string} - Phản hồi dựa trên cảm xúc
 */
function handleSentimentResponse(message) {
    const sentiment = analyzeSentiment(message);
    
    switch (sentiment) {
        case 'positive':
            return 'Cảm ơn bạn đã có phản hồi tích cực! Chúng tôi rất vui khi bạn hài lòng.';
        case 'negative':
            return 'Chúng tôi rất tiếc về trải nghiệm không tốt của bạn. Bạn có thể cho chúng tôi biết chi tiết hơn để chúng tôi cải thiện không?';
        default:
            return 'Cảm ơn bạn đã phản hồi. Bạn có cần hỗ trợ thêm gì không?';
    }
}

/**
 * Tạo câu trả lời ngẫu nhiên cho các câu hỏi không có trong danh sách
 * @returns {string} - Câu trả lời ngẫu nhiên
 */
function getRandomResponse() {
    const responses = [
        'Xin lỗi, tôi không hiểu câu hỏi của bạn. Bạn có thể diễn đạt theo cách khác được không?',
        'Tôi chưa được lập trình để trả lời câu hỏi này. Bạn có thể hỏi về sản phẩm hoặc dịch vụ của chúng tôi không?',
        'Hmm, tôi không chắc mình hiểu đúng ý bạn. Bạn có thể hỏi về giờ mở cửa, sản phẩm hoặc cách đặt hàng không?',
        'Câu hỏi của bạn hơi phức tạp với tôi. Bạn có muốn biết về các sản phẩm của chúng tôi không?'
    ];
    
    // Trả về một câu trả lời ngẫu nhiên
    const randomIndex = Math.floor(Math.random() * responses.length);
    return responses[randomIndex];
}

/**
 * Ghi nhớ thông tin người dùng từ cuộc trò chuyện
 * @param {string} message - Tin nhắn của người dùng
 */
function rememberUserInfo(message) {
    // Lưu trữ thông tin người dùng
    const userInfo = {
        preferences: [],
        contactInfo: null,
        lastInteraction: new Date().toISOString()
    };
    
    // Phân tích tin nhắn để tìm thông tin
    const lowerMessage = message.toLowerCase();
    
    // Tìm sở thích
    const preferenceKeywords = ['thích', 'yêu thích', 'ưa thích', 'sở thích'];
    preferenceKeywords.forEach(keyword => {
        if (lowerMessage.includes(keyword)) {
            // Tìm vị trí của từ khóa
            const keywordIndex = lowerMessage.indexOf(keyword);
            // Lấy phần sau từ khóa (giả sử đó là sở thích)
            const preference = message.substring(keywordIndex + keyword.length).trim();
            if (preference) {
                userInfo.preferences.push(preference);
            }
        }
    });
    
    // Tìm thông tin liên hệ (email hoặc số điện thoại)
    const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
    const phoneRegex = /(\+84|0)\d{9,10}/g;
    
    const emailMatch = message.match(emailRegex);
    const phoneMatch = message.match(phoneRegex);
    
    if (emailMatch) {
        userInfo.contactInfo = emailMatch[0];
    } else if (phoneMatch) {
        userInfo.contactInfo = phoneMatch[0];
    }
    
    // Lưu thông tin người dùng vào localStorage
    localStorage.setItem('chatbotUserInfo', JSON.stringify(userInfo));
}

/**
 * Lấy thông tin người dùng đã lưu
 * @returns {Object|null} - Thông tin người dùng hoặc null nếu không có
 */
function getUserInfo() {
    const userInfo = localStorage.getItem('chatbotUserInfo');
    return userInfo ? JSON.parse(userInfo) : null;
}

/**
 * Tạo câu trả lời cá nhân hóa dựa trên thông tin người dùng
 * @returns {string} - Câu trả lời cá nhân hóa
 */
function getPersonalizedResponse() {
    const userInfo = getUserInfo();
    
    if (!userInfo) {
        return null;
    }
    
    // Tạo câu trả lời dựa trên sở thích
    if (userInfo.preferences && userInfo.preferences.length > 0) {
        const preference = userInfo.preferences[0];
        return `Tôi nhớ bạn đã đề cập rằng bạn thích ${preference}. Chúng tôi có một số sản phẩm có thể phù hợp với sở thích của bạn.`;
    }
    
    return null;
}

// Ghi đè hàm sendMessage trong main.js
function sendMessage() {
    handleSendMessage();
}

// Ghi đè hàm toggleChatbot trong main.js
function toggleChatbot() {
    const chatbotContent = document.querySelector('.chatbot-content');
    if (chatbotContent.style.display === 'none') {
        chatbotContent.style.display = 'block';
        // Khởi tạo chatbot nếu chưa có tin nhắn nào
        if (document.querySelectorAll('.chat-messages .message').length <= 1) {
            initChatbot();
        }
    } else {
        chatbotContent.style.display = 'none';
    }
}

// Khởi tạo chatbot khi trang được tải
document.addEventListener('DOMContentLoaded', function() {
    // Thêm CSS cho hiệu ứng đang nhập
    const style = document.createElement('style');
    style.textContent = `
        .typing-indicator .dot {
            display: inline-block;
            width: 8px;
            height: 8px;
            border-radius: 50%;
            background-color: #ccc;
            margin-right: 3px;
            animation: typing 1s infinite ease-in-out;
        }
        
        .typing-indicator .dot:nth-child(1) {
            animation-delay: 0s;
        }
        
        .typing-indicator .dot:nth-child(2) {
            animation-delay: 0.2s;
        }
        
        .typing-indicator .dot:nth-child(3) {
            animation-delay: 0.4s;
        }
        
        @keyframes typing {
            0% { transform: translateY(0); }
            50% { transform: translateY(-5px); }
            100% { transform: translateY(0); }
        }
    `;
    document.head.appendChild(style);
});