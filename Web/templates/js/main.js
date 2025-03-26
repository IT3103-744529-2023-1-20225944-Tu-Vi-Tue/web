// Add these helper functions at the top of the file
function renderStars(rating) {
    // Ensure rating is a number and between 0-5
    rating = Math.min(5, Math.max(0, parseFloat(rating) || 0));
    
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;
    const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);
    
    return `
        <div class="stars">
            ${Array(fullStars).fill('<i class="fas fa-star"></i>').join('')}
            ${hasHalfStar ? '<i class="fas fa-star-half-alt"></i>' : ''}
            ${Array(emptyStars).fill('<i class="far fa-star"></i>').join('')}
        </div>
    `;
}

// Move the global variables next
let currentFilters = {
    category: 'Tất cả',
    subcategory: null,
    style: [],
    suitable: [],
    temperature: [],
    sugar: [],
    price: null
};

let loadedProducts = [];
// These variables are already declared at the end of the file

function scrollToTop() {
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

function toggleChatbot() {
    const chatbotContent = document.querySelector('.chatbot-content');
    chatbotContent.style.display = chatbotContent.style.display === 'none' ? 'block' : 'none';
}

let cartCount = 0;
function addToCart(product, quantity = 1) {
    const cartItems = document.querySelector('.cart-items');
    if (!cartItems) {
        console.warn('Cart items element not found when trying to add to cart');
        return;
    }
    
    // Xử lý đường dẫn hình ảnh nếu chưa được xử lý
    let imagePath = product.image;
    if (!imagePath && product.image_path) {
        imagePath = product.image_path.replace(/\\/g, '/').replace('c:/AI/Web/static/', '');
    }
    if (!imagePath) {
        imagePath = 'uploads/product_images/default.jpg';
    }
    
    const existingItem = cartItems.querySelector(`.cart-item[data-id="${product.id}"]`);
    
    if (existingItem) {
        // Nếu sản phẩm đã tồn tại, tăng số lượng
        const quantitySpan = existingItem.querySelector('.item-quantity span');
        const currentQuantity = parseInt(quantitySpan.textContent);
        quantitySpan.textContent = currentQuantity + quantity;
        cartCount++;
    } else {
        // Nếu là sản phẩm mới, thêm mới vào giỏ hàng
        cartCount += quantity;
        const newItem = `
            <div class="cart-item" data-price="${product.price}" data-id="${product.id}">
                <img src="${imagePath}" alt="${product.name}" style="width: 50px; height: 50px; object-fit: cover;" onerror="this.src='uploads/product_images/default.jpg'">
                <div class="item-details">
                    <h4>${product.name}</h4>
                    <p>${product.price.toLocaleString('vi-VN')} VNĐ</p>
                </div>
                <div class="item-quantity">
                    <button class="quantity-btn" onclick="updateQuantity(this, -1)">-</button>
                    <span>${quantity}</span>
                    <button class="quantity-btn" onclick="updateQuantity(this, 1)">+</button>
                </div>
                <button onclick="removeFromCart(this)" class="remove-item"><i class="fas fa-times"></i></button>
            </div>
        `;
        cartItems.innerHTML += newItem;
    }

    const cartCountElement = document.querySelector('.cart-count');
    if (cartCountElement) {
        cartCountElement.textContent = cartCount;
    }
    
    updateCartTotal();
    saveCart();
}

function updateQuantity(btn, change) {
    const quantitySpan = btn.parentElement.querySelector('span');
    let quantity = parseInt(quantitySpan.textContent) + change;
    if (quantity > 0) {
        quantitySpan.textContent = quantity;
        updateCartTotal();
        saveCart(); // Lưu sau khi cập nhật số lượng
    } else {
        removeFromCart(btn.parentElement.parentElement);
    }
}

function updateCartTotal() {
    let subtotal = 0;
    document.querySelectorAll('.cart-item').forEach(item => {
        const price = parseInt(item.dataset.price);
        const quantityElement = item.querySelector('.item-quantity span');
        if (quantityElement) {
            const quantity = parseInt(quantityElement.textContent);
            subtotal += price * quantity;
        }
    });

    const subtotalEl = document.querySelector('.subtotal-price');
    const totalEl = document.querySelector('.total-price');
    
    if (subtotalEl) {
        subtotalEl.textContent = subtotal.toLocaleString('vi-VN') + ' VNĐ';
    }
    
    if (totalEl) {
        totalEl.textContent = subtotal.toLocaleString('vi-VN') + ' VNĐ';
    }
}

function removeFromCart(button) {
    if (button && button.parentElement) {
        button.parentElement.remove();
        cartCount = Math.max(0, cartCount - 1);
        
        const cartCountElement = document.querySelector('.cart-count');
        if (cartCountElement) {
            cartCountElement.textContent = cartCount;
        }
        
        updateCartTotal();
        saveCart(); // Lưu sau khi xóa
    }
}

function clearNotifications() {
    document.querySelector('.notification-items').innerHTML = '';
}

function showForm(type) {
    document.getElementById(type + 'Form').style.display = 'flex';
}

function hideForm(type) {
    document.getElementById(type + 'Form').style.display = 'none';
}

async function handleLogin(event) {
    event.preventDefault();
    const email = event.target.querySelector('input[type="text"]').value;
    const password = event.target.querySelector('input[type="password"]').value;

    try {
        const response = await fetch('/api/auth/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ email, password })
        });
        
        const data = await response.json();
        
        if (response.ok) {
            // Store user data in localStorage
            localStorage.setItem('currentUser', JSON.stringify(data.user));
            updateUIAfterLogin(data.user);
            hideForm('login');
            addNotification(`Chào mừng ${data.user.name} đã quay trở lại!`, 'success');
            
            // Kiểm tra nếu đang trong quá trình thanh toán mang về
            const delivery = document.querySelector('input[name="delivery"]:checked')?.value;
            if (delivery === 'takeaway') {
                showPaymentForm();
            }
        } else {
            alert(data.error || 'Email hoặc mật khẩu không đúng!');
        }
    } catch (error) {
        console.error('Login error:', error);
        alert('Có lỗi xảy ra khi đăng nhập');
    }
}

function updateUIAfterLogin(user) {
    document.querySelector('.auth-buttons').style.display = 'none';
    const userIcon = document.querySelector('.user-icon');
    userIcon.style.display = 'block';
    
    // Update user info
    userIcon.querySelector('img').src = user.avatar;
    userIcon.querySelector('.user-name').textContent = user.name;
}

