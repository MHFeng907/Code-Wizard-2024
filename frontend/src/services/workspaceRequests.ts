// src/services/workspaceRequests.ts
import { ApiRequest } from './ApiRequest';

// 获取工作区列表
export class GetWorkspacesRequest extends ApiRequest {
  async fetchWorkspaces() {
    return this.request('/workspaces', 'GET');
  }
}

// 创建工作区
export class CreateWorkspaceRequest extends ApiRequest {
  async createWorkspace(name: string) {
    const body = { name };
    return this.request('/workspace/new', 'POST', body);
  }
}

// 删除工作区
export class DeleteWorkspaceRequest extends ApiRequest {
    async deleteWorkspace(name: string) {
      const endpoint = `/workspace/${name}`;
      return this.request(endpoint, 'DELETE');
    }
  }

  // 链接上传
  export class LinkUploadRequest extends ApiRequest {
    async uploadLink(link: string) {
      const body = { link };
      return this.request('/document/upload-link', 'POST', body);
    }
  }
  
  // 文件上传
  export class FileUploadRequest extends ApiRequest {
    async uploadFile(file: File) {
      const formData = new FormData();
      formData.append("file", file);
      return this.request('/document/upload', 'POST', null, formData);
    }
  }