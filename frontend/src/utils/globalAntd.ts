import { App, message as staticMessage } from 'antd';
import type { MessageInstance } from 'antd/es/message/interface';
import type { ModalStaticFunctions } from 'antd/es/modal/confirm';
import type { NotificationInstance } from 'antd/es/notification/interface';

// 初始化为一个安全的 fallback，避免未初始化时报错
// 只要 App 组件挂载后，useGlobalAntd 会立即覆盖这些值
let message: MessageInstance = staticMessage;
let notification: NotificationInstance;
let modal: Omit<ModalStaticFunctions, 'warn'>;

export const useGlobalAntd = () => {
  const staticFunction = App.useApp();
  message = staticFunction.message;
  modal = staticFunction.modal;
  notification = staticFunction.notification;
};

export { message, notification, modal };
