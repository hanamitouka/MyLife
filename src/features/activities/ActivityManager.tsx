import { useState } from 'react';
import { useLifeStore } from './activityStore';
import { PALETTE } from '../../lib/palette';
import { EMOJI_PRESETS } from '../../lib/emoji';
import type { Activity } from '../../types';

interface Props {
  onClose: () => void;
  /** 传入则直接进入该活动的编辑模式（双击卡片打开） */
  initialActivity?: Activity;
}

/** 活动模块的「管理界面」：新增 / 编辑 / 删除都在这里。 */
export function ActivityManager({ onClose, initialActivity }: Props) {
  const activities = useLifeStore((s) => s.activities);
  const addActivity = useLifeStore((s) => s.addActivity);
  const updateActivity = useLifeStore((s) => s.updateActivity);
  const deleteActivity = useLifeStore((s) => s.deleteActivity);

  const [title, setTitle] = useState(initialActivity?.title ?? '');
  const [duration, setDuration] = useState(initialActivity?.durationMinutes ?? 60);
  const [color, setColor] = useState(initialActivity?.color ?? PALETTE[0]);
  const [emoji, setEmoji] = useState(initialActivity?.emoji ?? '');
  const [note, setNote] = useState(initialActivity?.note ?? '');
  const [editingId, setEditingId] = useState<string | null>(initialActivity?.id ?? null);

  function resetForm() {
    setTitle('');
    setDuration(60);
    setColor(PALETTE[0]);
    setEmoji('');
    setNote('');
    setEditingId(null);
  }

  function startEdit(a: Activity) {
    setEditingId(a.id);
    setTitle(a.title);
    setDuration(a.durationMinutes);
    setColor(a.color);
    setEmoji(a.emoji ?? '');
    setNote(a.note ?? '');
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;
    const payload = {
      title: title.trim(),
      color,
      durationMinutes: duration,
      emoji: emoji || undefined,
      note: note.trim() || undefined,
    };
    if (editingId) updateActivity(editingId, payload);
    else addActivity(payload);
    resetForm();
  }

  return (
    <div className="modal-mask" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal__head">
          <h3>{editingId ? '编辑活动' : '添加活动'}</h3>
          <button type="button" className="modal__close" onClick={onClose}>
            ×
          </button>
        </div>

        <form className="activity-form" onSubmit={handleSubmit}>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="活动名称，例如：健身 / 洗衣服 / 背单词"
          />

          <div className="emoji-picker">
            <span className="unit">图标（可选）</span>
            <div className="emoji-grid">
              <button
                type="button"
                className={`emoji-btn ${emoji === '' ? 'is-active' : ''}`}
                onClick={() => setEmoji('')}
                title="无图标"
              >
                无
              </button>
              {EMOJI_PRESETS.map((em) => (
                <button
                  key={em}
                  type="button"
                  className={`emoji-btn ${emoji === em ? 'is-active' : ''}`}
                  onClick={() => setEmoji(emoji === em ? '' : em)}
                >
                  {em}
                </button>
              ))}
            </div>
          </div>

          <input
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="备注（可选，显示在卡片上）"
          />

          <div className="form-row">
            <input
              type="number"
              value={duration}
              min={5}
              step={5}
              onChange={(e) => setDuration(Number(e.target.value))}
              title="默认时长（分钟）"
            />
            <span className="unit">分钟</span>
          </div>

          <div className="palette">
            {PALETTE.map((c) => (
              <button
                key={c}
                type="button"
                className={`palette__dot ${c === color ? 'is-active' : ''}`}
                style={{ background: c }}
                onClick={() => setColor(c)}
              />
            ))}
          </div>

          <div className="form-actions">
            <button type="submit" className="btn-primary">
              {editingId ? '保存修改' : '+ 添加活动'}
            </button>
            {editingId && (
              <button type="button" className="btn-ghost" onClick={resetForm}>
                取消编辑
              </button>
            )}
          </div>
        </form>

        <div className="manager-list">
          {activities.length === 0 && <p className="empty">还没有活动，先在上面新建一个</p>}
          {activities.map((a) => (
            <div key={a.id} className="manager-item">
              {a.emoji ? (
                <span className="manager-item__emoji">{a.emoji}</span>
              ) : (
                <span className="manager-item__dot" style={{ background: a.color }} />
              )}
              <span className="manager-item__title">{a.title}</span>
              <span className="manager-item__meta">{a.durationMinutes}min</span>
              <button type="button" className="btn-ghost" onClick={() => startEdit(a)}>
                编辑
              </button>
              <button
                type="button"
                className="btn-danger"
                onClick={() => {
                  if (window.confirm(`删除活动「${a.title}」？`)) deleteActivity(a.id);
                }}
              >
                删除
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
