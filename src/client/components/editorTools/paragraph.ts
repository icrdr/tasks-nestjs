import { BlockAPI } from '@editorjs/editorjs';
import ParagraphS from '@editorjs/paragraph';

export class Paragraph extends ParagraphS {
  blockApi: BlockAPI;
  constructor({ data, config, api, readOnly, block }) {
    super({ data, config, api, readOnly, block });
    this.blockApi = block;
  }

  save(toolElement: HTMLElement) {
    return super.save(toolElement);
  }
  render() {
    return super.render();
  }

  updateRender(data) {
    (this as ParagraphS).data = data;
  }
}
