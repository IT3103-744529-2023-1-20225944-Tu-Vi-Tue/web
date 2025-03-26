import tkinter as tk
from tkinter import ttk, messagebox, filedialog
import json
import os
from PIL import Image, ImageTk
import shutil

# Set encoding for proper Vietnamese character support
import sys
sys.stdout.reconfigure(encoding='utf-8')

class Product:
    def __init__(self, id, name, price, quantity, category, image_path="", description="", subcategory="", attributes=None):
        self.id = id
        self.name = name
        self.price = price
        self.quantity = quantity
        self.category = category
        self.image_path = image_path
        self.description = description
        self.subcategory = subcategory
        self.attributes = attributes or {}
    
    def to_dict(self):
        return {
            "id": self.id,
            "name": self.name,
            "price": self.price,
            "quantity": self.quantity,
            "category": self.category,
            "image_path": self.image_path,
            "description": self.description,
            "subcategory": self.subcategory,
            "attributes": self.attributes
        }

class ProductManager:
    def __init__(self):
        self.products = []
        self.data_file = "c:\\AI\\Web\\static\\uploads\\products.json"
        self.images_dir = "c:\\AI\\Web\\static\\uploads\\product_images"
        
        # Create images directory if it doesn't exist
        if not os.path.exists(self.images_dir):
            os.makedirs(self.images_dir)
            
        self.load_data()
    
    def load_data(self):
        if os.path.exists(self.data_file):
            try:
                with open(self.data_file, 'r', encoding='utf-8') as file:
                    products_data = json.load(file)
                    self.products = [Product(**data) for data in products_data]
            except Exception as e:
                messagebox.showerror("Lỗi", f"Không thể tải dữ liệu: {str(e)}")
    
    def save_data(self):
        try:
            with open(self.data_file, 'w', encoding='utf-8') as file:
                products_data = [product.to_dict() for product in self.products]
                json.dump(products_data, file, indent=4, ensure_ascii=False)
        except Exception as e:
            messagebox.showerror("Lỗi", f"Không thể lưu dữ liệu: {str(e)}")
    
    def add_product(self, product):
        # Check if ID already exists
        if any(p.id == product.id for p in self.products):
            return False
        self.products.append(product)
        self.save_data()
        return True
    
    def update_product(self, product):
        for i, p in enumerate(self.products):
            if p.id == product.id:
                self.products[i] = product
                self.save_data()
                return True
        return False
    
    def delete_product(self, product_id):
        for i, p in enumerate(self.products):
            if p.id == product_id:
                del self.products[i]
                self.save_data()
                return True
        return False
    
    def get_all_products(self):
        return self.products
    
    def get_product_by_id(self, product_id):
        for product in self.products:
            if product.id == product_id:
                return product
        return None
    
    def get_all_categories(self):
        """Return a list of unique categories from all products"""
        categories = set()
        for product in self.products:
            categories.add(product.category)
        return sorted(list(categories))

