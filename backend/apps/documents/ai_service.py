"""AI analysis for documents: OpenAI/Claude if key present, else local fallback."""
import json
import os
import re
import urllib.request

# Arabic labels encoded as \uXXXX to avoid any source-encoding issues.
_AR = {
    'card': '\u0631\u0642\u0645 \u0628\u0637\u0627\u0642\u0629 \u0627\u0626\u062a\u0645\u0627\u0646',
    'email_ar': '\u0628\u0631\u064a\u062f \u0625\u0644\u064a\u0643\u062a\u0631\u0648\u0646\u064a',
    'ip_ar': '\u0639\u0646\u0648\u0627\u0646 IP',
    'phone_ar': '\u0631\u0642\u0645 \u0647\u0627\u062a\u0641 \u0645\u062d\u062a\u0645\u0644',
    'key_ar': '\u0643\u0644\u0645\u0629 \u0645\u0631\u0648\u0631 / \u0645\u0641\u062a\u0627\u062d',
    'cat_legal': '\u0642\u0627\u0646\u0648\u0646\u064a',
    'cat_fin': '\u0645\u0627\u0644\u064a',
    'cat_health': '\u0635\u062d\u064a',
    'cat_edu': '\u062a\u0639\u0644\u064a\u0645\u064a',
    'cat_personal': '\u0634\u062e\u0635\u064a',
    'cat_general': '\u0639\u0627\u0645',
    'short': '\u0645\u0633\u062a\u0646\u062f \u0642\u0635\u064a\u0631 (\u0623\u0642\u0644 \u0645\u0646 200 \u062d\u0631\u0641).',
    'medium': '\u0645\u0633\u062a\u0646\u062f \u0645\u062a\u0648\u0633\u0637 \u0627\u0644\u0637\u0648\u0644\u060c \u0645\u062d\u062a\u0648\u0649 \u0645\u062a\u0648\u0627\u0632\u0646.',
    'long': '\u0645\u0633\u062a\u0646\u062f \u0637\u0648\u064a\u0644 \u064a\u062d\u062a\u0648\u064a \u0642\u062f\u0631\u0627\u064b \u0643\u0628\u064a\u0631\u0627\u064b \u0645\u0646 \u0627\u0644\u0645\u062d\u062a\u0648\u0649.',
    'local_note': '\u0646\u062a\u064a\u062c\u0629 \u0645\u062d\u0644\u064a\u0629 (\u0644\u0645 \u064a\u062a\u0645 \u0636\u0628\u0637 \u0645\u0641\u062a\u0627\u062d \u0630\u0643\u0627\u0621 \u0627\u0635\u0637\u0646\u0627\u0639\u064a \u0628\u0639\u062f).',
    'openai_note': '\u062a\u0645 \u0627\u0644\u062a\u062d\u0644\u064a\u0644 \u0628\u0648\u0627\u0633\u0637\u0629 OpenAI.',
    'claude_note': '\u062a\u0645 \u0627\u0644\u062a\u062d\u0644\u064a\u0644 \u0628\u0648\u0627\u0633\u0637\u0629 Claude.',
}

SENSITIVE_PATTERNS = [
    (r'\b\d{16}\b', _AR['card'], 'Credit card number'),
    (r'[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}', _AR['email_ar'], 'Email address'),
    (r'\b\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}\b', _AR['ip_ar'], 'IP Address'),
    (r'\b\d{9,15}\b', _AR['phone_ar'], 'Possible phone number'),
    (r'\b(?:password|pass|secret|token|api[_-]?key)\b', _AR['key_ar'], 'Password / key'),
]


def _env(key):
    return os.environ.get(key, '').strip()


def _call_openai(prompt, max_tokens=700):
    key = _env('OPENAI_API_KEY')
    body = json.dumps({
        'model': 'gpt-3.5-turbo',
        'messages': [{'role': 'user', 'content': prompt}],
        'max_tokens': max_tokens,
        'temperature': 0.3,
    }).encode('utf-8')
    req = urllib.request.Request(
        'https://api.openai.com/v1/chat/completions',
        data=body,
        headers={'Authorization': 'Bearer ' + key, 'Content-Type': 'application/json'},
    )
    with urllib.request.urlopen(req, timeout=30) as resp:
        data = json.loads(resp.read().decode('utf-8'))
    return data['choices'][0]['message']['content'].strip()


