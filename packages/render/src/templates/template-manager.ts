// Mock types for PostContent and PostSettings
interface PostContent {
  title?: string;
  subtitle?: string;
  content?: string;
  quote?: string;
  author?: string;
  badge?: string;
  description?: string;
  cta?: string;
  stats?: Array<{ label: string; value: string }>;
  features?: string[];
  date?: string;
  location?: string;
  price?: string;
  discount?: string;
  [key: string]: any;
}

interface PostSettings {
  textOverlay?: boolean;
  logoPosition?: string;
  [key: string]: any;
}

// Mock NottuTheme, NottuColors, and NottuFonts
const NottuColors = {
  primary: {
    400: '#60A5FA',
    500: '#3B82F6',
    600: '#2563EB',
    800: '#1E40AF'
  },
  accent: {
    400: '#FB7185',
    500: '#F43F5E'
  },
  dark: {
    900: '#111827',
    950: '#030712'
  },
  gray: {
    300: '#D1D5DB'
  },
  semantic: {
    success: '#10B981'
  }
};

const NottuFonts = {
  families: {
    heading: 'Inter, sans-serif',
    ui: 'Inter, sans-serif',
    body: 'Inter, sans-serif'
  },
  sizes: {
    sm: '14px',
    base: '16px',
    lg: '18px',
    xl: '20px',
    '2xl': '24px',
    '3xl': '30px',
    '4xl': '36px',
    '5xl': '48px'
  },
  weights: {
    medium: 500,
    semibold: 600,
    bold: 700
  }
};

export interface Template {
  id: string;
  name: string;
  description: string;
  category: 'social' | 'business' | 'creative' | 'minimal' | 'announcement';
  tags: string[];
  preview: string; // Base64 or URL to preview image
  defaultSettings: Partial<PostSettings>;
  requiredFields: string[];
  optionalFields: string[];
}

export interface TemplateData {
  title?: string;
  subtitle?: string;
  content?: string;
  quote?: string;
  author?: string;
  badge?: string;
  description?: string;
  cta?: string;
  stats?: Array<{ label: string; value: string }>;
  features?: string[];
  date?: string;
  location?: string;
  price?: string;
  discount?: string;
  [key: string]: any;
}

export class TemplateManager {
  private templates: Map<string, Template> = new Map();

  constructor() {
    this.initializeDefaultTemplates();
  }

  private initializeDefaultTemplates(): void {
    const defaultTemplates: Template[] = [
      {
        id: 'minimal-text',
        name: 'Minimal Text',
        description: 'Clean and simple text-only design',
        category: 'minimal',
        tags: ['text', 'simple', 'clean'],
        preview: '',
        defaultSettings: {
          textOverlay: true,
          logoPosition: 'bottom-right',
        },
        requiredFields: ['title'],
        optionalFields: ['subtitle', 'description'],
      },
      {
        id: 'quote-card',
        name: 'Quote Card',
        description: 'Elegant quote presentation with author attribution',
        category: 'social',
        tags: ['quote', 'inspiration', 'text'],
        preview: '',
        defaultSettings: {
          textOverlay: true,
          logoPosition: 'bottom-center',
        },
        requiredFields: ['quote'],
        optionalFields: ['author', 'subtitle'],
      },
      {
        id: 'announcement',
        name: 'Announcement',
        description: 'Eye-catching announcement with badge and CTA',
        category: 'announcement',
        tags: ['news', 'announcement', 'cta'],
        preview: '',
        defaultSettings: {
          textOverlay: true,
          logoPosition: 'top-left',
        },
        requiredFields: ['title'],
        optionalFields: ['badge', 'description', 'cta'],
      },
      {
        id: 'stats-showcase',
        name: 'Stats Showcase',
        description: 'Display key statistics and metrics',
        category: 'business',
        tags: ['stats', 'metrics', 'data'],
        preview: '',
        defaultSettings: {
          textOverlay: true,
          logoPosition: 'top-right',
        },
        requiredFields: ['title', 'stats'],
        optionalFields: ['subtitle', 'description'],
      },
      {
        id: 'feature-highlight',
        name: 'Feature Highlight',
        description: 'Showcase product features or benefits',
        category: 'business',
        tags: ['features', 'product', 'benefits'],
        preview: '',
        defaultSettings: {
          textOverlay: true,
          logoPosition: 'bottom-left',
        },
        requiredFields: ['title', 'features'],
        optionalFields: ['subtitle', 'description'],
      },
      {
        id: 'event-promo',
        name: 'Event Promotion',
        description: 'Promote events with date, location, and details',
        category: 'announcement',
        tags: ['event', 'promotion', 'date'],
        preview: '',
        defaultSettings: {
          textOverlay: true,
          logoPosition: 'top-center',
        },
        requiredFields: ['title', 'date'],
        optionalFields: ['location', 'description', 'cta'],
      },
      {
        id: 'price-offer',
        name: 'Price Offer',
        description: 'Highlight special offers and pricing',
        category: 'business',
        tags: ['price', 'offer', 'discount'],
        preview: '',
        defaultSettings: {
          textOverlay: true,
          logoPosition: 'bottom-right',
        },
        requiredFields: ['title', 'price'],
        optionalFields: ['discount', 'description', 'cta'],
      },
      {
        id: 'creative-gradient',
        name: 'Creative Gradient',
        description: 'Artistic gradient background with creative typography',
        category: 'creative',
        tags: ['gradient', 'creative', 'artistic'],
        preview: '',
        defaultSettings: {
          textOverlay: true,
          logoPosition: 'center',
        },
        requiredFields: ['title'],
        optionalFields: ['subtitle', 'content'],
      },
    ];

    defaultTemplates.forEach(template => {
      this.templates.set(template.id, template);
    });
  }

