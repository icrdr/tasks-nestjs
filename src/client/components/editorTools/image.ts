import ImageS from '@editorjs/image';
import moment from 'moment';
import OSS from 'ali-oss';
import { selectFiles } from '@utils/utils';
import isEqual from 'lodash/isEqual';
import { getOssClient } from '@/pages/layout/layout.service';

class Uploader {
  config: any;
  onUpload: any;
  onError: any;

  constructor({ config, onUpload, onError }) {
    this.config = config;
    this.onUpload = onUpload;
    this.onError = onError;
  }

  async ossUpload(file) {
    const objectName = moment().format('YYYYMMDDhhmmss');
    const oss = await getOssClient();
    const res = await oss.put(objectName, file);
    console.log(res);
    return {
      success: 1,
      file: {
        source: 'oss:' + objectName,
      },
    };
  }

  uploadSelectedFile({ onPreview }) {
    const upload = selectFiles({ accept: this.config.types }).then((files) => {
      const reader = new FileReader();
      reader.readAsDataURL(files[0]);
      reader.onload = (e) => {
        onPreview(e.target.result);
      };
      const customUpload = this.ossUpload(files[0]);
      return customUpload;
    });

    upload
      .then((res) => {
        this.onUpload(res);
      })
      .catch((err) => {
        this.onError(err);
      });
  }

  uploadByUrl(url: string) {
    const upload = new Promise(function (resolve, reject) {
      resolve({
        success: 1,
        file: {
          source: 'url:' + url,
        },
      });
    });

    upload
      .then((res) => {
        this.onUpload(res);
      })
      .catch((err) => {
        this.onError(err);
      });
  }

  uploadByFile(file: any, { onPreview }) {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (e) => {
      onPreview(e.target.result);
    };

    const upload = this.ossUpload(file);
    upload
      .then((res) => {
        this.onUpload(res);
      })
      .catch((err) => {
        this.onError(err);
      });
  }
}

export class Image extends ImageS {
  constructor({ data, config, api, readOnly }) {
    //call on block's creation (init editor or insert a new block)
    super({ data, config, api, readOnly });
    const imagePreloader = (this as ImageS).ui.nodes.imagePreloader;
    const imageContainer = (this as ImageS).ui.nodes.imageContainer;
    imagePreloader.className = 'oss-image-tool__image-preloader';
    imageContainer.className = 'oss-image-tool__image';

    const spin = document.createElement('span');
    spin.classList.add('ant-spin-dot', 'ant-spin-dot-spin');
    for (let index = 0; index < 4; index++) {
      const dot = document.createElement('i');
      dot.className = 'ant-spin-dot-item';
      spin.append(dot);
    }
    const contrainer = document.createElement('div');
    contrainer.className = 'oss-image-tool__image-preloader-contrainer';

    contrainer.append(imagePreloader);
    contrainer.append(spin);
    imageContainer.append(contrainer);
    (this as ImageS).uploader = new Uploader({
      config: config,
      onUpload: (res) => (this as ImageS).onUpload(res),
      onError: (err) => (this as ImageS).uploadingFailed(err),
    });
  }

  save(toolElement: HTMLElement) {
    return super.save(toolElement);
  }
  render() {
    return super.render();
  }

  updateRender(data) {
    (this as ImageS).data = data;
    if ((this as ImageS).ui.nodes.caption) {
      (this as ImageS).ui.nodes.caption.innerHTML = '';
      (this as ImageS).ui.nodes.caption.textContent = (this as ImageS)._data.caption;
    }
  }

  set image(file: { source: string }) {
    // if file not change, don't update image.
    if (isEqual(file, (this as ImageS)._data.file)) return;
    (this as ImageS)._data.file = file || {};
    if (file.source) {
      const _source = file.source.split(':');
      if ((this as ImageS).ui.nodes.imageEl)
        (this as ImageS).ui.nodes.imageContainer.removeChild((this as ImageS).ui.nodes.imageEl);
      switch (_source[0]) {
        case 'url':
          (this as ImageS).ui.fillImage(_source[1]);
          break;
        case 'oss':
          getOssClient().then((oss) => {
            const url = oss.signatureUrl(_source[1], { expires: 3600 });
            (this as ImageS).ui.fillImage(url);
          });
          break;
        default:
          break;
      }
    }
  }
}
