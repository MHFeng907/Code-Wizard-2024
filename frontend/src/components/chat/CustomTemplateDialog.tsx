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
    <div className="bg-root-primary w-[300px] p-4 rounded-xl flex flex-col gap-2"> {/* 调整宽度和内边距 */}
  <h2 className="text-lg leading-5 font-semibold">自定义模板</h2> {/* 调整字体大小 */}
  <input
    type="text"
    value={name}
    onChange={(e) => setName(e.target.value)}
    placeholder="模板名称"
    className="p-1 border rounded-md" // 调整内边距
  />
  <textarea
    value={content}
    onChange={(e) => setContent(e.target.value)}
    placeholder="模板内容"
    className="p-1 border rounded-md" // 调整内边距
    rows={3} // 调整行数
  />
  <div className="flex justify-between gap-1"> {/* 调整间距 */}
    <button
      className="bg-gray-500 text-white p-1 rounded" // 调整内边距
      onClick={onClose}
    >
      关闭
    </button>
    <button
      className="bg-blue-500 text-white p-1 rounded" // 调整内边距
      onClick={handleSave}
    >
      保存模板
    </button>
  </div>
</div>

  );
};

export default CustomTemplateDialog;
