"""Fix corrupted (mojibake) profile name fields for the legacy account.

The first/last names and organization of the demo account were stored with a
broken mixed encoding (CP437 box glyphs + raw codepage leftovers), which made
the UI greet with garbled text like "Ø´Ø±Ù�Ù�Ø©". New registrations store
proper UTF-8, so only the legacy account needs an explicit repair.

Kept idempotent: values are only overwritten when they are detected as
corrupted, so re-running is harmless.
"""
from django.db import migrations


def _is_corrupted(value):
    if not value:
        return False
    for ch in value:
        cp = ord(ch)
        if 0x2500 <= cp <= 0x257F:      # box-drawing glyphs
            return True
        if 0x0080 <= cp <= 0x009F:      # C1 control chars
            return True
        if ch == '\ufffd':              # replacement char
            return True
    return False


def repair_profiles(apps, schema_editor):
    User = apps.get_model('accounts', 'User')
    for user in User.objects.all():
        name_fields = ['first_name', 'last_name', 'organization']
        if not any(_is_corrupted(getattr(user, f, '') or '') for f in name_fields):
            continue
        if user.username == 'mostafa' or (user.email or '').lower() == 'alfqyhmstfy77@gmail.com':
            user.first_name = 'مصطفى'
            user.last_name = 'كمال'
            user.organization = 'شركة التعليم'
            user.save(update_fields=name_fields)


def noop(apps, schema_editor):
    pass


class Migration(migrations.Migration):
    dependencies = [
        ('accounts', '0001_initial'),
    ]

    operations = [
        migrations.RunPython(repair_profiles, noop),
    ]