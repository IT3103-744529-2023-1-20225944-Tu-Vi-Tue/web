from flask import Flask, render_template, request, jsonify, send_from_directory, redirect, url_for, flash, session
import os
import json
import uuid
import datetime
from werkzeug.utils import secure_filename
from werkzeug.security import generate_password_hash, check_password_hash

app = Flask(__name__)
app.secret_key = 'tiembanhngon_secret_key'

# Cấu hình đường dẫn
app.config['UPLOAD_FOLDER'] = 'static/uploads/product_images'
app.config['PRODUCTS_FILE'] = 'static/uploads/products.json'
app.config['STATIC_FOLDER'] = 'static'
app.config['TEMPLATE_FOLDER'] = 'templates'
app.config['DATABASE'] = 'tiembanhngon.db'

# Đảm bảo thư mục tồn tại
os.makedirs(app.config['UPLOAD_FOLDER'], exist_ok=True)

# Các hàm làm việc với dữ liệu JSON
# Đường dẫn đến các file JSON
USERS_FILE = 'static/uploads/users.json'
ORDERS_FILE = 'static/uploads/orders.json'
REVIEWS_FILE = 'static/uploads/reviews.json'

# Đảm bảo các thư mục tồn tại
os.makedirs(os.path.dirname(USERS_FILE), exist_ok=True)
os.makedirs(os.path.dirname(ORDERS_FILE), exist_ok=True)
os.makedirs(os.path.dirname(REVIEWS_FILE), exist_ok=True)

# Hàm khởi tạo các file JSON nếu chưa tồn tại
def init_db():
    # Khởi tạo file users.json nếu chưa tồn tại
    if not os.path.exists(USERS_FILE):
        with open(USERS_FILE, 'w', encoding='utf-8') as file:
            json.dump([], file, indent=4, ensure_ascii=False)
            print(f"Đã tạo file {USERS_FILE}")
    
    # Khởi tạo file orders.json nếu chưa tồn tại
    if not os.path.exists(ORDERS_FILE):
        with open(ORDERS_FILE, 'w', encoding='utf-8') as file:
            json.dump([], file, indent=4, ensure_ascii=False)
            print(f"Đã tạo file {ORDERS_FILE}")
    
    # Khởi tạo file reviews.json nếu chưa tồn tại
    if not os.path.exists(REVIEWS_FILE):
        with open(REVIEWS_FILE, 'w', encoding='utf-8') as file:
            json.dump([], file, indent=4, ensure_ascii=False)
            print(f"Đã tạo file {REVIEWS_FILE}")
    
    # Đảm bảo file products.json tồn tại
    if not os.path.exists(app.config['PRODUCTS_FILE']):
        with open(app.config['PRODUCTS_FILE'], 'w', encoding='utf-8') as file:
            json.dump([], file, indent=4, ensure_ascii=False)
            print(f"Đã tạo file {app.config['PRODUCTS_FILE']}")
    
    print("Khởi tạo dữ liệu hoàn tất.")

# Hàm để kiểm tra dữ liệu sản phẩm
def import_products_from_json():
    products = load_products()
    if not products:
        print("Không có sản phẩm nào trong file JSON.")
    else:
        print(f"Đã tải {len(products)} sản phẩm từ file JSON.")

# Hàm đọc dữ liệu sản phẩm từ file JSON (giữ lại để tương thích với code cũ)
def load_products():
    try:
        if os.path.exists(app.config['PRODUCTS_FILE']):
            with open(app.config['PRODUCTS_FILE'], 'r', encoding='utf-8') as file:
                return json.load(file)
        return []
    except Exception as e:
        print(f"Lỗi khi đọc file sản phẩm: {str(e)}")
        return []

# Hàm lưu dữ liệu sản phẩm vào file JSON (giữ lại để tương thích với code cũ)
def save_products(products):
    try:
        with open(app.config['PRODUCTS_FILE'], 'w', encoding='utf-8') as file:
            json.dump(products, file, indent=4, ensure_ascii=False)
        return True
    except Exception as e:
        print(f"Lỗi khi lưu file sản phẩm: {str(e)}")
        return False
        