async function handleRegister(event) {
    event.preventDefault();
    const name = event.target.querySelector('input[placeholder="Họ và tên"]').value;
    const email = event.target.querySelector('input[type="email"]').value;
    const password = event.target.querySelectorAll('input[type="password"]')[0].value;
    const confirmPassword = event.target.querySelectorAll('input[type="password"]')[1].value;
    
    if (password !== confirmPassword) {
        alert('Mật khẩu xác nhận không khớp!');
        return;
    }
    
    try {
        const response = await fetch('/api/auth/register', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ name, email, password })
        });
        
        const data = await response.json();
        
        if (response.ok) {
            alert('Đăng ký thành công! Vui lòng đăng nhập.');
            hideForm('register');
            showForm('login');
        } else {
            alert(data.error || 'Đăng ký thất bại!');
        }
    } catch (error) {
        console.error('Register error:', error);
        alert('Có lỗi xảy ra khi đăng ký');
    }
}

async function logout() {
    try {
        const response = await fetch('/api/auth/logout', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            }
        });
        
        localStorage.removeItem('currentUser');
        document.querySelector('.auth-buttons').style.display = 'flex';
        document.querySelector('.user-icon').style.display = 'none';
        addNotification('Đã đăng xuất thành công', 'info');
    } catch (error) {
        console.error('Logout error:', error);
        // Vẫn xóa dữ liệu người dùng khỏi localStorage ngay cả khi API thất bại
        localStorage.removeItem('currentUser');
        document.querySelector('.auth-buttons').style.display = 'flex';
        document.querySelector('.user-icon').style.display = 'none';
    }
}

function sendMessage() {
    const input = document.getElementById('chatInput');
    const message = input.value.trim();
    
    if (message) {
        const chatMessages = document.querySelector('.chat-messages');
        
        // Add user message
        chatMessages.innerHTML += `
            <div class="message user-message">
                <p>${message}</p>
                <i class="fas fa-user"></i>
            </div>
        `;
        
        // Clear input
        input.value = '';
        
        // Auto scroll to bottom
        chatMessages.scrollTop = chatMessages.scrollHeight;
        
        // Simulate bot response after 1 second
        setTimeout(() => {
            chatMessages.innerHTML += `
                <div class="message bot-message">
                    <i class="fas fa-robot"></i>
                    <p>Xin lỗi, tôi đang được phát triển và chưa thể trả lời câu hỏi của bạn.</p>
                </div>
            `;
            chatMessages.scrollTop = chatMessages.scrollHeight;
        }, 1000);
    }
}

function toggleDropdown(type) {
    const overlay = document.querySelector('.dropdown-overlay');
    const dropdown = document.querySelector(`.${type}-dropdown`);
    
    overlay.classList.toggle('active');
    dropdown.classList.toggle('active');
}

// Update navigation button click handler
function initializeNavButtons() {
    const navButtons = document.querySelectorAll('.nav-btn');
    navButtons.forEach(button => {
        button.addEventListener('click', () => {
            const category = button.textContent;
            currentCategory = category; // Update current category
            
            navButtons.forEach(btn => btn.classList.remove('active'));
            button.classList.add('active');
            
            displayProducts(loadedProducts, category);
        });
    });
}

function switchForm(type) {
    if (type === 'login') {
        hideForm('register');
        showForm('login');
    } else {
        hideForm('login');
        showForm('register');
    }
}

// Add social login handlers
function handleSocialLogin(provider) {
    console.log(`Logging in with ${provider}`);
    // Add your social login logic here
}

// Replace toggleDeliveryFields with this new function
function toggleDeliveryOption(type) {
    const options = document.querySelectorAll('.delivery-options .option');
    const tableField = document.querySelector('.table-number-field');
    
    options.forEach(opt => {
        if (opt.querySelector('input').value === type) {
            opt.classList.add('active');
        } else {
            opt.classList.remove('active');
        }
    });

    // Show/hide table number field only for dine-in
    tableField.style.display = type === 'dine-in' ? 'block' : 'none';
}

function addNotification(message, type = 'info') {
    const notificationItems = document.querySelector('.notification-items');
    const icon = type === 'success' ? 'check-circle' : 'info-circle';
    const notification = `
        <div class="notification-item">
            <i class="fas fa-${icon}" style="color: ${type === 'success' ? '#28a745' : '#ff6b6b'}"></i>
            <p>${message}</p>
        </div>
    `;
    notificationItems.insertAdjacentHTML('afterbegin', notification);
}

// Thêm hàm lưu giỏ hàng
function saveCart() {
    const cartItemsElement = document.querySelector('.cart-items');
    if (cartItemsElement) {
        const cartItems = cartItemsElement.innerHTML;
        localStorage.setItem('cartItems', cartItems);
        localStorage.setItem('cartCount', cartCount);
    } else {
        console.warn('Cart items element not found when trying to save cart');
    }
}

// Thêm hàm khôi phục giỏ hàng
function restoreCart() {
    const savedItems = localStorage.getItem('cartItems');
    const savedCount = localStorage.getItem('cartCount');
    
    if (savedItems) {
        const cartItemsElement = document.querySelector('.cart-items');
        if (cartItemsElement) {
            cartItemsElement.innerHTML = savedItems;
            cartCount = parseInt(savedCount || '0');
            
            const cartCountElement = document.querySelector('.cart-count');
            if (cartCountElement) {
                cartCountElement.textContent = cartCount;
            }
            
            updateCartTotal();
        }
    }
}

// Hàm để tải sản phẩm từ API
async function fetchProducts() {
    try {
        const response = await fetch('/api/products');
        if (!response.ok) {
            throw new Error('Không thể tải sản phẩm');
        }
        const products = await response.json();
        return products;
    } catch (error) {
        console.error('Lỗi khi tải sản phẩm:', error);
        return [];
    }
}

// Hàm để tải sản phẩm theo danh mục
async function fetchProductsByCategory(category) {
    try {
        const url = category === 'Tất cả' ? '/api/products' : `/api/products/category/${category}`;
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error('Không thể tải sản phẩm theo danh mục');
        }
        const products = await response.json();
        return products;
    } catch (error) {
        console.error('Lỗi khi tải sản phẩm theo danh mục:', error);
        return [];
    }
}

