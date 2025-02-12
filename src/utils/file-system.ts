import { promises as fs } from 'fs';
import { FileHandle } from 'fs/promises';
import { DateTime } from 'luxon';
import { Facility, Severity } from '~/utils/constants.ts';

type SyslogMessage = {
  isParsed: boolean;
  rawLine: string;
  timestamp?: DateTime;
  host?: string;
  priority?: {
    facility: Facility;
    severity: Severity;
  };
  version?: number;
  processName?: string;
  pid?: number;
  messageId?: string;
  structuredData?: Record<string, Record<string, string>>;
  message?: string;
} | {
  isParsed: false;
  rawLine: string;
}

interface PaginatedResult {
  lines: string[];
  nextCursor: number | null;
}

interface ReadOptions {
  filePath: string;
  limit: number;
  cursor?: number | null;
  encoding?: BufferEncoding;
  chunkSize?: number;
}

export async function readLines({
                                  filePath,
                                  limit,
                                  cursor = null,
                                  encoding = 'utf8',
                                  chunkSize = 1024,
                                }: ReadOptions): Promise<PaginatedResult> {
  const fileBuffer = Buffer.alloc(chunkSize);
  let fd: FileHandle | null = null;

  try {
    fd = await fs.open(filePath, 'r');
    const fileStats = await fd.stat();
    const lines: string[] = [];

    let position = cursor ?? fileStats.size;
    let pendingLine = '';
    let limitPosition = position;
    let firstChunk = true;

    while (position > 0) {
      const readLength = Math.min(chunkSize, position);
      position -= readLength;

      const { bytesRead } = await fd.read(
        fileBuffer,
        0,
        readLength,
        position,
      );

      const chunk = fileBuffer.subarray(0, bytesRead).toString(encoding);

      // If this is the first chunk and we're starting from a cursor,
      // we need to find the start of the next complete line
      if (firstChunk && cursor !== null && cursor !== fileStats.size) {
        const nextNewline = chunk.indexOf('\n');
        if (nextNewline !== -1) {
          // Adjust the chunk to start from the next complete line
          const adjustedChunk = chunk.substring(nextNewline + 1);
          limitPosition = position + nextNewline + 1;
          firstChunk = false;

          // Process the adjusted chunk
          const chunkLines = adjustedChunk.split('\n');
          if (pendingLine) {
            chunkLines[chunkLines.length - 1] += pendingLine;
            pendingLine = '';
          }

          if (chunkLines.length > 0) {
            const validLines = chunkLines
              .reverse()
              .filter(line => line.length > 0);
            lines.push(...validLines);
          }

          continue;
        }
      }

      firstChunk = false;
      const chunkLines = chunk.split('\n');

      if (pendingLine) {
        chunkLines[chunkLines.length - 1] += pendingLine;
        pendingLine = '';
      }

      if (chunkLines.length > 1) {
        const validLines = chunkLines
          .slice(1)
          .reverse()
          .filter(line => line.length > 0);
        lines.push(...validLines);
      }

      pendingLine = chunkLines[0];

      // If we've hit our limit, find the next line boundary and break
      if (lines.length >= limit) {
        // Find the last newline in the current chunk
        const lastNewlinePos = chunk.lastIndexOf('\n');
        if (lastNewlinePos !== -1) {
          limitPosition = position + lastNewlinePos + 1;
        } else {
          // If no newline in this chunk, we need to read forward to find the next one
          const forwardBuffer = Buffer.alloc(chunkSize);
          const { bytesRead: forwardBytesRead } = await fd.read(
            forwardBuffer,
            0,
            chunkSize,
            position + readLength
          );

          if (forwardBytesRead > 0) {
            const forwardChunk = forwardBuffer.subarray(0, forwardBytesRead).toString(encoding);
            const nextNewline = forwardChunk.indexOf('\n');
            if (nextNewline !== -1) {
              limitPosition = position + readLength + nextNewline + 1;
            } else {
              // If we still can't find a newline, set to end of forward chunk
              limitPosition = position + readLength + forwardBytesRead;
            }
          } else {
            limitPosition = position + readLength;
          }
        }
        break;
      }
    }

    if (pendingLine && pendingLine.length > 0 && lines.length < limit) {
      lines.push(pendingLine);
    }

    return {
      lines: lines.slice(0, limit),
      nextCursor: position > 0 ? limitPosition : null,
    };
  } finally {
    if (fd) await fd.close();
  }
}

export function parseSyslogLine(line: string): SyslogMessage {
  // RFC5424 format:
  // <priority>version timestamp hostname app-name procid msgid structured-data msg
  const regex = /^<(\d+)>(\d+)\s+(\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:\d{2}))\s+(\S+)\s+(\S+)\s+(-|\d+)\s+(-|[^\s\[]+)(?:\s+(\[.*?\]))*(?:\s+(.+))?$/;

  const match = line.match(regex);

  if (!match) {
    return {
      isParsed: false,
      rawLine: line
    };
  }

  const [
    ,
    priorityValue,
    version,
    timestampStr,
    host,
    processName,
    pid,
    messageId,
    structuredDataStr,
    message
  ] = match;

  // Parse priority into facility and severity
  const priorityNum = parseInt(priorityValue, 10);
  const facility = Math.floor(priorityNum / 8) as Facility;
  const severity = (priorityNum % 8) as Severity;

  // Parse structured data if present
  const structuredData: Record<string, Record<string, string>> = {};
  if (structuredDataStr) {
    const sdRegex = /\[([^\s\]]+)(?:\s+([^\]]+))?\]/g;
    let sdMatch;
    while ((sdMatch = sdRegex.exec(structuredDataStr)) !== null) {
      const [, sdId, paramsStr] = sdMatch;
      structuredData[sdId] = {};

      if (paramsStr) {
        const paramRegex = /([^\s=]+)="([^"]+)"/g;
        let paramMatch;
        while ((paramMatch = paramRegex.exec(paramsStr)) !== null) {
          const [, key, value] = paramMatch;
          structuredData[sdId][key] = value;
        }
      }
    }
  }

  return {
    isParsed: true,
    timestamp: DateTime.fromISO(timestampStr),
    host,
    priority: {
      facility,
      severity
    },
    version: parseInt(version, 10),
    processName: processName === '-' ? undefined : processName,
    pid: pid === '-' ? undefined : parseInt(pid, 10),
    messageId: messageId === '-' ? undefined : messageId,
    structuredData: Object.keys(structuredData).length > 0 ? structuredData : undefined,
    message: message?.trim(),
    rawLine: line
  };
}