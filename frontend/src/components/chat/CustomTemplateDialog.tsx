import React, { useState } from 'react';
import templateManager from './TemplateManager'; // 引入模板管理器

interface CustomTemplateDialogProps {
  onClose: () => void;
  onSave: (template: { name: string; content: string }) => void;
}

const CustomTemplateDialog: React.FC<CustomTemplateDialogProps> = ({ onClose, onSave }) => {
  const [name, setName] = useState('');
  const [content, setContent] = useState('');

  const handleSave = () => {
    templateManager.saveTemplate({ id: Date.now().toString(), name, content });
    onSave({ name, content });
    onClose();
  };

  return (
    <div className="bg-root-primary w-[250px] p-3 rounded-lg flex flex-col gap-2"> {/* 减小宽度和内边距 */}
      <h2 className="text-sm font-medium">自定义模板</h2> {/* 缩小标题字体 */}
      <input
        type="text"
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="模板名称"
        className="p-1 text-sm border rounded-md" // 缩小内边距和字体
      />
      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder="模板内容"
        className="p-1 text-sm border rounded-md" // 缩小内边距和字体
        rows={2} // 减少文本框高度
      />
      <div className="flex justify-between gap-2"> {/* 调整按钮间距 */}
        <button
          className="bg-gray-500 text-white p-1 text-xs rounded" // 缩小按钮内边距和字体
          onClick={onClose}
        >
          关闭
        </button>
        <button
          className="bg-blue-500 text-white p-1 text-xs rounded" // 缩小按钮内边距和字体
          onClick={handleSave}
        >
          保存模板
        </button>
      </div>
    </div>
  );
};

export default CustomTemplateDialog;
