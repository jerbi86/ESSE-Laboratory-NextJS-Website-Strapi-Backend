import { getTranslation } from './utils/getTranslation';
import { PLUGIN_ID } from './pluginId';
import { Initializer } from './components/Initializer';
import { PluginIcon } from './components/PluginIcon';

export default {
  register(app: any) {
    // (A) Keep the menu link (optional UI for your plugin page)
    app.addMenuLink({
      to: `plugins/${PLUGIN_ID}`,
      icon: PluginIcon,
      intlLabel: {
        id: `${PLUGIN_ID}.plugin.name`,
        defaultMessage: PLUGIN_ID,
      },
      Component: async () => {
        const { App } = await import('./pages/App');
        return App;
      },
    });

    // (B) Keep the plugin registration
    app.registerPlugin({
      id: PLUGIN_ID,
      initializer: Initializer,
      isReady: false,
      name: PLUGIN_ID,
    });

    // (C) ADD: register the custom field
    app.customFields.register({
      name: 'flex-date',
      pluginId: PLUGIN_ID,
      type: 'string',
      intlLabel: { id: 'flex-date.label', defaultMessage: 'Flexible Date' },
      intlDescription: { id: 'flex-date.desc', defaultMessage: 'YYYY / YYYY-MM / YYYY-MM-DD (optionally ranges)' },

      options: {
        base: [
          {
            sectionTitle: { id: 'flex-date.options.section.general', defaultMessage: 'General' },
            items: [
              {
                name: 'options.allowRange',
                type: 'checkbox',
                defaultValue: false,
                intlLabel: { id: 'flex-date.options.allowRange.label', defaultMessage: 'Allow date range' },
                description: {
                  id: 'flex-date.options.allowRange.desc',
                  defaultMessage: 'Let editors switch between Single and Range (start..end).',
                },
              },
              {
                name: 'options.uiRequired',
                type: 'checkbox',
                defaultValue: false,
                intlLabel: { id: 'flex-date.options.required.label', defaultMessage: 'Required (UI)' },
                description: {
                  id: 'flex-date.options.required.desc',
                  defaultMessage: 'Mark field as required in the form. For backend enforcement, use Content-Type → Required.',
                },
              },
            ],
          },
        ],
      },

      components: {
        Input: async () =>
            import('./components/MonthYearInput').then((m) => ({ default: m.default })),
      },
    });


  },

  async registerTrads({ locales }: { locales: string[] }) {
    return Promise.all(
        locales.map(async (locale) => {
          try {
            const { default: data } = await import(`./translations/${locale}.json`);
            return { data, locale };
          } catch {
            return { data: {}, locale };
          }
        })
    );
  },
};