  getTemplate(id: string): Template | undefined {
    return this.templates.get(id);
  }

  getAllTemplates(): Template[] {
    return Array.from(this.templates.values());
  }

  getTemplatesByCategory(category: Template['category']): Template[] {
    return this.getAllTemplates().filter(template => template.category === category);
  }

  getTemplatesByTag(tag: string): Template[] {
    return this.getAllTemplates().filter(template => template.tags.includes(tag));
  }

  searchTemplates(query: string): Template[] {
    const lowercaseQuery = query.toLowerCase();
    return this.getAllTemplates().filter(template => 
      template.name.toLowerCase().includes(lowercaseQuery) ||
      template.description.toLowerCase().includes(lowercaseQuery) ||
      template.tags.some(tag => tag.toLowerCase().includes(lowercaseQuery))
    );
  }

  addTemplate(template: Template): void {
    this.templates.set(template.id, template);
  }

  removeTemplate(id: string): boolean {
    return this.templates.delete(id);
  }

  validateTemplateData(templateId: string, data: TemplateData): {
    isValid: boolean;
    missingFields: string[];
    errors: string[];
  } {
    const template = this.getTemplate(templateId);
    
    if (!template) {
      return {
        isValid: false,
        missingFields: [],
        errors: [`Template "${templateId}" not found`],
      };
    }

    const missingFields: string[] = [];
    const errors: string[] = [];

    // Check required fields
    template.requiredFields.forEach(field => {
      if (!data[field] || (typeof data[field] === 'string' && data[field].trim() === '')) {
        missingFields.push(field);
      }
    });

    // Validate specific field types
    if (data.stats && !Array.isArray(data.stats)) {
      errors.push('Stats must be an array');
    }

    if (data.features && !Array.isArray(data.features)) {
      errors.push('Features must be an array');
    }

    if (data.date && typeof data.date === 'string') {
      const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
      if (!dateRegex.test(data.date)) {
        errors.push('Date must be in YYYY-MM-DD format');
      }
    }

    return {
      isValid: missingFields.length === 0 && errors.length === 0,
      missingFields,
      errors,
    };
  }

  generateTemplateJSX(templateId: string, data: TemplateData, options: {
    width: number;
    height: number;
  }): any {
    const template = this.getTemplate(templateId);
    
    if (!template) {
      throw new Error(`Template "${templateId}" not found`);
    }

    const validation = this.validateTemplateData(templateId, data);
    if (!validation.isValid) {
      throw new Error(`Invalid template data: ${validation.errors.join(', ')}`);
    }

    switch (templateId) {
      case 'minimal-text':
        return this.renderMinimalText(data, options);
      case 'quote-card':
        return this.renderQuoteCard(data, options);
      case 'announcement':
        return this.renderAnnouncement(data, options);
      case 'stats-showcase':
        return this.renderStatsShowcase(data, options);
      case 'feature-highlight':
        return this.renderFeatureHighlight(data, options);
      case 'event-promo':
        return this.renderEventPromo(data, options);
      case 'price-offer':
        return this.renderPriceOffer(data, options);
      case 'creative-gradient':
        return this.renderCreativeGradient(data, options);
      default:
        throw new Error(`Template renderer for "${templateId}" not implemented`);
    }
  }

