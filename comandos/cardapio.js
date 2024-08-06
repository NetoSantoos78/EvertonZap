const fs = require('fs').promises;

// Função assíncrona para ler o arquivo JSON
async function lerCardapio(nomeArquivo) {
    try {
        const data = await fs.readFile(nomeArquivo, 'utf8');
        const cardapio = JSON.parse(data);
        return cardapio;
    } catch (error) {
        throw error;
    }
}
async function lerCardapioPizza1(nomeArquivo) {
    try {
        const data = await fs.readFile(nomeArquivo, 'utf8');
        const cardapio = JSON.parse(data);
        return cardapio;
    } catch (error) {
        throw error;
    }
}
async function lerCardapioPizza2(nomeArquivo) {
    try {
        const data = await fs.readFile(nomeArquivo, 'utf8');
        const cardapio = JSON.parse(data);
        return cardapio;
    } catch (error) {
        throw error;
    }
}


// Caminho para o arquivo JSON
const caminhoArquivo = './cardapio/burguers.json';
const caminhoArquivoPizza1 = './cardapio/pizzaEspecial.json';
const caminhoArquivoPizza2 = './cardapio/pizzaTradicional.json';
const caminhoArquivoBebidas = './cardapio/bebidas.json';
const caminhoArquivoBatatas = './cardapio/batatas.json';
const caminhoArquivoAcai = './cardapio/acai.json';

