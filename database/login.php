<?php
// ابدأ الجلسة (Session) قبل أي إخراج
session_start();

// تضمين ملف الاتصال بقاعدة البيانات
include 'config.php'; 

// مصفوفة لتخزين نتائج العملية
$response = ['success' => false, 'message' => ''];

// 1. التحقق مما إذا تم إرسال البيانات عبر POST
if ($_SERVER["REQUEST_METHOD"] == "POST") {
    
    // 2. استقبال البيانات وتطهيرها
    $email = isset($_POST['email']) ? $conn->real_escape_string($_POST['email']) : '';
    $password = isset($_POST['password']) ? $_POST['password'] : ''; 

    if (empty($email) || empty($password)) {
        $response['message'] = "الرجاء إدخال البريد الإلكتروني وكلمة المرور.";
    } else {
        
        // 3. البحث عن المستخدم في قاعدة البيانات
        // نستخدم Prepared Statements لأمان أفضل ضد حقن SQL (SQL Injection)
        $stmt = $conn->prepare("SELECT id, name, password, role FROM users WHERE email = ?");
        $stmt->bind_param("s", $email);
        $stmt->execute();
        $result = $stmt->get_result();

        if ($result->num_rows == 1) {
            // 4. إذا تم العثور على المستخدم
            $user = $result->fetch_assoc();
            
            // 5. التحقق من كلمة المرور المشفرة
            if (password_verify($password, $user['password'])) {
                
                // 6. نجاح تسجيل الدخول: إنشاء الجلسة
                $_SESSION['user_id'] = $user['id'];
                $_SESSION['user_name'] = $user['name'];
                $_SESSION['user_role'] = $user['role']; // حفظ دور المستخدم (admin/user)
                
                $response['success'] = true;
                $response['message'] = "تم تسجيل الدخول بنجاح! مرحباً بك يا " . $user['name'];
                $response['role'] = $user['role']; // إرسال الدور للـ JavaScript
                
            } else {
                // فشل كلمة المرور
                $response['message'] = "كلمة المرور غير صحيحة.";
            }
        } else {
            // لم يتم العثور على بريد إلكتروني
            $response['message'] = "البريد الإلكتروني غير مسجل.";
        }
        
        $stmt->close();
    }
} else {
    $response['message'] = "طريقة الطلب غير صالحة.";
}

$conn->close();

// 7. إرسال الرد إلى الجافاسكريبت بصيغة JSON
header('Content-Type: application/json');
echo json_encode($response);
exit;

?>