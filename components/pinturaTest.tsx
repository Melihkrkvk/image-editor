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
} from "@pqina/pintura";

// Import the editor component from `react-pintura`
import { PinturaEditor } from "@pqina/react-pintura";

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
  plugin_redact
);

// Create our editor configuration
const editorConfig = {
  // This will read the image data (required)
  imageReader: createDefaultImageReader(),

  // This will write the output image
  //imageWriter: createDefaultImageWriter(),
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

  // The markup editor default options, tools, shape style controls
  ...markup_editor_defaults,

  // The finetune util controls
  ...plugin_finetune_defaults,

  // The filter controls
  ...plugin_filter_defaults,

  //The frame controls
  ...plugin_frame_defaults,

  // This handles complex shapes like arrows / frames
  shapePreprocessor: createDefaultShapePreprocessor(),

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
  },
};

function ImageEditor() {
  return (
    <div className="App" style={{ height: "600px" }}>
      <PinturaEditor
        {...editorConfig}
        src="image.jpeg"
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
      ></PinturaEditor>
    </div>
  );
}

export default ImageEditor;