def _call_claude(prompt, max_tokens=700):
    key = _env('CLAUDE_API_KEY')
    body = json.dumps({
        'model': 'claude-3-haiku-20240307',
        'max_tokens': max_tokens,
        'messages': [{'role': 'user', 'content': prompt}],
    }).encode('utf-8')
    req = urllib.request.Request(
        'https://api.anthropic.com/v1/messages',
        data=body,
        headers={
            'x-api-key': key,
            'anthropic-version': '2023-06-01',
            'Content-Type': 'application/json',
        },
    )
    with urllib.request.urlopen(req, timeout=30) as resp:
        data = json.loads(resp.read().decode('utf-8'))
    return data['content'][0]['text'].strip()


_AR_STOP = {
    'عن', 'في', 'من', 'على', 'إلى', 'الى', 'أن', 'ان', 'إن', 'أنه', 'أنها',
    'هذا', 'هذه', 'ذلك', 'التي', 'الذي', 'مثل', 'كل', 'مع', 'هو', 'هي',
    'كان', 'كانت', 'يكون', 'ليس', 'ثم', 'و', 'أو', 'او', 'قد', 'لا', 'ما',
    'لم', 'له', 'لها', 'لهم', 'بين', 'عند', 'حسب', 'بعض', 'أي', 'اي', 'غير',
    'منها', 'بها', 'إلا', 'يتم', 'تم', 'فيه', 'فيها', 'كلها',
}

_EN_STOP = {
    'the', 'and', 'for', 'with', 'that', 'this', 'from', 'have', 'has',
    'not', 'are', 'was', 'were', 'will', 'would', 'can', 'could', 'should',
    'your', 'you', 'our', 'their', 'its', 'they', 'them', 'about', 'into',
    'over', 'after', 'before', 'also', 'such', 'only', 'but', 'out', 'all',
    'each', 'when', 'what', 'which', 'there', 'here', 'then', 'than', 'very',
    'just', 'more', 'most',
}

_CATEGORY_LEXICON = {
    'financial': ['ريال', 'درهم', 'دولار', 'سعر', 'فاتورة', 'حساب', 'راتب',
                  'ضريبة', 'قرض', 'بنك', 'دفع', 'money', 'invoice', 'account',
                  'salary', 'tax', 'price', 'payment', 'bank', 'loan'],
    'medical': ['صحي', 'مريض', 'تشخيص', 'علاج', 'عيادة', 'مستشفى', 'دواء',
                'وصفة', 'طبيب', 'جراحة', 'medical', 'hospital', 'diagnosis',
                'patient', 'clinic', 'doctor', 'surgery', 'medication'],
    'legal': ['عقد', 'قانون', 'محكمة', 'قضية', 'محامي', 'غرامة', 'شرط',
              'اتفاقية', 'التزام', 'contract', 'law', 'court', 'legal',
              'penalty', 'lawyer', 'agreement', 'clause'],
    'education': ['جامعة', 'طالب', 'مدرسة', 'منهج', 'اختبار', 'محاضرة',
                  'شهادة', 'معلم', 'أستاذ', 'university', 'student', 'school',
                  'exam', 'course', 'teacher', 'professor', 'certificate'],
    'personal': ['عنوان', 'ميلاد', 'زواج', 'جواز', 'هوية', 'national',
                 'address', 'passport', 'birth', 'id'],
    'work': ['عمل', 'وظيفة', 'شركة', 'مشروع', 'موظف', 'مدير', 'work',
             'company', 'employee', 'project', 'manager', 'job'],
}

_RISK_WEIGHTS = {
    'Credit card number': 22,
    'Password / key': 25,
    'Email address': 12,
    'IP Address': 15,
    'Possible phone number': 10,
}


def _detect_language(text):
    ar = sum(1 for c in text if '\u0600' <= c <= '\u06FF')
    en = sum(1 for c in text if 'a' <= c.lower() <= 'z')
    if ar and not en:
        return 'arabic'
    if en and not ar:
        return 'english'
    return 'mixed'


def _extract_entities(text):
    """Find every type of sensitive data (not just the first match)."""
    found = {}
    for pattern, ar, en in SENSITIVE_PATTERNS:
        matches = re.findall(pattern, text, flags=re.IGNORECASE)
        if not matches:
            continue
        entry = found.setdefault(
            ar, {'type_ar': ar, 'type_en': en, 'count': 0, 'examples': []}
        )
        entry['count'] += len(matches)
        for m in matches:
            if len(entry['examples']) < 3 and m not in entry['examples']:
                entry['examples'].append(m[:40])
    return list(found.values())