class ProductApp:
    def __init__(self, root):
        self.root = root
        self.root.title("Hệ Thống Quản Lý Sản Phẩm")
        self.root.geometry("900x650")  # Increased window size
        self.root.resizable(True, True)
        
        self.product_manager = ProductManager()
        self.current_image_path = ""
        self.image_display = None
        
        self.create_widgets()
        self.load_product_table()
    
    def create_widgets(self):
        # Create main frame
        main_frame = ttk.Frame(self.root, padding="10")
        main_frame.pack(fill=tk.BOTH, expand=True)
        
        # Create form frame
        form_frame = ttk.LabelFrame(main_frame, text="Chi Tiết Sản Phẩm", padding="10")
        form_frame.pack(fill=tk.X, padx=5, pady=5)
        
        # Create form fields (first column)
        form_left = ttk.Frame(form_frame)
        form_left.grid(row=0, column=0, sticky=tk.W+tk.N, padx=5, pady=5)
        
        ttk.Label(form_left, text="Mã:").grid(row=0, column=0, sticky=tk.W, padx=5, pady=5)
        self.id_entry = ttk.Entry(form_left, width=20)
        self.id_entry.grid(row=0, column=1, sticky=tk.W, padx=5, pady=5)
        
        ttk.Label(form_left, text="Tên:").grid(row=1, column=0, sticky=tk.W, padx=5, pady=5)
        self.name_entry = ttk.Entry(form_left, width=30)
        self.name_entry.grid(row=1, column=1, sticky=tk.W, padx=5, pady=5)
        
        ttk.Label(form_left, text="Giá:").grid(row=2, column=0, sticky=tk.W, padx=5, pady=5)
        self.price_entry = ttk.Entry(form_left, width=20)
        self.price_entry.grid(row=2, column=1, sticky=tk.W, padx=5, pady=5)
        
        ttk.Label(form_left, text="Số lượng:").grid(row=3, column=0, sticky=tk.W, padx=5, pady=5)
        self.quantity_var = tk.StringVar()
        self.quantity_entry = ttk.Combobox(form_left, width=18, textvariable=self.quantity_var)
        self.quantity_entry['values'] = ('5', '10', '20', '30', '50', '100')
        self.quantity_entry.grid(row=3, column=1, sticky=tk.W, padx=5, pady=5)
        
        ttk.Label(form_left, text="Danh mục:").grid(row=4, column=0, sticky=tk.W, padx=5, pady=5)
        self.category_var = tk.StringVar()
        self.category_entry = ttk.Combobox(form_left, width=28, textvariable=self.category_var)
        self.category_entry['values'] = ('Bánh kem', 'Đồ uống', 'Đồ ăn')
        self.category_entry.grid(row=4, column=1, sticky=tk.W, padx=5, pady=5)
        
        ttk.Label(form_left, text="Danh mục phụ:").grid(row=5, column=0, sticky=tk.W, padx=5, pady=5)
        self.subcategory_var = tk.StringVar()
        self.subcategory_entry = ttk.Combobox(form_left, width=28, textvariable=self.subcategory_var)
        self.subcategory_entry.grid(row=5, column=1, sticky=tk.W, padx=5, pady=5)
        
        ttk.Label(form_left, text="Mô tả:").grid(row=6, column=0, sticky=tk.W, padx=5, pady=5)
        self.description_text = tk.Text(form_left, width=30, height=4)
        self.description_text.grid(row=6, column=1, sticky=tk.W, padx=5, pady=5)
        
        # Create attributes frame (middle column)
        attributes_frame = ttk.LabelFrame(form_frame, text="Thuộc tính sản phẩm")
        attributes_frame.grid(row=0, column=1, sticky=tk.N, padx=5, pady=5)
        
        # Style attributes
        ttk.Label(attributes_frame, text="Phong cách:").grid(row=0, column=0, sticky=tk.W, padx=5, pady=5)
        self.style_var = tk.StringVar()
        self.style_entry = ttk.Combobox(attributes_frame, width=20, textvariable=self.style_var)
        self.style_entry['values'] = ('Ngọt ngào', 'Sang trọng', 'Đơn giản', 'Hoạt hình')
        self.style_entry.grid(row=0, column=1, sticky=tk.W, padx=5, pady=5)
        
        # Suitable for attributes
        ttk.Label(attributes_frame, text="Phù hợp với:").grid(row=1, column=0, sticky=tk.W, padx=5, pady=5)
        self.suitable_var = tk.StringVar()
        self.suitable_entry = ttk.Combobox(attributes_frame, width=20, textvariable=self.suitable_var)
        self.suitable_entry['values'] = ('Nam', 'Nữ', 'Trẻ em', 'Người lớn')
        self.suitable_entry.grid(row=1, column=1, sticky=tk.W, padx=5, pady=5)
        
        # Temperature attributes (for drinks)
        ttk.Label(attributes_frame, text="Nhiệt độ:").grid(row=2, column=0, sticky=tk.W, padx=5, pady=5)
        self.temperature_var = tk.StringVar()
        self.temperature_entry = ttk.Combobox(attributes_frame, width=20, textvariable=self.temperature_var)
        self.temperature_entry['values'] = ('Nóng', 'Lạnh')
        self.temperature_entry.grid(row=2, column=1, sticky=tk.W, padx=5, pady=5)
        
        # Sugar level attributes (for drinks)
        ttk.Label(attributes_frame, text="Độ ngọt:").grid(row=3, column=0, sticky=tk.W, padx=5, pady=5)
        self.sugar_var = tk.StringVar()
        self.sugar_entry = ttk.Combobox(attributes_frame, width=20, textvariable=self.sugar_var)
        self.sugar_entry['values'] = ('0%', '30%', '50%', '100%')
        self.sugar_entry.grid(row=3, column=1, sticky=tk.W, padx=5, pady=5)
        
        # Create image frame (third column)
        image_frame = ttk.Frame(form_frame)
        image_frame.grid(row=0, column=2, sticky=tk.N+tk.E, padx=5, pady=5)
        
        # Image display area
        self.image_frame = ttk.LabelFrame(image_frame, text="Hình ảnh sản phẩm", width=150, height=150)
        self.image_frame.pack(padx=5, pady=5)
        
        self.image_label = ttk.Label(self.image_frame)
        self.image_label.pack(padx=10, pady=10)
        
        # Image buttons
        image_buttons_frame = ttk.Frame(image_frame)
        image_buttons_frame.pack(fill=tk.X, padx=5, pady=5)
        
        self.upload_button = ttk.Button(image_buttons_frame, text="Chọn ảnh", command=self.select_image)
        self.upload_button.pack(side=tk.LEFT, padx=5)
        
        self.clear_image_button = ttk.Button(image_buttons_frame, text="Xóa ảnh", command=self.clear_image)
        self.clear_image_button.pack(side=tk.LEFT, padx=5)
        
        # Create buttons frame
        buttons_frame = ttk.Frame(main_frame)
        buttons_frame.pack(fill=tk.X, padx=5, pady=5)
        
        self.add_button = ttk.Button(buttons_frame, text="Thêm", command=self.add_product)
        self.add_button.pack(side=tk.LEFT, padx=5)
        
        self.update_button = ttk.Button(buttons_frame, text="Cập nhật", command=self.update_product)
        self.update_button.pack(side=tk.LEFT, padx=5)
        
        self.delete_button = ttk.Button(buttons_frame, text="Xóa", command=self.delete_product)
        self.delete_button.pack(side=tk.LEFT, padx=5)
        
        self.clear_button = ttk.Button(buttons_frame, text="Xóa form", command=self.clear_form)
        self.clear_button.pack(side=tk.LEFT, padx=5)
        
        # Create table frame
        table_frame = ttk.LabelFrame(main_frame, text="Danh Sách Sản Phẩm", padding="10")
        table_frame.pack(fill=tk.BOTH, expand=True, padx=5, pady=5)
        
        # Create treeview
        self.tree = ttk.Treeview(table_frame, columns=("ID", "Name", "Price", "Quantity", "Category", "Description", "Image"), show="headings")
        self.tree.pack(fill=tk.BOTH, expand=True, side=tk.LEFT)
        
        # Add scrollbar
        scrollbar = ttk.Scrollbar(table_frame, orient=tk.VERTICAL, command=self.tree.yview)
        scrollbar.pack(side=tk.RIGHT, fill=tk.Y)
        self.tree.configure(yscrollcommand=scrollbar.set)
        
        # Configure treeview columns
        self.tree.heading("ID", text="Mã")
        self.tree.heading("Name", text="Tên")
        self.tree.heading("Price", text="Giá")
        self.tree.heading("Quantity", text="Số lượng")
        self.tree.heading("Category", text="Danh mục")
        self.tree.heading("Description", text="Mô tả")
        self.tree.heading("Image", text="Hình ảnh")
        
        self.tree.column("ID", width=50)
        self.tree.column("Name", width=150)
        self.tree.column("Price", width=80)
        self.tree.column("Quantity", width=80)
        self.tree.column("Category", width=100)
        self.tree.column("Description", width=150)
        self.tree.column("Image", width=60)
        
        # Bind treeview selection event
        self.tree.bind("<<TreeviewSelect>>", self.on_tree_select)
    
    def select_image(self):
        file_path = filedialog.askopenfilename(
            title="Chọn hình ảnh",
            filetypes=[("Image files", "*.jpg *.jpeg *.png *.gif *.bmp")]
        )
        
        if file_path:
            # Save the image path
            self.current_image_path = file_path
            # Display the image
            self.display_image(file_path)
    
    def display_image(self, image_path):
        if image_path and os.path.exists(image_path):
            try:
                # Open and resize the image
                img = Image.open(image_path)
                img = img.resize((150, 150), Image.LANCZOS)
                photo = ImageTk.PhotoImage(img)
                
                # Update the image label
                self.image_label.configure(image=photo)
                self.image_label.image = photo  # Keep a reference
            except Exception as e:
                messagebox.showerror("Lỗi", f"Không thể hiển thị hình ảnh: {str(e)}")
        else:
            # Clear the image if no path or file doesn't exist
            self.clear_image_display()
    
    def clear_image(self):
        self.current_image_path = ""
        self.clear_image_display()
    
    def clear_image_display(self):
        self.image_label.configure(image="")
        self.image_label.image = None
    
    def load_product_table(self):
        # Clear existing items
        for item in self.tree.get_children():
            self.tree.delete(item)
        
        # Load products
        for product in self.product_manager.get_all_products():
            image_status = "Có" if product.image_path and os.path.exists(product.image_path) else "Không"
            # Cắt ngắn mô tả nếu quá dài để hiển thị trong bảng
            short_desc = product.description[:30] + "..." if len(product.description) > 30 else product.description
            
            self.tree.insert("", tk.END, values=(
                product.id, product.name, product.price, 
                product.quantity, product.category, short_desc, image_status
            ))
        
        # Update category suggestions
        categories = self.product_manager.get_all_categories()
        if categories:
            self.category_entry['values'] = categories
    
    def on_tree_select(self, event):
        selected_items = self.tree.selection()
        if selected_items:
            item = selected_items[0]
            values = self.tree.item(item, "values")
            
            # Get the product by ID
            product = self.product_manager.get_product_by_id(values[0])
            if not product:
                return
                
            # Fill form with selected product
            self.id_entry.delete(0, tk.END)
            self.id_entry.insert(0, product.id)
            
            self.name_entry.delete(0, tk.END)
            self.name_entry.insert(0, product.name)
            
            self.price_entry.delete(0, tk.END)
            self.price_entry.insert(0, product.price)
            
            self.quantity_entry.delete(0, tk.END)
            self.quantity_entry.insert(0, product.quantity)
            
            self.category_entry.delete(0, tk.END)
            self.category_entry.insert(0, product.category)
            
            # Set subcategory
            self.subcategory_entry.delete(0, tk.END)
            self.subcategory_entry.insert(0, product.subcategory if hasattr(product, 'subcategory') else "")
            
            # Set description
            self.description_text.delete(1.0, tk.END)
            self.description_text.insert(1.0, product.description)
            
            # Set attributes if they exist
            attributes = product.attributes if hasattr(product, 'attributes') else {}
            
            self.style_entry.delete(0, tk.END)
            self.style_entry.insert(0, attributes.get('style', ""))
            
            self.suitable_entry.delete(0, tk.END)
            self.suitable_entry.insert(0, attributes.get('suitable', ""))
            
            self.temperature_entry.delete(0, tk.END)
            self.temperature_entry.insert(0, attributes.get('temperature', ""))
            
            self.sugar_entry.delete(0, tk.END)
            self.sugar_entry.insert(0, attributes.get('sugar', ""))
            
            # Handle image
            self.current_image_path = product.image_path
            self.display_image(product.image_path)
    
    def clear_form(self):
        self.id_entry.delete(0, tk.END)
        self.name_entry.delete(0, tk.END)
        self.price_entry.delete(0, tk.END)
        self.quantity_entry.delete(0, tk.END)
        self.category_entry.delete(0, tk.END)
        self.subcategory_entry.delete(0, tk.END)
        self.description_text.delete(1.0, tk.END)
        self.style_entry.delete(0, tk.END)
        self.suitable_entry.delete(0, tk.END)
        self.temperature_entry.delete(0, tk.END)
        self.sugar_entry.delete(0, tk.END)
        self.clear_image()
    
    def validate_form(self):
        # Check if required fields are filled
        if not all([self.id_entry.get(), self.name_entry.get(), self.price_entry.get(), 
                   self.quantity_var.get(), self.category_var.get()]):
            messagebox.showerror("Lỗi xác thực", "Các trường cơ bản đều bắt buộc")
            return False
        
        # Validate price and quantity as numbers
        try:
            float(self.price_entry.get())
        except ValueError:
            messagebox.showerror("Lỗi xác thực", "Giá phải là một số")
            return False
        
        try:
            int(self.quantity_entry.get())
        except ValueError:
            messagebox.showerror("Lỗi xác thực", "Số lượng phải là số nguyên")
            return False
        
        return True
    
    def save_product_image(self, product_id):
        if not self.current_image_path:
            return ""
            
        # Create a unique filename for the image
        _, ext = os.path.splitext(self.current_image_path)
        new_filename = f"{product_id}{ext}"
        new_path = os.path.join(self.product_manager.images_dir, new_filename)
        
        try:
            # Copy the image to the product_images directory
            shutil.copy2(self.current_image_path, new_path)
            return new_path
        except Exception as e:
            messagebox.showerror("Lỗi", f"Không thể lưu hình ảnh: {str(e)}")
            return ""
    
    def add_product(self):
        if not self.validate_form():
            return
        
        product_id = self.id_entry.get()
        
        # Save the image if one is selected
        image_path = self.save_product_image(product_id)
        
        # Collect attributes
        attributes = {}
        style = self.style_var.get()
        suitable = self.suitable_var.get()
        temperature = self.temperature_var.get()
        sugar = self.sugar_var.get()
        
        if style:
            attributes['style'] = style
        if suitable:
            attributes['suitable'] = suitable
        if temperature:
            attributes['temperature'] = temperature
        if sugar:
            attributes['sugar'] = sugar
        
        product = Product(
            id=product_id,
            name=self.name_entry.get(),
            price=float(self.price_entry.get()),
            quantity=int(self.quantity_var.get()),
            category=self.category_var.get(),
            subcategory=self.subcategory_var.get(),
            image_path=image_path,
            description=self.description_text.get(1.0, tk.END).strip(),
            attributes=attributes
        )
        
        if self.product_manager.add_product(product):
            messagebox.showinfo("Thành công", "Thêm sản phẩm thành công")
            self.load_product_table()
            self.clear_form()
        else:
            messagebox.showerror("Lỗi", "Mã sản phẩm đã tồn tại")
    
    def update_product(self):
        if not self.validate_form():
            return
        
        product_id = self.id_entry.get()
        
        # Get the existing product to check if we need to update the image
        existing_product = self.product_manager.get_product_by_id(product_id)
        
        # Determine the image path to use
        image_path = existing_product.image_path if existing_product else ""
        
        # If a new image is selected, save it
        if self.current_image_path and (not existing_product or 
                                        self.current_image_path != existing_product.image_path):
            image_path = self.save_product_image(product_id)
        
        # Collect attributes
        attributes = {}
        style = self.style_var.get()
        suitable = self.suitable_var.get()
        temperature = self.temperature_var.get()
        sugar = self.sugar_var.get()
        
        if style:
            attributes['style'] = style
        if suitable:
            attributes['suitable'] = suitable
        if temperature:
            attributes['temperature'] = temperature
        if sugar:
            attributes['sugar'] = sugar
        
        product = Product(
            id=product_id,
            name=self.name_entry.get(),
            price=float(self.price_entry.get()),
            quantity=int(self.quantity_var.get()),
            category=self.category_var.get(),
            subcategory=self.subcategory_var.get(),
            image_path=image_path,
            description=self.description_text.get(1.0, tk.END).strip(),
            attributes=attributes
        )
        
        if self.product_manager.update_product(product):
            messagebox.showinfo("Thành công", "Cập nhật sản phẩm thành công")
            self.load_product_table()
            self.clear_form()
        else:
            messagebox.showerror("Lỗi", "Không tìm thấy sản phẩm")
    
    def delete_product(self):
        selected_items = self.tree.selection()
        if not selected_items:
            messagebox.showerror("Lỗi", "Chưa chọn sản phẩm nào")
            return
        
        item = selected_items[0]
        values = self.tree.item(item, "values")
        product_id = values[0]
        
        if messagebox.askyesno("Xác nhận", f"Bạn có chắc chắn muốn xóa sản phẩm {product_id}?"):
            # Get the product to find its image path
            product = self.product_manager.get_product_by_id(product_id)
            
            if self.product_manager.delete_product(product_id):
                # Delete the product image if it exists
                if product and product.image_path and os.path.exists(product.image_path):
                    try:
                        os.remove(product.image_path)
                    except Exception as e:
                        messagebox.showwarning("Cảnh báo", f"Không thể xóa hình ảnh: {str(e)}")
                
                messagebox.showinfo("Thành công", "Xóa sản phẩm thành công")
                self.load_product_table()
                self.clear_form()
            else:
                messagebox.showerror("Lỗi", "Không thể xóa sản phẩm")

if __name__ == "__main__":
    root = tk.Tk()
    app = ProductApp(root)
    root.mainloop()