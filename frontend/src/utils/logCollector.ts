/**
 * 日志采集器 - 自动采集前端日志并上报到服务器
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error' | 'fatal';

interface LogEntry {
  level: LogLevel;
  message: string;
  source: 'frontend';
  logger_name?: string;
  error_type?: string;
  error_stack?: string;
  url?: string;
  extra_data?: Record<string, any>;
  user_id?: number;
}

interface LogCollectorConfig {
  enabled: boolean;
  reportUrl: string;
  batchSize: number;
  flushInterval: number;
  environment: string;
  appVersion: string;
  userId?: number;
}

class LogCollector {
  private config: LogCollectorConfig;
  private logQueue: LogEntry[] = [];
  private flushTimer: ReturnType<typeof setInterval> | null = null;
  private isReporting = false;

  constructor(config: Partial<LogCollectorConfig> = {}) {
    this.config = {
      enabled: true,
      reportUrl: '/api/v1/app-logs/batch',
      batchSize: 10,
      flushInterval: 10000, // 10秒
      environment: import.meta.env.MODE || 'development',
      appVersion: '1.0.0',
      ...config,
    };
  }

  /**
   * 初始化日志采集器
   */
  init() {
    if (!this.config.enabled) return;

    // 拦截 console.error
    this.interceptConsole();
    
    // 捕获全局错误
    this.captureGlobalError();
    
    // 捕获 Promise rejection
    this.captureUnhandledRejection();
    
    // 捕获网络错误
    this.captureNetworkError();
    
    // 启动定时刷新
    this.startFlushTimer();
    
    // 页面卸载时上报
    window.addEventListener('beforeunload', () => {
      this.flush();
    });

    console.log('[LogCollector] 日志采集器已初始化');
  }

  /**
   * 拦截 console 方法
   */
  private interceptConsole() {
    const originalConsole = {
      error: console.error,
      warn: console.warn,
      info: console.info,
    };

    console.error = (...args: any[]) => {
      originalConsole.error.apply(console, args);
      this.addLog('error', args.map(a => this.formatArg(a)).join(' '), 'console');
    };

    console.warn = (...args: any[]) => {
      originalConsole.warn.apply(console, args);
      this.addLog('warn', args.map(a => this.formatArg(a)).join(' '), 'console');
    };

    console.info = (...args: any[]) => {
      originalConsole.info.apply(console, args);
      // info 级别日志可选是否上报
    };
  }

  /**
   * 捕获全局错误
   */
  private captureGlobalError() {
    window.onerror = (message, source, lineno, colno, error) => {
      const log: LogEntry = {
        level: 'error',
        message: String(message),
        source: 'frontend',
        logger_name: 'window.onerror',
        error_type: error?.name || 'Error',
        error_stack: error?.stack || `at ${source}:${lineno}:${colno}`,
        url: window.location.href,
      };
      this.addLogEntry(log);
      return false;
    };
  }

  /**
   * 捕获未处理的 Promise rejection
   */
  private captureUnhandledRejection() {
    window.addEventListener('unhandledrejection', (event) => {
      const error = event.reason;
      const log: LogEntry = {
        level: 'error',
        message: error?.message || 'Unhandled Promise Rejection',
        source: 'frontend',
        logger_name: 'unhandledrejection',
        error_type: error?.name || 'UnhandledRejection',
        error_stack: error?.stack,
        url: window.location.href,
      };
      this.addLogEntry(log);
    });
  }

  /**
   * 捕获网络错误（拦截 fetch）
   */
  private captureNetworkError() {
    const originalFetch = window.fetch;
    
    window.fetch = async (...args) => {
      try {
        const response = await originalFetch.apply(window, args);
        
        // 记录失败的请求
        if (!response.ok) {
          const url = typeof args[0] === 'string' ? args[0] : (args[0] as Request).url;
          this.addLog('error', `HTTP ${response.status}: ${url}`, 'network', {
            status: response.status,
            statusText: response.statusText,
          });
        }
        
        return response;
      } catch (error: any) {
        const url = typeof args[0] === 'string' ? args[0] : (args[0] as Request).url;
        this.addLog('error', `Network Error: ${url}`, 'network', {
          error: error?.message,
        });
        throw error;
      }
    };
  }

  /**
   * 添加日志到队列
   */
  private addLog(level: LogLevel, message: string, loggerName?: string, extraData?: Record<string, any>) {
    const log: LogEntry = {
      level,
      message,
      source: 'frontend',
      logger_name: loggerName,
      url: window.location.href,
      extra_data: extraData,
      user_id: this.config.userId,
    };
    this.addLogEntry(log);
  }

  /**
   * 添加日志条目
   */
  private addLogEntry(log: LogEntry) {
    if (!this.config.enabled) return;

    // 过滤掉开发环境的 debug/info 日志
    if (this.config.environment === 'production' && log.level === 'debug') {
      return;
    }

    this.logQueue.push(log);
    
    // 达到批次大小时立即上报
    if (this.logQueue.length >= this.config.batchSize) {
      this.flush();
    }
  }

  /**
   * 手动上报日志
   */
  log(level: LogLevel, message: string, extraData?: Record<string, any>) {
    this.addLog(level, message, 'manual', extraData);
  }

  error(message: string, extraData?: Record<string, any>) {
    this.log('error', message, extraData);
  }

  warn(message: string, extraData?: Record<string, any>) {
    this.log('warn', message, extraData);
  }

  info(message: string, extraData?: Record<string, any>) {
    this.log('info', message, extraData);
  }

  /**
   * 上报用户行为
   */
  track(action: string, extraData?: Record<string, any>) {
    this.addLog('info', `User Action: ${action}`, 'user-behavior', extraData);
  }

  /**
   * 设置用户ID
   */
  setUserId(userId: number | undefined) {
    this.config.userId = userId;
  }

  /**
   * 刷新队列，上报日志
   */
  async flush() {
    if (this.isReporting || this.logQueue.length === 0) return;

    this.isReporting = true;
    const logsToSend = [...this.logQueue];
    this.logQueue = [];

    try {
      await this.reportLogs(logsToSend);
    } catch (error) {
      // 上报失败，将日志放回队列
      console.warn('[LogCollector] 日志上报失败', error);
      this.logQueue = [...logsToSend, ...this.logQueue];
    } finally {
      this.isReporting = false;
    }
  }

  /**
   * 上报日志到服务器
   */
  private async reportLogs(logs: LogEntry[]) {
    const payload = {
      logs,
      environment: this.config.environment,
      app_version: this.config.appVersion,
      browser: this.getBrowserInfo(),
      os: this.getOSInfo(),
      device: this.getDeviceInfo(),
    };

    // 使用 sendBeacon 确保在页面卸载时也能发送
    if (navigator.sendBeacon) {
      const blob = new Blob([JSON.stringify(payload)], { type: 'application/json' });
      navigator.sendBeacon(this.config.reportUrl, blob);
    } else {
      // 降级使用 fetch
      await fetch(this.config.reportUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        keepalive: true,
      });
    }
  }

  /**
   * 启动定时刷新
   */
  private startFlushTimer() {
    if (this.flushTimer) {
      clearInterval(this.flushTimer);
    }
    this.flushTimer = setInterval(() => {
      this.flush();
    }, this.config.flushInterval);
  }

  /**
   * 停止定时刷新
   */
  stop() {
    if (this.flushTimer) {
      clearInterval(this.flushTimer);
      this.flushTimer = null;
    }
    this.flush();
  }

  /**
   * 格式化参数
   */
  private formatArg(arg: any): string {
    if (arg === null) return 'null';
    if (arg === undefined) return 'undefined';
    if (typeof arg === 'object') {
      try {
        return JSON.stringify(arg);
      } catch {
        return String(arg);
      }
    }
    return String(arg);
  }

  /**
   * 获取浏览器信息
   */
  private getBrowserInfo(): string {
    const ua = navigator.userAgent;
    if (ua.includes('Chrome')) return 'Chrome';
    if (ua.includes('Firefox')) return 'Firefox';
    if (ua.includes('Safari')) return 'Safari';
    if (ua.includes('Edge')) return 'Edge';
    if (ua.includes('IE')) return 'IE';
    return 'Unknown';
  }

  /**
   * 获取操作系统信息
   */
  private getOSInfo(): string {
    const ua = navigator.userAgent;
    if (ua.includes('Windows')) return 'Windows';
    if (ua.includes('Mac')) return 'MacOS';
    if (ua.includes('Linux')) return 'Linux';
    if (ua.includes('Android')) return 'Android';
    if (ua.includes('iOS')) return 'iOS';
    return 'Unknown';
  }

  /**
   * 获取设备类型
   */
  private getDeviceInfo(): string {
    const ua = navigator.userAgent;
    if (/Mobile|Android|iPhone|iPad|iPod/i.test(ua)) return 'Mobile';
    return 'Desktop';
  }
}

// 单例模式
export const logCollector = new LogCollector();

export default logCollector;