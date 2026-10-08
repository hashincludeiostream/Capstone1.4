/**
 * Nail Glam Hub - Centralized AJAX (Asynchronous JavaScript and XML) Client
 *
 * Provides asynchronous, non-blocking HTTP communication across the entire
 * platform without full-page reloads. Standardizes headers (including
 * X-Requested-With: XMLHttpRequest), request timeouts, JSON serialization,
 * error handling, and lifecycle event telemetry.
 */

export interface AjaxOptions extends RequestInit {
  timeout?: number;
  params?: Record<string, string | number | boolean | undefined | null>;
  responseType?: 'json' | 'text' | 'blob' | 'arraybuffer';
  onUploadProgress?: (progressEvent: ProgressEvent) => void;
  onDownloadProgress?: (progressEvent: ProgressEvent) => void;
}

export interface AjaxResponse<T = any> {
  data: T;
  status: number;
  statusText: string;
  headers: Headers;
  ok: boolean;
  url: string;
}

// Preserve underlying native fetch before any interceptor attaches
const nativeFetch: typeof fetch =
  typeof window !== 'undefined' && window.fetch
    ? window.fetch.bind(window)
    : globalThis.fetch;

class AjaxClient {
  private activeRequestCount = 0;

  get activeCount(): number {
    return this.activeRequestCount;
  }

  private increment() {
    this.activeRequestCount++;
    if (typeof window !== 'undefined') {
      window.dispatchEvent(
        new CustomEvent('ajax:start', {
          detail: { activeCount: this.activeRequestCount },
        })
      );
    }
  }

  private decrement() {
    this.activeRequestCount = Math.max(0, this.activeRequestCount - 1);
    if (typeof window !== 'undefined') {
      window.dispatchEvent(
        new CustomEvent('ajax:complete', {
          detail: { activeCount: this.activeRequestCount },
        })
      );
    }
  }

