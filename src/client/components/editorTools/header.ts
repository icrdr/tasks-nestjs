import { BlockAPI } from '@editorjs/editorjs';
import HeaderS from '@editorjs/header';

export class Header extends HeaderS {
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
    (this as HeaderS).data = data;
  }
}