// Hàm để tìm kiếm sản phẩm
async function searchProducts(query) {
    try {
        const response = await fetch(`/api/products/search?q=${encodeURIComponent(query)}`);
        if (!response.ok) {
            throw new Error('Không thể tìm kiếm sản phẩm');
        }
        const products = await response.json();
        return products;
    } catch (error) {
        console.error('Lỗi khi tìm kiếm sản phẩm:', error);
        return [];
    }
}

// Hàm để tải danh mục
async function fetchCategories() {
    try {
        const response = await fetch('/api/categories');
        if (!response.ok) {
            throw new Error('Không thể tải danh mục');
        }
        const categories = await response.json();
        return categories;
    } catch (error) {
        console.error('Lỗi khi tải danh mục:', error);
        return [];
    }
}

// Initialize all event listeners when DOM is loaded
document.addEventListener('DOMContentLoaded', async function() {
    // Add this near the top of the function
    // Setup password toggle icons
    document.querySelectorAll('.toggle-password').forEach(icon => {
        icon.addEventListener('click', function() {
            const input = this.previousElementSibling;
            if (input.type === 'password') {
                input.type = 'text';
                this.classList.remove('fa-eye-slash');
                this.classList.add('fa-eye');
                this.classList.add('visible');
            } else {
                input.type = 'password';
                this.classList.remove('fa-eye');
                this.classList.add('fa-eye-slash');
                this.classList.remove('visible');
            }
        });
    });

    // Check for logged in user
    const savedUser = localStorage.getItem('currentUser');
    if (savedUser) {
        updateUIAfterLogin(JSON.parse(savedUser));
    }

    // Khôi phục giỏ hàng ngay khi trang tải xong
    restoreCart();
    
    // Cart and notification events
    const cartIcon = document.querySelector('.cart-icon');
    const notificationIcon = document.querySelector('.notification-icon');
    const overlay = document.querySelector('.dropdown-overlay');
    const closeCartBtn = document.querySelector('.close-cart');
    const closeNotificationsBtn = document.querySelector('.close-notifications');
    const clearNotificationsBtn = document.querySelector('.clear-notifications');
    const chatInput = document.getElementById('chatInput');

    if (cartIcon) {
        cartIcon.addEventListener('click', (e) => {
            e.stopPropagation();
            toggleDropdown('cart');
        });
    }

    if (notificationIcon) {
        notificationIcon.addEventListener('click', (e) => {
            e.stopPropagation();
            toggleDropdown('notification');
        });
    }

    if (overlay) {
        overlay.addEventListener('click', () => {
            overlay.classList.remove('active');
            document.querySelectorAll('.cart-dropdown, .notification-dropdown').forEach(el => {
                el.classList.remove('active');
            });
        });
    }

    if (closeCartBtn) {
        closeCartBtn.addEventListener('click', () => toggleDropdown('cart'));
    }

    if (closeNotificationsBtn) {
        closeNotificationsBtn.addEventListener('click', () => toggleDropdown('notification'));
    }

    if (clearNotificationsBtn) {
        clearNotificationsBtn.addEventListener('click', clearNotifications);
    }

    if (chatInput) {
        chatInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                sendMessage();
            }
        });
    }

    // Initialize navigation buttons
    initializeNavButtons();

    document.querySelectorAll('.google-btn').forEach(btn => {
        btn.addEventListener('click', () => handleSocialLogin('Google'));
    });

    document.querySelectorAll('.facebook-btn').forEach(btn => {
        btn.addEventListener('click', () => handleSocialLogin('Facebook'));
    });

    // Initialize delivery option on page load
    toggleDeliveryOption('dine-in');

    const checkoutBtn = document.querySelector('.checkout-btn');
    const closePaymentBtn = document.querySelector('.close-payment');
    
    if (checkoutBtn) {
        checkoutBtn.addEventListener('click', () => {
            const delivery = document.querySelector('input[name="delivery"]:checked').value;
            
            if (delivery === 'takeaway') {
                // Kiểm tra đăng nhập khi chọn mang về
                const currentUser = localStorage.getItem('currentUser');
                if (!currentUser) {
                    alert('Vui lòng đăng nhập để tiếp tục thanh toán!');
                    showForm('login');
                    return;
                }
                showPaymentForm();
            } else {
                // Dùng tại quán không cần đăng nhập
                const tableNumber = document.getElementById('tableNumber').value;
                if (!tableNumber) {
                    alert('Vui lòng nhập số bàn!');
                    return;
                }

                const orderNote = document.querySelector('.cart-note textarea').value;
                const orderTime = new Date().toLocaleTimeString();
                const total = document.querySelector('.total-price').textContent;

                addNotification(`Đơn hàng tại bàn ${tableNumber} đã được xác nhận lúc ${orderTime}. Tổng tiền: ${total}`, 'success');
                if (orderNote) {
                    addNotification(`Ghi chú cho bàn ${tableNumber}: ${orderNote}`, 'info');
                }

                clearCart();
                toggleDropdown('cart');
            }
        });
    }
    
    if (closePaymentBtn) {
        closePaymentBtn.addEventListener('click', () => {
            document.querySelector('.payment-overlay').style.display = 'none';
        });
    }
    
    // Payment method selection
    document.querySelectorAll('.payment-option').forEach(option => {
        option.addEventListener('click', () => {
            document.querySelectorAll('.payment-option').forEach(opt => opt.classList.remove('active'));
            option.classList.add('active');
        });
    });

    const confirmPaymentBtn = document.querySelector('.confirm-payment-btn');
    if (confirmPaymentBtn) {
        confirmPaymentBtn.addEventListener('click', async () => {
            const nameInput = document.querySelector('.delivery-address input[placeholder="Họ và tên người nhận"]');
            const phoneInput = document.querySelector('.delivery-address input[placeholder="Số điện thoại"]');
            const addressInput = document.querySelector('.delivery-address textarea');
            const paymentMethod = document.querySelector('input[name="payment"]:checked').value;
            
            if (!nameInput.value || !phoneInput.value || !addressInput.value) {
                alert('Vui lòng điền đầy đủ thông tin giao hàng!');
                return;
            }
            
            // Lấy thông tin giỏ hàng
            const cartItems = [];
            document.querySelectorAll('.cart-item').forEach(item => {
                cartItems.push({
                    id: item.dataset.id,
                    quantity: parseInt(item.querySelector('.item-quantity span').textContent),
                    price: parseFloat(item.dataset.price)
                });
            });
            
            if (cartItems.length === 0) {
                alert('Giỏ hàng của bạn đang trống!');
                return;
            }
            
            const totalPrice = parseFloat(document.querySelector('.total-price').textContent.replace(/[^\d]/g, ''));
            const orderNote = document.querySelector('.cart-note textarea').value;
            
            try {
                const response = await fetch('/api/orders', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        items: cartItems,
                        total_price: totalPrice,
                        delivery_type: 'takeaway',
                        recipient_name: nameInput.value,
                        recipient_phone: phoneInput.value,
                        delivery_address: addressInput.value,
                        payment_method: paymentMethod,
                        note: orderNote
                    })
                });
                
                const data = await response.json();
                
                if (response.ok) {
                    // Add success notification
                    const orderTime = new Date().toLocaleTimeString();
                    addNotification(`Đơn hàng đã được đặt thành công lúc ${orderTime}. Cảm ơn bạn đã mua hàng!`, 'success');
                    
                    // Clear cart and hide payment form
                    clearCart();
                    document.querySelector('.payment-overlay').style.display = 'none';
                } else {
                    alert(data.error || 'Có lỗi xảy ra khi đặt hàng!');
                }
            } catch (error) {
                console.error('Order error:', error);
                alert('Có lỗi xảy ra khi đặt hàng!');
            }
        });
    }

    // Load and display products
    const data = await loadProducts();
    loadedProducts = data.products;
    displayProducts(loadedProducts);

    // Update nav buttons to filter products
    const navButtons = document.querySelectorAll('.nav-btn');
    navButtons.forEach(button => {
        button.addEventListener('click', () => {
            const category = button.textContent;
            displayProducts(data.products, category);
            
            navButtons.forEach(btn => btn.classList.remove('active'));
            button.classList.add('active');
        });
    });

    const closeProfileBtn = document.querySelector('.close-profile');
    if (closeProfileBtn) {
        closeProfileBtn.addEventListener('click', () => {
            document.querySelector('.profile-overlay').style.display = 'none';
        });
    }

    // Add event listeners for sidebar categories
    document.querySelectorAll('.category-section li').forEach(item => {
        item.addEventListener('click', () => {
            const category = item.dataset.category;
            const subcategory = item.dataset.subcategory;
            
            // Remove active class from all items
            document.querySelectorAll('.category-section li').forEach(li => {
                li.classList.remove('active');
            });
            
            // Add active class to clicked item
            item.classList.add('active');
            
            // Filter products
            if (subcategory) {
                displayProducts(data.products, category, subcategory);
            } else {
                displayProducts(data.products, category);
            }
        });
    });

    initializeSearch();
});
    // Gọi hàm kiểm tra và hiển thị sản phẩm
