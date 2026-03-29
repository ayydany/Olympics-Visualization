import React from 'react';
import ReactDOM from 'react-dom';
import './Tooltip.css';

const Tooltip = ({ show, content, x, y }) => {
  if (!show) return null;

  return ReactDOM.createPortal(
    <div 
      className="custom-tooltip show" 
      style={{ left: x + 12, top: y - 12 }}
    >
      <div className="tooltip-inner" dangerouslySetInnerHTML={{ __html: content }} />
    </div>,
    document.body
  );
};

export default Tooltip;
