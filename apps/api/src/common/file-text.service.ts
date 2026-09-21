import { Injectable, BadRequestException } from '@nestjs/common';

export const FILE_MAX_BYTES = 15 * 1024 * 1024;

@Injectable()
export class FileTextService {
  async extractText(
    filename: string,
    mime: string,
    base64: string,
  ): Promise<{ text: string; ext: string }> {
    const ext = (filename.split('.').pop() ?? '').toLowerCase();
    const allowed = ['pdf', 'doc', 'docx', 'txt'];
    if (!allowed.includes(ext)) {
      throw new BadRequestException(
        `Formato .${ext || 'desconhecido'} não suportado. Envie PDF, Word (.doc/.docx) ou TXT.`,
      );
    }

    const buffer = Buffer.from(base64, 'base64');
    if (buffer.length === 0) throw new BadRequestException('Arquivo vazio.');
    if (buffer.length > FILE_MAX_BYTES) {
      throw new BadRequestException('Arquivo muito grande (máx. 15MB).');
    }

    const mimeAccepted =
      mime === 'application/pdf' ||
      mime === 'text/plain' ||
      mime === 'application/msword' ||
      mime ===
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
      mime.startsWith('text/');
    if (!mimeAccepted) {
      throw new BadRequestException('Tipo de arquivo não reconhecido.');
    }

    try {
      let text = '';
      if (ext === 'pdf') {
        const { PDFParse } = await import('pdf-parse');
        const parser = new PDFParse({ data: buffer });
        const result = await parser.getText();
        await parser.destroy?.();
        text = result?.text ?? '';
      } else if (ext === 'docx') {
        const mammoth = await import('mammoth');
        const result = await mammoth.extractRawText({ buffer });
        text = result.value ?? '';
      } else if (ext === 'doc') {
        const WordExtractor = (await import('word-extractor')).default;
        const extractor = new WordExtractor();
        const doc = await extractor.extract(buffer);
        text = doc.getBody() ?? '';
      } else {
        text = buffer.toString('utf8');
      }

      const normalized = text
        .replace(/\r\n/g, '\n')
        .replace(/\s+\n/g, '\n')
        .trim();
      return { text: normalized, ext };
    } catch (error: any) {
      throw new BadRequestException(
        `Falha ao ler o arquivo: ${error?.message ?? 'erro de parsing'}`,
      );
    }
  }
}