// Add scroll event listener for back-to-top button


// Add scroll event listener for back-to-top button
window.addEventListener('scroll', () => {
    const backToTop = document.querySelector('.back-to-top');
    if (window.scrollY > 300) {
        backToTop.classList.add('visible');
    } else {
        backToTop.classList.remove('visible');
    }
});

function showPaymentForm() {
    const paymentOverlay = document.querySelector('.payment-overlay');
    const cartDropdown = document.querySelector('.cart-dropdown');
    const overlay = document.querySelector('.dropdown-overlay');
    
    // Update payment form with cart totals
    updatePaymentSummary();
    
    // Hide cart and show payment form
    cartDropdown.classList.remove('active');
    overlay.classList.remove('active');
    paymentOverlay.style.display = 'flex';
}

function updatePaymentSummary() {
    const subtotal = document.querySelector('.cart-total .total-price').textContent;
    const shippingFee = '30.000 VNĐ';
    
    document.querySelector('.order-summary .subtotal').textContent = subtotal;
    document.querySelector('.order-summary .final-total').textContent = 
        (parseInt(subtotal.replace(/\D/g,'')) + 30000).toLocaleString('vi-VN') + ' VNĐ';
}

function clearCart() {
    // Clear cart items
    document.querySelector('.cart-items').innerHTML = '';
    // Reset cart count
    cartCount = 0;
    document.querySelector('.cart-count').textContent = '0';
    // Reset cart totals
    document.querySelector('.subtotal-price').textContent = '0 VNĐ';
    document.querySelector('.total-price').textContent = '0 VNĐ';
    localStorage.removeItem('cartItems'); // Xóa giỏ hàng khỏi localStorage
    localStorage.removeItem('cartCount');
}

async function loadProducts() {
    try {
        const products = await fetchProducts();
        return { products: products };
    } catch (error) {
        console.error('Error loading products:', error);
        return { products: [] };
    }
}

function displayProducts(products, category = 'Tất cả', subcategory = null) {
    if (!currentFilters) {
        console.error('currentFilters not initialized');
        return;
    }
    currentFilters.category = category;
    currentFilters.subcategory = subcategory;
    
    // Nếu category không phải 'Tất cả', tải sản phẩm theo danh mục
    if (category !== 'Tất cả') {
        fetchProductsByCategory(category)
            .then(filteredProducts => {
                loadedProducts = filteredProducts;
                updateSidebar(category);
                applyFiltersAndRender();
            })
            .catch(error => {
                console.error('Error fetching products by category:', error);
            });
    } else {
        updateSidebar(category);
        applyFiltersAndRender();
    }
}

