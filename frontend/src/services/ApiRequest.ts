// src/services/ApiRequest.ts
export class ApiRequest {
  api: string;

  constructor(api: string) {
    this.api = api;
  }

  // 执行 API 请求的模板方法
  async request(endpoint: string, method: string, body: any = null, formData: FormData | null = null) {
    const url = `http://localhost:3001/api/v1${endpoint}`;

    // 如果传入了 formData，Content-Type 设置为 multipart/form-data，否则是 application/json
    const headers: HeadersInit = {
      "Accept": "application/json",
      "Authorization": `Bearer ${this.api}`,
      // 如果是文件上传，设置 Content-Type 为 multipart/form-data
      "Content-Type": formData ? "multipart/form-data" : "application/json",
    };

    const options: RequestInit = {
      method,
      headers,
      body: formData || (body ? JSON.stringify(body) : null),
    };

    try {
      const response = await fetch(url, options);
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Request failed');
      }
      return data;
    } catch (error: any) {
      throw new Error(error.message || 'Failed to fetch data');
    }
  }
}
