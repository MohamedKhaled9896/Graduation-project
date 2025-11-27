<?php
// register.php
include 'config.php'; 

// يجب أن تكون هذه المصفوفة هي الرد الذي سيعيده الملف
$response = ['success' => false, 'message' => ''];

if ($_SERVER["REQUEST_METHOD"] == "POST") {
    
    // استقبال البيانات (تظل كما هي باستخدام $_POST)
    $name = isset($_POST['name']) ? $conn->real_escape_string($_POST['name']) : '';
    $email = isset($_POST['email']) ? $conn->real_escape_string($_POST['email']) : '';
    $plain_password = isset($_POST['password']) ? $_POST['password'] : ''; 

    if (!empty($name) && !empty($email) && !empty($plain_password)) {
        
        // التحقق من وجود البريد الإلكتروني مسبقاً
        $check_stmt = $conn->prepare("SELECT id FROM users WHERE email = ?");
        $check_stmt->bind_param("s", $email);
        $check_stmt->execute();
        $check_result = $check_stmt->get_result();

        if ($check_result->num_rows > 0) {
             $response['message'] = "❌ عفواً، هذا البريد الإلكتروني مسجل بالفعل.";
        } else {
            // تشفير وحفظ
            $hashed_password = password_hash($plain_password, PASSWORD_DEFAULT);
            $user_role = "user"; 
            
            $stmt = $conn->prepare("INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)");
            $stmt->bind_param("ssss", $name, $email, $hashed_password, $user_role);
            
            if ($stmt->execute()) {
                $response['success'] = true;
                $response['message'] = "✅ تم تسجيل حسابك بنجاح! يمكنك الآن تسجيل الدخول.";
            } else {
                $response['message'] = "❌ حدث خطأ أثناء التسجيل: " . $conn->error;
            }
            $stmt->close();
        }
        $check_stmt->close();
    } else {
        $response['message'] = "الرجاء ملء جميع الحقول.";
    }
} else {
     $response['message'] = "طريقة الطلب غير صالحة.";
}

$conn->close();

// 🚨🚨 تأكيد إرسال الرد بصيغة JSON نظيفة (هذا هو أهم جزء) 🚨🚨
header('Content-Type: application/json');
echo json_encode($response);
exit;
?>