async function cardapioIndividual(lanche) {
    try {
        const cardapio = await lerCardapio(caminhoArquivo);
        if (cardapio) {
            const produto = cardapio[lanche];
            if (produto) {
                const produtoNome = produto.produto;
                const ingredientes = produto.ingredientes;
                const valor = produto.valor;
                return { produtoNome, ingredientes, valor };
            } else {
                throw new Error("Índice não encontrado: " + lanche);
            }
        } else {
            throw new Error("Erro ao ler o cardápio.");
        }
    } catch (error) {
        throw error;
    }
}
async function cardapioIndividualPizza1(lanche) {
    try {
        const cardapio = await lerCardapio(caminhoArquivo);
        if (cardapio) {
            const produto = cardapio[lanche];
            if (produto) {
                const produtoNome = produto.produto;
                const ingredientes = produto.ingredientes;
                const valor = produto.valor;
                return { produtoNome, ingredientes, valor };
            } else {
                throw new Error("Índice não encontrado: " + lanche);
            }
        } else {
            throw new Error("Erro ao ler o cardápio.");
        }
    } catch (error) {
        throw error;
    }
}
async function cardapioIndividualPizza2(lanche) {
    try {
        const cardapio = await lerCardapio(caminhoArquivo);
        if (cardapio) {
            const produto = cardapio[lanche];
            if (produto) {
                const produtoNome = produto.produto;
                const ingredientes = produto.ingredientes;
                const valor = produto.valor;
                return { produtoNome, ingredientes, valor };
            } else {
                throw new Error("Índice não encontrado: " + lanche);
            }
        } else {
            throw new Error("Erro ao ler o cardápio.");
        }
    } catch (error) {
        throw error;
    }
}
async function cardapioIndividualBebidas(lanche) {
    try {
        const cardapio = await lerCardapio(caminhoArquivoBebidas);
        if (cardapio) {
            const produto = cardapio[lanche];
            if (produto) {
                const produtoNome = produto.produto;
                const ingredientes = produto.ingredientes;
                const valor = produto.valor;
                return { produtoNome, ingredientes, valor };
            } else {
                throw new Error("Índice não encontrado: " + lanche);
            }
        } else {
            throw new Error("Erro ao ler o cardápio.");
        }
    } catch (error) {
        throw error;
    }
}
async function cardapioIndividualBatatas(lanche) {
    try {
        const cardapio = await lerCardapio(caminhoArquivoBatatas);
        if (cardapio) {
            const produto = cardapio[lanche];
            if (produto) {
                const produtoNome = produto.produto;
                const ingredientes = produto.ingredientes;
                const valor = produto.valor;
                return { produtoNome, ingredientes, valor };
            } else {
                throw new Error("Índice não encontrado: " + lanche);
            }
        } else {
            throw new Error("Erro ao ler o cardápio.");
        }
    } catch (error) {
        throw error;
    }
}
async function cardapioIndividualAcai(lanche) {
    try {
        const cardapio = await lerCardapio(caminhoArquivoAcai);
        if (cardapio) {
            const produto = cardapio[lanche];
            if (produto) {
                const produtoNome = produto.produto;
                const ingredientes = produto.ingredientes;
                const valor = produto.valor;
                return { produtoNome, ingredientes, valor };
            } else {
                throw new Error("Índice não encontrado: " + lanche);
            }
        } else {
            throw new Error("Erro ao ler o cardápio.");
        }
    } catch (error) {
        throw error;
    }
}
//####################################
async function cardapioCompleto(callback) {
    try {
        const cardapio = await lerCardapio(caminhoArquivo);
        if (cardapio) {
            let output = "";
            Object.keys(cardapio).forEach((indice, i) => {
                const emoji = emojisNumeros[i];
                const { produto, valor, ingredientes } = cardapio[indice];
                output += `${emoji} ${produto}\n   ❯ ${ingredientes.join(", ")}\n   ❯ R$: ${valor}\n\n`;
            });
            callback(output, null);
        } else {
            callback(null, "Erro ao ler o cardápio.");
        }
    } catch (error) {
        callback(null, error);
    }
}
async function cardapioCompletoPizzas1(callback) {
    try {
        const cardapio = await lerCardapio(caminhoArquivoPizza1);
        if (cardapio) {
            let output = "";
            Object.keys(cardapio).forEach((indice, i) => {
                const emoji = emojisNumeros[i];
                const { produto, valor, sabores } = cardapio[indice];
                output += `${emoji} ${produto}\n   ❯ ${sabores.join(", ")}\n   ❯ ${valor}\n\n`;
            });
            callback(output, null);
        } else {
            callback(null, "Erro ao ler o cardápio.");
        }
    } catch (error) {
        callback(null, error);
    }
}
async function cardapioCompletoPizzas2(callback) {
    try {
        const cardapio = await lerCardapio(caminhoArquivoPizza2);
        if (cardapio) {
            let output = "";
            Object.keys(cardapio).forEach((indice, i) => {
                const emoji = emojisNumeros[i];
                const { produto, valor, sabores } = cardapio[indice];
                output += `${emoji} ${produto}\n   ❯ ${sabores.join(", ")}\n   ❯ R$: ${valor}\n\n`;
            });
            callback(output, null);
        } else {
            callback(null, "Erro ao ler o cardápio.");
        }
    } catch (error) {
        callback(null, error);
    }
}
async function cardapioCompletoBebidas(callback) {
    try {
        const cardapio = await lerCardapio(caminhoArquivoBebidas);
        if (cardapio) {
            let output = "";
            Object.keys(cardapio).forEach((indice, i) => {
                const emoji = emojisNumeros[i];
                const { produto, valor, ingredientes } = cardapio[indice];
                output += `${emoji} ${produto}\n   ❯ R$: ${valor}\n`;
            });
            callback(output, null);
        } else {
            callback(null, "Erro ao ler o cardápio.");
        }
    } catch (error) {
        callback(null, error);
    }
}
async function cardapioCompletoBatatas(callback) {
    try {
        const cardapio = await lerCardapio(caminhoArquivoBatatas);
        if (cardapio) {
            let output = "";
            Object.keys(cardapio).forEach((indice, i) => {
                const emoji = emojisNumeros[i];
                const { produto, valor, adicionais } = cardapio[indice];
                output += `${emoji} ${produto}\n   ❯ ${adicionais.join(", ")}\n   ❯ R$: ${valor}\n`;
            });
            callback(output, null);
        } else {
            callback(null, "Erro ao ler o cardápio.");
        }
    } catch (error) {
        callback(null, error);
    }
}
async function cardapioCompletoAcai(callback) {
    try {
        const cardapio = await lerCardapio(caminhoArquivoAcai);
        if (cardapio) {
            let output = "";
            Object.keys(cardapio).forEach((indice, i) => {
                const emoji = emojisNumeros[i];
                const { produto, valor, complementos } = cardapio[indice];
                const complementosTexto = complementos ? complementos.join(", ") : "Sem complementos";
                output += `${emoji} *${produto}*\n   *❯* *${complementosTexto}*\n   *❯* *R$:* _${valor}_\n\n`;
            });
            callback(output, null);
        } else {
            callback(null, "Erro ao ler o cardápio.");
        }
    } catch (error) {
        callback(null, error);
    }
}


