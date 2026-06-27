import { useRef } from 'react';
import { Upload, UserRound } from '@/icons';
import { Button } from '../../ui/Button';
import { mediaUrl } from '../../../utils/mediaUrl';

interface ProfileAvatarProps {
  value: string;
  name: string;
  uploading: boolean;
  onUpload: (file: File) => void;
  onRemove: () => void;
}

export function ProfileAvatar({
  value,
  name,
  uploading,
  onUpload,
  onRemove,
}: ProfileAvatarProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const previewSrc = mediaUrl(value);

  return (
    <div className="student-profile-avatar-wrap">
      <div
        className="student-profile-avatar"
        role="img"
        aria-label={previewSrc ? `صورة ${name || 'الملف الشخصي'}` : 'لا توجد صورة شخصية'}
      >
        {previewSrc ? (
          <img src={previewSrc} alt="" />
        ) : (
          <UserRound size={48} aria-hidden />
        )}
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp"
        hidden
        aria-hidden
        tabIndex={-1}
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) onUpload(file);
          e.target.value = '';
        }}
      />
      <div className="student-profile-avatar-actions">
        <Button
          type="button"
          variant="secondary"
          size="sm"
          loading={uploading}
          icon={<Upload size={14} aria-hidden />}
          onClick={() => inputRef.current?.click()}
        >
          {previewSrc ? 'تغيير الصورة' : 'رفع صورة'}
        </Button>
        {previewSrc ? (
          <Button type="button" variant="ghost" size="sm" onClick={onRemove}>
            إزالة
          </Button>
        ) : null}
      </div>
    </div>
  );
}