function updateSidebar(category) {
    const sidebar = document.querySelector('.sidebar .category-menu');
    if (!sidebar) {
        console.error('Sidebar element not found');
        return;
    }
    
    switch(category) {
        case 'Bánh kem':
            sidebar.innerHTML = `
                <div class="category-section">
                    <h3>Phân loại bánh</h3>
                    <ul>  
                        <li data-subcategory="banh-san-co" class="active">Bánh sẵn có</li>
                        <li data-subcategory="dat-lam-banh">Đặt làm bánh</li>
                    </ul>
                </div>
                <div class="category-section">
                    <h3>Phong cách</h3>
                    <div class="filter-options" data-filter="style">
                        <button data-value="Ngọt ngào">Ngọt ngào</button>
                        <button data-value="Sang trọng">Sang trọng</button>
                        <button data-value="Đơn giản">Đơn giản</button>
                        <button data-value="Hoạt hình">Hoạt hình</button>
                    </div>
                </div>
                <div class="category-section">
                    <h3>Phù hợp với</h3>
                    <div class="filter-options" data-filter="suitable">
                        <button data-value="Nam">Nam</button>
                        <button data-value="Nữ">Nữ</button>
                        <button data-value="Trẻ em">Trẻ em</button>
                        <button data-value="Người lớn">Người lớn</button>
                    </div>
                </div>
                <div class="category-section">
                    <h3>Giá</h3>
                    <div class="price-range">
                        <select onchange="updatePriceFilter(this.value)">
                            <option value="">Tất cả giá</option>
                            <option value="0-100000">Dưới 100,000đ</option>
                            <option value="100000-200000">100,000đ - 200,000đ</option>
                            <option value="200000-300000">200,000đ - 300,000đ</option>
                            <option value="300000+">Trên 300,000đ</option>
                        </select>
                    </div>
                </div>
            `;
            break;

        case 'Đồ uống':
            sidebar.innerHTML = `
                <div class="category-section">
                    <h3>Loại đồ uống</h3>
                    <ul>
                        <li data-subcategory="coffee">Cà phê</li>
                        <li data-subcategory="tra">Trà</li>
                        <li data-subcategory="tra-sua">Trà sữa</li>
                        <li data-subcategory="nuoc-ngot">Nước ngọt</li>
                        <li data-subcategory="sinh-to">Sinh tố</li>
                    </ul>
                </div>
                <div class="category-section">
                    <h3>Nhiệt độ</h3>
                    <div class="filter-options" data-filter="temperature">
                        <button data-value="Nóng">Nóng</button>
                        <button data-value="Lạnh">Lạnh</button>
                    </div>
                </div>
                <div class="category-section">
                    <h3>Độ ngọt</h3>
                    <div class="filter-options" data-filter="sugar">
                        <button data-value="0%">0%</button>
                        <button data-value="30%">30%</button>
                        <button data-value="50%">50%</button>
                        <button data-value="100%">100%</button>
                    </div>
                </div>
                <div class="category-section">
                    <h3>Giá</h3>
                    <div class="price-range">
                        <select onchange="updatePriceFilter(this.value)">
                            <option value="">Tất cả giá</option>
                            <option value="0-30000">Dưới 30,000đ</option>
                            <option value="30000-50000">30,000đ - 50,000đ</option>
                            <option value="50000+">Trên 50,000đ</option>
                        </select>
                    </div>
                </div>
            `;
            break;

        case 'Đồ ăn':
            sidebar.innerHTML = `
                <div class="category-section">
                    <h3>Loại món</h3>
                    <ul>
                        <li data-subcategory="com">Cơm</li>
                        <li data-subcategory="mi">Mì</li>
                        <li data-subcategory="banh-mi">Bánh mì</li>
                        <li data-subcategory="an-vat">Ăn vặt</li>
                    </ul>
                </div>
                <div class="category-section">
                    <h3>Giá</h3>
                    <div class="price-range">
                        <select onchange="updatePriceFilter(this.value)">
                            <option value="">Tất cả giá</option>
                            <option value="0-30000">Dưới 30,000đ</option>
                            <option value="30000-50000">30,000đ - 50,000đ</option>
                            <option value="50000+">Trên 50,000đ</option>
                        </select>
                    </div>
                </div>
            `;
            break;

        default:
            // Xóa sidebar cho category "Tất cả"
            sidebar.innerHTML = '';
            break;
    }
    // Khởi tạo sự kiện cho sidebar mới
    initializeSidebarEvents();
}

function updatePriceFilter(range) {
    currentFilters.price = range;
    applyFiltersAndRender();
}

async function applyFiltersAndRender() {
    // Hiển thị trạng thái đang tải
    const container = document.querySelector('.products');
    if (container) {
        container.innerHTML = `
            <div class="loading-products">
                <i class="fas fa-spinner fa-spin"></i>
                <p>Đang tải sản phẩm...</p>
            </div>
        `;
    }

    // Reset filters if category is "Tất cả"
    if (currentFilters.category === 'Tất cả') {
        resetCurrentFilters();
        try {
            const response = await fetch('/api/products');
            if (!response.ok) throw new Error('Không thể tải sản phẩm');
            const products = await response.json();
            loadedProducts = products; // Cập nhật danh sách sản phẩm đã tải
            renderProducts(products);
        } catch (error) {
            console.error('Lỗi khi tải sản phẩm:', error);
            if (container) {
                container.innerHTML = `
                    <div class="error-message">
                        <i class="fas fa-exclamation-circle"></i>
                        <p>Có lỗi xảy ra khi tải sản phẩm</p>
                    </div>
                `;
            }
        }
        return;
    }

    // Xây dựng URL với các tham số lọc
    const params = new URLSearchParams();
    
    // Thêm category
    if (currentFilters.category !== 'Tất cả') {
        params.append('category', currentFilters.category);
    }
    
    // Thêm subcategory
    if (currentFilters.subcategory) {
        params.append('subcategory', currentFilters.subcategory);
    }
    
    // Thêm các thuộc tính lọc
    ['style', 'suitable', 'temperature', 'sugar'].forEach(filterType => {
        if (currentFilters[filterType] && currentFilters[filterType].length > 0) {
            currentFilters[filterType].forEach(value => {
                params.append(filterType, value);
            });
        }
    });
    
    // Thêm lọc theo giá
    if (currentFilters.price) {
        const [minStr, maxStr] = currentFilters.price.split('-');
        let min = parseInt(minStr);
        params.append('min_price', min);
        
        if (maxStr && maxStr !== '+') {
            let max = parseInt(maxStr);
            params.append('max_price', max);
        }
    }
    
    try {
        // Gọi API lọc sản phẩm
        const response = await fetch(`/api/products/filter?${params.toString()}`);
        if (!response.ok) throw new Error('Không thể lọc sản phẩm');
        
        const filteredProducts = await response.json();
        renderProducts(filteredProducts);
    } catch (error) {
        console.error('Lỗi khi lọc sản phẩm:', error);
        if (container) {
            container.innerHTML = `
                <div class="error-message">
                    <i class="fas fa-exclamation-circle"></i>
                    <p>Có lỗi xảy ra khi lọc sản phẩm</p>
                </div>
            `;
        }
    }
}

function resetCurrentFilters() {
    currentFilters = {
        category: 'Tất cả',
        subcategory: null,
        style: [],
        suitable: [],
        temperature: [],
        sugar: [],
        price: null
    };
}

