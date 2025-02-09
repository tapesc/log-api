import { promises as fs } from 'fs';
import { FileHandle } from 'fs/promises';
import { DateTime } from 'luxon';

type SyslogMessage = {
  isParsed: true,
  timestamp: DateTime;
  host: string;
  processName: string;
  pid?: number;
  message: string;
  rawLine: string;
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

      // If we've hit our limit, store the current position and break
      if (lines.length >= limit) {
        limitPosition = position + readLength;
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
  // Added more explicit spacing in regex to handle both single and double spaces
  // Matches both: "sshd[123]:" and "sshd:"
  const match = line.match(/^(\w+)\s+(\d+)\s+(\d{2}:\d{2}:\d{2})\s+(\S+)\s+([^[\s:]+)(?:\[(\d+)\])?:\s+(.+)$/);

  if (!match) {
    return {
      isParsed: false,
      rawLine: line
    };
  }

  const [, month, day, time, host, processName, pid, message] = match;

  // TIL syslog dates don't include the year, so we need to add it
  const currentYear = new Date().getFullYear();
  const timestamp = DateTime.fromFormat(
    `${currentYear} ${month} ${day} ${time}`,
    "yyyy MMM d HH:mm:ss"
  );

  if (timestamp > DateTime.now()) {
    timestamp.minus({ years: 1 });
  }

  return {
    isParsed: true,
    timestamp,
    host,
    processName,
    pid: pid ? parseInt(pid, 10) : undefined,
    message: message.trim(),
    rawLine: line
  };
}