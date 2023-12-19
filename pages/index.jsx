/* eslint-disable no-undef */
import { useRef, useState } from "react";

import { pintura } from "@pqina/pintura/pintura.module.css";

// react-pintura
import {
  PinturaEditor,
  PinturaEditorModal,
  PinturaEditorOverlay,
} from "@pqina/react-pintura";

// pintura
import {
  // editor
  locale_en_gb,
  createDefaultImageReader,
  createDefaultImageWriter,
  createDefaultShapePreprocessor,
  createNode,
  appendNode,
  findNode,

  // plugins
  setPlugins,
  plugin_crop,
  plugin_crop_locale_en_gb,
  plugin_finetune,
  plugin_finetune_locale_en_gb,
  plugin_finetune_defaults,
  plugin_filter,
  plugin_filter_locale_en_gb,
  plugin_filter_defaults,
  plugin_annotate,
  plugin_annotate_locale_en_gb,
  markup_editor_defaults,
  markup_editor_locale_en_gb,
  plugin_sticker,
  plugin_sticker_locale_en_gb,
  plugin_redact,
  plugin_redact_locale_en_gb,
} from "@pqina/pintura";

setPlugins(
  plugin_crop,
  plugin_finetune,
  plugin_filter,
  plugin_annotate,
  plugin_sticker,
  plugin_redact
);

const editorDefaults = {
  imageReader: createDefaultImageReader(),
  imageWriter: {
    // apply redaction to source image
    preprocessImageSource: async (src, options, onprogress, state) => {
      const { dest } = await processDefaultImage(src, {
        imageRedaction: [...state.redaction],
      });
      return dest;
    },

    // remove redaction from state
    preprocessImageState: (imageState) => {
      imageState.redaction = [];
      return imageState;
    },
  },
  shapePreprocessor: createDefaultShapePreprocessor(),
  ...plugin_finetune_defaults,
  ...plugin_filter_defaults,
  ...markup_editor_defaults,
  ...plugin_sticker,

  locale: {
    ...locale_en_gb,
    ...plugin_crop_locale_en_gb,
    ...plugin_finetune_locale_en_gb,
    ...plugin_filter_locale_en_gb,
    ...plugin_annotate_locale_en_gb,
    ...markup_editor_locale_en_gb,
    ...plugin_sticker_locale_en_gb,
    ...plugin_filter_locale_en_gb,
    ...plugin_redact_locale_en_gb,
  },
};