function initializeSidebarEvents() {
    // Xử lý subcategory
    document.querySelectorAll('.category-section li').forEach(item => {
        item.addEventListener('click', () => {
            document.querySelectorAll('.category-section li').forEach(li => li.classList.remove('active'));
            item.classList.add('active'); 
            currentFilters.subcategory = item.dataset.subcategory;
            applyFiltersAndRender();
        });
    });

    // Xử lý filter buttons
    document.querySelectorAll('.filter-options button').forEach(btn => {
        btn.addEventListener('click', () => {
            btn.classList.toggle('active');
            const filterType = btn.parentElement.dataset.filter;
            const value = btn.dataset.value;
            
            if (btn.classList.contains('active')) {
                if (!currentFilters[filterType].includes(value)) {
                    currentFilters[filterType].push(value);
                }
            } else {
                currentFilters[filterType] = currentFilters[filterType].filter(v => v !== value);
            }
            
            applyFiltersAndRender();
        });
    });
}

function renderProducts(products) {
    const container = document.querySelector('.products');
    if (!container) {
        console.error('Products container not found');
        return;
    }
    
    if (!products || products.length === 0) {
        container.innerHTML = `
            <div class="no-products">
                <i class="fas fa-search"></i>
                <p>Không tìm thấy sản phẩm phù hợp</p>
            </div>
        `;
        return;
    }
    
    // Sắp xếp sản phẩm: đưa các sản phẩm tìm kiếm lên đầu
    const sortedProducts = [...products].sort((a, b) => {
        // Nếu a là kết quả tìm kiếm và b không phải, a lên đầu
        if (a.isSearchResult && !b.isSearchResult) return -1;
        // Nếu b là kết quả tìm kiếm và a không phải, b lên đầu
        if (!a.isSearchResult && b.isSearchResult) return 1;
        // Nếu cả hai đều là kết quả tìm kiếm hoặc không phải, giữ nguyên thứ tự
        return 0;
    });
    
    container.innerHTML = sortedProducts.map(product => {
        // Xử lý đường dẫn hình ảnh
        const imagePath = product.image_path ? 
            product.image_path.replace(/\\/g, '/').replace('c:/AI/Web/static/', '') : 
            'uploads/product_images/default.jpg';
        
        // Thêm class đặc biệt cho sản phẩm tìm kiếm
        const searchResultClass = product.isSearchResult ? 'search-result' : '';
            
        return `
        <div class="product ${searchResultClass}" data-id="${product.id}">
            <div class="product-image-container" onclick="showProductDetails('${product.id}')">
                <img src="${imagePath}" 
                     alt="${product.name}" 
                     loading="lazy"
                     onload="this.classList.add('loaded')"
                     onerror="this.src='uploads/product_images/default.jpg'; this.classList.add('loaded')">
                <div class="quick-add">
                </div>
                <div class="product-tooltip">
                    <p>${product.description ? product.description.substring(0, 50) + (product.description.length > 50 ? '...' : '') : 'Chưa có mô tả'}</p>
                </div>
            </div>
            <h3>${product.name}</h3>
            <div class="product-rating">
                ${renderStars(product.rating || 0)}
                <span class="rating-count">${product.rating_count || 0} đánh giá</span>
            </div>
            <p class="price">${product.price.toLocaleString('vi-VN')} VNĐ</p>
        </div>
    `}).join('');
}

// Thêm hàm để kiểm tra việc load sản phẩm
async function checkAndDisplayProducts() {
    console.log('Checking products...');
    try {
        const data = await loadProducts();
        console.log('Loaded products:', data);
        if (data && data.products) {
            loadedProducts = data.products;
            displayProducts(loadedProducts);
        } else {
            console.error('No products found in data');
        }
    } catch (error) {
        console.error('Error loading products:', error);
    }
}

async function showProductDetails(productId) {
    try {
        const product = loadedProducts.find(p => p.id === productId);
        if (!product) {
            console.error('Product not found:', productId);
            return;
        }

        // Xử lý đường dẫn hình ảnh giống như trong renderProducts
        const imagePath = product.image_path ? 
            product.image_path.replace(/\\/g, '/').replace('c:/AI/Web/static/', '') : 
            'uploads/product_images/default.jpg';
            
        // Lưu đường dẫn hình ảnh đã xử lý vào thuộc tính image để sử dụng trong addToCart
        product.image = imagePath;
        
        const modal = document.createElement('div');
        modal.className = 'product-modal';
        modal.innerHTML = `
            <div class="modal-header">
                <button class="modal-close" onclick="closeProductModal(this)">&times;</button>
            </div>
            <div class="modal-content">
                <div class="product-gallery">
                    <img src="${imagePath}" alt="${product.name}" onerror="this.src='uploads/product_images/default.jpg'">
                </div>
                <div class="product-info">
                    <h2 class="product-title">${product.name}</h2>
                    <div class="product-rating">
                        ${renderStars(product.rating)}
                        <span class="rating-count">${product.ratingCount} đánh giá</span>
                    </div>
                    <p class="product-price">${product.price.toLocaleString('vi-VN')} VNĐ</p>
                    <div class="product-description">
                        <p>${product.description || 'Chưa có mô tả cho sản phẩm này'}</p>
                    </div>
                    ${product.options ? renderProductOptions(product.options) : ''}
                    <div class="quantity-selector">
                        <button class="qty-btn minus" onclick="updateQuantityModal(this, -1)">-</button>
                        <span>1</span>
                        <button class="qty-btn plus" onclick="updateQuantityModal(this, 1)">+</button>
                    </div>
                    <button class="add-to-cart-btn" onclick="addToCartFromModal('${product.id}')">
                        <i class="fas fa-cart-plus"></i>
                        Thêm vào giỏ hàng
                    </button>
                </div>
                ${renderReviews(product.reviews || [])}
            </div>
        `;

        // Ensure overlay exists and is active before appending modal
        const overlay = document.querySelector('.dropdown-overlay');
        if (overlay) {
            overlay.classList.add('active');
        }

        // Clean up any existing modals
        const existingModal = document.querySelector('.product-modal');
        if (existingModal) {
            existingModal.remove();
        }

        document.body.appendChild(modal);
        modal.style.display = 'block';

    } catch (error) {
        console.error('Error showing product details:', error);
    }
}