def _category_score(text, category):
    tl = (text or '').lower()
    scores = {cat: sum(tl.count(w) for w in words)
              for cat, words in _CATEGORY_LEXICON.items()}
    if (category or '').lower() in scores:
        scores[category.lower()] += 2
    best = max(scores, key=scores.get)
    return best if scores[best] > 0 else 'general'


def _top_terms(text):
    freq = {}
    for t in re.findall(r'[\w\u0600-\u06FF]{3,}', text.lower()):
        if len(t) < 3 or t in _AR_STOP or t in _EN_STOP:
            continue
        freq[t] = freq.get(t, 0) + 1
    return sorted(freq.items(), key=lambda kv: (-kv[1], kv[0]))


def _local_analysis(text, title, category):
    text = text or ''
    title = title or ''
    length = len(text)
    entities = _extract_entities(text)
    risk = min(100, sum(_RISK_WEIGHTS.get(e['type_en'], 10) for e in entities))
    risk_level = 'low' if risk < 30 else 'medium' if risk < 60 else 'high'
    terms = _top_terms(text)
    keywords = [t for t, _ in terms][:8]

    if length < 200:
        descriptor = _AR['short']
    elif length < 2000:
        descriptor = _AR['medium']
    else:
        descriptor = _AR['long']

    first_line = ''
    for ln in text.splitlines():
        ln = ln.strip()
        if ln:
            first_line = ln
            break
    if len(first_line) > 220:
        first_line = first_line[:217] + '...'
    summary = (title + ': ' if title else '') + first_line
    summary = summary if summary else descriptor
    if summary:
        summary = (summary + ' ' + descriptor)[:320]

    word_count = len(re.findall(r'[\w\u0600-\u06FF]+', text))
    cat = _category_score(text, category)
    cat_labels = {
        'legal': _AR['cat_legal'], 'financial': _AR['cat_fin'],
        'medical': _AR['cat_health'], 'education': _AR['cat_edu'],
        'personal': _AR['cat_personal'],
    }
    suggestion = (cat_labels.get(cat) or _AR['cat_general'])
    if cat == 'work':
        suggestion = _AR['cat_general']

    sensitive_data = []
    for e in entities:
        for ex in e['examples']:
            sensitive_data.append(
                {'type_ar': e['type_ar'], 'type_en': e['type_en'], 'match': ex}
            )
    return {
        'provider': 'local',
        'summary': summary,
        'keywords': keywords,
        'sensitive_data': sensitive_data[:6],
        'sensitive_count': len(entities),
        'category_suggestion': suggestion,
        'has_ai_key': bool(_env('OPENAI_API_KEY')) or bool(_env('CLAUDE_API_KEY')),
        'note': _AR['local_note'],
        'language': _detect_language(text),
        'word_count': word_count,
        'char_count': length,
        'risk_score': risk,
        'risk_level': risk_level,
        'top_terms': [{'term': t, 'count': c} for t, c in terms[:12]],
        'entity_breakdown': entities,
    }


def _to_str(text):
    if isinstance(text, bytes):
        return text.decode('utf-8', errors='ignore')
    if text is None:
        return ''
    return str(text)


def analyze_document(text, title='', category=''):
    text = _to_str(text).strip()
    title = _to_str(title)
    category = _to_str(category)
    prompt = (
        'Analyze the following document. Return a strict JSON object with keys: '
        '"summary" (short Arabic summary), "keywords" (list of up to 8), '
        '"sensitive_data" (list of objects {type: string, value: string} for any '
        'emails/phones/card numbers/passwords found), "sensitive_count" (int), '
        'and "category_suggestion" (one of: legal, financial, medical, education, '
        'personal, general).\n\n'
        'Title: ' + title + '\nCategory hint: ' + category + '\n\nDocument:\n' + text[:4000]
    )
    error = None
    if _env('OPENAI_API_KEY'):
        try:
            data = json.loads(_call_openai(prompt))
            data['provider'] = 'openai'
            data['has_ai_key'] = True
            data['note'] = _AR['openai_note']
            return data
        except Exception as e:
            error = str(e)
    if _env('CLAUDE_API_KEY'):
        try:
            data = json.loads(_call_claude(prompt))
            data['provider'] = 'claude'
            data['has_ai_key'] = True
            data['note'] = _AR['claude_note']
            return data
        except Exception as e:
            error = str(e)
    local = _local_analysis(text, title, category)
    if error:
        local['error'] = error
    return local