//####################################
async function sandubaCompleto(callback) {
    try {
        const cardapio = await lerCardapio(caminhoArquivo);
        if (cardapio) {
            let output = "";
            Object.keys(cardapio).forEach((indice, i) => {
                const emoji = emojisNumeros[i];
                const { produto, valor, ingredientes } = cardapio[indice];
                output += `${emoji} ${produto}\n   ❯ R$: ${valor}\n\n`;
            });
            callback(output, null);
        } else {
            callback(null, "Erro ao ler o cardápio.");
        }
    } catch (error) {
        callback(null, error);
    }
}
async function pizzasCompleto1(callback) {
    try {
        const cardapio = await lerCardapio(caminhoArquivoPizza1);
        if (cardapio) {
            let output = "";
            output += `*Aqui estão algumas das pizzas mais especiais que você já experimentou.*\n\n`;
            Object.keys(cardapio).forEach((indice, i) => {
                const emoji = emojisNumeros[i];
                const { produto, valor, ingredientes } = cardapio[indice];
                output += `${emoji} ${produto}\n`;
            });
            output += `\n*Pequena: R$:28,00*\n*Média R$:38,00*\n*Grande: R$:48,00*`;
            callback(output, null);
        } else {
            callback(null, "Erro ao ler o cardápio.");
        }
    } catch (error) {
        callback(null, error);
    }
}
async function pizzasCompleto2(callback) {
    try {
        const cardapio = await lerCardapio(caminhoArquivoPizza2);
        if (cardapio) {
            let output = "";
            output += `*Aqui estão algumas das pizzas mais especiais que você já experimentou.*\n\n`;
            Object.keys(cardapio).forEach((indice, i) => {
                const emoji = emojisNumeros[i];
                const { produto, valor, ingredientes } = cardapio[indice];
                output += `${emoji} ${produto}\n`;
            });
            output += `\nPequena: R$:20,00\nMédia R$:30,00\nGrande: R$:40,00`;
            callback(output, null);
        } else {
            callback(null, "Erro ao ler o cardápio.");
        }
    } catch (error) {
        callback(null, error);
    }
}
async function bebidasCompleto(callback) {
    try {
        const cardapio = await lerCardapio(caminhoArquivoBebidas);
        if (cardapio) {
            let output = "";
            Object.keys(cardapio).forEach((indice, i) => {
                const emoji = emojisNumeros[i];
                const { produto, valor, ingredientes } = cardapio[indice];
                output += `${emoji} ${produto}\n   ❯ R$: ${valor}\n\n`;
            });
            callback(output, null);
        } else {
            callback(null, "Erro ao ler o cardápio.");
        }
    } catch (error) {
        callback(null, error);
    }
}
async function batatasCompleto(callback) {
    try {
        const cardapio = await lerCardapio(caminhoArquivoBatatas);
        if (cardapio) {
            let output = "";
            Object.keys(cardapio).forEach((indice, i) => {
                const emoji = emojisNumeros[i];
                const { produto, valor, ingredientes } = cardapio[indice];
                output += `${emoji} ${produto}\n   ❯ R$: ${valor}\n\n`;
            });
            callback(output, null);
        } else {
            callback(null, "Erro ao ler o cardápio.");
        }
    } catch (error) {
        callback(null, error);
    }
}
async function acaiCompleto(callback) {
    try {
        const cardapio = await lerCardapio(caminhoArquivoAcai);
        if (cardapio) {
            let output = "";
            Object.keys(cardapio).forEach((indice, i) => {
                const emoji = emojisNumeros[i];
                const { produto, valor, ingredientes } = cardapio[indice];
                output += `${emoji} ${produto}\n   ❯ R$: ${valor}\n\n`;
            });
            callback(output, null);
        } else {
            callback(null, "Erro ao ler o cardápio.");
        }
    } catch (error) {
        callback(null, error);
    }
}

