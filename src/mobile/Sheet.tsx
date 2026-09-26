import type { ReactNode } from 'react';

interface Props {
  title: string;
  onClose: () => void;
  children: ReactNode;
}

/** 底部弹出面板（bottom sheet），移动端替代居中弹窗。 */
export function Sheet({ title, onClose, children }: Props) {
  return (
    <div className="sheet-mask" onClick={onClose}>
      <div className="sheet" onClick={(e) => e.stopPropagation()}>
        <div className="sheet__handle" />
        <div className="sheet__head">
          <h3>{title}</h3>
          <button type="button" className="sheet__close" onClick={onClose}>
            ×
          </button>
        </div>
        <div className="sheet__body">{children}</div>
      </div>
    </div>
  );
}
