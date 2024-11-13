import React, { useState } from 'react';
import { Menu, MenuItem, MenuButton } from '@szhsin/react-menu';
import { twMerge } from 'tailwind-merge';
import templateManager from './TemplateManager'; // 引入模板管理器
import CustomTemplateDialog from './CustomTemplateDialog';

interface ContextMenuChatProps {
  onOptionSelect: (option: string) => void;
}

const ContextMenuChat: React.FC<ContextMenuChatProps> = ({ onOptionSelect }) => {
  const [showCustomDialog, setShowCustomDialog] = useState(false);
  const templates = templateManager.getTemplates(); // 获取所有模板

  const handleTemplateSelect = (template: { name: string, content: string }) => {
    onOptionSelect(template.content);
  };

  return (
    <div>
      <Menu
        menuButton={
          <MenuButton className="bg-blue-600 text-white p-2 rounded-md hover:bg-blue-500 transition duration-200">
            模板
          </MenuButton>
        }
        className={twMerge('bg-gray-200 text-black rounded-md shadow-lg border border-gray-300', 'w-[200px]')}
      >
        {templates.map((template) => (
          <MenuItem
            key={template.id}
            onClick={() => handleTemplateSelect(template)}
            className="p-2 hover:bg-blue-500 rounded-md transition duration-150"
          >
            {template.name}
          </MenuItem>
        ))}
        <MenuItem
          onClick={() => setShowCustomDialog(true)}
          className="p-2 hover:bg-blue-500 rounded-md transition duration-150"
        >
          自定义模板
        </MenuItem>
      </Menu>

      {showCustomDialog && (
        <CustomTemplateDialog
          onClose={() => setShowCustomDialog(false)}
          onSave={(newTemplate) => {
            templateManager.saveTemplate({
              id: Date.now().toString(),
              name: newTemplate.name,
              content: newTemplate.content,
            });
            setShowCustomDialog(false);
          }}
        />
      )}
    </div>
  );
};

export default ContextMenuChat;

