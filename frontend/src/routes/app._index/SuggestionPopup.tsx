import React from 'react';

interface SuggestionPopupProps {
  suggestion: string | null;
  position: { top: number; left: number } | null;
  onClose: () => void;
}

const SuggestionPopup: React.FC<SuggestionPopupProps> = ({ suggestion, position, onClose }) => {
  if (!suggestion || !position) return null;

  return (
    <div
      className="absolute bg-white border rounded shadow-lg p-2"
      style={{
        top: position.top,
        left: position.left,
        width: '300px', // 固定宽度
        height: '150px', // 固定高度
        overflowY: 'auto', // 允许垂直滚动
      }}
    >
      <button onClick={onClose} className="absolute top-1 right-1">×</button>
      <p style={{ color: '#555' }}>{suggestion}</p> {/* 深灰色文字 */}
    </div>
  );
};

export default SuggestionPopup;
