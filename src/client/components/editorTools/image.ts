import ImageS from '@editorjs/image';
import moment from 'moment';
import OSS from 'ali-oss';
import { selectFiles } from '@utils/utils';

class Uploader {
  config: any;
  onUpload: any;
  onError: any;
  ossClient: OSS;

  constructor({ config, onUpload, onError }) {
    this.config = config;
    this.onUpload = onUpload;
    this.onError = onError;
    this.ossClient = config.uploader;
  }

  async ossUpload(file) {
    const objectName = moment().format('YYYYMMDDhhmmss');
    const res = await this.ossClient.put(objectName, file);
    console.log(res);
    return {
      success: 1,
      file: {
        ossObject: objectName,
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

  uploadByUrl(url) {
    const upload = new Promise(function (resolve, reject) {
      resolve({
        success: 1,
        file: {
          url: url,
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

  uploadByFile(file, { onPreview }) {
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
  }

  set image(file: { url?: string; ossObject?: string }) {
    (this as ImageS)._data.file = file || {};
    if (file) {
      if (file.url) {
        (this as ImageS).ui.fillImage(file.url);
      } else if (file.ossObject) {
        const url = (this as ImageS).config.uploader.signatureUrl(file.ossObject, {
          expires: 3600,
        });
        (this as ImageS).ui.fillImage(url);
      }
    }
  }

  removed() {
    // const ossObject = (this as ImageS)._data.file?.ossObject;
    // console.log((this as ImageS)._data);
    // if (ossObject) {
    //   this.ossClient
    //     .delete(ossObject)
    //     .then((res) => {
    //       console.log(res);
    //     })
    //     .catch((err) => {
    //       console.log(err);
    //     });
    // }
  }
}