//####################################
async function cardapioExtras(lanche) {
    try {
        const cardapio = await lerCardapio(caminhoArquivo);
        if (cardapio) {
            const produto = cardapio[lanche];
            if (produto) {
                let extrasString = '';
                const extrasPrecos = produto.extrasPrecos;

                // Iterar sobre os valores dos preços dos extras
                Object.values(extrasPrecos).forEach((preco, index) => {
                    const numeroEmoji = emojisNumeros[index]; // Obter emoji do número
                    extrasString += `${numeroEmoji} R$ ${preco}\n`;
                });

                return extrasString;
            } else {
                throw new Error("Índice não encontrado: " + lanche);
            }
        } else {
            throw new Error("Erro ao ler o cardápio.");
        }
    } catch (error) {
        throw error;
    }
}
async function cardapioExtrasBurguer(lanche) {
    try {
        const cardapio = await lerCardapio(caminhoArquivo);
        if (cardapio) {
            const produto = cardapio[lanche];
            if (produto) {
                let extrasString = '';
                const extrasNome = produto.extras;
                const extrasPrecos = produto.extrasPrecos;

                // Supondo que extrasNome e extrasPrecos sejam objetos com as mesmas chaves
                Object.keys(extrasPrecos).forEach((extra, index) => {
                    const nome = extrasNome[extra]; // Nome do extra
                    const preco = extrasPrecos[extra]; // Preço do extra
                    const numeroEmoji = emojisNumeros[index]; // Obter emoji do número
                    extrasString += `${numeroEmoji} ${nome}: R$ ${preco}\n`;
                });

                return extrasString;
            } else {
                throw new Error("Índice não encontrado: " + lanche);
            }
        } else {
            throw new Error("Erro ao ler o cardápio.");
        }
    } catch (error) {
        throw error;
    }
}

async function cardapioExtrasPizza1(lanche) {
    try {
        const cardapio = await lerCardapio(caminhoArquivoPizza1);
        if (cardapio) {
            const produto = cardapio[lanche];
            if (produto) {
                let extrasString = '';
                const extrasPrecos = produto.tam;
                Object.keys(extrasPrecos).forEach((extra, index) => {
                    extrasString += `${extrasPrecos[extra]}\n`;
                });
                return extrasString;
            } else {
                throw new Error("Índice não encontrado: " + lanche);
            }
        } else {
            throw new Error("Erro ao ler o cardápio.");
        }
    } catch (error) {
        throw error;
    }
}
async function cardapioExtrasPizza2(lanche) {
    try {
        const cardapio = await lerCardapio(caminhoArquivoPizza2);
        if (cardapio) {
            const produto = cardapio[lanche];
            if (produto) {
                let extrasString = '';
                const extrasPrecos = produto.tam;
                Object.keys(extrasPrecos).forEach((extra, index) => {
                    const numeroEmoji = emojisNumeros[index]; // Obter emoji do número
                    extrasString += `R$ ${extrasPrecos[extra]}\n`;
                });
                return extrasString;
            } else {
                throw new Error("Índice não encontrado: " + lanche);
            }
        } else {
            throw new Error("Erro ao ler o cardápio.");
        }
    } catch (error) {
        throw error;
    }
}
async function cardapioExtrasBebidas(lanche) {
    try {
        const cardapio = await lerCardapio(caminhoArquivoBebidas);
        if (cardapio) {
            const produto = cardapio[lanche];
            if (produto) {
                let extrasString = '';
                const extrasPrecos = produto.extrasPrecos;
                Object.keys(extrasPrecos).forEach((extra, index) => {
                    const numeroEmoji = emojisNumeros[index]; // Obter emoji do número
                    extrasString += `${numeroEmoji} ${extra}: R$ ${extrasPrecos[extra]}\n`;
                });
                return extrasString;
            } else {
                throw new Error("Índice não encontrado: " + lanche);
            }
        } else {
            throw new Error("Erro ao ler o cardápio.");
        }
    } catch (error) {
        throw error;
    }
}
async function cardapioExtrasBatatas(lanche) {
    try {
        const cardapio = await lerCardapio(caminhoArquivoBatatas);
        if (cardapio) {
            const produto = cardapio[lanche];
            if (produto) {
                let extrasString = '';
                const extrasAdicionais = produto.adicionais;
                Object.keys(extrasAdicionais).forEach((extra, index) => {
                    const numeroEmoji = emojisNumeros[index]; // Obter emoji do número
                    extrasString += `${extrasAdicionais[extra]}\n`;
                });
                return extrasString;
            } else {
                throw new Error("Índice não encontrado: " + lanche);
            }
        } else {
            throw new Error("Erro ao ler o cardápio.");
        }
    } catch (error) {
        throw error;
    }
}
async function cardapioExtrasAcai(lanche) {
    try {
        const cardapio = await lerCardapio(caminhoArquivoAcai);
        if (cardapio) {
            const produto = cardapio[lanche];
            if (produto) {
                let extrasString = '';
                const extrasComplementos = produto.complementos;
                Object.keys(extrasComplementos).forEach((extra, index) => {
                    const numeroEmoji = emojisNumeros[index]; // Obter emoji do número
                    extrasString += `${numeroEmoji} ${extra}: R$ ${extrasComplementos[extra]}\n`;
                });
                return extrasString;
            } else {
                throw new Error("Índice não encontrado: " + lanche);
            }
        } else {
            throw new Error("Erro ao ler o cardápio.");
        }
    } catch (error) {
        throw error;
    }
}

