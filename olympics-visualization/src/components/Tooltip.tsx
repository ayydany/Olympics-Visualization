import React from 'react';
import ReactDOM from 'react-dom';
import { TooltipState } from '@/types';
import './Tooltip.css';

const Tooltip: React.FC<TooltipState> = ({ show, content, x, y }) => {
  if (!show) return null;

  return ReactDOM.createPortal(
    <div 
      className={`custom-tooltip ${show ? 'show' : ''}`} 
      style={{ left: x + 12, top: y - 12 }}
    >
      <div className="tooltip-inner" dangerouslySetInnerHTML={{ __html: content }} />
    </div>,
    document.body
  );
};

export default Tooltip;
