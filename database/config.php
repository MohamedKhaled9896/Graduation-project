<?php
// متغيرات الاتصال يجب أن تطابق الإعدادات الافتراضية لـ XAMPP واسم قاعدة البيانات
$servername = "localhost";
$username = "root";      
$password = "";          // كلمة المرور الافتراضية فارغة
$dbname = "motorstore_users_db";

// إنشاء الاتصال
$conn = new mysqli($servername, $username, $password, $dbname);

// التحقق من الاتصال وتعيين الترميز للعربية
if ($conn->connect_error) {
    die("فشل الاتصال بقاعدة البيانات: " . $conn->connect_error);
}
$conn->set_charset("utf8mb4"); 
?>