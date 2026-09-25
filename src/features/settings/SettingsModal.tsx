import { useRef, useState } from 'react';
import { downloadBackup, restoreBackup } from '../../lib/backup';

interface Props {
  onClose: () => void;
}

/** 设置弹窗：数据备份 / 恢复。 */
export function SettingsModal({ onClose }: Props) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [message, setMessage] = useState('');

  function handleRestore(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = ''; // 允许再次选择同一个文件
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const content = reader.result as string;
      if (window.confirm('恢复会用备份文件覆盖当前所有数据，确定继续吗？')) {
        const err = restoreBackup(content);
        setMessage(err ? `⚠️ 恢复失败：${err}` : '✅ 恢复成功');
      }
    };
    reader.readAsText(file);
  }

  return (
    <div className="modal-mask" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal__head">
          <h3>设置</h3>
          <button type="button" className="modal__close" onClick={onClose}>
            ×
          </button>
        </div>

        <div className="settings-section">
          <h4>备份</h4>
          <p className="hint">把当前所有数据导出成一个 JSON 文件保存。</p>
          <button type="button" className="btn-primary" onClick={downloadBackup}>
            导出备份
          </button>
        </div>

        <div className="settings-section">
          <h4>恢复</h4>
          <p className="hint">用之前导出的备份文件覆盖当前数据（会替换现有数据，请谨慎）。</p>
          <button type="button" className="btn-ghost" onClick={() => fileRef.current?.click()}>
            选择备份文件
          </button>
          <input
            ref={fileRef}
            type="file"
            accept=".json,application/json"
            style={{ display: 'none' }}
            onChange={handleRestore}
          />
        </div>

        {message && <p className="settings-msg">{message}</p>}
      </div>
    </div>
  );
}