//####################################
async function valorExtraEspecifico(lanches, indiceExtras) {
    const indiceExtra = indiceExtras;
    const lanche = lanches;
    try {
        const cardapio = await lerCardapio(caminhoArquivo);
        if (cardapio) {
            const produto = cardapio[lanche];
            if (produto) {
                const extrasPrecos = Object.values(produto.extrasPrecos); // Obtém os preços dos extras
                const valorExtra = extrasPrecos[indiceExtra - 1]; // Subtrai 1 para obter o índice correto
                if (valorExtra) {
                    return valorExtra;
                } else {
                    throw new Error(`Extra no índice '${indiceExtra}' não encontrado no lanche ${lanche}.`);
                }
            } else {
                throw new Error("Lanche não encontrado: " + lanche);
            }
        } else {
            throw new Error("Erro ao ler o cardápio.");
        }
    } catch (error) {
        throw error;
    }
}
async function valorExtraEspecificoPizza1(lanches, indiceExtras) {
    const indiceExtra = indiceExtras;
    const lanche = lanches;
    try {
        const cardapio = await lerCardapio(caminhoArquivoPizza1);
        if (cardapio) {
            const produto = cardapio[lanche];
            if (produto) {
                const extrasPrecos = Object.values(produto.tam); // Obtém os preços dos extras
                const valorExtra = extrasPrecos[indiceExtra - 1]; // Subtrai 1 para obter o índice correto
                if (valorExtra) {
                    return valorExtra;
                } else {
                    throw new Error(`Extra no índice '${indiceExtra}' não encontrado no lanche ${lanche}.`);
                }
            } else {
                throw new Error("Lanche não encontrado: " + lanche);
            }
        } else {
            throw new Error("Erro ao ler o cardápio.");
        }
    } catch (error) {
        throw error;
    }
}
async function valorExtraEspecificoPizza2(lanches, indiceExtras) {
    const indiceExtra = indiceExtras;
    const lanche = lanches;
    try {
        const cardapio = await lerCardapio(caminhoArquivoPizza2);
        if (cardapio) {
            const produto = cardapio[lanche];
            if (produto) {
                const extrasPrecos = Object.values(produto.tam); // Obtém os preços dos extras
                const valorExtra = extrasPrecos[indiceExtra - 1]; // Subtrai 1 para obter o índice correto
                if (valorExtra) {
                    return valorExtra;
                } else {
                    throw new Error(`Extra no índice '${indiceExtra}' não encontrado no lanche ${lanche}.`);
                }
            } else {
                throw new Error("Lanche não encontrado: " + lanche);
            }
        } else {
            throw new Error("Erro ao ler o cardápio.");
        }
    } catch (error) {
        throw error;
    }
}
async function valorExtraEspecificoBebidas(lanches, indiceExtras) {
    const indiceExtra = indiceExtras;
    const lanche = lanches;
    try {
        const cardapio = await lerCardapio(caminhoArquivoBebidas);
        if (cardapio) {
            const produto = cardapio[lanche];
            if (produto) {
                const extrasPrecos = Object.values(produto.extrasPrecos); // Obtém os preços dos extras
                const valorExtra = extrasPrecos[indiceExtra - 1]; // Subtrai 1 para obter o índice correto
                if (valorExtra) {
                    return valorExtra;
                } else {
                    throw new Error(`Extra no índice '${indiceExtra}' não encontrado no lanche ${lanche}.`);
                }
            } else {
                throw new Error("Lanche não encontrado: " + lanche);
            }
        } else {
            throw new Error("Erro ao ler o cardápio.");
        }
    } catch (error) {
        throw error;
    }
}
async function valorExtraEspecificoBatatas(lanches, indiceExtras) {
    const indiceExtra = indiceExtras;
    const lanche = lanches;
    try {
        const cardapio = await lerCardapio(caminhoArquivoBatatas);
        if (cardapio) {
            const produto = cardapio[lanche];
            if (produto) {
                const extrasPrecos = Object.values(produto.extrasPrecos); // Obtém os preços dos extras
                const valorExtra = extrasPrecos[indiceExtra - 1]; // Subtrai 1 para obter o índice correto
                if (valorExtra) {
                    return valorExtra;
                } else {
                    throw new Error(`Extra no índice '${indiceExtra}' não encontrado no lanche ${lanche}.`);
                }
            } else {
                throw new Error("Lanche não encontrado: " + lanche);
            }
        } else {
            throw new Error("Erro ao ler o cardápio.");
        }
    } catch (error) {
        throw error;
    }
}
async function valorExtraEspecificoAcai(lanches, indiceExtras) {
    const indiceExtra = indiceExtras;
    const lanche = lanches;
    try {
        const cardapio = await lerCardapio(caminhoArquivoAcai);
        if (cardapio) {
            const produto = cardapio[lanche];
            if (produto) {
                const extrasPrecos = Object.values(produto.complementos); // Obtém os preços dos extras
                const valorExtra = extrasPrecos[indiceExtra - 1]; // Subtrai 1 para obter o índice correto
                if (valorExtra) {
                    return valorExtra;
                } else {
                    throw new Error(`Extra no índice '${indiceExtra}' não encontrado no lanche ${lanche}.`);
                }
            } else {
                throw new Error("Lanche não encontrado: " + lanche);
            }
        } else {
            throw new Error("Erro ao ler o cardápio.");
        }
    } catch (error) {
        throw error;
    }
}

