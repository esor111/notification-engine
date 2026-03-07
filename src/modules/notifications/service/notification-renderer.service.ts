import { Injectable } from '@nestjs/common';

@Injectable()
export class NotificationRendererService {
  render(template: string, data: Record<string, unknown>): string {
    return template.replace(/{{\s*([a-zA-Z0-9_]+)\s*}}/g, (_match, key: string) => {
      const value = data[key];
      if (value === undefined || value === null) {
        return '';
      }

      return String(value);
    });
  }
}
