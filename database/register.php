<?php
include 'config.php'; 

if ($_SERVER["REQUEST_METHOD"] == "POST") {
    
    // استقبال وتشفير البيانات
    $name = isset($_POST['name']) ? $conn->real_escape_string($_POST['name']) : '';
    $email = isset($_POST['email']) ? $conn->real_escape_string($_POST['email']) : '';
    $plain_password = isset($_POST['password']) ? $_POST['password'] : ''; 

    if (!empty($name) && !empty($email) && !empty($plain_password)) {
        $hashed_password = password_hash($plain_password, PASSWORD_DEFAULT);
        $user_role = "user"; 
        
        $stmt = $conn->prepare("INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)");
        $stmt->bind_param("ssss", $name, $email, $hashed_password, $user_role);
        
        if ($stmt->execute()) {
            echo "<h1>✅ تم تسجيل حسابك بنجاح!</h1>";
        } else {
            if ($conn->errno == 1062) {
                 echo "<h1>❌ عفواً، هذا البريد الإلكتروني مسجل بالفعل.</h1>";
            } else {
                echo "<h1>❌ حدث خطأ أثناء التسجيل.</h1>";
            }
        }
        $stmt->close();
    } else {
        echo "<h1>الرجاء ملء جميع الحقول.</h1>";
    }
}
$conn->close();
?>

<hr>
<h2>نموذج تسجيل مستخدم جديد</h2>
<form method="POST" action="register.php" style="direction: rtl; text-align: right;">
    <label for="name">الاسم:</label><br>
    <input type="text" id="name" name="name" required><br>
    
    <label for="email">البريد الإلكتروني:</label><br>
    <input type="email" id="email" name="email" required><br>
    
    <label for="password">كلمة المرور:</label><br>
    <input type="password" id="password" name="password" required><br>
    
    <input type="submit" value="تسجيل">
</form>