function renderProductOptions(options) {
    return Object.entries(options).map(([groupName, values]) => `
        <h4>${formatOptionName(groupName)}</h4>
        <div class="option-group">
            <div class="option-buttons">
                ${values.map(value => `
                    <button class="option-button" onclick="toggleOption(this)" data-group="${groupName}">
                        ${value}
                    </button>
                `).join('')}
            </div>
        </div>
    `).join('');
}

function formatOptionName(name) {
    return name.charAt(0).toUpperCase() + name.slice(1).replace(/([A-Z])/g, ' $1');
}

function renderReviews(reviews) {
    if (!reviews || reviews.length === 0) {
        return '<p>Chưa có đánh giá nào cho sản phẩm này</p>';
    }
    return reviews.map(review => `
        <div class="review-item">
            <img src="${review.avatar}" alt="${review.userName}" class="review-avatar">
            <div class="review-content">
                <div class="review-header">
                    <strong>${review.userName}</strong>
                    <div>${renderStars(review.rating)}</div>
                    <span class="review-date">${new Date(review.date).toLocaleDateString('vi-VN')}</span>
                </div>
                <p class="review-text">${review.comment}</p>
            </div>
        </div>
    `).join('');
}

function closeProductModal(closeBtn) {
    const modal = closeBtn.closest('.product-modal');
    const overlay = document.querySelector('.dropdown-overlay');
    modal.remove();
    overlay.classList.remove('active');
}

function toggleOption(button) {
    const group = button.parentElement;
    group.querySelectorAll('.option-button').forEach(btn => 
        btn.classList.remove('selected'));
    button.classList.add('selected');
}

function updateQuantityModal(btn, change) {
    const span = btn.parentElement.querySelector('span');
    let quantity = parseInt(span.textContent) + change;
    if (quantity > 0) {
        span.textContent = quantity;
    }
}

function addToCartFromModal(productId) {
    const product = loadedProducts.find(p => p.id === productId);
    if (!product) return;

    const modal = document.querySelector('.product-modal');
    const quantity = parseInt(modal.querySelector('.quantity-selector span').textContent);
    const selectedOptions = {};
    
    modal.querySelectorAll('.option-button.selected').forEach(btn => {
        const group = btn.dataset.group;
        selectedOptions[group] = btn.textContent.trim();
    });
    
    // Thêm một lần với số lượng chỉ định
    addToCart({...product, selectedOptions}, quantity);
    
    closeProductModal(modal.querySelector('.modal-close'));
}

function initializeCakeFilters() {
    // Subcategory switching
    document.querySelectorAll('.subcategory-selector button').forEach(btn => {
        btn.addEventListener('click', () => {
            const isCustom = btn.dataset.subcategory === 'dat-lam-banh';
            document.getElementById('banhSanCoFilters').style.display = isCustom ? 'none' : 'flex'; 
            document.getElementById('datLamBanhForm').style.display = isCustom ? 'block' : 'none';     
            document.querySelector('.products-grid').style.display = isCustom ? 'none' : 'grid';            
            document.querySelectorAll('.subcategory-selector button').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
        });
    });

    // Filter buttons
    document.querySelectorAll('.filter-options button').forEach(btn => {
        btn.addEventListener('click', () => {
            btn.classList.toggle('active');
            applyFilters();
        });
    });
}

function applyFilters() {
    const activeFilters = {};
    document.querySelectorAll('.filter-options').forEach(group => {
        const filterType = group.dataset.filter;
        activeFilters[filterType] = [];
        group.querySelectorAll('button.active').forEach(btn => {
            activeFilters[filterType].push(btn.dataset.value);
        });
    });

    document.querySelectorAll('.products-grid .product').forEach(product => {
        const attributes = JSON.parse(product.dataset.attributes || '{}');
        let shouldShow = true;

        Object.entries(activeFilters).forEach(([filter, values]) => {
            if (values.length > 0) {
                const productValues = attributes[filter] || [];
                shouldShow = shouldShow && values.some(v => 
                    Array.isArray(productValues) 
                        ? productValues.includes(v)
                        : productValues === v
                );
            }
        });

        product.style.display = shouldShow ? 'block' : 'none';
    });
}

function handleCustomCakeOrder(event) {
    event.preventDefault();
    const formData = new FormData(event.target);
    const orderDetails = Object.fromEntries(formData);
    
    addNotification(`Đã nhận yêu cầu đặt bánh. Chúng tôi sẽ liên hệ với bạn sớm!`, 'success');
    event.target.reset();
}

async function showUserProfile() {
    const profileOverlay = document.querySelector('.profile-overlay');
    const currentUser = JSON.parse(localStorage.getItem('currentUser'));
    
    if (!currentUser) {
        alert('Vui lòng đăng nhập để xem thông tin tài khoản!');
        showForm('login');
        return;
    }
    
    try {
        // Lấy thông tin người dùng từ API
        const userResponse = await fetch('/api/auth/user');
        
        if (!userResponse.ok) {
            throw new Error('Không thể lấy thông tin người dùng');
        }
        
        const userData = await userResponse.json();
        
        // Cập nhật thông tin người dùng
        document.getElementById('profileName').value = userData.name;
        document.getElementById('profileEmail').value = userData.email;
        document.querySelector('.profile-avatar').src = userData.avatar || 'img/avatar.png';
        
        // Hiển thị overlay
        profileOverlay.style.display = 'flex';
        
        // Tải lịch sử đơn hàng
        await showOrderHistory();
    } catch (error) {
        console.error('Error fetching user profile:', error);
        alert('Có lỗi xảy ra khi tải thông tin tài khoản!');
    }
}

async function showOrderHistory() {
    const orderList = document.querySelector('.order-list');
    
    if (!orderList) {
        console.error('Order list container not found');
        return;
    }
    
    try {
        const response = await fetch('/api/orders/history');
        
        if (!response.ok) {
            throw new Error('Không thể tải lịch sử đơn hàng');
        }
        
        const orders = await response.json();
        
        if (orders.length === 0) {
            orderList.innerHTML = '<p class="no-orders">Bạn chưa có đơn hàng nào</p>';
            return;
        }
        
        orderList.innerHTML = orders.map(order => {
            const orderDate = new Date(order.created_at).toLocaleString('vi-VN');
            const statusText = getStatusText(order.status);
            const statusClass = getStatusClass(order.status);
            
            return `
                <div class="order-item">
                    <div class="order-header">
                        <div class="order-info">
                            <span class="order-id">Đơn hàng #${order.id}</span>
                            <span class="order-date">${orderDate}</span>
                        </div>
                        <div class="order-status ${statusClass}">${statusText}</div>
                    </div>
                    <div class="order-products">
                        ${order.items.map(item => `
                            <div class="order-product">
                                <span class="product-name">${item.name} x ${item.quantity}</span>
                                <span class="product-price">${(item.price * item.quantity).toLocaleString('vi-VN')} VNĐ</span>
                            </div>
                        `).join('')}
                    </div>
                    <div class="order-footer">
                        <div class="order-total">
                            <span>Tổng cộng:</span>
                            <span class="total-amount">${order.total_price.toLocaleString('vi-VN')} VNĐ</span>
                        </div>
                    </div>
                </div>
            `;
        }).join('');
    } catch (error) {
        console.error('Error fetching order history:', error);
        orderList.innerHTML = '<p class="error-message">Có lỗi xảy ra khi tải lịch sử đơn hàng</p>';
    }
}

