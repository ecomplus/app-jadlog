/* eslint-disable comma-dangle, no-multi-spaces, key-spacing */

/**
 * Edit base E-Com Plus Application object here.
 * Ref.: https://developers.e-com.plus/docs/api/#/store/applications/
 */

const app = {
  app_id: 115229,
  title: 'Jadlog',
  slug: 'jadlog',
  type: 'external',
  state: 'active',
  authentication: true,

  /**
   * Uncomment modules above to work with E-Com Plus Mods API on Storefront.
   * Ref.: https://developers.e-com.plus/modules-api/
   */
  modules: {
    /**
     * Triggered to calculate shipping options, must return values and deadlines.
     * Start editing `routes/ecom/modules/calculate-shipping.js`
     */
    calculate_shipping:   { enabled: true },

    /**
     * Triggered to validate and apply discount value, must return discount and conditions.
     * Start editing `routes/ecom/modules/apply-discount.js`
     */
    // apply_discount:       { enabled: true },

    /**
     * Triggered when listing payments, must return available payment methods.
     * Start editing `routes/ecom/modules/list-payments.js`
     */
    // list_payments:        { enabled: true },

    /**
     * Triggered when order is being closed, must create payment transaction and return info.
     * Start editing `routes/ecom/modules/create-transaction.js`
     */
    // create_transaction:   { enabled: true },
  },

  /**
   * Uncomment only the resources/methods your app may need to consume through Store API.
   */
  auth_scope: {
    'stores/me': [
      'GET'            // Read store info
    ],
    procedures: [
      'POST'           // Create procedures to receive webhooks
    ],
    products: [
      // 'GET',           // Read products with public and private fields
      // 'POST',          // Create products
      // 'PATCH',         // Edit products
      // 'PUT',           // Overwrite products
      // 'DELETE',        // Delete products
    ],
    brands: [
      // 'GET',           // List/read brands with public and private fields
      // 'POST',          // Create brands
      // 'PATCH',         // Edit brands
      // 'PUT',           // Overwrite brands
      // 'DELETE',        // Delete brands
    ],
    categories: [
      // 'GET',           // List/read categories with public and private fields
      // 'POST',          // Create categories
      // 'PATCH',         // Edit categories
      // 'PUT',           // Overwrite categories
      // 'DELETE',        // Delete categories
    ],
    customers: [
      // 'GET',           // List/read customers
      // 'POST',          // Create customers
      // 'PATCH',         // Edit customers
      // 'PUT',           // Overwrite customers
      // 'DELETE',        // Delete customers
    ],
    orders: [
      'GET',           // List/read orders with public and private fields
      // 'POST',          // Create orders
      'PATCH',         // Edit orders
      // 'PUT',           // Overwrite orders
      // 'DELETE',        // Delete orders
    ],
    carts: [
      // 'GET',           // List all carts (no auth needed to read specific cart only)
      // 'POST',          // Create carts
      // 'PATCH',         // Edit carts
      // 'PUT',           // Overwrite carts
      // 'DELETE',        // Delete carts
    ],

    /**
     * Prefer using 'fulfillments' and 'payment_history' subresources to manipulate update order status.
     */
     'orders/fulfillments': [
      'GET',           // List/read order fulfillment and tracking events
      'POST',             // Create fulfillment event with new status
      // 'DELETE',        // Delete fulfillment event
    ],
    'orders/shipping_lines': [
      'GET',              // List/read order shipping lines
      'PATCH',            // Edit order shipping line nested object
    ],
    'orders/payments_history': [
      // 'GET',           // List/read order payments history events
      // 'POST',          // Create payments history entry with new status
      // 'DELETE',        // Delete payments history entry
    ],

    /**
     * Set above 'quantity' and 'price' subresources if you don't need access for full product document.
     * Stock and price management only.
     */
    'products/quantity': [
      // 'GET',           // Read product available quantity
      // 'PUT',           // Set product stock quantity
    ],
    'products/variations/quantity': [
      // 'GET',           // Read variaton available quantity
      // 'PUT',           // Set variation stock quantity
    ],
    'products/price': [
      // 'GET',           // Read product current sale price
      // 'PUT',           // Set product sale price
    ],
    'products/variations/price': [
      // 'GET',           // Read variation current sale price
      // 'PUT',           // Set variation sale price
    ],

    /**
     * You can also set any other valid resource/subresource combination.
     * Ref.: https://developers.e-com.plus/docs/api/#/store/
     */
  },

  admin_settings: {
    zip: {
      schema: {
        type: 'string',
        maxLength: 9,
        pattern: '^[0-9]{5}-?[0-9]{3}$',
        title: 'CEP de origem',
        description: 'Código postal do remetente para cálculo do frete'
      },
      hide: false
    },
    enable_tag: {
      schema: {
        type: 'boolean',
        default: false,
        title: 'Ativar envio de pedido para jadlog',
        description: 'Pedido será enviado quando o status mudar para Pronto Para Envio'
      },
      hide: false
    },
    jadlog_contract: {
      schema: {
        title: 'Contrato',
        description: 'Informações do contrato com a Jadlog (solicite ao suporte comercial da Jadlog)',
        type: 'object',
        required: [
          'account',
          'token'
        ],
        properties: {
          account: {
            type: 'string',
            maxLength: 50,
            title: 'Número da conta'
          },
          token: {
            type: 'string',
            maxLength: 250,
            title: 'Token'
          },
          contract: {
            type: 'string',
            maxLength: 50,
            title: 'Contrato'
          },
          doc_number: {
            type: 'string',
            maxLength: 14,
            title: 'CNPJ do contratante',
            description: 'Usado para vincular tabela de frete especial (apenas números)'
          },
          insurance_type: {
            type: 'string',
            enum: [
              'Normal',
              'Apólice própria'
            ],
            default: 'Apólice própria',
            title: 'Tipo de seguro'
          },
          collection_cost: {
            type: 'number',
            minimum: 0,
            maximum: 999999,
            title: 'Valor da coleta'
          }
        }
      },
      hide: true
    },
    services: {
      schema: {
        title: 'Modalidades de envio via Jadlog',
        type: 'array',
        maxItems: 4,
        items: {
          title: 'Opção de serviço de entrega',
          type: 'object',
          required: [
            'service_code'
          ],
          properties: {
            label: {
              type: 'string',
              maxLength: 50,
              title: 'Rótulo',
              description: 'Nome do serviço exibido aos clientes'
            },
            service_code: {
              type: 'string',
              enum: [
                '.PACKAGE',
                'RODOVIÁRIO',
                'DOC',
                'ECONÔMICO',
                'CORPORATE',
                '.COM',
                'CARGO',
                'EMERGENCIAL',
                'EXPRESSO'
              ],
              title: 'Modalidade de envio'
            }
          }
        }
      },
      hide: true
    },
    posting_deadline: {
      schema: {
        title: 'Prazo de postagem',
        type: 'object',
        required: [
          'days'
        ],
        additionalProperties: false,
        properties: {
          days: {
            type: 'integer',
            minimum: 0,
            maximum: 999999,
            title: 'Número de dias',
            description: 'Dias de prazo para postar os produtos após a compra'
          },
          working_days: {
            type: 'boolean',
            default: true,
            title: 'Dias úteis'
          },
          after_approval: {
            type: 'boolean',
            default: true,
            title: 'Após aprovação do pagamento'
          }
        }
      },
      hide: false
    },
    additional_price: {
      schema: {
        type: 'number',
        minimum: -999999,
        maximum: 999999,
        title: 'Custo adicional',
        description: 'Valor a adicionar (negativo para descontar) no frete calculado via Jadlog'
      },
      hide: false
    },
    free_no_weight_shipping: {
      schema: {
        type: 'boolean',
        default: false,
        title: 'Frete grátis sem peso',
        description: 'Aplica frete grátis se todos os produtos tiverem peso e dimensões zeradas'
      },
      hide: false
    },
    shipping_rules: {
      schema: {
        title: 'Regras de envio',
        description: 'Aplicar descontos/adicionais condicionados',
        type: 'array',
        maxItems: 300,
        items: {
          title: 'Regra de envio',
          type: 'object',
          minProperties: 1,
          properties: {
            service_code: {
              type: 'string',
              enum: [
                '.PACKAGE',
                'RODOVIÁRIO',
                'DOC',
                'ECONÔMICO',
                'CORPORATE',
                '.COM',
                'CARGO',
                'EMERGENCIAL',
                'EXPRESSO'
              ],
              default: '.PACKAGE',
              title: 'Modalidade de envio'
            },
            zip_range: {
              title: 'Faixa de CEP',
              type: 'object',
              required: [
                'min',
                'max'
              ],
              properties: {
                min: {
                  type: 'integer',
                  minimum: 10000,
                  maximum: 999999999,
                  title: 'CEP inicial'
                },
                max: {
                  type: 'integer',
                  minimum: 10000,
                  maximum: 999999999,
                  title: 'CEP final'
                }
              }
            },
            min_amount: {
              type: 'number',
              minimum: 1,
              maximum: 999999999,
              title: 'Valor mínimo da compra'
            },
            free_shipping: {
              type: 'boolean',
              default: false,
              title: 'Frete grátis'
            },
            discount: {
              title: 'Desconto',
              type: 'object',
              required: [
                'value'
              ],
              properties: {
                percentage: {
                  type: 'boolean',
                  default: false,
                  title: 'Desconto percentual'
                },
                value: {
                  type: 'number',
                  minimum: -99999999,
                  maximum: 99999999,
                  title: 'Valor do desconto',
                  description: 'Valor percentual/fixo do desconto ou acréscimo (negativo)'
                }
              }
            }
          }
        }
      },
      hide: false
    },
    seller_info: {
      schema: {
        type: 'object',
        title: 'Dados para envio de etiquta',
        description: 'Configure informações para etiqueta',
        properties: {
          name: {
            type: 'string',
            maxLength: 60,
            title: 'Nome da empresa ou loja'
          },
          cdUnidadeOri: {
            type: 'string',
            maxLength: 9,
            title: 'Código da agência de origem'
          },
          collect_type: {
            type: 'string',
            title: 'Tipo da solicitação',
            default: 'solicitacao eletronica (aguardando remessa fisica)',
            enum: [
              'solicitacao eletronica (aguardando remessa fisica)',
              'solicitacao de coleta no remetente',
            ]
          },
          street: {
            type: 'string',
            maxLength: 80,
            title: 'Digite a rua'
          },
          number: {
            type: 'string',
            maxLength: 10,
            title: 'Digite o número da residência'
          },
          complement: {
            type: 'string',
            maxLength: 20,
            title: 'Complemento'
          },
          borough: {
            type: 'string',
            maxLength: 60,
            title: 'Bairro'
          },
          city: {
            type: 'string',
            maxLength: 60,
            title: 'Cidade'
          },
          province_code: {
            type: 'string',
            title: 'Sigla do Estado',
            enum: [
              'AC',
              'AL',
              'AP',
              'AM',
              'BA',
              'CE',
              'DF',
              'ES',
              'GO',
              'MA',
              'MT',
              'MS',
              'MG',
              'PA',
              'PB',
              'PR',
              'PE',
              'PI',
              'RR',
              'RO',
              'RJ',
              'RS',
              'RN',
              'SC',
              'SP',
              'SE',
              'TO'
            ]
          },
          cfop: {
            type: 'string',
            maxLength: 4,
            title: 'CFOP (caso emita nota fiscal)'
          }
        }
      },
      hide: true
    }
  }
}

