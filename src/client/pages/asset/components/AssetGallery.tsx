import React, { useEffect, useRef, useState } from "react";
import { useModel, useParams, useRequest } from "umi";
import { Dropdown, Menu } from "antd";
import FileCard from "./FileCard";
import { getOssClient } from "../../layout/layout.service";
import {
  removeSpaceAsset,
  removeTaskAsset,
  getSpaceAssets,
  getTaskAssets,
} from "../../task/task.service";
import {
  AssetListRes,
  AssetRes,
  GetAssetsDTO,
  TaskMoreDetailRes,
} from "@dtos/task.dto";
import FsLightbox from "@components/fslightbox";
import VGallery from "@components/VGallery";
import { changeAsset } from "../asset.service";
import { ViewOption } from "@server/common/common.entity";

const AssetGallery: React.FC<{
  task?: TaskMoreDetailRes;
  option?: ViewOption;
  update?: boolean;
}> = ({ task, option, update = false }) => {
  const { initialState, setInitialState } = useModel("@@initialState");
  const { currentSpace } = initialState;
  const [assetList, setAssetList] = useState<AssetRes[]>([]);
  const [lightBoxSlide, setLightBoxSlide] = useState(0);
  const [lightBoxToggle, setLightBoxToggle] = useState(false);
  const [lightBoxUpdate, setLightBoxUpdate] = useState(0);
  const [dataUpdate, setDataUpdate] = useState(false);
  const [viewUpdate, setViewUpdate] = useState(false);
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
      setDataUpdate(!dataUpdate);
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
          <Menu.Item key="3" onClick={() => handleDelete(asset)}>
            删除
          </Menu.Item>,
        ]}
      </Menu>
    );
  };

  const changeAssetReq = useRequest(changeAsset, {
    manual: true,
    onSuccess: (res) => {
      setDataUpdate(!dataUpdate);
      setEditingAssetId(undefined);
    },
  });

  const getAssets = async (body: GetAssetsDTO) => {
    const params = {};
    if (option) {
      for (const header of option.headers) {
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
  }, [update, dataUpdate]);

  const initAssetsReq = useRequest(getAssets, {
    refreshDeps: [task, update, dataUpdate, option],
    onSuccess: (res, params) => {
      setAssetList(Array(res.total).fill(undefined));
      if (fetchCountRef.current !== 0) {
        setViewUpdate(!viewUpdate);
      }
      fetchCountRef.current++;
    },
  });

  const getAssetsReq = useRequest(getAssets, {
    manual: true,
    onSuccess: async (res, params) => {
      const oss = await getOssClient();
      for (
        let index = params[0].skip;
        index < params[0].skip + params[0].take;
        index++
      ) {
        const asset = res.list[index - params[0].skip];

        if (asset.preview) {
          const _preview = asset.preview.split(":");

          asset["_source"] =
            _preview[0] === "oss"
              ? oss.signatureUrl(_preview[1], { expires: 3600 })
              : _preview[1];

          asset["_preview"] =
            _preview[0] === "oss"
              ? oss.signatureUrl(_preview[1], {
                  expires: 3600,
                  process: "image/resize,w_500,h_150",
                })
              : _preview[1];
        } else {
          asset["_source"] = (
            <div
              style={{ background: "white", width: "200px", height: "200px" }}
            >
              <h3 style={{ lineHeight: "200px", textAlign: "center" }}>
                no preview
              </h3>
            </div>
          );
        }

        const _source = asset.source.split(":");
        asset["__source"] =
          _source[0] === "oss"
            ? oss.signatureUrl(_source[1], { expires: 3600 })
            : _source[1];

        if (asset.type?.split("/")[0] === "image" && asset.preview) {
          asset["_type"] = "image";
        } else if (asset.type?.split("/")[0] === "video") {
          asset["_type"] = "video";
        } else {
          asset["_type"] = "null";
        }
        assetList[index] = asset;
      }
      setAssetList(assetList);
    },
  });

  const loadMoreItems = (startIndex: number, stopIndex: number) => {
    console.log(startIndex);
    console.log(stopIndex);
    return getAssetsReq.run({
      skip: startIndex,
      take: stopIndex - startIndex + 1,
    });
  };

  return (
    <>
      <VGallery
        loading={initAssetsReq.loading}
        update={viewUpdate}
        dataSource={assetList}
        loadMoreItems={loadMoreItems}
        columnCount={6}
        itemRender={(item) => (
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
        )}
      />
      <FsLightbox
        style={{ zIndex: 99999 }}
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
