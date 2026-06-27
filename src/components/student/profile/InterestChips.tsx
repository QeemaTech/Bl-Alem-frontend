import { FormEvent, KeyboardEvent, useState } from 'react';
import { Plus, X } from '@/icons';
import { Button } from '../../ui/Button';

const SUGGESTED_INTERESTS = ['البرمجة', 'التصميم', 'الأعمال', 'التسويق', 'الذكاء الاصطناعي', 'اللغات'];

interface InterestChipsProps {
  value: string[];
  onChange: (interests: string[]) => void;
  error?: string;
}

export function InterestChips({ value, onChange, error }: InterestChipsProps) {
  const [draft, setDraft] = useState('');

  const addInterest = (raw: string) => {
    const next = raw.trim();
    if (!next) return;
    const exists = value.some((item) => item.toLowerCase() === next.toLowerCase());
    if (exists) {
      setDraft('');
      return;
    }
    onChange([...value, next]);
    setDraft('');
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter') {
      event.preventDefault();
      addInterest(draft);
    }
  };

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    addInterest(draft);
  };

  const availableSuggestions = SUGGESTED_INTERESTS.filter(
    (item) => !value.some((v) => v.toLowerCase() === item.toLowerCase()),
  );

  return (
    <div className="student-interest-field">
      <label className="field" htmlFor="student-interests-input">
        <span>الاهتمامات</span>
      </label>

      {value.length ? (
        <ul className="student-interest-chips" aria-label="الاهتمامات المحددة">
          {value.map((interest) => (
            <li key={interest}>
              <span className="student-interest-chip">
                {interest}
                <button
                  type="button"
                  className="student-interest-chip-remove"
                  onClick={() => onChange(value.filter((item) => item !== interest))}
                  aria-label={`إزالة ${interest}`}
                >
                  <X size={14} aria-hidden />
                </button>
              </span>
            </li>
          ))}
        </ul>
      ) : (
        <p className="student-interest-empty" role="status">
          لم تُضف اهتمامات بعد — أضف ما يهمك للحصول على توصيات مخصصة.
        </p>
      )}

      <form className="student-interest-add" onSubmit={handleSubmit}>
        <input
          id="student-interests-input"
          className="input"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="اكتب اهتماماً ثم Enter"
          aria-describedby={error ? 'student-interests-error' : 'student-interests-helper'}
        />
        <Button
          type="submit"
          variant="secondary"
          size="sm"
          icon={<Plus size={14} aria-hidden />}
          disabled={!draft.trim()}
        >
          إضافة
        </Button>
      </form>

      {availableSuggestions.length ? (
        <div className="student-interest-suggestions">
          <span className="student-interest-suggestions-label">اقتراحات:</span>
          <div className="student-interest-suggestions-list">
            {availableSuggestions.map((item) => (
              <button
                key={item}
                type="button"
                className="student-interest-suggestion"
                onClick={() => addInterest(item)}
              >
                {item}
              </button>
            ))}
          </div>
        </div>
      ) : null}

      {error ? (
        <small id="student-interests-error" className="field-error">{error}</small>
      ) : (
        <small id="student-interests-helper" className="field-helper">
          أضف اهتماماتك كبطاقات — تُستخدم في توصيات الكورسات.
        </small>
      )}
    </div>
  );
}
