import "@pqina/pintura/pintura.css";

// Import the editor functionality
import {
  // Import the default image reader and writer
  createDefaultImageReader,
  createDefaultImageWriter,
  createDefaultImageScrambler,

  // The method used to register the plugins
  setPlugins,

  // The plugins we want to use
  plugin_crop,
  plugin_finetune,
  plugin_annotate,
  plugin_frame,
  plugin_decorate,
  plugin_filter,
  plugin_fill,
  plugin_sticker,
  plugin_redact,
  plugin_retouch,
  plugin_resize,

  // The user interface and plugin locale objects
  locale_en_gb,
  plugin_crop_locale_en_gb,
  plugin_finetune_locale_en_gb,
  plugin_annotate_locale_en_gb,
  plugin_frame_locale_en_gb,
  plugin_decorate_locale_en_gb,
  plugin_filter_locale_en_gb,
  plugin_fill_locale_en_gb,
  plugin_sticker_locale_en_gb,
  plugin_redact_locale_en_gb,
  plugin_retouch_locale_en_gb,
  plugin_resize_locale_en_gb,

  // Because we use the annotate plugin we also need
  // to import the markup editor locale and the shape preprocessor
  markup_editor_locale_en_gb,
  createDefaultShapePreprocessor,

  // Import the default configuration for the markup editor and finetune plugins
  markup_editor_defaults,
  plugin_finetune_defaults,
  plugin_frame_defaults,
  plugin_filter_defaults,
  createDefaultColorOptions,
  colorStringToColorArray,
  processDefaultImage,
  createNode,
  createDefaultImageOrienter,
  findNode,
  appendNode,
  createMarkupEditorToolStyles,
  createMarkupEditorSelectionToolStyles,
  createMarkupEditorShapeStyleControls,
  createMarkupEditorSelectionTools,
  getShapeById,
  updateShapeById,
  createRetouchShape,
  getEditorDefaults,
  selectionToMask,
} from "@pqina/pintura";

// Import the editor component from `react-pintura`
import { PinturaEditor } from "@pqina/react-pintura";

// custom functions needed for custom retouch functionality
import {
  appendRetouchInpaintButtons,
  appendRetouchFeatherSlider,
  appendRetouchInpaintResultNavigation,
  requestInpaintPrompt,
  attachCleanAction,
  createInpaintShape,
  attachInpaintAction,
} from "./retouch.js";
import { useRef } from "react";

// This registers the plugins with Pintura Image Editor
setPlugins(
  plugin_crop,
  plugin_finetune,
  plugin_annotate,
  plugin_frame,
  plugin_decorate,
  plugin_filter,
  plugin_fill,
  plugin_sticker,
  plugin_redact,
  plugin_retouch,
  plugin_resize
);

// Create our editor configuration
const editorConfig = {
  // This will read the image data (required)
  imageReader: createDefaultImageReader(),

  // This is needed on older browsers to correctly orient JPEGs
  imageOrienter: createDefaultImageOrienter(),

  // This will write the output image
  imageWriter: createDefaultImageWriter(),

  // This handles complex shapes like arrows / frames
  shapePreprocessor: createDefaultShapePreprocessor(),
  /* imageWriter: {
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
  }, */

  // add retouch tools
  retouchToolShapes: createMarkupEditorToolStyles({
    // add redact mode selection styles
    ...createMarkupEditorSelectionToolStyles("redact"),

    // add inpaint mode selection styles
    ...createMarkupEditorSelectionToolStyles("inpaint"),

    // add clean mode selection styles
    ...createMarkupEditorSelectionToolStyles("clean", {
      // which tools to enable
      tools: ["brush"],
    }),
  }),

  // add retouch tool groups (groups are optional)
  retouchTools: [
    // Redact group
    ["Redact", createMarkupEditorSelectionTools("redact")],

    // Inpaint group
    [
      "Inpaint",

      // Enable all tools
      createMarkupEditorSelectionTools("inpaint"),
    ],

    // Clean group
    [
      "Clean",

      // only show brush tool
      createMarkupEditorSelectionTools("clean", {
        tools: ["brush"],
      }),
    ],
  ],

  // enable defaults tools for retouch panel
  retouchShapeControls: createMarkupEditorShapeStyleControls(),

  // The markup editor default options, tools, shape style controls
  ...markup_editor_defaults,

  // The finetune util controls
  ...plugin_finetune_defaults,

  // The filter controls
  ...plugin_filter_defaults,

  //The frame controls
  ...plugin_frame_defaults,

  // This will set a square crop aspect ratio
  //imageCropAspectRatio: 1,

  // The icons and labels to use in the user interface (required)
  locale: {
    ...locale_en_gb,
    ...plugin_crop_locale_en_gb,
    ...plugin_finetune_locale_en_gb,
    ...plugin_annotate_locale_en_gb,
    ...markup_editor_locale_en_gb,
    ...plugin_frame_locale_en_gb,
    ...plugin_decorate_locale_en_gb,
    ...plugin_filter_locale_en_gb,
    ...plugin_fill_locale_en_gb,
    ...plugin_sticker_locale_en_gb,
    ...plugin_redact_locale_en_gb,
    ...plugin_retouch_locale_en_gb,
    ...plugin_resize_locale_en_gb,
    retouchLabel: "Magic",
  },
};