//####################################
async function nomeExtraEspecifico(lanches, indiceExtras) {
    const indiceExtra = indiceExtras;
    const lanche = lanches;
    try {
        const cardapio = await lerCardapio(caminhoArquivo);
        if (cardapio) {
            const produto = cardapio[lanche];
            if (produto) {
                const nomeExtra = produto.extras[indiceExtra - 1]; // Obtém diretamente o nome do extra
                if (nomeExtra) {
                    return nomeExtra; // Retorna o nome do extra como string
                } else {
                    throw new Error(`Extra no índice '${indiceExtra}' não encontrado no lanche ${lanche}.`);
                }
            } else {
                throw new Error("Lanche não encontrado: " + lanche);
            }
        } else {
            throw new Error("Erro ao ler o cardápio.");
        }
    } catch (error) {
        throw error;
    }
}
async function nomeExtraEspecificoPizza1(lanches, indiceExtras) {
    const indiceExtra = indiceExtras;
    const lanche = lanches;
    try {
        const cardapio = await lerCardapio(caminhoArquivoPizza1);
        if (cardapio) {
            const produto = cardapio[lanche];
            if (produto) {
                const extrasNomes = Object.values(produto.extras); // Obtém os nomes dos extras
                const nomeItem = produto.produto; // Obtém o nome do item do cardápio
                const nomeExtra = extrasNomes[indiceExtra - 1]; // Subtrai 1 para obter o índice correto
                if (nomeExtra) {
                    return { nomeExtra, nomeItem };
                } else {
                    throw new Error(`Extra no índice '${indiceExtra}' não encontrado no lanche ${lanche}.`);
                }
            } else {
                throw new Error("Lanche não encontrado: " + lanche);
            }
        } else {
            throw new Error("Erro ao ler o cardápio.");
        }
    } catch (error) {
        throw error;
    }
}
async function nomeExtraEspecificoPizza2(lanches, indiceExtras) {
    const indiceExtra = indiceExtras;
    const lanche = lanches;
    try {
        const cardapio = await lerCardapio(caminhoArquivoPizza2);
        if (cardapio) {
            const produto = cardapio[lanche];
            if (produto) {
                const extrasNomes = Object.values(produto.extras); // Obtém os nomes dos extras
                const nomeItem = produto.produto; // Obtém o nome do item do cardápio
                const nomeExtra = extrasNomes[indiceExtra - 1]; // Subtrai 1 para obter o índice correto
                if (nomeExtra) {
                    return { nomeExtra, nomeItem };
                } else {
                    throw new Error(`Extra no índice '${indiceExtra}' não encontrado no lanche ${lanche}.`);
                }
            } else {
                throw new Error("Lanche não encontrado: " + lanche);
            }
        } else {
            throw new Error("Erro ao ler o cardápio.");
        }
    } catch (error) {
        throw error;
    }
}
async function nomeExtraEspecificBebidas(lanches, indiceExtras) {
    const indiceExtra = indiceExtras;
    const lanche = lanches;
    try {
        const cardapio = await lerCardapio(caminhoArquivoBebidas);
        if (cardapio) {
            const produto = cardapio[lanche];
            if (produto) {
                const extrasNomes = Object.values(produto.extras); // Obtém os nomes dos extras
                const nomeItem = produto.produto; // Obtém o nome do item do cardápio
                const nomeExtra = extrasNomes[indiceExtra - 1]; // Subtrai 1 para obter o índice correto
                if (nomeExtra) {
                    return { nomeExtra, nomeItem };
                } else {
                    throw new Error(`Extra no índice '${indiceExtra}' não encontrado no lanche ${lanche}.`);
                }
            } else {
                throw new Error("Lanche não encontrado: " + lanche);
            }
        } else {
            throw new Error("Erro ao ler o cardápio.");
        }
    } catch (error) {
        throw error;
    }
}
async function nomeExtraEspecificoBatatas(lanches, indiceExtras) {
    const indiceExtra = indiceExtras;
    const lanche = lanches;
    try {
        const cardapio = await lerCardapio(caminhoArquivoBatatas);
        if (cardapio) {
            const produto = cardapio[lanche];
            if (produto) {
                const extrasNomes = Object.values(produto.adicionais); // Obtém os nomes dos extras
                const nomeItem = produto.produto; // Obtém o nome do item do cardápio
                const nomeExtra = extrasNomes[indiceExtra - 1]; // Subtrai 1 para obter o índice correto
                if (nomeExtra) {
                    return { nomeExtra, nomeItem };
                } else {
                    throw new Error(`Extra no índice '${indiceExtra}' não encontrado no lanche ${lanche}.`);
                }
            } else {
                throw new Error("Lanche não encontrado: " + lanche);
            }
        } else {
            throw new Error("Erro ao ler o cardápio.");
        }
    } catch (error) {
        throw error;
    }
}
async function nomeExtraEspecificoAcai(lanches, indiceExtras) {
    const indiceExtra = indiceExtras;
    const lanche = lanches;
    try {
        const cardapio = await lerCardapio(caminhoArquivoAcai);
        if (cardapio) {
            const produto = cardapio[lanche];
            if (produto) {
                const extrasNomes = Object.values(produto.complementos); // Obtém os nomes dos extras
                const nomeItem = produto.produto; // Obtém o nome do item do cardápio
                const nomeExtra = extrasNomes[indiceExtra - 1]; // Subtrai 1 para obter o índice correto
                if (nomeExtra) {
                    return { nomeExtra, nomeItem };
                } else {
                    throw new Error(`Extra no índice '${indiceExtra}' não encontrado no lanche ${lanche}.`);
                }
            } else {
                throw new Error("Lanche não encontrado: " + lanche);
            }
        } else {
            throw new Error("Erro ao ler o cardápio.");
        }
    } catch (error) {
        throw error;
    }
}

