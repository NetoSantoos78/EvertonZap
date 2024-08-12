const { cardapioIndividual, cardapioCompleto, cardapioExtras, valorExtraEspecifico, sandubaCompleto, nomeExtraEspecifico,
    pizzasCompleto1, pizzasCompleto2, cardapioIndividualPizza1, nomeExtraEspecificoAcai, nomeExtraEspecificoBatatas,
    nomeExtraEspecificBebidas, nomeExtraEspecificoPizza2, nomeExtraEspecificoPizza1, valorExtraEspecificoAcai,
    valorExtraEspecificoBatatas, valorExtraEspecificoBebidas, valorExtraEspecificoPizza2, valorExtraEspecificoPizza1,
    cardapioExtrasAcai, cardapioExtrasBatatas, cardapioExtrasBebidas, cardapioExtrasPizza2, cardapioExtrasPizza1,
    acaiCompleto, batatasCompleto, bebidasCompleto, cardapioCompletoAcai, cardapioCompletoBatatas, cardapioCompletoBebidas,
    cardapioCompletoPizzas2, tamanhoEspecicoPizzaEspecial,precoExtraEspecificoBatatas, nomesTamanhoEspecicoPizzaTradicional, tamanhoEspecicoPizzaTradicional, opcoesAcai, cardapioExtrasBurguer, caldasAcai, cardapioCompletoPizzas1, cardapioIndividualAcai, cardapioIndividualBebidas, cardapioIndividualBatatas, cardapioIndividualPizza2, } = require('../comandos/cardapio.js');

const respostas = {
    menu: '',
    semAtendimento: 'Desculpa, não consegui entender o que você falou, por favor mande *"menu"* para iniciar seu pedido.',
    cardapio: 'Por favor, escolha o que deseja pedir.\n1️⃣ Sanduíches\n2️⃣ Pizzas\n3️⃣ Açaí\n4️⃣ Batata Frita\n5️⃣ Bebidas',
    cardapioAdd: 'Por favor, escolha o que deseja adicionar.\n1️⃣ Sanduíches\n2️⃣ Pizzas\n3️⃣ Açaí\n4️⃣ Batata Frita\n5️⃣ Bebidas',
    cardapiover: 'Por favor, escolha o que deseja ver.\n1️⃣ Sanduíches\n2️⃣ Pizzas\n3️⃣ Açaí\n4️⃣ Batata Frita\n5️⃣ Bebidas',
    adicionais: 'Deseja por algo a mais em seu sanduíche?\n1️⃣ Sim\n2️⃣ Não',
    maisUmAdicional: 'Deseja adicionar mais algo ao seu sanduíche?\n1️⃣ Sim\n2️⃣ Não',
    maisAlgoPedido: 'Quer complementar seu pedido com algo a mais? Ex.: Com uma batata, refrigerante, sorvete?\n1️⃣ Sim\n2️⃣ Não',
    pizzasTipos: 'Qual tipo de pizza deseja?\n1️⃣ Especiais\n2️⃣ Tradicionais',
    extraSanduba: 'Escolha abaixo o que deseja adicionar em seu sanduíche.',
    quantidade: 'Poderia me falar quantos desse lanche você deseja? EX: *1, 2, 3*',
    voltarMenu: 'Digite *"menu"* para voltar ao menu principal.',
    verCarrinho: 'Tudo certo, por favor, confira seu pedido e confirme se está tudo certo antes de confirmá-lo.',
    nomeperfil: '',
    carrinho: '',
    qualnome: ''
}
// #############################################################################################

