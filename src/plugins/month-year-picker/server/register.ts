export default ({ strapi }) => {
    strapi.customFields.register({
        name: 'flex-date',
        plugin: 'flex-date',   // MUST equal pluginId above
        type: 'string',
    });
};
