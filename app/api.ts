export type ApiMethod = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';

export interface ApiOptions {
  method?: ApiMethod;
  headers?: Record<string, string>;
  body?: any;
  token?: string;
}

export async function apiCall<T = any>(
  url: string,
  options: ApiOptions = {}
): Promise<T> {
  const { method = 'GET', headers = {}, body, token } = options;
  const fetchHeaders: Record<string, string> = {
    'Content-Type': 'application/json',
    ...headers,
  };
  if (token) {
    fetchHeaders['Authorization'] = `Bearer ${token}`;
  }
  const response = await fetch(url, {
    method,
    headers: fetchHeaders,
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(errorText || `API error: ${response.status}`);
  }
  // Try to parse JSON, fallback to text
  try {
    return await response.json();
  } catch {
    return (await response.text()) as any;
  }
} 