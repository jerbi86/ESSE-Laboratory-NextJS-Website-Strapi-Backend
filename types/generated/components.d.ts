import type { Schema, Struct } from '@strapi/strapi';

export interface GlobalFooter extends Struct.ComponentSchema {
  collectionName: 'components_global_footers';
  info: {
    displayName: 'Footer';
  };
  attributes: {
    built_with: Schema.Attribute.String;
    copyright: Schema.Attribute.String;
    description: Schema.Attribute.String;
    designed_developed_by: Schema.Attribute.String;
    internal_links: Schema.Attribute.Component<'shared.link', true>;
    logo: Schema.Attribute.Relation<'oneToOne', 'api::logo.logo'>;
    social_media_links: Schema.Attribute.Component<'shared.link', true>;
  };
}

export interface GlobalNavbar extends Struct.ComponentSchema {
  collectionName: 'components_global_navbars';
  info: {
    displayName: 'navbar';
  };
  attributes: {
    left_navbar_items: Schema.Attribute.Component<'shared.link', true>;
    logo: Schema.Attribute.Relation<'oneToOne', 'api::logo.logo'>;
    right_navbar_items: Schema.Attribute.Component<'shared.link', true>;
  };
}

export interface PartnersPartnerField extends Struct.ComponentSchema {
  collectionName: 'components_partners_partner_fields';
  info: {
    displayName: 'Partner_field';
  };
  attributes: {
    link: Schema.Attribute.String;
    logo: Schema.Attribute.Relation<'oneToOne', 'api::logo.logo'>;
  };
}

export interface PublicationsAttachements extends Struct.ComponentSchema {
  collectionName: 'components_publications_attachements';
  info: {
    displayName: 'Attachements';
  };
  attributes: {
    associatedDoi: Schema.Attribute.String;
    associatedPDF: Schema.Attribute.Media<'files'>;
    associatedScholar: Schema.Attribute.String;
    associatedURL: Schema.Attribute.String;
  };
}

export interface PublicationsPublisher extends Struct.ComponentSchema {
  collectionName: 'components_publications_publishers';
  info: {
    displayName: 'Publisher';
  };
  attributes: {
    additionalInformation: Schema.Attribute.Text;
    date: Schema.Attribute.String &
      Schema.Attribute.CustomField<'plugin::flex-date.flex-date'>;
    name: Schema.Attribute.String;
    volume: Schema.Attribute.String;
  };
}

export interface SharedLink extends Struct.ComponentSchema {
  collectionName: 'components_shared_links';
  info: {
    displayName: 'Link';
  };
  attributes: {
    target: Schema.Attribute.Enumeration<
      ['_blank', '_self', '_parent', '_top']
    >;
    text: Schema.Attribute.String & Schema.Attribute.Required;
    URL: Schema.Attribute.String & Schema.Attribute.Required;
  };
}

export interface SharedSeo extends Struct.ComponentSchema {
  collectionName: 'components_shared_seos';
  info: {
    description: '';
    displayName: 'Seo';
  };
  attributes: {
    canonicalURL: Schema.Attribute.String;
    keywords: Schema.Attribute.Text;
    metaDescription: Schema.Attribute.String &
      Schema.Attribute.Required &
      Schema.Attribute.SetMinMaxLength<{
        minLength: 50;
      }>;
    metaImage: Schema.Attribute.Media<'images' | 'files'>;
    metaRobots: Schema.Attribute.String;
    metaTitle: Schema.Attribute.String & Schema.Attribute.Required;
    metaViewport: Schema.Attribute.String;
    structuredData: Schema.Attribute.JSON;
  };
}

export interface YoutubeVideoUrl extends Struct.ComponentSchema {
  collectionName: 'components_youtube_video_urls';
  info: {
    displayName: 'video_url';
    icon: 'television';
  };
  attributes: {
    url: Schema.Attribute.String;
  };
}

declare module '@strapi/strapi' {
  export module Public {
    export interface ComponentSchemas {
      'global.footer': GlobalFooter;
      'global.navbar': GlobalNavbar;
      'partners.partner-field': PartnersPartnerField;
      'publications.attachements': PublicationsAttachements;
      'publications.publisher': PublicationsPublisher;
      'shared.link': SharedLink;
      'shared.seo': SharedSeo;
      'youtube.video-url': YoutubeVideoUrl;
    }
  }
}