async function pegarRetorno(numeroContato, client, parametros, ids, lanches, estado, carrinho) {
    const parametro = parametros;
    const id = ids;
    const lanche = lanches;
    switch (parametro) {
        case 1: // Sanduíches individuais
            try {
                const resultado = await sandubaIndividual(id);
                return `${resultado}`;
            } catch (error) {
                return `Erro ao obter o produto: ${error.message}`;
            }
        case 2: // Todos os Sanduíches e seus extras
            try {
                const resultado = await new Promise((resolve, reject) => {
                    cardapioCompleto((data, erro) => {
                        if (erro) {
                            reject(erro);
                        } else {
                            resolve(data);
                        }
                    });
                });
                return `${resultado}`;
            } catch (error) {
                return `Erro ao obter o cardápio: ${error.message}`;
            }
        case 3: // Pizza especial individual
            try {
                const resultado = await sandubaIndividualPizza1(id);
                return `${resultado}`;
            } catch (error) {
                return `Erro ao obter o produto: ${error.message}`;
            }
        case 4: // Pizza tradicional individual
            try {
                const resultado = await sandubaIndividualPizza2(id);
                return `${resultado}`;
            } catch (error) {
                return `Erro ao obter o produto: ${error.message}`;
            }
        case 5: // Bebidas individuais
            try {
                const resultado = await sandubaIndividualBebidas(id);
                return `${resultado}`;
            } catch (error) {
                return `Erro ao obter o produto: ${error.message}`;
            }
        case 6: // Batatas individuais
            try {
                const resultado = await sandubaIndividualBatatas(lanche);
                return `${resultado}`;
            } catch (error) {
                return `Erro ao obter o produto: ${error.message}`;
            }
        case 7: // Açaí individual
            try {
                const resultado = await sandubaIndividualAcai(id);
                return `${resultado}`;
            } catch (error) {
                return `Erro ao obter o produto: ${error.message}`;
            }
        case 8: // Todas as pizzas especiais
            try {
                const resultado = await new Promise((resolve, reject) => {
                    cardapioCompletoPizzas1((data, erro) => {
                        if (erro) {
                            reject(erro);
                        } else {
                            resolve(data);
                        }
                    });
                });
                return `${resultado}`;
            } catch (error) {
                return `Erro ao obter o cardápio: ${error.message}`;
            }
        case 9: // Todas as pizzas tradicionais
            try {
                const resultado = await new Promise((resolve, reject) => {
                    cardapioCompletoPizzas2((data, erro) => {
                        if (erro) {
                            reject(erro);
                        } else {
                            resolve(data);
                        }
                    });
                });
                return `${resultado}`;
            } catch (error) {
                return `Erro ao obter o cardápio: ${error.message}`;
            }
        case 10: // Todas as bebidas
            try {
                const resultado = await new Promise((resolve, reject) => {
                    cardapioCompletoBebidas((data, erro) => {
                        if (erro) {
                            reject(erro);
                        } else {
                            resolve(data);
                        }
                    });
                });
                return `${resultado}`;
            } catch (error) {
                return `Erro ao obter o cardápio: ${error.message}`;
            }
        case 11: // Todas as batatas
            try {
                const resultado = await new Promise((resolve, reject) => {
                    cardapioCompletoBatatas((data, erro) => {
                        if (erro) {
                            reject(erro);
                        } else {
                            resolve(data);
                        }
                    });
                });
                return `${resultado}`;
            } catch (error) {
                return `Erro ao obter o cardápio: ${error.message}`;
            }
        case 12: // Todos os açaí
            try {
                const resultado = await new Promise((resolve, reject) => {
                    cardapioCompletoAcai((data, erro) => {
                        if (erro) {
                            reject(erro);
                        } else {
                            resolve(data);
                        }
                    });
                });
                return `${resultado}`;
            } catch (error) {
                return `Erro ao obter o cardápio: ${error.message}`;
            }
        case 13: // Todos os burguer sem mostrar os adicionais
            try {
                const resultado = await new Promise((resolve, reject) => {
                    sandubaCompleto((data, erro) => {
                        if (erro) {
                            reject(erro);
                        } else {
                            resolve(data);
                        }
                    });
                });
                return `${resultado}`;
            } catch (error) {
                return `Erro ao obter o cardápio: ${error.message}`;
            }
        case 14: // Todas as pizzas especias sem mostrar os adicionais
            try {
                const resultado = await new Promise((resolve, reject) => {
                    pizzasCompleto1((data, erro) => {
                        if (erro) {
                            reject(erro);
                        } else {
                            resolve(data);
                        }
                    });
                });
                return `${resultado}`;
            } catch (error) {
                return `Erro ao obter o cardápio: ${error.message}`;
            }
        case 15: // Todas as pizzas tradicioais sem mostrar os adicionais
            try {
                const resultado = await new Promise((resolve, reject) => {
                    pizzasCompleto2((data, erro) => {
                        if (erro) {
                            reject(erro);
                        } else {
                            resolve(data);
                        }
                    });
                });
                return `${resultado}`;
            } catch (error) {
                return `Erro ao obter o cardápio: ${error.message}`;
            }
        case 16: // Todas as batatas sem mostrar os adicionais
            try {
                const resultado = await new Promise((resolve, reject) => {
                    batatasCompleto((data, erro) => {
                        if (erro) {
                            reject(erro);
                        } else {
                            resolve(data);
                        }
                    });
                });
                return `${resultado}`;
            } catch (error) {
                return `Erro ao obter o cardápio: ${error.message}`;
            }
        case 17: // Todos os açaí sme mostrar adicionais
            try {
                const resultado = await new Promise((resolve, reject) => {
                    acaiCompleto((data, erro) => {
                        if (erro) {
                            reject(erro);
                        } else {
                            resolve(data);
                        }
                    });
                });
                return `${resultado}`;
            } catch (error) {
                return `Erro ao obter o cardápio: ${error.message}`;
            }
        case 18: // Valor dos extra dos burguers
            try {
                const resultado = await cardapioExtras(id);
                return `${resultado}`;
            } catch (error) {
                return `Erro ao obter o produto: ${error.message}`;
            }
        case 19: // Valor dos tamanhos das pizzas especiais
            try {
                const resultado = await cardapioExtrasPizza1(id);
                return `${resultado}`;
            } catch (error) {
                return `Erro ao obter o produto: ${error.message}`;
            }
        case 20: // Valor dos tamanhos das pizzas tradicionais
            try {
                const resultado = await cardapioExtrasPizza2(id);
                return `${resultado}`;
            } catch (error) {
                return `Erro ao obter o produto: ${error.message}`;
            }
        case 21: // Nome dos adicionais das batatas
            try {
                const extras = await cardapioExtrasBatatas(lanche);
                return `${extras}`;
            } catch (error) {
                return `Erro ao obter o produto: ${error.message}`;
            }
        case 22: // Valor dos extras dos açaí
            try {
                const resultado = await cardapioExtrasAcai(id);
                return `${resultado}`;
            } catch (error) {
                return `Erro ao obter o produto: ${error.message}`;
            }
        case 23: // Valor de um extra especifico de um sanduiche
            try {
                const resultado = await valorExtraEspecifico(lanche, id);
                return `${resultado}`;
            } catch (error) {
                return `Erro ao obter o produto: ${error.message}`;
            }
        case 24: // Valor de um tamanho das pizza especial
            try {
                const resultado = await valorExtraEspecificoPizza1(lanche, id);
                return `Valor: ${resultado}`;
            } catch (error) {
                return `Erro ao obter o produto: ${error.message}`;
            }
        case 25: // Valor de um tamanho das pizzas tradicionais
            try {
                const resultado = await valorExtraEspecificoPizza2(lanche, id);
                return `Valor: ${resultado}`;
            } catch (error) {
                return `Erro ao obter o produto: ${error.message}`;
            }
        case 26: // Valor do açaí
            try {
                const resultado = await valorExtraEspecificoAcai(lanche, id);
                return `Valor: ${resultado}`;
            } catch (error) {
                return `Erro ao obter o produto: ${error.message}`;
            }
        case 27: // Nome de um extra especifico de um burguer
            try {
                const resultado = await nomeExtraEspecifico(lanche, id);
                return `${resultado}`;
            } catch (error) {
                return `Erro ao obter o produto: ${error.message}`;
            }
        case 28: // Nome de um extra especifico das batatas
            try {
                const resultado = await nomeExtraEspecificoBatatas(lanche, id);
                return `${resultado}`;
            } catch (error) {
                return `Erro ao obter o produto: ${error.message}`;
            }
        case 29: // Nome de um extra especifico dos açaí
            try {
                const resultado = await nomeExtraEspecificoAcai(lanche, id);
                return `Quantidade de adicionais do açaí escolhido: ${resultado}`;
            } catch (error) {
                return `Erro ao obter o produto: ${error.message}`;
            }
        case 30: // Quantidade dos complementos de cada tamanho do açaí
            try {
                const resultado = await opcoesAcai(lanche, id);
                if (resultado && typeof resultado === 'object') {
                    const { nomeExtra, nomeItem } = resultado;
                    return `Item: ${nomeItem}, ${nomeExtra}`;
                } else {
                    return `Resultado inesperado: ${resultado}`;
                }
            } catch (error) {
                return `Erro ao obter o produto: ${error.message}`;
            }
        case 31: // Quantidade das caldas do açaí
            try {
                const resultado = await caldasAcai(lanche, id);
                if (resultado && typeof resultado === 'object') {
                    const { nomeItem, caldaEscolhida } = resultado;
                    return `${nomeItem}, Calda: ${caldaEscolhida}`;
                } else {
                    return `Resultado inesperado: ${resultado}`;
                }
            } catch (error) {
                return `Erro ao obter o produto: ${error.message}`;
            }
        case 32: // Valor de um burguer
            try {
                const resultado = await valorsandubaIndividual(lanche);
                return `${resultado}`;
            } catch (error) {
                return `Erro ao obter o produto: ${error.message}`;
            }
        case 33: // Nomes dos extras burguers
            try {
                const resultado = await cardapioExtrasBurguer(lanche);
                return `${resultado}`;
            } catch (error) {
                return `Erro ao obter o produto: ${error.message}`;
            }
        case 34: // Pegar valor do tamanho de uma pizza especial
            try {
                const resultado = await tamanhoEspecicoPizzaEspecial(lanche, id);
                return `${resultado}`;
            } catch (error) {
                return `Erro ao obter o produto: ${error.message}`;
            }
        case 35: // Pegar valor do tamanho de uma pizza tradicional
            try {
                const resultado = await tamanhoEspecicoPizzaTradicional(lanche, id);
                return `${resultado}`;
            } catch (error) {
                return `Erro ao obter o produto: ${error.message}`;
            }
        case 36: // Nomes dos tamanhos das pizzas
            try {
                const resultado = await nomesTamanhoEspecicoPizzaTradicional(lanche, id);
                return `${resultado}`;
            } catch (error) {
                return `Erro ao obter o produto: ${error.message}`;
            }
        case 37: // Valor da batata
            try {
                const resultado = await precoExtraEspecificoBatatas(lanche);
                return `${resultado}`;
            } catch (error) {
                return `Erro ao obter o produto: ${error.message}`;
            }
        default:
            return `[!] Parâmetro de seleção desconhecido. :${parametro, id, lanche}`;
    }
}
async function sandubaIndividual(idproduto) {
    try {
        const resultado = await cardapioIndividual(idproduto);
        return `${resultado.produtoNome}`;
    } catch (error) {
        throw new Error('[!] Deu erro na busca, o produto não foi encontrado');
    }
}
async function valorsandubaIndividual(idproduto) {
    try {
        const resultado = await cardapioIndividual(idproduto);
        return `${resultado.valor}`;
    } catch (error) {
        throw new Error('[!] Deu erro na busca, o produto não foi encontrado');
    }
}
async function sandubaIndividualPizza1(idproduto) {
    try {
        const resultado = await cardapioIndividualPizza1(idproduto);
        return `${resultado.produtoNome}`;
    } catch (error) {
        throw new Error('[!] Deu erro na busca, o produto não foi encontrado');
    }
}
async function sandubaIndividualPizza2(idproduto) {
    try {
        const resultado = await cardapioIndividualPizza2(idproduto);
        return `${resultado.produtoNome}`;
    } catch (error) {
        throw new Error('[!] Deu erro na busca, o produto não foi encontrado');
    }
}
async function sandubaIndividualBebidas(idproduto) {
    try {
        const resultado = await cardapioIndividualBebidas(idproduto);
        return `${resultado.produtoNome}`;
    } catch (error) {
        throw new Error('[!] Deu erro na busca, o produto não foi encontrado');
    }
}
async function sandubaIndividualBatatas(idproduto) {
    try {
        const resultado = await cardapioIndividualBatatas(idproduto);
        return `${resultado.produtoNome}`;
    } catch (error) {
        throw new Error('[!] Deu erro na busca, o produto não foi encontrado');
    }
}
async function sandubaIndividualAcai(idproduto) {
    try {
        const resultado = await cardapioIndividualAcai(idproduto);
        return `${resultado.produtoNome}`;
    } catch (error) {
        throw new Error('[!] Deu erro na busca, o produto não foi encontrado');
    }
}





module.exports = {
    pegarRetorno
}
