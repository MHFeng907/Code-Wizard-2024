// TemplateManager.ts

interface Template {
    id: string;
    name: string;
    content: string;
  }

  class TemplateManager {
    private templates: Template[] = [];

    constructor() {
      // 默认预设模板
      this.templates = [
        { id: '1', name: '创建新项目', content: '请生成项目级代码，我需要此项目的完整文件夹、所有文件及其内容，并有一定的组织结构，请把项目文件夹放在我指定的路径下。\n存储路径：\n【请在此处输入项目文件夹存储路径】\n详细要求：\n【请在此处输入项目的具体要求】' },
        { id: '2', name: '代码语言转换', content: '请将我的代码文件进行语言转换。\n文件路径：\n【在这里输入你的文件路径】\n需要转换的程序语言：\n【请在此处输入该文件需要转换的程序语言】\n新文件存储路径：\n【请在此处输入转换后的文件存储路径】' },
        { id: '3', name: '代码片段生成', content: '请生成一个代码片段，完成以下任务：\n【在这里输入具体任务描述】\n代码需要高效，并遵循最佳实践，且包含关键部分的注释。' },
        { id: '4', name: '函数重构优化', content: '请优化或重构以下代码：\n【在这里粘贴你的代码】\n改进方向是：\n【在这里描述希望改进的方面，如性能、可读性或遵循某些标准】\n请提供优化后的代码并解释所做的改进。' },
        { id: '5', name: '测试用例生成', content: '请为以下功能生成单元测试代码：\n【在这里输入功能或类的描述】\n测试应包括不同场景，并验证代码的正确性。' }
        // 其他默认模板
      ];
    }

    // 获取所有模板
    getTemplates(): Template[] {
      return this.templates;
    }

    // 获取单个模板
    getTemplateById(id: string): Template | undefined {
      return this.templates.find(template => template.id === id);
    }

    // 保存自定义模板
    saveTemplate(template: Template): void {
      const existingTemplateIndex = this.templates.findIndex(t => t.id === template.id);
      if (existingTemplateIndex > -1) {
        this.templates[existingTemplateIndex] = template; // 更新
      } else {
        this.templates.push(template); // 新增
      }
    }
  }

  const templateManager = new TemplateManager();
  export default templateManager;
