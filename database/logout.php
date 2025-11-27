<?php
// ابدأ الجلسة
session_start();

// تدمير جميع بيانات الجلسة (تسجيل الخروج)
$_SESSION = array(); // مسح محتويات المصفوفة
session_destroy(); // تدمير الجلسة بالكامل

// إعادة التوجيه إلى الصفحة الرئيسية (index.php أو index.html)
header("Location: ../index.html"); // تم إضافة ../ للرجوع إلى مجلد المشروع الرئيسيexit;
?>