  /**
   * Main asynchronous AJAX request method compatible with the Fetch API interface.
   * Injects standard AJAX headers and manages timeouts.
   */
  async request(url: string, options: AjaxOptions = {}): Promise<Response> {
    const { timeout = 30000, params, ...fetchOptions } = options;

    let finalUrl = url;
    if (params) {
      const searchParams = new URLSearchParams();
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          searchParams.append(key, String(value));
        }
      });
      const queryString = searchParams.toString();
      if (queryString) {
        finalUrl += (finalUrl.includes('?') ? '&' : '?') + queryString;
      }
    }

    // Build standard AJAX headers
    const headers = new Headers(fetchOptions.headers || {});
    const isInternal =
      !finalUrl.startsWith('http://') && !finalUrl.startsWith('https://')
      || (typeof window !== 'undefined' && finalUrl.startsWith(window.location.origin));

    if (isInternal && !headers.has('X-Requested-With')) {
      headers.set('X-Requested-With', 'XMLHttpRequest');
    }
    if (!headers.has('Accept')) {
      headers.set('Accept', 'application/json, text/plain, */*');
    }

    // If body is a plain object or array, serialize to JSON
    let body = fetchOptions.body;
    if (
      body &&
      typeof body === 'object' &&
      !(body instanceof FormData) &&
      !(body instanceof Blob) &&
      !(body instanceof URLSearchParams) &&
      !(body instanceof ArrayBuffer)
    ) {
      if (!headers.has('Content-Type')) {
        headers.set('Content-Type', 'application/json');
      }
      body = JSON.stringify(body);
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    // If user provided a signal, link it to abort controller
    if (fetchOptions.signal?.aborted) {
      controller.abort();
    } else if (fetchOptions.signal) {
      fetchOptions.signal.addEventListener('abort', () => controller.abort());
    }

    this.increment();

    try {
      const response = await nativeFetch(finalUrl, {
        ...fetchOptions,
        headers,
        body,
        signal: controller.signal,
      });

      if (typeof window !== 'undefined') {
        window.dispatchEvent(
          new CustomEvent('ajax:success', {
            detail: { url: finalUrl, status: response.status },
          })
        );
      }

      return response;
    } catch (err: any) {
      if (typeof window !== 'undefined') {
        window.dispatchEvent(
          new CustomEvent('ajax:error', {
            detail: { url: finalUrl, error: err },
          })
        );
      }
      throw err;
    } finally {
      clearTimeout(timeoutId);
      this.decrement();
    }
  }

  // HTTP Method Shortcuts
  async get(url: string, options: AjaxOptions = {}): Promise<Response> {
    return this.request(url, { ...options, method: 'GET' });
  }

  async post(url: string, body?: any, options: AjaxOptions = {}): Promise<Response> {
    return this.request(url, { ...options, method: 'POST', body });
  }

  async put(url: string, body?: any, options: AjaxOptions = {}): Promise<Response> {
    return this.request(url, { ...options, method: 'PUT', body });
  }

  async patch(url: string, body?: any, options: AjaxOptions = {}): Promise<Response> {
    return this.request(url, { ...options, method: 'PATCH', body });
  }

  async delete(url: string, options: AjaxOptions = {}): Promise<Response> {
    return this.request(url, { ...options, method: 'DELETE' });
  }

  // JSON helper methods for ergonomic consumption
  async getJSON<T = any>(url: string, options: AjaxOptions = {}): Promise<T> {
    const res = await this.get(url, options);
    if (!res.ok) {
      const errorBody = await res.json().catch(() => ({}));
      throw new Error(errorBody.message || errorBody.error || `AJAX GET failed with status ${res.status}`);
    }
    return res.json();
  }

  async postJSON<T = any>(url: string, body?: any, options: AjaxOptions = {}): Promise<T> {
    const res = await this.post(url, body, options);
    if (!res.ok) {
      const errorBody = await res.json().catch(() => ({}));
      throw new Error(errorBody.message || errorBody.error || `AJAX POST failed with status ${res.status}`);
    }
    return res.json();
  }

  async putJSON<T = any>(url: string, body?: any, options: AjaxOptions = {}): Promise<T> {
    const res = await this.put(url, body, options);
    if (!res.ok) {
      const errorBody = await res.json().catch(() => ({}));
      throw new Error(errorBody.message || errorBody.error || `AJAX PUT failed with status ${res.status}`);
    }
    return res.json();
  }

  async patchJSON<T = any>(url: string, body?: any, options: AjaxOptions = {}): Promise<T> {
    const res = await this.patch(url, body, options);
    if (!res.ok) {
      const errorBody = await res.json().catch(() => ({}));
      throw new Error(errorBody.message || errorBody.error || `AJAX PATCH failed with status ${res.status}`);
    }
    return res.json();
  }

  async deleteJSON<T = any>(url: string, options: AjaxOptions = {}): Promise<T> {
    const res = await this.delete(url, options);
    if (!res.ok) {
      const errorBody = await res.json().catch(() => ({}));
      throw new Error(errorBody.message || errorBody.error || `AJAX DELETE failed with status ${res.status}`);
    }
    return res.json();
  }

  /**
   * Classic XMLHttpRequest wrapper for explicit DOM-level XHR implementations
   */
  xhr<T = any>(
    method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE',
    url: string,
    data?: any,
    headers?: Record<string, string>
  ): Promise<AjaxResponse<T>> {
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.open(method, url, true);
      xhr.setRequestHeader('X-Requested-With', 'XMLHttpRequest');
      xhr.setRequestHeader('Accept', 'application/json, text/plain, */*');

      if (headers) {
        Object.entries(headers).forEach(([k, v]) => xhr.setRequestHeader(k, v));
      }

      xhr.onload = () => {
        let parsedData: any = xhr.responseText;
        const contentType = xhr.getResponseHeader('Content-Type') || '';
        if (contentType.includes('application/json')) {
          try {
            parsedData = JSON.parse(xhr.responseText);
          } catch {
            // retain as text if parse fails
          }
        }

        const headersObj = new Headers();
        const rawHeaders = xhr.getAllResponseHeaders().trim().split(/[\r\n]+/);
        rawHeaders.forEach((line) => {
          const parts = line.split(': ');
          const header = parts.shift();
          const value = parts.join(': ');
          if (header) headersObj.append(header, value);
        });

        const result: AjaxResponse<T> = {
          data: parsedData,
          status: xhr.status,
          statusText: xhr.statusText,
          headers: headersObj,
          ok: xhr.status >= 200 && xhr.status < 300,
          url: xhr.responseURL || url,
        };

        if (result.ok) {
          resolve(result);
        } else {
          reject(result);
        }
      };

      xhr.onerror = () => {
        reject(new Error(`Network error occurred during AJAX ${method} request to ${url}`));
      };

      xhr.ontimeout = () => {
        reject(new Error(`AJAX request to ${url} timed out`));
      };

      if (data && typeof data === 'object' && !(data instanceof FormData)) {
        xhr.setRequestHeader('Content-Type', 'application/json');
        xhr.send(JSON.stringify(data));
      } else {
        xhr.send(data);
      }
    });
  }
}

// Singleton AJAX client instance
export const ajaxClient = new AjaxClient();

/**
 * Default callable ajax function
 * Usage:
 *   const res = await ajax('/api/salons');
 *   const data = await res.json();
 */
export const ajax = Object.assign(
  (url: string, options?: AjaxOptions) => ajaxClient.request(url, options),
  {
    get: ajaxClient.get.bind(ajaxClient),
    post: ajaxClient.post.bind(ajaxClient),
    put: ajaxClient.put.bind(ajaxClient),
    patch: ajaxClient.patch.bind(ajaxClient),
    delete: ajaxClient.delete.bind(ajaxClient),
    getJSON: ajaxClient.getJSON.bind(ajaxClient),
    postJSON: ajaxClient.postJSON.bind(ajaxClient),
    putJSON: ajaxClient.putJSON.bind(ajaxClient),
    patchJSON: ajaxClient.patchJSON.bind(ajaxClient),
    deleteJSON: ajaxClient.deleteJSON.bind(ajaxClient),
    xhr: ajaxClient.xhr.bind(ajaxClient),
    get activeCount() {
      return ajaxClient.activeCount;
    },
  }
);

// Register on global window for inspection, developer tools, and universal availability
let interceptorInstalled = false;
export function installGlobalAjaxInterceptor(): void {
  if (typeof window === 'undefined' || interceptorInstalled) return;
  interceptorInstalled = true;

  try {
    (window as any).ajax = ajax;
    (window as any).ajaxClient = ajaxClient;
    (window as any).__nativeFetch = nativeFetch;
  } catch {
    // Ignore in strictly read-only window environments
  }
}

if (typeof window !== 'undefined') {
  installGlobalAjaxInterceptor();
}

export default ajax;
