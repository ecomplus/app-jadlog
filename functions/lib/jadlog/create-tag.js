const axios = require('axios')
const ecomUtils = require('@ecomplus/utils')
const { logger } = require('firebase-functions')

module.exports = async (order, token, storeId, appData, appSdk, auth) => {
    // create new shipping tag to Jadlog
    // https://www.jadlog.com.br/jadlog/arquivos/api_integracao.pdf
    const headers = {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        Authorization: 'Bearer ' + token
    }

    const { seller_info, zip, jadlog_contract } = appData

    const debugAxiosError = error => {
        const err = new Error(error.message)
        if (error.response) {
            err.status = error.response.status
            err.response = error.response.data
        }
        err.request = error.config
        logger.error(err || error)
    }

    const formatZipCode = str => str.replace(/\D/g, '').padStart(8, '0')

    const tpColeta = seller_info && seller_info.collect_type.toLowerCase() === 'solicitacao de coleta no remetente' ? 'K' : 'S'
    const { cdUnidadeOri } = seller_info

    const data = {
        conteudo: order.items && order.items.length && order.items[0] && order.items[0].name.slice(0, 80) || 'Produto Diverso',
        pedido: [String(order.number || order._id)],
        totValor: order.amount && order.amount.total || 1,
        tpColeta,
        cdUnidadeOri,
        nrContrato: jadlog_contract.contract,
        contaCorrente: jadlog_contract.account,
        vlColeta: jadlog_contract.collection_cost
    }
    data.des = {}
    data.rem = {}
    data.dfe = []
    data.volume = []

    // config buyer information
    const buyer = order.buyers && order.buyers[0]
    if (buyer && buyer.doc_number) {
        data.des.cnpjCpf = buyer.doc_number.replace(/\D/g, '')
        data.des.contato = buyer.display_name
    }

    if (buyer.name) {
        data.des.nome = ecomUtils.fullName(buyer)
    }

    if (buyer && buyer.main_email) {
        data.des.email = buyer.main_email
    }

    if (buyer && Array.isArray(buyer.phones) && buyer.phones.length) {
        data.des.celular = buyer.phones[0].number
    }

    const requests = []
    if (order.shipping_lines) {
        order.shipping_lines.forEach(shippingLine => {
            const { package, invoices, app, from, to } = shippingLine
            if (app) {
                data.modalidade = Number(app.service_code)
            }
            // parse addresses and package info from shipping line object
            if (from) {
                if (seller_info) {
                    data.rem.nome = seller_info.name
                    data.rem.cnpjCpf = jadlog_contract.doc_number
                    data.rem.endereco = seller_info.street
                    data.rem.numero = String(seller_info.number) || 'S/N',
                        data.rem.compl = seller_info.complement,
                        data.rem.bairro = seller_info.borough,
                        data.rem.cidade = seller_info.city,
                        data.rem.uf = seller_info.province_code,
                        data.rem.cep = formatZipCode(from.zip || zip)
                }
            }

            if (to) {
                if (to.name) {
                    data.des.nome = to.name
                }
                data.des.endereco = to.street
                data.des.numero = String(to.number) || 'S/N',
                    data.des.compl = to.complement,
                    data.des.bairro = to.borough,
                    data.des.cidade = to.city,
                    data.des.uf = to.province_code,
                    data.des.cep = formatZipCode(to.zip)
            }
            if (invoices && invoices.length) {
                shippingLine.invoices.forEach(invoice => {
                    if (invoice.access_key && invoice.serial_number && invoice.number) {
                        data.dfe.push({
                            tpDocumento: 2,
                            cfop: seller_info.cfop || '6108',
                            serie: invoice.serial_number,
                            nrDoc: invoice.number,
                            danfeCte: invoice.access_key
                        })
                    }
                })
            }
            if (package && package.dimensions && package.weight) {
                const { dimensions, weight } = package
                const volumeObj = {}
                    ;[
                        ['largura', 'width'],
                        ['altura', 'height'],
                        ['comprimento', 'length']
                    ].forEach(([lado, side]) => {
                        volumeObj[lado] = dimensions[side].value
                    })
                volumeObj.peso = weight.value
                data.totPeso = weight.value
                data.volume.push(volumeObj)
            }
        })
    }
    if (data.dfe.length === 0) {
        data.dfe.push({
            tpDocumento: 0,
            nrDoc: `DEC${order.number || order._id}`
        })
    }
    console.log(`> Create tag for #${order._id}`)
    // send POST to generate JADLOG tag
    requests.push(axios.post(
        'https://www.jadlog.com.br/embarcador/api/pedido/incluir',
        data,
        {
            headers
        }
    ).then(({ data }) => {
        console.log(`>> Jadlog created tag #${storeId}`, data.status, data.shipmentId, order.number)
        if (data.etiqueta) {
            console.log('Log etiqueta', JSON.stringify(data.etiqueta))
        }
        if (data.shipmentId) {
            return appSdk.apiRequest(
                storeId,
                `/orders/${order._id}/shipping_lines/0.json`,
                'PATCH',
                {
                    "tracking_codes": [
                      {
                        "tag": "jadlog",
                        "code": data.shipmentId,
                        "link": `https://www.jadlog.com.br/tracking?cte=${data.shipmentId}&lang=`
                      }
                    ]
                },
                auth
            )
        }
        return response.data
    }).catch(error => {
        console.log('deu erro na etiqueta')
        debugAxiosError(error)
        throw error
    }))
    return Promise.all(requests)
}