/**
 * List of Procedures to be created on each store after app installation.
 * Ref.: https://developers.e-com.plus/docs/api/#/store/procedures/
 */

const procedures = []


 // Uncomment and edit code above to configure `triggers` and receive respective `webhooks`:

const { baseUri } = require('./__env')

procedures.push({
  title: app.title,

  triggers: [
    // Receive notifications when new order is created:
    /* {
      resource: 'orders',
      action: 'create',
    }, */

    // Receive notifications when order financial/fulfillment status changes:
    /* {
      resource: 'orders',
      field: 'financial_status',
    }, */
    {
      resource: 'orders',
      field: 'fulfillment_status',
    },

    // Receive notifications when products/variations stock quantity changes:
    /* {
      resource: 'products',
      field: 'quantity',
    },
    {
      resource: 'products',
      subresource: 'variations',
      field: 'quantity'
    }, */

    // Receive notifications when cart is edited:
    /* {
      resource: 'carts',
      action: 'change',
    }, */

    // Receive notifications when customer is deleted:
    /* {
      resource: 'customers',
      action: 'delete',
    }, */

    // Feel free to create custom combinations with any Store API resource, subresource, action and field.
  ],

  webhooks: [
    {
      api: {
        external_api: {
          uri: `${baseUri}/ecom/webhook`
        }
      },
      method: 'POST'
    }
  ]
})

 // You may also edit `routes/ecom/webhook.js` to treat notifications properly.
 

exports.app = app

exports.procedures = procedures