# Hàm lấy sản phẩm từ file JSON
def get_products_from_db():
    return load_products()

# Hàm lấy sản phẩm theo ID từ file JSON
def get_product_by_id_from_db(product_id):
    products = load_products()
    for product in products:
        if product['id'] == product_id:
            return product
    return None

# Hàm lấy sản phẩm theo danh mục từ file JSON
def get_products_by_category_from_db(category):
    products = load_products()
    return [product for product in products if product['category'] == category]

# Hàm tìm kiếm sản phẩm từ file JSON
def search_products_from_db(query):
    products = load_products()
    query = query.lower()
    return [product for product in products if query in product['name'].lower()]

# Hàm lấy tất cả danh mục từ file JSON
def get_categories_from_db():
    products = load_products()
    categories = set()
    for product in products:
        categories.add(product['category'])
    return sorted(list(categories))

# Route cho trang chủ
@app.route('/')
def index():
    return render_template('user/index.html')

# API lấy tất cả sản phẩm
@app.route('/api/products', methods=['GET'])
def get_products():
    products = get_products_from_db()
    return jsonify(products)

# API lấy sản phẩm theo ID
@app.route('/api/products/<product_id>', methods=['GET'])
def get_product(product_id):
    product = get_product_by_id_from_db(product_id)
    if product:
        return jsonify(product)
    return jsonify({"error": "Không tìm thấy sản phẩm"}), 404

# API lấy sản phẩm theo danh mục
@app.route('/api/products/category/<category>', methods=['GET'])
def get_products_by_category(category):
    products = get_products_by_category_from_db(category)
    return jsonify(products)

# API tìm kiếm sản phẩm
@app.route('/api/products/search', methods=['GET'])
def search_products():
    query = request.args.get('q', '')
    
    if not query:
        return jsonify([])
    
    results = search_products_from_db(query)
    return jsonify(results)

# API lọc sản phẩm
@app.route('/api/products/filter', methods=['GET'])
def filter_products():
    # Lấy các tham số lọc từ request
    category = request.args.get('category')
    min_price = request.args.get('min_price')
    max_price = request.args.get('max_price')
    style = request.args.getlist('style')
    suitable = request.args.getlist('suitable')
    temperature = request.args.getlist('temperature')
    sugar = request.args.getlist('sugar')
    subcategory = request.args.get('subcategory')
    
    # Lấy tất cả sản phẩm
    products = get_products_from_db()
    
    # Lọc theo danh mục
    if category and category != 'Tất cả':
        products = [p for p in products if p['category'] == category]
    
    # Lọc theo subcategory
    if subcategory:
        products = [p for p in products if p.get('subcategory') == subcategory]
    
    # Lọc theo giá
    if min_price:
        min_price = float(min_price)
        products = [p for p in products if p['price'] >= min_price]
    
    if max_price:
        max_price = float(max_price)
        products = [p for p in products if p['price'] <= max_price]
    
    # Lọc theo các thuộc tính
    if style or suitable or temperature or sugar:
        filtered_products = []
        for product in products:
            attributes = product.get('attributes', {})
            
            # Kiểm tra từng thuộc tính
            match = True
            
            if style and attributes.get('style'):
                if isinstance(attributes['style'], list):
                    if not any(s in attributes['style'] for s in style):
                        match = False
                elif attributes['style'] not in style:
                    match = False
            
            if suitable and attributes.get('suitable'):
                if isinstance(attributes['suitable'], list):
                    if not any(s in attributes['suitable'] for s in suitable):
                        match = False
                elif attributes['suitable'] not in suitable:
                    match = False
            
            if temperature and attributes.get('temperature'):
                if isinstance(attributes['temperature'], list):
                    if not any(t in attributes['temperature'] for t in temperature):
                        match = False
                elif attributes['temperature'] not in temperature:
                    match = False
            
            if sugar and attributes.get('sugar'):
                if isinstance(attributes['sugar'], list):
                    if not any(s in attributes['sugar'] for s in sugar):
                        match = False
                elif attributes['sugar'] not in sugar:
                    match = False
            
            if match:
                filtered_products.append(product)
        
        products = filtered_products
    
    return jsonify(products)

