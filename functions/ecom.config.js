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
  authentication: false,

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
    }
  }
}

/**
 * List of Procedures to be created on each store after app installation.
 * Ref.: https://developers.e-com.plus/docs/api/#/store/procedures/
 */

const procedures = []

/**
 * Uncomment and edit code above to configure `triggers` and receive respective `webhooks`:

const { baseUri } = require('./__env')

procedures.push({
  title: app.title,

  triggers: [
    // Receive notifications when new order is created:
    {
      resource: 'orders',
      action: 'create',
    },

    // Receive notifications when order financial/fulfillment status changes:
    {
      resource: 'orders',
      field: 'financial_status',
    },
    {
      resource: 'orders',
      field: 'fulfillment_status',
    },

    // Receive notifications when products/variations stock quantity changes:
    {
      resource: 'products',
      field: 'quantity',
    },
    {
      resource: 'products',
      subresource: 'variations',
      field: 'quantity'
    },

    // Receive notifications when cart is edited:
    {
      resource: 'carts',
      action: 'change',
    },

    // Receive notifications when customer is deleted:
    {
      resource: 'customers',
      action: 'delete',
    },

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

 * You may also edit `routes/ecom/webhook.js` to treat notifications properly.
 */

exports.app = app

exports.procedures = procedures
