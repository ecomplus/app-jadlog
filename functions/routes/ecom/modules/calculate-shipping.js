const axios = require('axios')
const getDeadlines = require('../../../lib/jadlog/get-deadlines')

exports.post = ({ appSdk }, req, res) => {
  /**
   * Treat `params` and (optionally) `application` from request body to properly mount the `response`.
   * JSON Schema reference for Calculate Shipping module objects:
   * `params`: https://apx-mods.e-com.plus/api/v1/calculate_shipping/schema.json?store_id=100
   * `response`: https://apx-mods.e-com.plus/api/v1/calculate_shipping/response_schema.json?store_id=100
   */

  const { params, application } = req.body
  // setup basic required response object
  const response = {
    shipping_services: []
  }
  // merge all app options configured by merchant
  const appData = Object.assign({}, application.data, application.hidden_data)

  if (appData.free_shipping_from_value >= 0) {
    response.free_shipping_from_value = appData.free_shipping_from_value
  }

  const formatZipCode = str => str.replace(/\D/g, '').padStart(8, '0')
  const cepdes = params.to ? formatZipCode(params.to.zip) : ''
  const cepori = params.from
    ? formatZipCode(params.from.zip)
    : appData.zip ? formatZipCode(appData.zip) : ''

  const checkZipCode = rule => {
    // validate rule zip range
    if (cepdes && rule.zip_range) {
      const { min, max } = rule.zip_range
      return Boolean((!min || cepdes >= min) && (!max || cepdes <= max))
    }
    return true
  }

  // search for configured free shipping rule
  if (Array.isArray(appData.shipping_rules)) {
    for (let i = 0; i < appData.shipping_rules.length; i++) {
      const rule = appData.shipping_rules[i]
      if (rule.free_shipping && checkZipCode(rule)) {
        if (!rule.min_amount) {
          response.free_shipping_from_value = 0
          break
        } else if (!(response.free_shipping_from_value <= rule.min_amount)) {
          response.free_shipping_from_value = rule.min_amount
        }
      }
    }
  }

  if (!params.to) {
    // just a free shipping preview with no shipping address received
    // respond only with free shipping option
    res.send(response)
    return
  }

  const jadlogContract = appData.jadlog_contract || {}
  if (!cepori || !jadlogContract.account || !jadlogContract.token) {
    // must have configured origin zip code to continue
    return res.status(409).send({
      error: 'CALCULATE_ERR',
      message: 'Zip code or contract is unset on app hidden data (merchant must configure the app)'
    })
  }

  // calculate weight and pkg value from items list
  let peso = 0
  let vldeclarado = params.subtotal || 0
  if (params.items) {
    const pkg = {
      dimensions: {
        width: {
          value: 0,
          unit: 'cm'
        },
        height: {
          value: 0,
          unit: 'cm'
        },
        length: {
          value: 0,
          unit: 'cm'
        }
      },
      weight: {
        value: 0,
        unit: 'kg'
      }
    }

    params.items.forEach(({ price, quantity, dimensions, weight }) => {
      let physicalWeight = 0
      let cubicWeight = 0
      if (!params.subtotal) {
        vldeclarado += price * quantity
      }

      // sum physical weight
      if (weight && weight.value) {
        switch (weight.unit) {
          case 'kg':
            physicalWeight = weight.value
            break
          case 'g':
            physicalWeight = weight.value / 1000
            break
          case 'mg':
            physicalWeight = weight.value / 1000000
        }
        pkg.weight.value += physicalWeight * quantity
      }

      // sum total items dimensions to calculate cubic weight
      if (dimensions) {
        const sumDimensions = {}
        for (const side in dimensions) {
          const dimension = dimensions[side]
          if (dimension && dimension.value) {
            let dimensionValue
            switch (dimension.unit) {
              case 'cm':
                dimensionValue = dimension.value
                break
              case 'm':
                dimensionValue = dimension.value * 100
                break
              case 'mm':
                dimensionValue = dimension.value / 10
            }
            // add/sum current side to final dimensions object
            if (dimensionValue) {
              sumDimensions[side] = sumDimensions[side]
                ? sumDimensions[side] + dimensionValue
                : dimensionValue
            }
          }
        }

        // calculate cubic weight
        // http://blog.encaminhei.com/logistica-transporte/valor-do-frete-pela-jadlog/
        // (C x L x A) / 6.000
        for (const side in sumDimensions) {
          if (sumDimensions[side]) {
            cubicWeight = cubicWeight > 0
              ? cubicWeight * sumDimensions[side]
              : sumDimensions[side]
            pkg.dimensions[side].value += sumDimensions[side] * quantity
          }
        }
        if (cubicWeight > 0) {
          cubicWeight /= 6000
        }
      }
      if (!appData.free_no_weight_shipping || physicalWeight > 0) {
        peso += (quantity * (physicalWeight > cubicWeight ? physicalWeight : cubicWeight))
      }
    })

    // optinal predefined or configured service codes
    let serviceCodes
    if (params.service_code) {
      serviceCodes = [params.service_code]
    } else if (Array.isArray(appData.services) && appData.services[0]) {
      const firstServiceCode = appData.services[0].service_code
      if (firstServiceCode) {
        serviceCodes = [firstServiceCode]
        for (let i = 1; i < appData.services.length; i++) {
          serviceCodes.push(appData.services[i].service_code)
        }
      }
    }
    if (!serviceCodes || !serviceCodes.length) {
      serviceCodes = ['.PACKAGE', '.COM']
    }

    const jadlogServices = serviceCodes.map(serviceCode => {
      let modalidade
      switch (serviceCode) {
        case '.PACKAGE':
          modalidade = 3
          break
        case 'RODOVIÁRIO':
          modalidade = 4
          break
        case 'DOC':
          modalidade = 6
          break
        case 'ECONÔMICO':
          modalidade = 5
          break
        case 'CORPORATE':
          modalidade = 7
          break
        case '.COM':
          modalidade = 9
          break
        case 'CARGO':
          modalidade = 12
          break
        case 'EMERGENCIAL':
          modalidade = 14
          break
        default:
          modalidade = 0
          break
      }

      return {
        modalidade,
        cepori,
        cepdes,
        peso: peso > 0.1 ? Math.round(peso * 100) / 100 : 0.1,
        vldeclarado: vldeclarado > 0 ? Math.round(vldeclarado * 100) / 100 : 10,
        frap: null,
        tpentrega: 'D',
        tpseguro: jadlogContract.insurance_type === 'Apólice própria' ? 'A' : 'N',
        conta: jadlogContract.account,
        contrato: jadlogContract.contract,
        vlcoleta: jadlogContract.collection_cost || 0
      }
    })

    axios({
      url: 'http://www.jadlog.com.br/embarcador/api/frete/valor',
      method: 'post',
      data: {
        frete: jadlogServices
      },
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        Authorization: 'Bearer ' + jadlogContract.token
      },
      timeout: 6000
    })

      .then(({ data }) => {
        if (data && Array.isArray(data.frete)) {
          data.frete.forEach(({ vltotal, error }, index) => {
            if (vltotal && !error) {
              const jadlogParams = jadlogServices[index]

              // find respective configured service label
              const serviceCode = serviceCodes[index]
              let label = `Jadlog ${serviceCode}`
              if (Array.isArray(appData.services)) {
                const service = appData.services.find(service => {
                  return service.service_code === serviceCode
                })
                if (service && service.label) {
                  label = service.label
                }
              }

              // parse to E-Com Plus shipping line object
              const price = parseFloat(vltotal)
              const shippingLine = {
                from: {
                  ...params.from,
                  zip: cepori
                },
                to: params.to,
                package: pkg,
                price,
                declared_value: jadlogParams.vldeclarado,
                discount: 0,
                total_price: price,
                delivery_time: {
                  days: getDeadlines(jadlogParams),
                  working_days: true
                },
                posting_deadline: {
                  days: 3,
                  ...appData.posting_deadline
                },
                flags: ['jadlog-ws']
              }

              // check for default configured additional/discount price
              if (typeof appData.additional_price === 'number' && appData.additional_price) {
                if (appData.additional_price > 0) {
                  shippingLine.other_additionals = [{
                    tag: 'additional_price',
                    label: 'Adicional padrão',
                    price: appData.additional_price
                  }]
                } else {
                  // negative additional price to apply discount
                  shippingLine.discount -= appData.additional_price
                }
                // update total price
                shippingLine.total_price += appData.additional_price
              }

              // search for discount by shipping rule
              if (Array.isArray(appData.shipping_rules)) {
                for (let i = 0; i < appData.shipping_rules.length; i++) {
                  const rule = appData.shipping_rules[i]
                  if (
                    rule &&
                    (!rule.service_code || rule.service_code === serviceCode) &&
                    checkZipCode(rule) &&
                    !(rule.min_amount > jadlogParams.vldeclarado)
                  ) {
                    // valid shipping rule
                    if (rule.free_shipping) {
                      shippingLine.discount += shippingLine.total_price
                      shippingLine.total_price = 0
                      break
                    } else if (rule.discount) {
                      let discountValue = rule.discount.value
                      if (rule.discount.percentage) {
                        discountValue *= (shippingLine.total_price / 100)
                      }
                      if (discountValue) {
                        shippingLine.discount += discountValue
                        shippingLine.total_price -= discountValue
                        if (shippingLine.total_price < 0) {
                          shippingLine.total_price = 0
                        }
                      }
                      break
                    }
                  }
                }
              }

              // push shipping service object to response
              response.shipping_services.push({
                label,
                carrier: 'Jadlog',
                carrier_doc_number: '04884082000135',
                service_code: serviceCode,
                service_name: `${jadlogParams.modalidade}: ${serviceCode}`,
                shipping_line: shippingLine
              })
            }
          })
        }

        if (response.shipping_services.length) {
          // free shipping if all items has no weigth
          const freeNoWeightShipping = peso <= 0 && appData.free_no_weight_shipping
          if (freeNoWeightShipping) {
            let cheapestShippingLine
            for (let i = 0; i < response.shipping_services.length; i++) {
              const shippingLine = response.shipping_services[i].shipping_line
              if (!shippingLine.total_price) {
                // already free
                break
              }
              if (!cheapestShippingLine || cheapestShippingLine.total_price > shippingLine.total_price) {
                cheapestShippingLine = shippingLine
              }
            }
            if (cheapestShippingLine) {
              // set the cheapest shipping line free
              cheapestShippingLine.discount = cheapestShippingLine.total_price
              cheapestShippingLine.total_price = 0
              cheapestShippingLine.flags.push('free_no_weight')
            }
          }
        } else {
          // pass Jadlog error message
          return res.status(409).send({
            error: 'CALCULATE_ERR_MSG',
            message: `Jadlog erro: ${(data.erro ? data.erro.descricao : '')}`
          })
        }

        // success response with available shipping services
        return res.send(response)
      })

      .catch(err => {
        if (!err.response) {
          console.error(err)
        }
        // unexpected ws response
        res.status(409).send({
          error: 'CALCULATE_UNEXPECTED_RSP',
          message: `Unexpected Jadlog response with status: ${(err.response ? err.response.status : '')}`
        })
      })
  } else {
    res.status(400).send({
      error: 'CALCULATE_EMPTY_CART',
      message: 'Cannot calculate shipping without cart items'
    })
  }
}