# API lấy tất cả danh mục
@app.route('/api/categories', methods=['GET'])
def get_categories():
    categories = get_categories_from_db()
    return jsonify(categories)

# Hàm đọc dữ liệu người dùng từ file JSON
def load_users():
    try:
        if os.path.exists(USERS_FILE):
            with open(USERS_FILE, 'r', encoding='utf-8') as file:
                return json.load(file)
        return []
    except Exception as e:
        print(f"Lỗi khi đọc file người dùng: {str(e)}")
        return []

# Hàm lưu dữ liệu người dùng vào file JSON
def save_users(users):
    try:
        with open(USERS_FILE, 'w', encoding='utf-8') as file:
            json.dump(users, file, indent=4, ensure_ascii=False)
        return True
    except Exception as e:
        print(f"Lỗi khi lưu file người dùng: {str(e)}")
        return False

# API đăng ký tài khoản
@app.route('/api/auth/register', methods=['POST'])
def register():
    data = request.get_json()
    
    if not data or not data.get('email') or not data.get('password') or not data.get('name'):
        return jsonify({"error": "Thiếu thông tin đăng ký"}), 400
    
    users = load_users()
    
    # Kiểm tra email đã tồn tại chưa
    if any(user['email'] == data['email'] for user in users):
        return jsonify({"error": "Email đã được sử dụng"}), 400
    
    # Mã hóa mật khẩu
    hashed_password = generate_password_hash(data['password'])
    
    # Tạo ID mới cho người dùng
    user_id = len(users) + 1
    
    # Thêm người dùng mới
    new_user = {
        "id": user_id,
        "name": data['name'],
        "email": data['email'],
        "password": hashed_password,
        "avatar": 'img/default-avatar.png',
        "created_at": datetime.datetime.now().isoformat()
    }
    
    users.append(new_user)
    save_users(users)
    
    # Trả về thông tin người dùng (không bao gồm mật khẩu)
    user_info = {
        "id": new_user["id"],
        "name": new_user["name"],
        "email": new_user["email"],
        "avatar": new_user["avatar"]
    }
    
    return jsonify({
        "message": "Đăng ký thành công",
        "user": user_info
    })

# API đăng nhập
@app.route('/api/auth/login', methods=['POST'])
def login():
    data = request.get_json()
    
    if not data or not data.get('email') or not data.get('password'):
        return jsonify({"error": "Thiếu thông tin đăng nhập"}), 400
    
    users = load_users()
    user = None
    
    # Tìm người dùng theo email
    for u in users:
        if u['email'] == data['email']:
            user = u
            break
    
    if not user or not check_password_hash(user['password'], data['password']):
        return jsonify({"error": "Email hoặc mật khẩu không đúng"}), 401
    
    # Tạo session cho người dùng
    session['user_id'] = user['id']
    
    return jsonify({
        "message": "Đăng nhập thành công",
        "user": {
            "id": user['id'],
            "name": user['name'],
            "email": user['email'],
            "avatar": user['avatar']
        }
    })

# API đăng xuất
@app.route('/api/auth/logout', methods=['POST'])
def logout():
    session.pop('user_id', None)
    return jsonify({"message": "Đăng xuất thành công"})

# API lấy thông tin người dùng hiện tại
@app.route('/api/auth/user', methods=['GET'])
def get_current_user():
    if 'user_id' not in session:
        return jsonify({"error": "Chưa đăng nhập"}), 401
    
    users = load_users()
    user = None
    
    # Tìm người dùng theo ID
    for u in users:
        if u['id'] == session['user_id']:
            user = u
            break
    
    if not user:
        session.pop('user_id', None)
        return jsonify({"error": "Người dùng không tồn tại"}), 401
    
    # Trả về thông tin người dùng (không bao gồm mật khẩu)
    return jsonify({
        "id": user['id'],
        "name": user['name'],
        "email": user['email'],
        "avatar": user['avatar']
    })