  private renderMinimalText(data: TemplateData, options: { width: number; height: number }): any {
    return {
      type: 'div',
      props: {
        style: {
          width: options.width,
          height: options.height,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          background: NottuColors.dark[950],
          padding: 80,
        },
        children: [
          {
            type: 'h1',
            props: {
              style: {
                fontFamily: NottuFonts.families.heading,
                fontSize: NottuFonts.sizes['4xl'],
                fontWeight: NottuFonts.weights.bold,
                color: '#FFFFFF',
                textAlign: 'center',
                lineHeight: 1.2,
                margin: 0,
              },
              children: data.title
            }
          },
          data.subtitle && {
            type: 'p',
            props: {
              style: {
                fontFamily: NottuFonts.families.ui,
                fontSize: NottuFonts.sizes.xl,
                color: NottuColors.primary[400],
                textAlign: 'center',
                marginTop: 24,
                margin: 0,
              },
              children: data.subtitle
            }
          },
          data.description && {
            type: 'p',
            props: {
              style: {
                fontFamily: NottuFonts.families.body,
                fontSize: NottuFonts.sizes.lg,
                color: NottuColors.gray[300],
                textAlign: 'center',
                marginTop: 32,
                maxWidth: '70%',
                lineHeight: 1.6,
                margin: 0,
              },
              children: data.description
            }
          }
        ].filter(Boolean)
      }
    };
  }

  private renderQuoteCard(data: TemplateData, options: { width: number; height: number }): any {
    return {
      type: 'div',
      props: {
        style: {
          width: options.width,
          height: options.height,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          background: `linear-gradient(135deg, ${NottuColors.dark[900]} 0%, ${NottuColors.dark[950]} 100%)`,
          padding: 80,
          position: 'relative',
        },
        children: [
          {
            type: 'div',
            props: {
              style: {
                fontSize: '120px',
                color: NottuColors.primary[500],
                fontFamily: NottuFonts.families.heading,
                lineHeight: 1,
                position: 'absolute',
                top: 40,
                left: 60,
              },
              children: '"'
            }
          },
          {
            type: 'blockquote',
            props: {
              style: {
                fontFamily: NottuFonts.families.heading,
                fontSize: NottuFonts.sizes['3xl'],
                fontWeight: NottuFonts.weights.medium,
                color: '#FFFFFF',
                textAlign: 'center',
                lineHeight: 1.3,
                margin: 0,
                maxWidth: '80%',
                position: 'relative',
                zIndex: 1,
              },
              children: data.quote
            }
          },
          data.author && {
            type: 'cite',
            props: {
              style: {
                fontFamily: NottuFonts.families.ui,
                fontSize: NottuFonts.sizes.lg,
                color: NottuColors.primary[400],
                fontStyle: 'normal',
                marginTop: 40,
                display: 'block',
              },
              children: `— ${data.author}`
            }
          }
        ].filter(Boolean)
      }
    };
  }

  private renderAnnouncement(data: TemplateData, options: { width: number; height: number }): any {
    return {
      type: 'div',
      props: {
        style: {
          width: options.width,
          height: options.height,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          background: `linear-gradient(135deg, ${NottuColors.dark[950]} 0%, ${NottuColors.primary[800]} 100%)`,
          padding: 60,
          position: 'relative',
        },
        children: [
          data.badge && {
            type: 'div',
            props: {
              style: {
                position: 'absolute',
                top: 40,
                left: 40,
                background: NottuColors.accent[500],
                color: '#FFFFFF',
                padding: '8px 16px',
                borderRadius: 20,
                fontSize: NottuFonts.sizes.sm,
                fontWeight: NottuFonts.weights.bold,
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
              },
              children: data.badge
            }
          },
          {
            type: 'h1',
            props: {
              style: {
                fontFamily: NottuFonts.families.heading,
                fontSize: NottuFonts.sizes['4xl'],
                fontWeight: NottuFonts.weights.bold,
                color: '#FFFFFF',
                textAlign: 'center',
                lineHeight: 1.1,
                margin: 0,
              },
              children: data.title
            }
          },
          data.description && {
            type: 'p',
            props: {
              style: {
                fontFamily: NottuFonts.families.ui,
                fontSize: NottuFonts.sizes.lg,
                color: NottuColors.gray[300],
                textAlign: 'center',
                lineHeight: 1.5,
                maxWidth: '80%',
                marginTop: 24,
                margin: 0,
              },
              children: data.description
            }
          },
          data.cta && {
            type: 'div',
            props: {
              style: {
                background: `linear-gradient(135deg, ${NottuColors.primary[500]} 0%, ${NottuColors.accent[400]} 100%)`,
                color: '#FFFFFF',
                padding: '16px 32px',
                borderRadius: 12,
                fontSize: NottuFonts.sizes.base,
                fontWeight: NottuFonts.weights.semibold,
                marginTop: 30,
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
              },
              children: data.cta
            }
          }
        ].filter(Boolean)
      }
    };
  }