function ImageEditor() {
  const editorRef = useRef(null);
  //For add to Shadow button
  const willRenderShapeControls = (controls, selectedShapeId) => {
    console.log("willRenderShapeControls", selectedShapeId);
    console.log("controls:", controls);
    const buttonGroup = findNode("beta", controls);
    const shadowButton = createNode("Button", "shadow", {
      hideLabel: true,
      label: "Shadow",
      icon: '<g stroke="currentColor" stroke-width=".125em"><path stroke="currentColor" fill="currentColor" d="M0 0h24v24H0z"/><path d="M12 21a9 9 0 1 1 0 -18a9 9 0 0 1 0 18z" /><path / d="M18 12a6 6 0 0 1 -6 6" /></g>',
      onclick: () => console.log("shadow button clicked"),
    });
    // Manipulate or add controls here
    appendNode(shadowButton, buttonGroup);
    //controls[1][3].push(shadowButton);

    return controls;
  };

  const retouchWillRenderShapeControls = (controls, activeShapeId) => {
    // no controls to render
    if (!activeShapeId) return controls;

    // get active shape
    const activeShape = getShapeById(
      editorRef.current.editor.imageManipulation,
      activeShapeId
    );

    // Add inpaint buttons
    appendRetouchInpaintButtons(controls, {
      ...editorRef.current.editor,
      activeShape,
      // Update prompt
      onupdate: ({ shapePrompt }) =>
        requestInpaintPrompt(editorRef, {
          text: shapePrompt,
          onconfirm: (text) => {
            createInpaintShape(
              editorRef.current.editor,
              createRetouchShape,
              text,
              //@ts-ignore
              activeShape.inpaint.selection,
              activeShape
            );
          },
          onclose: () => {
            // clear selection
            editorRef.current.editor.imageSelection = [];
          },
          onerror: (err) => {
            // handle error
          },
        }),
      // Generate more results
      ongenerate: ({ shapePrompt, shapeSelection }) => {
        // clear any selection made
        editorRef.current.editor.imageSelection = [];

        // paint new results based on current data
        createInpaintShape(
          editorRef.current.editor,
          createRetouchShape,
          shapePrompt,
          shapeSelection,
          activeShape
        );
      },
    });
    // Add the feather control
    appendRetouchFeatherSlider(controls, {
      // set current value
      value: activeShape.feather,

      // receive updated value and update the shape
      onchange: ({ value }) => {
        editorRef.current.editor.imageManipulation = updateShapeById(
          // shape list

          editorRef.current.editor.imageManipulation,

          // shape to update
          activeShapeId,

          // updater function
          (shape) => ({
            ...shape,
            feather: value,
          })
        );
      },
    });
    // add results nav
    appendRetouchInpaintResultNavigation(controls, {
      activeShape,
      onupdate: ({ shapeBackgroundImage }) => {
        editorRef.current.editor.imageManipulation = updateShapeById(
          // shape list

          editorRef.current.editor.imageManipulation,

          // shape to update
          activeShapeId,

          // updater function
          (shape) => ({
            ...shape,
            backgroundImage: shapeBackgroundImage,
          })
        );
      },
    });
    // done adding controls
    return controls;
  };

  //redact feature inside of magic

  const editorDefaults = getEditorDefaults({
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
  });

  let imageScalar;
  let imageScaled;

  const redact = async (selectionItem) => {
    // Create mask shape
    const {
      rect: maskRect,
      //@ts-ignore
      shape: maskShape,
      canvas: maskCanvas,
    } = await selectionToMask(
      [selectionItem],
      editorRef.current.editor.imageSize,
      editorRef.current.editor.imageState,
      {
        // gets an additional band of pixels around the selection
        padding: 8,

        // returns a canvas
        format: "canvas",

        // uses alpha for transparent parts
        foregroundColor: [0, 0, 0, 0],
      }
    );

    // Show mask canvas, for debugging purposes

    document.getElementById("maskCanvas")?.remove();
    maskCanvas.id = "maskCanvas";
    maskCanvas.style.cssText = `margin:10px;border:1px solid silver;background-color:#ccc;background-image:url("data:image/svg+xml,%3Csvg width='8' height='8' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%23E5E5E5'%3E%3Cpath d='M0 0h4v4H0zM4 4h4v4H4z'/%3E%3C/g%3E%3C/svg%3E");height:20vh;`;
    document.body.append(maskCanvas);

    // Scrambled scaled image data
    const { dest: scrambledCanvas } = await processDefaultImage(imageScaled, {
      imageCropLimitToImage: false,
      imageWriter: {
        format: "canvas",
        mimeType: "image/png",
      },

      // copy transforms
      imageFlipX: editorRef.current.editor.imageFlipX,
      imageFlipY: editorRef.current.editor.imageFlipY,
      imageRotation: editorRef.current.editor.imageRotation,

      // crop area of mask shape
      imageCrop: {
        x: maskRect.x * imageScalar,
        y: maskRect.y * imageScalar,
        width: maskRect.width * imageScalar,
        height: maskRect.height * imageScalar,
      },

      // redact area of mask shape
      imageRedaction: [
        {
          ...maskShape,
          x: maskShape.x * imageScalar,
          y: maskShape.y * imageScalar,
          width: maskShape.width * imageScalar,
          height: maskShape.height * imageScalar,
        },
      ],

      // customize look of redaction
      imageScrambler: createDefaultImageScrambler({
        // higher is more pixels
        dataSizeScalar: 1,

        // higher is more randomness in pixel offset
        scrambleAmount: 1,

        // higher is more blurry look instead of pixely look
        blurAmount: 5,
      }),

      // uncomment to add red overlay, for debugging purposes
      /*
                imageAnnotation: [
                    {
                        x: 0,
                        y: 0,
                        width: '100%',
                        height: '100%',
                        backgroundColor: [1, 0, 0, 0.25],
                    },
                ],
                */
    });

    // Show mask canvas, for debugging purposes

    document.getElementById("scrambledCanvas")?.remove();
    //@ts-ignore
    scrambledCanvas.id = "scrambledCanvas";
    //@ts-ignore
    scrambledCanvas.style.cssText = `margin:10px;border:1px solid silver;height:20vh;`;
    //@ts-ignore
    document.body.append(scrambledCanvas);

    // Redacted canvas
    const backgroundImage = document.createElement("canvas");
    backgroundImage.width = maskRect.width * imageScalar;
    backgroundImage.height = maskRect.height * imageScalar;
    const ctx = backgroundImage.getContext("2d");
    ctx.drawImage(
      //@ts-ignore
      scrambledCanvas,
      0,
      0,
      backgroundImage.width,
      backgroundImage.height
    );
    ctx.globalCompositeOperation = "destination-out";
    ctx.drawImage(
      maskCanvas,
      0,
      0,
      backgroundImage.width,
      backgroundImage.height
    );

    editorRef.current.editor.imageManipulation = [
      ...editorRef.current.editor.imageManipulation,
      {
        ...maskShape,

        // Use redacted canvas as background
        backgroundImage,

        // Change selection style
        selectionStyle: "hook",

        // Can't manipulate shape
        disableStyle: true,
        disableFlip: true,
        disableReorder: true,
        disableManipulate: true,
      },
    ];
  };

  //onSelectionup

  /* editor.on('selectionup', async (selectionItems) => {
        const lastSelectionItem =
            selectionItems[selectionItems.length - 1];

        // is not a "inpaint" selection action
        if (
            !lastSelectionItem ||
            lastSelectionItem.action !== 'redact'
        )
            return;

        // do something
        redact(lastSelectionItem);

        // clear image selection
        editorRef.current.editor.imageSelection = [];
    }); */

  // Create scaled down version of source image for faster redacting

  return (
    <div className="App" style={{ height: "600px" }}>
      {/* @ts-ignore */}
      <PinturaEditor
        ref={editorRef}
        {...editorDefaults}
        {...editorConfig}
        willRenderShapeControls={willRenderShapeControls}
        onSelectcontrol={(e) => {
          attachInpaintAction(editorRef.current.editor, createRetouchShape);
          attachCleanAction(editorRef.current.editor, createRetouchShape);
        }}
        onSelectionup={(selectionItems: any) => {
          console.log("selectionup:", selectionItems.length);
          const lastSelectionItem = selectionItems[selectionItems.length - 1];
          if (!lastSelectionItem || lastSelectionItem.action !== "redact")
            return;
          redact(lastSelectionItem);
          console.log("lastSelectionItem:", lastSelectionItem);

          // clear image selection
          editorRef.current.editor.imageSelection = [];
        }}
        onLoad={async ({ size }: any) => {
          console.log("onload:", size);

          const MAX_IMAGE_SIZE = 512;

          // scale down image file for scrambling purposes
          const { dest } = await processDefaultImage(
            editorRef.current.editor.imageFile,
            {
              imageWriter: {
                targetSize: {
                  width: MAX_IMAGE_SIZE,
                },
              },
            }
          );
          imageScalar = Math.min(1, MAX_IMAGE_SIZE / size.width);
          imageScaled = dest;
        }}
        src="image.jpeg"
        onProcess={(res: any) => {
          console.log("Result", res);
          document
            .querySelector(".result")
            .setAttribute("src", URL.createObjectURL(res.dest));
        }}
        retouchWillRenderShapeControls={retouchWillRenderShapeControls}
        onSelectshape={(a) => {
          console.log("selectShape:", a);
        }}
        // set up

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
        fillOptions={[
          // Transparent default value
          [0, 0, 0, 0],

          // Red
          [1, 0, 0, 1],

          // Using the default markup editor colors
          ...Object.values(createDefaultColorOptions()),

          // Transparent Purple as CSS color using colorStringToColorArray
          colorStringToColorArray("rgba(0, 0, 255, .5)"),

          // Using a PNG as background image
          /* "mesh-gradient-01.png", */
        ]}
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
      ></PinturaEditor>
    </div>
  );
}

export default ImageEditor;
