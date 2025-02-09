import { promises as fs } from 'fs';
import { FileHandle } from 'fs/promises';

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