  private renderStatsShowcase(data: TemplateData, options: { width: number; height: number }): any {
    return {
      type: 'div',
      props: {
        style: {
          width: options.width,
          height: options.height,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          background: NottuColors.dark[950],
          padding: 60,
        },
        children: [
          {
            type: 'h1',
            props: {
              style: {
                fontFamily: NottuFonts.families.heading,
                fontSize: NottuFonts.sizes['3xl'],
                fontWeight: NottuFonts.weights.bold,
                color: '#FFFFFF',
                textAlign: 'center',
                lineHeight: 1.1,
                margin: 0,
                marginBottom: 40,
              },
              children: data.title
            }
          },
          data.subtitle && {
            type: 'p',
            props: {
              style: {
                fontFamily: NottuFonts.families.ui,
                fontSize: NottuFonts.sizes.lg,
                color: NottuColors.primary[400],
                textAlign: 'center',
                marginBottom: 40,
                margin: 0,
              },
              children: data.subtitle
            }
          },
          {
            type: 'div',
            props: {
              style: {
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                gap: 30,
                maxWidth: '80%',
              },
              children: data.stats?.map((stat, index) => ({
                type: 'div',
                key: index,
                props: {
                  style: {
                    textAlign: 'center',
                    padding: '24px 20px',
                    background: `${NottuColors.primary[500]}10`,
                    borderRadius: 12,
                    border: `1px solid ${NottuColors.primary[500]}30`,
                  },
                  children: [
                    {
                      type: 'div',
                      props: {
                        style: {
                          fontFamily: NottuFonts.families.heading,
                          fontSize: NottuFonts.sizes['3xl'],
                          fontWeight: NottuFonts.weights.bold,
                          color: NottuColors.primary[400],
                          lineHeight: 1,
                        },
                        children: stat.value
                      }
                    },
                    {
                      type: 'div',
                      props: {
                        style: {
                          fontFamily: NottuFonts.families.ui,
                          fontSize: NottuFonts.sizes.base,
                          color: '#FFFFFF',
                          marginTop: 8,
                          fontWeight: NottuFonts.weights.medium,
                        },
                        children: stat.label
                      }
                    }
                  ]
                }
              })) || []
            }
          }
        ]
      }
    };
  }

  private renderFeatureHighlight(data: TemplateData, options: { width: number; height: number }): any {
    return {
      type: 'div',
      props: {
        style: {
          width: options.width,
          height: options.height,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          background: `linear-gradient(135deg, ${NottuColors.dark[950]} 0%, ${NottuColors.dark[900]} 100%)`,
          padding: 60,
        },
        children: [
          {
            type: 'h1',
            props: {
              style: {
                fontFamily: NottuFonts.families.heading,
                fontSize: NottuFonts.sizes['3xl'],
                fontWeight: NottuFonts.weights.bold,
                color: '#FFFFFF',
                textAlign: 'center',
                lineHeight: 1.1,
                margin: 0,
                marginBottom: 20,
              },
              children: data.title
            }
          },
          data.subtitle && {
            type: 'p',
            props: {
              style: {
                fontFamily: NottuFonts.families.ui,
                fontSize: NottuFonts.sizes.lg,
                color: NottuColors.primary[400],
                textAlign: 'center',
                marginBottom: 40,
                margin: 0,
              },
              children: data.subtitle
            }
          },
          {
            type: 'div',
            props: {
              style: {
                display: 'flex',
                flexDirection: 'column',
                gap: 20,
                maxWidth: '70%',
              },
              children: data.features?.map((feature, index) => ({
                type: 'div',
                key: index,
                props: {
                  style: {
                    display: 'flex',
                    alignItems: 'center',
                    gap: 16,
                    padding: '16px 24px',
                    background: `${NottuColors.primary[500]}10`,
                    borderRadius: 12,
                    border: `1px solid ${NottuColors.primary[500]}30`,
                  },
                  children: [
                    {
                      type: 'div',
                      props: {
                        style: {
                          width: 8,
                          height: 8,
                          borderRadius: '50%',
                          background: NottuColors.primary[400],
                          flexShrink: 0,
                        }
                      }
                    },
                    {
                      type: 'span',
                      props: {
                        style: {
                          fontFamily: NottuFonts.families.ui,
                          fontSize: NottuFonts.sizes.base,
                          color: '#FFFFFF',
                          fontWeight: NottuFonts.weights.medium,
                        },
                        children: feature
                      }
                    }
                  ]
                }
              })) || []
            }
          }
        ]
      }
    };
  }

