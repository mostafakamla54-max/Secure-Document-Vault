import re

from django.core.exceptions import ValidationError


def validate_password_strength(password):
    """Enforce strong password policy."""
    if len(password) < 8:
        raise ValidationError('كلمة المرور ضعيفة، يجب أن تكون 8 أحرف على الأقل')
    if not re.search(r'[A-Z]', password):
        raise ValidationError('كلمة المرور يجب أن تحتوي على حرف كبير واحد على الأقل')
    if not re.search(r'[a-z]', password):
        raise ValidationError('كلمة المرور يجب أن تحتوي على حرف صغير واحد على الأقل')
    if not re.search(r'\d', password):
        raise ValidationError('كلمة المرور يجب أن تحتوي على رقم واحد على الأقل')
    if not re.search(r'[!@#$%^&*(),.?":{}|<>]', password):
        raise ValidationError('كلمة المرور يجب أن تحتوي على رمز خاص واحد على الأقل')
    if re.search(r'(.)\1{2,}', password):
        raise ValidationError('كلمة المرور لا يجب أن تحتوي على 3 أحرف متطابقة متتالية')


def validate_phone_number(value):
    if not value:
        return
    pattern = re.compile(r'^\+?[0-9]{8,15}$')
    if not pattern.match(value):
        raise ValidationError('أدخل رقم هاتف صحيح (8-15 رقماً، + اختياري في البداية)')