//####################################
async function opcoesAcai(lanches, indiceExtras) {
    const indiceExtra = indiceExtras;
    const lanche = lanches;
    try {
        const cardapio = await lerCardapio(caminhoArquivoAcai);
        if (cardapio) {
            const produto = cardapio[lanche];
            if (produto) {
                const extrasNomes = Object.values(produto.complementos); // Obtém os nomes dos extras
                const nomeItem = produto.produto; // Obtém o nome do item do cardápio
                const nomeExtra = extrasNomes[indiceExtra - 1]; // Subtrai 1 para obter o índice correto
                if (nomeExtra) {
                    return { nomeExtra, nomeItem };
                } else {
                    throw new Error(`Extra no índice '${indiceExtra}' não encontrado no lanche ${lanche}.`);
                }
            } else {
                throw new Error("Lanche não encontrado: " + lanche);
            }
        } else {
            throw new Error("Erro ao ler o cardápio.");
        }
    } catch (error) {
        throw error;
    }
}
async function caldasAcai(lanches, indiceExtras) {
    const indiceExtra = indiceExtras;
    const lanche = lanches;
    try {
        const cardapio = await lerCardapio(caminhoArquivoAcai);
        if (cardapio) {
            const produto = cardapio[lanche];
            if (produto) {
                const caldas = produto.calda; // Obtém o array de caldas
                const nomeItem = produto.produto; // Obtém o nome do item do cardápio
                
                if (caldas && caldas.length > 0) {
                    const caldaEscolhida = caldas[indiceExtra - 1]; // Acessa a calda com base no índice fornecido

                    if (caldaEscolhida) {
                        return { nomeItem, caldaEscolhida }; // Retorna o nome do item e a calda escolhida
                    } else {
                        throw new Error(`Calda no índice '${indiceExtra}' não encontrada para o lanche ${nomeItem}.`);
                    }
                } else {
                    throw new Error(`Nenhuma calda disponível para o lanche ${nomeItem}.`);
                }
            } else {
                throw new Error("Lanche não encontrado: " + lanche);
            }
        } else {
            throw new Error("Erro ao ler o cardápio.");
        }
    } catch (error) {
        throw error;
    }
}