  private renderEventPromo(data: TemplateData, options: { width: number; height: number }): any {
    return {
      type: 'div',
      props: {
        style: {
          width: options.width,
          height: options.height,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          background: `linear-gradient(135deg, ${NottuColors.dark[950]} 0%, ${NottuColors.dark[900]} 100%)`,
          padding: 60,
        },
        children: [
          {
            type: 'div',
            props: {
              style: {
                textAlign: 'center',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 24,
              },
              children: [
                {
                  type: 'h1',
                  props: {
                    style: {
                      fontFamily: NottuFonts.families.heading,
                      fontSize: NottuFonts.sizes['4xl'],
                      fontWeight: NottuFonts.weights.bold,
                      color: '#FFFFFF',
                      lineHeight: 1.1,
                      margin: 0,
                    },
                    children: data.title
                  }
                },
                {
                  type: 'div',
                  props: {
                    style: {
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 16,
                      alignItems: 'center',
                    },
                    children: [
                      {
                        type: 'div',
                        props: {
                          style: {
                            background: NottuColors.primary[500],
                            color: '#FFFFFF',
                            padding: '12px 24px',
                            borderRadius: 8,
                            fontSize: NottuFonts.sizes.lg,
                            fontWeight: NottuFonts.weights.bold,
                          },
                          children: data.date
                        }
                      },
                      data.location && {
                        type: 'div',
                        props: {
                          style: {
                            fontFamily: NottuFonts.families.ui,
                            fontSize: NottuFonts.sizes.base,
                            color: NottuColors.gray[300],
                          },
                          children: `📍 ${data.location}`
                        }
                      }
                    ].filter(Boolean)
                  }
                },
                data.description && {
                  type: 'p',
                  props: {
                    style: {
                      fontFamily: NottuFonts.families.ui,
                      fontSize: NottuFonts.sizes.lg,
                      color: NottuColors.gray[300],
                      lineHeight: 1.5,
                      maxWidth: '80%',
                      margin: 0,
                    },
                    children: data.description
                  }
                },
                data.cta && {
                  type: 'div',
                  props: {
                    style: {
                      background: `linear-gradient(135deg, ${NottuColors.accent[500]} 0%, ${NottuColors.primary[500]} 100%)`,
                      color: '#FFFFFF',
                      padding: '16px 32px',
                      borderRadius: 12,
                      fontSize: NottuFonts.sizes.base,
                      fontWeight: NottuFonts.weights.semibold,
                      marginTop: 20,
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em',
                    },
                    children: data.cta
                  }
                }
              ].filter(Boolean)
            }
          }
        ]
      }
    };
  }