function getStatusText(status) {
    switch (status) {
        case 'pending': return 'Đang xử lý';
        case 'processing': return 'Đang chuẩn bị';
        case 'shipping': return 'Đang giao hàng';
        case 'completed': return 'Đã hoàn thành';
        case 'cancelled': return 'Đã hủy';
        default: return 'Không xác định';
    }
}

function getStatusClass(status) {
    switch (status) {
        case 'pending': return 'status-pending';
        case 'processing': return 'status-processing';
        case 'shipping': return 'status-shipping';
        case 'completed': return 'status-completed';
        case 'cancelled': return 'status-cancelled';
        default: return '';
    }
}

function displayOrderHistory(orders) {
    const orderList = document.querySelector('.order-list');
    orderList.innerHTML = orders.map(order => `
        <div class="order-item">
            <div class="order-header">
                <strong>Mã đơn: ${order.id}</strong>
                <div>${new Date(order.date).toLocaleDateString('vi-VN')}</div>
                <div class="order-status">${order.status}</div>
            </div>
            <div class="order-items">
                ${order.items.map(item => `
                    <div class="order-product">
                        ${item.name} x${item.quantity} - ${item.price.toLocaleString('vi-VN')} VNĐ
                    </div>
                `).join('')}
            </div>
            <div class="order-total">
                <strong>Tổng cộng: ${order.total.toLocaleString('vi-VN')} VNĐ</strong>
            </div>
        </div>
    `).join('');
}

// Thêm biến global để lưu kết quả tìm kiếm
let searchTimeout;
let searchResults = [];

function initializeSearch() {
    const searchInput = document.querySelector('.search-bar input');
    const searchBtn = document.querySelector('.search-btn');
    
    searchInput.addEventListener('input', (e) => {
        clearTimeout(searchTimeout);
        // Tạo delay để tránh search quá nhiều
        searchTimeout = setTimeout(() => {
            const query = e.target.value.toLowerCase().trim();
            handleSearch(query);
        }, 300);
    });

    searchInput.addEventListener('focus', () => {
        if (searchResults.length > 0) {
            showSearchSuggestions(searchResults);
        }
    });

    searchBtn.addEventListener('click', () => {
        const query = searchInput.value.toLowerCase().trim();
        if (query) {
            handleSearch(query, true); // true = force search
        }
    });

    // Đóng suggestions khi click ngoài
    document.addEventListener('click', (e) => {
        const searchContainer = document.querySelector('.search-bar');
        const suggestionBox = document.querySelector('.search-suggestions');
        if (!searchContainer.contains(e.target) && suggestionBox) {
            suggestionBox.remove();
        }
    });
}

function handleSearch(query, forceSearch = false) {
    if (!query) {
        const suggestionBox = document.querySelector('.search-suggestions');
        if (suggestionBox) suggestionBox.remove();
        if (forceSearch) {
            resetSearchAndDisplayAll();
        }
        return;
    }
    
    // Chuyển đổi query thành chữ thường để không phân biệt hoa thường
    const queryLower = query.toLowerCase();
    
    searchResults = loadedProducts.filter(product => {
        const searchableText = `${product.name} ${product.description} ${product.category}`.toLowerCase();
        return searchableText.includes(queryLower);
    });

    // Đánh dấu các sản phẩm là kết quả tìm kiếm
    searchResults.forEach(product => {
        product.isSearchResult = true;
    });

    if (forceSearch) {
        // Hiển thị kết quả tìm kiếm trong grid sản phẩm
        renderProducts(searchResults);
        const suggestionBox = document.querySelector('.search-suggestions');
        if (suggestionBox) suggestionBox.remove();
    } else {
        // Hiển thị gợi ý
        showSearchSuggestions(searchResults);
    }
}

function showSearchSuggestions(results) {
    let suggestionBox = document.querySelector('.search-suggestions');
    if (!suggestionBox) {
        suggestionBox = document.createElement('div');
        suggestionBox.className = 'search-suggestions';
        document.querySelector('.search-bar').appendChild(suggestionBox);
    }

    const maxSuggestions = 5;
    const suggestions = results.slice(0, maxSuggestions);
    
    suggestionBox.innerHTML = suggestions.length > 0 ? `
        ${suggestions.map(product => {
            // Xử lý đường dẫn hình ảnh giống như trong renderProducts
            const imagePath = product.image_path ? 
                product.image_path.replace(/\\/g, '/').replace('c:/AI/Web/static/', '') : 
                (product.image || 'uploads/product_images/default.jpg');
                
            return `
            <div class="suggestion-item" onclick="selectSuggestion('${product.name}')">
                <img src="${imagePath}" alt="${product.name}" onerror="this.src='uploads/product_images/default.jpg'">
                <div class="suggestion-details">
                    <div class="suggestion-name">${product.name}</div>
                    <div class="suggestion-price">${product.price.toLocaleString('vi-VN')} VNĐ</div>
                    <div class="suggestion-category">${product.category}</div>
                </div>
            </div>
        `}).join('')}
        ${results.length > maxSuggestions ? 
            `<div class="suggestion-more">Xem thêm ${results.length - maxSuggestions} kết quả...</div>` : 
            ''}
    ` : '<div class="no-suggestions">Không tìm thấy kết quả</div>';
}

function selectSuggestion(productName) {
    const searchInput = document.querySelector('.search-bar input');
    searchInput.value = productName;
    handleSearch(productName, true);
}

function resetSearchAndDisplayAll() {
    displayProducts(loadedProducts, currentFilters.category);
}