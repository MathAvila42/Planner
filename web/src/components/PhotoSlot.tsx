import { useRef, useState } from 'react';
import { api } from '../api/client';
import { COLORS } from '../theme';

export default function PhotoSlot({
  photoUrl, placeholder, height = 100, radius = 12, onChange,
}: {
  photoUrl: string | null;
  placeholder: string;
  height?: number;
  radius?: number;
  onChange: (url: string) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');

  const handleFile = async (file: File | undefined) => {
    if (!file) return;
    setUploading(true);
    setError('');
    try {
      const { url } = await api.uploadImage(file);
      onChange(url);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Falha ao enviar imagem.');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div
      style={{
        width: '100%', height, borderRadius: radius, overflow: 'hidden', position: 'relative',
        background: photoUrl ? '#000' : '#F0F1F3', cursor: 'pointer',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}
      onClick={() => !uploading && inputRef.current?.click()}
    >
      {photoUrl && (
        <img src={photoUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
      )}
      {!photoUrl && !uploading && (
        <div style={{ fontSize: 12.5, color: COLORS.textTertiary, textAlign: 'center', padding: '0 12px' }}>{placeholder}</div>
      )}
      {uploading && (
        <div style={{ fontSize: 12.5, color: COLORS.textTertiary }}>Enviando...</div>
      )}
      <div
        style={{
          position: 'absolute', bottom: 8, right: 8, width: 28, height: 28, borderRadius: '50%',
          background: 'rgba(28,28,30,0.55)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 13,
        }}
      >
        ✎
      </div>
      {error && (
        <div style={{ position: 'absolute', bottom: 4, left: 4, right: 36, fontSize: 10.5, color: '#fff', background: COLORS.danger, borderRadius: 6, padding: '2px 6px' }}>
          {error}
        </div>
      )}
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        style={{ display: 'none' }}
        onChange={(e) => { void handleFile(e.target.files?.[0]); e.target.value = ''; }}
      />
    </div>
  );
}
