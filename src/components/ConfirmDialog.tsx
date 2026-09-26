import { useConfirmStore } from '../lib/confirmStore';

/** 全局确认弹窗：替换原生 window.confirm，三端行为一致。 */
export function ConfirmDialog() {
  const request = useConfirmStore((s) => s.request);
  const respond = useConfirmStore((s) => s.respond);

  if (!request) return null;

  return (
    <div className="modal-mask confirm-mask" onClick={() => respond(false)}>
      <div className="confirm-card" onClick={(e) => e.stopPropagation()}>
        <p className="confirm-card__msg">{request.message}</p>
        <div className="confirm-card__actions">
          <button type="button" className="btn-ghost" onClick={() => respond(false)}>
            取消
          </button>
          <button type="button" className="btn-danger" onClick={() => respond(true)}>
            {request.confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