export default function Home() {
  const editorRef = useRef(null);
  // inline
  const [inlineResult, setInlineResult] = useState("");

  // modal
  const [modalVisible, setModalVisible] = useState(false);
  const [modalResult, setModalResult] = useState("");

  // overlay
  const [overlayVisible, setOverlayVisible] = useState(false);
  const [overlayResult, setOverlayResult] = useState({
    imagePreview: "./image.jpeg",
    imageState: undefined,
  });

  const willRenderToolbar = (toolbar) => {
    const buttonGroup = findNode("alpha-set", toolbar);

    const removeBackgroundButton = createNode(
      "Button",
      "remove-background-button",
      {
        label: "Custom Remove Bg",
        onclick: async () => {
          // disable input
          editorRef.current.editor.disabled = true;

          // now loading
          editorRef.current.editor.status = "Uploading data…";

          // post image to background removal service
          const formData = new FormData();
          formData.append(
            "image",
            editorRef.current.editor.imageFile,
            editorRef.current.editor.imageFile.name
          );

          // request removal of background
          const newImage = fetch("remove-the-background", {
            method: "POST",
            body: formData,
          }).then((res) => res.blob());

          // done loading
          editorRef.current.editor.status = undefined;

          // update the image with the newly received transparent image
          editorRef.current.editor.updateImage(newImage);
        },
      }
    );

    // add the button to the toolbar
    appendNode(removeBackgroundButton, buttonGroup);

    // clone the toolbar array when returning to Pintura
    return [...toolbar];
  };

  return (
    <div className="App">
      <h1>Pintura Image Editor</h1>

      <h2>Inline</h2>

      <div style={{ height: "100vh" }}>
        <PinturaEditor
          ref={editorRef}
          {...editorDefaults}
          className={pintura}
          src={"./image.jpeg"}
          willRenderToolbar={willRenderToolbar}
          stickers={[
            [
              // group label
              "Emoji",

              // group stickers
              ["🎉", "😄", "👍", "👎", "🍕"],

              // group properties
              {
                // a group icon
                icon: "<g><!-- SVG here --></g>",

                // hide the group label
                hideLabel: false,
                // disable the group
                disabled: false,
              },
            ],
          ]}
          onLoad={(res) => {
            console.log("load inline image", res);
          }}
          onProcess={({ dest }) => {
            setInlineResult(URL.createObjectURL(dest));
          }}
        />
      </div>

      {!!inlineResult.length && (
        <p>
          <img src={inlineResult} alt="" />
        </p>
      )}

      <h2>Modal</h2>

      <p>
        <button onClick={() => setModalVisible(true)}>Open editor</button>
      </p>
      {modalVisible && (
        <PinturaEditorModal
          {...editorDefaults}
          willRenderToolbar={willRenderToolbar}
          cropSelectPresetOptions={[
            [
              "Crop",
              [
                [undefined, "Custom"],
                [1, "Square"],
                [4 / 3, "Landscape"],
                [3 / 4, "Portrait"],
              ],
            ],
            [
              "Daktilo Components",
              [
                [[180, 180], "Profile Picture"],
                [[1200, 600], "SliderThumbnail Image"],
                [[800, 400], "Timeline Photo"],
              ],
            ],
          ]}
          stickers={[
            [
              // group label
              "Emoji",

              // group stickers
              ["🎉", "😄", "👍", "👎", "🍕"],

              // group properties
              {
                // a group icon
                icon: "<g><!-- SVG here --></g>",

                // hide the group label
                hideLabel: true,

                // disable the group
                disabled: true,
              },
            ],
          ]}
          className={pintura}
          src={"./image.jpeg"}
          onLoad={(res) => console.log("load modal image", res)}
          onHide={() => setModalVisible(false)}
          onProcess={({ dest }) => setModalResult(URL.createObjectURL(dest))}
        />
      )}
      {!!modalResult.length && (
        <p>
          <img src={modalResult} alt="" />
        </p>
      )}

      <h2>Overlay</h2>

      <p>
        {!overlayVisible && (
          <button onClick={() => setOverlayVisible(true)}>Edit image</button>
        )}
        {overlayVisible && (
          <button onClick={() => setOverlayVisible(false)}>Close editor</button>
        )}
      </p>

      {!overlayVisible && (
        <p>
          <img
            width="512"
            height="256"
            src={overlayResult.imagePreview}
            alt=""
          />
        </p>
      )}
      {overlayVisible && (
        <div style={{ width: "512px", height: "256px" }}>
          <PinturaEditorOverlay
            src={"./image.jpeg"}
            {...editorDefaults}
            stickers={[
              [
                // group label
                "Emoji",

                // group stickers
                ["🎉", "😄", "👍", "👎", "🍕"],

                // group properties
                {
                  // a group icon
                  icon: "<g><!-- SVG here --></g>",

                  // hide the group label
                  hideLabel: true,

                  // disable the group
                  disabled: true,
                },
              ],
            ]}
            className={pintura}
            imageState={overlayResult.imageState}
            onLoad={(res) => console.log("load overlay image", res)}
            onProcess={({ dest, imageState }) => {
              setOverlayResult({
                imagePreview: URL.createObjectURL(dest),
                imageState: imageState,
              });
              setOverlayVisible(false);
            }}
          />
        </div>
      )}
    </div>
  );
}
