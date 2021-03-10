import React, { useEffect, useRef, useState } from "react";
import { useModel, useRequest } from "umi";
import { Dropdown, Menu, Popconfirm } from "antd";
import FileCard from "./FileCard";
import { getOssClient } from "../../layout/layout.service";
import {
  removeSpaceAsset,
  removeTaskAsset,
  getSpaceAssets,
  getTaskAssets,
} from "../../task/task.service";
import { TaskMoreDetailRes } from "@dtos/task.dto";
import FsLightbox from "@components/fslightbox";
import VGallery from "@components/VGallery";
import { changeAsset } from "../asset.service";
import { AssetListRes, AssetRes, GetAssetsDTO } from "@dtos/asset.dto";

const AssetGallery: React.FC<{
  task?: TaskMoreDetailRes;
  headers?: any[];
  update?: boolean;
}> = ({ task, headers = [], update = false }) => {
  const { initialState, setInitialState } = useModel("@@initialState");
  const { currentSpace } = initialState;
  const [assetList, setAssetList] = useState<AssetRes[]>([]);
  const [lightBoxSlide, setLightBoxSlide] = useState(0);
  const [lightBoxToggle, setLightBoxToggle] = useState(false);
  const [lightBoxUpdate, setLightBoxUpdate] = useState(0);
  const [thisUpdate, setThisUpdate] = useState(false);
  const [childUpdate, setChildUpdate] = useState(false);
  const fetchCountRef = useRef(0);
  const [editingAssetId, setEditingAssetId] = useState(undefined);

  const isFull =
    currentSpace?.userAccess === "full" || task?.userAccess === "full";
  const isEdit =
    isFull ||
    (task ? task.userAccess === "edit" : currentSpace.userAccess === "edit");

  const removeAsset = async (assetId: number): Promise<AssetListRes> => {
    if (task) {
      return removeTaskAsset(task.id, assetId);
    } else {
      return removeSpaceAsset(currentSpace.id, assetId);
    }
  };

  const removeAssetReq = useRequest(removeAsset, {
    manual: true,
    onSuccess: (res) => {
      setThisUpdate(!thisUpdate);
    },
  });

  const handleDownload = async (asset: AssetRes) => {
    const oss = await getOssClient();
    const _source = asset.source.split(":");
    const filename = asset.format
      ? `${asset.name}.${asset.format}`
      : asset.name;
    const source =
      _source[0] === "oss"
        ? oss.signatureUrl(_source[1], {
            expires: 3600,
            response: {
              "content-disposition": `attachment; filename=${filename}`,
            },
          })
        : _source[1];
    window.open(source);
  };

  const handleRename = (asset: AssetRes) => {
    setEditingAssetId(asset.id);
  };

  const handleDelete = (asset: AssetRes) => {
    removeAssetReq.run(asset.id);
  };

  const menu = (asset: AssetRes) => {
    return (
      <Menu>
        <Menu.Item key="1" onClick={() => handleDownload(asset)}>
          下载
        </Menu.Item>
        {isEdit && [
          <Menu.Item key="2" onClick={() => handleRename(asset)}>
            重命名
          </Menu.Item>,
          <Menu.Item key="3">
            <Popconfirm
              title="你确定要删除该文件么？"
              onConfirm={() => handleDelete(asset)}
              okText="确认"
              cancelText="取消"
            >
              <a href="#">删除</a>
            </Popconfirm>
          </Menu.Item>,
        ]}
      </Menu>
    );
  };

  const changeAssetReq = useRequest(changeAsset, {
    manual: true,
    onSuccess: (res) => {
      setThisUpdate(!thisUpdate);
      setEditingAssetId(undefined);
    },
  });

  const getAssets = async (body: GetAssetsDTO) => {
    const params = {};
    if (headers) {
      for (const header of headers) {
        if (header.filter) {
          switch (header.title) {
            case "createAt":
              params["uploadBefore"] = header.filter;
              break;

            default:
              params[header.title] = header.filter;
              break;
          }
        }
      }
    }
    return task
      ? await getTaskAssets(task.id, { ...params, ...body })
      : await getSpaceAssets(currentSpace.id, {
          ...params,
          ...body,
          isRoot: true,
        });
  };

  useEffect(() => {
    setLightBoxUpdate(lightBoxUpdate + 1);
    setChildUpdate(!childUpdate);
  }, [update, thisUpdate]);

  const beforeItemRender = async (item) => {
    const oss = await getOssClient();
    if (item.preview) {
      const _preview = item.preview.split(":");

      item["_source"] =
        _preview[0] === "oss"
          ? oss.signatureUrl(_preview[1], { expires: 3600 })
          : _preview[1];

      item["_preview"] =
        _preview[0] === "oss"
          ? oss.signatureUrl(_preview[1], {
              expires: 3600,
              process: "image/resize,w_500,h_150",
            })
          : _preview[1];
    } else {
      item["_source"] = (
        <div style={{ background: "white", width: "200px", height: "200px" }}>
          <h3 style={{ lineHeight: "200px", textAlign: "center" }}>
            no preview
          </h3>
        </div>
      );
    }

    const _source = item.source.split(":");
    item["__source"] =
      _source[0] === "oss"
        ? oss.signatureUrl(_source[1], { expires: 3600 })
        : _source[1];

    if (item.type?.split("/")[0] === "image" && item.preview) {
      item["_type"] = "image";
    } else if (item.type?.split("/")[0] === "video") {
      item["_type"] = "video";
    } else {
      item["_type"] = "null";
    }
    return item;
  };
  const itemRender = (item) => (
    <Dropdown overlay={() => menu(item)} trigger={["contextMenu"]}>
      <div>
        <FileCard
          name={item.name}
          format={item.format}
          preview={item["_preview"]}
          isEditing={editingAssetId === item.id}
          onPressEnter={(v) =>
            changeAssetReq.run(currentSpace.id, item.id, { name: v })
          }
          onTapPreview={() => {
            const i = assetList.map((asset) => asset.id).indexOf(item.id);
            setLightBoxSlide(i);
            setLightBoxToggle(!lightBoxToggle);
          }}
        />
      </div>
    </Dropdown>
  );
  return (
    <>
      <VGallery
        request={getAssets}
        update={childUpdate}
        columnCount={6}
        beforeItemRender={beforeItemRender}
        itemRender={itemRender}
      />
      <FsLightbox
        toggler={lightBoxToggle}
        sourceIndex={lightBoxSlide}
        key={lightBoxUpdate}
        // disableThumbs={true}
        sources={assetList.filter((a) => !!a).map((asset) => asset["_source"])}
        types={assetList.filter((a) => !!a).map((asset) => asset["_type"])}
      />
    </>
  );
};
export default AssetGallery;