  private renderPriceOffer(data: TemplateData, options: { width: number; height: number }): any {
    return {
      type: 'div',
      props: {
        style: {
          width: options.width,
          height: options.height,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          background: NottuColors.dark[950],
          padding: 60,
          position: 'relative',
        },
        children: [
          data.discount && {
            type: 'div',
            props: {
              style: {
                position: 'absolute',
                top: 40,
                right: 40,
                background: NottuColors.semantic.success,
                color: '#FFFFFF',
                padding: '8px 16px',
                borderRadius: 20,
                fontSize: NottuFonts.sizes.sm,
                fontWeight: NottuFonts.weights.bold,
                transform: 'rotate(15deg)',
              },
              children: data.discount
            }
          },
          {
            type: 'div',
            props: {
              style: {
                textAlign: 'center',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 30,
              },
              children: [
                {
                  type: 'h1',
                  props: {
                    style: {
                      fontFamily: NottuFonts.families.heading,
                      fontSize: NottuFonts.sizes['3xl'],
                      fontWeight: NottuFonts.weights.bold,
                      color: '#FFFFFF',
                      lineHeight: 1.1,
                      margin: 0,
                    },
                    children: data.title
                  }
                },
                {
                  type: 'div',
                  props: {
                    style: {
                      fontFamily: NottuFonts.families.heading,
                      fontSize: NottuFonts.sizes['5xl'],
                      fontWeight: NottuFonts.weights.bold,
                      color: NottuColors.primary[400],
                      lineHeight: 1,
                    },
                    children: data.price
                  }
                },
                data.description && {
                  type: 'p',
                  props: {
                    style: {
                      fontFamily: NottuFonts.families.ui,
                      fontSize: NottuFonts.sizes.lg,
                      color: NottuColors.gray[300],
                      lineHeight: 1.5,
                      maxWidth: '80%',
                      margin: 0,
                    },
                    children: data.description
                  }
                },
                data.cta && {
                  type: 'div',
                  props: {
                    style: {
                      background: `linear-gradient(135deg, ${NottuColors.primary[500]} 0%, ${NottuColors.accent[400]} 100%)`,
                      color: '#FFFFFF',
                      padding: '20px 40px',
                      borderRadius: 12,
                      fontSize: NottuFonts.sizes.lg,
                      fontWeight: NottuFonts.weights.bold,
                      marginTop: 20,
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em',
                    },
                    children: data.cta
                  }
                }
              ].filter(Boolean)
            }
          }
        ].filter(Boolean)
      }
    };
  }

  private renderCreativeGradient(data: TemplateData, options: { width: number; height: number }): any {
    return {
      type: 'div',
      props: {
        style: {
          width: options.width,
          height: options.height,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          background: `linear-gradient(135deg, ${NottuColors.primary[600]} 0%, ${NottuColors.accent[500]} 30%, ${NottuColors.primary[800]} 60%, ${NottuColors.dark[900]} 100%)`,
          padding: 80,
          position: 'relative',
        },
        children: [
          {
            type: 'div',
            props: {
              style: {
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                background: 'radial-gradient(circle at 20% 80%, rgba(255,255,255,0.1) 0%, transparent 50%), radial-gradient(circle at 80% 20%, rgba(255,255,255,0.1) 0%, transparent 50%)',
                zIndex: 1,
              }
            }
          },
          {
            type: 'div',
            props: {
              style: {
                position: 'relative',
                zIndex: 2,
                textAlign: 'center',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 30,
              },
              children: [
                {
                  type: 'h1',
                  props: {
                    style: {
                      fontFamily: NottuFonts.families.heading,
                      fontSize: NottuFonts.sizes['5xl'],
                      fontWeight: NottuFonts.weights.bold,
                      color: '#FFFFFF',
                      lineHeight: 1,
                      margin: 0,
                      textShadow: '0 4px 8px rgba(0, 0, 0, 0.3)',
                      background: 'linear-gradient(135deg, #FFFFFF 0%, rgba(255,255,255,0.8) 100%)',
                      WebkitBackgroundClip: 'text',
                      WebkitTextFillColor: 'transparent',
                    },
                    children: data.title
                  }
                },
                data.subtitle && {
                  type: 'p',
                  props: {
                    style: {
                      fontFamily: NottuFonts.families.ui,
                      fontSize: NottuFonts.sizes['2xl'],
                      color: 'rgba(255, 255, 255, 0.9)',
                      textAlign: 'center',
                      fontWeight: NottuFonts.weights.medium,
                      margin: 0,
                      textShadow: '0 2px 4px rgba(0, 0, 0, 0.2)',
                    },
                    children: data.subtitle
                  }
                },
                data.content && {
                  type: 'p',
                  props: {
                    style: {
                      fontFamily: NottuFonts.families.body,
                      fontSize: NottuFonts.sizes.lg,
                      color: 'rgba(255, 255, 255, 0.8)',
                      lineHeight: 1.6,
                      maxWidth: '70%',
                      margin: 0,
                      textShadow: '0 1px 2px rgba(0, 0, 0, 0.2)',
                    },
                    children: data.content
                  }
                }
              ].filter(Boolean)
            }
          }
        ]
      }
    };
  }
}