# Hàm đọc dữ liệu đơn hàng từ file JSON
def load_orders():
    try:
        if os.path.exists(ORDERS_FILE):
            with open(ORDERS_FILE, 'r', encoding='utf-8') as file:
                return json.load(file)
        return []
    except Exception as e:
        print(f"Lỗi khi đọc file đơn hàng: {str(e)}")
        return []

# Hàm lưu dữ liệu đơn hàng vào file JSON
def save_orders(orders):
    try:
        with open(ORDERS_FILE, 'w', encoding='utf-8') as file:
            json.dump(orders, file, indent=4, ensure_ascii=False)
        return True
    except Exception as e:
        print(f"Lỗi khi lưu file đơn hàng: {str(e)}")
        return False

# API tạo đơn hàng
@app.route('/api/orders', methods=['POST'])
def create_order():
    data = request.get_json()
    
    if not data or not data.get('items') or not data.get('total_price') or not data.get('delivery_type'):
        return jsonify({"error": "Thiếu thông tin đơn hàng"}), 400
    
    # Lấy user_id nếu đã đăng nhập
    user_id = session.get('user_id')
    
    # Lấy danh sách đơn hàng hiện tại
    orders = load_orders()
    
    # Tạo ID mới cho đơn hàng
    order_id = len(orders) + 1
    
    # Lấy thông tin sản phẩm
    products = load_products()
    product_dict = {product['id']: product for product in products}
    
    # Chuẩn bị danh sách sản phẩm trong đơn hàng
    order_items = []
    for item in data['items']:
        product_info = product_dict.get(item['id'], {})
        order_items.append({
            "id": len(order_items) + 1,
            "order_id": order_id,
            "product_id": item['id'],
            "quantity": item['quantity'],
            "price": item['price'],
            "name": product_info.get('name', ''),
            "image_path": product_info.get('image_path', '')
        })
    
    # Tạo đơn hàng mới
    new_order = {
        "id": order_id,
        "user_id": user_id,
        "total_price": data['total_price'],
        "status": "pending",
        "delivery_type": data['delivery_type'],
        "table_number": data.get('table_number'),
        "recipient_name": data.get('recipient_name'),
        "recipient_phone": data.get('recipient_phone'),
        "delivery_address": data.get('delivery_address'),
        "payment_method": data.get('payment_method'),
        "note": data.get('note'),
        "created_at": datetime.datetime.now().isoformat(),
        "items": order_items
    }
    
    # Thêm đơn hàng mới vào danh sách
    orders.append(new_order)
    save_orders(orders)
    
    return jsonify({
        "message": "Đặt hàng thành công",
        "order": new_order
    })

# API lấy lịch sử đơn hàng của người dùng
@app.route('/api/orders/history', methods=['GET'])
def get_order_history():
    if 'user_id' not in session:
        return jsonify({"error": "Chưa đăng nhập"}), 401
    
    orders = load_orders()
    user_id = session['user_id']
    
    # Lọc đơn hàng của người dùng
    user_orders = [order for order in orders if order.get('user_id') == user_id]
    
    # Sắp xếp theo thời gian tạo (mới nhất lên đầu)
    user_orders.sort(key=lambda x: x.get('created_at', ''), reverse=True)
    
    return jsonify(user_orders)

# Phục vục các file tĩnh
@app.route('/templates/css/<path:filename>')
def serve_css(filename):
    return send_from_directory('templates/css', filename)

@app.route('/templates/js/<path:filename>')
def serve_js(filename):
    return send_from_directory('templates/js', filename)

@app.route('/assets/images/<path:filename>')
def serve_images(filename):
    return send_from_directory('static/uploads/product_images', filename)

@app.route('/uploads/product_images/<path:filename>')
def serve_product_images(filename):
    return send_from_directory('static/uploads/product_images', filename)

# Khởi tạo dữ liệu khi khởi động ứng dụng
with app.app_context():
    init_db()
    import_products_from_json()
if __name__ == '__main__':
    app.run(debug=True, port=5000)