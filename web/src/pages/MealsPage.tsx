import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../api/client';
import { queryKeys } from '../api/queryKeys';
import { COLORS, SHADOW_CARD } from '../theme';
import { MEAL_TYPES } from '../api/types';
import type { MealType } from '../api/types';

const TAB_LABELS: Record<MealType, string> = {
  cafe: 'Café', lancheManha: 'Lanche manhã', lancheTarde: 'Lanche tarde', jantar: 'Jantar',
};

export default function MealsPage() {
  const [activeMealType, setActiveMealType] = useState<MealType>('cafe');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingText, setEditingText] = useState('');
  const [newOptionText, setNewOptionText] = useState('');

  const queryClient = useQueryClient();
  const { data: library } = useQuery({ queryKey: queryKeys.meals, queryFn: api.getMeals });
  const options = library?.[activeMealType] ?? [];

  const invalidate = () => queryClient.invalidateQueries({ queryKey: queryKeys.meals });

  const switchTab = (mt: MealType) => {
    setActiveMealType(mt);
    setEditingId(null);
    setNewOptionText('');
  };

  const addOption = async () => {
    const text = newOptionText.trim();
    if (!text) return;
    await api.addMealOption(activeMealType, text);
    setNewOptionText('');
    invalidate();
  };

  const startEdit = (id: string, name: string) => { setEditingId(id); setEditingText(name); };
  const cancelEdit = () => { setEditingId(null); setEditingText(''); };

  const saveEdit = async () => {
    const text = editingText.trim();
    if (!text || !editingId) { cancelEdit(); return; }
    await api.renameMealOption(activeMealType, editingId, text);
    cancelEdit();
    invalidate();
  };

  const deleteOption = async (id: string) => {
    await api.deleteMealOption(activeMealType, id);
    invalidate();
  };

  return (
    <div>
      <div style={{ padding: '24px 20px 14px' }}>
        <div style={{ fontSize: 26, fontWeight: 700, color: COLORS.textPrimary, marginBottom: 16 }}>Refeições</div>
        <div style={{ display: 'flex', background: COLORS.bgOuter, borderRadius: 14, padding: 4, gap: 4, flexWrap: 'wrap' }}>
          {MEAL_TYPES.map((mt) => (
            <div
              key={mt}
              onClick={() => switchTab(mt)}
              style={{
                flex: 1, minWidth: 70, textAlign: 'center', padding: '9px 4px', borderRadius: 11, fontSize: 12.5, fontWeight: 600,
                cursor: 'pointer', background: activeMealType === mt ? '#fff' : 'transparent', color: activeMealType === mt ? COLORS.navy : COLORS.textMuted,
              }}
            >
              {TAB_LABELS[mt]}
            </div>
          ))}
        </div>
      </div>

      <div style={{ padding: '0 20px 30px' }}>
        {options.map((opt) => {
          const editing = opt.id === editingId;
          return (
            <div key={opt.id} style={{ display: 'flex', alignItems: 'center', gap: 10, background: '#fff', borderRadius: 16, padding: '14px 16px', marginBottom: 10, boxShadow: SHADOW_CARD }}>
              {editing ? (
                <>
                  <input
                    value={editingText}
                    onChange={(e) => setEditingText(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter') saveEdit(); }}
                    autoFocus
                    style={{ flex: 1, height: 36, borderRadius: 10, border: `1px solid ${COLORS.border}`, padding: '0 10px', fontSize: 14, outline: 'none' }}
                  />
                  <div onClick={saveEdit} style={{ width: 32, height: 32, borderRadius: 10, background: COLORS.successBg, color: COLORS.success, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 15, cursor: 'pointer', flexShrink: 0 }}>✓</div>
                </>
              ) : (
                <>
                  <div style={{ flex: 1, fontSize: 14.5, color: COLORS.textPrimary, fontWeight: 500 }}>{opt.name}</div>
                  <div onClick={() => startEdit(opt.id, opt.name)} style={{ width: 32, height: 32, borderRadius: 10, background: COLORS.navyLight, color: COLORS.navy, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, cursor: 'pointer', flexShrink: 0 }}>✎</div>
                </>
              )}
              <div onClick={() => deleteOption(opt.id)} style={{ width: 32, height: 32, borderRadius: 10, background: COLORS.dangerBg, color: COLORS.danger, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 15, cursor: 'pointer', flexShrink: 0 }}>×</div>
            </div>
          );
        })}

        {options.length === 0 && (
          <div style={{ textAlign: 'center', padding: '30px 20px', color: COLORS.textTertiary, fontSize: 13.5 }}>
            Nenhuma opção cadastrada ainda.
          </div>
        )}

        <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
          <input
            value={newOptionText}
            onChange={(e) => setNewOptionText(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') addOption(); }}
            placeholder="Nova opção (ex: Tapioca com queijo)"
            style={{ flex: 1, height: 46, borderRadius: 14, border: `1px solid ${COLORS.border}`, background: '#fff', padding: '0 16px', fontSize: 14, outline: 'none' }}
          />
          <div onClick={addOption} style={{ width: 46, height: 46, borderRadius: 14, background: COLORS.navy, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, cursor: 'pointer', flexShrink: 0 }}>+</div>
        </div>
      </div>
    </div>
  );
}
