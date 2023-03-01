
const AUTO_LOGGING_ID = 'data-auto-logging-id';

function getAutoLoggingID(element?: Element): string | null {
  return element ? element.getAttribute(AUTO_LOGGING_ID) : null;
}

export function setAutoLoggingID(element: Element): string {
  const autoLoggingID = guid();
  element.setAttribute(AUTO_LOGGING_ID, autoLoggingID);
  return autoLoggingID;
}

export function getOrSetAutoLoggingID(element: Element): string {
  return getAutoLoggingID(element) ?? setAutoLoggingID(element);
}
function guid(): string {
  return 'f' + (Math.random() * (1 << 30)).toString(16).replace('.', '');
}

