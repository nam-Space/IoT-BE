import os

def rename_files_in_directory(folder_path, start_index=62):
    files = [f for f in os.listdir(folder_path) if os.path.isfile(os.path.join(folder_path, f))]
    files.sort()  # Sắp xếp theo bảng chữ cái, nếu không cần có thể bỏ dòng này

    for index, filename in enumerate(files, start=start_index):
        file_ext = os.path.splitext(filename)[1]  # Lấy phần mở rộng như .jpg, .png
        new_name = f"aloe_vera_{index}{file_ext}"
        old_path = os.path.join(folder_path, filename)
        new_path = os.path.join(folder_path, new_name)
        os.rename(old_path, new_path)
        print(f"🌿 Đã đổi: {filename} ➡️ {new_name}")

# 🌱 Gọi hàm với đường dẫn và chỉ số bắt đầu
rename_files_in_directory("C:\\Users\\ADMIN\\Downloads\\nhadam1", start_index=1)

