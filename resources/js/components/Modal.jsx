import React from "react";
import "../../css/Modal.css";

export function openModal(id) {
  if(!id) return;
  window.location.hash = id.startsWith("#") ? id : `#${id}`;
}
export function closeModal() {
  window.location.hash = "#";
}

/**
 * Base do Modal com CSS-only (hash #id).
 *
 * Props:
 * - id: string (sem '#', ex.: "novo-produto")
 * - title: string | ReactNode (opcional)
 * - titleId: string (opcional; usado se você renderizar <h2> custom)
 * - onClose: fn (opcional; chamado no X)
 * - children: conteúdo dentro de .modal__panel
 */
export default function Modal({ id, title, titleId, onClose, children }) {
  const modalId = id.startsWith("#") ? id.slice(1) : id;
  const _titleId = title ? (titleId || `${modalId}-title`) : undefined;

  return (
    <section id={modalId} className="modal" role="dialog" aria-modal="true" aria-labelledby={_titleId}>
      <a href="#" className="modal__overlay" aria-label="Fechar"></a>

      <div className="modal__panel">
        <a className="modal__close" href="#" aria-label="Fechar" onClick={onClose}>✕</a>

        {title != null ? (
          typeof title === "string" ? (
            <h2 id={_titleId} className="modal__title">{title}</h2>
          ) : (
            React.cloneElement(title, {
              id: _titleId,
              className: ["modal__title", title.props.className].filter(Boolean).join(" ")
            })
          )
        ) : null}

        {children}
      </div>
    </section>
  );
}