// Facility values as per RFC 5424
export enum Facility {
  KERN = 0,
  USER = 1,
  MAIL = 2,
  DAEMON = 3,
  AUTH = 4,
  SYSLOG = 5,
  LPR = 6,
  NEWS = 7,
  UUCP = 8,
  CRON = 9,
  AUTHPRIV = 10,
  FTP = 11,
  NTP = 12,
  SECURITY = 13,
  CONSOLE = 14,
  LOCAL0 = 16,
  LOCAL1 = 17,
  LOCAL2 = 18,
  LOCAL3 = 19,
  LOCAL4 = 20,
  LOCAL5 = 21,
  LOCAL6 = 22,
  LOCAL7 = 23
}

// Severity values as per RFC 5424
export enum Severity {
  EMERG = 0,
  ALERT = 1,
  CRIT = 2,
  ERR = 3,
  WARNING = 4,
  NOTICE = 5,
  INFO = 6,
  DEBUG = 7
}

// Helper function to get facility name
export function getFacilityName(code: Facility): string {
  return Facility[code];
}

// Helper function to get severity name
export function getSeverityName(code: Severity): string {
  return Severity[code];
}

// Helper function to get facility code from name
export function getFacilityCode(name: string): Facility | undefined {
  const upperName = name.toUpperCase();
  return Facility[upperName as keyof typeof Facility];
}

// Helper function to get severity code from name
export function getSeverityCode(name: string): Severity | undefined {
  const upperName = name.toUpperCase();
  return Severity[upperName as keyof typeof Severity];
}