const emojisNumeros = [
    "1️⃣", "2️⃣", "3️⃣", "4️⃣", "5️⃣", 
    "6️⃣", "7️⃣", "8️⃣", "9️⃣", "🔟",
    "1️⃣1️⃣", "1️⃣2️⃣", "1️⃣3️⃣", "1️⃣4️⃣", "1️⃣5️⃣",
    "1️⃣6️⃣", "1️⃣7️⃣", "1️⃣8️⃣", "1️⃣9️⃣", "2️⃣0️⃣"
];

module.exports = {
    cardapioIndividual,
    opcoesAcai,
    caldasAcai,
    cardapioCompleto,
    cardapioExtras,
    valorExtraEspecifico,
    sandubaCompleto,
    nomeExtraEspecifico,
    pizzasCompleto1,
    pizzasCompleto2,
    cardapioIndividualPizza1,
    nomeExtraEspecificoAcai,
    nomeExtraEspecificoBatatas,
    nomeExtraEspecificBebidas,
    nomeExtraEspecificoPizza2,
    nomeExtraEspecificoPizza1,
    valorExtraEspecificoAcai,
    valorExtraEspecificoBatatas,
    valorExtraEspecificoBebidas,
    valorExtraEspecificoPizza2,
    valorExtraEspecificoPizza1,
    cardapioExtrasAcai,
    cardapioExtrasBatatas,
    cardapioExtrasBebidas,
    cardapioExtrasPizza2,
    cardapioExtrasPizza1,
    acaiCompleto,
    batatasCompleto,
    bebidasCompleto,
    cardapioCompletoAcai,
    cardapioCompletoBatatas,
    cardapioCompletoBebidas,
    cardapioCompletoPizzas2,
    cardapioCompletoPizzas1,
    cardapioIndividualAcai,
    cardapioIndividualBatatas,
    cardapioIndividualPizza2,
    cardapioIndividualBebidas,
    cardapioExtrasBurguer,
};