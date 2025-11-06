"use strict";
const react = require("react");
const jsxRuntime = require("react/jsx-runtime");
const icons = require("@strapi/icons");
const __variableDynamicImportRuntimeHelper = (glob, path, segs) => {
  const v = glob[path];
  if (v) {
    return typeof v === "function" ? v() : Promise.resolve(v);
  }
  return new Promise((_, reject) => {
    (typeof queueMicrotask === "function" ? queueMicrotask : setTimeout)(
      reject.bind(
        null,
        new Error(
          "Unknown variable dynamic import: " + path + (path.split("/").length !== segs ? ". Note that variables only represent file names one level deep." : "")
        )
      )
    );
  });
};
const pluginId = "flex-date";
const Initializer = ({ setPlugin }) => {
  const ref = react.useRef(setPlugin);
  react.useEffect(() => {
    ref.current(pluginId);
  }, []);
  return null;
};
const PluginIcon = () => /* @__PURE__ */ jsxRuntime.jsx(icons.PuzzlePiece, {});
const index = {
  register(app) {
    app.addMenuLink({
      to: `plugins/${pluginId}`,
      icon: PluginIcon,
      intlLabel: {
        id: `${pluginId}.plugin.name`,
        defaultMessage: pluginId
      },
      Component: async () => {
        const { App } = await Promise.resolve().then(() => require("./App-D4VyuXwD.js"));
        return App;
      }
    });
    app.registerPlugin({
      id: pluginId,
      initializer: Initializer,
      isReady: false,
      name: pluginId
    });
    app.customFields.register({
      name: "flex-date",
      pluginId,
      type: "string",
      intlLabel: { id: "flex-date.label", defaultMessage: "Flexible Date" },
      intlDescription: { id: "flex-date.desc", defaultMessage: "YYYY / YYYY-MM / YYYY-MM-DD (optionally ranges)" },
      options: {
        base: [
          {
            sectionTitle: { id: "flex-date.options.section.general", defaultMessage: "General" },
            items: [
              {
                name: "options.allowRange",
                type: "checkbox",
                defaultValue: false,
                intlLabel: { id: "flex-date.options.allowRange.label", defaultMessage: "Allow date range" },
                description: {
                  id: "flex-date.options.allowRange.desc",
                  defaultMessage: "Let editors switch between Single and Range (start..end)."
                }
              },
              {
                name: "options.uiRequired",
                type: "checkbox",
                defaultValue: false,
                intlLabel: { id: "flex-date.options.required.label", defaultMessage: "Required (UI)" },
                description: {
                  id: "flex-date.options.required.desc",
                  defaultMessage: "Mark field as required in the form. For backend enforcement, use Content-Type → Required."
                }
              }
            ]
          }
        ]
      },
      components: {
        Input: async () => Promise.resolve().then(() => require("./MonthYearInput-B5CzsCPF.js")).then((m) => ({ default: m.default }))
      }
    });
  },
  async registerTrads({ locales }) {
    return Promise.all(
      locales.map(async (locale) => {
        try {
          const { default: data } = await __variableDynamicImportRuntimeHelper(/* @__PURE__ */ Object.assign({ "./translations/en.json": () => Promise.resolve().then(() => require("./en-B4KWt_jN.js")) }), `./translations/${locale}.json`, 3);
          return { data, locale };
        } catch {
          return { data: {}, locale };
        }
      })
    );
  }
};
exports.index = index;
exports.pluginId = pluginId;
